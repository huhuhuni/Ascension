'use client';

import { useState } from 'react';
import { StoryChapter } from '@/types/game';

interface Props {
  storyLog: StoryChapter[];
}

export default function HistoryLog({ storyLog }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  if (storyLog.length === 0) return null;

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 right-4 z-40 px-4 py-2 bg-gray-900/90 backdrop-blur-sm border border-gray-700/50 rounded-xl text-gray-400 hover:text-amber-400 hover:border-amber-500/50 transition-all text-sm"
      >
        📜 历程 ({storyLog.length})
      </button>

      {/* 遮罩 */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* 侧边栏 */}
      <div className={`fixed top-0 right-0 h-full w-96 max-w-[90vw] bg-gray-950/95 backdrop-blur-sm border-l border-gray-700/50 z-50 transform transition-transform duration-300 ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      } overflow-y-auto`}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-amber-300">修仙历程</h2>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-500 hover:text-gray-300 transition-colors"
            >
              ✕
            </button>
          </div>

          <div className="space-y-4">
            {storyLog.map((chapter, idx) => (
              <div key={idx} className="border-l-2 border-gray-700 pl-4">
                <div className="text-gray-600 text-xs mb-1">第{idx + 1}章</div>
                <p className="text-gray-300 text-sm leading-relaxed mb-2">{chapter.content}</p>
                {chapter.consequence && (
                  <p className="text-amber-400/60 text-xs italic">
                    → {chapter.consequence}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
