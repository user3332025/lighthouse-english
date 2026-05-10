import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { SpeechButton } from '@/components/SpeechButton';
import { useUserData } from '@/hooks/useUserData';
import { cn, shuffleArray } from '@/lib/utils';
import { GRADE_3A, GRADE_3B } from '@/data/wordLearning';

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
  record?: any;
  wordIndex: number;
  // 记录每个环节的完成情况
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
  spellingHintLevel: number; // 0: 无, 1: 首字母, 2: 更多提示
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
  const [isMarkedLocal, setIsMarkedLocal] = useState<boolean | null>(null);
  const [forceUpdate, setForceUpdate] = useState(0);

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
    if (!currentWord) return [];
    const distractors = allTextbookWords
      .filter(w => w.meaning !== currentWord.meaning)
      .map(w => w.meaning);
    return shuffleArray(distractors).slice(0, 3);
  }, [currentWord, allTextbookWords]);

  const getQuestionTypeForIndex = (index: number, total: number): QuestionType => {
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
      questionType: getQuestionTypeForIndex(0, shuffled.length),
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
      return word || {
        word: wq.question.word || '',
        meaning: wq.question.correctAnswer || '',
        phonetic: '',
        textbookId: 'grade3a',
        unitId: 1,
        unitName: '',
        image: getWordImage(wq.question.word || ''),
        wordIndex: 0,
      };
    });
    if (words.length > 0) {
      initReviewSession(words, 'wrong');
    }
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
    
    // 更新当前单词的闪卡结果
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

    const correct = answer === currentWord.meaning;

    // 更新当前单词的答题结果
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

    // 更新当前单词的拼写结果
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
          questionType: getQuestionTypeForIndex(0, wrongWords.length),
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
        setGameOver(true);
      }
    } else {
      const questionType = getQuestionTypeForIndex(nextIndex, session.words.length);
      const stageIndex = Math.floor(nextIndex / Math.ceil(session.words.length / 4)) + 1;
      
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

  if (!started) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary-50 to-orange-100 pb-8">
        <Header showBack title="复习" />
        <div className="max-w-4xl mx-auto px-4 mt-6">
          {/* 学习统计卡片 */}
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
            <div className="grid grid-cols-3 gap-4">
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
          </div>

          {/* 测试功能 */}
          <div className="bg-yellow-50 rounded-xl p-4 mb-6 border border-yellow-200">
            <p className="text-yellow-700 mb-3 font-medium">🧪 测试功能</p>
            <div className="flex gap-3">
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
          </div>

          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">🎯 智能复习</h2>
            <p className="text-gray-600">根据艾宾浩斯遗忘曲线，科学安排复习计划</p>
          </div>

          {/* 复习模式选择 */}
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
              onClick={startMarkedReview}
              disabled={markedWords.length === 0}
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

          {/* 复习流程说明 */}
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

          {/* 快速复习确认弹窗 */}
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

          {/* 错题本详情弹窗 */}
          {showWrongWordDetail && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
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
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-4xl mb-2">🎉</div>
                    <p>太棒了！没有错题</p>
                  </div>
                ) : (
                  <div className="space-y-3 mb-4">
                    {wrongQuestions.map((wq, idx) => {
                      const word = allTextbookWords.find(w => w.word === wq.question.word);
                      return (
                        <div
                          key={wq.id}
                          className="bg-red-50 rounded-xl p-4 flex items-center gap-3"
                        >
                          <div className="text-3xl">{word?.image || getWordImage(wq.question.word || '')}</div>
                          <div className="flex-1">
                            <div className="font-bold text-gray-800">{wq.question.word}</div>
                            <div className="text-gray-600 text-sm">{wq.question.correctAnswer}</div>
                            <div className="text-gray-400 text-xs mt-1">
                              答错 {(wq.wrongCount || 0) + 1} 次
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
                )}

                {wrongQuestions.length > 0 && (
                  <button
                    onClick={() => {
                      setShowWrongWordDetail(false);
                      startWrongReview();
                    }}
                    className="w-full py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600"
                  >
                    开始复习错题
                  </button>
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
    
    // 统计各环节表现
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
        <Header showBack title="复习完成" />
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
          
          {/* 各环节详细报告 */}
          <div className="bg-white rounded-2xl p-6 shadow-warm-lg mb-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">📊 各环节表现</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* 闪卡 */}
              {环节Stats.flashcardStats.total > 0 && (
                <div className="bg-purple-50 rounded-xl p-4">
                  <p className="text-sm text-purple-700 font-bold mb-2">📱 闪卡回忆</p>
                  <p className="text-2xl font-bold text-purple-600">{环节Stats.flashcardStats.know}</p>
                  <p className="text-xs text-gray-500">完全认识</p>
                  <p className="text-sm text-yellow-600 mt-1">{环节Stats.flashcardStats.fuzzy} 模糊</p>
                  <p className="text-sm text-red-600">{环节Stats.flashcardStats.unknown} 不认识</p>
                </div>
              )}
              {/* 选义 */}
              {环节Stats.selectStats.total > 0 && (
                <div className="bg-blue-50 rounded-xl p-4">
                  <p className="text-sm text-blue-700 font-bold mb-2">✍️ 选义练习</p>
                  <p className="text-2xl font-bold text-blue-600">{环节Stats.selectStats.correct}/{环节Stats.selectStats.total}</p>
                  <p className="text-xs text-gray-500">正确率</p>
                </div>
              )}
              {/* 听力 */}
              {环节Stats.listeningStats.total > 0 && (
                <div className="bg-green-50 rounded-xl p-4">
                  <p className="text-sm text-green-700 font-bold mb-2">🎧 听力训练</p>
                  <p className="text-2xl font-bold text-green-600">{环节Stats.listeningStats.correct}/{环节Stats.listeningStats.total}</p>
                  <p className="text-xs text-gray-500">正确率</p>
                </div>
              )}
              {/* 拼写 */}
              {环节Stats.spellingStats.total > 0 && (
                <div className="bg-orange-50 rounded-xl p-4">
                  <p className="text-sm text-orange-700 font-bold mb-2">⌨️ 拼写测试</p>
                  <p className="text-2xl font-bold text-orange-600">{环节Stats.spellingStats.correct}/{环节Stats.spellingStats.total}</p>
                  <p className="text-xs text-gray-500">正确率</p>
                </div>
              )}
            </div>
          </div>

          {allWrongWords.length > 0 && (
            <div className="bg-white rounded-2xl p-6 shadow-warm-lg mb-6">
              <p className="text-red-700 font-bold mb-3 text-center">❌ 需要重点复习的单词 ({allWrongWords.length}个)</p>
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
                再复习一遍错词
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
    spellingInput,
    showSpellingHint,
    stageIndex,
    currentIndex,
  } = session;

  const totalCount = session.words.length;
  // 使用本地状态，添加 forceUpdate 到依赖
  useEffect(() => {
    setIsMarkedLocal(currentWord ? isWordMarked(currentWord.word, currentWord.textbookId, currentWord.unitId) : false);
  }, [currentWord, isWordMarked, forceUpdate]);
  const isMarked = isMarkedLocal ?? (currentWord && isWordMarked(currentWord.word, currentWord.textbookId, currentWord.unitId));

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-orange-100 pb-8">
      <Header showBack={false} title={`${roundNumber > 1 ? `第${roundNumber}轮 - ` : ''}${
        reviewMode === 'smart' ? '今日复习' : 
        reviewMode === 'wrong' ? '错题复习' : 
        reviewMode === 'marked' ? '重点词复习' : 
        reviewMode === 'quick' ? '快速复习' : '全部复习'
      }`} />

      <div className="max-w-4xl mx-auto px-4 mt-4">
        {/* 进度条 */}
        <div className="bg-white rounded-xl p-3 shadow-warm mb-4">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">
                <span className="font-bold text-purple-600">
                  {
                    questionType === 'flashcard' ? '📱 闪卡回忆' :
                    questionType === 'select' ? '✍️ 选义练习' :
                    questionType === 'listening' ? '🎧 听力训练' : '⌨️ 拼写测试'
                  }
                </span>
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                {currentIndex + 1}/{totalCount}
              </span>
              <span className="font-bold text-purple-600">+{score}</span>
            </div>
          </div>
          <div className="w-full bg-purple-100 rounded-full h-2">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-all"
              style={{ width: `${((currentIndex + 1) / totalCount) * 100}%` }}
            />
          </div>
        </div>

        {/* 主要内容 */}
        <div className="bg-white rounded-2xl p-6 shadow-warm">
          {questionType === 'flashcard' && currentWord && (
            <div className="text-center relative">
              <button
                onClick={toggleMarkWord}
                className={cn(
                  'absolute top-0 right-0 p-2 rounded-full transition-all duration-200',
                  isMarked
                    ? 'bg-green-500 text-white shadow-lg scale-105'
                    : 'bg-gray-100 text-gray-400 hover:bg-yellow-50 hover:text-yellow-500'
                )}
              >
                {isMarked ? '⭐' : '☆'}
              </button>

              <div className="text-6xl mb-4">{currentWord.image}</div>
              <h2 className="text-3xl font-bold text-gray-800 mb-2">{currentWord.word}</h2>
              <SpeechButton text={currentWord.word} size="lg" className="mb-4" />
              <p className="text-xs text-gray-400 mb-4">{currentWord.unitName}</p>
              
              {!showAnswer ? (
                <>
                  <p className="text-gray-500 mb-6">点击查看中文意思</p>
                  <button
                    onClick={() => setSession(prev => prev ? { ...prev, showAnswer: true } : null)}
                    className="px-8 py-3 bg-purple-500 text-white font-bold rounded-full hover:bg-purple-600 transition-colors shadow-warm"
                  >
                    显示答案
                  </button>
                </>
              ) : (
                <>
                  <p className="text-2xl text-green-600 font-medium mb-2">{currentWord.meaning}</p>
                  <p className="text-gray-400 mb-6">{currentWord.phonetic}</p>
                  <div className="flex justify-center gap-3">
                    <button
                      onClick={() => handleFlashcardResult('know')}
                      className="px-6 py-3 bg-green-500 text-white font-bold rounded-full hover:bg-green-600 transition-colors shadow-warm"
                    >
                      ✅ 认识
                    </button>
                    <button
                      onClick={() => handleFlashcardResult('fuzzy')}
                      className="px-6 py-3 bg-yellow-500 text-white font-bold rounded-full hover:bg-yellow-600 transition-colors shadow-warm"
                    >
                      🤔 模糊
                    </button>
                    <button
                      onClick={() => handleFlashcardResult('unknown')}
                      className="px-6 py-3 bg-red-500 text-white font-bold rounded-full hover:bg-red-600 transition-colors shadow-warm"
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
              <p className="text-gray-500 mb-6">选择正确的中文意思</p>

              <div className="grid grid-cols-2 gap-3">
                {[...options, currentWord.meaning].sort().map((option, index) => {
                  const isSelectedOption = selectedAnswer === option;
                  const isCorrectAnswer = option === currentWord.meaning;

                  return (
                    <button
                      key={index}
                      onClick={() => handleSelectAnswer(option)}
                      disabled={selectedAnswer !== null}
                      className={cn(
                        'p-4 rounded-xl border-2 transition-all text-lg font-medium',
                        selectedAnswer === null && 'border-purple-200 hover:border-purple-400 hover:bg-purple-50',
                        isSelectedOption && isCorrectAnswer && 'border-green-500 bg-green-50',
                        isSelectedOption && !isCorrectAnswer && 'border-red-500 bg-red-50',
                        !isSelectedOption && isCorrectAnswer && selectedAnswer !== null && 'border-green-500 bg-green-50',
                        selectedAnswer !== null && !isSelectedOption && !isCorrectAnswer && 'opacity-50'
                      )}
                    >
                      <span className={cn(
                        isSelectedOption && isCorrectAnswer && 'text-green-600',
                        isSelectedOption && !isCorrectAnswer && 'text-red-600',
                        !isSelectedOption && 'text-gray-700'
                      )}>
                        {option}
                      </span>
                      {isSelectedOption && (
                        <span className="ml-2">{isCorrectAnswer ? '✓' : '✗'}</span>
                      )}
                    </button>
                  );
                })}
              </div>

              {selectedAnswer !== null && (
                <div className="mt-4">
                  <button
                    onClick={goToNext}
                    className="px-8 py-3 bg-primary-500 text-white font-bold rounded-full hover:bg-primary-600 transition-colors shadow-warm"
                  >
                    下一题 →
                  </button>
                </div>
              )}
            </div>
          )}

          {questionType === 'listening' && currentWord && (
            <div className="text-center">
              <div className="text-6xl mb-4">🎧</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">听音选义</h2>
              <p className="text-gray-500 mb-6">仔细听发音，选择正确的中文</p>
              
              <div className="flex items-center justify-center gap-4 mb-6">
                <SpeechButton text={currentWord.word} size="xl" />
                <button
                  onClick={() => {
                    const utterance = new SpeechSynthesisUtterance(currentWord.word);
                    utterance.lang = 'en-US';
                    window.speechSynthesis.speak(utterance);
                  }}
                  className="px-6 py-3 bg-green-500 text-white font-bold rounded-full hover:bg-green-600 transition-colors shadow-warm flex items-center gap-2"
                >
                  🔊 再听一遍
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[...options, currentWord.meaning].sort().map((option, index) => {
                  const isSelectedOption = selectedAnswer === option;
                  const isCorrectAnswer = option === currentWord.meaning;

                  return (
                    <button
                      key={index}
                      onClick={() => handleSelectAnswer(option)}
                      disabled={selectedAnswer !== null}
                      className={cn(
                        'p-4 rounded-xl border-2 transition-all text-lg font-medium',
                        selectedAnswer === null && 'border-green-200 hover:border-green-400 hover:bg-green-50',
                        isSelectedOption && isCorrectAnswer && 'border-green-500 bg-green-50',
                        isSelectedOption && !isCorrectAnswer && 'border-red-500 bg-red-50',
                        !isSelectedOption && isCorrectAnswer && selectedAnswer !== null && 'border-green-500 bg-green-50',
                        selectedAnswer !== null && !isSelectedOption && !isCorrectAnswer && 'opacity-50'
                      )}
                    >
                      <span className={cn(
                        isSelectedOption && isCorrectAnswer && 'text-green-600',
                        isSelectedOption && !isCorrectAnswer && 'text-red-600',
                        !isSelectedOption && 'text-gray-700'
                      )}>
                        {option}
                      </span>
                      {isSelectedOption && (
                        <span className="ml-2">{isCorrectAnswer ? '✓' : '✗'}</span>
                      )}
                    </button>
                  );
                })}
              </div>

              {selectedAnswer !== null && (
                <div className="mt-6">
                  <div className="bg-blue-50 rounded-xl p-4 mb-4">
                    <p className="text-blue-700 mb-2">正确单词：</p>
                    <div className="flex items-center justify-center gap-4">
                      <p className="text-3xl font-bold text-blue-600">{currentWord.word}</p>
                      <SpeechButton text={currentWord.word} size="md" />
                    </div>
                    <p className="text-gray-500 mt-2">{currentWord.meaning}</p>
                  </div>
                  <button
                    onClick={goToNext}
                    className="px-8 py-3 bg-primary-500 text-white font-bold rounded-full hover:bg-primary-600 transition-colors shadow-warm"
                  >
                    下一题 →
                  </button>
                </div>
              )}
            </div>
          )}

          {questionType === 'spelling' && currentWord && (
            <div className="text-center">
              <div className="text-6xl mb-4">{currentWord.image}</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-1">{currentWord.meaning}</h2>
              <p className="text-gray-500 mb-2">{currentWord.phonetic}</p>
              <div className="flex items-center justify-center gap-4 mb-6">
                <SpeechButton text={currentWord.word} size="lg" />
              </div>
              <p className="text-gray-500 mb-4">请拼写这个单词（共 {currentWord.word.length} 个字母</p>

              <div className="max-w-md mx-auto">
                <input
                  type="text"
                  value={spellingInput}
                  onChange={(e) => setSession(prev => prev ? { ...prev, spellingInput: e.target.value.toLowerCase() } : null)}
                  onKeyPress={(e) => e.key === 'Enter' && isCorrect === null && handleSpellingSubmit()}
                  placeholder="输入单词..."
                  className="w-full px-4 py-3 text-xl text-center border-2 border-orange-200 rounded-xl focus:border-orange-500 focus:outline-none"
                  disabled={isCorrect !== null}
                  autoFocus
                />

                {/* 单词字母提示 */}
                <div className="flex justify-center gap-2 mt-4">
                  {currentWord.word.split('').map((char, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        'w-8 h-10 rounded-lg flex items-center justify-center text-lg font-bold border-2',
                        spellingInput[idx]?.toLowerCase() === char.toLowerCase()
                          ? 'border-green-500 bg-green-50 text-green-600'
                          : 'border-gray-200 bg-gray-50 text-gray-400'
                      )}
                    >
                      {spellingInput[idx]?.toLowerCase() === char.toLowerCase() ? char : '_'}
                    </div>
                  ))}
                </div>

                {/* 多级提示系统 */}
                {isCorrect === null && (
                  <div className="mt-4">
                    {session.spellingHintLevel === 0 && (
                  <button
                    onClick={() => setSession(prev => prev ? { ...prev, spellingHintLevel: 1, showSpellingHint: true } : null)}
                    className="text-yellow-600 text-sm hover:text-yellow-700 font-medium"
                  >
                    💡 需要提示？
                  </button>
                )}
                {session.spellingHintLevel === 1 && (
                  <div className="bg-yellow-50 rounded-xl p-3 mb-3">
                    <p className="text-yellow-700 font-medium mb-2">💡 提示 1：首字母是 "{currentWord.word[0].toUpperCase()}"</p>
                    <button
                      onClick={() => setSession(prev => prev ? { ...prev, spellingHintLevel: 2 } : null)}
                      className="text-yellow-600 text-sm hover:text-yellow-700"
                    >
                      还要更多提示？
                    </button>
                  </div>
                )}
                {session.spellingHintLevel === 2 && (
                  <div className="bg-orange-50 rounded-xl p-3 mb-3">
                    <p className="text-orange-700 font-medium mb-2">💡 提示 2：{currentWord.phonetic}</p>
                    <p className="text-gray-600 text-sm">单词长度：{currentWord.word.length} 个字母</p>
                    <button
                      onClick={() => setSession(prev => prev ? { ...prev, spellingHintLevel: 3 } : null)}
                      className="text-orange-600 text-sm hover:text-orange-700"
                    >
                      显示完整单词？
                    </button>
                  </div>
                )}
                {session.spellingHintLevel >= 3 && (
                  <div className="bg-red-50 rounded-xl p-3 mb-3">
                    <p className="text-red-700 font-medium">💡 完整单词：{currentWord.word}</p>
                    <SpeechButton text={currentWord.word} size="sm" className="mt-2" />
                  </div>
                )}
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
                    {isCorrect && session.spellingHintLevel > 0 && (
                      <p className="text-gray-500 text-sm mt-1">
                        （使用了 {session.spellingHintLevel} 个提示）
                      </p>
                    )}
                    {!isCorrect && (
                      <div className="mt-2">
                        <p className="text-gray-600">正确答案：</p>
                        <div className="flex items-center justify-center gap-3">
                          <p className="text-3xl font-bold text-green-600">{currentWord.word}</p>
                          <SpeechButton text={currentWord.word} size="md" />
                        </div>
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
                        'px-8 py-3 font-bold rounded-full transition-colors shadow-warm',
                        spellingInput.trim()
                          ? 'bg-orange-500 text-white hover:bg-orange-600'
                          : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      )}
                    >
                      确认答案
                    </button>
                  ) : (
                    <button
                      onClick={goToNext}
                      className="px-8 py-3 bg-primary-500 text-white font-bold rounded-full hover:bg-primary-600 transition-colors shadow-warm"
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
