import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { useUserData } from '@/hooks/useUserData';
import { useSpeech } from '@/hooks/useSpeech';
import { DIALOGUES_DATA } from '@/data/questions';

type Mode = 'dialogue' | 'practice';

export function DialoguePage() {
  const navigate = useNavigate();
  const { addPoints, userData, addWrongQuestion } = useUserData();
  const { speakEnglish } = useSpeech();

  const [currentDialogueIndex, setCurrentDialogueIndex] = useState(0);
  const [mode, setMode] = useState<Mode>('dialogue');
  const [answeredQuestions, setAnsweredQuestions] = useState<boolean[]>([]);
  const [showModal, setShowModal] = useState(false);

  const currentDialogue = DIALOGUES_DATA[currentDialogueIndex];

  const prevDialogue = () => {
    setCurrentDialogueIndex(prev => 
      prev > 0 ? prev - 1 : DIALOGUES_DATA.length - 1
    );
    resetPractice();
  };

  const nextDialogue = () => {
    setCurrentDialogueIndex(prev => 
      prev < DIALOGUES_DATA.length - 1 ? prev + 1 : 0
    );
    resetPractice();
  };

  const startPractice = () => {
    setMode('practice');
    setAnsweredQuestions(new Array(currentDialogue.questions.length).fill(false));
  };

  const resetPractice = () => {
    setMode('dialogue');
    setAnsweredQuestions([]);
  };

  const checkDialogueAnswer = (questionIndex: number, selected: number) => {
    if (answeredQuestions[questionIndex]) return;

    const question = currentDialogue.questions[questionIndex];
    const isCorrect = selected === question.answer;

    const newAnswered = [...answeredQuestions];
    newAnswered[questionIndex] = true;
    setAnsweredQuestions(newAnswered);

    if (isCorrect) {
      addPoints(5);
    } else {
      addWrongQuestion({
        id: `dialogue-${currentDialogue.id}-q${questionIndex}`,
        type: 'dialogue',
        question: { 
          id: `dialogue-${currentDialogue.id}-q${questionIndex}`,
          type: 'dialogue' as const,
          ...question 
        },
      });
    }
  };

  const finishDialoguePractice = () => {
    const d = userData;
    if (!d.completedQuizzes) {
      d.completedQuizzes = { dialogue: 0, sentence: 0, listening: 0, matching: 0, ordering: 0 };
    }
    d.completedQuizzes.dialogue++;
    addPoints(20);
    setShowModal(true);
  };

  const closeModal = () => {
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
            <div key={i} style={{ marginBottom: '20px' }}>
              <div style={{ fontWeight: 500, marginBottom: '8px' }}>
                {i + 1}. {q.question}
              </div>
              <div className="quiz-options">
                {q.options.map((opt, j) => (
                  <div
                    key={j}
                    className={`quiz-option ${
                      answeredQuestions[i] 
                        ? j === q.answer 
                          ? 'correct' 
                          : (answeredQuestions[i] ? 'wrong' : '')
                        : ''
                    }`}
                    onClick={() => checkDialogueAnswer(i, j)}
                  >
                    {opt}
                  </div>
                ))}
              </div>
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
