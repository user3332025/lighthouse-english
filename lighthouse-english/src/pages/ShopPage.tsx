import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { useUserData } from '@/hooks/useUserData';
import { PET_ITEMS, findItemById } from '@/data/petItems';
import { cn } from '@/lib/utils';

export function ShopPage() {
  const navigate = useNavigate();
  const { userData, purchaseItem, getItemCount, getActivePet } = useUserData();
  const [activeTab, setActiveTab] = useState<'food' | 'toy'>('food');
  const [purchaseSuccess, setPurchaseSuccess] = useState<string | null>(null);

  const activePet = getActivePet();

  const handlePurchase = (itemId: string) => {
    const item = findItemById(itemId);
    if (!item) return;

    if (userData.points < item.cost) {
      alert(`积分不足！需要 ${item.cost} 积分`);
      return;
    }

    if (purchaseItem(itemId)) {
      setPurchaseSuccess(`${item.emoji} ${item.name} 兑换成功！`);
      setTimeout(() => setPurchaseSuccess(null), 2000);
    }
  };

  const handleDirectUse = (itemId: string) => {
    if (!activePet) {
      alert('请先领养一只宠物！');
      return;
    }
    
    const item = findItemById(itemId);
    if (!item) return;

    if (item.type === 'food') {
      navigate('/pet', { state: { feedItem: itemId } });
    } else if (item.type === 'toy') {
      navigate('/pet', { state: { playItem: itemId } });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-yellow-100 via-orange-50 to-pink-100 pb-8">
      <Header showBack title="兑换商店" />

      <div className="max-w-4xl mx-auto px-4 mt-4">
        <div className="bg-gradient-to-r from-yellow-400 to-orange-400 rounded-2xl p-4 text-white text-center mb-6 shadow-lg">
          <div className="flex items-center justify-center gap-2">
            <span className="text-3xl">⭐</span>
            <span className="text-3xl font-bold">{userData.points}</span>
            <span className="text-lg">积分</span>
          </div>
          <p className="text-sm mt-1 opacity-90">
            {activePet ? `当前宠物：${activePet.name}` : '快去领养一只宠物吧！'}
          </p>
        </div>

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('food')}
            className={cn(
              'flex-1 py-4 rounded-2xl font-bold text-lg shadow-lg transition-all flex items-center justify-center gap-2',
              activeTab === 'food'
                ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white scale-105'
                : 'bg-white text-gray-600 hover:scale-105'
            )}
          >
            🍖 宠物食物
          </button>
          <button
            onClick={() => setActiveTab('toy')}
            className={cn(
              'flex-1 py-4 rounded-2xl font-bold text-lg shadow-lg transition-all flex items-center justify-center gap-2',
              activeTab === 'toy'
                ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white scale-105'
                : 'bg-white text-gray-600 hover:scale-105'
            )}
          >
            🎮 宠物玩具
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {PET_ITEMS[activeTab].map(item => {
            const owned = getItemCount(item.id);
            const canAfford = userData.points >= item.cost;

            return (
              <div
                key={item.id}
                className={cn(
                  'bg-white rounded-2xl p-4 text-center shadow-lg transition-all',
                  canAfford && owned === 0 && 'hover:scale-105 cursor-pointer',
                  !canAfford && owned === 0 && 'opacity-70',
                  owned > 0 && 'ring-2 ring-green-400'
                )}
              >
                {owned > 0 && (
                  <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {owned}
                  </div>
                )}

                <div className="text-5xl mb-2">{item.emoji}</div>
                <h3 className="font-bold text-gray-800 mb-1">{item.name}</h3>
                
                <div className="space-y-1 mb-3">
                  {item.type === 'food' && (
                    <>
                      <div className="text-xs text-orange-600">
                        🍖 饱腹 +{item.effect.hunger}
                      </div>
                      <div className="text-xs text-purple-600">
                        ⭐ 经验 +{item.effect.exp}
                      </div>
                    </>
                  )}
                  {item.type === 'toy' && (
                    <>
                      <div className="text-xs text-blue-600">
                        😊 快乐 +{item.effect.happiness}
                      </div>
                      <div className="text-xs text-purple-600">
                        ⭐ 经验 +{item.effect.exp}
                      </div>
                    </>
                  )}
                </div>

                <div className="space-y-2">
                  <button
                    onClick={() => handlePurchase(item.id)}
                    disabled={!canAfford}
                    className={cn(
                      'w-full py-2 rounded-full font-bold text-sm transition-all',
                      canAfford
                        ? 'bg-gradient-to-r from-yellow-400 to-orange-400 text-white hover:opacity-90'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    )}
                  >
                    {owned > 0 ? `+${item.cost}积分再买` : `${item.cost}积分`}
                  </button>
                  
                  {owned > 0 && activePet && (
                    <button
                      onClick={() => handleDirectUse(item.id)}
                      className={cn(
                        'w-full py-2 rounded-full font-bold text-sm transition-all',
                        item.type === 'food'
                          ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white hover:opacity-90'
                          : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:opacity-90'
                      )}
                    >
                      {item.type === 'food' ? '🍖 喂给它' : '🎮 陪它玩'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4">
          <button
            onClick={() => navigate('/pet')}
            className="bg-white rounded-xl p-4 shadow-lg flex items-center justify-center gap-2 hover:scale-105 transition-all"
          >
            <span className="text-3xl">🏠</span>
            <span className="font-bold text-gray-700">宠物小窝</span>
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

      {purchaseSuccess && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-full shadow-lg font-bold animate-bounce z-50">
          {purchaseSuccess}
        </div>
      )}
    </div>
  );
}
