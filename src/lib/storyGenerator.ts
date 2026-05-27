import { Character, StoryChapter, StoryChoice, StoryHistoryEntry, NPC, PlotThread, REALMS } from '@/types/game';
import { getRealmData } from './gameEngine';

// LLM 故事生成的 Prompt 模板
export function buildStoryPrompt(
  character: Character,
  previousChoice?: string,
  storyHistory?: StoryHistoryEntry[],
  npcs?: NPC[],
  plotThreads?: PlotThread[],
): string {
  const realm = getRealmData(character.realm);

  // 近期经历
  const historyText = (storyHistory || []).slice(-5).map(h =>
    `· ${h.content.slice(0, 60)}... → 选择了"${h.choiceText}"${h.consequence ? ' → ' + h.consequence : ''}`
  ).join('\n') || '无';

  // 相关人物
  const npcText = (npcs || []).filter(n => n.status === 'active').slice(-8).map(n => {
    const npcRealm = getRealmData(n.realm);
    const realmName = npcRealm ? npcRealm.name : '未知';
    return `· ${n.name}（${n.role}，${n.relationship > 0 ? '友好' : n.relationship < 0 ? '敌对' : '中立'}，${realmName}，${n.context}）`;
  }).join('\n') || '无';

  // 未解之谜
  const threadText = (plotThreads || []).filter(t => t.status === 'active').slice(-5).map(t =>
    `· ${t.title}：${t.desc.slice(0, 40)}...`
  ).join('\n') || '无';

  return `你是一个修仙世界的故事讲述者，参考《凡人修仙传》的风格，但要有独特的套路和意想不到的转折。

当前角色信息：
- 姓名：${character.name}
- 境界：${realm.name} - ${realm.desc}
- 年龄：${character.age}岁
- 灵根：${character.spiritualRoot}
- 出身：${character.background}
- 主要属性：修为${character.stats.cultivation}，悟性${character.stats.comprehension}，运气${character.stats.luck}，因果${character.stats.karma}
- 功法：${character.techniques.map(t => t.name).join('、') || '无'}
- 法宝：${character.items.map(i => i.name).join('、') || '无'}
- 道侣/同伴：${character.companions.map(c => c.name).join('、') || '无'}
- 仇敌：${character.enemies.join('、') || '无'}
- 重要标记：${Object.entries(character.flags).filter(([_,v]) => v).map(([k]) => k).join('、') || '无'}

近期经历：
${historyText}

相关人物：
${npcText}

未解之谜：
${threadText}

${previousChoice ? `上次选择：${previousChoice}` : ''}

请生成一段修仙故事（150-300字），要求：
1. 文笔古风，有修仙小说的韵味
2. 剧情要有意想不到的转折，不要俗套
3. 根据角色当前境界和属性，安排合理的际遇或危机
4. 偶尔颠覆修仙小说的传统套路（比如：秘境未必有宝、前辈未必好心、天劫未必是劫）
5. 故事要有留白，给选择留空间
6. 基于近期经历、相关人物和未解之谜来推进剧情。如果有人物或故事线索在，尽量在新的章节中呼应或推进它们。不要凭空引入与已有人物矛盾的新角色

重要：约30-40%的概率生成"叙事章节"（纯描写无选择），包括：
- 环境描写（山川秘境、坊市风貌、宗门景象）
- 人物介绍（NPC的外貌、来历、性格、暗藏心思）
- 群像心理（其他修士的议论、暗流涌动、各怀鬼胎）
- 时间跳跃（闭关数年、赶路途中、时局变化）
- 世界事件（某宗门覆灭、秘境出世、天象异变）

叙事章节可以带有轻量的属性后果（如闭关增加修为），但没有选择。

然后提供2-4个选择（叙事章节choices为空数组），每个选择要有：
- 选项文字（简短有特色）
- 对属性的影响

请严格按以下JSON格式返回。重要规则：
1. 只返回JSON，不要有任何其他文字、解释、注释或markdown标记
2. 不要用三个反引号包裹JSON
3. 确保JSON格式完全合法：字符串中的引号必须转义，不要有尾逗号，不要有注释
4. content字段中的引号用反斜杠转义，换行用\\n

选择章节示例：
{
  "type": "choice",
  "content": "故事内容",
  "choices": [
    {
      "id": "choice_1",
      "text": "选项文字",
      "consequence": {
        "stats": {"cultivation": 10, "karma": -5},
        "ageAdvance": 3,
        "karmaChange": -5,
        "deathRisk": 0,
        "flags": {},
        "narration": "选择后的简短后果描述",
        "items": [],
        "techniques": [],
        "companions": [],
        "enemies": []
      }
    }
  ],
  "npcs": [{"id": "npc_1", "name": "陈老", "desc": "隐居前辈", "role": "mentor", "status": "active", "relationship": 40, "realm": "core_formation", "lastSeenAge": ${character.age}, "context": "赠予功法"}],
  "plotThreads": [{"id": "thread_1", "title": "陈老的真实身份", "desc": "他似乎认识你的前世", "status": "active", "priority": 3, "relatedNPCs": ["npc_1"], "introducedAge": ${character.age}, "lastAdvancedAge": ${character.age}}]
}

叙事章节示例：
{
  "type": "narrative",
  "narrativeType": "character_intro",
  "content": "（纯描写内容，如环境、人物、群像等）",
  "choices": [],
  "autoConsequence": {"stats": {"cultivation": 5}, "ageAdvance": 1},
  "npcs": [],
  "plotThreads": []
}`;
}

export function parseStoryResponse(raw: string): StoryChapter | null {
  try {
    // response_format: json_object 保证返回合法JSON，但以防万一还是做基本清理
    let jsonStr = raw.trim();

    // 如果有 markdown 包裹则去除
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
    }

    // 基本清理：移除注释和尾逗号
    jsonStr = jsonStr.replace(/\/\/[^\n]*/g, '');
    jsonStr = jsonStr.replace(/\/\*[\s\S]*?\*\//g, '');
    jsonStr = jsonStr.replace(/,\s*([}\]])/g, '$1');

    let parsed: any;
    try {
      parsed = JSON.parse(jsonStr);
    } catch {
      // 最后尝试提取最外层 JSON 对象
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return null;
      try {
        parsed = JSON.parse(jsonMatch[0].replace(/,\s*([}\]])/g, '$1'));
      } catch {
        console.error('JSON parse failed, raw (first 300):', raw.slice(0, 300));
        return null;
      }
    }

    const chapterType = parsed.type === 'narrative' ? 'narrative' : 'choice';
    const narrativeType = parsed.narrativeType as StoryChapter['narrativeType'];

    const choices: StoryChoice[] = (parsed.choices || []).map((c: any, i: number) => ({
      id: c.id || `choice_${i + 1}`,
      text: c.text,
      consequence: {
        stats: c.consequence?.stats || {},
        ageAdvance: c.consequence?.ageAdvance || 1,
        karmaChange: c.consequence?.karmaChange || 0,
        deathRisk: c.consequence?.deathRisk || 0,
        flags: c.consequence?.flags || {},
        narration: c.consequence?.narration || undefined,
        items: c.consequence?.items || undefined,
        techniques: c.consequence?.techniques || undefined,
        companions: c.consequence?.companions || undefined,
        enemies: c.consequence?.enemies || undefined,
        hp: c.consequence?.hp || undefined,
        realm: c.consequence?.realm || undefined,
      },
    }));

    // 解析 NPC
    const npcs: NPC[] = (parsed.npcs || []).map((n: any): NPC => ({
      id: n.id || `npc_${Date.now()}`,
      name: n.name || '无名修士',
      desc: n.desc || '',
      role: n.role || 'stranger',
      status: n.status || 'active',
      relationship: typeof n.relationship === 'number' ? n.relationship : 0,
      realm: n.realm || 'qi_refining',
      lastSeenAge: n.lastSeenAge || 0,
      context: n.context || '',
    }));

    // 解析剧情线
    const plotThreads: PlotThread[] = (parsed.plotThreads || []).map((t: any): PlotThread => ({
      id: t.id || `thread_${Date.now()}`,
      title: t.title || '未知线索',
      desc: t.desc || '',
      introducedAge: t.introducedAge || 0,
      lastAdvancedAge: t.lastAdvancedAge || 0,
      status: t.status || 'active',
      priority: t.priority || 3,
      relatedNPCs: t.relatedNPCs || [],
    }));

    // 解析叙事章节的自动后果
    let autoConsequence: StoryChapter['autoConsequence'] = undefined;
    if (chapterType === 'narrative' && parsed.autoConsequence) {
      const ac = parsed.autoConsequence;
      autoConsequence = {
        stats: ac.stats || undefined,
        flags: ac.flags || undefined,
        ageAdvance: ac.ageAdvance || 1,
        hp: ac.hp || undefined,
        items: ac.items || undefined,
        techniques: ac.techniques || undefined,
        companions: ac.companions || undefined,
        enemies: ac.enemies || undefined,
      };
    }

    return {
      id: `chapter_${Date.now()}`,
      content: parsed.content || '',
      choices,
      type: chapterType,
      narrativeType,
      npcs,
      plotThreads,
      autoConsequence,
    };
  } catch (e) {
    console.error('Failed to parse story response:', e);
    return null;
  }
}

// 当 LLM 不可用时的备用故事生成
export function generateFallbackStory(character: Character): StoryChapter {
  const t = Date.now();
  const tier = getRealmTier(character.realm);
  const name = character.name;

  // 选择型故事
  const choiceStories = getChoiceStories(name, t, tier);
  // 叙事型故事
  const narrativeStories = getNarrativeStories(name, t, tier);

  // 30% 概率返回叙事章节
  if (Math.random() < 0.3 && narrativeStories.length > 0) {
    return narrativeStories[Math.floor(Math.random() * narrativeStories.length)];
  }

  return choiceStories[Math.floor(Math.random() * choiceStories.length)];
}

type RealmTier = 'low' | 'mid' | 'high' | 'peak';

function getRealmTier(realm: string): RealmTier {
  const low = ['mortal', 'qi_refining', 'foundation'];
  const mid = ['core_formation', 'nascent_soul'];
  const high = ['deity_transformation', 'void_refining', 'body_integration'];
  if (low.includes(realm)) return 'low';
  if (mid.includes(realm)) return 'mid';
  if (high.includes(realm)) return 'high';
  return 'peak';
}

function getChoiceStories(name: string, t: number, tier: RealmTier): StoryChapter[] {
  // 通用故事（所有阶段可用）
  const universal: StoryChapter[] = [
    {
      id: `fb_${t}_c1`, type: 'choice',
      content: `${name}行至一处荒凉山谷，忽见前方灵气涌动，一座古朴洞府若隐若现。洞口刻有上古符文，似乎已有万年无人踏足。正欲靠近，脚下一块石板突然陷落，露出一条幽深的地道——这洞府之下，竟然还藏着更深的秘密。`,
      choices: [
        { id: 'enter_cave', text: '踏入洞府探秘', consequence: { stats: { cultivation: 15, luck: -5 }, ageAdvance: 2, karmaChange: 0, deathRisk: 0.1, flags: { explored_cave: true } } },
        { id: 'enter_tunnel', text: '顺着地道深入', consequence: { stats: { cultivation: 25, endurance: 10 }, ageAdvance: 3, karmaChange: -5, deathRisk: 0.25, flags: { underground_path: true } } },
        { id: 'observe_first', text: '在洞口布下阵法观察', consequence: { stats: { formation: 10, comprehension: 5 }, ageAdvance: 1, karmaChange: 5, deathRisk: 0, flags: { cautious_explorer: true } } },
      ],
      npcs: [{ id: 'cave_spirit', name: '洞府残灵', desc: '洞府中残留的一道灵识', role: 'mysterious', status: 'active', relationship: 0, realm: 'foundation', lastSeenAge: 16, context: '初次在荒谷洞府中相遇' }],
    },
    {
      id: `fb_${t}_c2`, type: 'choice',
      content: `一位衣衫褴褛的老者拦住${name}去路，自称是落难的修士，愿以一本上古功法换取盘缠。老者目光闪烁，功法玉简上隐隐有血色纹路。直觉告诉你，此人绝非表面那般简单。`,
      choices: [
        { id: 'buy_technique', text: '买下功法', consequence: { stats: { cultivation: 20, darkArts: 15, wealth: -200 }, ageAdvance: 1, karmaChange: -10, deathRisk: 0.05, flags: { bought_blood_technique: true }, techniques: [{ id: 'blood_art', name: '血灵诀', desc: '以血为引的禁忌功法', level: 1, type: 'forbidden', element: '血' }] } },
        { id: 'help_elder', text: '不取功法，但助老者疗伤', consequence: { stats: { karma: 20, endurance: 5 }, ageAdvance: 1, karmaChange: 20, deathRisk: 0, flags: { helped_stranger: true } } },
        { id: 'interrogate', text: '盘问老者真实身份', consequence: { stats: { comprehension: 10, attack: 5 }, ageAdvance: 1, karmaChange: -5, deathRisk: 0.1, flags: { interrogated_elder: true } } },
        { id: 'walk_away', text: '果断离开，不沾因果', consequence: { stats: { endurance: 5 }, ageAdvance: 0, karmaChange: 0, deathRisk: 0 } },
      ],
      npcs: [{ id: 'beggar_elder', name: '落难老者', desc: '自称落难修士，实为神秘人物', role: 'mysterious_stranger', status: 'active', relationship: 0, realm: 'core_formation', lastSeenAge: 16, context: '以血色功法换取盘缠' }],
    },
    {
      id: `fb_${t}_c3`, type: 'choice',
      content: `${name}修炼时忽觉灵台清明，竟在冥冥中窥见一丝天道之痕。那是一个模糊的景象——整个修仙界如同一座巨大的法阵，而所有修士不过是阵中的灵力节点。这究竟是悟道还是走火入魔？`,
      choices: [
        { id: 'pursue_truth', text: '追寻这个真相', consequence: { stats: { comprehension: 20, cultivation: -10 }, ageAdvance: 2, karmaChange: 0, deathRisk: 0.15, flags: { saw_beyond: true, found_heavenly_array: true } } },
        { id: 'suppress_vision', text: '压制异象，稳守道心', consequence: { stats: { endurance: 15, cultivation: 10 }, ageAdvance: 1, karmaChange: 5, deathRisk: 0 } },
        { id: 'share_discovery', text: '告知师长此番异象', consequence: { stats: { comprehension: 10, luck: 5 }, ageAdvance: 1, karmaChange: 10, deathRisk: 0.05, flags: { shared_vision: true } } },
      ],
      plotThreads: [{ id: 'heavenly_array', title: '天道法阵之谜', desc: '修仙界似乎是一座巨大的法阵，所有修士不过是节点', status: 'active', priority: 4, relatedNPCs: [], introducedAge: 16, lastAdvancedAge: 16 }],
    },
  ];

  // 境界特定故事
  const tierStories: Record<RealmTier, StoryChapter[]> = {
    low: [
      {
        id: `fb_${t}_low1`, type: 'choice',
        content: `${name}在坊市中听闻一处秘境即将开启，据说是上古修士的遗迹，内有无数宝物。但传闻中进入此秘境的修士十之八九未能生还——而那些活着出来的人，绝口不提里面发生了什么。`,
        choices: [
          { id: 'enter_secret_realm', text: '闯入秘境', consequence: { stats: { cultivation: 30, luck: -10 }, ageAdvance: 5, karmaChange: 0, deathRisk: 0.3, flags: { entered_realm: true } } },
          { id: 'gather_info', text: '先调查那些生还者', consequence: { stats: { comprehension: 15, luck: 5 }, ageAdvance: 2, karmaChange: 5, deathRisk: 0, flags: { investigated_survivors: true } } },
          { id: 'ambush_exiter', text: '在秘境出口设伏', consequence: { stats: { wealth: 500, attack: 10 }, ageAdvance: 3, karmaChange: -30, deathRisk: 0.15, flags: { ambushed_exiter: true } } },
        ],
      },
      {
        id: `fb_${t}_low2`, type: 'choice',
        content: `月黑风高之夜，${name}感知到一股异样的灵力波动。循迹而去，竟见两名蒙面修士正在密谋——他们要暗害本地的散修盟主！而更令你震惊的是，其中一人的声音，分明是你曾信任的同门师兄。`,
        choices: [
          { id: 'expose_plot', text: '当众揭穿阴谋', consequence: { stats: { karma: 15, attack: 5 }, ageAdvance: 1, karmaChange: 15, deathRisk: 0.2, flags: { exposed_conspiracy: true }, enemies: ['叛门师兄'] } },
          { id: 'secretly_join', text: '暗中加入，分一杯羹', consequence: { stats: { wealth: 300, darkArts: 10 }, ageAdvance: 1, karmaChange: -25, deathRisk: 0.05, flags: { joined_conspiracy: true } } },
          { id: 'warn_target', text: '暗中通知盟主', consequence: { stats: { karma: 10, luck: 5 }, ageAdvance: 1, karmaChange: 10, deathRisk: 0.1, flags: { warned_target: true } } },
        ],
        npcs: [{ id: 'senior_brother', name: '叛门师兄', desc: '曾信任的同门，如今与暗势力勾结', role: 'rival', status: 'active', relationship: -30, realm: 'foundation', lastSeenAge: 16, context: '密谋暗害散修盟主' }],
      },
    ],
    mid: [
      {
        id: `fb_${t}_mid1`, type: 'choice',
        content: `坊市中一位丹师正在拍卖九转回灵丹，此丹据说能起死回生。然而${name}注意到丹药上的灵纹似乎有细微的不对——这丹药……是假的？还是另有玄机？丹师笑容满面，叫价声此起彼伏。`,
        choices: [
          { id: 'expose_fake', text: '当众揭穿丹药有问题', consequence: { stats: { alchemy: 15, karma: 10 }, ageAdvance: 1, karmaChange: 10, deathRisk: 0.1, flags: { exposed_fake_pill: true }, enemies: ['丹师魏某'] } },
          { id: 'buy_silently', text: '暗中买下，回去研究', consequence: { stats: { alchemy: 10, wealth: -500 }, ageAdvance: 1, karmaChange: 0, deathRisk: 0, flags: { bought_suspicious_pill: true } } },
          { id: 'blackmail', text: '私下要挟丹师', consequence: { stats: { wealth: 800, darkArts: 10 }, ageAdvance: 1, karmaChange: -20, deathRisk: 0.05, flags: { blackmailed_alchemist: true } } },
        ],
        npcs: [{ id: 'alchemist_wei', name: '丹师魏某', desc: '坊市中的知名丹师，所售丹药有蹊跷', role: 'merchant', status: 'active', relationship: 0, realm: 'core_formation', lastSeenAge: 16, context: '拍卖可疑的九转回灵丹' }],
      },
      {
        id: `fb_${t}_mid2`, type: 'choice',
        content: `一场突如其来的天劫在${name}头顶凝聚。奇怪的是，这并非你突破所引之劫——而是天道无端降下的罚雷。周围的修士纷纷躲避，有人窃窃私语："此人定是触犯了天条。"但你心中清楚，自己并未行任何逆天之事。`,
        choices: [
          { id: 'face_tribulation', text: '硬抗天劫', consequence: { stats: { cultivation: 40, endurance: 20, defense: 10 }, ageAdvance: 1, karmaChange: 0, deathRisk: 0.4, flags: { survived_false_tribulation: true } } },
          { id: 'flee_tribulation', text: '施展遁术逃离', consequence: { stats: { speed: 10, luck: -10 }, ageAdvance: 1, karmaChange: -5, deathRisk: 0.1, flags: { fled_tribulation: true } } },
          { id: 'investigate_source', text: '寻找天劫的真正源头', consequence: { stats: { comprehension: 20, cultivation: 10 }, ageAdvance: 2, karmaChange: 5, deathRisk: 0.2, flags: { investigated_tribulation: true } } },
        ],
      },
    ],
    high: [
      {
        id: `fb_${t}_high1`, type: 'choice',
        content: `${name}在一本残破的古籍中发现了一个惊人的记载：所谓的"飞升"，不过是更高一层的修士设下的圈套——他们需要下界修士飞升来补充自身的灵力。若此言为真，那千万年来飞升的前辈们……岂非都成了他人的养料？`,
        choices: [
          { id: 'believe_and_spread', text: '相信并传播这个真相', consequence: { stats: { comprehension: 10, karma: -20 }, ageAdvance: 2, karmaChange: -15, deathRisk: 0.2, flags: { discovered_immortal_truth: true, puppet_seed: true } } },
          { id: 'verify_first', text: '设法验证真伪', consequence: { stats: { comprehension: 20, cultivation: 5 }, ageAdvance: 3, karmaChange: 5, deathRisk: 0.1, flags: { verifying_immortal_truth: true } } },
          { id: 'seek_benefit', text: '利用这个秘密为自己谋利', consequence: { stats: { darkArts: 20, ambition: 20 }, ageAdvance: 2, karmaChange: -30, deathRisk: 0.15, flags: { exploited_truth: true } } },
        ],
        plotThreads: [{ id: 'immortal_truth', title: '飞升的真相', desc: '飞升可能是上层修士设下的圈套，飞升者成为养料', status: 'active', priority: 5, relatedNPCs: [], introducedAge: 16, lastAdvancedAge: 16 }],
      },
    ],
    peak: [
      {
        id: `fb_${t}_peak1`, type: 'choice',
        content: `天道对你的关注越来越强烈。${name}在修行中不断感受到一种审视——仿佛有一双无形的眼睛在注视着你的一举一动。你隐约感觉到，只要再往前一步，就能窥见这个世界最深层的秘密。但那一步，可能是超脱，也可能是毁灭。`,
        choices: [
          { id: 'challenge_heaven', text: '挑战天道', consequence: { stats: { cultivation: 50, ambition: 30 }, ageAdvance: 3, karmaChange: -20, deathRisk: 0.5, flags: { challenged_heaven: true } } },
          { id: 'merge_with_dao', text: '尝试与天道融合', consequence: { stats: { comprehension: 30, cultivation: 30 }, ageAdvance: 2, karmaChange: 10, deathRisk: 0.3, flags: { merged_with_dao: true } } },
          { id: 'escape_system', text: '寻找跳出体系的方法', consequence: { stats: { comprehension: 40, luck: 20 }, ageAdvance: 5, karmaChange: 0, deathRisk: 0.2, flags: { seeking_escape: true } } },
        ],
        plotThreads: [{ id: 'beyond_system', title: '超脱之路', desc: '跳出天道体系，成为不属于这个规则的存在', status: 'active', priority: 5, relatedNPCs: [], introducedAge: 16, lastAdvancedAge: 16 }],
      },
    ],
  };

  const tierPool = tierStories[tier] || tierStories.low;
  return [...universal, ...tierPool];
}

function getNarrativeStories(name: string, t: number, tier: RealmTier): StoryChapter[] {
  const allNarratives: StoryChapter[] = [
    // 环境描写
    {
      id: `fb_${t}_n1`, type: 'narrative', narrativeType: 'environment',
      content: `晨曦破晓，${name}立于山巅远望。脚下的云海翻涌如潮，灵气在山间凝聚成丝丝白雾，偶尔可见远处有修士驾驭遁光划过天际。这片修仙大陆广袤无垠，不知有多少机缘与凶险藏在那些云雾之后。一阵山风吹来，带着若有若无的丹香——这附近，必有炼丹之所。`,
      choices: [],
      autoConsequence: { stats: { comprehension: 3 }, ageAdvance: 0 },
    },
    // 人物介绍
    {
      id: `fb_${t}_n2`, type: 'narrative', narrativeType: 'character_intro',
      content: `坊市角落的茶楼里，一个看似普通的灰衣修士独坐窗边。他面容平淡，气息内敛至极，若非${name}偶尔感知到一丝不寻常的灵力波动，几乎会将他当作寻常路人。灰衣修士似乎察觉到了你的目光，微微抬头，嘴角露出一丝意味深长的笑意，随即低头继续品茶。此人……绝非表面那般简单。`,
      choices: [],
      npcs: [{ id: 'grey_cultivator', name: '灰衣修士', desc: '坊市茶楼中气息内敛的神秘修士', role: 'mysterious_stranger', status: 'active', relationship: 0, realm: 'nascent_soul', lastSeenAge: 16, context: '在坊市茶楼中偶尔对视' }],
    },
    // 群像心理
    {
      id: `fb_${t}_n3`, type: 'narrative', narrativeType: 'group_psychology',
      content: `坊市的修士们近来人心惶惶。几日前，一位结丹期修士在城外无故陨落，连元神都没能逃出。茶楼里、坊市间，修士们压低声音议论纷纷——有人说是魔修所为，有人说是天道示警，更有人说……那位修士发现了不该发现的东西。每个人脸上都写满了不安，而暗处，似乎有更多双眼睛在窥伺。`,
      choices: [],
      autoConsequence: { stats: { comprehension: 5 }, ageAdvance: 0 },
      plotThreads: [{ id: 'mysterious_death', title: '修士离奇陨落', desc: '结丹期修士在城外无故陨落，元神消散', status: 'active', priority: 3, relatedNPCs: [], introducedAge: 16, lastAdvancedAge: 16 }],
    },
    // 时间跳跃
    {
      id: `fb_${t}_n4`, type: 'narrative', narrativeType: 'time_skip',
      content: `${name}在洞府中闭关修炼，日复一日，寒来暑往。外界风云变幻——有宗门兴衰，有修士成败，有秘境开闭——而这一切与闭关中的你无关。当你终于睁开双眼时，洞口的藤蔓已爬满了石壁，外界的灵气似乎比入关前更加浓郁了。这一闭关，不知不觉已过了数载。`,
      choices: [],
      autoConsequence: { stats: { cultivation: 20, endurance: 5 }, ageAdvance: 3 },
    },
    // 世界事件
    {
      id: `fb_${t}_n5`, type: 'narrative', narrativeType: 'world_event',
      content: `天际忽现异象——九道紫色雷柱从虚空中劈下，在大地上留下数里长的焦痕。修仙界为之震动：这是"紫霄天劫"的征兆，意味着有人即将渡劫飞升。但更令人不安的是，那九道雷柱并未落在任何修士头上，而是无的放矢地轰在了荒野之中。这种前所未有的异象，让所有修士都隐隐感到——天道，似乎出了什么问题。`,
      choices: [],
      autoConsequence: { stats: { comprehension: 5 }, ageAdvance: 0 },
      plotThreads: [{ id: 'heaven_anomaly', title: '天道异变', desc: '紫霄天劫无故降下，天道似乎出了问题', status: 'active', priority: 4, relatedNPCs: [], introducedAge: 16, lastAdvancedAge: 16 }],
    },
  ];

  return allNarratives;
}
