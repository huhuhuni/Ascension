'use client';

import { Ending, Character } from '@/types/game';
import { getRealmData, getPowerLevel } from '@/lib/gameEngine';

interface Props {
  ending: Ending;
  character: Character;
  onRestart: () => void;
}

export default function GameOver({ ending, character, onRestart }: Props) {
  const rarityColors: Record<string, string> = {
    common: 'from-gray-400 to-gray-600',
    rare: 'from-blue-400 to-blue-600',
    epic: 'from-purple-400 to-purple-600',
    legendary: 'from-amber-400 to-orange-500',
    mythic: 'from-red-400 via-yellow-300 to-red-400',
  };

  const rarityNames: Record<string, string> = {
    common: '寻常', rare: '稀有', epic: '史诗', legendary: '传说', mythic: '神话',
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 p-4">
      <div className="max-w-2xl w-full">
        {/* 结局标题 */}
        <div className="text-center mb-8">
          <div className="mb-4">
            <span className={`px-4 py-1 rounded-full text-sm font-bold bg-gradient-to-r ${rarityColors[ending.rarity]} text-white`}>
              {rarityNames[ending.rarity]}结局
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-300 bg-clip-text text-transparent mb-4">
            {ending.name}
          </h1>
          <p className="text-gray-400 text-lg">{getEndingTypeLabel(ending.type)}</p>
        </div>

        {/* 结局描述 */}
        <div className="bg-gray-900/80 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-8 mb-8">
          <p className="text-gray-200 leading-relaxed text-lg whitespace-pre-wrap text-center">
            {ending.desc}
          </p>
        </div>

        {/* 角色总结 */}
        <div className="bg-gray-900/60 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6 mb-8">
          <h2 className="text-lg font-bold text-amber-300 mb-4 text-center">修仙总结</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-center">
            <StatBlock label="姓名" value={character.name} />
            <StatBlock label="最终境界" value={getRealmData(character.realm).name} />
            <StatBlock label="享年" value={`${character.age}岁`} />
            <StatBlock label="战力" value={getPowerLevel(character).toLocaleString()} />
            <StatBlock label="修为" value={character.stats.cultivation.toString()} />
            <StatBlock label="因果" value={character.stats.karma.toString()} highlight={character.stats.karma >= 0 ? 'text-amber-400' : 'text-red-400'} />
            <StatBlock label="功法" value={`${character.techniques.length}门`} />
            <StatBlock label="法宝" value={`${character.items.length}件`} />
            <StatBlock label="同伴" value={`${character.companions.length}人`} />
            <StatBlock label="仇敌" value={`${character.enemies.length}人`} />
            <StatBlock label="成就" value={`${character.achievements.length}项`} />
            <StatBlock label="生死" value={`${character.deathCount}次`} />
          </div>

          {/* 人生经历 */}
          {character.ageHistory.length > 0 && (
            <div className="mt-6 border-t border-gray-700/50 pt-4">
              <h3 className="text-sm font-bold text-gray-400 mb-3">人生轨迹</h3>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {character.ageHistory.map((entry, i) => (
                  <p key={i} className="text-gray-400 text-sm">{entry}</p>
                ))}
              </div>
            </div>
          )}

          {/* 成就展示 */}
          {character.achievements.length > 0 && (
            <div className="mt-4 border-t border-gray-700/50 pt-4">
              <h3 className="text-sm font-bold text-gray-400 mb-3">所得成就</h3>
              <div className="flex flex-wrap gap-2">
                {character.achievements.map(a => (
                  <span key={a.id} className="bg-gray-800 rounded-lg px-3 py-1.5 text-sm" title={a.desc}>
                    {a.icon} {a.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 重新开始 */}
        <div className="text-center">
          <button
            onClick={onRestart}
            className="px-8 py-4 bg-amber-500 text-gray-900 rounded-xl font-bold text-lg hover:bg-amber-400 transition-all shadow-lg shadow-amber-500/25 active:scale-95"
          >
            转世重修
          </button>
          <p className="text-gray-600 text-sm mt-3">每一次轮回，都是不同的道</p>
        </div>
      </div>
    </div>
  );
}

function StatBlock({ label, value, highlight }: { label: string; value: string; highlight?: string }) {
  return (
    <div className="bg-gray-800/50 rounded-lg p-3">
      <p className="text-gray-500 text-xs mb-1">{label}</p>
      <p className={`font-bold ${highlight || 'text-gray-200'}`}>{value}</p>
    </div>
  );
}

function getEndingTypeLabel(type: string): string {
  const map: Record<string, string> = {
    transcendence: '超脱之路',
    immortality: '不朽传说',
    fall: '坠落之途',
    reincarnation: '轮回之谜',
    hidden: '隐秘真相',
    special: '殊途同归',
  };
  return map[type] || '未知结局';
}
