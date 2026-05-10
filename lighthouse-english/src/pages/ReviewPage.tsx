import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { SpeechButton } from '@/components/SpeechButton';
import { useUserData } from '@/hooks/useUserData';
import { cn, shuffleArray } from '@/lib/utils';
import { GRADE_3A, GRADE_3B } from '@/data/wordLearning';
import { WordLearningRecord, MarkedWord } from '@/types';

type ReviewMode = 'home' | 'smart' | 'wrong' | 'marked';
type QuestionType = 'flashcard' | 'select' | 'listening' | 'spelling';

interface ReviewWord {
  word: string;
  meaning: string;
  phonetic: string;
  image?: string;
  textbookId: string;
  unitId: number;
  record?: WordLearningRecord;
}

function getWordImage(word: string): string {
  const wordImages: Record<string, string> = {
    name: '👤', nice: '😊', ear: '👂', hand: '🤚', eye: '👀', mouth: '👄',
    arm: '💪', can: '🥫', share: '🤝', smile: '😄', listen: '👂',
    help: '🙋', say: '💬', and: '➕', goodbye: '👋', toy: '🧸',
    friend: '👭', good: '👍', mum: '👩', dad: '👨', grandma: '👵',
    grandpa: '👴', mother: '👩', father: '👨', me: '🙋', sister: '👧',
    family: '👨👩👧👦', have: '🤲', big: '🗿', cousin: '👨‍👩‍👧‍👦',
    brother: '👦', baby: '👶', uncle: '👨', aunt: '👩', some: '👀',
    small: '🐜', like: '❤️', dog: '🐕', pet: '🐾', cat: '🐱',
    fish: '🐟', bird: '🐦', rabbit: '🐰', go: '🚶', zoo: '🏛️',
    fox: '🦊', Miss: '👩‍🏫', panda: '🐼', 'red panda': '🐼',
    cute: '🥰', monkey: '🐒', tiger: '🐅', elephant: '🐘',
    lion: '🦁', animal: '🐾', giraffe: '🦒', tall: '🏀',
    fast: '⚡', apple: '🍎', banana: '🍌', farm: '🏡',
    air: '💨', orange: '🍊', grape: '🍇', school: '🏫',
    garden: '🌻', need: '🛒', water: '💧', flower: '🌸',
    grass: '🌿', plant: '🌱', new: '🆕', tree: '🌳',
    sun: '☀️', give: '🎁', us: '👥', them: '👥',
    colour: '🎨', green: '💚', red: '❤️', blue: '💙',
    make: '🔧', purple: '💜', brown: '🤎', bear: '🐻',
    yellow: '💛', duck: '🦆', sea: '🌊', pink: '💗',
    draw: '✏️', white: '⬜', black: '⬛', old: '👵',
    five: '5️⃣', year: '📅', one: '1️⃣', two: '2️⃣',
    three: '3️⃣', four: '4️⃣', ten: '🔟', six: '6️⃣',
    seven: '7️⃣', eight: '8️⃣', nine: '9️⃣', "o'clock": '⏰',
    cut: '✂️', eat: '🍽️', cake: '🎂', where: '📍',
    from: '🚂', about: 'ℹ️', today: '📅', teacher: '👩‍🏫',
    student: '👨‍🎓', after: '⏭️', who: '❓', girl: '👧',
    neighbour: '🏠', boy: '👦', woman: '👩', man: '👨',
    Mr: '👨‍💼', classmate: '👨‍👩‍👧‍👦', he: '👨', also: '➕',
    English: '🇬🇧', she: '👩', very: '✅', UK: '🇬🇧',
    China: '🇨🇳', Canada: '🇨🇦', USA: '🇺🇸', has: '🤲',
    long: '📏', body: '👤', short: '📏', leg: '🦵',
    right: '✅', fat: '🍔', thin: '🦴', slow: '🐢',
    love: '❤️', tail: '🐿️', her: '👩', gift: '🎁',
    picture: '🖼️', card: '🃏', sing: '🎤', dance: '💃',
    talk: '💬', face: '😊', song: '🎶', or: '🔘',
    much: '🤯', eraser: '🧹', find: '🔍', ruler: '📏',
    pen: '✒️', pencil: '✏️', book: '📚', bag: '🎒',
    paper: '📄', these: '👆', see: '👀', smell: '👃',
    taste: '👅', hear: '👂', touch: '🤚', learn: '📖',
    nose: '👃', tongue: '👅', class: '🏫', 'in class': '📚',
    computer: '💻', breakfast: '🍳', time: '⏰', bread: '🍞',
    egg: '🥚', milk: '🥛', noodle: '🍜', juice: '🧃',
    rice: '🍚', meat: '🥩', vegetable: '🥦', healthy: '💪',
    plate: '🍽️', soup: '🥣', fruit: '🍇', colourful: '🌈',
    candy: '🍬', yummy: '😋', at: '📍', boat: '🚤',
    cool: '😎', keep: '🤲', home: '🏠', ball: '⚽',
    doll: '🧸', car: '🚗', on: '🔝', shelf: '📚',
    in: '📦', box: '📦', cap: '🧢', map: '🗺️',
    under: '⬇️', still: '⏳', put: '🤲', fifteen: '1️⃣5️⃣',
    twelve: '1️⃣2️⃣', fourteen: '1️⃣4️⃣', thirteen: '1️⃣3️⃣',
    eleven: '1️⃣1️⃣', twenty: '2️⃣0️⃣', seventeen: '1️⃣7️⃣',
    sixteen: '1️⃣6️⃣', eighteen: '1️⃣8️⃣', nineteen: '1️⃣9️⃣',
    'piggy bank': '🐷', pay: '💳', back: '🔙',
  };
  return wordImages[word.toLowerCase()] || '📚';
}

function getRandomDistractors(correctMeaning: string, allWords: ReviewWord[]): string[] {
  const distractors = allWords
    .filter(w => w.meaning !== correctMeaning)
    .map(w => w.meaning);
  return shuffleArray(distractors).slice(0, 3);
}

export function ReviewPage() {
  const navigate = useNavigate();
  const {
    userData,
    addPoints,
    addWrongQuestion,
    markWrongQuestionCorrect,
    getWordsForReview,
    recordWordReview,
    addMarkedWord,
    removeMarkedWord,
    isWordMarked,
  } = useUserData();

  const [reviewMode, setReviewMode] = useState<ReviewMode>('home');
  const [currentWords, setCurrentWords] = useState<ReviewWord[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [questionType, setQuestionType] = useState<QuestionType>('flashcard');
  const [showAnswer, setShowAnswer] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [started, setStarted] = useState(false);
  const [spellingInput, setSpellingInput] = useState('');
  const [showSpellingHint, setShowSpellingHint] = useState(false);
  const [wrongAnswers, setWrongAnswers] = useState<ReviewWord[]>([]);
  const [stageIndex, setStageIndex] = useState(0);

  const allTextbookWords = useMemo(() => {
    const words: ReviewWord[] = [];
    [GRADE_3A, GRADE_3B].forEach(textbook => {
      textbook.units.forEach(unit => {
        unit.words.forEach(word => {
          words.push({
            word: word.word,
            meaning: word.meaning,
            phonetic: word.phonetic,
            image: word.image || getWordImage(word.word),
            textbookId: textbook.id,
            unitId: unit.id,
            record: userData.wordLearningRecords.find(
              r => r.word === word.word && r.textbookId === textbook.id && r.unitId === unit.id
            ),
          });
        });
      });
    });
    return words;
  }, [userData.wordLearningRecords]);

  const pendingReviewWords = useMemo(() => {
    const pendingRecords = getWordsForReview();
    return pendingRecords.map(record => {
      const wordInfo = allTextbookWords.find(
        w => w.word === record.word && w.textbookId === record.textbookId && w.unitId === record.unitId
      );
      return {
        ...record,
        meaning: wordInfo?.meaning || '',
        phonetic: wordInfo?.phonetic || '',
        image: wordInfo?.image || getWordImage(record.word),
      };
    });
  }, [getWordsForReview, allTextbookWords]);

  const wrongQuestions = userData.wrongQuestions;
  const markedWords = userData.markedWords;

  const currentWord = currentWords[currentIndex];
  const options = useMemo(() => {
    if (!currentWord) return [];
    const distractors = getRandomDistractors(currentWord.meaning, allTextbookWords);
    return shuffleArray([currentWord.meaning, ...distractors]);
  }, [currentWord, allTextbookWords]);

  const initReviewSession = (words: ReviewWord[]) => {
    setCurrentWords(shuffleArray([...words]));
    setCurrentIndex(0);
    setQuestionType('flashcard');
    setShowAnswer(false);
    setSelectedAnswer(null);
    setIsCorrect(null);
    setScore(0);
    setGameOver(false);
    setStarted(true);
    setSpellingInput('');
    setShowSpellingHint(false);
    setWrongAnswers([]);
    setStageIndex(0);
  };

  const startSmartReview = () => {
    const words: ReviewWord[] = [];
    pendingReviewWords.forEach(record => {
      const word = allTextbookWords.find(
        w => w.word === record.word && w.textbookId === record.textbookId && w.unitId === record.unitId
      );
      if (word) {
        words.push({
          ...word,
          record,
        });
      }
    });
    initReviewSession(words);
    setReviewMode('smart');
  };

  const startWrongReview = () => {
    const words: ReviewWord[] = [];
    wrongQuestions.forEach(wq => {
      const word = allTextbookWords.find(w => w.word === wq.question.word);
      if (word) {
        words.push(word);
      }
    });
    initReviewSession(words);
    setReviewMode('wrong');
  };

  const startMarkedReview = () => {
    const words: ReviewWord[] = markedWords.map(mw => ({
      ...mw,
      image: getWordImage(mw.word),
    }));
    initReviewSession(words);
    setReviewMode('marked');
  };

  const handleFlashcardResult = (result: 'know' | 'fuzzy' | 'unknown') => {
    if (!currentWord) return;

    if (result === 'unknown') {
      setWrongAnswers(prev => [...prev, currentWord]);
    }

    if (currentWord.record) {
      recordWordReview(currentWord.word, currentWord.textbookId, currentWord.unitId, result !== 'unknown');
    }

    goToNext();
  };

  const handleSelectAnswer = (answer: string) => {
    if (selectedAnswer !== null || !currentWord) return;

    setSelectedAnswer(answer);
    const correct = answer === currentWord.meaning;
    setIsCorrect(correct);

    if (correct) {
      setScore(prev => prev + 5);
      addPoints(5);
      if (currentWord.record) {
        recordWordReview(currentWord.word, currentWord.textbookId, currentWord.unitId, true);
      }
      if (reviewMode === 'wrong') {
        const wq = wrongQuestions.find(q => q.question.word === currentWord.word);
        if (wq) {
          markWrongQuestionCorrect(wq.id);
        }
      }
    } else {
      setWrongAnswers(prev => [...prev, currentWord]);
      if (currentWord.record) {
        recordWordReview(currentWord.word, currentWord.textbookId, currentWord.unitId, false);
      }
      if (reviewMode !== 'wrong') {
        addWrongQuestion({
          id: `word_${currentWord.word}_${Date.now()}`,
          type: 'matching',
          question: {
            id: `word_${currentWord.word}`,
            word: currentWord.word,
            correctAnswer: currentWord.meaning,
            image: currentWord.image,
            type: 'matching',
          },
        });
      }
    }
  };

  const handleSpellingSubmit = () => {
    if (!currentWord || !spellingInput.trim()) return;

    const correct = spellingInput.trim().toLowerCase() === currentWord.word.toLowerCase();
    setIsCorrect(correct);

    if (correct) {
      setScore(prev => prev + 10);
      addPoints(10);
      if (currentWord.record) {
        recordWordReview(currentWord.word, currentWord.textbookId, currentWord.unitId, true);
      }
    } else {
      setWrongAnswers(prev => [...prev, currentWord]);
      if (currentWord.record) {
        recordWordReview(currentWord.word, currentWord.textbookId, currentWord.unitId, false);
      }
    }
  };

  const goToNext = () => {
    if (currentIndex < currentWords.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setShowAnswer(false);
      setSelectedAnswer(null);
      setIsCorrect(null);
      setSpellingInput('');
      setShowSpellingHint(false);

      const nextStageIndex = Math.floor((currentIndex + 1) / Math.ceil(currentWords.length / 4)) + 1;
      if (nextStageIndex !== stageIndex && nextStageIndex <= 4) {
        setStageIndex(nextStageIndex);
      }

      const stages: QuestionType[] = ['flashcard', 'select', 'listening', 'spelling'];
      const stageWordCount = Math.ceil(currentWords.length / 4);
      const currentStage = Math.floor((currentIndex + 1) / stageWordCount);
      setQuestionType(stages[Math.min(currentStage, stages.length - 1)]);
    } else {
      setGameOver(true);
    }
  };

  const toggleMarkWord = () => {
    if (!currentWord) return;
    const marked = isWordMarked(currentWord.word, currentWord.textbookId, currentWord.unitId);
    if (marked) {
      removeMarkedWord(currentWord.word, currentWord.textbookId, currentWord.unitId);
    } else {
      addMarkedWord(currentWord.word, currentWord.textbookId, currentWord.unitId, currentWord.meaning, currentWord.phonetic);
    }
  };

  if (!started) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary-50 to-orange-100 pb-8">
        <Header showBack title="复习" />
        <div className="max-w-4xl mx-auto px-4 mt-8">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">📚</div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">智能复习</h1>
            <p className="text-gray-600">根据艾宾浩斯遗忘曲线，科学安排复习计划</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={startSmartReview}
              disabled={pendingReviewWords.length === 0}
              className={cn(
                'bg-white rounded-2xl p-6 shadow-warm-lg text-center transition-all',
                pendingReviewWords.length === 0 && 'opacity-50 cursor-not-allowed'
              )}
            >
              <div className="text-4xl mb-3">🎯</div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">今日智能复习</h3>
              <p className="text-gray-500 text-sm mb-2">系统自动安排的单词</p>
              <div className="inline-block px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium">
                {pendingReviewWords.length} 个单词
              </div>
            </button>

            <button
              onClick={startWrongReview}
              disabled={wrongQuestions.length === 0}
              className={cn(
                'bg-white rounded-2xl p-6 shadow-warm-lg text-center transition-all',
                wrongQuestions.length === 0 && 'opacity-50 cursor-not-allowed'
              )}
            >
              <div className="text-4xl mb-3">❌</div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">错题本</h3>
              <p className="text-gray-500 text-sm mb-2">需要加强的单词</p>
              <div className="inline-block px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                {wrongQuestions.length} 道错题
              </div>
            </button>

            <button
              onClick={startMarkedReview}
              disabled={markedWords.length === 0}
              className={cn(
                'bg-white rounded-2xl p-6 shadow-warm-lg text-center transition-all',
                markedWords.length === 0 && 'opacity-50 cursor-not-allowed'
              )}
            >
              <div className="text-4xl mb-3">⭐</div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">重点词</h3>
              <p className="text-gray-500 text-sm mb-2">自己标记的难词</p>
              <div className="inline-block px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
                {markedWords.length} 个单词
              </div>
            </button>
          </div>

          <div className="mt-8 bg-white rounded-2xl p-6 shadow-warm-lg">
            <h3 className="text-lg font-bold text-gray-800 mb-4 text-center">📖 复习小贴士</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="p-3 bg-purple-50 rounded-xl">
                <div className="text-2xl mb-2">1️⃣</div>
                <p className="text-sm text-gray-600">闪卡快速回忆</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl">
                <div className="text-2xl mb-2">2️⃣</div>
                <p className="text-sm text-gray-600">英文选中文</p>
              </div>
              <div className="p-3 bg-green-50 rounded-xl">
                <div className="text-2xl mb-2">3️⃣</div>
                <p className="text-sm text-gray-600">听音选义</p>
              </div>
              <div className="p-3 bg-orange-50 rounded-xl">
                <div className="text-2xl mb-2">4️⃣</div>
                <p className="text-sm text-gray-600">拼写练习</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (gameOver) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary-50 to-orange-100 pb-8">
        <Header showBack title="复习完成" />
        <div className="max-w-4xl mx-auto px-4 mt-8">
          <div className="bg-white rounded-2xl p-8 shadow-warm-lg text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">复习完成！</h2>
            <p className="text-gray-600 mb-4">继续保持，单词记得更牢固！</p>
            
            <div className="bg-purple-50 rounded-xl p-4 mb-6">
              <p className="text-3xl font-bold text-purple-600">得分：{score}</p>
              <p className="text-gray-500 text-sm">+{score} 积分</p>
            </div>

            {wrongAnswers.length > 0 && (
              <div className="bg-red-50 rounded-xl p-4 mb-6">
                <p className="text-red-700 font-medium mb-2">需要复习的单词：</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {wrongAnswers.map((w, i) => (
                    <span key={i} className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm">
                      {w.word}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  setStarted(false);
                  setReviewMode('home');
                }}
                className="w-full py-3 bg-primary-500 text-white font-bold rounded-xl hover:bg-primary-600"
              >
                返回复习首页
              </button>
              <button
                onClick={() => navigate('/')}
                className="w-full py-3 bg-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-300"
              >
                返回首页
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-orange-100 pb-8">
      <Header showBack title="复习" />

      <div className="max-w-4xl mx-auto px-4 mt-4">
        <div className="bg-white rounded-xl p-3 shadow-warm mb-4">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                阶段 {stageIndex}/4
                <span className="ml-2 text-purple-600 font-bold">
                  ({['闪卡', '选词', '听音', '拼写'][stageIndex - 1] || '复习'})
                </span>
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                {currentIndex + 1}/{currentWords.length}
              </span>
              <span className="font-bold text-purple-600">得分: {score}</span>
            </div>
          </div>
          <div className="w-full bg-purple-100 rounded-full h-2">
            <div
              className="h-full bg-purple-500 rounded-full transition-all"
              style={{ width: `${((currentIndex + 1) / currentWords.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-warm">
          {questionType === 'flashcard' && currentWord && (
            <div className="text-center">
              <button
                onClick={toggleMarkWord}
                className={cn(
                  'absolute top-4 right-4 p-2 rounded-full transition-all',
                  isWordMarked(currentWord.word, currentWord.textbookId, currentWord.unitId)
                    ? 'bg-yellow-100 text-yellow-600'
                    : 'bg-gray-100 text-gray-400 hover:bg-yellow-50 hover:text-yellow-500'
                )}
              >
                {isWordMarked(currentWord.word, currentWord.textbookId, currentWord.unitId) ? '⭐' : '☆'}
              </button>

              <div className="text-6xl mb-4">{currentWord.image}</div>
              <h2 className="text-3xl font-bold text-gray-800 mb-2">{currentWord.word}</h2>
              <SpeechButton text={currentWord.word} size="lg" className="mb-4" />
              
              {!showAnswer ? (
                <>
                  <p className="text-gray-500 mb-6">点击卡片查看中文意思</p>
                  <button
                    onClick={() => setShowAnswer(true)}
                    className="px-8 py-3 bg-primary-500 text-white font-bold rounded-full hover:bg-primary-600 transition-colors"
                  >
                    翻转卡片
                  </button>
                </>
              ) : (
                <>
                  <p className="text-xl text-green-600 font-medium mb-2">{currentWord.meaning}</p>
                  <p className="text-gray-400 mb-6">{currentWord.phonetic}</p>
                  <div className="flex justify-center gap-3">
                    <button
                      onClick={() => handleFlashcardResult('know')}
                      className="px-6 py-3 bg-green-500 text-white font-bold rounded-full hover:bg-green-600 transition-colors"
                    >
                      ✅ 认识
                    </button>
                    <button
                      onClick={() => handleFlashcardResult('fuzzy')}
                      className="px-6 py-3 bg-yellow-500 text-white font-bold rounded-full hover:bg-yellow-600 transition-colors"
                    >
                      🤔 模糊
                    </button>
                    <button
                      onClick={() => handleFlashcardResult('unknown')}
                      className="px-6 py-3 bg-red-500 text-white font-bold rounded-full hover:bg-red-600 transition-colors"
                    >
                      ❌ 不认识
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {questionType === 'select' && currentWord && (
            <div className="text-center">
              <div className="text-5xl mb-4">{currentWord.image}</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">{currentWord.word}</h2>
              <SpeechButton text={currentWord.word} size="lg" className="mb-4" />
              <p className="text-gray-500 mb-6">请选择正确的中文意思</p>

              <div className="grid grid-cols-2 gap-3">
                {options.map((option, index) => {
                  const isSelected = selectedAnswer === option;
                  const isCorrectAnswer = option === currentWord.meaning;

                  return (
                    <button
                      key={index}
                      onClick={() => handleSelectAnswer(option)}
                      disabled={selectedAnswer !== null}
                      className={cn(
                        'p-4 rounded-xl border-2 transition-all',
                        selectedAnswer === null && 'border-purple-200 hover:border-purple-400 hover:bg-purple-50',
                        isSelected && isCorrectAnswer && 'border-green-500 bg-green-50 correct-animation',
                        isSelected && !isCorrectAnswer && 'border-red-500 bg-red-50 wrong-animation',
                        !isSelected && isCorrectAnswer && selectedAnswer !== null && 'border-green-500 bg-green-50',
                        selectedAnswer !== null && !isSelected && !isCorrectAnswer && 'opacity-50'
                      )}
                    >
                      <span className={cn(
                        'font-medium',
                        isSelected && isCorrectAnswer && 'text-green-600',
                        isSelected && !isCorrectAnswer && 'text-red-600',
                        !isSelected && 'text-gray-700'
                      )}>
                        {option}
                      </span>
                      {isSelected && (
                        <span className={isCorrectAnswer ? 'text-green-500 ml-2' : 'text-red-500 ml-2'}>
                          {isCorrectAnswer ? '✓' : '✗'}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {selectedAnswer !== null && (
                <div className="mt-4">
                  <button
                    onClick={goToNext}
                    className="px-8 py-3 bg-primary-500 text-white font-bold rounded-full hover:bg-primary-600 transition-colors"
                  >
                    下一题 →
                  </button>
                </div>
              )}
            </div>
          )}

          {questionType === 'listening' && currentWord && (
            <div className="text-center">
              <div className="text-5xl mb-4">🔊</div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">听音选义</h2>
              <p className="text-gray-500 mb-2">仔细听发音，选择正确的中文意思</p>
              <SpeechButton text={currentWord.word} size="lg" className="mb-6" />

              <div className="grid grid-cols-2 gap-3">
                {options.map((option, index) => {
                  const isSelected = selectedAnswer === option;
                  const isCorrectAnswer = option === currentWord.meaning;

                  return (
                    <button
                      key={index}
                      onClick={() => handleSelectAnswer(option)}
                      disabled={selectedAnswer !== null}
                      className={cn(
                        'p-4 rounded-xl border-2 transition-all',
                        selectedAnswer === null && 'border-blue-200 hover:border-blue-400 hover:bg-blue-50',
                        isSelected && isCorrectAnswer && 'border-green-500 bg-green-50',
                        isSelected && !isCorrectAnswer && 'border-red-500 bg-red-50',
                        !isSelected && isCorrectAnswer && selectedAnswer !== null && 'border-green-500 bg-green-50',
                        selectedAnswer !== null && !isSelected && !isCorrectAnswer && 'opacity-50'
                      )}
                    >
                      <span className={cn(
                        'font-medium',
                        isSelected && isCorrectAnswer && 'text-green-600',
                        isSelected && !isCorrectAnswer && 'text-red-600',
                        !isSelected && 'text-gray-700'
                      )}>
                        {option}
                      </span>
                      {isSelected && (
                        <span className={isCorrectAnswer ? 'text-green-500 ml-2' : 'text-red-500 ml-2'}>
                          {isCorrectAnswer ? '✓' : '✗'}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {selectedAnswer !== null && (
                <div className="mt-6">
                  <div className="bg-blue-50 rounded-xl p-4 mb-4">
                    <p className="text-blue-700">正确答案的单词：</p>
                    <p className="text-xl font-bold text-blue-600">{currentWord.word}</p>
                    <SpeechButton text={currentWord.word} size="sm" className="mt-2" />
                  </div>
                  <button
                    onClick={goToNext}
                    className="px-8 py-3 bg-primary-500 text-white font-bold rounded-full hover:bg-primary-600 transition-colors"
                  >
                    下一题 →
                  </button>
                </div>
              )}
            </div>
          )}

          {questionType === 'spelling' && currentWord && (
            <div className="text-center">
              <div className="text-5xl mb-4">{currentWord.image}</div>
              <h2 className="text-xl font-bold text-gray-800 mb-1">{currentWord.meaning}</h2>
              <p className="text-gray-400 mb-2">{currentWord.phonetic}</p>
              <SpeechButton text={currentWord.word} size="lg" className="mb-6" />
              <p className="text-gray-500 mb-4">请拼写这个单词</p>

              <div className="max-w-md mx-auto">
                <input
                  type="text"
                  value={spellingInput}
                  onChange={(e) => setSpellingInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSpellingSubmit()}
                  placeholder="输入单词..."
                  className="w-full px-4 py-3 text-xl text-center border-2 border-purple-200 rounded-xl focus:border-purple-500 focus:outline-none"
                  disabled={isCorrect !== null}
                />

                {!showSpellingHint && isCorrect === null && (
                  <button
                    onClick={() => setShowSpellingHint(true)}
                    className="mt-3 text-gray-400 text-sm hover:text-gray-600"
                  >
                    需要提示？
                  </button>
                )}

                {showSpellingHint && (
                  <div className="mt-3 bg-yellow-50 rounded-xl p-3">
                    <p className="text-yellow-700 font-medium">提示：首字母是 "{currentWord.word[0]}"</p>
                  </div>
                )}

                {isCorrect !== null && (
                  <div className={cn(
                    'mt-4 rounded-xl p-4',
                    isCorrect ? 'bg-green-50' : 'bg-red-50'
                  )}>
                    <p className={cn(
                      'font-bold text-lg',
                      isCorrect ? 'text-green-600' : 'text-red-600'
                    )}>
                      {isCorrect ? '🎉 正确！' : '😅 再接再厉！'}
                    </p>
                    {!isCorrect && (
                      <div className="mt-2">
                        <p className="text-gray-600">正确答案：</p>
                        <p className="text-xl font-bold text-green-600">{currentWord.word}</p>
                        <SpeechButton text={currentWord.word} size="sm" className="mt-2" />
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-4">
                  {isCorrect === null ? (
                    <button
                      onClick={handleSpellingSubmit}
                      disabled={!spellingInput.trim()}
                      className={cn(
                        'px-8 py-3 font-bold rounded-full transition-colors',
                        spellingInput.trim()
                          ? 'bg-primary-500 text-white hover:bg-primary-600'
                          : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      )}
                    >
                      确认答案
                    </button>
                  ) : (
                    <button
                      onClick={goToNext}
                      className="px-8 py-3 bg-primary-500 text-white font-bold rounded-full hover:bg-primary-600 transition-colors"
                    >
                      下一题 →
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}