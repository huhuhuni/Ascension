'use client';

import { useState } from 'react';
import { SPIRITUAL_ROOTS, BACKGROUNDS } from '@/types/game';

interface Props {
  onCreate: (name: string, spiritualRoot: string, background: string) => void;
}

export default function CharacterCreation({ onCreate }: Props) {
  const [name, setName] = useState('');
  const [spiritualRoot, setSpiritualRoot] = useState('');
  const [background, setBackground] = useState('');
  const [step, setStep] = useState(0);
  const [randomAnim, setRandomAnim] = useState(false);

  const canProceed = step === 0 ? name.trim().length > 0 : step === 1 ? spiritualRoot !== '' : background !== '';

  const handleNext = () => {
    if (step < 2) setStep(step + 1);
    else onCreate(name.trim(), spiritualRoot, background);
  };

  const handleRandomAll = () => {
    const surnames = ['韩', '林', '陈', '李', '王', '张', '萧', '叶', '苏', '顾', '沈', '秦', '楚', '白', '夜'];
    const names = ['立', '凡', '辰', '云', '风', '尘', '逸', '霜', '雪', '霄', '玄', '清', '明', '渊', '瑶'];
    const randomName = surnames[Math.floor(Math.random() * surnames.length)] +
                       names[Math.floor(Math.random() * names.length)];
    const randomRoot = SPIRITUAL_ROOTS[Math.floor(Math.random() * SPIRITUAL_ROOTS.length)].id;
    const randomBg = BACKGROUNDS[Math.floor(Math.random() * BACKGROUNDS.length)].id;

    setRandomAnim(true);
    setName(randomName);
    setSpiritualRoot(randomRoot);
    setBackground(randomBg);

    setTimeout(() => {
      setRandomAnim(false);
      onCreate(randomName, randomRoot, randomBg);
    }, 800);
  };

  const handleRandomSpirit = () => {
    const random = SPIRITUAL_ROOTS[Math.floor(Math.random() * SPIRITUAL_ROOTS.length)].id;
    setSpiritualRoot(random);
  };

  const handleRandomBg = () => {
    const random = BACKGROUNDS[Math.floor(Math.random() * BACKGROUNDS.length)].id;
    setBackground(random);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950">
      <div className="max-w-2xl w-full mx-4">
        {/* 标题 */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 bg-clip-text text-transparent mb-3">
            逆天问道
          </h1>
          <p className="text-gray-400 text-lg">凡人修仙，逆天而行</p>
          <button
            onClick={handleRandomAll}
            disabled={randomAnim}
            className="mt-4 px-6 py-2 bg-purple-500/20 text-purple-300 rounded-lg border border-purple-500/30 hover:bg-purple-500/30 transition-all text-sm font-medium"
          >
            {randomAnim ? '天命已定...' : '🎲 天命随机'}
          </button>
        </div>

        <div className="bg-gray-900/80 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-8 shadow-2xl">
          {/* 步骤指示器 */}
          <div className="flex items-center justify-center gap-3 mb-8">
            {['赐名', '灵根', '出身'].map((label, i) => (
              <div key={label} className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  i <= step ? 'bg-amber-500 text-gray-900' : 'bg-gray-700 text-gray-500'
                }`}>
                  {i + 1}
                </div>
                <span className={`text-sm ${i <= step ? 'text-amber-400' : 'text-gray-600'}`}>{label}</span>
                {i < 2 && <div className={`w-8 h-px ${i < step ? 'bg-amber-500' : 'bg-gray-700'}`} />}
              </div>
            ))}
          </div>

          {/* Step 0: 赐名 */}
          {step === 0 && (
            <div className="space-y-6">
              <h2 className="text-2xl text-amber-300 text-center mb-6">为你的修士赐名</h2>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="输入姓名..."
                className="w-full bg-gray-800/80 border border-gray-600 rounded-xl px-6 py-4 text-xl text-center text-gray-100 placeholder-gray-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                maxLength={8}
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && canProceed && handleNext()}
              />
              <p className="text-gray-500 text-center text-sm">名号将伴随你整个修仙之旅</p>
            </div>
          )}

          {/* Step 1: 选择灵根 */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-2xl text-amber-300 text-center mb-6">你的灵根属性</h2>
              <div className="text-center mb-3">
                <button
                  onClick={handleRandomSpirit}
                  className="px-4 py-1.5 text-sm bg-purple-500/20 text-purple-300 rounded-lg border border-purple-500/30 hover:bg-purple-500/30 transition-all"
                >
                  🎲 随机灵根
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {SPIRITUAL_ROOTS.map((root) => (
                  <button
                    key={root.id}
                    onClick={() => setSpiritualRoot(root.id)}
                    className={`text-left p-4 rounded-xl border transition-all ${
                      spiritualRoot === root.id
                        ? 'border-amber-500 bg-amber-500/10 ring-1 ring-amber-500/50'
                        : 'border-gray-700 bg-gray-800/50 hover:border-gray-500 hover:bg-gray-800'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{getElementEmoji(root.element)}</span>
                      <span className={`font-bold ${spiritualRoot === root.id ? 'text-amber-300' : 'text-gray-200'}`}>
                        {root.name}
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm">{root.desc}</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {Object.entries(root.bonus).map(([k, v]) => (
                        <span key={k} className={`text-xs px-2 py-0.5 rounded-full ${
                          (v as number) > 1 ? 'bg-green-900/50 text-green-400' : (v as number) < 1 ? 'bg-red-900/50 text-red-400' : 'bg-gray-700 text-gray-400'
                        }`}>
                          {getStatName(k)} {(v as number) > 1 ? '↑' : '↓'}
                        </span>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: 选择出身 */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-2xl text-amber-300 text-center mb-6">你的出身背景</h2>
              <div className="text-center mb-3">
                <button
                  onClick={handleRandomBg}
                  className="px-4 py-1.5 text-sm bg-purple-500/20 text-purple-300 rounded-lg border border-purple-500/30 hover:bg-purple-500/30 transition-all"
                >
                  🎲 随机出身
                </button>
              </div>
              <div className="space-y-3">
                {BACKGROUNDS.map((bg) => (
                  <button
                    key={bg.id}
                    onClick={() => setBackground(bg.id)}
                    className={`w-full text-left p-5 rounded-xl border transition-all ${
                      background === bg.id
                        ? 'border-amber-500 bg-amber-500/10 ring-1 ring-amber-500/50'
                        : 'border-gray-700 bg-gray-800/50 hover:border-gray-500 hover:bg-gray-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-lg font-bold ${background === bg.id ? 'text-amber-300' : 'text-gray-200'}`}>
                        {bg.name}
                      </span>
                      <div className="flex gap-1">
                        {Object.entries(bg.bonus).map(([k, v]) => (
                          <span key={k} className={`text-xs px-2 py-0.5 rounded-full ${
                            (v as number) > 1 ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'
                          }`}>
                            {getStatName(k)} {(v as number) > 1 ? '↑' : '↓'}
                          </span>
                        ))}
                      </div>
                    </div>
                    <p className="text-gray-400 text-sm mt-1">{bg.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 按钮 */}
          <div className="flex justify-between mt-8">
            <button
              onClick={() => setStep(Math.max(0, step - 1))}
              className={`px-6 py-3 rounded-xl text-gray-400 hover:text-gray-200 transition-all ${step === 0 ? 'invisible' : ''}`}
            >
              返回
            </button>
            <button
              onClick={handleNext}
              disabled={!canProceed}
              className={`px-8 py-3 rounded-xl font-bold text-lg transition-all ${
                canProceed
                  ? 'bg-amber-500 text-gray-900 hover:bg-amber-400 shadow-lg shadow-amber-500/25'
                  : 'bg-gray-700 text-gray-500 cursor-not-allowed'
              }`}
            >
              {step === 2 ? '踏入仙途' : '下一步'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function getElementEmoji(element: string): string {
  const map: Record<string, string> = {
    '金': '⚔️', '木': '🌿', '水': '💧', '火': '🔥', '土': '🛡️',
    '混沌': '🌀', '天': '⚡', '阴': '🌙',
  };
  return map[element] || '✨';
}

function getStatName(key: string): string {
  const map: Record<string, string> = {
    attack: '攻击', defense: '防御', speed: '速度', alchemy: '炼丹',
    crafting: '炼器', formation: '阵法', cultivation: '修炼', endurance: '心性',
    wealth: '财富', luck: '运气', darkArts: '邪术', karma: '因果',
    ambition: '野心', potential: '潜力', tribulation: '天劫',
    comprehension: '悟性',
  };
  return map[key] || key;
}
