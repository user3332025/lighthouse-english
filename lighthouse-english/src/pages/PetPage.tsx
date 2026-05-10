import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, Sparkles } from 'lucide-react';
import { Header } from '@/components/Header';
import { PetModal } from '@/components/PetModal';
import { useUserData, PET_FACES, PET_LEVELS } from '@/hooks/useUserData';
import { cn } from '@/lib/utils';
import { PetType } from '@/types';
import { PET_ITEMS, findItemById } from '@/data/petItems';

const PETS: { type: PetType; name: string; emoji: string }[] = [
  { type: 'dog', name: '小狗狗', emoji: '🐶' },
  { type: 'cat', name: '小猫咪', emoji: '🐱' },
  { type: 'rabbit', name: '小兔子', emoji: '🐰' },
  { type: 'bear', name: '小熊', emoji: '🐻' },
  { type: 'fox', name: '小狐狸', emoji: '🦊' },
];

export function PetPage() {
  const navigate = useNavigate();
  const {
    userData,
    adoptPet,
    feedPet,
    updatePet,
    getActivePet,
    addPoints,
    spendPoints,
    getItemCount,
    useItem,
  } = useUserData();

  const [showLevelUp, setShowLevelUp] = useState(false);
  const [levelUpData, setLevelUpData] = useState<{ newLevel: number; previousLevel: number } | null>(null);
  const [feedSuccess, setFeedSuccess] = useState(false);
  const [isPetClicked, setIsPetClicked] = useState(false);
  const [petMood, setPetMood] = useState<'normal' | 'happy' | 'excited'>('normal');

  const activePet = getActivePet();

  const handleAdopt = (petType: PetType) => {
    adoptPet(petType);
  };

  const handleFeed = () => {
    if (!activePet) return;
    
    const appleCount = getItemCount('apple');
    if (appleCount > 0) {
      if (useItem('apple')) {
        feedPet(activePet.id, 'apple');
        setFeedSuccess(true);
        setTimeout(() => setFeedSuccess(false), 1000);
      }
    } else {
      if (userData.points < 15) {
        alert('积分不足！需要 15 积分购买苹果');
        return;
      }
      spendPoints(15);
      feedPet(activePet.id, 'apple');
      setFeedSuccess(true);
      setTimeout(() => setFeedSuccess(false), 1000);
    }
  };

  const petFace = userData.adoptedPet ? PET_FACES[userData.adoptedPet] : null;

  const handlePetClick = () => {
    setIsPetClicked(true);
    setPetMood('excited');
    setTimeout(() => {
      setIsPetClicked(false);
      setPetMood('happy');
    }, 500);
    setTimeout(() => {
      setPetMood('normal');
    }, 2000);
  };
  
  const stageEmoji = PET_EMOJIS[userData.adoptedPet || 'dog'] || '🐾';
  const mainPetEmoji = feedSuccess ? '🍎' : stageEmoji;

  // 未领养状态 - 选择小动物
  if (!userData.adoptedPet) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary-50 to-orange-100 pb-8">
        <Header showBack title="小动物养成" />

        <div className="max-w-4xl mx-auto px-4 mt-4">
          {/* 欢迎卡片 */}
          <div className="bg-gradient-to-r from-pink-400 to-orange-400 rounded-2xl p-6 text-white text-center mb-6">
            <div className="text-5xl mb-3">🐣</div>
            <h2 className="text-xl font-bold mb-2">选择你的小伙伴！</h2>
            <p className="text-white/80">领养一只小动物，和它一起学英语吧！</p>
          </div>

          {/* 小动物列表 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {PETS.map((pet) => (
              <button
                key={pet.type}
                onClick={() => handleAdopt(pet.type)}
                className="bg-white rounded-2xl p-6 shadow-warm hover:shadow-warm-lg transition-all hover:scale-105 text-center"
              >
                <div className="text-7xl mb-3">{pet.emoji}</div>
                <h3 className="font-bold text-lg text-gray-800">{pet.name}</h3>
                <p className="text-sm text-gray-500 mt-1">点击领养</p>
              </button>
            ))}
          </div>

          {/* 积分提示 */}
          <div className="mt-6 bg-orange-50 border border-orange-200 rounded-xl p-4">
            <div className="flex items-center gap-2 text-orange-700">
              <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
              <span className="font-medium">
                你有 {userData.points} 积分
              </span>
            </div>
            <p className="text-sm text-orange-600 mt-2">
              💡 答题可以获得积分，用积分喂养小动物让它成长！
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 已领养状态 - 喂养和升级
  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-orange-100 pb-8">
      <Header showBack title="小动物养成" />

      <div className="max-w-4xl mx-auto px-4 mt-4">
        {/* 小动物卡片 */}
        <div className="bg-white rounded-2xl shadow-warm-lg overflow-hidden mb-6">
          {/* 顶部背景：随等级变换色调 */}
          <div
            className={cn(
              'h-40 relative transition-all duration-700 overflow-hidden',
              userData.petLevel <= 1 && 'bg-gradient-to-r from-amber-300 to-orange-400',
              userData.petLevel === 2 && 'bg-gradient-to-r from-orange-400 to-pink-400',
              userData.petLevel === 3 && 'bg-gradient-to-r from-pink-400 to-purple-400',
              userData.petLevel === 4 && 'bg-gradient-to-r from-purple-400 to-indigo-500',
              userData.petLevel >= 5 && 'bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500'
            )}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.35),transparent_55%)] pointer-events-none" />
            
            {userData.petDecoration.background && (
              <div className="absolute inset-0 flex items-center justify-center opacity-30">
                <span className="text-6xl sm:text-7xl">{findShopItemById(userData.petDecoration.background)?.emoji}</span>
              </div>
            )}
            
            <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 flex flex-col items-center">
              <div className="relative">
                <button
                  onClick={handlePetClick}
                  className={cn(
                    'rounded-full bg-white flex items-center justify-center shadow-lg transition-all duration-300 border-4 cursor-pointer hover:scale-105 active:scale-95',
                    userData.petLevel === 1 && 'w-32 h-32 text-6xl border-amber-200 pet-idle-breathe',
                    userData.petLevel === 2 && 'w-36 h-36 text-7xl border-orange-300 pet-idle-breathe',
                    userData.petLevel === 3 && 'w-40 h-40 text-7xl border-pink-300 pet-wiggle',
                    userData.petLevel === 4 && 'w-44 h-44 text-8xl border-purple-300 pet-aura-soft pet-wiggle',
                    userData.petLevel >= 5 && 'w-48 h-48 text-8xl sm:text-9xl border-amber-400 pet-aura-strong pet-wiggle',
                    feedSuccess && 'animate-bounce scale-110',
                    isPetClicked && 'animate-ping scale-115'
                  )}
                >
                  <span 
                    className={cn(
                      'leading-none select-none transition-transform duration-300',
                      petMood === 'excited' && 'animate-bounce',
                      petMood === 'happy' && 'scale-110'
                    )} 
                    title={`当前形态 Lv${userData.petLevel} - 点击互动！`}
                  >
                    {petMood === 'happy' && petFace?.happy ? petFace.happy : mainPetEmoji}
                  </span>
                </button>
                
                {userData.petDecoration.accessory && (
                  <div className="absolute -top-2 -right-2 text-3xl animate-bounce">
                    {findShopItemById(userData.petDecoration.accessory)?.emoji}
                  </div>
                )}
              </div>
              <p className="mt-3 text-sm font-bold text-white/95 drop-shadow-md bg-black/20 px-4 py-1.5 rounded-full">
                当前形态 · Lv{userData.petLevel} {PET_LEVELS.find((l) => l.level === userData.petLevel)?.name}
              </p>
              <span className="mt-1 text-xs text-white/80 drop-shadow-md">👆 点击互动</span>
            </div>
          </div>

          {/* 信息区域 */}
          <div className="pt-24 pb-6 px-6 text-center">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 flex flex-wrap items-center justify-center gap-2">
              <span>我的小伙伴</span>
              <span className="inline-flex items-center gap-1 bg-gradient-to-r from-orange-500 to-pink-500 text-white text-sm px-3 py-1 rounded-full shadow">
                Lv{userData.petLevel}
                <span className="opacity-90 font-normal">
                  {PET_LEVELS.find((l) => l.level === userData.petLevel)?.name}
                </span>
              </span>
            </h2>
            <p className="text-sm text-gray-500 mt-2 max-w-md mx-auto">
              升级后上方头像会变成新的样子，背景颜色也会变化哦！
            </p>

            {/* 成长进度 */}
            <div className="mt-4 max-w-xs mx-auto">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>成长值</span>
                <span>{userData.petExp} / {nextLevel ? nextLevel.minExp : 40}</span>
              </div>
              <div className="w-full h-4 bg-orange-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full transition-all duration-500"
                  style={{ width: `${levelProgress}%` }}
                />
              </div>
              {nextLevel && (
                <p className="text-xs text-gray-500 mt-1">
                  再 {nextLevel.minExp - userData.petExp} 点成长值即可升级！
                </p>
              )}
            </div>

            {/* 等级时间线 */}
            <div className="mt-6 flex justify-center gap-1 sm:gap-2 flex-wrap max-w-lg mx-auto">
              {PET_LEVELS.map((level) => {
                const unlocked = level.level <= userData.petLevel;
                const current = level.level === userData.petLevel;
                const stagePreview = userData.adoptedPet
                  ? getPetStageEmoji(userData.adoptedPet, level.level)
                  : level.appearance;
                return (
                  <div
                    key={level.level}
                    className={cn(
                      'text-center px-2 py-2 sm:px-3 rounded-xl min-w-[3.25rem] transition-all duration-300',
                      unlocked ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-400',
                      current && 'ring-2 ring-orange-500 ring-offset-2 scale-110 shadow-md z-10'
                    )}
                  >
                    <div className={cn('text-xl sm:text-2xl', current && 'animate-pulse')}>{stagePreview}</div>
                    <div className="text-[10px] sm:text-xs font-bold mt-0.5">Lv{level.level}</div>
                    <div className="text-[9px] text-gray-500 leading-tight hidden sm:block">{level.name}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 喂养按钮 */}
        <div className="bg-white rounded-2xl p-6 shadow-warm mb-6">
          <div className="text-center mb-4">
            <div className="text-4xl mb-2">🍖</div>
            <h3 className="font-bold text-lg text-gray-800">喂养小动物</h3>
            <p className="text-gray-500 text-sm">消耗 30 积分，获得 1 点成长值</p>
          </div>

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
              <span className="font-medium">当前积分：{userData.points}</span>
            </div>
            <button
              onClick={handleFeed}
              disabled={userData.points < 30}
              className={cn(
                'px-6 py-3 rounded-full font-bold transition-all shadow-warm',
                userData.points >= 30
                  ? 'bg-gradient-to-r from-orange-400 to-pink-500 text-white hover:scale-105'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              )}
            >
              🐟 喂养 (+1成长值)
            </button>
          </div>

          {userData.points < 30 && (
            <p className="text-center text-sm text-red-500">
              💡 积分不足，去学习赚取更多积分吧！
            </p>
          )}
        </div>

        {/* 背包物品使用 */}
        {Object.keys(userData.userItems || {}).length > 0 && (
          <div className="bg-gradient-to-r from-orange-100 to-red-50 rounded-2xl p-4 shadow-warm mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <span className="text-2xl">🎁</span>
                我的背包
                <span className="bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {Object.keys(userData.userItems).length}
                </span>
              </h3>
              <button
                onClick={() => navigate('/shop')}
                className="text-sm text-orange-600 hover:text-orange-700 font-medium"
              >
                去商店 +
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-3">
              在商店兑换的物品都会出现在这里。点击下面任意物品喂给小动物，每次消耗 1 个并获得 +2 成长值。
            </p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(userData.userItems).map(([itemId, count]) => {
                const item = findShopItemById(itemId);
                const name = item?.name ?? '神秘物品';
                const emoji = item?.emoji ?? '🎁';
                const growth = userData.adoptedPet ? getGrowthValue(userData.adoptedPet, itemId) : 2;
                return (
                  <button
                    key={itemId}
                    type="button"
                    onClick={() => {
                      const result = consumeItem(itemId);
                      if (result.success) {
                        setUsedItemName(emoji);
                        setLastFeedGrowth(result.growth);
                        setLastFeedBad(result.isBad);
                        setFeedSuccess(true);
                        setTimeout(() => {
                          setFeedSuccess(false);
                          setUsedItemName(null);
                          setLastFeedGrowth(2);
                          setLastFeedBad(false);
                        }, 2000);

                        const nextLevel = getNextLevel();
                        if (nextLevel && userData.petExp + result.growth >= nextLevel.minExp) {
                          setLevelUpData({
                            newLevel: userData.petLevel + 1,
                            previousLevel: userData.petLevel,
                          });
                          setTimeout(() => setShowLevelUp(true), 1800);
                        }
                      }
                    }}
                    className={cn(
                      'rounded-xl px-4 py-2 flex items-center gap-2 transition-all shadow-sm hover:shadow-md active:scale-95',
                      growth === 0 ? 'bg-gray-100 opacity-70' : 'bg-white hover:bg-orange-50'
                    )}
                  >
                    <span className="text-2xl">{emoji}</span>
                    <div className="text-left">
                      <div className="font-bold text-sm text-gray-800">{name}</div>
                      <div className="text-xs text-orange-500">x{count}</div>
                    </div>
                    <span className={cn(
                      'text-xs px-2 py-0.5 rounded-full ml-1 font-medium',
                      growth === 3 ? 'bg-red-100 text-red-600' :
                      growth === 2 ? 'bg-green-100 text-green-600' :
                      growth === 1 ? 'bg-yellow-100 text-yellow-600' :
                      'bg-gray-200 text-gray-500'
                    )}>
                      {growth === 0 ? '⚠️ 有害' : `+${growth}成长`}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 背包为空提示 */}
        {Object.keys(userData.userItems || {}).length === 0 && (
          <button
            onClick={() => navigate('/shop')}
            className="w-full bg-white rounded-2xl p-4 shadow-warm mb-6 flex items-center justify-center gap-3 hover:shadow-warm-lg transition-all"
          >
            <span className="text-3xl">🛒</span>
            <div className="text-left">
              <p className="font-bold text-gray-800">背包空空~</p>
              <p className="text-sm text-gray-500">去商店兑换小零食喂你的小动物吧！</p>
            </div>
          </button>
        )}

        {/* 宠物装饰 */}
        <div className="bg-gradient-to-r from-purple-100 to-pink-50 rounded-2xl p-4 shadow-warm mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-500" />
              宠物装扮
            </h3>
            <button
              onClick={() => navigate('/shop')}
              className="text-sm text-purple-600 hover:text-purple-700 font-medium"
            >
              去商店 +
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            {/* 装饰配件 */}
            <div className="bg-white rounded-xl p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">👑 装饰配件</span>
                {userData.petDecoration.accessory && (
                  <button
                    onClick={() => unequipDecoration('accessory')}
                    className="text-xs text-gray-500 hover:text-red-500"
                  >
                    卸下
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {userData.petDecoration.accessory ? (
                  <div className="bg-purple-50 rounded-lg p-2 text-center">
                    <span className="text-2xl">{findShopItemById(userData.petDecoration.accessory)?.emoji}</span>
                    <div className="text-xs text-gray-600 mt-1">{findShopItemById(userData.petDecoration.accessory)?.name}</div>
                  </div>
                ) : (
                  <div className="text-gray-400 text-sm">暂无装饰</div>
                )}
                {Object.entries(userData.userItems || {})
                  .filter(([itemId]) => SHOP_ITEMS.accessories?.some(item => item.id === itemId))
                  .map(([itemId, count]) => {
                    const item = SHOP_ITEMS.accessories.find(i => i.id === itemId);
                    if (!item) return null;
                    return (
                      <button
                        key={itemId}
                        onClick={() => equipDecoration('accessory', itemId)}
                        className={cn(
                          'rounded-lg p-2 transition-all',
                          userData.petDecoration.accessory === itemId
                            ? 'bg-purple-200 ring-2 ring-purple-400'
                            : 'bg-purple-50 hover:bg-purple-100'
                        )}
                      >
                        <span className="text-2xl">{item.emoji}</span>
                      </button>
                    );
                  })}
              </div>
            </div>

            {/* 背景装饰 */}
            <div className="bg-white rounded-xl p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">🌸 背景装饰</span>
                {userData.petDecoration.background && (
                  <button
                    onClick={() => unequipDecoration('background')}
                    className="text-xs text-gray-500 hover:text-red-500"
                  >
                    卸下
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {userData.petDecoration.background ? (
                  <div className="bg-green-50 rounded-lg p-2 text-center">
                    <span className="text-2xl">{findShopItemById(userData.petDecoration.background)?.emoji}</span>
                    <div className="text-xs text-gray-600 mt-1">{findShopItemById(userData.petDecoration.background)?.name}</div>
                  </div>
                ) : (
                  <div className="text-gray-400 text-sm">暂无背景</div>
                )}
                {Object.entries(userData.userItems || {})
                  .filter(([itemId]) => SHOP_ITEMS.nature?.some(item => item.id === itemId))
                  .map(([itemId, count]) => {
                    const item = SHOP_ITEMS.nature.find(i => i.id === itemId);
                    if (!item) return null;
                    return (
                      <button
                        key={itemId}
                        onClick={() => equipDecoration('background', itemId)}
                        className={cn(
                          'rounded-lg p-2 transition-all',
                          userData.petDecoration.background === itemId
                            ? 'bg-green-200 ring-2 ring-green-400'
                            : 'bg-green-50 hover:bg-green-100'
                        )}
                      >
                        <span className="text-2xl">{item.emoji}</span>
                      </button>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>

        {/* 快捷入口 */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => navigate('/')}
            className="bg-white rounded-xl p-4 shadow-warm hover:shadow-warm-lg transition-all flex items-center gap-3"
          >
            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center text-2xl">
              📚
            </div>
            <div className="text-left">
              <p className="font-bold text-gray-800">去学习</p>
              <p className="text-xs text-gray-500">赚取积分</p>
            </div>
          </button>

          <button
            onClick={() => navigate('/shop')}
            className="bg-white rounded-xl p-4 shadow-warm flex items-center gap-3 hover:shadow-warm-lg transition-all"
          >
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-2xl">
              🏪
            </div>
            <div className="text-left">
              <p className="font-bold text-gray-800">兑换商店</p>
              <p className="text-xs text-purple-500">去看看有什么好东西</p>
            </div>
          </button>
        </div>

        {/* 升级庆祝弹窗 */}
        {showLevelUp && levelUpData && (
          <PetModal
            isOpen={showLevelUp}
            onClose={() => {
              setShowLevelUp(false);
              setLevelUpData(null);
            }}
            type="levelup"
            petType={userData.adoptedPet || 'dog'}
            newLevel={levelUpData.newLevel}
            previousLevel={levelUpData.previousLevel}
          />
        )}

        {/* 喂养成功提示 */}
        {feedSuccess && (
          <div className={cn(
            'fixed bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full shadow-lg animate-bounce',
            lastFeedBad ? 'bg-red-500' : 'bg-green-500'
          )}>
            <span className="text-white">
              {usedItemName && lastFeedBad
                ? `${usedItemName} 这个对小动物有害！💔`
                : usedItemName
                  ? `${usedItemName} 喂养成功！+${lastFeedGrowth}成长值 🎉`
                  : '🎉 喂养成功！'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
