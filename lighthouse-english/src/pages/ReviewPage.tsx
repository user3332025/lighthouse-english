import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { SpeechButton } from '@/components/SpeechButton';
import { useUserData } from '@/hooks/useUserData';
import { normalizeOrderingWord, shuffleArray } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { WrongQuestion } from '@/types';

// 打乱选项顺序（复习会话开始时对每个错题副本调用一次）
function prepareWrongQuestionForReview(wq: WrongQuestion): WrongQuestion {
  const q = wq.question;
  if (wq.type === 'sentence' && q.options?.length) {
    return {
      ...wq,
      question: { ...q, options: shuffleArray([...q.options]) },
    };
  }
  if (wq.type === 'dialogue' && q.options?.length) {
    return {
      ...wq,
      question: { ...q, options: shuffleArray([...q.options]) },
    };
  }
  if (wq.type === 'listening' && q.images?.length) {
    const correctInImages = q.images.includes(q.correctAnswer);
    const correctEmoji = correctInImages ? q.correctAnswer : q.images[0];
    return {
      ...wq,
      question: {
        ...q,
        images: shuffleArray([...q.images]),
        correctAnswer: correctEmoji,
      },
    };
  }
  return wq;
}

// 根据题目类型获取显示内容
function getQuestionDisplay(question: WrongQuestion) {
  const q = question.question;
  
  switch (question.type) {
    case 'sentence':
      return {
        type: '句型练习',
        title: q.scenario || '选择正确的句子',
        content: q.scenario,
        hint: '请选择正确的英语表达：',
        options: q.options || [q.correctAnswer],
        correctAnswer: q.correctAnswer,
        image: q.image,
        context: null,
      };
    
    case 'dialogue':
      return {
        type: '对话练习',
        title: q.scene || '对话练习',
        content: q.scene,
        hint: '请选择最合适的回应：',
        options: q.options || [q.correctAnswer],
        correctAnswer: q.correctAnswer,
        image: q.image,
        context: q.context || null,
      };
    
    case 'listening':
      return {
        type: '听力练习',
        title: '听音选图',
        content: '听一听，选择正确的图片',
        hint: '请选择对应的图片：',
        options: q.images || [],
        correctAnswer: q.images?.includes(q.correctAnswer)
          ? q.correctAnswer
          : (q.images?.[0] ?? q.correctAnswer),
        image: null,
        context: null,
        isImageOptions: true,
      };
    
    case 'matching':
      return {
        type: '拼写练习',
        title: '拼写匹配',
        content: `单词: ${q.word || q.correctAnswer}`,
        hint: '请选择对应的图片：',
        options: [],
        correctAnswer: q.correctAnswer,
        image: q.image,
        context: null,
      };
    
    case 'ordering':
      return {
        type: '句子排序',
        title: q.scene || '句子排序',
        content: q.scene,
        hint: '请将单词排列成正确的句子',
        options: q.shuffledSentences || [],
        correctAnswer: q.correctOrder?.join(',') || '',
        image: q.image,
        context: null,
        isOrderingQuestion: true,
      };
    
    default:
      return {
        type: '复习练习',
        title: '复习',
        content: '',
        hint: '请选择正确答案：',
        options: q.options || [q.correctAnswer],
        correctAnswer: q.correctAnswer,
        image: q.image,
        context: null,
      };
  }
}

export function ReviewPage() {
  const navigate = useNavigate();
  const { userData, addPoints, markWrongQuestionCorrect, addWrongQuestion } = useUserData();

  const [selectedCount, setSelectedCount] = useState<number>(5);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [started, setStarted] = useState(false);
  const [orderingWords, setOrderingWords] = useState<string[]>([]);
  const [userOrder, setUserOrder] = useState<number[]>([]);
  const [orderingChecked, setOrderingChecked] = useState(false);
  const [reviewSession, setReviewSession] = useState<WrongQuestion[]>([]);

  const wrongQuestions = userData.wrongQuestions;
  const questions = reviewSession;
  const currentQuestion = questions[currentIndex];
  const display = currentQuestion ? getQuestionDisplay(currentQuestion) : null;

  const startReviewSession = () => {
    const n = Math.min(selectedCount, wrongQuestions.length);
    const session = shuffleArray(wrongQuestions)
      .slice(0, n)
      .map(prepareWrongQuestionForReview);
    setReviewSession(session);
    return session;
  };

  // 初始化排序题
  const initOrderingQuestion = (q: WrongQuestion) => {
    if (q.type === 'ordering' && q.question.shuffledSentences) {
      const tokens = q.question.shuffledSentences.map(normalizeOrderingWord);
      const shuffled = shuffleArray([...tokens]);
      setOrderingWords(shuffled);
      setUserOrder([]);
      setOrderingChecked(false);
    }
  };

  if (wrongQuestions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary-50 to-orange-100 pb-8">
        <Header showBack title="复习模块" />
        <div className="max-w-4xl mx-auto px-4 mt-8">
          <div className="bg-white rounded-2xl p-8 shadow-warm-lg text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">太棒了！</h2>
            <p className="text-gray-600 mb-6">你的错题本空空如也，继续保持！</p>
            <button
              onClick={() => navigate('/')}
              className="px-8 py-3 bg-primary-500 text-white font-bold rounded-full hover:bg-primary-600 transition-colors"
            >
              返回首页
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!started) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary-50 to-orange-100 pb-8">
        <Header showBack title="复习模块" />
        <div className="max-w-4xl mx-auto px-4 mt-8">
          <div className="bg-white rounded-2xl p-6 shadow-warm-lg">
            <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">📚 复习设置</h2>
            
            {/* 错题数量 */}
            <div className="mb-6">
              <p className="text-gray-600 mb-3 text-center">选择题目数量</p>
              <div className="flex justify-center gap-3">
                {[5, 10, 15, 20].filter(n => n <= wrongQuestions.length).map(num => (
                  <button
                    key={num}
                    onClick={() => setSelectedCount(num)}
                    className={cn(
                      'w-16 h-16 rounded-xl font-bold text-lg transition-all',
                      selectedCount === num
                        ? 'bg-primary-500 text-white shadow-warm'
                        : 'bg-orange-100 text-primary-700 hover:bg-orange-200'
                    )}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            {/* 错题统计 */}
            <div className="bg-purple-50 rounded-xl p-4 mb-4">
              <p className="text-purple-700 text-center">
                共有 <span className="font-bold">{wrongQuestions.length}</span> 道错题
              </p>
            </div>

            {/* 提示信息 */}
            <div className="bg-purple-50 rounded-xl p-4 mb-6">
              <ul className="text-purple-700 text-sm space-y-1">
                <li>• 复习题目来自你的错题本</li>
                <li>• 答对每题获得 5 积分</li>
                <li>• 连续答对 2 次，错题将移出错题本</li>
                <li>• 请认真看题后再作答</li>
              </ul>
            </div>

            {/* 开始按钮 */}
            <button
              onClick={() => {
                const session = startReviewSession();
                setStarted(true);
                setCurrentIndex(0);
                setScore(0);
                setGameOver(false);
                if (session[0]) initOrderingQuestion(session[0]);
              }}
              className="w-full py-4 bg-primary-500 text-white font-bold rounded-xl hover:bg-primary-600 transition-colors shadow-warm"
            >
              开始复习 ({Math.min(selectedCount, wrongQuestions.length)} 题)
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (gameOver) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary-50 to-orange-100 pb-8">
        <Header showBack title="复习模块" />
        <div className="max-w-4xl mx-auto px-4 mt-8">
          <div className="bg-white rounded-2xl p-6 shadow-warm-lg text-center">
            <div className="text-6xl mb-4">📖</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">复习完成！</h2>
            <p className="text-gray-600 mb-4">继续保持，错误越来越少！</p>
            <div className="bg-purple-50 rounded-xl p-4 mb-6">
              <p className="text-3xl font-bold text-purple-600">得分：{score}</p>
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
                  const session = startReviewSession();
                  setCurrentIndex(0);
                  setScore(0);
                  setGameOver(false);
                  setSelectedAnswer(null);
                  setIsCorrect(null);
                  if (session[0]) initOrderingQuestion(session[0]);
                }}
                className="w-full py-3 bg-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-300"
              >
                继续复习
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 处理排序题答案选择
  const handleOrderingWordClick = (_word: string, index: number) => {
    if (orderingChecked) return;
    setUserOrder(prev => [...prev, index]);
  };

  // 撤销最后一个单词
  const handleUndoWord = () => {
    if (orderingChecked || userOrder.length === 0) return;
    setUserOrder(prev => prev.slice(0, -1));
  };

  // 检查排序答案
  const checkOrderingAnswer = () => {
    if (!currentQuestion || currentQuestion.question.correctOrder == null) return;
    const seq = currentQuestion.question.shuffledSentences ?? [];
    const correctTokens = currentQuestion.question.correctOrder.map((i: number) =>
      normalizeOrderingWord(seq[i] ?? '')
    );
    const selectedTokens = userOrder.map((wi) => orderingWords[wi]);
    const isCorrectOrder = correctTokens.join(' ') === selectedTokens.join(' ');

    setIsCorrect(isCorrectOrder);
    setOrderingChecked(true);

    if (isCorrectOrder) {
      setScore(prev => prev + 5);
      addPoints(5);
      markWrongQuestionCorrect(currentQuestion.id);
    } else {
      addWrongQuestion({
        id: currentQuestion.id,
        type: currentQuestion.type,
        question: currentQuestion.question,
      });
    }
  };

  // 处理普通选择题答案
  const handleSelectAnswer = (answer: string) => {
    if (selectedAnswer !== null || !currentQuestion) return;

    setSelectedAnswer(answer);
    const correct = answer === currentQuestion.question.correctAnswer;
    setIsCorrect(correct);

    if (correct) {
      setScore(prev => prev + 5);
      addPoints(5);
      markWrongQuestionCorrect(currentQuestion.id);
    } else {
      addWrongQuestion({
        id: currentQuestion.id,
        type: currentQuestion.type,
        question: currentQuestion.question,
      });
    }
  };

  // 进入下一题
  const goToNext = () => {
    if (currentIndex < questions.length - 1) {
      const nextQ = questions[currentIndex + 1];
      setCurrentIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setIsCorrect(null);
      setOrderingChecked(false);
      if (nextQ.type === 'ordering') {
        initOrderingQuestion(nextQ);
      } else {
        setOrderingWords([]);
        setUserOrder([]);
      }
    } else {
      setGameOver(true);
    }
  };

  // 获取排序题的正确句子
  const getCorrectSentence = () => {
    if (!currentQuestion || !currentQuestion.question.shuffledSentences || !currentQuestion.question.correctOrder) return '';
    const parts = currentQuestion.question.correctOrder?.map(
      (idx: number) => currentQuestion.question.shuffledSentences?.[idx] ?? ''
    );
    return parts?.join(' ') ?? '';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-orange-100 pb-8">
      <Header showBack title="复习模块" />

      <div className="max-w-4xl mx-auto px-4 mt-4">
        {/* 进度条 */}
        <div className="bg-white rounded-xl p-3 shadow-warm mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>题目 {currentIndex + 1}/{questions.length}</span>
            <span className="font-bold text-purple-600">得分: {score}</span>
          </div>
          <div className="w-full bg-purple-100 rounded-full h-2">
            <div
              className="h-full bg-purple-500 rounded-full transition-all"
              style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>

        {/* 题目卡片 */}
        <div className="bg-white rounded-2xl p-6 shadow-warm">
          {/* 题目类型 */}
          <div className="text-center mb-2">
            <span className="inline-block px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
              {display?.type}
            </span>
          </div>

          {/* 场景标题 */}
          <div className="text-center mb-4">
            {display?.image && (
              <div className="text-5xl mb-2">{display.image}</div>
            )}
            <h3 className="text-lg font-bold text-gray-800">{display?.title}</h3>
          </div>

          {/* 对话上下文 */}
          {display?.context && (
            <div className="bg-pink-50 rounded-xl p-4 mb-4">
              <p className="text-gray-700 whitespace-pre-line text-sm">
                {display.context}
              </p>
              <SpeechButton text={display.context} size="sm" className="mt-2" />
            </div>
          )}

          {/* 题目内容 */}
          <p className="text-center text-gray-600 mb-4 font-medium">
            {display?.hint}
          </p>

          {/* 排序题 */}
          {currentQuestion?.type === 'ordering' ? (
            <div>
              {/* 用户已选择的单词 */}
              <div className="bg-purple-50 rounded-xl p-4 mb-4 min-h-16">
                {userOrder.length === 0 ? (
                  <p className="text-gray-400 text-center">点击下方单词组成句子</p>
                ) : (
                  <div className="flex flex-wrap gap-2 justify-center">
                    {userOrder.map((idx, i) => (
                      <span key={i} className="px-4 py-2 bg-purple-500 text-white rounded-lg font-medium">
                        {orderingWords[idx]}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* 单词选项 */}
              <div className="flex flex-wrap gap-2 justify-center mb-4">
                {orderingWords.map((word, idx) => {
                  const isUsed = userOrder.includes(idx);
                  return (
                    <button
                      key={idx}
                      onClick={() => !isUsed && handleOrderingWordClick(word, idx)}
                      disabled={isUsed || orderingChecked}
                      className={cn(
                        'px-4 py-2 rounded-lg font-medium transition-all',
                        isUsed
                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                      )}
                    >
                      {word}
                    </button>
                  );
                })}
              </div>

              {/* 操作按钮 */}
              <div className="flex justify-center gap-3">
                {!orderingChecked && userOrder.length > 0 && (
                  <>
                    <button
                      onClick={handleUndoWord}
                      className="px-6 py-2 bg-gray-200 text-gray-700 font-bold rounded-full hover:bg-gray-300"
                    >
                      撤销
                    </button>
                    <button
                      onClick={checkOrderingAnswer}
                      className="px-6 py-2 bg-green-500 text-white font-bold rounded-full hover:bg-green-600"
                    >
                      确认答案
                    </button>
                  </>
                )}
              </div>

              {/* 结果显示 */}
              {orderingChecked && (
                <div className="mt-4 text-center">
                  {isCorrect ? (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                      <p className="text-green-700 font-bold text-lg">正确！🎉</p>
                      <button
                        onClick={goToNext}
                        className="mt-3 px-6 py-2 bg-green-500 text-white font-bold rounded-full hover:bg-green-600"
                      >
                        下一题 →
                      </button>
                    </div>
                  ) : (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                      <p className="text-red-700 font-bold text-lg mb-2">错误，再想想！</p>
                      <p className="text-gray-600 mb-2">正确答案是：</p>
                      <p className="text-green-600 font-bold text-lg mb-3">{getCorrectSentence()}</p>
                      <button
                        onClick={() => {
                          setUserOrder([]);
                          setOrderingChecked(false);
                          setIsCorrect(null);
                        }}
                        className="px-6 py-2 bg-orange-500 text-white font-bold rounded-full hover:bg-orange-600"
                      >
                        再试一次 🐰
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* 普通选择题 */
            <div className="grid grid-cols-2 gap-3">
              {display?.isImageOptions ? (
                // 图片选项
                display.options.map((option: string, index: number) => {
                  const isSelected = selectedAnswer === option;
                  const isCorrectAnswer = option === display.correctAnswer;

                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleSelectAnswer(option)}
                      disabled={selectedAnswer !== null}
                      className={cn(
                        'p-4 rounded-xl border-2 transition-all flex flex-col items-center justify-center min-h-24',
                        selectedAnswer === null && 'border-purple-200 hover:border-purple-400 hover:bg-purple-50',
                        isSelected && isCorrect && 'border-green-500 bg-green-50',
                        isSelected && !isCorrect && 'border-red-500 bg-red-50',
                        !isSelected && isCorrectAnswer && selectedAnswer !== null && 'border-green-500 bg-green-50'
                      )}
                    >
                      <span className="text-4xl mb-2">{option}</span>
                      {isSelected && (
                        <span className={isCorrect ? 'text-green-500 text-xl' : 'text-red-500 text-xl'}>
                          {isCorrect ? '✓' : '✗'}
                        </span>
                      )}
                    </button>
                  );
                })
              ) : (
                // 文字选项
                display?.options.map((option: string, index: number) => {
                  const isSelected = selectedAnswer === option;
                  const isCorrectAnswer = option === display.correctAnswer;

                  return (
                    <div
                      key={index}
                      className={cn(
                        'p-4 rounded-xl border-2 transition-all flex flex-col gap-3',
                        selectedAnswer === null && 'border-purple-200 hover:border-purple-400 hover:bg-purple-50',
                        isSelected && isCorrect && 'border-green-500 bg-green-50 correct-animation',
                        isSelected && !isCorrect && 'border-red-500 bg-red-50 wrong-animation',
                        !isSelected && isCorrectAnswer && selectedAnswer !== null && 'border-green-500 bg-green-50'
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => handleSelectAnswer(option)}
                        disabled={selectedAnswer !== null}
                        className="text-left w-full"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-800">{option}</span>
                          {isSelected && (
                            <span className={isCorrect ? 'text-green-500' : 'text-red-500'}>
                              {isCorrect ? '✓' : '✗'}
                            </span>
                          )}
                        </div>
                      </button>
                      
                      {/* 独立的听按钮 - 与选项操作分开 */}
                      {selectedAnswer === null && (
                        <div className="flex items-center gap-2">
                          <SpeechButton text={option} size="sm" />
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* 正确答案提示 */}
          {selectedAnswer !== null && !isCorrect && !orderingChecked && (
            <div className="mt-4 bg-green-50 border border-green-200 rounded-xl p-4 text-center">
              <p className="text-green-700 font-medium">
                正确答案：{display?.isImageOptions ? '👆 请看图片' : display?.correctAnswer}
              </p>
              {display?.correctAnswer && !display?.isImageOptions && (
                <SpeechButton text={display.correctAnswer} size="sm" className="mt-2" />
              )}
            </div>
          )}

          {/* 答对后下一题按钮 */}
          {selectedAnswer !== null && isCorrect && (
            <div className="mt-4 text-center">
              <button
                onClick={goToNext}
                className="px-8 py-3 bg-green-500 text-white font-bold rounded-full hover:bg-green-600 shadow-warm"
              >
                下一题 →
              </button>
            </div>
          )}
        </div>

        {/* 错题统计 */}
        <div className="mt-4 bg-orange-50 border border-orange-200 rounded-xl p-3 text-center text-sm text-orange-700">
          📚 错题本中还有 {wrongQuestions.length} 道题需要复习
        </div>
      </div>
    </div>
  );
}
