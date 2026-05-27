// 修仙境界体系 - 参考《凡人修仙传》但加入独特变体
export const REALMS = [
  { id: 'mortal', name: '凡人', desc: '尚未踏入修仙之门的普通凡人', lifespan: 80, powerBase: 0 },
  { id: 'qi_refining', name: '练气期', desc: '感应天地灵气，引气入体', lifespan: 150, powerBase: 10 },
  { id: 'foundation', name: '筑基期', desc: '筑就道基，灵力凝实', lifespan: 300, powerBase: 50 },
  { id: 'core_formation', name: '结丹期', desc: '凝聚金丹，实力飞跃', lifespan: 500, powerBase: 200 },
  { id: 'nascent_soul', name: '元婴期', desc: '元婴出窍，神通初显', lifespan: 1000, powerBase: 800 },
  { id: 'deity_transformation', name: '化神期', desc: '化神入道，掌控一方', lifespan: 2000, powerBase: 3000 },
  { id: 'void_refining', name: '炼虚期', desc: '炼虚合道，超脱凡俗', lifespan: 5000, powerBase: 10000 },
  { id: 'body_integration', name: '合体期', desc: '天人合一，道法自然', lifespan: 10000, powerBase: 30000 },
  { id: 'mahayana', name: '大乘期', desc: '大乘圆满，半步飞升', lifespan: 50000, powerBase: 100000 },
  { id: 'tribulation', name: '渡劫期', desc: '渡天劫而成仙', lifespan: 100000, powerBase: 500000 },
  { id: 'immortal', name: '真仙', desc: '飞升仙界，超脱轮回', lifespan: Infinity, powerBase: 9999999 },
] as const;

export type RealmId = typeof REALMS[number]['id'];

// 角色灵根类型 - 颠覆传统设定
export const SPIRITUAL_ROOTS = [
  { id: 'gold', name: '金灵根', desc: '刚猛凌厉，善攻伐之术', element: '金', bonus: { attack: 1.3, defense: 0.8 } },
  { id: 'wood', name: '木灵根', desc: '生生不息，善炼丹医术', element: '木', bonus: { alchemy: 1.5, attack: 0.7 } },
  { id: 'water', name: '水灵根', desc: '灵活多变，善阵法符箓', element: '水', bonus: { formation: 1.4, speed: 1.2 } },
  { id: 'fire', name: '火灵根', desc: '暴烈霸道，善炼器攻伐', element: '火', bonus: { crafting: 1.4, attack: 1.2 } },
  { id: 'earth', name: '土灵根', desc: '厚重坚固，善防御守护', element: '土', bonus: { defense: 1.5, speed: 0.7 } },
  { id: 'chaos', name: '混沌灵根', desc: '五行皆杂，修炼极慢但潜力无穷', element: '混沌', bonus: { attack: 0.6, potential: 2.0 } },
  { id: 'heavenly', name: '天灵根', desc: '单属性极致，修炼飞速但易遭天妒', element: '天', bonus: { cultivation: 2.0, tribulation: 1.5 } },
  { id: 'variant_yin', name: '异变阴灵根', desc: '修炼阴寒功法，走旁门左道', element: '阴', bonus: { darkArts: 1.8, karma: -0.5 } },
] as const;

export type SpiritualRootId = typeof SPIRITUAL_ROOTS[number]['id'];

// 角色出身背景
export const BACKGROUNDS = [
  { id: 'peasant', name: '山村少年', desc: '出身贫寒，心性坚韧', bonus: { endurance: 1.3, luck: 0.8 } },
  { id: 'merchant', name: '商贾之子', desc: '家资丰厚，善于经营', bonus: { wealth: 2.0, endurance: 0.7 } },
  { id: 'scholar', name: '书香门第', desc: '博学多识，悟性极高', bonus: { comprehension: 1.5, attack: 0.7 } },
  { id: 'orphan', name: '孤儿浪子', desc: '无依无靠，但命硬如铁', bonus: { luck: 1.5, wealth: 0.5 } },
  { id: 'noble', name: '修仙世家', desc: '祖上有修仙者，根基深厚', bonus: { cultivation: 1.3, comprehension: 1.2 } },
  { id: 'fallen', name: '落魄王孙', desc: '曾为贵族，今已没落，心有不甘', bonus: { ambition: 1.8, karma: -0.3 } },
] as const;

export type BackgroundId = typeof BACKGROUNDS[number]['id'];

// 角色属性
export interface CharacterStats {
  cultivation: number;      // 修为
  comprehension: number;    // 悟性
  luck: number;             // 机缘
  karma: number;            // 因果/善恶
  attack: number;           // 攻击
  defense: number;          // 防御
  speed: number;            // 速度
  alchemy: number;          // 炼丹
  crafting: number;         // 炼器
  formation: number;        // 阵法
  endurance: number;        // 心性/坚韧
  wealth: number;           // 身家
  darkArts: number;         // 邪术
  ambition: number;         // 野心
  potential: number;        // 潜力
  tribulation: number;      // 天劫难度系数
}

// 角色完整信息
export interface Character {
  name: string;
  spiritualRoot: SpiritualRootId;
  background: BackgroundId;
  realm: RealmId;
  age: number;
  stats: CharacterStats;
  hp: number;
  maxHp: number;
  techniques: Technique[];
  items: Item[];
  companions: Companion[];
  enemies: string[];
  achievements: Achievement[];
  flags: Record<string, boolean>;
  deathCount: number;
  ageHistory: string[];
}

// 功法
export interface Technique {
  id: string;
  name: string;
  desc: string;
  level: number;
  type: 'internal' | 'combat' | 'auxiliary' | 'forbidden';
  element: string;
}

// 物品
export interface Item {
  id: string;
  name: string;
  desc: string;
  type: 'weapon' | 'armor' | 'pill' | 'material' | 'talisman' | 'special';
  grade: number;
  quantity: number;
  used?: boolean;
}

// 同伴
export interface Companion {
  id: string;
  name: string;
  desc: string;
  relationship: number;
  realm: RealmId;
}

// 成就
export interface Achievement {
  id: string;
  name: string;
  desc: string;
  icon: string;
  unlockedAt: number;
  isSecret: boolean;
}

// NPC - 故事中出现的命名角色
export interface NPC {
  id: string;
  name: string;
  desc: string;
  role: string;             // mentor/rival/ally/mysterious_stranger/merchant/enemy等
  status: 'active' | 'missing' | 'dead' | 'departed';
  relationship: number;     // -100 到 100
  realm: RealmId;
  lastSeenAge: number;      // 上次遇见时角色年龄
  context: string;          // 上次交互简述
}

// 剧情线 - 追踪未解决的故事线索
export interface PlotThread {
  id: string;
  title: string;
  desc: string;
  introducedAge: number;
  lastAdvancedAge: number;
  status: 'active' | 'resolved' | 'abandoned';
  priority: number;         // 1-5，影响 LLM 提示优先级
  relatedNPCs: string[];    // 相关 NPC 的 id
}

// 紧凑的故事历史（给 LLM 上下文用）
export interface StoryHistoryEntry {
  chapterIndex: number;
  content: string;          // 截断200字
  choiceText: string;       // 玩家选择
  consequence?: string;     // 后果叙述
}

// 故事章节
export interface StoryChapter {
  id: string;
  content: string;
  choices: StoryChoice[];
  consequence?: string;     // 上次选择的后果文字
  type: 'choice' | 'narrative';
  narrativeType?: 'environment' | 'character_intro' | 'group_psychology' | 'time_skip' | 'world_event';
  npcs?: NPC[];
  plotThreads?: PlotThread[];
  autoConsequence?: {       // 叙事章节的自动后果（点击"继续"时应用）
    stats?: Partial<CharacterStats>;
    flags?: Record<string, boolean>;
    ageAdvance?: number;
    hp?: number;
    items?: Item[];
    techniques?: Technique[];
    companions?: Companion[];
    enemies?: string[];
  };
}

export interface StoryChoice {
  id: string;
  text: string;
  requirements?: ChoiceRequirement[];
  consequence: {
    stats?: Partial<CharacterStats>;
    realm?: RealmId;
    hp?: number;
    items?: Item[];
    techniques?: Technique[];
    companions?: Companion[];
    enemies?: string[];
    flags?: Record<string, boolean>;
    ageAdvance?: number;
    deathRisk?: number;
    karmaChange?: number;
    narration?: string;     // 选择后的即时后果描述
  };
}

export interface ChoiceRequirement {
  stat: keyof CharacterStats;
  min?: number;
  max?: number;
  realm?: RealmId;
  flag?: string;
}

// 结局类型
export interface Ending {
  id: string;
  name: string;
  desc: string;
  type: 'transcendence' | 'immortality' | 'fall' | 'reincarnation' | 'hidden' | 'special';
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';
  condition: (char: Character) => boolean;
}

// 游戏状态
export interface GameState {
  character: Character;
  currentChapter: StoryChapter | null;
  chapterIndex: number;
  isGameOver: boolean;
  ending: Ending | null;
  storyLog: StoryChapter[];
  npcs: NPC[];
  plotThreads: PlotThread[];
  storyHistory: StoryHistoryEntry[];
  lastNarration?: string;
}
