import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { SpeechButton } from '@/components/SpeechButton';
import { useUserData } from '@/hooks/useUserData';
import { cn, shuffleArray } from '@/lib/utils';
import { GRADE_3A, GRADE_3B } from '@/data/wordLearning';
import type { QuestionData, WordLearningRecord } from '@/types';

type ReviewMode = 'home' | 'smart' | 'wrong' | 'marked' | 'all' | 'quick';
type QuestionType = 'flashcard' | 'select' | 'listening' | 'spelling';
type FlashcardResult = 'know' | 'fuzzy' | 'unknown';

interface ReviewWord {
  word: string;
  meaning: string;
  phonetic: string;
  image?: string;
  textbookId: string;
  unitId: number;
  unitName: string;
  record?: WordLearningRecord;
  wordIndex: number;
  originalQuestionType?: 'phonetic' | 'sentence' | 'dialogue' | 'listening' | 'matching' | 'ordering';
  originalQuestion?: QuestionData;
  flashcardResult?: 'know' | 'fuzzy' | 'unknown';
  selectCorrect?: boolean;
  listeningCorrect?: boolean;
  spellingCorrect?: boolean;
  spellingHintsUsed?: number;
  wrongCount?: number;
}

interface ReviewSession {
  words: ReviewWord[];
  currentIndex: number;
  questionType: QuestionType;
  stageIndex: number;
  showAnswer: boolean;
  selectedAnswer: string | null;
  isCorrect: boolean | null;
  spellingInput: string;
  showSpellingHint: boolean;
  spellingHintLevel: number;
  roundWrongWords: ReviewWord[];
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
    much: '🤯', find: '🔍', ruler: '📏',
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
    markWordLearned,
  } = useUserData();

  const [reviewMode, setReviewMode] = useState<ReviewMode>('home');
  const [session, setSession] = useState<ReviewSession | null>(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [started, setStarted] = useState(false);
  const [totalScore, setTotalScore] = useState(0);
  const [roundCorrectCount, setRoundCorrectCount] = useState(0);
  const [roundTotalCount, setRoundTotalCount] = useState(0);
  const [allWrongWords, setAllWrongWords] = useState<ReviewWord[]>([]);
  const [roundNumber, setRoundNumber] = useState(1);
  const [showQuickReviewConfirm, setShowQuickReviewConfirm] = useState(false);
  const [showWrongWordDetail, setShowWrongWordDetail] = useState(false);
  const [showMarkedWordDetail, setShowMarkedWordDetail] = useState(false);
  const [isMarkedLocal, setIsMarkedLocal] = useState<boolean | null>(null);
  const [forceUpdate, setForceUpdate] = useState(0);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [dailyGoal, setDailyGoal] = useState(20);
  const [todayReviewed, setTodayReviewed] = useState(0);

  useEffect(() => {
    const today = new Date().toDateString();
    const savedTodayReviewed = localStorage.getItem(`reviewed_${today}`);
    if (savedTodayReviewed) {
      setTodayReviewed(parseInt(savedTodayReviewed));
    }
    const savedGoal = localStorage.getItem('dailyReviewGoal');
    if (savedGoal) {
      setDailyGoal(parseInt(savedGoal));
    }
  }, []);

  const saveTodayReviewed = (count: number) => {
    const today = new Date().toDateString();
    localStorage.setItem(`reviewed_${today}`, count.toString());
  };

  const allTextbookWords = useMemo(() => {
    const words: ReviewWord[] = [];
    let wordIndex = 0;
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
            unitName: unit.title,
            record: userData.wordLearningRecords.find(
              r => r.word === word.word && r.textbookId === textbook.id && r.unitId === unit.id
            ),
            wordIndex: wordIndex++,
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
        word: record.word,
        meaning: wordInfo?.meaning || '',
        phonetic: wordInfo?.phonetic || '',
        image: wordInfo?.image || getWordImage(record.word),
        textbookId: record.textbookId,
        unitId: record.unitId,
        unitName: wordInfo?.unitName || '',
        record: record,
        wordIndex: wordInfo?.wordIndex || 0,
      };
    });
  }, [getWordsForReview, allTextbookWords]);

  const wrongQuestions = userData.wrongQuestions;
  const markedWords = userData.markedWords;
  const learnedWords = allTextbookWords.filter(w => w.record);

  const currentWord = session?.words[session.currentIndex];

  const options = useMemo(() => {
    const cw = session?.words[session?.currentIndex ?? -1];
    if (!cw) return [];
    const distractors = allTextbookWords
      .filter(w => w.meaning !== cw.meaning)
      .map(w => w.meaning);
    return shuffleArray(distractors).slice(0, 3);
  }, [session?.words, session?.currentIndex, allTextbookWords]);

  const getQuestionTypeForIndex = (index: number, total: number, mode: ReviewMode, word?: ReviewWord): QuestionType => {
    if (mode === 'wrong' && word?.originalQuestionType) {
      switch (word.originalQuestionType) {
        case 'listening':
          return 'listening';
        case 'matching':
          return 'select';
        case 'phonetic':
          return 'spelling';
        case 'sentence':
        case 'dialogue':
          return 'select';
        case 'ordering':
          return 'select';
        default:
          return 'select';
      }
    }

    if (total <= 4) {
      const stages: QuestionType[] = ['flashcard', 'select', 'listening', 'spelling'];
      return stages[Math.min(Math.floor(index / Math.ceil(total / 4)), 3)];
    }
    const stageWordCount = Math.ceil(total / 4);
    const stage = Math.floor(index / stageWordCount);
    const stages: QuestionType[] = ['flashcard', 'select', 'listening', 'spelling'];
    return stages[Math.min(stage, 3)];
  };

  const initReviewSession = (words: ReviewWord[], mode: ReviewMode) => {
    const shuffled = shuffleArray([...words]);
    setSession({
      words: shuffled,
      currentIndex: 0,
      questionType: getQuestionTypeForIndex(0, shuffled.length, mode, shuffled[0]),
      stageIndex: 1,
      showAnswer: false,
      selectedAnswer: null,
      isCorrect: null,
      spellingInput: '',
      showSpellingHint: false,
      spellingHintLevel: 0,
      roundWrongWords: [],
    });
    setScore(0);
    setGameOver(false);
    setStarted(true);
    setReviewMode(mode);
    setAllWrongWords([]);
    setRoundNumber(1);
    setRoundCorrectCount(0);
    setRoundTotalCount(shuffled.length);
  };

  const startSmartReview = () => {
    if (pendingReviewWords.length === 0) return;
    initReviewSession(pendingReviewWords, 'smart');
  };

  const startWrongReview = () => {
    const words: ReviewWord[] = wrongQuestions.map(wq => {
      const word = allTextbookWords.find(w => w.word === wq.question.word);
      const wordMeaning = word?.meaning || wq.question.correctAnswer || '';
      return {
        ...(word || {
          word: wq.question.word || '',
          meaning: wordMeaning,
          phonetic: word?.phonetic || '',
          textbookId: word?.textbookId || 'grade3a',
          unitId: word?.unitId || 1,
          unitName: word?.unitName || '',
          image: word?.image || getWordImage(wq.question.word || ''),
          wordIndex: word?.wordIndex || 0,
        }),
        originalQuestionType: wq.type,
        wrongCount: wq.wrongCount,
        originalQuestion: wq.question,
      };
    });

    if (words.length === 0) {
      alert('没有可复习的错题，请先在学习中积累错题哦～');
      return;
    }

    initReviewSession(words, 'wrong');
  };

  const startMarkedReview = () => {
    const words: ReviewWord[] = markedWords.map(mw => {
      const word = allTextbookWords.find(
        w => w.word === mw.word && w.textbookId === mw.textbookId && w.unitId === mw.unitId
      );
      return word || {
        word: mw.word,
        meaning: mw.meaning,
        phonetic: mw.phonetic,
        textbookId: mw.textbookId,
        unitId: mw.unitId,
        unitName: '',
        image: getWordImage(mw.word),
        wordIndex: 0,
      };
    });
    if (words.length > 0) {
      initReviewSession(words, 'marked');
    }
  };

  const startAllReview = () => {
    const words = learnedWords;
    if (words.length > 0) {
      initReviewSession(words, 'all');
    }
  };

  const startQuickReview = () => {
    const words = learnedWords.slice(0, Math.min(10, learnedWords.length));
    if (words.length > 0) {
      setShowQuickReviewConfirm(false);
      initReviewSession(words, 'quick');
    }
  };

  const handleFlashcardResult = (result: FlashcardResult) => {
    if (!currentWord || !session) return;

    const isCorrect = result !== 'unknown';

    setSession(prev => {
      if (!prev) return null;
      const updatedWords = [...prev.words];
      updatedWords[prev.currentIndex] = {
        ...updatedWords[prev.currentIndex],
        flashcardResult: result
      };

      let wrongWords = prev.roundWrongWords;
      if (!isCorrect) {
        wrongWords = [...wrongWords, currentWord];
      }

      return {
        ...prev,
        words: updatedWords,
        roundWrongWords: wrongWords
      };
    });

    if (isCorrect) {
      setRoundCorrectCount(prev => prev + 1);
    }

    if (currentWord.record) {
      recordWordReview(currentWord.word, isCorrect, currentWord.textbookId, currentWord.unitId);
    }

    goToNext();
  };

  const handleSelectAnswer = (answer: string) => {
    if (session?.selectedAnswer !== null || !currentWord || !session) return;

    const correct = answer === (currentWord.originalQuestion?.correctAnswer || currentWord.meaning);

    setSession(prev => {
      if (!prev) return null;
      const updatedWords = [...prev.words];
      const currentQuestionType = prev.questionType;

      if (currentQuestionType === 'select') {
        updatedWords[prev.currentIndex] = {
          ...updatedWords[prev.currentIndex],
          selectCorrect: correct
        };
      } else if (currentQuestionType === 'listening') {
        updatedWords[prev.currentIndex] = {
          ...updatedWords[prev.currentIndex],
          listeningCorrect: correct
        };
      }

      let wrongWords = prev.roundWrongWords;
      if (!correct) {
        wrongWords = [...wrongWords, currentWord];
      }

      return {
        ...prev,
        words: updatedWords,
        selectedAnswer: answer,
        isCorrect: correct,
        roundWrongWords: wrongWords
      };
    });

    if (correct) {
      setScore(prev => prev + 5);
      addPoints(5);
      setRoundCorrectCount(prev => prev + 1);
      if (currentWord.record) {
        recordWordReview(currentWord.word, true, currentWord.textbookId, currentWord.unitId);
      }
      if (reviewMode === 'wrong') {
        const wq = wrongQuestions.find(q => q.question.word === currentWord.word);
        if (wq) {
          markWrongQuestionCorrect(wq.id);
        }
      }
    } else {
      if (currentWord.record) {
        recordWordReview(currentWord.word, false, currentWord.textbookId, currentWord.unitId);
      }
      if (reviewMode !== 'wrong') {
        addWrongQuestion({
          id: `word_${currentWord.word}_${Date.now()}`,
          type: session.questionType === 'listening' ? 'listening' : 'matching',
          question: {
            id: `word_${currentWord.word}`,
            word: currentWord.word,
            correctAnswer: currentWord.meaning,
            image: currentWord.image,
            type: session.questionType === 'listening' ? 'listening' : 'matching',
          },
        });
      }
    }
  };

  const handleSpellingSubmit = () => {
    if (!currentWord || !session || !session.spellingInput.trim()) return;

    const correct = session.spellingInput.trim().toLowerCase() === currentWord.word.toLowerCase();

    setSession(prev => {
      if (!prev) return null;
      const updatedWords = [...prev.words];
      updatedWords[prev.currentIndex] = {
        ...updatedWords[prev.currentIndex],
        spellingCorrect: correct,
        spellingHintsUsed: prev.spellingHintLevel
      };

      let wrongWords = prev.roundWrongWords;
      if (!correct) {
        wrongWords = [...wrongWords, currentWord];
      }

      return {
        ...prev,
        words: updatedWords,
        isCorrect: correct,
        roundWrongWords: wrongWords
      };
    });

    if (correct) {
      setScore(prev => prev + 10);
      addPoints(10);
      setRoundCorrectCount(prev => prev + 1);
      if (currentWord.record) {
        recordWordReview(currentWord.word, true, currentWord.textbookId, currentWord.unitId);
      }
    } else {
      if (currentWord.record) {
        recordWordReview(currentWord.word, false, currentWord.textbookId, currentWord.unitId);
      }
    }
  };

  const goToNext = () => {
    if (!session) return;

    const nextIndex = session.currentIndex + 1;

    if (nextIndex >= session.words.length) {
      const wrongWords = session.roundWrongWords;
      setAllWrongWords(prev => [...prev, ...wrongWords]);

      if (wrongWords.length > 0) {
        setSession({
          words: wrongWords,
          currentIndex: 0,
          questionType: getQuestionTypeForIndex(0, wrongWords.length, reviewMode, wrongWords[0]),
          stageIndex: 1,
          showAnswer: false,
          selectedAnswer: null,
          isCorrect: null,
          spellingInput: '',
          showSpellingHint: false,
          spellingHintLevel: 0,
          roundWrongWords: [],
        });
        setRoundNumber(prev => prev + 1);
        setRoundCorrectCount(0);
        setRoundTotalCount(wrongWords.length);
      } else {
        const reviewedCount = session.words.length;
        const newTodayReviewed = todayReviewed + reviewedCount;
        setTodayReviewed(newTodayReviewed);
        saveTodayReviewed(newTodayReviewed);
        setGameOver(true);
      }
    } else {
      const nextWord = session.words[nextIndex];
      const questionType = getQuestionTypeForIndex(nextIndex, session.words.length, reviewMode, nextWord);
      const stageIndex = reviewMode === 'wrong' ? 1 : Math.floor(nextIndex / Math.ceil(session.words.length / 4)) + 1;

      setSession(prev => prev ? {
        ...prev,
        currentIndex: nextIndex,
        questionType,
        stageIndex: Math.min(stageIndex, 4),
        showAnswer: false,
        selectedAnswer: null,
        isCorrect: null,
        spellingInput: '',
        showSpellingHint: false,
        spellingHintLevel: 0,
      } : null);
    }
  };

  const toggleMarkWord = () => {
    if (!currentWord) return;
    const marked = isWordMarked(currentWord.word, currentWord.textbookId, currentWord.unitId);
    if (marked) {
      removeMarkedWord(currentWord.word, currentWord.textbookId, currentWord.unitId);
      setIsMarkedLocal(false);
    } else {
      addMarkedWord(currentWord.word, currentWord.textbookId, currentWord.unitId, currentWord.meaning, currentWord.phonetic);
      setIsMarkedLocal(true);
    }
    setForceUpdate(prev => prev + 1);
  };

  const handleBackToHome = () => {
    setStarted(false);
    setReviewMode('home');
    setSession(null);
    setGameOver(false);
    setShowQuickReviewConfirm(false);
  };

  const getReviewStats = () => {
    const totalLearned = userData.wordLearningRecords.length;
    const masteredCount = userData.wordLearningRecords.filter(r => r.isMastered).length;
    const pendingCount = pendingReviewWords.length;

    return { totalLearned, masteredCount, pendingCount };
  };

  const stats = getReviewStats();

  useEffect(() => {
    if (currentWord) {
      setIsMarkedLocal(isWordMarked(currentWord.word, currentWord.textbookId, currentWord.unitId));
    }
  }, [currentWord, isWordMarked, forceUpdate]);

  if (!started) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary-50 to-orange-100 pb-8">
        <Header showBack title="复习" />
        <div className="max-w-4xl mx-auto px-4 mt-6">
          <div className="bg-white rounded-2xl shadow-warm-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-2xl">
                  📊
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">学习统计</h3>
                  <p className="text-sm text-gray-500">单词掌握情况</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center p-3 bg-blue-50 rounded-xl">
                <p className="text-2xl font-bold text-blue-600">{stats.totalLearned}</p>
                <p className="text-xs text-gray-500">已学习</p>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-xl">
                <p className="text-2xl font-bold text-green-600">{stats.masteredCount}</p>
                <p className="text-xs text-gray-500">已掌握</p>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-xl">
                <p className="text-2xl font-bold text-orange-600">{stats.pendingCount}</p>
                <p className="text-xs text-gray-500">待复习</p>
              </div>
            </div>

            <div className="bg-gradient-to-r from-primary-50 to-purple-50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-700">🎯 今日复习目标</span>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-primary-600">{todayReviewed}</span>
                  <span className="text-gray-400">/</span>
                  <span className="text-gray-600">{dailyGoal}</span>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="h-full bg-gradient-to-r from-primary-500 to-purple-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (todayReviewed / dailyGoal) * 100)}%` }}
                />
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-gray-500">
                  {todayReviewed >= dailyGoal ? '🎉 目标达成！' : `还需复习 ${Math.max(0, dailyGoal - todayReviewed)} 个单词`}
                </span>
                <button
                  onClick={() => setShowGoalModal(true)}
                  className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                >
                  修改目标
                </button>
              </div>
            </div>
          </div>

          {showGoalModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
                <h3 className="text-xl font-bold text-gray-800 mb-4">设置每日复习目标</h3>
                <input
                  type="number"
                  min="1"
                  max="100"
                  defaultValue={dailyGoal}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-center text-xl"
                  ref={(el) => el?.focus()}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      const newGoal = parseInt((e.target as HTMLInputElement).value);
                      if (newGoal > 0) {
                        setDailyGoal(newGoal);
                        localStorage.setItem('dailyReviewGoal', newGoal.toString());
                        setShowGoalModal(false);
                      }
                    }
                  }}
                />
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => setShowGoalModal(false)}
                    className="flex-1 py-2 bg-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-300"
                  >
                    取消
                  </button>
                  <button
                    onClick={() => {
                      const newGoalInput = (document.querySelector('input[type="number"]') as HTMLInputElement)?.value;
                      const newGoal = parseInt(newGoalInput);
                      if (newGoal > 0) {
                        setDailyGoal(newGoal);
                        localStorage.setItem('dailyReviewGoal', newGoal.toString());
                        setShowGoalModal(false);
                      } else {
                        alert('请输入有效的数字！');
                      }
                    }}
                    className="flex-1 py-2 bg-primary-500 text-white font-bold rounded-lg hover:bg-primary-600"
                  >
                    确认
                  </button>
                </div>
              </div>
            </div>
          )}

          {stats.totalLearned === 0 && (
            <div className="bg-blue-50 rounded-xl p-5 mb-6 border border-blue-200">
              <div className="flex items-start gap-4">
                <div className="text-4xl">📖</div>
                <div className="flex-1">
                  <p className="text-blue-700 font-bold text-lg mb-1">还没有学习记录</p>
                  <p className="text-blue-600 text-sm mb-3">
                    先去「单词学习」页面学习单词，标记为"已学"后，就可以在这里进行智能复习啦！
                  </p>
                  <button
                    onClick={() => navigate('/word-learning')}
                    className="px-5 py-2 bg-blue-500 text-white font-bold rounded-full hover:bg-blue-600 transition-colors text-sm"
                  >
                    去学习单词 →
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="bg-yellow-50 rounded-xl p-4 mb-6 border border-yellow-200">
            <p className="text-yellow-700 mb-3 font-medium">🧪 测试功能</p>
            <div className="flex gap-3 mb-3">
              <button
                onClick={() => {
                  const testWords = allTextbookWords.slice(0, 5);
                  testWords.forEach(w => {
                    markWordLearned(w.word, w.textbookId, w.unitId);
                  });
                  alert('已添加 5 个单词到学习记录！');
                }}
                className="flex-1 py-2 bg-yellow-500 text-white font-bold rounded-lg hover:bg-yellow-600 transition-colors"
              >
                添加 5 个测试单词
              </button>
              <button
                onClick={() => setShowQuickReviewConfirm(true)}
                disabled={learnedWords.length === 0}
                className={cn(
                  'flex-1 py-2 font-bold rounded-lg transition-colors',
                  learnedWords.length > 0
                    ? 'bg-blue-500 text-white hover:bg-blue-600'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                )}
              >
                快速复习 (10个)
              </button>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  const testWrongQuestions = [
                    {
                      id: `test_wrong_${Date.now()}_1`,
                      type: 'matching' as const,
                      question: {
                        id: 'test_word_apple',
                        word: 'apple',
                        correctAnswer: '苹果',
                        type: 'matching',
                      },
                      wrongCount: 2,
                      correctCount: 0,
                      lastAttempt: Date.now(),
                    },
                    {
                      id: `test_wrong_${Date.now()}_2`,
                      type: 'listening' as const,
                      question: {
                        id: 'test_word_banana',
                        word: 'banana',
                        correctAnswer: '香蕉',
                        type: 'listening',
                      },
                      wrongCount: 1,
                      correctCount: 0,
                      lastAttempt: Date.now(),
                    },
                    {
                      id: `test_wrong_${Date.now()}_3`,
                      type: 'dialogue' as const,
                      question: {
                        id: 'test_dialogue_1',
                        type: 'dialogue',
                        speakerA: 'How are you today?',
                        options: ['I am fine, thank you.', 'What is your name?', 'Where are you from?'],
                        correctAnswer: 'I am fine, thank you.',
                      },
                      wrongCount: 1,
                      correctCount: 0,
                      lastAttempt: Date.now(),
                    },
                  ];
                  testWrongQuestions.forEach(wq => {
                    addWrongQuestion(wq);
                  });
                  alert('已添加 3 个测试错题！请打开错题本查看。');
                }}
                className="flex-1 py-2 bg-red-500 text-white font-bold rounded-lg hover:bg-red-600 transition-colors"
              >
                添加 3 个测试错题
              </button>
              <button
                onClick={() => {
                  localStorage.removeItem('lighthouse_english_data_v2');
                  window.location.reload();
                }}
                className="flex-1 py-2 bg-gray-500 text-white font-bold rounded-lg hover:bg-gray-600 transition-colors"
              >
                重置所有数据
              </button>
            </div>
          </div>

          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">🎯 智能复习</h2>
            <p className="text-gray-600">根据艾宾浩斯遗忘曲线，科学安排复习计划</p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <button
              onClick={startSmartReview}
              disabled={pendingReviewWords.length === 0}
              className={cn(
                'bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-5 text-white text-left',
                'hover:opacity-90 transition-all shadow-warm',
                pendingReviewWords.length === 0 && 'opacity-50 cursor-not-allowed'
              )}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-2xl">
                  🎯
                </div>
                <div>
                  <h3 className="font-bold text-lg">今日复习</h3>
                  <p className="text-sm text-white/80">遗忘曲线安排</p>
                </div>
              </div>
              <div className="text-3xl font-bold">{pendingReviewWords.length}</div>
            </button>

            <button
              onClick={() => setShowWrongWordDetail(true)}
              className={cn(
                'bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-5 text-white text-left',
                'hover:opacity-90 transition-all shadow-warm'
              )}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-2xl">
                  ❌
                </div>
                <div>
                  <h3 className="font-bold text-lg">错题本</h3>
                  <p className="text-sm text-white/80">需要加强</p>
                </div>
              </div>
              <div className="text-3xl font-bold">{wrongQuestions.length}</div>
            </button>

            <button
              onClick={() => setShowMarkedWordDetail(true)}
              className={cn(
                'bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl p-5 text-white text-left',
                'hover:opacity-90 transition-all shadow-warm',
                markedWords.length === 0 && 'opacity-50 cursor-not-allowed'
              )}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-2xl">
                  ⭐
                </div>
                <div>
                  <h3 className="font-bold text-lg">重点词</h3>
                  <p className="text-sm text-white/80">标记的难词</p>
                </div>
              </div>
              <div className="text-3xl font-bold">{markedWords.length}</div>
            </button>

            <button
              onClick={startAllReview}
              disabled={learnedWords.length === 0}
              className={cn(
                'bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-5 text-white text-left',
                'hover:opacity-90 transition-all shadow-warm',
                learnedWords.length === 0 && 'opacity-50 cursor-not-allowed'
              )}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-2xl">
                  📚
                </div>
                <div>
                  <h3 className="font-bold text-lg">全部复习</h3>
                  <p className="text-sm text-white/80">所有已学单词</p>
                </div>
              </div>
              <div className="text-3xl font-bold">{learnedWords.length}</div>
            </button>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-warm-lg mb-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4 text-center">🏆 学习成就</h3>
            <div className="flex flex-wrap justify-center gap-3">
              {[
                { emoji: '🌟', name: '初学者', desc: '学习第一个单词', unlocked: stats.totalLearned >= 1 },
                { emoji: '📚', name: '勤奋者', desc: '学习10个单词', unlocked: stats.totalLearned >= 10 },
                { emoji: '🎯', name: '目标达成', desc: '完成每日目标', unlocked: todayReviewed >= dailyGoal },
                { emoji: '💯', name: '满分王', desc: '复习正确率100%', unlocked: stats.masteredCount >= 5 },
                { emoji: '🔥', name: '连续学习', desc: '连续复习7天', unlocked: false },
                { emoji: '👑', name: '词汇大师', desc: '掌握50个单词', unlocked: stats.masteredCount >= 50 },
                { emoji: '🎧', name: '听力达人', desc: '听力全对', unlocked: false },
                { emoji: '✍️', name: '拼写高手', desc: '拼写全对', unlocked: false },
              ].map((badge, idx) => (
                <div
                  key={idx}
                  className={cn(
                    'flex flex-col items-center p-3 rounded-xl transition-all',
                    badge.unlocked
                      ? 'bg-gradient-to-br from-yellow-50 to-orange-50 opacity-100'
                      : 'bg-gray-100 opacity-50'
                  )}
                >
                  <span className="text-3xl mb-1">{badge.emoji}</span>
                  <span className={cn(
                    'text-xs font-medium',
                    badge.unlocked ? 'text-gray-700' : 'text-gray-400'
                  )}>
                    {badge.name}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-warm-lg">
            <h3 className="text-lg font-bold text-gray-800 mb-4 text-center">📖 复习流程</h3>
            <div className="grid grid-cols-4 gap-3">
              <div className="p-4 bg-purple-50 rounded-xl text-center">
                <div className="text-3xl mb-2">1️⃣</div>
                <p className="font-medium text-purple-700">闪卡回忆</p>
                <p className="text-xs text-gray-500 mt-1">快速唤醒记忆</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-xl text-center">
                <div className="text-3xl mb-2">2️⃣</div>
                <p className="font-medium text-blue-700">选义练习</p>
                <p className="text-xs text-gray-500 mt-1">看词选中文</p>
              </div>
              <div className="p-4 bg-green-50 rounded-xl text-center">
                <div className="text-3xl mb-2">3️⃣</div>
                <p className="font-medium text-green-700">听力训练</p>
                <p className="text-xs text-gray-500 mt-1">听音选义</p>
              </div>
              <div className="p-4 bg-orange-50 rounded-xl text-center">
                <div className="text-3xl mb-2">4️⃣</div>
                <p className="font-medium text-orange-700">拼写测试</p>
                <p className="text-xs text-gray-500 mt-1">强化记忆</p>
              </div>
            </div>
          </div>

          {showQuickReviewConfirm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
                <h3 className="text-xl font-bold text-gray-800 mb-2">⚡ 快速复习</h3>
                <p className="text-gray-600 mb-4">
                  快速复习 {Math.min(10, learnedWords.length)} 个单词
                  {learnedWords.length > 10 && ' (最新学习的)'}
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowQuickReviewConfirm(false)}
                    className="flex-1 py-2 bg-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-300"
                  >
                    取消
                  </button>
                  <button
                    onClick={startQuickReview}
                    className="flex-1 py-2 bg-blue-500 text-white font-bold rounded-lg hover:bg-blue-600"
                  >
                    开始
                  </button>
                </div>
              </div>
            </div>
          )}

          {showMarkedWordDetail && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[85vh] flex flex-col">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-gray-800">⭐ 重点词 ({markedWords.length})</h3>
                  <button
                    onClick={() => setShowMarkedWordDetail(false)}
                    className="text-gray-400 hover:text-gray-600 text-2xl"
                  >
                    ×
                  </button>
                </div>

                {markedWords.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 flex-1 flex flex-col items-center justify-center">
                    <div className="text-6xl mb-3">📝</div>
                    <p className="text-lg">还没有标记重点词</p>
                    <p className="text-sm text-gray-400 mt-2">在学习或复习时点击 ⭐ 标记重点词</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-3 flex-1 overflow-y-auto">
                      {markedWords.map((mw, idx) => {
                        const word = allTextbookWords.find(
                          w => w.word === mw.word && w.textbookId === mw.textbookId && w.unitId === mw.unitId
                        );
                        return (
                          <div
                            key={`${mw.word}-${mw.textbookId}-${mw.unitId}`}
                            className="bg-yellow-50 rounded-xl p-4 flex items-center gap-3"
                          >
                            <div className="text-3xl">{word?.image || getWordImage(mw.word)}</div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-gray-800">{mw.word}</span>
                                <span className="text-yellow-500">⭐</span>
                              </div>
                              <div className="text-gray-600 text-sm">{mw.meaning}</div>
                              <div className="text-gray-400 text-xs mt-1">
                                {mw.phonetic}
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                removeMarkedWord(mw.word, mw.textbookId, mw.unitId);
                              }}
                              className="px-3 py-1 bg-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-300"
                            >
                              取消标记
                            </button>
                          </div>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => {
                        setShowMarkedWordDetail(false);
                        startMarkedReview();
                      }}
                      className="w-full py-3 bg-yellow-500 text-white font-bold rounded-xl hover:bg-yellow-600 mt-4"
                    >
                      开始复习重点词
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {showWrongWordDetail && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[85vh] flex flex-col">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-gray-800">❌ 错题本 ({wrongQuestions.length})</h3>
                  <button
                    onClick={() => setShowWrongWordDetail(false)}
                    className="text-gray-400 hover:text-gray-600 text-2xl"
                  >
                    ×
                  </button>
                </div>

                {wrongQuestions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 flex-1 flex flex-col items-center justify-center">
                    <div className="text-6xl mb-3">🎉</div>
                    <p className="text-lg">太棒了！没有错题</p>
                    <p className="text-sm text-gray-400 mt-2">继续保持！</p>
                  </div>
                ) : (
                  <>
                    <div className="flex gap-2 mb-4">
                      <button
                        onClick={() => {
                          wrongQuestions.forEach(wq => {
                            markWrongQuestionCorrect(wq.id);
                          });
                        }}
                        className="flex-1 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600"
                      >
                        🎯 全部标记掌握
                      </button>
                      <button
                        onClick={() => {
                          wrongQuestions.forEach(wq => {
                            markWrongQuestionCorrect(wq.id);
                          });
                        }}
                        className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300"
                      >
                        🗑️ 清空错题
                      </button>
                    </div>

                    <div className="space-y-3 flex-1 overflow-y-auto">
                      {wrongQuestions.map((wq, idx) => {
                        const word = allTextbookWords.find(w => w.word === wq.question.word);
                        return (
                          <div
                            key={wq.id}
                            className="bg-red-50 rounded-xl p-4 flex items-center gap-3"
                          >
                            <div className="text-3xl">{word?.image || getWordImage(wq.question.word || '')}</div>
                            <div className="flex-1">
                              <div className="font-bold text-gray-800">
                                {wq.question.word || '对话/句型题'}
                              </div>
                              <div className="text-gray-600 text-sm">
                                {wq.question.correctAnswer || `${wq.type}类型错题`}
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-gray-400 text-xs">
                                  答错 {(wq.wrongCount || 0) + 1} 次
                                </span>
                                {wq.question.type === 'listening' && (
                                  <span className="px-2 py-0.5 bg-green-100 text-green-600 rounded-full text-xs">
                                    听力
                                  </span>
                                )}
                                {wq.question.type === 'matching' && (
                                  <span className="px-2 py-0.5 bg-blue-100 text-blue-600 rounded-full text-xs">
                                    选义
                                  </span>
                                )}
                                {wq.question.type === 'dialogue' && (
                                  <span className="px-2 py-0.5 bg-purple-100 text-purple-600 rounded-full text-xs">
                                    对话
                                  </span>
                                )}
                                {wq.question.type === 'sentence' && (
                                  <span className="px-2 py-0.5 bg-orange-100 text-orange-600 rounded-full text-xs">
                                    句型
                                  </span>
                                )}
                                {wq.question.type === 'ordering' && (
                                  <span className="px-2 py-0.5 bg-pink-100 text-pink-600 rounded-full text-xs">
                                    排序
                                  </span>
                                )}
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                markWrongQuestionCorrect(wq.id);
                              }}
                              className="px-3 py-1 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600"
                            >
                              掌握了
                            </button>
                          </div>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => {
                        setShowWrongWordDetail(false);
                        startWrongReview();
                      }}
                      className="w-full py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 mt-4"
                    >
                      开始复习错题
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (gameOver) {
    const finalScore = totalScore + score;
    const correctRate = roundTotalCount > 0
      ? Math.round((roundTotalCount - allWrongWords.length) / roundTotalCount * 100)
      : 100;

    const get环节Stats = () => {
      const flashcardStats = { total: 0, correct: 0, know: 0, fuzzy: 0, unknown: 0 };
      const selectStats = { total: 0, correct: 0 };
      const listeningStats = { total: 0, correct: 0 };
      const spellingStats = { total: 0, correct: 0, hintsUsed: [] };

      session?.words.forEach(word => {
        if (word.flashcardResult !== undefined) {
          flashcardStats.total++;
          if (word.flashcardResult === 'know') {
            flashcardStats.know++;
            flashcardStats.correct++;
          } else if (word.flashcardResult === 'fuzzy') {
            flashcardStats.fuzzy++;
          } else {
            flashcardStats.unknown++;
          }
        }
        if (word.selectCorrect !== undefined) {
          selectStats.total++;
          if (word.selectCorrect) selectStats.correct++;
        }
        if (word.listeningCorrect !== undefined) {
          listeningStats.total++;
          if (word.listeningCorrect) listeningStats.correct++;
        }
        if (word.spellingCorrect !== undefined) {
          spellingStats.total++;
          if (word.spellingCorrect) spellingStats.correct++;
          if (word.spellingHintsUsed) {
            spellingStats.hintsUsed.push(word.spellingHintsUsed);
          }
        }
      });

      return { flashcardStats, selectStats, listeningStats, spellingStats };
    };

    const 环节Stats = get环节Stats();

    return (
      <div className="min-h-screen bg-gradient-to-b from-primary-50 to-orange-100 pb-8">
        <Header showBack title="复习完成" onBack={handleBackToHome} />
        <div className="max-w-4xl mx-auto px-4 mt-6">
          <div className="bg-white rounded-2xl p-6 shadow-warm-lg text-center mb-6">
            <div className="text-6xl mb-4 animate-bounce">🎉</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">复习完成！</h2>
            <p className="text-gray-600 mb-6">太棒了！继续保持！</p>

            <div className="bg-gradient-to-r from-purple-100 to-blue-100 rounded-xl p-6 mb-6">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-3xl font-bold text-purple-600">{finalScore}</p>
                  <p className="text-sm text-gray-500">总得分</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-green-600">{correctRate}%</p>
                  <p className="text-sm text-gray-500">正确率</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-blue-600">{roundNumber}</p>
                  <p className="text-sm text-gray-500">复习轮数</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-warm-lg mb-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">📊 各环节表现</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {环节Stats.flashcardStats.total > 0 && (
                <div className="bg-purple-50 rounded-xl p-4">
                  <p className="text-sm text-purple-700 font-bold mb-2">📱 闪卡回忆</p>
                  <p className="text-2xl font-bold text-purple-600">{环节Stats.flashcardStats.know}</p>
                  <p className="text-xs text-gray-500">完全认识</p>
                  <p className="text-sm text-yellow-600 mt-1">{环节Stats.flashcardStats.fuzzy} 模糊</p>
                  <p className="text-sm text-red-600">{环节Stats.flashcardStats.unknown} 不认识</p>
                </div>
              )}
              {环节Stats.selectStats.total > 0 && (
                <div className="bg-blue-50 rounded-xl p-4">
                  <p className="text-sm text-blue-700 font-bold mb-2">📝 选义练习</p>
                  <p className="text-2xl font-bold text-blue-600">{环节Stats.selectStats.correct}/{环节Stats.selectStats.total}</p>
                  <p className="text-xs text-gray-500">正确数</p>
                </div>
              )}
              {环节Stats.listeningStats.total > 0 && (
                <div className="bg-green-50 rounded-xl p-4">
                  <p className="text-sm text-green-700 font-bold mb-2">🎧 听力训练</p>
                  <p className="text-2xl font-bold text-green-600">{环节Stats.listeningStats.correct}/{环节Stats.listeningStats.total}</p>
                  <p className="text-xs text-gray-500">正确数</p>
                </div>
              )}
              {环节Stats.spellingStats.total > 0 && (
                <div className="bg-orange-50 rounded-xl p-4">
                  <p className="text-sm text-orange-700 font-bold mb-2">✍️ 拼写测试</p>
                  <p className="text-2xl font-bold text-orange-600">{环节Stats.spellingStats.correct}/{环节Stats.spellingStats.total}</p>
                  <p className="text-xs text-gray-500">正确数</p>
                </div>
              )}
            </div>
          </div>

          {allWrongWords.length > 0 && (
            <div className="bg-white rounded-2xl p-6 shadow-warm-lg mb-6">
              <p className="text-red-700 font-bold mb-3 text-center">⚠️ 需要重点复习的单词 ({allWrongWords.length}个)</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {allWrongWords.slice(0, 20).map((w, i) => (
                  <span key={i} className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm">
                    {w.word}
                  </span>
                ))}
                {allWrongWords.length > 20 && (
                  <span className="px-3 py-1 bg-red-200 text-red-700 rounded-full text-sm">
                    +{allWrongWords.length - 20} 更多
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3">
            {allWrongWords.length > 0 && (
              <button
                onClick={() => {
                  initReviewSession(allWrongWords, reviewMode);
                  setTotalScore(prev => prev + score);
                }}
                className="w-full py-3 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600"
              >
                再复习一遍错题
              </button>
            )}
            <button
              onClick={handleBackToHome}
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
    );
  }

  if (!session) return null;

  const {
    questionType,
    showAnswer,
    selectedAnswer,
    isCorrect,
    spellingInput: _spellingInput,
    showSpellingHint,
    stageIndex,
    currentIndex,
  } = session;

  const totalCount = session.words.length;
  const isMarked = isMarkedLocal ?? (currentWord && isWordMarked(currentWord.word, currentWord.textbookId, currentWord.unitId));

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-orange-100 pb-8">
      <Header
        showBack
        title={`${roundNumber > 1 ? `第${roundNumber}轮 - ` : ''}${
          reviewMode === 'smart' ? '今日复习' :
          reviewMode === 'wrong' ? '错题复习' :
          reviewMode === 'marked' ? '重点词复习' :
          reviewMode === 'all' ? '全部复习' :
          '快速复习'
        }`}
        onBack={handleBackToHome}
      />
      <div className="max-w-4xl mx-auto px-4 mt-6">
        <div className="bg-white rounded-2xl shadow-warm-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="text-2xl">{currentWord?.image || '📚'}</div>
              <div>
                <p className="text-sm text-gray-500">
                  第 {currentIndex + 1} / {totalCount} 个
                  {roundNumber > 1 && ` (第${roundNumber}轮)`}
                </p>
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div
                    className="h-full bg-gradient-to-r from-primary-500 to-purple-500 rounded-full transition-all"
                    style={{ width: `${((currentIndex + 1) / totalCount) * 100}%` }}
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleMarkWord}
                className={cn(
                  'p-2 rounded-full transition-all',
                  isMarked ? 'bg-yellow-400 text-yellow-900' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                )}
              >
                ⭐
              </button>
              <button
                onClick={handleBackToHome}
                className="p-2 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="text-center mb-6">
            <div className="flex justify-center gap-2 mb-2">
              {['flashcard', 'select', 'listening', 'spelling'].map((type, idx) => (
                <div
                  key={type}
                  className={cn(
                    'w-3 h-3 rounded-full transition-all',
                    idx < stageIndex ? 'bg-primary-500' : 'bg-gray-300'
                  )}
                />
              ))}
            </div>
            <p className="text-sm text-gray-500">
              {stageIndex === 1 && '闪卡回忆'}
              {stageIndex === 2 && '选义练习'}
              {stageIndex === 3 && '听力训练'}
              {stageIndex === 4 && '拼写测试'}
            </p>
          </div>

          {questionType === 'flashcard' && (
            <div className="text-center">
              <div className="bg-gradient-to-br from-purple-100 to-blue-100 rounded-2xl p-8 mb-6">
                {showAnswer ? (
                  <>
                    <h2 className="text-4xl font-bold text-gray-800 mb-2">{currentWord?.word}</h2>
                    <p className="text-xl text-gray-600">{currentWord?.meaning}</p>
                    <p className="text-gray-400 mt-2">{currentWord?.phonetic}</p>
                  </>
                ) : (
                  <>
                    <h2 className="text-4xl font-bold text-gray-800 mb-2">{currentWord?.word}</h2>
                    <p className="text-gray-400 mt-4">点击卡片查看释义</p>
                  </>
                )}
              </div>

              {showAnswer ? (
                <div className="flex gap-3">
                  <button
                    onClick={() => handleFlashcardResult('know')}
                    className="flex-1 py-4 bg-green-500 text-white font-bold rounded-xl hover:bg-green-600 transition-colors"
                  >
                    🎉 认识
                  </button>
                  <button
                    onClick={() => handleFlashcardResult('fuzzy')}
                    className="flex-1 py-4 bg-yellow-500 text-white font-bold rounded-xl hover:bg-yellow-600 transition-colors"
                  >
                    😕 模糊
                  </button>
                  <button
                    onClick={() => handleFlashcardResult('unknown')}
                    className="flex-1 py-4 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-colors"
                  >
                    ❌ 不认识
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setSession(prev => prev ? { ...prev, showAnswer: true } : null)}
                  className="w-full py-4 bg-primary-500 text-white font-bold rounded-xl hover:bg-primary-600 transition-colors"
                >
                  点击查看释义 →
                </button>
              )}
            </div>
          )}

          {questionType === 'select' && (
            <div className="text-center">
              <div className="bg-gradient-to-br from-blue-100 to-cyan-100 rounded-2xl p-8 mb-6">
                <h2 className="text-4xl font-bold text-gray-800 mb-2">{currentWord?.word}</h2>
                <p className="text-gray-400">{currentWord?.phonetic}</p>
              </div>

              <div className="space-y-3">
                {shuffleArray([
                  currentWord?.originalQuestion?.correctAnswer || currentWord?.meaning,
                  ...options
                ]).map((option, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectAnswer(option)}
                    disabled={selectedAnswer !== null}
                    className={cn(
                      'w-full py-4 rounded-xl font-bold text-lg transition-all',
                      selectedAnswer === null
                        ? 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                        : selectedAnswer === option
                          ? isCorrect
                            ? 'bg-green-500 text-white'
                            : 'bg-red-500 text-white'
                          : isCorrect
                            ? 'bg-gray-200 text-gray-500'
                            : selectedAnswer === option
                              ? 'bg-red-500 text-white'
                              : 'bg-gray-200 text-gray-500'
                    )}
                  >
                    {option}
                  </button>
                ))}
              </div>

              {selectedAnswer !== null && (
                <button
                  onClick={goToNext}
                  className="w-full py-4 bg-primary-500 text-white font-bold rounded-xl hover:bg-primary-600 transition-colors mt-4"
                >
                  {isCorrect ? '🎉 正确！继续 →' : '❌ 错误，继续 →'}
                </button>
              )}
            </div>
          )}

          {questionType === 'listening' && (
            <div className="text-center">
              <div className="bg-gradient-to-br from-green-100 to-emerald-100 rounded-2xl p-8 mb-6">
                <SpeechButton text={currentWord?.word || ''} className="mb-4" />
                <p className="text-gray-500">点击喇叭听发音</p>
              </div>

              <div className="space-y-3">
                {shuffleArray([currentWord?.meaning, ...options]).map((option, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectAnswer(option)}
                    disabled={selectedAnswer !== null}
                    className={cn(
                      'w-full py-4 rounded-xl font-bold text-lg transition-all',
                      selectedAnswer === null
                        ? 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                        : selectedAnswer === option
                          ? isCorrect
                            ? 'bg-green-500 text-white'
                            : 'bg-red-500 text-white'
                          : isCorrect
                            ? 'bg-gray-200 text-gray-500'
                            : 'bg-gray-200 text-gray-500'
                    )}
                  >
                    {option}
                  </button>
                ))}
              </div>

              {selectedAnswer !== null && (
                <div className="mt-4">
                  <p className="text-gray-600 mb-2">
                    正确答案：<span className="font-bold text-green-600">{currentWord?.meaning}</span>
                  </p>
                  <button
                    onClick={goToNext}
                    className="w-full py-4 bg-primary-500 text-white font-bold rounded-xl hover:bg-primary-600 transition-colors"
                  >
                    {isCorrect ? '🎉 正确！继续 →' : '❌ 错误，继续 →'}
                  </button>
                </div>
              )}
            </div>
          )}

          {questionType === 'spelling' && (
            <div className="text-center">
              <div className="bg-gradient-to-br from-orange-100 to-amber-100 rounded-2xl p-8 mb-6">
                <p className="text-gray-500 mb-2">根据释义拼写单词</p>
                <p className="text-2xl font-bold text-gray-800 mb-2">{currentWord?.meaning}</p>
                <SpeechButton text={currentWord?.word || ''} className="mb-2" />
                {showSpellingHint && (
                  <div className="mt-2">
                    <p className="text-gray-500 text-sm">提示：{currentWord?.word.substring(0, session.spellingHintLevel + 1)}...</p>
                  </div>
                )}
              </div>

              <div className="mb-4">
                <input
                  type="text"
                  value={session.spellingInput}
                  onChange={(e) => setSession(prev => prev ? { ...prev, spellingInput: e.target.value } : null)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleSpellingSubmit();
                    }
                  }}
                  disabled={isCorrect !== null}
                  placeholder="输入单词..."
                  className={cn(
                    'w-full px-4 py-4 text-2xl text-center font-bold rounded-xl border-2 transition-all',
                    isCorrect === null
                      ? 'border-gray-300 focus:border-primary-500 focus:outline-none'
                      : isCorrect
                        ? 'border-green-500 bg-green-50'
                        : 'border-red-500 bg-red-50'
                  )}
                  autoFocus
                />
              </div>

              {isCorrect === null && (
                <div className="flex gap-3 mb-4">
                  <button
                    onClick={() => {
                      if (session.spellingHintLevel < currentWord?.word.length! - 1) {
                        setSession(prev => prev ? { ...prev, showSpellingHint: true, spellingHintLevel: prev.spellingHintLevel + 1 } : null);
                      }
                    }}
                    disabled={session.spellingHintLevel >= currentWord?.word.length! - 1}
                    className={cn(
                      'flex-1 py-3 rounded-xl font-bold transition-colors',
                      session.spellingHintLevel >= currentWord?.word.length! - 1
                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        : 'bg-yellow-500 text-white hover:bg-yellow-600'
                    )}
                  >
                    💡 提示 ({session.spellingHintLevel + 1})
                  </button>
                  <button
                    onClick={handleSpellingSubmit}
                    disabled={!session.spellingInput.trim()}
                    className={cn(
                      'flex-1 py-3 rounded-xl font-bold transition-colors',
                      session.spellingInput.trim()
                        ? 'bg-primary-500 text-white hover:bg-primary-600'
                        : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    )}
                  >
                    提交答案
                  </button>
                </div>
              )}

              {isCorrect !== null && (
                <div>
                  <p className={cn('text-xl font-bold mb-2', isCorrect ? 'text-green-600' : 'text-red-600')}>
                    {isCorrect ? '🎉 正确！' : `❌ 错误！正确答案：${currentWord?.word}`}
                  </p>
                  <button
                    onClick={goToNext}
                    className="w-full py-4 bg-primary-500 text-white font-bold rounded-xl hover:bg-primary-600 transition-colors"
                  >
                    继续 →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}