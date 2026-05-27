import { Ending, Character, REALMS } from '@/types/game';

// 结局系统 - 这是本游戏的独特之处
// 不像传统修仙小说只有"飞升"一个结局，这里有多种可能性
export const ENDINGS: Ending[] = [
  // === 超脱类结局 ===
  {
    id: 'ascension',
    name: '飞升成仙',
    desc: '历经千难万险，终渡天劫飞升仙界，成为真仙。但你可曾想过，仙界之上是否还有更高的存在？',
    type: 'transcendence',
    rarity: 'rare',
    condition: (c) => c.realm === 'immortal',
  },
  {
    id: 'dao_ancestor',
    name: '开宗立派',
    desc: '你没有选择飞升，而是在人间开创了自己的道统。千年之后，你的门派成为修仙界最强大的势力，而你被称为"道祖"。',
    type: 'transcendence',
    rarity: 'epic',
    condition: (c) => c.realm === 'deity_transformation' && c.stats.cultivation >= 5000 && c.companions.length >= 3,
  },

  // === 飞升变体结局 ===
  {
    id: 'rebel_immortal',
    name: '逆天改命',
    desc: '你飞升仙界后发现仙界的真相——仙人不过是更高存在的棋子。你选择反抗天道，成为第一个推翻仙界秩序的叛逆者。',
    type: 'immortality',
    rarity: 'legendary',
    condition: (c) => c.realm === 'immortal' && c.stats.ambition >= 150 && c.stats.darkArts >= 80 && c.flags['discovered_immortal_truth'],
  },
  {
    id: 'mortal_return',
    name: '返璞归真',
    desc: '修至化神巅峰，你突然顿悟——长生不过是执念。你散尽修为，重返凡尘，却发现凡间的生活比仙道更加自在。你的传说，在凡人中代代相传。',
    type: 'immortality',
    rarity: 'epic',
    condition: (c) => c.realm === 'deity_transformation' && c.stats.karma >= 100 && c.stats.endurance >= 120,
  },

  // === 沦落类结局 ===
  {
    id: 'demonic_path',
    name: '坠入魔道',
    desc: '修炼禁术走火入魔，你成为了修仙界人人喊杀的魔修。虽然实力通天，但永远孤独，永远被追杀。这，就是你的"长生"。',
    type: 'fall',
    rarity: 'rare',
    condition: (c) => c.stats.darkArts >= 100 && c.stats.karma <= -80 && c.enemies.length >= 5,
  },
  {
    id: 'soul_refined',
    name: '魂飞魄散',
    desc: '在一次渡劫中失败，你的元神被天雷击散。修仙千载，终成泡影。但你的残魂化为天地间一缕灵识，或许千年之后……',
    type: 'fall',
    rarity: 'common',
    condition: (c) => c.deathCount >= 3 && c.stats.cultivation < 500,
  },
  {
    id: 'puppet',
    name: '傀儡仙',
    desc: '你以为自己飞升了，但实际上你只是被上古大能操控的傀儡。你的一切成就，不过是他人的棋局。',
    type: 'fall',
    rarity: 'legendary',
    condition: (c) => c.realm === 'immortal' && c.flags['puppet_seed'] && !c.flags['broke_control'],
  },

  // === 轮回类结局 ===
  {
    id: 'reincarnation',
    name: '轮回转世',
    desc: '你选择了最古老的方法——兵解转世。带着前世记忆重新投胎，这一次，你将走一条完全不同的路。',
    type: 'reincarnation',
    rarity: 'rare',
    condition: (c) => c.realm === 'nascent_soul' && c.stats.karma >= 50 && c.flags['chose_reincarnation'],
  },
  {
    id: 'groundhog',
    name: '无尽轮回',
    desc: '你已经不知道这是第几次重新开始了。每一次死亡，每一次重生，你都在寻找那唯一的出路。也许……这一次？',
    type: 'reincarnation',
    rarity: 'epic',
    condition: (c) => c.deathCount >= 5,
  },

  // === 隐藏结局 ===
  {
    id: 'world_creator',
    name: '创世',
    desc: '你发现了一个惊天秘密——这个世界的天道不过是一段法阵。你篡改了法阵，成为了新的创世者。但当你成为"天道"后，你才理解前任天道的苦衷……',
    type: 'hidden',
    rarity: 'mythic',
    condition: (c) => c.realm === 'mahayana' && c.stats.formation >= 150 && c.flags['found_heavenly_array'] && c.flags['understood_dao'],
  },
  {
    id: 'beyond',
    name: '超脱',
    desc: '你既没有飞升，也没有入魔。你走出了第三条路——超脱于天道之外。你不是仙，不是魔，你是第一个不属于这个体系的存在。天道无法约束你，因为你已不在棋盘之上。',
    type: 'hidden',
    rarity: 'mythic',
    condition: (c) => c.realm === 'tribulation' && c.stats.karma === 0 && c.stats.darkArts === 0 && c.flags['saw_beyond'],
  },
  {
    id: 'observer',
    name: '旁观者',
    desc: '你始终没有真正踏入修仙的洪流。作为旁观者，你见证了一个又一个时代的兴衰。最终，你将这一切记录下来，成为了修仙界最伟大的史官。这，何尝不是一种"道"。',
    type: 'hidden',
    rarity: 'legendary',
    condition: (c) => c.realm === 'foundation' && c.stats.cultivation < 200 && c.age >= 200 && c.ageHistory.length >= 20,
  },

  // === 特殊结局 ===
  {
    id: 'love_supreme',
    name: '情道至尊',
    desc: '世人皆言修仙当断情绝欲，你偏不信。你以情入道，以爱证道，开创了前所未有的情修一脉。你的道侣与你携手飞升，成为修仙界最传奇的佳话。',
    type: 'special',
    rarity: 'epic',
    condition: (c) => c.realm === 'deity_transformation' && c.companions.some(comp => comp.relationship >= 90),
  },
  {
    id: 'merchant_king',
    name: '商道称尊',
    desc: '谁说修仙就必须打打杀杀？你以商入道，建立了横跨数个修仙国的商会帝国。修仙界的大半资源都经你之手，连元婴老怪都要给你三分薄面。金钱，就是最好的"道"。',
    type: 'special',
    rarity: 'epic',
    condition: (c) => c.stats.wealth >= 10000 && c.realm === 'core_formation' && c.background === 'merchant',
  },
  {
    id: 'alchemist_supreme',
    name: '丹道圣手',
    desc: '你将炼丹之术推至前无古人的境界，能炼出传说中的九转金丹。修仙界各方势力都对你礼敬三分，因为你手中的丹药，足以改变任何一个修士的命运。',
    type: 'special',
    rarity: 'rare',
    condition: (c) => c.stats.alchemy >= 150 && c.realm === 'nascent_soul',
  },
  {
    id: 'nobody',
    name: '芸芸众生',
    desc: '你终其一生也没能突破筑基。在修仙界中，你是最普通不过的练气期修士。但你活得平静，死得安详。也许，这就是最好的结局。',
    type: 'special',
    rarity: 'common',
    condition: (c) => c.age >= 100 && c.realm === 'qi_refining' && c.stats.karma >= 30,
  },
];

export function checkEnding(character: Character): Ending | null {
  // 先检查稀有结局，再检查普通结局
  const sorted = [...ENDINGS].sort((a, b) => {
    const rarityOrder = { mythic: 0, legendary: 1, epic: 2, rare: 3, common: 4 };
    return rarityOrder[a.rarity] - rarityOrder[b.rarity];
  });

  for (const ending of sorted) {
    if (ending.condition(character)) {
      return ending;
    }
  }
  return null;
}
