import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { SpeechButton } from '@/components/SpeechButton';
import { WORD_LEARNING_DATA, Book, Unit } from '@/data/wordLearning';
import { cn } from '@/lib/utils';
import { BookOpen, CheckCircle, Star, Mic, Square, Volume2, RotateCw, Play, Pause, Trophy } from 'lucide-react';
import { useSpeech } from '@/hooks/useSpeech';
import { useUserData } from '@/hooks/useUserData';
import { resumeAudioContext } from '@/lib/gameSfx';
import { AudioRecorder, Recording, RecordingState, RecordingQuality } from '../lib/AudioRecorder';
import { AudioComparator, AudioComparisonResult } from '../lib/AudioComparator';

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
  const [recorderState, setRecorderState] = useState<RecordingState>('idle');
  const [currentRecording, setCurrentRecording] = useState<Recording | null>(null);
  const [comparisonResult, setComparisonResult] = useState<AudioComparisonResult | null>(null);
  const [recordingQuality, setRecordingQuality] = useState<RecordingQuality>({
    volumeLevel: 'normal',
    clarity: 100,
    hasSpeech: false,
    issues: []
  });
  const [audioData, setAudioData] = useState<Uint8Array | null>(null);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [isPlayingOwn, setIsPlayingOwn] = useState(false);
  const { speakEnglish, stop: stopSpeech, isSupported: speechSupported } = useSpeech();
  const { userData, addMarkedWord, removeMarkedWord, isWordMarked } = useUserData();

  const recorderRef = useRef<AudioRecorder | null>(null);
  const comparatorRef = useRef<AudioComparator | null>(null);
  const ownAudioRef = useRef<HTMLAudioElement | null>(null);

  const currentWord = unit.words[currentIndex];
  
  const isMarked = isWordMarked(currentWord.word, textbookId, unit.id);

  useEffect(() => {
    recorderRef.current = new AudioRecorder({
      minRecordingDuration: 500,
      maxRecordingDuration: 5000,
      autoStopSilenceDuration: 1500
    });
    comparatorRef.current = new AudioComparator();

    recorderRef.current.onStateChange = (state) => setRecorderState(state);
    recorderRef.current.onDurationChange = () => {};
    recorderRef.current.onVolumeChange = (level) => setVolumeLevel(level);
    recorderRef.current.onDataAvailable = (data) => setAudioData(data);
    recorderRef.current.onQualityChange = (q) => setRecordingQuality(q);
    recorderRef.current.onSilenceDetected = handleSilenceDetected;
    recorderRef.current.onError = (error) => {
      alert('录音出错：' + error);
    };

    return () => {
      recorderRef.current?.destroy();
    };
  }, []);

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
      resetRecording();
    }
  };

  const prevWord = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      resetRecording();
    }
  };

  const resetRecording = useCallback(() => {
    setRecorderState('idle');
    setCurrentRecording(null);
    setComparisonResult(null);
    setAudioData(null);
    setVolumeLevel(0);
    if (ownAudioRef.current) {
      ownAudioRef.current.pause();
    }
    setIsPlayingOwn(false);
  }, []);

  const handleSilenceDetected = useCallback(() => {
    if (recorderState === 'recording') {
      stopRecording();
    }
  }, [recorderState]);

  const startRecording = async () => {
    if (!recorderRef.current) return;
    resetRecording();
    await recorderRef.current.start();
  };

  const stopRecording = async () => {
    if (!recorderRef.current) return;
    
    try {
      const recording = await recorderRef.current.stop();
      const recordingWithText = { ...recording, targetText: currentWord.word };
      setCurrentRecording(recordingWithText);

      const result = await comparatorRef.current!.compareAudio(
        recording.url,
        undefined,
        currentWord.word
      );

      setComparisonResult(result);
      
      if (result.similarity && (result.similarity >= 80) && !learnedWords.includes(currentWord.word)) {
        markAsLearned(currentWord.word);
      }

    } catch (error) {
      console.error('录音失败:', error);
      alert('录音失败，请重试');
    }
  };

  const playOwnRecording = () => {
    if (!currentRecording) return;
    
    if (isPlayingOwn && ownAudioRef.current) {
      ownAudioRef.current.pause();
      setIsPlayingOwn(false);
    } else if (ownAudioRef.current) {
      ownAudioRef.current.play().catch(() => {});
      setIsPlayingOwn(true);
    }
  };

  const getScoreColor = (score?: number) => {
    if (!score) return 'text-gray-600';
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBg = (score?: number) => {
    if (!score) return 'bg-gray-50';
    if (score >= 80) return 'bg-green-50';
    if (score >= 60) return 'bg-yellow-50';
    return 'bg-red-50';
  };

  const getScoreFeedback = (score?: number) => {
    if (!score) return { emoji: '🤔', text: '加油！' };
    if (score >= 90) return { emoji: '🎉', text: '太棒了！完美发音！' };
    if (score >= 70) return { emoji: '👍', text: '很好！继续努力！' };
    if (score >= 50) return { emoji: '💪', text: '不错，再试一次！' };
    return { emoji: '🔄', text: '再试一次！' };
  };

  const feedback = comparisonResult?.similarity ? getScoreFeedback(comparisonResult.similarity) : null;

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

        {/* 发音练习区域 */}
        <div className="bg-gradient-to-br from-orange-50 to-pink-50 rounded-2xl p-6 mb-6">
          <p className="text-center text-gray-600 mb-4 font-medium">🎤 发音练习</p>
          
          <div className="flex flex-col items-center gap-4">
            <div className="flex flex-wrap justify-center gap-4">
              <button
                onClick={() => speakEnglish(currentWord.word)}
                className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white flex items-center justify-center hover:shadow-lg transform hover:scale-105 transition-all"
                title="听标准发音"
              >
                <Volume2 className="w-8 h-8" />
              </button>

              {recorderState === 'idle' && !comparisonResult && (
                <button
                  onClick={startRecording}
                  className="w-16 h-16 rounded-full bg-gradient-to-r from-orange-400 to-pink-500 text-white flex items-center justify-center hover:shadow-lg transform hover:scale-105 transition-all"
                  title="开始录音"
                >
                  <Mic className="w-8 h-8" />
                </button>
              )}

              {recorderState === 'recording' && (
                <button
                  onClick={stopRecording}
                  className="w-16 h-16 rounded-full bg-gradient-to-r from-red-500 to-pink-600 text-white flex items-center justify-center hover:shadow-lg transform hover:scale-105 transition-all"
                  title="停止录音"
                >
                  <Square className="w-8 h-8" />
                </button>
              )}

              {comparisonResult && currentRecording && (
                <button
                  onClick={playOwnRecording}
                  className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white flex items-center justify-center hover:shadow-lg transform hover:scale-105 transition-all"
                  title="听自己的录音"
                >
                  {isPlayingOwn ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8" />}
                </button>
              )}
            </div>

            {/* 录音状态动画 */}
            {recorderState === 'recording' && (
              <div className="w-full max-w-xs">
                <div className="flex items-end justify-center gap-1 h-16 mb-4">
                  {[...Array(15)].map((_, i) => {
                    const height = Math.max(20, Math.random() * volumeLevel * 120);
                    return (
                      <div
                        key={i}
                        className="w-2 md:w-3 rounded-full bg-gradient-to-t from-orange-400 to-pink-500 animate-pulse"
                        style={{ height: `${height}%`, animationDelay: `${i * 50}ms` }}
                      />
                    );
                  })}
                </div>

                {audioData && (
                  <div className="flex items-end justify-center gap-1 h-12">
                    {[...Array(20)].map((_, i) => {
                      const sample = audioData[Math.floor(i * audioData.length / 20)] || 0;
                      const height = Math.max(10, (sample / 255) * 100);
                      return (
                        <div
                          key={i}
                          className="w-1.5 rounded-full bg-gradient-to-t from-purple-400 to-pink-400"
                          style={{ height: `${height}%` }}
                        />
                      );
                    })}
                  </div>
                )}

                {recordingQuality.issues.length > 0 && (
                  <div className="text-orange-500 text-sm text-center mt-2">
                    {recordingQuality.issues[0] === '音量过低' && '🔊 声音再大一点！'}
                    {recordingQuality.issues[0] === '音量过高' && '🔊 声音小一点点！'}
                    {recordingQuality.issues[0] === '声音不够清晰' && '💬 说话再清楚一点！'}
                  </div>
                )}
              </div>
            )}

            {/* 发音评测结果 */}
            {comparisonResult && (
              <div className={`w-full max-w-xs rounded-2xl p-4 ${getScoreBg(comparisonResult.similarity)}`}>
                {feedback && (
                  <div className="text-center">
                    <div className="text-5xl mb-2">{feedback.emoji}</div>
                    <div className={`text-4xl font-bold ${getScoreColor(comparisonResult.similarity)} mb-2`}>
                      {comparisonResult.similarity || 0}分
                    </div>
                    <p className={`text-lg font-medium ${getScoreColor(comparisonResult.similarity)}`}>
                      {feedback.text}
                    </p>
                  </div>
                )}

                {comparisonResult.recognizedText && (
                  <div className="text-center mt-3 text-gray-600">
                    <p className="text-sm">你读的是：</p>
                    <p className="text-xl font-bold text-blue-600">{comparisonResult.recognizedText}</p>
                  </div>
                )}

                {comparisonResult.recommendations.length > 0 && (
                  <div className="text-center mt-3 text-sm text-yellow-700">
                    💡 {comparisonResult.recommendations[comparisonResult.recommendations.length - 1]}
                  </div>
                )}

                <div className="flex gap-2 mt-4">
                  <button
                    onClick={resetRecording}
                    className="flex-1 py-3 rounded-full bg-gray-200 text-gray-700 font-medium flex items-center justify-center gap-2 hover:bg-gray-300 transition-colors"
                  >
                    <RotateCw className="w-5 h-5" />
                    再试一次
                  </button>
                  {comparisonResult.similarity && comparisonResult.similarity >= 80 && currentIndex < unit.words.length - 1 && (
                    <button
                      onClick={nextWord}
                      className="flex-1 py-3 rounded-full bg-green-500 text-white font-medium flex items-center justify-center gap-2 hover:bg-green-600 transition-colors"
                    >
                      <Trophy className="w-5 h-5" />
                      下一个
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 标记按钮 */}
        <div className="flex justify-center gap-4">
          <button
            onClick={toggleMarkWord}
            className={cn(
              'px-6 py-3 rounded-full transition-all flex items-center gap-2',
              isMarked
                ? 'bg-yellow-400 text-white'
                : 'bg-yellow-100 text-yellow-500 hover:bg-yellow-200'
            )}
          >
            <Star className={cn('w-5 h-5', isMarked && 'fill-current')} />
            {isMarked ? '已标记' : '标记重点词'}
          </button>
          <button
            onClick={() => markAsLearned(currentWord.word)}
            className={cn(
              'px-6 py-3 rounded-full font-bold transition-all flex items-center gap-2',
              learnedWords.includes(currentWord.word)
                ? 'bg-green-500 text-white'
                : 'bg-gray-200 text-gray-600 hover:bg-green-100'
            )}
          >
            <CheckCircle className="w-5 h-5" />
            {learnedWords.includes(currentWord.word) ? '✓ 已掌握' : '标记为已学'}
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
              onClick={() => {
                setCurrentIndex(index);
                resetRecording();
              }}
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

      {/* 隐藏的音频元素 */}
      {currentRecording && (
        <audio
          ref={ownAudioRef}
          src={currentRecording.url}
          onEnded={() => setIsPlayingOwn(false)}
          onError={() => setIsPlayingOwn(false)}
        />
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
