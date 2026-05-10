import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { useUserData, PET_EMOJIS, PET_LEVELS } from '@/hooks/useUserData';
import { PetType } from '@/types';
import { PET_ITEMS, findItemById } from '@/data/petItems';
import { cn } from '@/lib/utils';

const PET_TYPES: { type: PetType; emoji: string; name: string }[] = [
  { type: 'dog', emoji: '🐶', name: '小狗狗' },
  { type: 'cat', emoji: '🐱', name: '小猫咪' },
  { type: 'rabbit', emoji: '🐰', name: '小兔子' },
  { type: 'bear', emoji: '🐻', name: '小熊' },
  { type: 'fox', emoji: '🦊', name: '小狐狸' },
];

export function PetHomePage() {
  const navigate = useNavigate();
  const {
    userData,
    adoptPet,
    setActivePet,
    feedPet,
    playWithPet,
    useItem,
    getItemCount,
    removePet,
  } = useUserData();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAdoptModal, setShowAdoptModal] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [actionType, setActionType] = useState<'feed' | 'play' | null>(null);

  const pets = userData.petHome.pets;
  const activePet = pets[currentIndex];

  useEffect(() => {
    if (pets.length > 0 && currentIndex >= pets.length) {
      setCurrentIndex(pets.length - 1);
    }
  }, [pets.length, currentIndex]);

  const handlePrev = () => {
    setCurrentIndex(prev => (prev > 0 ? prev - 1 : pets.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex(prev => (prev < pets.length - 1 ? prev + 1 : 0));
  };

  const handleAdopt = (type: PetType) => {
    adoptPet(type);
    setShowAdoptModal(false);
    setActionFeedback('🎉 恭喜领养新伙伴！');
    setTimeout(() => setActionFeedback(null), 2000);
  };

  const handleFeed = (itemId: string) => {
    if (!activePet) return;
    if (getItemCount(itemId) > 0) {
      const item = findItemById(itemId);
      feedPet(activePet.id, itemId);
      useItem(itemId);
      setActionType('feed');
      setActionFeedback(`${item?.emoji} 喂食成功！`);
      setTimeout(() => {
        setActionFeedback(null);
        setActionType(null);
      }, 1500);
    }
  };

  const handlePlay = (itemId: string) => {
    if (!activePet) return;
    if (getItemCount(itemId) > 1) {
      const item = findItemById(itemId);
      playWithPet(activePet.id, itemId);
      useItem(itemId);
      setActionType('play');
      setActionFeedback(`${item?.emoji} 玩耍开心！`);
      setTimeout(() => {
        setActionFeedback(null);
        setActionType(null);
      }, 1500);
    }
  };

  const getLevelProgress = (exp: number): number => {
    const currentLevel = PET_LEVELS.find(l => l.level === activePet?.level);
    const nextLevel = PET_LEVELS.find(l => l.level === (activePet?.level || 1) + 1);
    if (!currentLevel || !nextLevel) return 100;
    return Math.min(100, ((exp - currentLevel.minExp) / (nextLevel.minExp - currentLevel.minExp)) * 100);
  };

  const getMoodEmoji = () => {
    if (!activePet) return '😊';
    const avg = (activePet.hunger + activePet.happiness) / 2;
    if (avg >= 80) return '😄';
    if (avg >= 60) return '🙂';
    if (avg >= 40) return '😐';
    if (avg >= 20) return '😟';
    return '😭';
  };

  if (!userData.isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-100 to-purple-100 flex items-center justify-center">
        <div className="text-4xl animate-bounce">🐾</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-100 via-purple-50 to-pink-100 pb-8">
      <Header showBack title="宠物小窝" />

      <div className="max-w-4xl mx-auto px-4 mt-4">
        {pets.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center shadow-xl">
            <div className="text-8xl mb-4">🏠</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">欢迎来到宠物小窝！</h2>
            <p className="text-gray-500 mb-6">这里是你的小动物们温馨的家</p>
            <button
              onClick={() => setShowAdoptModal(true)}
              className="bg-gradient-to-r from-pink-500 to-purple-500 text-white px-8 py-4 rounded-full font-bold text-xl shadow-lg hover:scale-105 transition-transform"
            >
              🐾 领养我的第一只宠物
            </button>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-3xl p-6 shadow-xl mb-4">
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={handlePrev}
                  className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-2xl hover:bg-purple-200 transition"
                >
                  ←
                </button>
                <div className="flex-1 text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <span className="text-2xl font-bold text-gray-800">{activePet?.name}</span>
                    <span className="bg-purple-100 text-purple-600 px-3 py-1 rounded-full text-sm font-medium">
                      Lv.{activePet?.level}
                    </span>
                  </div>
                  <div className="text-gray-500 text-sm">
                    {pets.length > 1 && `${currentIndex + 1} / ${pets.length}`}
                  </div>
                </div>
                <button
                  onClick={handleNext}
                  className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-2xl hover:bg-purple-200 transition"
                >
                  →
                </button>
              </div>

              <div className="flex justify-center mb-4">
                <div className="relative">
                  <div className="text-9xl animate-bounce">{PET_EMOJIS[activePet.type]}</div>
                  {activePet.accessory && (
                    <div className="absolute -top-2 -right-2 text-4xl animate-pulse">
                      {findItemById(activePet.accessory)?.emoji}
                    </div>
                  )}
                </div>
              </div>

              <div className="text-center mb-4">
                <div className="text-5xl mb-2">{getMoodEmoji()}</div>
                <p className="text-gray-600">心情：{activePet?.happiness}%</p>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">🍖 饥饿值</span>
                    <span className="text-orange-600 font-medium">{activePet?.hunger}%</span>
                  </div>
                  <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-orange-400 to-red-500 transition-all"
                      style={{ width: `${activePet?.hunger}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">😊 快乐值</span>
                    <span className="text-pink-600 font-medium">{activePet?.happiness}%</span>
                  </div>
                  <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-pink-400 to-purple-500 transition-all"
                      style={{ width: `${activePet?.happiness}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">⭐ 经验值</span>
                    <span className="text-purple-600 font-medium">{activePet?.exp}</span>
                  </div>
                  <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-400 to-indigo-500 transition-all"
                      style={{ width: `${getLevelProgress(activePet?.exp || 0)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-xl mb-4">
              <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                🍖 喂食
              </h3>
              <div className="grid grid-cols-5 gap-2">
                {PET_ITEMS.food.slice(0, 10).map(item => {
                  const count = getItemCount(item.id);
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleFeed(item.id)}
                      disabled={count === 0}
                      className={cn(
                        'bg-orange-50 rounded-xl p-3 text-center transition-all',
                        count > 0 ? 'hover:scale-105 hover:bg-orange-100' : 'opacity-50 cursor-not-allowed'
                      )}
                    >
                      <div className="text-3xl mb-1">{item.emoji}</div>
                      <div className="text-xs text-gray-600">{item.name}</div>
                      <div className="text-xs text-orange-600 font-medium">x{count}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-xl mb-4">
              <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                🎮 玩耍
              </h3>
              <div className="grid grid-cols-5 gap-2">
                {PET_ITEMS.toy.slice(0, 10).map(item => {
                  const count = getItemCount(item.id);
                  return (
                    <button
                      key={item.id}
                      onClick={() => handlePlay(item.id)}
                      disabled={count === 0}
                      className={cn(
                        'bg-blue-50 rounded-xl p-3 text-center transition-all',
                        count > 0 ? 'hover:scale-105 hover:bg-blue-100' : 'opacity-50 cursor-not-allowed'
                      )}
                    >
                      <div className="text-3xl mb-1">{item.emoji}</div>
                      <div className="text-xs text-gray-600">{item.name}</div>
                      <div className="text-xs text-blue-600 font-medium">x{count}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              onClick={() => setShowAdoptModal(true)}
              className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white px-6 py-4 rounded-full font-bold text-lg shadow-lg hover:scale-105 transition-transform flex items-center justify-center gap-2"
            >
              🐾 领养新宠物
            </button>
          </>
        )}

        <div className="mt-6 grid grid-cols-2 gap-4">
          <button
            onClick={() => navigate('/shop')}
            className="bg-white rounded-xl p-4 shadow-lg flex items-center justify-center gap-2 hover:scale-105 transition-all"
          >
            <span className="text-3xl">🛒</span>
            <span className="font-bold text-gray-700">兑换商店</span>
          </button>
          <button
            onClick={() => navigate('/')}
            className="bg-white rounded-xl p-4 shadow-lg flex items-center justify-center gap-2 hover:scale-105 transition-all"
          >
            <span className="text-3xl">📚</span>
            <span className="font-bold text-gray-700">去学习</span>
          </button>
        </div>
      </div>

      {showAdoptModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-2xl font-bold text-center mb-4">选择你的新伙伴</h3>
            <div className="grid grid-cols-2 gap-3">
              {PET_TYPES.map(pet => (
                <button
                  key={pet.type}
                  onClick={() => handleAdopt(pet.type)}
                  className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl p-4 text-center hover:scale-105 transition-transform"
                >
                  <div className="text-6xl mb-2">{pet.emoji}</div>
                  <div className="font-bold text-gray-800">{pet.name}</div>
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowAdoptModal(false)}
              className="w-full mt-4 bg-gray-200 text-gray-700 py-3 rounded-full font-medium hover:bg-gray-300 transition"
            >
              取消
            </button>
          </div>
        </div>
      )}

      {actionFeedback && (
        <div
          className={cn(
            'fixed bottom-20 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full shadow-lg text-white font-bold animate-bounce z-50',
            actionType === 'feed' ? 'bg-orange-500' : 'bg-blue-500'
          )}
        >
          {actionFeedback}
        </div>
      )}
    </div>
  );
}
