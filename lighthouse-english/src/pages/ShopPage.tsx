import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { useUserData } from '@/hooks/useUserData';
import { PET_ITEMS, findItemById } from '@/data/petItems';
import { cn } from '@/lib/utils';
import { Item } from '@/types';

type TabType = 'food' | 'toy' | 'accessory' | 'background';
type FoodCategory = 'all' | 'snack' | 'fruit' | 'meal';
type ToyCategory = 'all' | 'ball' | 'plush' | 'game';
type AccessoryCategory = 'all' | 'crown' | 'hat' | 'glasses' | 'bow';
type BackgroundCategory = 'all' | 'nature' | 'space' | 'fantasy';

export function ShopPage() {
  const navigate = useNavigate();
  const { userData, purchaseItem, getItemCount, getActivePet } = useUserData();
  const [activeTab, setActiveTab] = useState<TabType>('food');
  const [activeFoodCategory, setActiveFoodCategory] = useState<FoodCategory>('all');
  const [activeToyCategory, setActiveToyCategory] = useState<ToyCategory>('all');
  const [activeAccessoryCategory, setActiveAccessoryCategory] = useState<AccessoryCategory>('all');
  const [activeBackgroundCategory, setActiveBackgroundCategory] = useState<BackgroundCategory>('all');
  const [purchaseSuccess, setPurchaseSuccess] = useState<string | null>(null);
  const [showInventory, setShowInventory] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);

  const activePet = getActivePet();
  
  const filteredFoods = activeFoodCategory === 'all' 
    ? PET_ITEMS.food 
    : PET_ITEMS.food.filter(item => item.category === activeFoodCategory);
    
  const filteredToys = activeToyCategory === 'all'
    ? PET_ITEMS.toy
    : PET_ITEMS.toy.filter(item => item.category === activeToyCategory);

  const filteredAccessories = activeAccessoryCategory === 'all'
    ? PET_ITEMS.accessory
    : PET_ITEMS.accessory.filter(item => item.category === activeAccessoryCategory);

  const filteredBackgrounds = activeBackgroundCategory === 'all'
    ? PET_ITEMS.background
    : PET_ITEMS.background.filter(item => item.category === activeBackgroundCategory);

  let currentItems: Item[];
  switch (activeTab) {
    case 'food':
      currentItems = filteredFoods;
      break;
    case 'toy':
      currentItems = filteredToys;
      break;
    case 'accessory':
      currentItems = filteredAccessories;
      break;
    case 'background':
      currentItems = filteredBackgrounds;
      break;
    default:
      currentItems = filteredFoods;
  }
  const inventoryCount = Object.keys(userData.inventory).length;

  const handlePurchase = (item: Item) => {
    if (userData.points < item.cost) {
      return;
    }

    if (purchaseItem(item.id)) {
      setPurchaseSuccess(`${item.emoji} ${item.name} 兑换成功！`);
      setTimeout(() => setPurchaseSuccess(null), 2000);
    }
  };

  const handleDirectUse = (item: Item) => {
    if (!activePet) {
      alert('请先领养一只宠物！');
      return;
    }
    
    if (item.type === 'food') {
      navigate('/pet', { state: { feedItem: item.id } });
    } else if (item.type === 'toy') {
      navigate('/pet', { state: { playItem: item.id } });
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      all: '全部',
      snack: '小零食',
      fruit: '水果',
      meal: '正餐',
      ball: '球类',
      plush: '毛绒',
      game: '游戏',
      crown: '皇冠',
      hat: '帽子',
      glasses: '眼镜',
      bow: '蝴蝶结',
      nature: '自然',
      space: '太空',
      fantasy: '奇幻',
    };
    return labels[category] || category;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-yellow-100 via-orange-50 to-pink-100 pb-20">
      <Header showBack title="兑换商店" />

      <div className="max-w-4xl mx-auto px-4 mt-4">
        <div className="bg-gradient-to-r from-yellow-400 to-orange-400 rounded-2xl p-4 text-white text-center mb-6 shadow-lg">
          <div className="flex items-center justify-center gap-3 mb-2">
            <span className="text-4xl">⭐</span>
            <span className="text-4xl font-bold">{userData.points}</span>
            <span className="text-xl">积分</span>
          </div>
          <p className="text-sm opacity-90">
            {activePet ? `当前宠物：${activePet.name}` : '快去领养一只宠物吧！'}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
          <button
            onClick={() => setActiveTab('food')}
            className={cn(
              'py-3 rounded-xl font-bold text-sm shadow-lg transition-all flex items-center justify-center gap-1',
              activeTab === 'food'
                ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white scale-105'
                : 'bg-white text-gray-600 hover:scale-105'
            )}
          >
            🍖 食物
          </button>
          <button
            onClick={() => setActiveTab('toy')}
            className={cn(
              'py-3 rounded-xl font-bold text-sm shadow-lg transition-all flex items-center justify-center gap-1',
              activeTab === 'toy'
                ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white scale-105'
                : 'bg-white text-gray-600 hover:scale-105'
            )}
          >
            🎮 玩具
          </button>
          <button
            onClick={() => setActiveTab('accessory')}
            className={cn(
              'py-3 rounded-xl font-bold text-sm shadow-lg transition-all flex items-center justify-center gap-1',
              activeTab === 'accessory'
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white scale-105'
                : 'bg-white text-gray-600 hover:scale-105'
            )}
          >
            👑 装饰
          </button>
          <button
            onClick={() => setActiveTab('background')}
            className={cn(
              'py-3 rounded-xl font-bold text-sm shadow-lg transition-all flex items-center justify-center gap-1',
              activeTab === 'background'
                ? 'bg-gradient-to-r from-green-500 to-teal-500 text-white scale-105'
                : 'bg-white text-gray-600 hover:scale-105'
            )}
          >
            🌸 背景
          </button>
        </div>

        {activeTab === 'food' && (
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
            {(['all', 'snack', 'fruit', 'meal'] as FoodCategory[]).map(cat => (
              <button
                key={cat}
                onClick={() => setActiveFoodCategory(cat)}
                className={cn(
                  'px-4 py-2 rounded-full font-medium whitespace-nowrap transition-all',
                  activeFoodCategory === cat
                    ? 'bg-orange-500 text-white'
                    : 'bg-white text-gray-600 hover:bg-orange-100'
                )}
              >
                {getCategoryLabel(cat)}
              </button>
            ))}
          </div>
        )}

        {activeTab === 'toy' && (
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
            {(['all', 'ball', 'plush', 'game'] as ToyCategory[]).map(cat => (
              <button
                key={cat}
                onClick={() => setActiveToyCategory(cat)}
                className={cn(
                  'px-4 py-2 rounded-full font-medium whitespace-nowrap transition-all',
                  activeToyCategory === cat
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-600 hover:bg-blue-100'
                )}
              >
                {getCategoryLabel(cat)}
              </button>
            ))}
          </div>
        )}

        {activeTab === 'accessory' && (
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
            {(['all', 'crown', 'hat', 'glasses', 'bow'] as AccessoryCategory[]).map(cat => (
              <button
                key={cat}
                onClick={() => setActiveAccessoryCategory(cat)}
                className={cn(
                  'px-4 py-2 rounded-full font-medium whitespace-nowrap transition-all',
                  activeAccessoryCategory === cat
                    ? 'bg-purple-500 text-white'
                    : 'bg-white text-gray-600 hover:bg-purple-100'
                )}
              >
                {getCategoryLabel(cat)}
              </button>
            ))}
          </div>
        )}

        {activeTab === 'background' && (
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
            {(['all', 'nature', 'space', 'fantasy'] as BackgroundCategory[]).map(cat => (
              <button
                key={cat}
                onClick={() => setActiveBackgroundCategory(cat)}
                className={cn(
                  'px-4 py-2 rounded-full font-medium whitespace-nowrap transition-all',
                  activeBackgroundCategory === cat
                    ? 'bg-green-500 text-white'
                    : 'bg-white text-gray-600 hover:bg-green-100'
                )}
              >
                {getCategoryLabel(cat)}
              </button>
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {currentItems.map(item => {
            const owned = getItemCount(item.id);
            const canAfford = userData.points >= item.cost;

            return (
              <div
                key={item.id}
                className={cn(
                  'relative bg-white rounded-2xl p-4 text-center shadow-lg transition-all',
                  canAfford && owned === 0 && 'hover:scale-105 hover:shadow-xl cursor-pointer',
                  !canAfford && owned === 0 && 'opacity-60',
                  owned > 0 && 'ring-4 ring-green-400 bg-green-50'
                )}
                onClick={() => setSelectedItem(item)}
              >
                {owned > 0 && (
                  <div className="absolute -top-2 -right-2 bg-green-500 text-white text-sm px-3 py-1 rounded-full font-bold shadow-lg">
                    {owned}个
                  </div>
                )}

                {/* 背景物品显示预览 */}
                {item.type === 'background' && item.bgStyle ? (
                  <div className={cn('h-24 rounded-xl mb-3 flex items-center justify-center', item.bgStyle)}>
                    <span className="text-5xl">{item.emoji}</span>
                  </div>
                ) : (
                  <div className="text-6xl mb-3">{item.emoji}</div>
                )}
                
                <h3 className="font-bold text-gray-800 text-sm mb-2">{item.name}</h3>
                
                <div className="space-y-1 mb-3">
                  {item.type === 'food' && (
                    <>
                      <div className="text-xs text-orange-600 flex items-center justify-center gap-1">
                        <span>🍖</span>
                        <span>+{item.effect.hunger}饱腹</span>
                      </div>
                      <div className="text-xs text-purple-600 flex items-center justify-center gap-1">
                        <span>⭐</span>
                        <span>+{item.effect.exp}经验</span>
                      </div>
                    </>
                  )}
                  {item.type === 'toy' && (
                    <>
                      <div className="text-xs text-blue-600 flex items-center justify-center gap-1">
                        <span>😊</span>
                        <span>+{item.effect.happiness}快乐</span>
                      </div>
                      <div className="text-xs text-purple-600 flex items-center justify-center gap-1">
                        <span>⭐</span>
                        <span>+{item.effect.exp}经验</span>
                      </div>
                    </>
                  )}
                  {item.type === 'accessory' && (
                    <div className="text-xs text-purple-600 flex items-center justify-center gap-1">
                      <span>⭐</span>
                      <span>+{item.effect.exp}经验</span>
                    </div>
                  )}
                  {item.type === 'background' && (
                    <div className="text-xs text-green-600 flex items-center justify-center gap-1">
                      <span>⭐</span>
                      <span>+{item.effect.exp}经验</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePurchase(item);
                    }}
                    disabled={!canAfford}
                    className={cn(
                      'w-full py-2 rounded-full font-bold text-sm transition-all',
                      canAfford
                        ? 'bg-gradient-to-r from-yellow-400 to-orange-400 text-white hover:opacity-90 active:scale-95'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    )}
                  >
                    {canAfford ? `${item.cost}积分` : `需要${item.cost}积分`}
                  </button>
                  
                  {owned > 0 && activePet && item.type === 'food' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDirectUse(item);
                      }}
                      className="w-full py-2 rounded-full font-bold text-sm bg-gradient-to-r from-orange-500 to-red-500 text-white hover:opacity-90 active:scale-95"
                    >
                      🍖 喂给宠物
                    </button>
                  )}
                  {owned > 0 && activePet && item.type === 'toy' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDirectUse(item);
                      }}
                      className="w-full py-2 rounded-full font-bold text-sm bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:opacity-90 active:scale-95"
                    >
                      🎮 陪宠物玩
                    </button>
                  )}
                  {owned > 0 && activePet && (item.type === 'accessory' || item.type === 'background') && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate('/pet');
                      }}
                      className={cn(
                        'w-full py-2 rounded-full font-bold text-sm transition-all',
                        item.type === 'accessory'
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                          : 'bg-gradient-to-r from-green-500 to-teal-500 text-white'
                      )}
                    >
                      前往装扮
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

        <button
          onClick={() => setShowInventory(true)}
          className="w-full mt-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl p-4 shadow-lg flex items-center justify-center gap-2 hover:scale-105 transition-all"
        >
          <span className="text-3xl">🎒</span>
          <span className="font-bold text-lg">我的背包</span>
          {inventoryCount > 0 && (
            <span className="bg-white text-purple-500 text-sm px-3 py-1 rounded-full font-bold">
              {inventoryCount}种物品
            </span>
          )}
        </button>
      </div>

      {showInventory && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50">
          <div className="bg-white rounded-t-3xl w-full max-w-4xl max-h-[80vh] overflow-hidden animate-slide-up">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="text-xl font-bold">🎒 我的背包</h3>
              <button
                onClick={() => setShowInventory(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ✕
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto max-h-[calc(80vh-80px)]">
              {inventoryCount === 0 ? (
                <div className="text-center py-12">
                  <div className="text-8xl mb-4">🎒</div>
                  <p className="text-gray-500 text-lg">背包空空~</p>
                  <p className="text-gray-400 text-sm mt-2">快去兑换一些物品吧！</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {Object.entries(userData.inventory)
                    .filter(([_, count]) => count > 0)
                    .map(([itemId, count]) => {
                      const item = findItemById(itemId);
                      if (!item) return null;
                      return (
                        <div
                          key={itemId}
                          className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-3 text-center"
                        >
                          <div className="text-4xl mb-2">{item.emoji}</div>
                          <div className="font-bold text-gray-800 text-sm">{item.name}</div>
                          <div className="text-purple-600 font-bold">x{count}</div>
                          {activePet && (item.type === 'food' || item.type === 'toy') && (
                            <button
                              onClick={() => {
                                handleDirectUse(item);
                                setShowInventory(false);
                              }}
                              className={cn(
                                'mt-2 w-full py-1 rounded-full text-xs font-bold text-white transition-all',
                                item.type === 'food'
                                  ? 'bg-gradient-to-r from-orange-500 to-red-500'
                                  : 'bg-gradient-to-r from-blue-500 to-purple-500'
                              )}
                            >
                              {item.type === 'food' ? '喂食' : '玩耍'}
                            </button>
                          )}
                          {activePet && (item.type === 'accessory' || item.type === 'background') && (
                            <button
                              onClick={() => {
                                navigate('/pet');
                                setShowInventory(false);
                              }}
                              className={cn(
                                'mt-2 w-full py-1 rounded-full text-xs font-bold text-white transition-all',
                                item.type === 'accessory'
                                  ? 'bg-gradient-to-r from-purple-500 to-pink-500'
                                  : 'bg-gradient-to-r from-green-500 to-teal-500'
                              )}
                            >
                              前往装扮
                            </button>
                          )}
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {selectedItem && (
          <div 
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedItem(null)}
          >
            <div 
              className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-4">
                {/* 背景物品显示预览 */}
                {selectedItem.type === 'background' && selectedItem.bgStyle ? (
                  <div className={cn('h-32 rounded-2xl mb-3 flex items-center justify-center', selectedItem.bgStyle)}>
                    <span className="text-7xl">{selectedItem.emoji}</span>
                  </div>
                ) : (
                  <div className="text-8xl mb-3">{selectedItem.emoji}</div>
                )}
                <h3 className="text-2xl font-bold text-gray-800 mb-2">{selectedItem.name}</h3>
                <div className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-4 py-2 rounded-full inline-block font-bold">
                  ⭐ {selectedItem.cost} 积分
                </div>
              </div>

              <div className="bg-gray-50 rounded-2xl p-4 mb-4">
                <h4 className="font-bold text-gray-700 mb-2">✨ 物品效果</h4>
                {selectedItem.type === 'food' && (
                  <>
                    <div className="flex items-center gap-2 text-orange-600 mb-2">
                      <span>🍖</span>
                      <span>饱腹度 +{selectedItem.effect.hunger}</span>
                    </div>
                    <div className="flex items-center gap-2 text-purple-600">
                      <span>⭐</span>
                      <span>经验值 +{selectedItem.effect.exp}</span>
                    </div>
                  </>
                )}
                {selectedItem.type === 'toy' && (
                  <>
                    <div className="flex items-center gap-2 text-blue-600 mb-2">
                      <span>😊</span>
                      <span>快乐度 +{selectedItem.effect.happiness}</span>
                    </div>
                    <div className="flex items-center gap-2 text-purple-600">
                      <span>⭐</span>
                      <span>经验值 +{selectedItem.effect.exp}</span>
                    </div>
                  </>
                )}
                {selectedItem.type === 'accessory' && (
                  <div className="flex items-center gap-2 text-purple-600">
                    <span>⭐</span>
                    <span>经验值 +{selectedItem.effect.exp}</span>
                  </div>
                )}
                {selectedItem.type === 'background' && (
                  <div className="flex items-center gap-2 text-green-600">
                    <span>⭐</span>
                    <span>经验值 +{selectedItem.effect.exp}</span>
                  </div>
                )}
              </div>

              <div className="bg-yellow-50 rounded-2xl p-4 mb-4">
                <h4 className="font-bold text-yellow-700 mb-2">💡 提示</h4>
                <p className="text-sm text-gray-600">
                  {selectedItem.type === 'food' 
                    ? '喂给宠物可以恢复饱腹度并获得经验值，快去宠物小窝使用吧！'
                    : selectedItem.type === 'toy'
                    ? '陪宠物玩耍可以增加快乐度并获得经验值，快去宠物小窝使用吧！'
                    : selectedItem.type === 'accessory'
                    ? '给宠物戴上酷炫的装饰品！兑换后去宠物小窝为宠物装扮吧！'
                    : '为你的宠物小窝换上美丽的背景！兑换后去宠物小窝设置吧！'
                  }
                </p>
              </div>

              <div className="space-y-2">
                <button
                  onClick={() => {
                    handlePurchase(selectedItem);
                    setSelectedItem(null);
                  }}
                  disabled={userData.points < selectedItem.cost}
                  className={cn(
                    'w-full py-3 rounded-full font-bold text-lg transition-all',
                    userData.points >= selectedItem.cost
                      ? 'bg-gradient-to-r from-yellow-400 to-orange-400 text-white hover:opacity-90 active:scale-95'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  )}
                >
                  {userData.points >= selectedItem.cost ? '🛒 立即兑换' : '积分不足'}
                </button>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="w-full py-2 rounded-full font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition"
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        )}

      {purchaseSuccess && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-8 py-4 rounded-full shadow-2xl font-bold text-lg animate-bounce z-50">
          {purchaseSuccess}
        </div>
      )}
    </div>
  );
}
