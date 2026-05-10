import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { GameHeader } from '@/components/ProgressBar';
import { PetModal } from '@/components/PetModal';
import { useUserData } from '@/hooks/useUserData';
import { playCorrectSparkle, resumeAudioContext } from '@/lib/gameSfx';
import { shuffleArray, pickRandom } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { GRADE_3A, GRADE_3B, type Word } from '@/data/wordLearning';

type Card = {
  id: string;
  word: Word;
  displayText: string;
  cardType: 'chinese' | 'english';
  isFlipped: boolean;
  isMatched: boolean;
};

type Difficulty = 'easy' | 'medium' | 'hard';

const difficultyConfig = {
  easy: { size: 3, pairs: 4, label: '简单', emoji: '🌱', gridCols: 'grid-cols-3' },
  medium: { size: 4, pairs: 8, label: '中等', emoji: '🌿', gridCols: 'grid-cols-4' },
  hard: { size: 5, pairs: 12, label: '困难', emoji: '🌳', gridCols: 'grid-cols-5' },
};

const encouragementMessages = [
  '太厉害了！🎉',
  '你真的很棒！🌟',
  '完美通关！⭐',
  '词汇达人！🏆',
  '学习天才！🎓',
  '继续加油！💪',
  '太棒了！👏',
  '你真厉害！✨',
  '全对！🥇',
  '非常优秀！🏅'
];

const perfectMessages = [
  '完美！你是最棒的！🌟🌟🌟',
  '太惊人了！全部正确！🏆',
  '难以置信！你太聪明了！🧠',
  '这就是实力！🎯',
  '继续保持！你是词汇大师！👑'
];

export function ListeningPage() {
  const navigate = useNavigate();
  const { addPoints, userData } = useUserData();

  const [gameStarted, setGameStarted] = useState(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('medium');
  const [cards, setCards] = useState<Card[]>([]);
  const [selectedCards, setSelectedCards] = useState<Card[]>([]);
  const [score, setScore] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [moves, setMoves] = useState(0);
  const [encouragement, setEncouragement] = useState('');
  const [showCelebration, setShowCelebration] = useState(false);

  const initializeGame = useCallback(() => {
    const config = difficultyConfig[selectedDifficulty];
    const allWords: Word[] = [];
    [...GRADE_3A.units, ...GRADE_3B.units].forEach(unit => {
      allWords.push(...unit.words);
    });

    const selectedWords = pickRandom(allWords, config.pairs);

    const cardPairs: Card[] = [];
    selectedWords.forEach((word, index) => {
      cardPairs.push({
        id: `${index}-en`,
        word,
        displayText: word.word,
        cardType: 'english',
        isFlipped: false,
        isMatched: false,
      });
      cardPairs.push({
        id: `${index}-zh`,
        word,
        displayText: word.meaning,
        cardType: 'chinese',
        isFlipped: false,
        isMatched: false,
      });
    });

    setCards(shuffleArray(cardPairs));
    setSelectedCards([]);
    setScore(0);
    setMoves(0);
    setGameOver(false);
    setShowModal(false);
    setEncouragement('');
    setShowCelebration(false);
  }, [selectedDifficulty]);

  useEffect(() => {
    if (gameStarted) {
      initializeGame();
    }
  }, [gameStarted, initializeGame]);

  const handleCardClick = (clickedCard: Card) => {
    if (isChecking) return;
    if (clickedCard.isFlipped || clickedCard.isMatched) return;
    if (selectedCards.length >= 2) return;

    setCards(prev =>
      prev.map(card =>
        card.id === clickedCard.id ? { ...card, isFlipped: true } : card
      )
    );

    const newSelected = [...selectedCards, clickedCard];
    setSelectedCards(newSelected);

    if (newSelected.length === 2) {
      setMoves(prev => prev + 1);
      setIsChecking(true);

      const [first, second] = newSelected;
      
      if (first.word.word === second.word.word && first.cardType !== second.cardType) {
        resumeAudioContext();
        playCorrectSparkle();
        
        setTimeout(() => {
          const updatedCards = cards.map(card =>
            card.id === first.id || card.id === second.id
              ? { ...card, isMatched: true }
              : card
          );
          setCards(updatedCards);
          setScore(prev => prev + 10);
          addPoints(10);
          setSelectedCards([]);
          setIsChecking(false);

          const allMatched = updatedCards.every(card => card.isMatched);
          if (allMatched) {
            setShowCelebration(true);
            setTimeout(() => {
              const bonusPoints = selectedDifficulty === 'easy' ? 30 : selectedDifficulty === 'medium' ? 50 : 80;
              addPoints(bonusPoints);
              setEncouragement(pickRandom(encouragementMessages, 1)[0]);
              setShowModal(true);
              setGameOver(true);
            }, 1500);
          }
        }, 300);
      } else {
        setTimeout(() => {
          setCards(prev =>
            prev.map(card =>
              card.id === first.id || card.id === second.id
                ? { ...card, isFlipped: false }
                : card
            )
          );
          setSelectedCards([]);
          setIsChecking(false);
        }, 800);
      }
    }
  };

  const startGame = () => {
    setGameStarted(true);
  };

  const matchedCount = cards.filter(card => card.isMatched).length;
  const config = difficultyConfig[selectedDifficulty];

  if (!gameStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary-50 to-orange-100 pb-8">
        <Header showBack title="词汇配对" />
        <div className="max-w-4xl mx-auto px-4 mt-8">
          <div className="bg-white rounded-2xl p-6 shadow-warm-lg">
            <h2 className="text-xl font-bold text-gray-800 mb-6 text-center">🎴 选择难度等级</h2>
            
            <div className="space-y-4">
              {(['easy', 'medium', 'hard'] as Difficulty[]).map((diff) => {
                const cfg = difficultyConfig[diff];
                return (
                  <button
                    key={diff}
                    onClick={() => setSelectedDifficulty(diff)}
                    className={cn(
                      'w-full p-4 rounded-xl border-2 text-left transition-all flex items-center gap-4',
                      selectedDifficulty === diff
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-green-300'
                    )}
                  >
                    <span className="text-3xl">{cfg.emoji}</span>
                    <div className="flex-1">
                      <div className="font-bold text-lg">{cfg.label}</div>
                      <div className="text-sm text-gray-500">{cfg.size}×{cfg.size} 网格 · {cfg.pairs} 对词汇</div>
                    </div>
                    {selectedDifficulty === diff && (
                      <span className="text-green-500 text-xl">✓</span>
                    )}
                  </button>
                );
              })}
            </div>

            <button
              onClick={startGame}
              className="w-full mt-6 py-4 bg-green-500 text-white font-bold rounded-xl hover:bg-green-600 shadow-warm"
            >
              开始游戏
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (gameOver) {
    const bonusPoints = selectedDifficulty === 'easy' ? 30 : selectedDifficulty === 'medium' ? 50 : 80;
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary-50 to-orange-100 pb-8">
        <Header showBack title="词汇配对" />
        <div className="max-w-4xl mx-auto px-4 mt-8">
          <div className="bg-white rounded-2xl p-6 shadow-warm-lg text-center">
            <div className="text-6xl mb-4 animate-bounce">🎉</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">恭喜通关！</h2>
            <p className="text-3xl font-bold text-purple-600 mb-4">{encouragement}</p>
            <p className="text-gray-600 mb-4">难度：{config.label} ({config.size}×{config.size})</p>
            <div className="bg-green-50 rounded-xl p-4 mb-4">
              <p className="text-3xl font-bold text-green-600">得分：{score}</p>
              <p className="text-gray-500 text-sm">+{score + bonusPoints} 积分（含通关奖励{bonusPoints}分）</p>
            </div>
            <div className="bg-blue-50 rounded-xl p-4 mb-6">
              <p className="text-gray-600">步数：{moves} 步</p>
            </div>
            <div className="flex flex-wrap justify-center gap-2 mb-6">
              {['🌟', '⭐', '✨', '💫', '🌟', '⭐', '🌟', '⭐'].map((star, i) => (
                <span 
                  key={i} 
                  className="text-2xl animate-pulse"
                  style={{ animationDelay: `${i * 0.15}s` }}
                >
                  {star}
                </span>
              ))}
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
                  setGameOver(false);
                  initializeGame();
                }}
                className="w-full py-3 bg-green-500 text-white font-bold rounded-xl hover:bg-green-600"
              >
                再来一局
              </button>
              <button
                onClick={() => {
                  setGameStarted(false);
                  setGameOver(false);
                }}
                className="w-full py-3 bg-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-300"
              >
                更换难度
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-orange-100 pb-8">
      <Header showBack title="词汇配对" />

      <div className="max-w-4xl mx-auto px-4 mt-4">
        <GameHeader
          currentQuestion={matchedCount}
          totalQuestions={cards.length}
          score={score}
          showScore
        />

        <div className="mt-4 bg-white rounded-2xl p-6 shadow-warm">
          <div className="text-center mb-6">
            <span className="inline-block bg-gray-100 px-3 py-1 rounded-full text-sm text-gray-600">
              {config.emoji} {config.label} · {config.size}×{config.size}
            </span>
            <p className="text-gray-600 mt-4">点击卡片翻转，找到配对的中英文词汇</p>
          </div>

          <div className={cn('grid gap-3', config.gridCols)}>
            {cards.map((card) => (
              <button
                key={card.id}
                onClick={() => handleCardClick(card)}
                disabled={card.isMatched || card.isFlipped || isChecking || selectedCards.length >= 2}
                className={cn(
                  'aspect-square rounded-xl border-2 transition-all duration-300 transform',
                  'flex flex-col items-center justify-center gap-1',
                  card.isMatched
                    ? 'bg-green-100 border-green-300'
                    : card.isFlipped
                    ? card.cardType === 'english'
                      ? 'bg-blue-50 border-blue-300'
                      : 'bg-orange-50 border-orange-300'
                    : 'bg-gradient-to-br from-blue-100 to-purple-100 border-blue-200 hover:border-blue-400 hover:scale-105',
                  card.isMatched && 'correct-animation'
                )}
              >
                {card.isFlipped || card.isMatched ? (
                  <>
                    <span className="text-xs font-medium text-gray-500">
                      {card.cardType === 'english' ? 'EN' : '中文'}
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-gray-700 text-center leading-snug">
                      {card.displayText}
                    </span>
                  </>
                ) : (
                  <span className="text-2xl sm:text-3xl opacity-50">❓</span>
                )}
              </button>
            ))}
          </div>

          <div className="mt-6 text-center text-gray-500 text-sm">
            已配对：{matchedCount} / {cards.length} | 步数：{moves}
          </div>
        </div>

        <div className="mt-4 flex gap-3">
          <button
            onClick={() => navigate('/games')}
            className="flex-1 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-colors"
          >
            返回游戏中心
          </button>
          <button
            onClick={() => {
              setGameStarted(false);
            }}
            className="flex-1 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-colors"
          >
            更换难度
          </button>
        </div>
      </div>

      {showCelebration && !gameOver && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 pointer-events-none">
          <div className="bg-white rounded-2xl p-8 shadow-2xl text-center animate-bounce">
            <div className="text-6xl mb-4">🎊</div>
            <p className="text-2xl font-bold text-purple-600 mb-2">
              {pickRandom(perfectMessages, 1)[0]}
            </p>
            <p className="text-gray-600">即将进入结算...</p>
          </div>
        </div>
      )}

      <PetModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        type="correct"
        petType={userData.adoptedPet || 'dog'}
      />
    </div>
  );
}