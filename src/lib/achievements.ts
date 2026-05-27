import { Achievement, Character } from '@/types/game';

export const ALL_ACHIEVEMENTS: Achievement[] = [
  { id: 'first_step', name: '初入仙门', desc: '踏入修仙之路', icon: '🏔️', unlockedAt: 0, isSecret: false },
  { id: 'qi_refined', name: '引气入体', desc: '突破至练气期', icon: '💨', unlockedAt: 0, isSecret: false },
  { id: 'foundation_set', name: '筑基成道', desc: '突破至筑基期', icon: '🏛️', unlockedAt: 0, isSecret: false },
  { id: 'golden_core', name: '金丹大成', desc: '突破至结丹期', icon: '🔮', unlockedAt: 0, isSecret: false },
  { id: 'nascent_born', name: '元婴出窍', desc: '突破至元婴期', icon: '👻', unlockedAt: 0, isSecret: false },
  { id: 'deity_transform', name: '化神入道', desc: '突破至化神期', icon: '✨', unlockedAt: 0, isSecret: false },
  { id: 'dark_path', name: '旁门左道', desc: '第一次修炼禁术', icon: '🌑', unlockedAt: 0, isSecret: false },
  { id: 'first_kill', name: '初染鲜血', desc: '第一次击杀敌人', icon: '⚔️', unlockedAt: 0, isSecret: false },
  { id: 'love_found', name: '仙途有伴', desc: '获得第一位道侣', icon: '💕', unlockedAt: 0, isSecret: false },
  { id: 'rich_merchant', name: '富可敌国', desc: '身家超过一万灵石', icon: '💎', unlockedAt: 0, isSecret: false },
  { id: 'first_death', name: '死里逃生', desc: '第一次濒死经历', icon: '💀', unlockedAt: 0, isSecret: false },
  { id: 'karma_good', name: '积善之家', desc: '善报达到100', icon: '☀️', unlockedAt: 0, isSecret: false },
  { id: 'karma_evil', name: '恶贯满盈', desc: '恶报达到-100', icon: '😈', unlockedAt: 0, isSecret: false },
  { id: 'technique_master', name: '功法大成', desc: '拥有5门以上功法', icon: '📖', unlockedAt: 0, isSecret: false },
  { id: 'treasure_hunter', name: '寻宝奇才', desc: '拥有10件以上法宝', icon: '🏺', unlockedAt: 0, isSecret: false },
  // 隐藏成就
  { id: 'chaos_master', name: '混沌之子', desc: '以混沌灵根突破至元婴', icon: '🌀', unlockedAt: 0, isSecret: true },
  { id: 'death_loop', name: '不死之身', desc: '死亡3次后仍然存活', icon: '🔄', unlockedAt: 0, isSecret: true },
  { id: 'dao_question', name: '问道苍天', desc: '发现天道之秘', icon: '🌠', unlockedAt: 0, isSecret: true },
  { id: 'world_weary', name: '看破红尘', desc: '年龄超过200岁仍在筑基以下', icon: '🦉', unlockedAt: 0, isSecret: true },
  { id: 'true_independence', name: '天地不羁', desc: '善恶值为0，不受因果束缚', icon: '⚖️', unlockedAt: 0, isSecret: true },
];

export function checkAchievements(character: Character): Achievement[] {
  const newAchievements: Achievement[] = [];
  const existingIds = new Set(character.achievements.map(a => a.id));
  const age = character.age;

  const conditions: Record<string, () => boolean> = {
    first_step: () => true, // 进入游戏就有
    qi_refined: () => character.realm === 'qi_refining' || ['foundation', 'core_formation', 'nascent_soul', 'deity_transformation', 'void_refining', 'body_integration', 'mahayana', 'tribulation', 'immortal'].includes(character.realm),
    foundation_set: () => ['foundation', 'core_formation', 'nascent_soul', 'deity_transformation', 'void_refining', 'body_integration', 'mahayana', 'tribulation', 'immortal'].includes(character.realm),
    golden_core: () => ['core_formation', 'nascent_soul', 'deity_transformation', 'void_refining', 'body_integration', 'mahayana', 'tribulation', 'immortal'].includes(character.realm),
    nascent_born: () => ['nascent_soul', 'deity_transformation', 'void_refining', 'body_integration', 'mahayana', 'tribulation', 'immortal'].includes(character.realm),
    deity_transform: () => ['deity_transformation', 'void_refining', 'body_integration', 'mahayana', 'tribulation', 'immortal'].includes(character.realm),
    dark_path: () => character.stats.darkArts > 0,
    first_kill: () => character.enemies.length > 0,
    love_found: () => character.companions.length > 0,
    rich_merchant: () => character.stats.wealth >= 10000,
    first_death: () => character.deathCount >= 1,
    karma_good: () => character.stats.karma >= 100,
    karma_evil: () => character.stats.karma <= -100,
    technique_master: () => character.techniques.length >= 5,
    treasure_hunter: () => character.items.length >= 10,
    chaos_master: () => character.spiritualRoot === 'chaos' && ['nascent_soul', 'deity_transformation', 'void_refining', 'body_integration', 'mahayana', 'tribulation', 'immortal'].includes(character.realm),
    death_loop: () => character.deathCount >= 3,
    dao_question: () => character.flags['found_heavenly_array'] || character.flags['saw_beyond'],
    world_weary: () => character.age >= 200 && ['mortal', 'qi_refining', 'foundation'].includes(character.realm),
    true_independence: () => character.stats.karma === 0 && character.age > 50,
  };

  for (const achievement of ALL_ACHIEVEMENTS) {
    if (!existingIds.has(achievement.id) && conditions[achievement.id]?.()) {
      newAchievements.push({ ...achievement, unlockedAt: age });
    }
  }

  return newAchievements;
}
