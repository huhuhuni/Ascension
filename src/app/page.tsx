'use client';

import { useEffect, useState } from 'react';
import CharacterCreation from '@/components/CharacterCreation';
import StatusPanel from '@/components/StatusPanel';
import StoryPanel from '@/components/StoryPanel';
import GameOver from '@/components/GameOver';
import HistoryLog from '@/components/HistoryLog';
import { useGame } from '@/lib/useGame';

type Screen = 'title' | 'create' | 'game' | 'gameover';

export default function Home() {
  const { gameState, isLoading, newAchievements, startGame, makeChoice, continueNarrative, loadGame, resetGame, startStory } = useGame();
  const [screen, setScreen] = useState<Screen>('title');
  const [hasSave, setHasSave] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ascension_save');
      if (saved) {
        try {
          const data = JSON.parse(saved);
          if (data.character?.name) setHasSave(true);
        } catch {}
      }
    }
  }, []);

  useEffect(() => {
    if (gameState.character?.name && !gameState.isGameOver && screen === 'create') {
      setScreen('game');
    }
    if (gameState.isGameOver && screen === 'game') {
      setScreen('gameover');
    }
  }, [gameState, screen]);

  const handleStartNew = () => setScreen('create');

  const handleLoadGame = () => {
    const success = loadGame();
    if (success) setScreen('game');
  };

  const handleCreate = (name: string, spiritualRoot: string, background: string) => {
    startGame(name, spiritualRoot, background);
    // startGame 后立即获取第一段故事
    setScreen('game');
  };

  const handleRestart = () => {
    resetGame();
    setScreen('title');
    setHasSave(false);
  };

  // 新故事加载
  useEffect(() => {
    if (screen === 'game' && gameState.character?.name && !gameState.currentChapter && !gameState.isGameOver && !isLoading) {
      startStory();
    }
  }, [screen, gameState.character?.name, gameState.currentChapter, gameState.isGameOver, isLoading, startStory]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950">
      {/* 成就弹出提示 */}
      {newAchievements.length > 0 && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 space-y-2">
          {newAchievements.map((ach, i) => (
            <div key={i} className="achievement-toast bg-gray-900/95 backdrop-blur-sm border border-amber-500/30 rounded-xl px-6 py-3 shadow-2xl shadow-amber-500/10">
              <p className="text-amber-300 text-sm font-medium">{ach}</p>
            </div>
          ))}
        </div>
      )}

      {/* 标题画面 */}
      {screen === 'title' && (
        <div className="min-h-screen flex flex-col items-center justify-center px-4">
          {/* 背景装饰 */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
          </div>

          <div className="relative z-10 text-center">
            {/* 太极图 */}
            <div className="relative w-32 h-32 mx-auto mb-8">
              <div className="absolute inset-0 border-2 border-amber-500/20 rounded-full" />
              <div className="absolute inset-2 text-7xl animate-spin-slow opacity-30">☯</div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-4xl">🏔️</span>
              </div>
            </div>

            <h1 className="text-6xl md:text-7xl font-bold bg-gradient-to-r from-amber-400 via-yellow-200 to-amber-400 bg-clip-text text-transparent mb-4">
              逆天问道
            </h1>
            <p className="text-xl text-gray-400 mb-2">修仙模拟</p>
            <p className="text-gray-600 mb-12">凡人亦可逆天，仙途不在一端</p>

            <div className="space-y-4">
              <button
                onClick={handleStartNew}
                className="block w-64 mx-auto px-8 py-4 bg-amber-500 text-gray-900 rounded-xl font-bold text-lg hover:bg-amber-400 transition-all shadow-lg shadow-amber-500/25 active:scale-95"
              >
                踏入仙途
              </button>

              {hasSave && (
                <button
                  onClick={handleLoadGame}
                  className="block w-64 mx-auto px-8 py-4 bg-gray-800 text-gray-300 rounded-xl font-bold hover:bg-gray-700 hover:text-amber-300 transition-all border border-gray-700"
                >
                  继续修炼
                </button>
              )}
            </div>

            {/* 特色说明 */}
            <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
              <FeatureCard icon="🌀" title="多重结局" desc="飞升不是唯一选择，堕落亦非终局" />
              <FeatureCard icon="⚡" title="意外转折" desc="修仙套路皆可颠覆，真相远比想象复杂" />
              <FeatureCard icon="⚖️" title="因果循环" desc="善恶到头终有报，一念之差两重天" />
            </div>
          </div>
        </div>
      )}

      {/* 角色创建 */}
      {screen === 'create' && (
        <CharacterCreation onCreate={handleCreate} />
      )}

      {/* 游戏主界面 */}
      {screen === 'game' && gameState.character && (
        <div className="min-h-screen flex flex-col md:flex-row">
          {/* 状态面板 - 移动端在底部，桌面端在左侧 */}
          <div className="md:w-80 md:flex-shrink-0 md:h-screen md:overflow-y-auto md:sticky md:top-0 order-2 md:order-1">
            <StatusPanel character={gameState.character} npcs={gameState.npcs} />
          </div>

          {/* 故事面板 */}
          <div className="flex-1 flex flex-col min-h-screen order-1 md:order-2">
            <StoryPanel
              chapter={gameState.currentChapter}
              character={gameState.character}
              isLoading={isLoading}
              lastNarration={gameState.lastNarration}
              onChoice={makeChoice}
              onContinue={continueNarrative}
            />
          </div>

          {/* 历程日志 */}
          <HistoryLog storyLog={gameState.storyLog} />

          {/* 重新开始按钮 */}
          <div className="fixed top-4 right-28 z-40">
            <button
              onClick={() => {
                if (confirm('确定要重新开始吗？当前进度将丢失。')) {
                  resetGame();
                  setScreen('title');
                  setHasSave(false);
                }
              }}
              className="px-4 py-2 bg-gray-900/90 backdrop-blur-sm border border-gray-700/50 rounded-xl text-gray-500 hover:text-red-400 hover:border-red-500/50 transition-all text-sm"
            >
              重新开始
            </button>
          </div>
        </div>
      )}

      {/* 游戏结束 */}
      {screen === 'gameover' && gameState.ending && gameState.character && (
        <GameOver
          ending={gameState.ending}
          character={gameState.character}
          onRestart={handleRestart}
        />
      )}
    </main>
  );
}

function FeatureCard({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="bg-gray-900/40 rounded-xl border border-gray-800/50 p-5">
      <div className="text-3xl mb-2">{icon}</div>
      <h3 className="text-amber-300 font-bold mb-1">{title}</h3>
      <p className="text-gray-500 text-sm">{desc}</p>
    </div>
  );
}
