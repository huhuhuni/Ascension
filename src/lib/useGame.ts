'use client';

import { useState, useCallback, useRef } from 'react';
import {
  Character, CharacterStats, GameState, StoryChapter, StoryChoice,
  NPC, PlotThread, StoryHistoryEntry, Item, Technique, Companion,
} from '@/types/game';
import { createCharacter, applyStatsDelta, canBreakthrough, getNextRealm, getRealmData } from '@/lib/gameEngine';
import { checkEnding } from '@/lib/endings';
import { checkAchievements } from '@/lib/achievements';

const STORAGE_KEY = 'ascension_save';
const REALMS_LIST = ['mortal', 'qi_refining', 'foundation', 'core_formation', 'nascent_soul', 'deity_transformation', 'void_refining', 'body_integration', 'mahayana', 'tribulation', 'immortal'];

function getDefaultState(): GameState {
  return {
    character: null as unknown as Character,
    currentChapter: null,
    chapterIndex: 0,
    isGameOver: false,
    ending: null,
    storyLog: [],
    npcs: [],
    plotThreads: [],
    storyHistory: [],
    lastNarration: undefined,
  };
}

function loadFromStorage(): GameState {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          ...getDefaultState(),
          ...parsed,
          npcs: parsed.npcs || [],
          plotThreads: parsed.plotThreads || [],
          storyHistory: parsed.storyHistory || [],
          lastNarration: parsed.lastNarration || undefined,
        };
      } catch {}
    }
  }
  return getDefaultState();
}

function saveToStorage(state: GameState) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }
}

// 合并 NPC：按 id 更新或新增
function mergeNPCs(existing: NPC[], incoming: NPC[]): NPC[] {
  const map = new Map(existing.map(n => [n.id, n]));
  for (const npc of incoming) {
    const curr = map.get(npc.id);
    if (curr) {
      map.set(npc.id, { ...curr, ...npc, lastSeenAge: Math.max(curr.lastSeenAge, npc.lastSeenAge) });
    } else {
      map.set(npc.id, npc);
    }
  }
  return Array.from(map.values());
}

// 合并剧情线：按 id 更新或新增
function mergePlotThreads(existing: PlotThread[], incoming: PlotThread[]): PlotThread[] {
  const map = new Map(existing.map(t => [t.id, t]));
  for (const thread of incoming) {
    const curr = map.get(thread.id);
    if (curr) {
      map.set(thread.id, { ...curr, ...thread });
    } else {
      map.set(thread.id, thread);
    }
  }
  return Array.from(map.values());
}

// 过期剧情线：>20章未推进且优先级低的标记为 abandoned
function expirePlotThreads(threads: PlotThread[], currentAge: number): PlotThread[] {
  return threads.map(t => {
    if (t.status === 'active' && currentAge - t.lastAdvancedAge > 20 && t.priority <= 2) {
      return { ...t, status: 'abandoned' as const };
    }
    return t;
  });
}

// 应用后果到角色（选择和叙事章节共用）
function applyConsequence(
  char: Character,
  con: {
    stats?: Partial<CharacterStats>;
    hp?: number;
    realm?: string;
    items?: Item[];
    techniques?: Technique[];
    companions?: Companion[];
    enemies?: string[];
    flags?: Record<string, boolean>;
    ageAdvance?: number;
    deathRisk?: number;
    karmaChange?: number;
  }
): Character {
  const c = {
    ...char,
    stats: { ...char.stats },
    flags: { ...char.flags },
    ageHistory: [...char.ageHistory],
    items: [...char.items],
    techniques: [...char.techniques],
    companions: [...char.companions],
    enemies: [...char.enemies],
  };

  // 属性变化
  if (con.stats) {
    c.stats = applyStatsDelta(c.stats, con.stats);
  }

  // 年龄
  c.age += con.ageAdvance || 1;

  // 因果
  if (con.karmaChange) {
    c.stats.karma += con.karmaChange;
  }

  // HP 变化
  if (con.hp !== undefined && con.hp !== 0) {
    if (con.hp > 0) {
      c.hp = Math.min(c.maxHp, c.hp + con.hp);
    } else {
      c.hp = Math.max(0, c.hp + con.hp);
    }
  }

  // 死亡风险
  if (con.deathRisk && con.deathRisk > 0) {
    if (Math.random() < con.deathRisk) {
      c.deathCount += 1;
      c.hp = Math.max(1, c.hp - 50);
      c.stats.cultivation = Math.max(0, c.stats.cultivation - 50);
      c.ageHistory.push(`${c.age}岁：险些陨落，修为大损`);
    }
  }

  // 标记
  if (con.flags) {
    c.flags = { ...c.flags, ...con.flags };
  }

  // 物品
  if (con.items && con.items.length > 0) {
    for (const item of con.items) {
      const existing = c.items.find(i => i.id === item.id);
      if (existing && (item.type === 'pill' || item.type === 'material')) {
        existing.quantity += item.quantity || 1;
      } else {
        c.items = [...c.items, { ...item, quantity: item.quantity || 1 }];
      }
    }
  }

  // 功法
  if (con.techniques && con.techniques.length > 0) {
    for (const tech of con.techniques) {
      const existing = c.techniques.find(t => t.id === tech.id);
      if (existing) {
        existing.level = Math.min(9, existing.level + 1);
      } else {
        c.techniques = [...c.techniques, { ...tech }];
      }
    }
  }

  // 同伴
  if (con.companions && con.companions.length > 0) {
    for (const comp of con.companions) {
      const existing = c.companions.find(cp => cp.id === comp.id);
      if (existing) {
        existing.relationship = Math.round((existing.relationship + comp.relationship) / 2);
        existing.realm = comp.realm;
      } else {
        c.companions = [...c.companions, { ...comp }];
        c.ageHistory.push(`${c.age}岁：结识${comp.name}`);
      }
    }
  }

  // 仇敌
  if (con.enemies && con.enemies.length > 0) {
    for (const enemy of con.enemies) {
      if (!c.enemies.includes(enemy)) {
        c.enemies = [...c.enemies, enemy];
        c.ageHistory.push(`${c.age}岁：与${enemy}结仇`);
      }
    }
  }

  // 强制突破
  if (con.realm && con.realm !== c.realm) {
    const targetIdx = REALMS_LIST.indexOf(con.realm);
    if (targetIdx >= 0 && targetIdx > REALMS_LIST.indexOf(c.realm)) {
      c.realm = con.realm as Character['realm'];
      c.maxHp = 100 + targetIdx * 100;
      c.hp = c.maxHp;
      c.ageHistory.push(`${c.age}岁：机缘突破至${getRealmData(con.realm).name}！`);
    }
  }

  // 正常突破检查
  if (canBreakthrough(c)) {
    const nextRealm = getNextRealm(c.realm);
    if (nextRealm) {
      c.realm = nextRealm.id;
      c.maxHp = 100 + REALMS_LIST.indexOf(nextRealm.id) * 100;
      c.hp = c.maxHp;
      c.ageHistory.push(`${c.age}岁：突破至${nextRealm.name}！`);
    }
  }

  return c;
}

export function useGame() {
  const [gameState, setGameState] = useState<GameState>(loadFromStorage);
  const [isLoading, setIsLoading] = useState(false);
  const [newAchievements, setNewAchievements] = useState<string[]>([]);
  const fetchQueueRef = useRef(false);

  const fetchStory = useCallback(async (
    character: Character,
    previousChoice?: string,
    storyHistory?: StoryHistoryEntry[],
    npcs?: NPC[],
    plotThreads?: PlotThread[],
  ): Promise<StoryChapter | null> => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          character,
          previousChoice,
          useLLM: true,
          storyHistory,
          npcs,
          plotThreads,
        }),
      });
      const data = await response.json();
      return data.story as StoryChapter;
    } catch (error) {
      console.error('Failed to fetch story:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const startGame = useCallback((name: string, spiritualRoot: string, background: string) => {
    const character = createCharacter(name as any, spiritualRoot as any, background as any);
    const state: GameState = {
      character,
      currentChapter: null,
      chapterIndex: 0,
      isGameOver: false,
      ending: null,
      storyLog: [],
      npcs: [],
      plotThreads: [],
      storyHistory: [],
    };
    setGameState(state);
    saveToStorage(state);
  }, []);

  // 做出选择
  const makeChoice = useCallback(async (choice: StoryChoice) => {
    if (fetchQueueRef.current) return;
    fetchQueueRef.current = true;

    let narrationText = choice.consequence.narration;

    setGameState(prev => {
      if (!prev.character) return prev;

      const char = applyConsequence(prev.character, choice.consequence);

      // 成就检查
      const newAch = checkAchievements(char);
      if (newAch.length > 0) {
        char.achievements = [...char.achievements, ...newAch];
        setNewAchievements(newAch.map(a => `${a.icon} ${a.name}: ${a.desc}`));
        setTimeout(() => setNewAchievements([]), 4000);
      }

      // 结局检查
      const ending = checkEnding(char);

      // 记录经历
      char.ageHistory.push(`${char.age}岁：${choice.text}`);

      // 剧情线过期
      const updatedThreads = expirePlotThreads(prev.plotThreads, char.age);

      const newState: GameState = {
        ...prev,
        character: char,
        currentChapter: null,
        chapterIndex: prev.chapterIndex + 1,
        isGameOver: ending !== null || char.hp <= 0,
        ending,
        storyLog: prev.currentChapter
          ? [...prev.storyLog, { ...prev.currentChapter, consequence: choice.text }]
          : prev.storyLog,
        npcs: prev.npcs,
        plotThreads: updatedThreads,
        storyHistory: prev.currentChapter
          ? [...prev.storyHistory, {
              chapterIndex: prev.chapterIndex,
              content: prev.currentChapter.content.slice(0, 200),
              choiceText: choice.text,
              consequence: narrationText?.slice(0, 100),
            }].slice(-20)
          : prev.storyHistory,
        lastNarration: narrationText,
      };

      saveToStorage(newState);
      return newState;
    });

    // 获取下一段故事
    const currentState = loadFromStorage();
    if (!currentState.isGameOver && currentState.character) {
      const story = await fetchStory(
        currentState.character,
        choice.text,
        currentState.storyHistory.slice(-5),
        currentState.npcs.filter(n => n.status === 'active').slice(-8),
        currentState.plotThreads.filter(t => t.status === 'active').slice(-5),
      );
      if (story) {
        setGameState(p => {
          const updated = {
            ...p,
            currentChapter: story,
            npcs: mergeNPCs(p.npcs, story.npcs || []),
            plotThreads: mergePlotThreads(p.plotThreads, story.plotThreads || []),
          };
          saveToStorage(updated);
          return updated;
        });
      }
    }

    fetchQueueRef.current = false;
  }, [fetchStory]);

  // 叙事章节点击"继续"
  const continueNarrative = useCallback(async () => {
    if (fetchQueueRef.current) return;
    fetchQueueRef.current = true;

    setGameState(prev => {
      if (!prev.character || !prev.currentChapter) return prev;

      const autoCon = prev.currentChapter.autoConsequence || {};
      const char = applyConsequence(prev.character, autoCon);

      // 成就检查
      const newAch = checkAchievements(char);
      if (newAch.length > 0) {
        char.achievements = [...char.achievements, ...newAch];
        setNewAchievements(newAch.map(a => `${a.icon} ${a.name}: ${a.desc}`));
        setTimeout(() => setNewAchievements([]), 4000);
      }

      const ending = checkEnding(char);
      const updatedThreads = expirePlotThreads(prev.plotThreads, char.age);

      const newState: GameState = {
        ...prev,
        character: char,
        currentChapter: null,
        chapterIndex: prev.chapterIndex + 1,
        isGameOver: ending !== null || char.hp <= 0,
        ending,
        storyLog: [...prev.storyLog, prev.currentChapter],
        npcs: prev.npcs,
        plotThreads: updatedThreads,
        storyHistory: [...prev.storyHistory, {
          chapterIndex: prev.chapterIndex,
          content: prev.currentChapter.content.slice(0, 200),
          choiceText: '（继续前行）',
          consequence: undefined,
        }].slice(-20),
        lastNarration: undefined,
      };

      saveToStorage(newState);
      return newState;
    });

    const currentState = loadFromStorage();
    if (!currentState.isGameOver && currentState.character) {
      const story = await fetchStory(
        currentState.character,
        '继续前行',
        currentState.storyHistory.slice(-5),
        currentState.npcs.filter(n => n.status === 'active').slice(-8),
        currentState.plotThreads.filter(t => t.status === 'active').slice(-5),
      );
      if (story) {
        setGameState(p => {
          const updated = {
            ...p,
            currentChapter: story,
            npcs: mergeNPCs(p.npcs, story.npcs || []),
            plotThreads: mergePlotThreads(p.plotThreads, story.plotThreads || []),
          };
          saveToStorage(updated);
          return updated;
        });
      }
    }

    fetchQueueRef.current = false;
  }, [fetchStory]);

  const loadGame = useCallback(() => {
    const state = loadFromStorage();
    if (state.character?.name) {
      setGameState(state);
      return true;
    }
    return false;
  }, []);

  const resetGame = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
    setGameState(getDefaultState());
  }, []);

  const startStory = useCallback(async () => {
    const char = loadFromStorage().character;
    if (!char) return;
    const state = loadFromStorage();
    const story = await fetchStory(
      char,
      undefined,
      state.storyHistory.slice(-5),
      state.npcs.filter(n => n.status === 'active').slice(-8),
      state.plotThreads.filter(t => t.status === 'active').slice(-5),
    );
    if (story) {
      setGameState(p => {
        const updated = {
          ...p,
          currentChapter: story,
          npcs: mergeNPCs(p.npcs, story.npcs || []),
          plotThreads: mergePlotThreads(p.plotThreads, story.plotThreads || []),
        };
        saveToStorage(updated);
        return updated;
      });
    }
  }, [fetchStory]);

  return {
    gameState,
    isLoading,
    newAchievements,
    startGame,
    makeChoice,
    continueNarrative,
    loadGame,
    resetGame,
    startStory,
  };
}
