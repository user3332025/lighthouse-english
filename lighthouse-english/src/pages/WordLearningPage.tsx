import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { SpeechButton } from '@/components/SpeechButton';
import { RecordButton, type EncouragementTier } from '@/components/RecordButton';
import { WORD_LEARNING_DATA, Book, Unit } from '@/data/wordLearning';
import { cn } from '@/lib/utils';
import { BookOpen, CheckCircle, Star } from 'lucide-react';
import { useSpeech } from '@/hooks/useSpeech';
import { useUserData } from '@/hooks/useUserData';
import { resumeAudioContext } from '@/lib/gameSfx';

type ViewMode = 'book-list' | 'unit-list' | 'word-list';

/** 单元标题中的英文主题：`Unit 1 Making friends` 或旧版 `中文 (English)` */
function getUnitTopicEnglish(title: string): string {
  const unitStyle = title.match(/^Unit\s+\d+\s+(.+)$/i);
  if (unitStyle) return unitStyle[1].trim();
  const paren = title.match(/\(([^)]+)\)/);
  return paren ? paren[1].trim() : '';
}

// 书籍选择页面
function BookListView({ onSelectBook }: { onSelectBook: (book: Book) => void }) {
  return (
    <div className="max-w-4xl mx-auto px-4">
      <h2 className="text-xl font-bold text-gray-800 mb-6 text-center">📚 选择课本</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {WORD_LEARNING_DATA.books.map((book) => (
          <button
            key={book.id}
            onClick={() => onSelectBook(book)}
            className={cn(
              'bg-white rounded-2xl p-6 shadow-warm-lg transition-all duration-300',
              'hover:scale-105 hover:shadow-warm-xl active:scale-95',
              'flex flex-col items-center gap-4'
            )}
          >
            <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-purple-500 rounded-2xl flex items-center justify-center">
              <BookOpen className="w-10 h-10 text-white" />
            </div>
            <div className="text-center">
              <h3 className="text-xl font-bold text-gray-800">{book.title}</h3>
              <p className="text-sm text-gray-400 mt-2">{book.units.length} 个单元</p>
            </div>
            <div className="flex flex-wrap justify-center gap-2 mt-2">
              {book.units.map((unit) => (
                <span
                  key={unit.id}
                  className="px-2 py-1 bg-blue-100 text-blue-600 rounded-full text-xs font-medium"
                >
                  单元{unit.id}
                </span>
              ))}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// 单元列表页面
function UnitListView({ 
  book, 
  textbookId,
  onSelectUnit, 
  onBack 
}: { 
  book: Book; 
  textbookId: string;
  onSelectUnit: (unit: Unit, textbookId: string) => void; 
  onBack: () => void;
}) {
  return (
    <div className="max-w-4xl mx-auto px-4">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={onBack}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 transition-colors"
        >
          ← 返回
        </button>
        <div>
          <h2 className="text-xl font-bold text-gray-800">{book.title}</h2>
          <p className="text-gray-500 text-sm">选择要学习的单元</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {book.units.map((unit) => {
          const topic = getUnitTopicEnglish(unit.title);

          return (
            <button
              key={unit.id}
              onClick={() => onSelectUnit(unit, textbookId)}
              className={cn(
                'bg-white rounded-xl p-4 shadow-warm transition-all duration-300',
                'hover:scale-105 hover:shadow-warm-lg active:scale-95',
                'flex flex-col items-center gap-2'
              )}
            >
              <div className="w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                <span className="text-2xl">{unit.id}</span>
              </div>
              <div className="text-center mt-2">
                <p className="font-bold text-gray-800 text-sm">单元 {unit.id}</p>
                {topic && <p className="text-xs text-primary-600 mt-1">{topic}</p>}
                <p className="text-xs text-gray-500 mt-1">{unit.words.length} 个单词</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// 单词学习页面
function WordListView({ 
  unit, 
  textbookId,
  onBack 
}: { 
  unit: Unit; 
  textbookId: string;
  onBack: () => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [learnedWords, setLearnedWords] = useState<string[]>([]);
  const [showAll, setShowAll] = useState(false);
  const { speakEnglish, stop: stopSpeech, isSupported: speechSupported } = useSpeech();
  const { userData, addMarkedWord, removeMarkedWord, isWordMarked } = useUserData();

  const currentWord = unit.words[currentIndex];
  
  const isMarked = isWordMarked(currentWord.word, textbookId, unit.id);

  const toggleMarkWord = () => {
    if (isMarked) {
      removeMarkedWord(currentWord.word, textbookId, unit.id);
    } else {
      addMarkedWord(currentWord.word, textbookId, unit.id, currentWord.meaning, currentWord.phonetic || '');
    }
  };

  // 进入新词：自动朗读标准音（辅助）；录音不再依赖 TTS 回调，避免无声环境下永远无法跟读
  useEffect(() => {
    let cancelled = false;
    let speakDelayTimer: ReturnType<typeof setTimeout> | null = null;

    const clearTimers = () => {
      if (speakDelayTimer != null) {
        clearTimeout(speakDelayTimer);
        speakDelayTimer = null;
      }
    };

    if (!userData.voiceEnabled || !speechSupported) {
      return () => {
        cancelled = true;
        clearTimers();
      };
    }

    speakDelayTimer = setTimeout(() => {
      if (cancelled) return;
      resumeAudioContext();
      try {
        window.speechSynthesis?.resume?.();
      } catch {
        /* ignore */
      }
      speakEnglish(currentWord.word);
    }, 200);

    return () => {
      cancelled = true;
      clearTimers();
      stopSpeech();
    };
  }, [
    currentIndex,
    currentWord.word,
    userData.voiceEnabled,
    speechSupported,
    speakEnglish,
    stopSpeech,
  ]);
  const progress = ((currentIndex + 1) / unit.words.length) * 100;

  const markAsLearned = (word: string) => {
    if (!learnedWords.includes(word)) {
      setLearnedWords([...learnedWords, word]);
    }
  };

  const nextWord = () => {
    if (currentIndex < unit.words.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const prevWord = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  // 显示所有单词列表
  if (showAll) {
    return (
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => setShowAll(false)}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 transition-colors"
          >
            ← 返回学习
          </button>
          <h2 className="text-lg font-bold text-gray-800">全部单词</h2>
          <div className="w-24"></div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-warm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {unit.words.map((word, index) => (
              <div
                key={index}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-xl',
                  learnedWords.includes(word.word) ? 'bg-green-50' : 'bg-gray-50'
                )}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-primary-600">{word.word}</span>
                    {word.image && <span className="text-2xl">{word.image}</span>}
                    {isWordMarked(word.word, textbookId, unit.id) && (
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    )}
                  </div>
                  <p className="text-gray-500 text-sm">{word.meaning}</p>
                  {word.phonetic && (
                    <p className="text-gray-400 text-xs">{word.phonetic}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <SpeechButton text={word.word} size="sm" />
                  <button
                    onClick={() => {
                      if (isWordMarked(word.word, textbookId, unit.id)) {
                        removeMarkedWord(word.word, textbookId, unit.id);
                      } else {
                        addMarkedWord(word.word, textbookId, unit.id, word.meaning, word.phonetic || '');
                      }
                    }}
                    className={cn(
                      'p-2 rounded-full transition-colors',
                      isWordMarked(word.word, textbookId, unit.id)
                        ? 'bg-yellow-400 text-white'
                        : 'bg-gray-200 text-gray-500 hover:bg-yellow-100'
                    )}
                  >
                    <Star className={cn('w-5 h-5', isWordMarked(word.word, textbookId, unit.id) && 'fill-current')} />
                  </button>
                  <button
                    onClick={() => markAsLearned(word.word)}
                    className={cn(
                      'p-2 rounded-full transition-colors',
                      learnedWords.includes(word.word)
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-500 hover:bg-green-100'
                    )}
                  >
                    <CheckCircle className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4">
      {/* 顶部导航 */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onBack}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 transition-colors"
        >
          ← 返回
        </button>
        <button
          onClick={() => setShowAll(true)}
          className="px-4 py-2 bg-purple-100 text-purple-700 rounded-full hover:bg-purple-200 transition-colors text-sm"
        >
          查看全部 {unit.words.length} 个单词
        </button>
      </div>

      {/* 进度条 */}
      <div className="bg-white rounded-xl p-3 shadow-warm mb-4">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>单词 {currentIndex + 1} / {unit.words.length}</span>
          <span className="text-green-600">已学 {learnedWords.length} 个</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="h-full bg-gradient-to-r from-primary-500 to-green-500 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* 单词卡片 */}
      <div className="bg-white rounded-2xl p-6 shadow-warm-lg">
        {currentWord.image && (
          <div className="text-center mb-4">
            <span className="text-8xl">{currentWord.image}</span>
          </div>
        )}

        <div className="text-center mb-6">
          <h2 className="text-4xl font-bold text-primary-600 mb-2">{currentWord.word}</h2>
          {currentWord.phonetic && (
            <p className="text-xl text-gray-500 mb-2">{currentWord.phonetic}</p>
          )}
          <p className="text-2xl text-gray-700">{currentWord.meaning}</p>
        </div>

        {/* 例句 */}
        {currentWord.example && (
          <div className="bg-blue-50 rounded-xl p-4 mb-6">
            <p className="text-gray-600 text-center">
              <span className="text-gray-400 text-sm">例句：</span>
              <br />
              <span className="text-lg">{currentWord.example}</span>
            </p>
          </div>
        )}

        <p className="text-center text-sm text-gray-600 mb-3">
          可先点喇叭听标准读音，再点麦克风跟读；结束后会给出英文鼓励
        </p>

        {/* 操作按钮 */}
        <div className="flex flex-wrap justify-center items-center gap-4 mb-3">
          <SpeechButton text={currentWord.word} size="lg" />
          <RecordButton
            targetText={currentWord.word}
            size="lg"
            feedbackStyle="encouragement"
            onNext={nextWord}
            onEncouragement={(tier: EncouragementTier) => {
              if (
                (tier === 'excellent' || tier === 'well') &&
                !learnedWords.includes(currentWord.word)
              ) {
                markAsLearned(currentWord.word);
              }
            }}
          />
          <button
            onClick={toggleMarkWord}
            className={cn(
              'p-3 rounded-full transition-all',
              isMarked
                ? 'bg-yellow-400 text-white'
                : 'bg-yellow-100 text-yellow-500 hover:bg-yellow-200'
            )}
            title={isMarked ? '取消标记' : '标记为重点词'}
          >
            <Star className={cn('w-6 h-6', isMarked && 'fill-current')} />
          </button>
        </div>

        {/* 已学标记 */}
        <div className="text-center">
          <button
            onClick={() => markAsLearned(currentWord.word)}
            className={cn(
              'px-6 py-3 rounded-full font-bold transition-all',
              learnedWords.includes(currentWord.word)
                ? 'bg-green-500 text-white'
                : 'bg-gray-200 text-gray-600 hover:bg-green-100'
            )}
          >
            {learnedWords.includes(currentWord.word) ? '✓ 已掌握' : '点击标记为已学'}
          </button>
        </div>
      </div>

      {/* 导航按钮 */}
      <div className="flex justify-between items-center mt-6">
        <button
          onClick={prevWord}
          disabled={currentIndex === 0}
          className={cn(
            'px-6 py-3 rounded-full font-bold transition-all',
            currentIndex === 0
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-primary-500 text-white hover:bg-primary-600'
          )}
        >
          ← 上一个
        </button>
        
        <div className="flex gap-1">
          {unit.words.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={cn(
                'w-3 h-3 rounded-full transition-all',
                index === currentIndex ? 'bg-primary-500' : 
                learnedWords.includes(unit.words[index].word) ? 'bg-green-400' : 'bg-gray-300'
              )}
            />
          ))}
        </div>

        <button
          onClick={nextWord}
          disabled={currentIndex === unit.words.length - 1}
          className={cn(
            'px-6 py-3 rounded-full font-bold transition-all',
            currentIndex === unit.words.length - 1
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-primary-500 text-white hover:bg-primary-600'
          )}
        >
          下一个 →
        </button>
      </div>

      {/* 学习完成提示 */}
      {learnedWords.length === unit.words.length && (
        <div className="mt-6 bg-green-100 border border-green-300 rounded-2xl p-6 text-center">
          <p className="text-2xl mb-2">🎉</p>
          <p className="text-green-700 font-bold text-lg">恭喜！你已学完本单元所有单词！</p>
        </div>
      )}
    </div>
  );
}

// 主组件
export function WordLearningPage() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>('book-list');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);

  const handleSelectBook = (book: Book) => {
    setSelectedBook(book);
    setViewMode('unit-list');
  };

  const handleSelectUnit = (unit: Unit, textbookId: string) => {
    setSelectedUnit(unit);
    setSelectedBook(prev => prev ? { ...prev, id: textbookId } : null);
    setViewMode('word-list');
  };

  const handleBack = () => {
    if (viewMode === 'word-list') {
      setViewMode('unit-list');
      setSelectedUnit(null);
    } else if (viewMode === 'unit-list') {
      setViewMode('book-list');
      setSelectedBook(null);
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-orange-100 pb-8">
      <Header showBack title="单词学习" />

      <div className="mt-4">
        {viewMode === 'book-list' && (
          <BookListView onSelectBook={handleSelectBook} />
        )}
        
        {viewMode === 'unit-list' && selectedBook && (
          <UnitListView 
            book={selectedBook} 
            textbookId={selectedBook.id}
            onSelectUnit={handleSelectUnit} 
            onBack={handleBack}
          />
        )}
        
        {viewMode === 'word-list' && selectedUnit && selectedBook && (
          <WordListView 
            unit={selectedUnit} 
            textbookId={selectedBook.id}
            onBack={handleBack}
          />
        )}
      </div>

      {/* 学习提示 */}
      <div className="max-w-4xl mx-auto px-4 mt-8">
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
          <h3 className="font-bold text-blue-800 mb-2">📖 学习小贴士</h3>
          <ul className="text-blue-700 text-sm space-y-1">
            <li>• 选好课本和单元，听发音、跟读后点「已掌握」</li>
            <li>• 跟读建议用 Chrome；用浏览器地址栏打开页面（不要用双击本地文件）</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
