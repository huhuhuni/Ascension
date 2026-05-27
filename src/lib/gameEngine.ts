import { Character, CharacterStats, REALMS, SpiritualRootId, BackgroundId, SPIRITUAL_ROOTS, BACKGROUNDS } from '@/types/game';

export function createCharacter(
  name: string,
  spiritualRoot: SpiritualRootId,
  background: BackgroundId
): Character {
  const rootData = SPIRITUAL_ROOTS.find(r => r.id === spiritualRoot)!;
  const bgData = BACKGROUNDS.find(b => b.id === background)!;

  const baseStats: CharacterStats = {
    cultivation: 0,
    comprehension: 50,
    luck: 50,
    karma: 0,
    attack: 30,
    defense: 30,
    speed: 30,
    alchemy: 10,
    crafting: 10,
    formation: 10,
    endurance: 50,
    wealth: 100,
    darkArts: 0,
    ambition: 50,
    potential: 50,
    tribulation: 1.0,
  };

  // 应用灵根加成
  const rootBonus = rootData.bonus as Record<string, number>;
  const statsAny = baseStats as unknown as Record<string, number>;
  for (const [key, val] of Object.entries(rootBonus)) {
    if (key in baseStats) {
      statsAny[key] = Math.round(statsAny[key] * val);
    }
  }

  // 应用背景加成
  const bgBonus = bgData.bonus as Record<string, number>;
  for (const [key, val] of Object.entries(bgBonus)) {
    if (key in baseStats) {
      statsAny[key] = Math.round(statsAny[key] * val);
    }
  }

  // 商贾之子额外金钱
  if (background === 'merchant') baseStats.wealth = 500;
  // 孤儿额外运气
  if (background === 'orphan') baseStats.luck = 80;

  return {
    name,
    spiritualRoot,
    background,
    realm: 'mortal',
    age: 16,
    stats: baseStats,
    hp: 100,
    maxHp: 100,
    techniques: [],
    items: [],
    companions: [],
    enemies: [],
    achievements: [],
    flags: {},
    deathCount: 0,
    ageHistory: [`十六岁，${name}踏上了修仙之路`],
  };
}

export function getRealmData(realmId: string) {
  return REALMS.find(r => r.id === realmId) || REALMS[0];
}

export function getNextRealm(realmId: string) {
  const idx = REALMS.findIndex(r => r.id === realmId);
  if (idx < 0 || idx >= REALMS.length - 1) return null;
  return REALMS[idx + 1];
}

export function canBreakthrough(character: Character): boolean {
  const nextRealm = getNextRealm(character.realm);
  if (!nextRealm) return false;

  const currentIdx = REALMS.findIndex(r => r.id === character.realm);
  const requiredCultivation = nextRealm.powerBase * 0.8;

  return character.stats.cultivation >= requiredCultivation;
}

export function applyStatsDelta(stats: CharacterStats, delta: Partial<CharacterStats>): CharacterStats {
  const newStats = { ...stats };
  for (const [key, val] of Object.entries(delta)) {
    if (key in newStats && typeof val === 'number') {
      (newStats as Record<string, number>)[key] = Math.max(0,
        (newStats as Record<string, number>)[key] + val
      );
    }
  }
  return newStats;
}

export function getPowerLevel(character: Character): number {
  const realm = getRealmData(character.realm);
  return Math.round(
    realm.powerBase +
    character.stats.attack * 2 +
    character.stats.defense * 1.5 +
    character.stats.speed +
    character.stats.cultivation * 0.1 +
    character.techniques.reduce((sum, t) => sum + t.level * 100, 0) +
    character.items.reduce((sum, i) => sum + i.grade * 50, 0)
  );
}
