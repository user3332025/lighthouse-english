import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { GameHeader } from '@/components/ProgressBar';
import { PetModal } from '@/components/PetModal';
import { WrongAnswerEncourageOverlay } from '@/components/WrongAnswerEncourageOverlay';
import { useUserData } from '@/hooks/useUserData';
import { playCorrectSparkle, resumeAudioContext } from '@/lib/gameSfx';
import { shuffleArray, pickRandom } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { GRADE_3A, GRADE_3B, type Word } from '@/data/wordLearning';

type Question = {
  word: Word;
  showEnglish: boolean;
  correctAnswer: string;
  options: string[];
};

type QuizResult = {
  word: string;
  correct: boolean;
  userAnswer: string;
  correctAnswer: string;
};

export const MASTERY_THRESHOLD = 0.8;
export const QUESTIONS_PER_SESSION = 10;

export function ListeningPage() {
  const navigate = useNavigate();
  const { addPoints, addWrongQuestion, userData, PET_FACES } = useUserData();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'encourage' | 'correct'>('correct');
  const [gameOver, setGameOver] = useState(false);
  const [wrongEncourageOpen, setWrongEncourageOpen] = useState(false);
  const [quizResults, setQuizResults] = useState<QuizResult[]>([]);
  const [masteryRate, setMasteryRate] = useState(0);

  const petNormalEmoji = userData.adoptedPet
    ? PET_FACES[userData.adoptedPet as keyof typeof PET_FACES]?.normal
    : undefined;

  const dismissWrongEncourage = () => {
    setWrongEncourageOpen(false);
    setSelectedAnswer(null);
    setIsCorrect(null);
  };

  const generateQuestions = useCallback(() => {
    const allWords: Word[] = [];
    [...GRADE_3A.units, ...GRADE_3B.units].forEach(unit => {
      allWords.push(...unit.words);
    });

    const selectedWords = pickRandom(allWords, QUESTIONS_PER_SESSION);

    const generatedQuestions: Question[] = selectedWords.map(word => {
      const showEnglish = Math.random() > 0.5;
      const correctAnswer = showEnglish ? word.meaning : word.word;

      const distractors = allWords
        .filter(w => w.word !== word.word)
        .map(w => showEnglish ? w.meaning : w.word);
      
      const wrongOptions = pickRandom(distractors, 3);
      const options = shuffleArray([correctAnswer, ...wrongOptions]);

      return {
        word,
        showEnglish,
        correctAnswer,
        options,
      };
    });

    return generatedQuestions;
  }, []);

  useEffect(() => {
    const newQuestions = generateQuestions();
    setQuestions(newQuestions);
    setQuizResults([]);
  }, [generateQuestions]);

  const currentQuestion = questions[currentIndex];

  const handleSelectAnswer = (answer: string) => {
    if (selectedAnswer !== null) return;

    setSelectedAnswer(answer);
    const correct = answer === currentQuestion.correctAnswer;
    setIsCorrect(correct);

    const result: QuizResult = {
      word: currentQuestion.showEnglish ? currentQuestion.word.word : currentQuestion.word.meaning,
      correct,
      userAnswer: answer,
      correctAnswer: currentQuestion.correctAnswer,
    };
    setQuizResults(prev => [...prev, result]);

    if (correct) {
      resumeAudioContext();
      playCorrectSparkle();
      setScore(prev => prev + 10);
      addPoints(10);
      setModalType('correct');
      setShowModal(true);
    } else {
      const wid = `vocab-${currentQuestion.word.word}`;
      addWrongQuestion({
        id: wid,
        type: 'vocabulary',
        question: {
          id: wid,
          type: 'vocabulary',
          word: currentQuestion.word.word,
          meaning: currentQuestion.word.meaning,
          phonetic: currentQuestion.word.phonetic,
          correctAnswer: currentQuestion.correctAnswer,
        },
      });
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
      const correctCount = quizResults.filter(r => r.correct).length + (isCorrect ? 1 : 0);
      const newRate = correctCount / questions.length;
      setMasteryRate(newRate);

      if (newRate >= MASTERY_THRESHOLD) {
        setGameOver(true);
      } else {
        const newQuestions = generateQuestions();
        setQuestions(newQuestions);
        setCurrentIndex(0);
        setQuizResults([]);
        setScore(prev => prev);
      }
    }
  };

  const correctCount = quizResults.filter(r => r.correct).length;
  const totalAnswered = quizResults.length;
  const currentAccuracy = totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0;

  if (gameOver) {
    const finalAccuracy = Math.round((correctCount / questions.length) * 100);
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary-50 to-orange-100 pb-8">
        <Header showBack title="词汇配对" />
        <div className="max-w-4xl mx-auto px-4 mt-8">
          <div className="bg-white rounded-2xl p-6 shadow-warm-lg text-center">
            <div className="text-6xl mb-4 animate-bounce">🎉</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">恭喜达标！</h2>
            <p className="text-gray-600 mb-4">你已经达到了 {MASTERY_THRESHOLD * 100}% 的熟练度！</p>
            
            <div className="bg-green-50 rounded-xl p-4 mb-4">
              <p className="text-3xl font-bold text-green-600">正确率：{finalAccuracy}%</p>
            </div>

            <div className="bg-blue-50 rounded-xl p-4 mb-6">
              <p className="text-gray-600">正确：{correctCount} 题</p>
              <p className="text-gray-600">总题数：{questions.length} 题</p>
              <p className="text-gray-600">获得积分：+{score} 分</p>
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
                  const newQuestions = generateQuestions();
                  setQuestions(newQuestions);
                  setCurrentIndex(0);
                  setScore(0);
                  setGameOver(false);
                  setQuizResults([]);
                  setMasteryRate(0);
                  setWrongEncourageOpen(false);
                }}
                className="w-full py-3 bg-green-500 text-white font-bold rounded-xl hover:bg-green-600"
              >
                继续练习
              </button>
            </div>
          </div>
        </div>

        <PetModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          type="correct"
          petType={userData.adoptedPet || 'dog'}
        />
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary-50 to-orange-100 pb-8">
        <Header showBack title="词汇配对" />
        <div className="max-w-4xl mx-auto px-4 mt-8 text-center">
          <p className="text-gray-600">正在加载题目...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-orange-100 pb-8">
      <Header showBack title="词汇配对" />

      <div className="max-w-4xl mx-auto px-4 mt-4">
        <GameHeader
          currentQuestion={currentIndex + 1}
          totalQuestions={questions.length}
          score={score}
          showScore
        />

        <div className="mt-4 bg-white rounded-2xl p-6 shadow-warm">
          <div className="text-center mb-6">
            <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl p-4 mb-4">
              <p className="text-gray-600 mb-2">
                {currentQuestion.showEnglish ? '请选择中文释义' : '请选择英文单词'}
              </p>
              <p className="text-3xl font-bold text-gray-800">
                {currentQuestion.showEnglish ? currentQuestion.word.word : currentQuestion.word.meaning}
              </p>
              {!currentQuestion.showEnglish && (
                <p className="text-lg text-gray-500 mt-2">
                  {currentQuestion.word.phonetic}
                </p>
              )}
            </div>

            {selectedAnswer !== null && isCorrect !== null && (
              <div className={cn(
                'rounded-xl p-4 mt-4',
                isCorrect ? 'bg-green-50 border-2 border-green-300' : 'bg-red-50 border-2 border-red-300'
              )}>
                <p className={cn(
                  'text-xl font-bold mb-2',
                  isCorrect ? 'text-green-600' : 'text-red-600'
                )}>
                  {isCorrect ? '✅ 正确！' : '❌ 错误'}
                </p>
                {!isCorrect && (
                  <div className="text-left bg-white rounded-lg p-3">
                    <p className="text-gray-600 text-sm">
                      正确答案：<span className="font-bold text-green-600">{currentQuestion.correctAnswer}</span>
                    </p>
                    <p className="text-gray-500 text-sm mt-1">
                      你的选择：<span className="font-bold text-red-600">{selectedAnswer}</span>
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-3">
            {currentQuestion.options.map((option, index) => {
              const isSelected = selectedAnswer === option;

              return (
                <button
                  key={index}
                  onClick={() => handleSelectAnswer(option)}
                  disabled={selectedAnswer !== null}
                  className={cn(
                    'w-full p-4 rounded-xl border-2 text-left transition-all duration-300',
                    selectedAnswer === null && 'hover:border-purple-400 hover:bg-purple-50',
                    isSelected && isCorrect && 'bg-green-100 border-green-500 correct-animation',
                    isSelected && !isCorrect && 'bg-red-100 border-red-500',
                    selectedAnswer !== null && !isSelected && option === currentQuestion.correctAnswer && 'bg-green-50 border-green-300',
                    selectedAnswer === null && 'bg-white border-gray-200'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold',
                      selectedAnswer === null && 'bg-purple-100 text-purple-600',
                      isSelected && isCorrect && 'bg-green-500 text-white',
                      isSelected && !isCorrect && 'bg-red-500 text-white',
                      selectedAnswer !== null && !isSelected && option === currentQuestion.correctAnswer && 'bg-green-500 text-white',
                      selectedAnswer !== null && !isSelected && option !== currentQuestion.correctAnswer && isSelected && 'bg-gray-200 text-gray-500'
                    )}>
                      {String.fromCharCode(65 + index)}
                    </span>
                    <span className="text-lg font-medium">{option}</span>
                  </div>
                </button>
              );
            })}
          </div>

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

        <div className="mt-4 bg-white rounded-xl p-4 shadow-warm">
          <div className="flex justify-between items-center text-sm">
            <div className="text-gray-600">
              当前正确率：<span className="font-bold text-purple-600">{currentAccuracy}%</span>
              <span className="text-gray-400 ml-2">
                ({correctCount}/{totalAnswered})
              </span>
            </div>
            <div className="text-gray-600">
              目标：<span className="font-bold text-green-600">{MASTERY_THRESHOLD * 100}%</span>
            </div>
          </div>
          <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${currentAccuracy}%` }}
            />
          </div>
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