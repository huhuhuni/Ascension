'use client';

import { Character, NPC } from '@/types/game';
import { getRealmData, getPowerLevel } from '@/lib/gameEngine';

interface Props {
  character: Character;
  npcs: NPC[];
}

export default function StatusPanel({ character, npcs }: Props) {
  const realm = getRealmData(character.realm);
  const power = getPowerLevel(character);

  return (
    <div className="bg-gray-900/80 backdrop-blur-sm rounded-xl border border-gray-700/50 p-4 space-y-4">
      {/* 基本信息 */}
      <div className="text-center border-b border-gray-700/50 pb-3">
        <h2 className="text-xl font-bold text-amber-300">{character.name}</h2>
        <div className="flex items-center justify-center gap-2 mt-1">
          <span className="px-3 py-0.5 bg-amber-500/20 text-amber-400 rounded-full text-sm font-bold">
            {realm.name}
          </span>
          <span className="text-gray-500 text-sm">{character.age}岁</span>
        </div>
        <p className="text-gray-500 text-xs mt-1">战力: {power.toLocaleString()}</p>
      </div>

      {/* 生命值 */}
      <div>
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-400">生命</span>
          <span className="text-gray-300">{character.hp}/{character.maxHp}</span>
        </div>
        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-red-600 to-red-400 rounded-full transition-all duration-500"
            style={{ width: `${(character.hp / character.maxHp) * 100}%` }}
          />
        </div>
      </div>

      {/* 核心属性 */}
      <div className="space-y-2">
        <h3 className="text-sm font-bold text-gray-400 border-b border-gray-800 pb-1">核心属性</h3>
        {renderStat('修为', character.stats.cultivation, 1000, 'from-purple-600 to-purple-400')}
        {renderStat('悟性', character.stats.comprehension, 200, 'from-blue-600 to-blue-400')}
        {renderStat('运气', character.stats.luck, 200, 'from-green-600 to-green-400')}
        {renderStat('心性', character.stats.endurance, 200, 'from-cyan-600 to-cyan-400')}
        {renderStat('因果', character.stats.karma, 200, character.stats.karma >= 0 ? 'from-amber-600 to-amber-400' : 'from-red-600 to-red-400')}
      </div>

      {/* 战斗属性 */}
      <div className="space-y-2">
        <h3 className="text-sm font-bold text-gray-400 border-b border-gray-800 pb-1">战斗属性</h3>
        {renderStat('攻击', character.stats.attack, 300, 'from-orange-600 to-orange-400')}
        {renderStat('防御', character.stats.defense, 300, 'from-sky-600 to-sky-400')}
        {renderStat('速度', character.stats.speed, 200, 'from-teal-600 to-teal-400')}
      </div>

      {/* 副业属性 */}
      <div className="space-y-2">
        <h3 className="text-sm font-bold text-gray-400 border-b border-gray-800 pb-1">副业</h3>
        {renderStat('炼丹', character.stats.alchemy, 200, 'from-pink-600 to-pink-400')}
        {renderStat('炼器', character.stats.crafting, 200, 'from-yellow-600 to-yellow-400')}
        {renderStat('阵法', character.stats.formation, 200, 'from-indigo-600 to-indigo-400')}
        {character.stats.darkArts > 0 && renderStat('邪术', character.stats.darkArts, 200, 'from-violet-600 to-violet-400')}
      </div>

      {/* 身家信息 */}
      <div className="space-y-2 text-sm">
        <h3 className="text-sm font-bold text-gray-400 border-b border-gray-800 pb-1">身家</h3>
        <div className="flex justify-between">
          <span className="text-gray-500">灵石</span>
          <span className="text-amber-400">{character.stats.wealth.toLocaleString()}</span>
        </div>
        {character.techniques.length > 0 && (
          <div>
            <span className="text-gray-500">功法: </span>
            <span className="text-purple-400">{character.techniques.map(t => t.name).join('、')}</span>
          </div>
        )}
        {character.items.length > 0 && (
          <div>
            <span className="text-gray-500">法宝: </span>
            <span className="text-cyan-400">{character.items.map(i => i.name).join('、')}</span>
          </div>
        )}
        {character.companions.length > 0 && (
          <div>
            <span className="text-gray-500">同伴: </span>
            <span className="text-pink-400">{character.companions.map(c => c.name).join('、')}</span>
          </div>
        )}
        {character.enemies.length > 0 && (
          <div>
            <span className="text-gray-500">仇敌: </span>
            <span className="text-red-400">{character.enemies.join('、')}</span>
          </div>
        )}
      </div>

      {/* NPC 人物关系 */}
      {npcs.filter(n => n.status === 'active').length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-gray-400 border-b border-gray-800 pb-1">人物</h3>
          {npcs.filter(n => n.status === 'active').slice(-8).map(npc => (
            <div key={npc.id} className="bg-gray-800/50 rounded-lg p-2.5">
              <div className="flex items-center justify-between">
                <span className="text-gray-200 text-sm font-medium">{npc.name}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded ${
                  npc.relationship > 20 ? 'bg-green-900/50 text-green-400' :
                  npc.relationship < -20 ? 'bg-red-900/50 text-red-400' :
                  'bg-gray-700 text-gray-400'
                }`}>
                  {npc.relationship > 20 ? '友好' : npc.relationship < -20 ? '敌对' : '中立'}
                </span>
              </div>
              <p className="text-gray-500 text-xs mt-0.5">{npc.context}</p>
            </div>
          ))}
        </div>
      )}

      {/* 成就 */}
      {character.achievements.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-gray-400 border-b border-gray-800 pb-1 mb-2">成就 ({character.achievements.length})</h3>
          <div className="flex flex-wrap gap-1">
            {character.achievements.map(a => (
              <span key={a.id} className="text-lg" title={`${a.name}: ${a.desc}`}>
                {a.icon}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function renderStat(label: string, value: number, max: number, gradient: string) {
  const pct = Math.min(100, Math.max(0, (Math.abs(value) / max) * 100));
  return (
    <div>
      <div className="flex justify-between text-sm mb-0.5">
        <span className="text-gray-400">{label}</span>
        <span className={`text-gray-300 ${value < 0 ? 'text-red-400' : ''}`}>{value}</span>
      </div>
      <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
        <div
          className={`h-full bg-gradient-to-r ${gradient} rounded-full transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
