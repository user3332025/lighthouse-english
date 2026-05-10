import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { useUserData } from '@/hooks/useUserData';
import { useSpeech } from '@/hooks/useSpeech';
import { DIALOGUES_DATA } from '@/data/questions';
import { cn } from '@/lib/utils';
import { playCorrectSparkle, playWrongPop, playButtonClick } from '@/lib/gameSfx';

type Mode = 'dialogue' | 'practice';

export function DialoguePage() {
  const navigate = useNavigate();
  const { addPoints, userData, addWrongQuestion } = useUserData();
  const { speakEnglish } = useSpeech();

  const [currentDialogueIndex, setCurrentDialogueIndex] = useState(0);
  const [mode, setMode] = useState<Mode>('dialogue');
  const [answeredQuestions, setAnsweredQuestions] = useState<boolean[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<(number | null)[]>([]);
  const [wrongQuestions, setWrongQuestions] = useState<Set<number>>(new Set());
  const [showModal, setShowModal] = useState(false);

  const currentDialogue = DIALOGUES_DATA[currentDialogueIndex];

  const prevDialogue = () => {
    playButtonClick();
    setCurrentDialogueIndex(prev => 
      prev > 0 ? prev - 1 : DIALOGUES_DATA.length - 1
    );
    resetPractice();
  };

  const nextDialogue = () => {
    playButtonClick();
    setCurrentDialogueIndex(prev => 
      prev < DIALOGUES_DATA.length - 1 ? prev + 1 : 0
    );
    resetPractice();
  };

  const startPractice = () => {
    playButtonClick();
    setMode('practice');
    setAnsweredQuestions(new Array(currentDialogue.questions.length).fill(false));
    setSelectedAnswers(new Array(currentDialogue.questions.length).fill(null));
    setWrongQuestions(new Set());
  };

  const resetPractice = () => {
    playButtonClick();
    setMode('dialogue');
    setAnsweredQuestions([]);
    setSelectedAnswers([]);
    setWrongQuestions(new Set());
  };

  const checkDialogueAnswer = (questionIndex: number, selected: number) => {
    if (answeredQuestions[questionIndex] && !wrongQuestions.has(questionIndex)) return;
    
    playButtonClick();

    const question = currentDialogue.questions[questionIndex];
    const isCorrect = selected === question.answer;

    const newSelected = [...selectedAnswers];
    newSelected[questionIndex] = selected;
    setSelectedAnswers(newSelected);

    if (isCorrect) {
      const newAnswered = [...answeredQuestions];
      newAnswered[questionIndex] = true;
      setAnsweredQuestions(newAnswered);
      
      const newWrong = new Set(wrongQuestions);
      newWrong.delete(questionIndex);
      setWrongQuestions(newWrong);
      
      addPoints(5);
      playCorrectSparkle();
    } else {
      const newWrong = new Set(wrongQuestions);
      newWrong.add(questionIndex);
      setWrongQuestions(newWrong);

      addWrongQuestion({
        id: `dialogue-${currentDialogue.id}-q${questionIndex}`,
        type: 'dialogue',
        question: { 
          id: `dialogue-${currentDialogue.id}-q${questionIndex}`,
          type: 'dialogue' as const,
          ...question 
        },
      });
      playWrongPop();
    }
  };

  const retryQuestion = (questionIndex: number) => {
    playButtonClick();
    const newSelected = [...selectedAnswers];
    newSelected[questionIndex] = null;
    setSelectedAnswers(newSelected);
    
    const newWrong = new Set(wrongQuestions);
    newWrong.delete(questionIndex);
    setWrongQuestions(newWrong);
  };

  const finishDialoguePractice = () => {
    playButtonClick();
    const d = userData;
    if (!d.completedQuizzes) {
      d.completedQuizzes = { dialogue: 0, sentence: 0, listening: 0, matching: 0, ordering: 0 };
    }
    d.completedQuizzes.dialogue++;
    addPoints(20);
    setShowModal(true);
  };

  const closeModal = () => {
    playButtonClick();
    setShowModal(false);
    resetPractice();
  };

  const allQuestionsAnswered = answeredQuestions.every(answered => answered);

  if (mode === 'dialogue') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary-50 to-orange-100 pb-8">
        <Header 
          showBack 
          title="🗣️ 对话练习" 
          points={userData.points}
        />

        <div className="max-w-2xl mx-auto px-4 mt-4">
          <div className="section-title">
            🗣️ 情景对话
            <span>({currentDialogueIndex + 1}/{DIALOGUES_DATA.length})</span>
          </div>

          <div className="dialogue-box">
            <div className="dialogue-header">
              <div className="dialogue-icon">{currentDialogue.icon}</div>
              <div className="dialogue-title">{currentDialogue.title}</div>
            </div>

            <div className="dialogue-list">
              {currentDialogue.dialogues.map((d, i) => (
                <div key={i} className={`dialogue-item ${d.speaker.toLowerCase()}`}>
                  <div className="dialogue-content">
                    <div className="dialogue-avatar">
                      {d.speaker === 'A' ? '👧' : '👨‍🏫'}
                    </div>
                    <div className="dialogue-text">
                      <div className="dialogue-name">{d.name}</div>
                      <div className="dialogue-sentence">{d.text}</div>
                      <button 
                        className="dialogue-speak"
                        onClick={() => speakEnglish(d.text)}
                      >
                        🔊 听发音
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="nav-buttons">
            <button className="nav-btn" onClick={prevDialogue}>
              ← 上一个
            </button>
            <button 
              className="nav-btn" 
              onClick={startPractice}
              style={{ background: '#f97316', color: 'white' }}
            >
              开始练习
            </button>
            <button className="nav-btn" onClick={nextDialogue}>
              下一个 →
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-orange-100 pb-8">
      <Header 
        showBack 
        title={`🗣️ ${currentDialogue.title}`} 
        points={userData.points}
      />

      <div className="max-w-2xl mx-auto px-4 mt-4">
        <button
          onClick={resetPractice}
          className="text-sm text-gray-500 hover:text-pink-600 underline mb-4 block"
        >
          ← 返回对话
        </button>

        <div className="quiz-container">
          <div className="quiz-question">对话理解练习</div>
          
          {currentDialogue.questions.map((q, i) => (
            <div key={i} className="mb-6">
              <div className="bg-pink-100 rounded-xl p-4 mb-4">
                <div className="flex items-start gap-3">
                  <span className="font-bold text-pink-600">A:</span>
                  <span className="flex-1 text-gray-700">{q.speakerA}</span>
                  <button
                    onClick={() => speakEnglish(q.speakerA)}
                    className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white flex-shrink-0"
                  >
                    🔊
                  </button>
                </div>
              </div>
              
              <p className="text-center text-gray-500 text-sm mb-4">选择B最合适的回应:</p>
              
              <div className="space-y-3">
                {q.options.map((opt, j) => {
                  const isSelected = selectedAnswers[i] === j;
                  const isCorrect = j === q.answer;
                  const isWrong = wrongQuestions.has(i) && isSelected && !isCorrect;
                  
                  return (
                    <div
                      key={j}
                      className={cn(
                        'p-4 rounded-xl border-2 cursor-pointer transition-all',
                        isSelected && isCorrect && 'border-green-500 bg-green-50',
                        isWrong && 'border-pink-500 bg-pink-100',
                        !isSelected && isCorrect && answeredQuestions[i] && 'border-green-500 bg-green-50',
                        !isSelected && !answeredQuestions[i] && 'border-pink-200 hover:border-pink-400',
                        answeredQuestions[i] && !isSelected && !isCorrect && 'opacity-50 border-pink-200'
                      )}
                      onClick={() => checkDialogueAnswer(i, j)}
                    >
                      <div className="flex items-start gap-3">
                        <span className={cn(
                          'font-bold',
                          isSelected && isCorrect ? 'text-green-600' : 'text-pink-600'
                        )}>B:</span>
                        <span className={cn(
                          'flex-1',
                          isSelected && isCorrect ? 'text-green-800' : 
                          isWrong ? 'text-pink-800' : 'text-gray-700'
                        )}>{opt}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            speakEnglish(opt);
                          }}
                          className={cn(
                            'w-8 h-8 rounded-full flex items-center justify-center text-white flex-shrink-0',
                            isSelected && isCorrect ? 'bg-green-500' : 'bg-orange-500'
                          )}
                        >
                          🔊
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {answeredQuestions[i] && !wrongQuestions.has(i) && (
                <div className="mt-4 p-4 rounded-xl text-center bg-green-100 text-green-800">
                  <p className="font-bold text-lg">✓ 太棒了！你真是个英语小天才！</p>
                </div>
              )}
              
              {wrongQuestions.has(i) && (
                <div className="mt-4 flex items-center justify-center gap-3 bg-orange-100 rounded-xl p-4">
                  <span className="text-3xl">🐰</span>
                  <div className="flex-1">
                    <p className="font-bold text-orange-800">再想想！</p>
                    <p className="text-sm text-orange-600">仔细听一听对话的意思哦~</p>
                  </div>
                  <button
                    onClick={() => retryQuestion(i)}
                    className="px-4 py-2 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600"
                  >
                    再试一次
                  </button>
                </div>
              )}
            </div>
          ))}

          {allQuestionsAnswered && (
            <button 
              className="order-submit"
              onClick={finishDialoguePractice}
            >
              完成练习
            </button>
          )}
        </div>
      </div>

      {showModal && (
        <div className="modal-backdrop flex items-center justify-center">
          <div className="bg-white rounded-2xl p-8 mx-4 text-center max-w-sm w-full shadow-warm-lg">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">练习完成</h2>
            <p className="text-gray-600 mb-6">太棒了！你完成了这个对话的练习！获得20积分！</p>
            <button
              onClick={closeModal}
              className="px-8 py-3 bg-primary-500 text-white font-bold rounded-full hover:bg-primary-600"
            >
              确定
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
