import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { GameHeader } from '@/components/ProgressBar';
import { SpeechButton } from '@/components/SpeechButton';
import { PetModal } from '@/components/PetModal';
import { ORDERING_QUESTIONS } from '@/data/questions';
import { useUserData } from '@/hooks/useUserData';
import { playCorrectSparkle, resumeAudioContext } from '@/lib/gameSfx';
import { normalizeOrderingWord, shuffleArray } from '@/lib/utils';
import { cn } from '@/lib/utils';

export function OrderingPage() {
  const navigate = useNavigate();
  const { addPoints, addWrongQuestion, userData } = useUserData();
  const [questions] = useState(() => shuffleArray(ORDERING_QUESTIONS).slice(0, 8));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'encourage' | 'correct'>('correct');
  const [gameOver, setGameOver] = useState(false);
  const [orderedSentences, setOrderedSentences] = useState<string[]>([]);
  const [availableSentences, setAvailableSentences] = useState<string[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const currentQuestion = questions[currentIndex];

  // 初始化题目
  useEffect(() => {
    if (currentQuestion) {
      const tokens = currentQuestion.shuffledSentences.map(normalizeOrderingWord);
      const shuffled = shuffleArray([...tokens]);
      setAvailableSentences(shuffled);
      setOrderedSentences([]);
      setShowResult(false);
    }
  }, [currentIndex, currentQuestion]);

  const addToOrder = (sentence: string) => {
    setAvailableSentences(prev => prev.filter(s => s !== sentence));
    setOrderedSentences(prev => [...prev, sentence]);
  };

  const removeFromOrder = (index: number) => {
    const sentence = orderedSentences[index];
    setOrderedSentences(prev => prev.filter((_, i) => i !== index));
    setAvailableSentences(prev => [...prev, sentence]);
  };

  const moveSentence = (fromIndex: number, direction: 'up' | 'down') => {
    const newOrder = [...orderedSentences];
    const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1;

    if (toIndex < 0 || toIndex >= newOrder.length) return;

    [newOrder[fromIndex], newOrder[toIndex]] = [newOrder[toIndex], newOrder[fromIndex]];
    setOrderedSentences(newOrder);
  };

  const checkAnswer = () => {
    const correctOrder = currentQuestion.correctOrder.map((i) =>
      normalizeOrderingWord(currentQuestion.shuffledSentences[i])
    );
    const correct = orderedSentences.join(' ') === correctOrder.join(' ');

    setIsCorrect(correct);
    setShowResult(true);

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
        type: 'ordering',
        question: {
          ...currentQuestion,
          id: currentQuestion.id,
          type: 'ordering',
          correctAnswer: currentQuestion.correctOrder
            .map((i) => currentQuestion.shuffledSentences[i])
            .join(' '),
        },
      });
      // 错题时不弹窗，只在界面上显示鼓励
      // setModalType('encourage');
      // setShowModal(true);
    }
  };

  const handleNext = () => {
    setShowModal(false);

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setGameOver(true);
    }
  };

  const resetOrder = () => {
    if (currentQuestion) {
      const tokens = currentQuestion.shuffledSentences.map(normalizeOrderingWord);
      const shuffled = shuffleArray([...tokens]);
      setAvailableSentences(shuffled);
      setOrderedSentences([]);
      setShowResult(false);
      setIsCorrect(false);
    }
  };

  if (gameOver) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary-50 to-orange-100 pb-8">
        <Header showBack title="句子排序" />
        <div className="max-w-4xl mx-auto px-4 mt-8">
          <div className="bg-white rounded-2xl p-6 shadow-warm-lg text-center">
            <div className="text-6xl mb-4">📝</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">句子排序完成！</h2>
            <p className="text-gray-600 mb-4">你真是个英语小天才！</p>
            <div className="bg-purple-50 rounded-xl p-4 mb-6">
              <p className="text-3xl font-bold text-purple-600">得分：{score}</p>
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
      <Header showBack title="句子排序" />

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
            <div className="text-5xl mb-2">{currentQuestion?.image}</div>
            <p className="text-lg text-gray-700 font-medium">{currentQuestion?.scene}</p>
          </div>

          {/* 已排序区域 */}
          <div className="mb-4">
            <p className="text-sm text-gray-500 mb-2">排列好的句子：</p>
            <div className="min-h-[120px] bg-purple-50 rounded-xl p-3 border-2 border-dashed border-purple-200">
              {orderedSentences.length === 0 ? (
                <p className="text-center text-purple-300 py-8">点击下方单词卡片添加到此处</p>
              ) : (
                <div className="space-y-2">
                  {orderedSentences.map((sentence, index) => (
                    <div
                      key={index}
                      className={cn(
                        'flex items-center gap-2 bg-white rounded-lg p-2 shadow-sm',
                        showResult && isCorrect && 'border-2 border-green-400',
                        showResult && !isCorrect && 'border-2 border-red-400'
                      )}
                    >
                      <span className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                        {index + 1}
                      </span>
                      <span className="flex-1 font-medium">{sentence}</span>
                      <div className="flex gap-1">
                        <button
                          onClick={() => moveSentence(index, 'up')}
                          disabled={index === 0 || showResult}
                          className="p-1 text-purple-500 hover:bg-purple-100 rounded disabled:opacity-30"
                        >
                          ↑
                        </button>
                        <button
                          onClick={() => moveSentence(index, 'down')}
                          disabled={index === orderedSentences.length - 1 || showResult}
                          className="p-1 text-purple-500 hover:bg-purple-100 rounded disabled:opacity-30"
                        >
                          ↓
                        </button>
                        <button
                          onClick={() => removeFromOrder(index)}
                          disabled={showResult}
                          className="p-1 text-red-500 hover:bg-red-100 rounded disabled:opacity-30"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 可选单词 */}
          <div className="mb-4">
            <p className="text-sm text-gray-500 mb-2">可选单词：</p>
            <div className="flex flex-wrap gap-2 min-h-[60px] bg-gray-50 rounded-xl p-3">
              {availableSentences.map((sentence, index) => (
                <button
                  key={index}
                  onClick={() => addToOrder(sentence)}
                  disabled={showResult}
                  className="px-4 py-2 bg-white border-2 border-gray-200 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-colors font-medium text-gray-700 disabled:opacity-50"
                >
                  {sentence}
                </button>
              ))}
            </div>
          </div>

          {/* 结果提示 */}
          {showResult && (
            <div className={cn(
              'p-4 rounded-xl text-center mb-4',
              isCorrect ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
            )}>
              {isCorrect ? (
                <div>
                  <p className="font-bold text-lg">✓ 太棒了！你真是个英语小天才！</p>
                  {/* 显示完整句子供练习 */}
                  <div className="mt-3 inline-flex items-center gap-2 bg-white px-4 py-2 rounded-lg">
                    <span className="text-gray-700">
                      {currentQuestion.correctOrder.map((i: number) => currentQuestion.shuffledSentences[i]).join(' ')}
                    </span>
                    <SpeechButton 
                      text={currentQuestion.correctOrder.map((i: number) => currentQuestion.shuffledSentences[i]).join(' ')} 
                      size="sm" 
                    />
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-3">
                  <span className="text-4xl">🐰</span>
                  <div>
                    <p className="font-bold text-lg">再想想！</p>
                    <p className="text-sm mt-1">仔细听一听句子的意思哦~</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 操作按钮 */}
          <div className="flex gap-3">
            {showResult ? (
              isCorrect ? (
                <button
                  onClick={handleNext}
                  className="flex-1 py-3 bg-green-500 text-white font-bold rounded-xl hover:bg-green-600 shadow-warm"
                >
                  下一题 →
                </button>
              ) : (
                <button
                  onClick={() => {
                    setShowResult(false);
                    setIsCorrect(false);
                    setOrderedSentences([]);
                    setAvailableSentences(
                      shuffleArray([...currentQuestion.shuffledSentences.map(normalizeOrderingWord)])
                    );
                    setShowModal(false);
                  }}
                  className="flex-1 py-3 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 shadow-warm"
                >
                  再试一次 🐰
                </button>
              )
            ) : (
              <>
                <button
                  onClick={resetOrder}
                  disabled={showResult}
                  className="flex-1 py-3 bg-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-300 disabled:opacity-50"
                >
                  重置
                </button>
                <button
                  onClick={checkAnswer}
                  disabled={orderedSentences.length !== currentQuestion.shuffledSentences.length}
                  className="flex-1 py-3 bg-purple-500 text-white font-bold rounded-xl hover:bg-purple-600 shadow-warm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  检查答案
                </button>
              </>
            )}
          </div>
        </div>

        {/* 提示 */}
        <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-sm text-yellow-700">
          💡 提示：按照正确的英语句子顺序排列单词
        </div>
      </div>

      <PetModal
        isOpen={showModal}
        onClose={isCorrect ? handleNext : () => setShowModal(false)}
        type={modalType}
        petType={userData.adoptedPet || 'dog'}
      />
    </div>
  );
}
