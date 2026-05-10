import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Volume2 } from 'lucide-react';
import { Header } from '@/components/Header';
import { GameHeader } from '@/components/ProgressBar';
import { RecordButton } from '@/components/RecordButton';
import { PetModal } from '@/components/PetModal';
import { WrongAnswerEncourageOverlay } from '@/components/WrongAnswerEncourageOverlay';
import { LISTENING_QUESTIONS } from '@/data/questions';
import { useUserData } from '@/hooks/useUserData';
import { useSpeech } from '@/hooks/useSpeech';
import { playCorrectSparkle, resumeAudioContext, unlockAudioFromButtonTap } from '@/lib/gameSfx';
import { shuffleArray } from '@/lib/utils';
import { cn } from '@/lib/utils';

export function ListeningPage() {
  const navigate = useNavigate();
  const { addPoints, addWrongQuestion, userData, PET_FACES } = useUserData();
  const { speakEnglish } = useSpeech();

  const [questions] = useState(() =>
    shuffleArray(LISTENING_QUESTIONS)
      .slice(0, 8)
      .map((q) => {
        // 题库中每题正确图片约定为 images[0]；打乱顺序并把判题答案改为对应 emoji
        const correctEmoji = q.images[0];
        return {
          ...q,
          images: shuffleArray([...q.images]),
          correctAnswer: correctEmoji,
        };
      })
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'encourage' | 'correct'>('correct');
  const [gameOver, setGameOver] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [wrongEncourageOpen, setWrongEncourageOpen] = useState(false);
  const playingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentQuestion = questions[currentIndex];
  const petNormalEmoji = userData.adoptedPet
    ? PET_FACES[userData.adoptedPet as keyof typeof PET_FACES]?.normal
    : undefined;

  const dismissWrongEncourage = () => {
    setWrongEncourageOpen(false);
    setSelectedAnswer(null);
    setIsCorrect(null);
  };

  const playAudio = useCallback(() => {
    unlockAudioFromButtonTap();
    resumeAudioContext();
    if (!userData.voiceEnabled) {
      speakEnglish('Voice is off. Turn it on in settings.');
      return;
    }
    if (!currentQuestion) return;
    if (playingTimeoutRef.current !== null) {
      clearTimeout(playingTimeoutRef.current);
      playingTimeoutRef.current = null;
    }
    setIsPlaying(true);
    speakEnglish(currentQuestion.audioText);
    playingTimeoutRef.current = setTimeout(() => {
      setIsPlaying(false);
      playingTimeoutRef.current = null;
    }, 1000);
  }, [userData.voiceEnabled, currentQuestion, speakEnglish]);

  // 自动播放发音
  useEffect(() => {
    if (userData.voiceEnabled && currentQuestion && !gameOver) {
      playAudio();
    }
    return () => {
      if (playingTimeoutRef.current !== null) {
        clearTimeout(playingTimeoutRef.current);
        playingTimeoutRef.current = null;
      }
      setIsPlaying(false);
    };
  }, [currentIndex, currentQuestion, userData.voiceEnabled, gameOver, playAudio]);

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
        type: 'listening',
        question: { ...currentQuestion, id: currentQuestion.id, type: 'listening' },
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

  if (gameOver) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary-50 to-orange-100 pb-8">
        <Header showBack title="听力选择" />
        <div className="max-w-4xl mx-auto px-4 mt-8">
          <div className="bg-white rounded-2xl p-6 shadow-warm-lg text-center">
            <div className="text-6xl mb-4">👂</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">听力练习完成！</h2>
            <p className="text-gray-600 mb-4">你的听力越来越棒了！</p>
            <div className="bg-blue-50 rounded-xl p-4 mb-6">
              <p className="text-3xl font-bold text-blue-600">得分：{score}</p>
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
                  setCurrentIndex(0);
                  setScore(0);
                  setGameOver(false);
                  setWrongEncourageOpen(false);
                }}
                className="w-full py-3 bg-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-300"
              >
                再来一次
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-orange-100 pb-8">
      <Header showBack title="听力选择" />

      <div className="max-w-4xl mx-auto px-4 mt-4">
        <GameHeader
          currentQuestion={currentIndex + 1}
          totalQuestions={questions.length}
          score={score}
          showScore
        />

        <div className="mt-4 bg-white rounded-2xl p-6 shadow-warm">
          {/* 播放按钮 */}
          <div className="text-center mb-6">
            <button
              onClick={playAudio}
              disabled={isPlaying}
              className={cn(
                'w-24 h-24 rounded-full flex items-center justify-center mx-auto',
                'bg-gradient-to-br from-blue-400 to-blue-600 text-white',
                'shadow-lg hover:shadow-xl transition-all',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                isPlaying && 'animate-pulse'
              )}
            >
              <Volume2 className="w-12 h-12" />
            </button>
            <p className="mt-3 text-gray-600">
              {isPlaying ? '正在播放...' : '点击播放，听一听是什么？'}
            </p>
            <div className="mt-4">
              <RecordButton targetText={currentQuestion.audioText} size="md" />
            </div>
          </div>

          {/* 图片选项 */}
          <div className="grid grid-cols-2 gap-4">
            {currentQuestion.images.map((emoji, index) => {
              const isSelected = selectedAnswer === emoji;

              return (
                <button
                  key={index}
                  onClick={() => handleSelectAnswer(emoji)}
                  disabled={selectedAnswer !== null}
                  className={cn(
                    'aspect-square rounded-2xl flex items-center justify-center text-6xl',
                    'transition-all duration-300 border-4',
                    selectedAnswer === null && 'bg-blue-50 border-blue-200 hover:border-blue-400 hover:scale-105',
                    isSelected && isCorrect && 'bg-green-100 border-green-500 correct-animation',
                    isSelected && !isCorrect && 'bg-amber-50 border-amber-500 wrong-soft-shake'
                  )}
                >
                  {emoji}
                </button>
              );
            })}
          </div>

          {/* 重新播放按钮 */}
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
