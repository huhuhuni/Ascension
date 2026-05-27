'use client';

import { StoryChapter, StoryChoice, Character } from '@/types/game';
import { getRealmData } from '@/lib/gameEngine';

interface Props {
  chapter: StoryChapter | null;
  character: Character;
  isLoading: boolean;
  lastNarration?: string;
  onChoice: (choice: StoryChoice) => void;
  onContinue: () => void;
}

const NARRATIVE_LABELS: Record<string, string> = {
  environment: '山川风物',
  character_intro: '人物志',
  group_psychology: '众生相',
  time_skip: '光阴似箭',
  world_event: '天下大事',
};

export default function StoryPanel({ chapter, character, isLoading, lastNarration, onChoice, onContinue }: Props) {
  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-4">
            <div className="absolute inset-0 border-2 border-amber-500/30 rounded-full" />
            <div className="absolute inset-0 border-2 border-transparent border-t-amber-400 rounded-full animate-spin" />
            <div className="absolute inset-2 border-2 border-transparent border-b-purple-400 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
            <div className="absolute inset-0 flex items-center justify-center text-2xl">☯</div>
          </div>
          <p className="text-gray-400 animate-pulse">天道轮转中...</p>
        </div>
      </div>
    );
  }

  if (!chapter) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <p className="text-6xl mb-4">🏔️</p>
          <p className="text-lg">修仙之路，由此开始</p>
        </div>
      </div>
    );
  }

  const isNarrative = chapter.type === 'narrative';

  return (
    <div className="flex-1 flex flex-col p-6 max-w-3xl mx-auto w-full">
      {/* 故事内容 */}
      <div className="flex-1 mb-6">
        <div className="bg-gray-900/60 backdrop-blur-sm rounded-2xl border border-gray-700/30 p-6 md:p-8">
          {/* 境界 + 章节类型标识 */}
          <div className="flex items-center gap-2 mb-4">
            <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded text-xs">
              {getRealmData(character.realm).name}
            </span>
            <span className="text-gray-600 text-xs">·</span>
            <span className="text-gray-500 text-xs">{character.age}岁</span>
            {isNarrative && chapter.narrativeType && (
              <>
                <span className="text-gray-600 text-xs">·</span>
                <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded text-xs">
                  {NARRATIVE_LABELS[chapter.narrativeType] || '叙事'}
                </span>
              </>
            )}
          </div>

          {/* 上一选择旁白 */}
          {lastNarration && (
            <div className="mb-4 px-4 py-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-300/80 text-sm italic">
              {lastNarration}
            </div>
          )}

          {/* 故事正文 */}
          <div className={`text-gray-200 leading-relaxed text-lg whitespace-pre-wrap story-text ${
            isNarrative ? 'italic text-gray-300' : ''
          }`}>
            {chapter.content}
          </div>
        </div>
      </div>

      {/* 选择区域 或 继续按钮 */}
      {isNarrative ? (
        <div className="text-center">
          <button
            onClick={onContinue}
            className="px-8 py-3 bg-gray-800 text-gray-300 rounded-xl font-medium hover:bg-gray-700 hover:text-amber-300 transition-all border border-gray-700"
          >
            继续前行 →
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-gray-500 text-sm text-center mb-2">— 抉择 —</p>
          {chapter.choices.map((choice, idx) => {
            const meetsRequirements = checkRequirements(choice, character);
            return (
              <button
                key={choice.id}
                onClick={() => meetsRequirements && onChoice(choice)}
                disabled={!meetsRequirements}
                className={`w-full text-left p-4 rounded-xl border transition-all duration-300 group ${
                  meetsRequirements
                    ? 'border-gray-700/50 bg-gray-900/40 hover:border-amber-500/50 hover:bg-amber-500/5 active:scale-[0.98]'
                    : 'border-gray-800 bg-gray-900/20 opacity-40 cursor-not-allowed'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${
                    meetsRequirements
                      ? 'bg-gray-800 text-amber-400 group-hover:bg-amber-500 group-hover:text-gray-900'
                      : 'bg-gray-800 text-gray-600'
                  } transition-all`}>
                    {idx + 1}
                  </span>
                  <div className="flex-1">
                    <p className={`font-medium ${meetsRequirements ? 'text-gray-200 group-hover:text-amber-300' : 'text-gray-600'}`}>
                      {choice.text}
                    </p>
                    {!meetsRequirements && choice.requirements && (
                      <p className="text-red-400/60 text-xs mt-1">
                        需求未满足: {choice.requirements.map(r => getReqText(r)).join(', ')}
                      </p>
                    )}
                    {choice.consequence.deathRisk && choice.consequence.deathRisk > 0 && meetsRequirements && (
                      <p className="text-red-400/60 text-xs mt-1">⚠ 此行有性命之忧</p>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function checkRequirements(choice: StoryChoice, character: Character): boolean {
  if (!choice.requirements) return true;
  return choice.requirements.every(req => {
    if (req.stat && (req.min !== undefined || req.max !== undefined)) {
      const val = character.stats[req.stat];
      if (req.min !== undefined && val < req.min) return false;
      if (req.max !== undefined && val > req.max) return false;
    }
    if (req.realm && character.realm !== req.realm) return false;
    if (req.flag && !character.flags[req.flag]) return false;
    return true;
  });
}

function getReqText(req: any): string {
  if (req.stat) return `${req.stat} ${req.min ? '≥' + req.min : ''}${req.max ? '≤' + req.max : ''}`;
  if (req.realm) return `境界: ${req.realm}`;
  if (req.flag) return `需有: ${req.flag}`;
  return '';
}
