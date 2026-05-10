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

export function ListeningPage() {
  const navigate = useNavigate();
  const { addPoints, userData } = useUserData();

  const [cards, setCards] = useState<Card[]>([]);
  const [selectedCards, setSelectedCards] = useState<Card[]>([]);
  const [score, setScore] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [moves, setMoves] = useState(0);
  const [encouragement, setEncouragement] = useState('');

  const initializeGame = useCallback(() => {
    const allWords: Word[] = [];
    [...GRADE_3A.units, ...GRADE_3B.units].forEach(unit => {
      allWords.push(...unit.words);
    });

    const selectedWords = pickRandom(allWords, 8);

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
  }, []);

  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

  const checkGameComplete = useCallback(() => {
    return cards.every(card => card.isMatched);
  }, [cards]);

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
          setCards(prev =>
            prev.map(card =>
              card.id === first.id || card.id === second.id
                ? { ...card, isMatched: true }
                : card
            )
          );
          setScore(prev => prev + 10);
          addPoints(10);
          setSelectedCards([]);
          setIsChecking(false);

          if (checkGameComplete()) {
            setTimeout(() => {
              addPoints(50);
              setEncouragement(pickRandom(encouragementMessages, 1)[0]);
              setShowModal(true);
              setGameOver(true);
            }, 500);
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

  const matchedCount = cards.filter(card => card.isMatched).length;

  if (gameOver) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary-50 to-orange-100 pb-8">
        <Header showBack title="词汇配对" />
        <div className="max-w-4xl mx-auto px-4 mt-8">
          <div className="bg-white rounded-2xl p-6 shadow-warm-lg text-center">
            <div className="text-6xl mb-4 animate-bounce">🎉</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">恭喜通关！</h2>
            <p className="text-3xl font-bold text-purple-600 mb-4">{encouragement}</p>
            <p className="text-gray-600 mb-4">你成功配对了所有词汇！</p>
            <div className="bg-green-50 rounded-xl p-4 mb-4">
              <p className="text-3xl font-bold text-green-600">得分：{score}</p>
              <p className="text-gray-500 text-sm">+{score + 50} 积分（含通关奖励50分）</p>
            </div>
            <div className="bg-blue-50 rounded-xl p-4 mb-6">
              <p className="text-gray-600">步数：{moves} 步</p>
            </div>
            <div className="flex flex-wrap justify-center gap-2 mb-6">
              {['🌟', '⭐', '✨', '💫', '🌟', '⭐'].map((star, i) => (
                <span 
                  key={i} 
                  className="text-2xl animate-pulse"
                  style={{ animationDelay: `${i * 0.1}s` }}
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
                onClick={initializeGame}
                className="w-full py-3 bg-green-500 text-white font-bold rounded-xl hover:bg-green-600"
              >
                再来一局
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
            <p className="text-gray-600">点击卡片翻转，找到配对的中英文词汇</p>
          </div>

          <div className="grid grid-cols-4 gap-3">
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
                    <span className="text-sm font-bold text-gray-700 text-center leading-snug">
                      {card.displayText}
                    </span>
                  </>
                ) : (
                  <span className="text-3xl opacity-50">❓</span>
                )}
              </button>
            ))}
          </div>

          <div className="mt-6 text-center text-gray-500 text-sm">
            已配对：{matchedCount} / {cards.length} | 步数：{moves}
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