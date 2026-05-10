import { useState } from 'react';
import { Header } from '@/components/Header';
import { SpeechButton } from '@/components/SpeechButton';
import { RecordButton } from '@/components/RecordButton';
import { PHONETIC_DATA } from '@/data/questions';
import { cn } from '@/lib/utils';

export function PhoneticPage() {
  const [activeTab, setActiveTab] = useState<'vowels' | 'consonants'>('vowels');
  const [selectedPhonetic, setSelectedPhonetic] = useState<{
    symbol: string;
    name: string;
    examples: string[];
  } | null>(null);
  const [showExamples, setShowExamples] = useState(false);

  const phonetics = activeTab === 'vowels' ? PHONETIC_DATA.vowels : PHONETIC_DATA.consonants;

  const handleSelectPhonetic = (phonetic: { symbol: string; name: string; examples: string[] }) => {
    setSelectedPhonetic(phonetic);
    setShowExamples(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-orange-100 pb-8">
      <Header showBack title="音标学习" />

      <div className="max-w-4xl mx-auto px-4 mt-4">
        {/* 标签切换 */}
        <div className="bg-white rounded-2xl p-2 shadow-warm mb-4">
          <div className="flex gap-2">
            <button
              onClick={() => {
                setActiveTab('vowels');
                setSelectedPhonetic(null);
                setShowExamples(false);
              }}
              className={cn(
                'flex-1 py-3 px-4 rounded-xl font-bold transition-all',
                activeTab === 'vowels'
                  ? 'bg-primary-500 text-white shadow-warm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              元音 Vowels
            </button>
            <button
              onClick={() => {
                setActiveTab('consonants');
                setSelectedPhonetic(null);
                setShowExamples(false);
              }}
              className={cn(
                'flex-1 py-3 px-4 rounded-xl font-bold transition-all',
                activeTab === 'consonants'
                  ? 'bg-primary-500 text-white shadow-warm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              辅音 Consonants
            </button>
          </div>
        </div>

        {/* 音标网格 */}
        <div className="bg-white rounded-2xl p-4 shadow-warm">
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
            {phonetics.map((phonetic, index) => (
              <button
                key={index}
                onClick={() => handleSelectPhonetic(phonetic)}
                className={cn(
                  'aspect-square rounded-xl flex flex-col items-center justify-center',
                  'font-bold text-xl transition-all duration-200',
                  'hover:scale-105 active:scale-95',
                  selectedPhonetic?.symbol === phonetic.symbol
                    ? 'bg-primary-500 text-white shadow-warm-lg'
                    : 'bg-orange-50 hover:bg-orange-100 text-primary-700'
                )}
              >
                <span className="text-2xl">{phonetic.symbol}</span>
                <span className="text-[10px] mt-1 opacity-70">{phonetic.name.split(' ')[0]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 示例展示 */}
        {showExamples && selectedPhonetic && (
          <div className="mt-4 bg-white rounded-2xl p-6 shadow-warm-lg card-pop">
            <div className="text-center mb-4">
              <span className="inline-block bg-primary-500 text-white text-4xl px-8 py-4 rounded-2xl font-bold">
                {selectedPhonetic.symbol}
              </span>
              <p className="mt-2 text-lg font-bold text-gray-700">{selectedPhonetic.name}</p>
            </div>

            <h3 className="text-center text-gray-600 mb-4">例词 Example Words</h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {selectedPhonetic.examples.map((word, index) => (
                <div
                  key={index}
                  className="bg-orange-50 rounded-xl p-4 flex flex-col items-center gap-2 hover:bg-orange-100 transition-colors"
                >
                  <span className="text-4xl">📖</span>
                  <span className="text-2xl font-bold text-primary-700">{word}</span>
                  <div className="flex items-center gap-2">
                    <SpeechButton text={word} size="lg" />
                    <RecordButton targetText={word} size="md" />
                  </div>
                </div>
              ))}
            </div>

            {/* 提示 */}
            <div className="mt-4 text-center text-sm text-gray-500">
              <p>💡 点击喇叭按钮听发音</p>
            </div>
          </div>
        )}

        {/* 学习提示 */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-2xl p-4">
          <h3 className="font-bold text-blue-800 mb-2">📝 学习小贴士</h3>
          <ul className="text-blue-700 text-sm space-y-1">
            <li>• 点击音标查看相关例词</li>
            <li>• 先听发音，再跟读练习</li>
            <li>• 注意元音的长短区别（如 iː 和 ɪ）</li>
            <li>• 多听多读，熟能生巧！</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
