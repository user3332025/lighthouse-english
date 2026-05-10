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
  getDialogueQuestionsForSemesterAndUnit,
  getDialogueUnitsForSemester,
} from '@/data/questions';
import { GRADE_3A, GRADE_3B } from '@/data/wordLearning';
import { useUserData } from '@/hooks/useUserData';
import { useSpeech } from '@/hooks/useSpeech';
import { playCorrectSparkle, resumeAudioContext } from '@/lib/gameSfx';
import { shuffleArray } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { DialogueQuestion, TextbookSemesterId } from '@/types';

/** 从对话 context 里取出 A 说的英文（去掉 A: 前缀；多行时拼接所有 A: 行） */
function getEnglishSpokenByA(context: string): string {
  const lines = context
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const aOnly = lines
    .filter((l) => /^A:\s*/i.test(l))
    .map((l) => l.replace(/^A:\s*/i, '').trim())
    .filter(Boolean);
  if (aOnly.length > 0) return aOnly.join(' ');
  return context.replace(/^\s*A:\s*/i, '').trim();
}

function buildDialogueSession(pool: DialogueQuestion[]) {
  const picked = shuffleArray(pool).slice(0, 8);
  return picked.map((q) => ({
    ...q,
    options: shuffleArray(q.options),
  }));
}

export function DialoguePage() {
  const navigate = useNavigate();
  const { addPoints, addWrongQuestion, userData, PET_FACES } = useUserData();
  const { speakEnglish, speakChinese, stop: stopSpeech } = useSpeech();

  const [semester, setSemester] = useState<TextbookSemesterId | null>(null);
  const [unit, setUnit] = useState<number | null>(null);
  const [questions, setQuestions] = useState<ReturnType<typeof buildDialogueSession>>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'encourage' | 'correct'>('correct');
  const [gameOver, setGameOver] = useState(false);
  const [wrongEncourageOpen, setWrongEncourageOpen] = useState(false);

  const startUnitSession = useCallback((bookId: TextbookSemesterId, unitNum: number) => {
    const pool = getDialogueQuestionsForSemesterAndUnit(bookId, unitNum);
    if (pool.length === 0) {
      alert('该单元暂无对话题目，请换其它单元。');
      return;
    }
    setQuestions(buildDialogueSession(pool));
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

  // 先中文场景，再播 A 的英文；不可连续调两次 speak（会 cancel 掉前一段），用 onEnd 串联
  useEffect(() => {
    if (!userData.voiceEnabled || !currentQuestion || gameOver) return;
    let cancelled = false;
    const playAEnglish = () => {
      if (cancelled) return;
      const aText = getEnglishSpokenByA(currentQuestion.context);
      if (aText) speakEnglish(aText);
    };
    const t = window.setTimeout(() => {
      if (cancelled) return;
      resumeAudioContext();
      try {
        window.speechSynthesis?.resume?.();
      } catch {
        /* ignore */
      }
      speakChinese(currentQuestion.scene, {
        onEnd: playAEnglish,
        onError: playAEnglish,
      });
    }, 300);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
      stopSpeech();
    };
  }, [
    currentIndex,
    currentQuestion,
    userData.voiceEnabled,
    gameOver,
    speakChinese,
    speakEnglish,
    stopSpeech,
  ]);

  const handleSelectAnswer = (answer: string) => {
    if (selectedAnswer !== null) return;

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
        type: 'dialogue',
        question: { ...currentQuestion, id: currentQuestion.id, type: 'dialogue' },
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

  if (!semester) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary-50 to-orange-100 pb-8">
        <Header showBack title="对话练习" />
        <TextbookSemesterPicker moduleTitle="对话练习" onSelect={(id) => setSemester(id)} />
      </div>
    );
  }

  if (unit == null) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary-50 to-orange-100 pb-8">
        <Header showBack title="对话练习" />
        <TextbookUnitPicker
          semester={semester}
          unitNumbers={getDialogueUnitsForSemester(semester)}
          onBack={() => setSemester(null)}
          onSelectUnit={(u) => startUnitSession(semester, u)}
        />
      </div>
    );
  }

  if (gameOver) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary-50 to-orange-100 pb-8">
        <Header showBack title="对话练习" />
        <div className="max-w-4xl mx-auto px-4 mt-8">
          <div className="bg-white rounded-2xl p-6 shadow-warm-lg text-center">
            <div className="text-6xl mb-4">💬</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">对话练习完成！</h2>
            <p className="text-gray-600 mb-4">你的口语越来越棒了！</p>
            <div className="bg-pink-50 rounded-xl p-4 mb-6">
              <p className="text-3xl font-bold text-pink-600">得分：{score}</p>
              <p className="text-gray-500 text-sm">+{score} 积分</p>
            </div>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => navigate('/')}
                className="w-full py-3 bg-primary-500 text-white font-bold rounded-xl hover:bg-primary-600"
              >
                返回首页
              </button>
              <button
                onClick={() => {
                  if (semester != null && unit != null) {
                    const pool = getDialogueQuestionsForSemesterAndUnit(semester, unit);
                    setQuestions(buildDialogueSession(pool));
                  }
                  setCurrentIndex(0);
                  setScore(0);
                  setGameOver(false);
                  setWrongEncourageOpen(false);
                  setSelectedAnswer(null);
                  setIsCorrect(null);
                }}
                className="w-full py-3 bg-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-300"
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
                className="w-full py-3 bg-white border-2 border-pink-200 text-pink-700 font-bold rounded-xl hover:bg-pink-50"
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
      <Header showBack title="对话练习" />

      <div className="max-w-4xl mx-auto px-4 mt-2">
        <p className="text-center text-sm text-gray-500 mb-1">
          {semester === 'grade3a' ? '三年级上册' : '三年级下册'}
          {unit != null ? ` · 单元 ${unit}` : ''}
        </p>
        {unit != null && (
          <p className="text-center text-xs text-pink-600 mb-2">
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
            className="text-xs text-gray-400 hover:text-pink-600 underline"
          >
            重新选单元
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 mt-4">
        <GameHeader
          currentQuestion={currentIndex + 1}
          totalQuestions={questions.length}
          score={score}
          showScore
        />

        <div className="mt-4 bg-white rounded-2xl p-6 shadow-warm">
          {/* 场景描述 */}
          <div className="text-center mb-4">
            <div className="text-5xl mb-3">{currentQuestion.image}</div>
            <p className="text-lg text-gray-700 font-medium">{currentQuestion.scene}</p>
          </div>

          {/* 对话上下文 */}
          <div className="bg-pink-50 rounded-xl p-4 mb-6">
            <p className="text-gray-700 whitespace-pre-line">
              {currentQuestion.context}
            </p>
            <SpeechButton
              text={getEnglishSpokenByA(currentQuestion.context)}
              size="md"
              className="mt-2"
            />
          </div>

          {/* 提示 */}
          <p className="text-center text-gray-500 mb-4">选择B最合适的回应：</p>

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
                    selectedAnswer === null && 'border-pink-200 hover:border-pink-400 hover:bg-pink-50',
                    isSelected && isCorrect && 'border-green-500 bg-green-50 correct-animation',
                    isSelected && !isCorrect && 'wrong-soft-shake'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-800">B: {option}</span>
                    {isSelected && (
                      <span className={isCorrect ? 'text-green-500' : 'text-amber-600'}>
                        {isCorrect ? '✓' : '?'}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
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
