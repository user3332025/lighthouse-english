import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { GameHeader } from '@/components/ProgressBar';
import { SpeechButton } from '@/components/SpeechButton';
import { RecordButton } from '@/components/RecordButton';
import { PetModal } from '@/components/PetModal';
import { TextbookSemesterPicker } from '@/components/TextbookSemesterPicker';
import { TextbookUnitPicker } from '@/components/TextbookUnitPicker';
import { WrongAnswerEncourageOverlay } from '@/components/WrongAnswerEncourageOverlay';
import {
  getSentenceQuestionsForSemesterAndUnit,
  getSentenceUnitsForSemester,
} from '@/data/questions';
import { GRADE_3A, GRADE_3B } from '@/data/wordLearning';
import { useUserData } from '@/hooks/useUserData';
import { useSpeech } from '@/hooks/useSpeech';
import { playCorrectSparkle, resumeAudioContext } from '@/lib/gameSfx';
import { shuffleArray } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { SentenceQuestion, TextbookSemesterId } from '@/types';

function buildSentenceSession(pool: SentenceQuestion[]) {
  const picked = shuffleArray(pool).slice(0, 8);
  return picked.map((q) => ({
    ...q,
    options: shuffleArray(q.options),
  }));
}

export function SentencePage() {
  const navigate = useNavigate();
  const { addPoints, addWrongQuestion, userData, PET_FACES } = useUserData();
  const { stop: stopSpeech } = useSpeech();

  const [semester, setSemester] = useState<TextbookSemesterId | null>(null);
  const [unit, setUnit] = useState<number | null>(null);
  const [questions, setQuestions] = useState<ReturnType<typeof buildSentenceSession>>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'encourage' | 'correct'>('correct');
  const [gameOver, setGameOver] = useState(false);
  const [wrongEncourageOpen, setWrongEncourageOpen] = useState(false);

  const startUnitSession = useCallback((bookId: TextbookSemesterId, unitNum: number) => {
    const pool = getSentenceQuestionsForSemesterAndUnit(bookId, unitNum);
    if (pool.length === 0) {
      alert('该单元暂无句型题目，请换其它单元。');
      return;
    }
    setQuestions(buildSentenceSession(pool));
    setSemester(bookId);
    setUnit(unitNum);
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setIsCorrect(null);
    setScore(0);
    setShowModal(false);
    setGameOver(false);
    setWrongEncourageOpen(false);
  }, []);

  const currentQuestion = questions[currentIndex];
  const petNormalEmoji = userData.adoptedPet
    ? PET_FACES[userData.adoptedPet as keyof typeof PET_FACES]?.normal
    : undefined;

  const dismissWrongEncourage = () => {
    setWrongEncourageOpen(false);
    setSelectedAnswer(null);
    setIsCorrect(null);
  };

  // 进入本页或换题时打断其他模块遗留的朗读；本页不自动播语音，避免误播英文或泄题
  useEffect(() => {
    stopSpeech();
    return () => stopSpeech();
  }, [currentIndex, currentQuestion, stopSpeech]);

  const handleSelectAnswer = (answer: string) => {
    if (selectedAnswer !== null) return; // 防止重复选择

    setSelectedAnswer(answer);
    const correct = answer === currentQuestion.correctAnswer;
    setIsCorrect(correct);

    if (correct) {
      resumeAudioContext();
      playCorrectSparkle();
      setScore(prev => prev + 10);
      addPoints(10);
      setModalType('correct');
      setShowModal(true);
    } else {
      addWrongQuestion({
        id: currentQuestion.id,
        type: 'sentence',
        question: { ...currentQuestion, id: currentQuestion.id, type: 'sentence' },
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
    } else {
      setGameOver(true);
    }
  };

  const handleRetry = () => {
    setShowModal(false);
    setWrongEncourageOpen(false);
    setSelectedAnswer(null);
    setIsCorrect(null);
  };

  if (!semester) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary-50 to-orange-100 pb-8">
        <Header showBack title="句型练习" />
        <TextbookSemesterPicker moduleTitle="句型练习" onSelect={(id) => setSemester(id)} />
      </div>
    );
  }

  if (unit == null) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary-50 to-orange-100 pb-8">
        <Header showBack title="句型练习" />
        <TextbookUnitPicker
          semester={semester}
          unitNumbers={getSentenceUnitsForSemester(semester)}
          onBack={() => setSemester(null)}
          onSelectUnit={(u) => startUnitSession(semester, u)}
        />
      </div>
    );
  }

  if (gameOver) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary-50 to-orange-100 pb-8">
        <Header showBack title="句型练习" />
        <div className="max-w-4xl mx-auto px-4 mt-8">
          <div className="bg-white rounded-2xl p-6 shadow-warm-lg text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">太棒了！</h2>
            <p className="text-gray-600 mb-4">你完成了句型练习！</p>
            <div className="bg-orange-50 rounded-xl p-4 mb-6">
              <p className="text-3xl font-bold text-primary-600">得分：{score}</p>
              <p className="text-gray-500 text-sm">+{score} 积分已到账</p>
            </div>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => navigate('/')}
                className="w-full py-3 bg-primary-500 text-white font-bold rounded-xl hover:bg-primary-600 transition-colors"
              >
                返回首页
              </button>
              <button
                onClick={() => {
                  if (semester != null && unit != null) {
                    const pool = getSentenceQuestionsForSemesterAndUnit(semester, unit);
                    setQuestions(buildSentenceSession(pool));
                  }
                  setCurrentIndex(0);
                  setScore(0);
                  setGameOver(false);
                  setWrongEncourageOpen(false);
                  setSelectedAnswer(null);
                  setIsCorrect(null);
                }}
                className="w-full py-3 bg-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-300 transition-colors"
              >
                再来一次
              </button>
              <button
                type="button"
                onClick={() => {
                  setGameOver(false);
                  setUnit(null);
                  setScore(0);
                  setWrongEncourageOpen(false);
                  setSelectedAnswer(null);
                  setIsCorrect(null);
                }}
                className="w-full py-3 bg-white border-2 border-primary-200 text-primary-700 font-bold rounded-xl hover:bg-primary-50 transition-colors"
              >
                换单元
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-orange-100 pb-8">
      <Header showBack title="句型练习" />

      <div className="max-w-4xl mx-auto px-4 mt-2">
        <p className="text-center text-sm text-gray-500 mb-1">
          {semester === 'grade3a' ? '三年级上册' : '三年级下册'}
          {unit != null ? ` · 单元 ${unit}` : ''}
        </p>
        {unit != null && (
          <p className="text-center text-xs text-primary-600 mb-2">
            {(semester === 'grade3a' ? GRADE_3A : GRADE_3B).units.find((x) => x.id === unit)?.title ?? ''}
          </p>
        )}
        <div className="text-center mb-2">
          <button
            type="button"
            onClick={() => {
              setUnit(null);
              setQuestions([]);
              setCurrentIndex(0);
              setSelectedAnswer(null);
              setIsCorrect(null);
              setScore(0);
              setWrongEncourageOpen(false);
            }}
            className="text-xs text-gray-400 hover:text-primary-600 underline"
          >
            重新选单元
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 mt-4">
        {/* 游戏头部 */}
        <GameHeader
          currentQuestion={currentIndex + 1}
          totalQuestions={questions.length}
          score={score}
          showScore
        />

        {/* 题目卡片 */}
        <div className="mt-4 bg-white rounded-2xl p-6 shadow-warm">
          {/* 情景描述 */}
          <div className="text-center mb-6">
            <div className="text-6xl mb-3">{currentQuestion.image}</div>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <p className="text-lg text-gray-700 font-medium">{currentQuestion.scenario}</p>
              <SpeechButton text={currentQuestion.scenario} lang="zh" size="sm" />
            </div>
          </div>

          {/* 选项 */}
          <div className="grid grid-cols-1 gap-3">
            {currentQuestion.options.map((option, index) => {
              const isSelected = selectedAnswer === option;

              return (
                <button
                  key={index}
                  onClick={() => handleSelectAnswer(option)}
                  disabled={selectedAnswer !== null}
                  className={cn(
                    'p-4 rounded-xl border-2 text-left transition-all',
                    'flex items-center justify-between gap-3',
                    !selectedAnswer && 'hover:border-primary-400 hover:bg-orange-50',
                    selectedAnswer === null && 'border-orange-200 bg-white',
                    isSelected && isCorrect && 'border-green-500 bg-green-50 correct-animation',
                    isSelected && !isCorrect && 'wrong-soft-shake'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-800">{option}</span>
                    {isSelected && isCorrect && <span className="text-green-500 text-xl">✓</span>}
                    {isSelected && !isCorrect && <span className="text-amber-600 text-xl">?</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <SpeechButton text={option} size="sm" />
                    <RecordButton targetText={option} size="sm" />
                  </div>
                </button>
              );
            })}
          </div>

          {/* 操作按钮 */}
          {selectedAnswer !== null && isCorrect && (
            <div className="mt-6 text-center">
              <button
                onClick={handleNext}
                className="px-8 py-3 bg-green-500 text-white font-bold rounded-full hover:bg-green-600 transition-colors shadow-warm"
              >
                下一题 →
              </button>
            </div>
          )}
        </div>

        {/* 小提示 */}
        <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-center text-sm text-yellow-700">
          💡 题目不会自动朗读；点情景旁喇叭听中文，点选项旁喇叭听该句英文
        </div>
      </div>

      <WrongAnswerEncourageOverlay
        open={wrongEncourageOpen}
        petEmoji={petNormalEmoji}
        onDismiss={dismissWrongEncourage}
      />

      {/* 小动物鼓励弹窗 */}
      <PetModal
        isOpen={showModal}
        onClose={isCorrect ? handleNext : handleRetry}
        type={modalType}
        petType={userData.adoptedPet || 'dog'}
      />
    </div>
  );
}
