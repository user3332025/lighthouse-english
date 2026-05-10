import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Volume2 } from 'lucide-react';
import { Header } from '@/components/Header';
import { GameHeader } from '@/components/ProgressBar';
import { SpeechButton } from '@/components/SpeechButton';
import { PetModal } from '@/components/PetModal';
import { WrongAnswerEncourageOverlay } from '@/components/WrongAnswerEncourageOverlay';
import { MATCHING_QUESTIONS } from '@/data/questions';
import { useUserData } from '@/hooks/useUserData';
import { useSpeech } from '@/hooks/useSpeech';
import { playCorrectSparkle, resumeAudioContext, unlockAudioFromButtonTap } from '@/lib/gameSfx';
import { shuffleArray, pickRandom } from '@/lib/utils';
import { cn } from '@/lib/utils';

type GameMode = 'word-to-picture' | 'audio-to-word' | 'picture-to-word';
type Topic = 'Animals' | 'Food' | 'School';

/**
 * 干扰项优先来自「另外两个主题」，再回本主题补一张，尽量避免同一题四个选项全是动物或全是食物。
 */
function pickCrossCategoryDistractorImages(
  excludeWord: string,
  correctImage: string,
  correctTopic: Topic,
  count: number
): string[] {
  const otherTopics = (['Animals', 'Food', 'School'] as Topic[]).filter((t) => t !== correctTopic);
  const out: string[] = [];
  const seen = new Set<string>([correctImage]);

  for (const t of shuffleArray(otherTopics)) {
    if (out.length >= count) break;
    const pool = shuffleArray(MATCHING_QUESTIONS[t]);
    const pick = pool.find((i) => i.word !== excludeWord && !seen.has(i.image));
    if (pick) {
      seen.add(pick.image);
      out.push(pick.image);
    }
  }

  if (out.length < count) {
    const pool = shuffleArray(
      MATCHING_QUESTIONS[correctTopic].filter((i) => i.word !== excludeWord && !seen.has(i.image))
    );
    for (const item of pool) {
      if (out.length >= count) break;
      seen.add(item.image);
      out.push(item.image);
    }
  }

  const fallback = shuffleArray([
    ...MATCHING_QUESTIONS.Animals,
    ...MATCHING_QUESTIONS.Food,
    ...MATCHING_QUESTIONS.School,
  ].filter((i) => i.word !== excludeWord));
  for (const item of fallback) {
    if (out.length >= count) break;
    if (!seen.has(item.image)) {
      seen.add(item.image);
      out.push(item.image);
    }
  }
  while (out.length < count && fallback.length > 0) {
    out.push(fallback[out.length % fallback.length].image);
  }
  return out.slice(0, count);
}

function pickCrossCategoryDistractorWords(
  excludeWord: string,
  correctWord: string,
  correctTopic: Topic,
  count: number
): string[] {
  const otherTopics = (['Animals', 'Food', 'School'] as Topic[]).filter((t) => t !== correctTopic);
  const out: string[] = [];
  const seen = new Set<string>([correctWord]);

  for (const t of shuffleArray(otherTopics)) {
    if (out.length >= count) break;
    const pool = shuffleArray(MATCHING_QUESTIONS[t]);
    const pick = pool.find((i) => !seen.has(i.word));
    if (pick) {
      seen.add(pick.word);
      out.push(pick.word);
    }
  }

  if (out.length < count) {
    const pool = shuffleArray(MATCHING_QUESTIONS[correctTopic].filter((i) => i.word !== excludeWord));
    for (const item of pool) {
      if (out.length >= count) break;
      if (!seen.has(item.word)) {
        seen.add(item.word);
        out.push(item.word);
      }
    }
  }

  const fallback = shuffleArray([
    ...MATCHING_QUESTIONS.Animals,
    ...MATCHING_QUESTIONS.Food,
    ...MATCHING_QUESTIONS.School,
  ].filter((i) => i.word !== excludeWord));
  for (const item of fallback) {
    if (out.length >= count) break;
    if (!seen.has(item.word)) {
      seen.add(item.word);
      out.push(item.word);
    }
  }
  while (out.length < count && fallback.length > 0) {
    out.push(fallback[out.length % fallback.length].word);
  }
  return out.slice(0, count);
}

export function MatchingPage() {
  const navigate = useNavigate();
  const { addPoints, addWrongQuestion, userData, PET_FACES } = useUserData();
  const { speakEnglish } = useSpeech();

  const [gameStarted, setGameStarted] = useState(false);
  const [selectedMode, setSelectedMode] = useState<GameMode | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);

  const [questions, setQuestions] = useState<typeof MATCHING_QUESTIONS.Animals>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'encourage' | 'correct'>('correct');
  const [gameOver, setGameOver] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [options, setOptions] = useState<string[]>([]);
  const [wrongEncourageOpen, setWrongEncourageOpen] = useState(false);

  const currentQuestion = questions[currentIndex];
  const petNormalEmoji = userData.adoptedPet
    ? PET_FACES[userData.adoptedPet as keyof typeof PET_FACES]?.normal
    : undefined;

  const dismissWrongEncourage = () => {
    setWrongEncourageOpen(false);
    setSelectedAnswer(null);
    setIsCorrect(null);
  };

  const startGame = () => {
    if (!selectedMode || !selectedTopic) return;

    const topicQuestions = MATCHING_QUESTIONS[selectedTopic];
    const selected = pickRandom(topicQuestions, 10);
    setQuestions(selected);

    // 生成选项
    generateOptions(selected[0]);

    setGameStarted(true);
    setCurrentIndex(0);
    setScore(0);
    setGameOver(false);
    setWrongEncourageOpen(false);
  };

  const generateOptions = (question: typeof MATCHING_QUESTIONS.Animals[0]) => {
    if (!selectedTopic) return;

    let correct: string;
    let options: string[];

    switch (selectedMode) {
      case 'word-to-picture':
        correct = question.image;
        options = pickCrossCategoryDistractorImages(question.word, correct, selectedTopic, 3);
        break;
      case 'audio-to-word':
        correct = question.word;
        options = pickCrossCategoryDistractorWords(question.word, correct, selectedTopic, 3);
        break;
      case 'picture-to-word':
        correct = question.word;
        options = pickCrossCategoryDistractorWords(question.word, correct, selectedTopic, 3);
        break;
      default:
        return;
    }

    setOptions(shuffleArray([correct, ...options]));
  };

  useEffect(() => {
    if (
      gameStarted &&
      !gameOver &&
      currentQuestion &&
      selectedMode === 'audio-to-word' &&
      userData.voiceEnabled
    ) {
      const id = window.setTimeout(() => {
        resumeAudioContext();
        try {
          window.speechSynthesis?.resume?.();
        } catch {
          /* ignore */
        }
        speakEnglish(currentQuestion.word);
      }, 300);
      return () => clearTimeout(id);
    }
  }, [
    gameStarted,
    gameOver,
    currentIndex,
    currentQuestion,
    selectedMode,
    userData.voiceEnabled,
    speakEnglish,
  ]);

  const handleSelectAnswer = (answer: string) => {
    if (selectedAnswer !== null) return;

    setSelectedAnswer(answer);
    const answerIsWord =
      selectedMode === 'picture-to-word' || selectedMode === 'audio-to-word';
    const correct = answer === (answerIsWord ? currentQuestion.word : currentQuestion.image);
    setIsCorrect(correct);

    if (correct) {
      resumeAudioContext();
      playCorrectSparkle();
      setScore(prev => prev + 10);
      addPoints(10);
      setModalType('correct');
      setShowModal(true);
    } else {
      const wid = `match-${selectedTopic}-${currentIndex}`;
      addWrongQuestion({
        id: wid,
        type: 'matching',
        question: {
          ...currentQuestion,
          id: wid,
          type: 'matching',
          correctAnswer: answerIsWord ? currentQuestion.word : currentQuestion.image,
        },
      });
      resumeAudioContext();
      try {
        window.speechSynthesis?.resume?.();
      } catch {
        /* ignore */
      }
      setWrongEncourageOpen(true);
    }
  };

  const handleNext = () => {
    setShowModal(false);
    setWrongEncourageOpen(false);
    setSelectedAnswer(null);
    setIsCorrect(null);

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      generateOptions(questions[currentIndex + 1]);
    } else {
      setGameOver(true);
    }
  };

  // 选择模式界面
  if (!gameStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary-50 to-orange-100 pb-8">
        <Header showBack title="拼写匹配" />

        <div className="max-w-4xl mx-auto px-4 mt-4">
          <div className="bg-white rounded-2xl p-6 shadow-warm">
            <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">🧩 选择游戏模式</h2>

            {/* 模式选择 */}
            <div className="grid grid-cols-1 gap-3 mb-6">
              {[
                { mode: 'word-to-picture' as GameMode, icon: '📖→🖼️', label: '看单词，选图片' },
                { mode: 'audio-to-word' as GameMode, icon: '🔊→📝', label: '听发音，选单词' },
                { mode: 'picture-to-word' as GameMode, icon: '🖼️→📝', label: '看图片，选单词' },
              ].map(({ mode, icon, label }) => (
                <button
                  key={mode}
                  onClick={() => setSelectedMode(mode)}
                  className={cn(
                    'p-4 rounded-xl border-2 text-left transition-all flex items-center gap-4',
                    selectedMode === mode
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-green-300'
                  )}
                >
                  <span className="text-3xl">{icon}</span>
                  <span className="font-medium">{label}</span>
                  {selectedMode === mode && <span className="ml-auto text-green-500">✓</span>}
                </button>
              ))}
            </div>

            {/* 主题选择 */}
            <h3 className="text-lg font-bold text-gray-700 mb-3">选择主题</h3>
            <div className="grid grid-cols-3 gap-3 mb-6">
              {(['Animals', 'Food', 'School'] as Topic[]).map(topic => (
                <button
                  key={topic}
                  onClick={() => setSelectedTopic(topic)}
                  className={cn(
                    'p-4 rounded-xl border-2 text-center transition-all',
                    selectedTopic === topic
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-green-300'
                  )}
                >
                  <span className="text-2xl block mb-1">
                    {topic === 'Animals' ? '🐾' : topic === 'Food' ? '🍎' : '📚'}
                  </span>
                  <span className="text-sm font-medium">{topic}</span>
                </button>
              ))}
            </div>

            {/* 开始按钮 */}
            <button
              onClick={startGame}
              disabled={!selectedMode || !selectedTopic}
              className={cn(
                'w-full py-4 rounded-xl font-bold text-white transition-all',
                selectedMode && selectedTopic
                  ? 'bg-green-500 hover:bg-green-600 shadow-warm'
                  : 'bg-gray-300 cursor-not-allowed'
              )}
            >
              开始游戏
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 游戏结束
  if (gameOver) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary-50 to-orange-100 pb-8">
        <Header showBack title="拼写匹配" />
        <div className="max-w-4xl mx-auto px-4 mt-8">
          <div className="bg-white rounded-2xl p-6 shadow-warm-lg text-center">
            <div className="text-6xl mb-4">🧩</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">拼写匹配完成！</h2>
            <div className="bg-green-50 rounded-xl p-4 mb-6">
              <p className="text-3xl font-bold text-green-600">得分：{score}</p>
              <p className="text-gray-500 text-sm">+{score} 积分</p>
            </div>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => navigate('/games')}
                className="w-full py-3 bg-primary-500 text-white font-bold rounded-xl hover:bg-primary-600"
              >
                返回游戏中心
              </button>
              <button
                onClick={() => {
                  setGameStarted(false);
                  setSelectedMode(null);
                  setSelectedTopic(null);
                }}
                className="w-full py-3 bg-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-300"
              >
                选择其他模式
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const optionsAreWords =
    selectedMode === 'picture-to-word' || selectedMode === 'audio-to-word';

  const getDisplayContent = () => {
    switch (selectedMode) {
      case 'word-to-picture':
        return (
          <div className="text-center mb-6">
            <p className="text-gray-600 mb-2">这是什么动物？</p>
            <div className="inline-block bg-blue-50 px-8 py-4 rounded-xl">
              <span className="text-3xl font-bold text-blue-700">{currentQuestion.word}</span>
            </div>
          </div>
        );
      case 'audio-to-word':
        return (
          <div className="text-center mb-6">
            <p className="text-gray-600 mb-2">听发音，点击下面的英文单词</p>
            <button
              onClick={() => {
                unlockAudioFromButtonTap();
                resumeAudioContext();
                speakEnglish(currentQuestion.word);
              }}
              className="w-16 h-16 rounded-full bg-blue-500 text-white flex items-center justify-center mx-auto hover:bg-blue-600"
            >
              <Volume2 className="w-8 h-8" />
            </button>
          </div>
        );
      case 'picture-to-word':
        return (
          <div className="text-center mb-6">
            <p className="text-gray-600 mb-2">这是什么？</p>
            <div className="text-7xl">{currentQuestion.image}</div>
          </div>
        );
    }
  };



  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-orange-100 pb-8">
      <Header showBack title="拼写匹配" />

      <div className="max-w-4xl mx-auto px-4 mt-4">
        <GameHeader
          currentQuestion={currentIndex + 1}
          totalQuestions={questions.length}
          score={score}
          showScore
        />

        <div className="mt-4 bg-white rounded-2xl p-6 shadow-warm">
          {getDisplayContent()}

          {/* 选项 */}
          <div className="grid grid-cols-2 gap-4">
            {options.map((option, index) => {
              const isSelected = selectedAnswer === option;

              return (
                <div
                  key={index}
                  className={cn(
                    'rounded-2xl flex flex-col items-center gap-3 border-4 transition-all duration-300',
                    optionsAreWords
                      ? 'px-4 py-4'
                      : 'aspect-square justify-center',
                    selectedAnswer === null && 'bg-green-50 border-green-200',
                    isSelected && isCorrect && 'bg-green-100 border-green-500 correct-animation',
                    isSelected && !isCorrect && 'bg-amber-50 border-amber-500 wrong-soft-shake'
                  )}
                >
                  <button
                    onClick={() => handleSelectAnswer(option)}
                    disabled={selectedAnswer !== null}
                    type="button"
                    className={cn(
                      'w-full flex items-center justify-center transition-all',
                      optionsAreWords
                        ? 'min-h-[3rem]'
                        : 'text-5xl',
                      selectedAnswer === null && 'hover:scale-105'
                    )}
                  >
                    {optionsAreWords ? (
                      <span className="text-lg sm:text-xl font-bold text-gray-800 text-center leading-snug break-words">
                        {option}
                      </span>
                    ) : (
                      <span>{option}</span>
                    )}
                  </button>
                  
                  {/* 独立的听按钮 - 与选项操作分开 */}
                  {optionsAreWords && selectedAnswer === null && (
                    <div className="flex items-center gap-2">
                      <SpeechButton text={option} size="sm" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* 操作按钮 */}
          {selectedAnswer !== null && isCorrect && (
            <div className="mt-6 text-center">
              <button
                onClick={handleNext}
                className="px-8 py-3 bg-green-500 text-white font-bold rounded-full hover:bg-green-600 shadow-warm"
              >
                下一题 →
              </button>
            </div>
          )}
        </div>
      </div>

      <WrongAnswerEncourageOverlay
        open={wrongEncourageOpen}
        petEmoji={petNormalEmoji}
        onDismiss={dismissWrongEncourage}
      />

      <PetModal
        isOpen={showModal}
        onClose={isCorrect ? handleNext : () => setShowModal(false)}
        type={modalType}
        petType={userData.adoptedPet || 'dog'}
      />
    </div>
  );
}
