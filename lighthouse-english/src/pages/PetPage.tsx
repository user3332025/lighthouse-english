import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, Heart, Utensils, Sparkles, Sun, Moon } from 'lucide-react';
import { Header } from '@/components/Header';
import { PetModal } from '@/components/PetModal';
import { useUserData, PET_FACES, PET_LEVELS, PET_NAMES } from '@/hooks/useUserData';
import { cn } from '@/lib/utils';
import { PetType, Pet, Item } from '@/types';
import { PET_ITEMS, findItemById, PET_EMOJIS } from '@/data/petItems';

const PETS: { type: PetType; name: string; emoji: string; description: string }[] = [
  { type: 'dog', name: '小狗狗', emoji: '🐶', description: '忠诚可爱，喜欢玩耍' },
  { type: 'cat', name: '小猫咪', emoji: '🐱', description: '优雅傲娇，爱撒娇' },
  { type: 'rabbit', name: '小兔子', emoji: '🐰', description: '软萌可爱，蹦蹦跳跳' },
  { type: 'bear', name: '小熊', emoji: '🐻', description: '憨厚老实，爱吃蜂蜜' },
  { type: 'fox', name: '小狐狸', emoji: '🦊', description: '聪明伶俐，毛色漂亮' },
];

const MOOD_MESSAGES = [
  { emoji: '✨', text: '好开心呀！' },
  { emoji: '💕', text: '我喜欢你！' },
  { emoji: '😊', text: '心情美美哒~' },
  { emoji: '🎉', text: '太棒啦！' },
  { emoji: '🥰', text: '抱抱~' },
  { emoji: '😘', text: '亲一个~' },
  { emoji: '🌟', text: '我是最棒的！' },
  { emoji: '🎀', text: '乖巧可爱~' },
  { emoji: '🦋', text: '飞舞的感觉！' },
  { emoji: '🍭', text: '甜甜的心情~' },
  { emoji: '🌈', text: '彩虹般快乐！' },
  { emoji: '🎈', text: '飘飘然~' },
  { emoji: '🤗', text: '好温暖呀！' },
  { emoji: '🎶', text: '啦啦啦~' },
  { emoji: '🌸', text: '花开的心情~' },
  { emoji: '☀️', text: '阳光真好！' },
  { emoji: '💫', text: '闪闪发光！' },
  { emoji: '🐾', text: '想出去玩！' },
  { emoji: '🍖', text: '肚子饿了...' },
  { emoji: '🎮', text: '陪我玩嘛~' },
  { emoji: '🤭', text: '嘿嘿~' },
  { emoji: '💖', text: '心里甜甜的~' },
  { emoji: '🌻', text: '向阳而生！' },
  { emoji: '🦊', text: '机灵鬼~' },
  { emoji: '🐻', text: '暖暖的很贴心~' },
  { emoji: '🐰', text: '蹦蹦跳跳~' },
  { emoji: '😺', text: '喵呜~' },
  { emoji: '🐕', text: '汪汪！' },
  { emoji: '🌙', text: '月色真美~' },
];

export function PetPage() {
  const navigate = useNavigate();
  const {
    userData,
    adoptPet,
    adoptTestPet,
    feedPet,
    playWithPet,
    getActivePet,
    addPoints,
    spendPoints,
    getItemCount,
    useItem,
    setPetAccessory,
    setPetBackground,
  } = useUserData();
  
  const [showAccessorySelector, setShowAccessorySelector] = useState(false);
  const [showBackgroundSelector, setShowBackgroundSelector] = useState(false);
  const [isTestMode, setIsTestMode] = useState(false);
  const [testPetLevel, setTestPetLevel] = useState(1);

  const [showLevelUp, setShowLevelUp] = useState(false);
  const [levelUpData, setLevelUpData] = useState<{ newLevel: number; previousLevel: number } | null>(null);
  const [feedSuccess, setFeedSuccess] = useState(false);
  const [playSuccess, setPlaySuccess] = useState(false);
  const [isPetClicked, setIsPetClicked] = useState(false);
  const [petMood, setPetMood] = useState<'normal' | 'happy' | 'excited'>('normal');
  const [currentAction, setCurrentAction] = useState<string | null>(null);
  const [showMoodPopup, setShowMoodPopup] = useState(false);
  const [currentMood, setCurrentMood] = useState<{ emoji: string; text: string } | null>(null);

  const activePet = getActivePet();

  useEffect(() => {
    if (!activePet) return;
    
    const now = Date.now();
    const hoursSinceFed = (now - activePet.lastFed) / (1000 * 60 * 60);
    const hoursSincePlayed = (now - activePet.lastPlayed) / (1000 * 60 * 60);
    
    if (hoursSinceFed > 2) {
      setPetMood('normal');
    }
    if (hoursSinceFed > 4) {
      setPetMood('normal');
    }
  }, [activePet]);

  const handleAdopt = (petType: PetType) => {
    adoptPet(petType);
  };

  const handleFeed = () => {
    if (!activePet) return;
    
    const appleCount = getItemCount('apple');
    if (appleCount > 0) {
      if (useItem('apple')) {
        const result = feedPet(activePet.id, 'apple');
        if (result) {
          setCurrentAction('eating');
          setFeedSuccess(true);
          setTimeout(() => {
            setFeedSuccess(false);
            setCurrentAction(null);
          }, 1500);

          if (result.leveledUp) {
            setLevelUpData({
              newLevel: result.newLevel,
              previousLevel: Math.max(1, result.newLevel - 1),
            });
            setTimeout(() => setShowLevelUp(true), 1800);
          }
        }
      }
    } else {
      if (userData.points < 15) {
        alert('积分不足！需要 15 积分购买苹果');
        return;
      }
      spendPoints(15);
      const result = feedPet(activePet.id, 'apple');
      if (result) {
        setCurrentAction('eating');
        setFeedSuccess(true);
        setTimeout(() => {
          setFeedSuccess(false);
          setCurrentAction(null);
        }, 1500);

        if (result.leveledUp) {
          setLevelUpData({
            newLevel: result.newLevel,
            previousLevel: Math.max(1, result.newLevel - 1),
          });
          setTimeout(() => setShowLevelUp(true), 1800);
        }
      }
    }
  };

  const handlePlay = (toyId: string) => {
    if (!activePet) return;
    
    const count = getItemCount(toyId);
    if (count > 0) {
      if (useItem(toyId)) {
        const result = playWithPet(activePet.id, toyId);
        if (result) {
          setCurrentAction('playing');
          setPlaySuccess(true);
          setTimeout(() => {
            setPlaySuccess(false);
            setCurrentAction(null);
          }, 1500);

          if (result.leveledUp) {
            setLevelUpData({
              newLevel: result.newLevel,
              previousLevel: Math.max(1, result.newLevel - 1),
            });
            setTimeout(() => setShowLevelUp(true), 1800);
          }
        }
      }
    } else {
      alert('这个玩具已经用完了，去商店买新的吧！');
    }
  };

  const handlePetClick = () => {
    setIsPetClicked(true);
    setPetMood('excited');
    
    const randomMood = MOOD_MESSAGES[Math.floor(Math.random() * MOOD_MESSAGES.length)];
    setCurrentMood(randomMood);
    setShowMoodPopup(true);
    
    setTimeout(() => {
      setIsPetClicked(false);
      setPetMood('happy');
    }, 500);
    setTimeout(() => {
      setPetMood('normal');
    }, 2000);
    setTimeout(() => {
      setShowMoodPopup(false);
    }, 2500);
  };

  const getPetEmoji = (pet: Pet) => {
    if (!pet) return '🐾';
    
    const face = PET_FACES[pet.type];
    
    if (currentAction === 'eating') return '🍎';
    if (currentAction === 'playing') return '🎮';
    if (petMood === 'happy' && face?.happy) return face.happy;
    if (pet.hunger < 30 && face?.hungry) return face.hungry;
    if (face?.normal) return face.normal;
    
    return PET_EMOJIS[pet.type] || '🐾';
  };

  const getStatusColor = (value: number) => {
    if (value >= 70) return 'bg-green-500';
    if (value >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getStatusText = (value: number) => {
    if (value >= 80) return '很满足';
    if (value >= 60) return '不错';
    if (value >= 40) return '一般';
    if (value >= 20) return '有点饿/无聊';
    return '需要关爱';
  };

  if (!userData.petHome.pets.length) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary-50 via-orange-50 to-amber-100 pb-8">
        <Header showBack title="小动物养成" />

        <div className="max-w-4xl mx-auto px-4 mt-4">
          <div className="bg-gradient-to-r from-pink-400 via-orange-400 to-yellow-400 rounded-3xl p-8 text-white text-center mb-8 shadow-warm-lg">
            <div className="text-7xl mb-4 animate-bounce">🏠</div>
            <h2 className="text-2xl font-bold mb-2">欢迎来到宠物小窝！</h2>
            <p className="text-white/90">领养一只可爱的小动物，和它一起快乐成长吧！</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {PETS.map((pet) => (
              <button
                key={pet.type}
                onClick={() => isTestMode ? adoptTestPet(pet.type, testPetLevel) : adoptPet(pet.type)}
                className="bg-white rounded-2xl p-6 shadow-warm hover:shadow-warm-lg transition-all duration-300 hover:scale-105 hover:-translate-y-1 text-center group"
              >
                <div className="text-7xl mb-3 group-hover:animate-bounce">{pet.emoji}</div>
                <h3 className="font-bold text-lg text-gray-800 mb-1">{pet.name}</h3>
                <p className="text-sm text-gray-500">{pet.description}</p>
                <div className="mt-3 bg-gradient-to-r from-orange-400 to-pink-500 text-white text-sm px-4 py-2 rounded-full inline-block opacity-0 group-hover:opacity-100 transition-opacity">
                  {isTestMode ? `点击领养 Lv${testPetLevel}` : '点击领养'}
                </div>
              </button>
            ))}
          </div>

          <div className="mt-4 bg-blue-50 rounded-xl p-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isTestMode}
                onChange={(e) => setIsTestMode(e.target.checked)}
                className="w-5 h-5 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">
                🧪 测试模式（仅测试使用）
              </span>
            </label>
            
            {isTestMode && (
              <div className="mt-4 space-y-3">
                <div className="text-sm font-medium text-gray-700 mb-2">选择测试等级：</div>
                <div className="grid grid-cols-5 gap-2">
                  {PET_LEVELS.map((level) => (
                    <button
                      key={level.level}
                      onClick={() => setTestPetLevel(level.level)}
                      className={cn(
                        'p-3 rounded-xl text-center transition-all',
                        testPetLevel === level.level
                          ? 'bg-blue-500 text-white ring-2 ring-blue-300 ring-offset-2'
                          : 'bg-white hover:bg-blue-100 text-gray-700'
                      )}
                    >
                      <div className="text-2xl mb-1">{level.appearance}</div>
                      <div className="text-xs font-bold">Lv{level.level}</div>
                      <div className="text-[10px] opacity-80">{level.name}</div>
                    </button>
                  ))}
                </div>
                <div className="text-xs text-blue-600 mt-2">
                  当前选择：Lv{testPetLevel} {PET_LEVELS.find(l => l.level === testPetLevel)?.name} 
                  (需要 {PET_LEVELS[testPetLevel - 1]?.minExp} 经验)
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 bg-white rounded-2xl p-4 shadow-warm">
            <div className="flex items-center gap-3 mb-3">
              <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
              <span className="font-bold text-gray-800">积分说明</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <span className="text-xl">📚</span>
                <span>学习答题获得积分</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xl">🍎</span>
                <span>用积分购买食物</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xl">🎾</span>
                <span>和宠物玩耍增加快乐值</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xl">⭐</span>
                <span>宠物升级解锁新形态</span>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
              <span className="text-gray-600">当前积分</span>
              <span className="font-bold text-xl text-orange-500">{userData.points} ⭐</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 via-orange-50 to-amber-100 pb-8">
      <Header showBack title="宠物小窝" />

      <div className="max-w-4xl mx-auto px-4 mt-4">
        <div className="bg-white rounded-3xl shadow-warm-lg overflow-hidden mb-6">
          <div
            className={cn(
              'h-44 relative transition-all duration-700 overflow-hidden',
              // 优先使用背景装饰，没有时才使用等级默认背景
              activePet?.background 
                ? findItemById(activePet.background)?.bgStyle 
                : (activePet?.level <= 1 && 'bg-gradient-to-br from-amber-200 via-orange-300 to-yellow-200' ||
                   activePet?.level === 2 && 'bg-gradient-to-br from-orange-300 via-pink-300 to-rose-200' ||
                   activePet?.level === 3 && 'bg-gradient-to-br from-pink-300 via-purple-300 to-violet-200' ||
                   activePet?.level === 4 && 'bg-gradient-to-br from-purple-300 via-indigo-300 to-blue-200' ||
                   activePet?.level >= 5 && 'bg-gradient-to-br from-amber-400 via-orange-400 to-rose-400')
            )}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.4),transparent_55%)] pointer-events-none" />
            
            <div className="absolute top-4 left-4 text-4xl opacity-30 animate-float">🌿</div>
            <div className="absolute top-8 right-8 text-3xl opacity-30 animate-float-delayed">🌸</div>
            <div className="absolute bottom-8 left-8 text-3xl opacity-30 animate-float">🌻</div>

            <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 flex flex-col items-center">
              <div className="relative">
                <button
                  onClick={handlePetClick}
                  className={cn(
                    'rounded-full bg-white/95 backdrop-blur-sm flex items-center justify-center shadow-xl transition-all duration-300 border-4 cursor-pointer hover:scale-105 active:scale-95',
                    activePet?.level === 1 && 'w-36 h-36 text-7xl border-amber-300 pet-idle-breathe',
                    activePet?.level === 2 && 'w-40 h-40 text-8xl border-orange-300 pet-idle-breathe',
                    activePet?.level === 3 && 'w-44 h-44 text-8xl border-pink-300 pet-wiggle',
                    activePet?.level === 4 && 'w-48 h-48 text-9xl border-purple-300 pet-aura-soft pet-wiggle',
                    activePet?.level >= 5 && 'w-52 h-52 text-9xl sm:text-[150px] border-amber-400 pet-aura-strong pet-wiggle',
                    feedSuccess && 'animate-bounce scale-110',
                    isPetClicked && 'animate-pet-click',
                    playSuccess && 'animate-spin-slow'
                  )}
                >
                  <span 
                    className={cn(
                      'leading-none select-none transition-transform duration-300',
                      petMood === 'excited' && 'animate-bounce',
                      petMood === 'happy' && 'scale-110'
                    )} 
                    title={`${PET_NAMES[activePet?.type || 'dog']} Lv${activePet?.level} - 点击互动！`}
                  >
                    {getPetEmoji(activePet!)}
                  </span>
                </button>
                
                {activePet?.accessory && (
                  <div className="absolute -top-3 -right-3 text-4xl animate-bounce">
                    {findItemById(activePet.accessory)?.emoji}
                  </div>
                )}
              </div>
              
              <div className="mt-4 flex items-center gap-2">
                <span className="bg-black/30 backdrop-blur-sm text-white px-4 py-1.5 rounded-full text-sm font-bold">
                  {PET_NAMES[activePet?.type || 'dog']} · Lv{activePet?.level}
                </span>
                <span className="bg-black/30 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs">
                  {PET_LEVELS.find(l => l.level === activePet?.level)?.name}
                </span>
              </div>
              <span className="mt-2 text-xs text-white/80 drop-shadow-md">👆 点击互动</span>
            </div>
          </div>

          <div className="pt-24 pb-6 px-6">
            <div className="flex justify-center mb-6">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 bg-orange-50 px-4 py-2 rounded-full">
                  <Utensils className="w-5 h-5 text-orange-500" />
                  <div className="w-20">
                    <div className="h-2 bg-orange-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-500 ${getStatusColor(activePet?.hunger || 0)}`}
                        style={{ width: `${activePet?.hunger || 0}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-600 mt-1 block">{getStatusText(activePet?.hunger || 0)}</span>
                  </div>
                  <span className="text-sm font-bold text-orange-600">{activePet?.hunger || 0}%</span>
                </div>
                
                <div className="flex items-center gap-2 bg-pink-50 px-4 py-2 rounded-full">
                  <Heart className="w-5 h-5 text-pink-500" />
                  <div className="w-20">
                    <div className="h-2 bg-pink-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-500 ${getStatusColor(activePet?.happiness || 0)}`}
                        style={{ width: `${activePet?.happiness || 0}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-600 mt-1 block">{getStatusText(activePet?.happiness || 0)}</span>
                  </div>
                  <span className="text-sm font-bold text-pink-600">{activePet?.happiness || 0}%</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="text-center bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-3">
                <div className="text-2xl mb-1">⭐</div>
                <div className="text-xs text-gray-500">等级</div>
                <div className="font-bold text-gray-800">Lv{activePet?.level}</div>
              </div>
              <div className="text-center bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-3">
                <div className="text-2xl mb-1">📈</div>
                <div className="text-xs text-gray-500">经验值</div>
                <div className="font-bold text-gray-800">{activePet?.exp}</div>
              </div>
              <div className="text-center bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-3">
                <div className="text-2xl mb-1">🏆</div>
                <div className="text-xs text-gray-500">积分</div>
                <div className="font-bold text-gray-800">{userData.points}</div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-orange-100 to-amber-100 rounded-xl p-4 mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">成长进度</span>
                <span className="text-sm text-gray-600">
                  {activePet?.exp} / {PET_LEVELS.find(l => l.level === activePet?.level + 1)?.minExp || '已满级'}
                </span>
              </div>
              <div className="h-3 bg-white rounded-full overflow-hidden shadow-inner">
                <div 
                  className="h-full bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-400 rounded-full transition-all duration-700"
                  style={{ 
                    width: activePet?.level >= PET_LEVELS.length 
                      ? '100%' 
                      : `${((activePet?.exp || 0) / (PET_LEVELS.find(l => l.level === activePet?.level + 1)?.minExp || 1)) * 100}%` 
                  }}
                />
              </div>
              {activePet?.level < PET_LEVELS.length && (
                <p className="text-xs text-gray-600 mt-2 text-center">
                  再获得 {PET_LEVELS.find(l => l.level === activePet?.level + 1)?.minExp - (activePet?.exp || 0)} 经验即可升级！
                </p>
              )}
            </div>

            <div className="flex justify-center gap-2 flex-wrap max-w-lg mx-auto">
              {PET_LEVELS.map((level) => {
                const unlocked = level.level <= (activePet?.level || 1);
                const current = level.level === (activePet?.level || 1);
                return (
                  <div
                    key={level.level}
                    className={cn(
                      'text-center px-3 py-2 rounded-xl min-w-[4rem] transition-all duration-300',
                      unlocked ? 'bg-gradient-to-br from-orange-100 to-amber-100 text-orange-800' : 'bg-gray-100 text-gray-400',
                      current && 'ring-2 ring-orange-500 ring-offset-2 scale-110 shadow-md z-10'
                    )}
                  >
                    <div className={cn('text-2xl', current && 'animate-pulse')}>
                      {unlocked ? PET_EMOJIS[activePet?.type || 'dog'] : '❓'}
                    </div>
                    <div className="text-xs font-bold mt-1">Lv{level.level}</div>
                    <div className="text-[10px] text-gray-500">{level.name}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-5 shadow-warm">
            <div className="flex items-center gap-2 mb-3">
              <Utensils className="w-5 h-5 text-orange-500" />
              <h3 className="font-bold text-gray-800">喂食</h3>
            </div>
            <p className="text-sm text-gray-500 mb-3">消耗食物恢复饥饿值，获得经验</p>
            <div className="flex flex-wrap gap-2">
              {PET_ITEMS.food.slice(0, 4).map((food) => (
                <button
                  key={food.id}
                  onClick={() => {
                    if (getItemCount(food.id) > 0) {
                      useItem(food.id);
                      feedPet(activePet!.id, food.id);
                      setCurrentAction('eating');
                      setFeedSuccess(true);
                      setTimeout(() => {
                        setFeedSuccess(false);
                        setCurrentAction(null);
                      }, 1500);
                    } else {
                      if (userData.points >= food.cost) {
                        spendPoints(food.cost);
                        feedPet(activePet!.id, food.id);
                        setCurrentAction('eating');
                        setFeedSuccess(true);
                        setTimeout(() => {
                          setFeedSuccess(false);
                          setCurrentAction(null);
                        }, 1500);
                      } else {
                        alert('积分不足！');
                      }
                    }
                  }}
                  className={cn(
                    'rounded-xl px-3 py-2 flex items-center gap-2 transition-all',
                    getItemCount(food.id) > 0
                      ? 'bg-orange-50 hover:bg-orange-100'
                      : 'bg-gray-50 opacity-70'
                  )}
                >
                  <span className="text-xl">{food.emoji}</span>
                  <span className="text-sm font-medium text-gray-700">{food.name}</span>
                  {getItemCount(food.id) > 0 ? (
                    <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full">
                      x{getItemCount(food.id)}
                    </span>
                  ) : (
                    <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">
                      {food.cost}⭐
                    </span>
                  )}
                </button>
              ))}
            </div>
            <button
              onClick={handleFeed}
              disabled={userData.points < 15 && getItemCount('apple') === 0}
              className={cn(
                'w-full mt-3 py-3 rounded-xl font-bold transition-all',
                userData.points >= 15 || getItemCount('apple') > 0
                  ? 'bg-gradient-to-r from-orange-400 to-pink-500 text-white hover:scale-105'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              )}
            >
              🍎 喂食 (+15积分或使用苹果)
            </button>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-warm">
            <div className="flex items-center gap-2 mb-3">
              <Heart className="w-5 h-5 text-pink-500" />
              <h3 className="font-bold text-gray-800">玩耍</h3>
            </div>
            <p className="text-sm text-gray-500 mb-3">使用玩具增加快乐值，获得经验</p>
            <div className="flex flex-wrap gap-2">
              {PET_ITEMS.toy.slice(0, 4).map((toy) => (
                <button
                  key={toy.id}
                  onClick={() => handlePlay(toy.id)}
                  disabled={getItemCount(toy.id) === 0}
                  className={cn(
                    'rounded-xl px-3 py-2 flex items-center gap-2 transition-all',
                    getItemCount(toy.id) > 0
                      ? 'bg-pink-50 hover:bg-pink-100'
                      : 'bg-gray-50 opacity-50 cursor-not-allowed'
                  )}
                >
                  <span className="text-xl">{toy.emoji}</span>
                  <span className="text-sm font-medium text-gray-700">{toy.name}</span>
                  <span className="text-xs bg-pink-100 text-pink-600 px-2 py-0.5 rounded-full">
                    x{getItemCount(toy.id)}
                  </span>
                </button>
              ))}
            </div>
            <button
              onClick={() => navigate('/shop')}
              className="w-full mt-3 py-3 rounded-xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 text-white hover:scale-105 transition-all"
            >
              🛒 去商店买玩具
            </button>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-100 to-pink-50 rounded-2xl p-4 shadow-warm mb-6">
          <div className="flex items-center justify-between mb-4">
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
          
          {!activePet ? (
            <div className="text-center py-4 text-gray-500">
              <div className="text-4xl mb-2">🐾</div>
              <p className="text-sm">领养宠物后可以开始装扮！</p>
              <button
                onClick={() => navigate('/pet')}
                className="mt-2 text-sm text-purple-600 hover:text-purple-700 font-medium"
              >
                前往领养 →
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">👑 装饰配件</span>
                  <button 
                    onClick={() => setShowAccessorySelector(true)}
                    className="text-xs text-purple-600 hover:text-purple-700"
                  >
                    更换
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {activePet?.accessory ? (
                    <div className="bg-purple-50 rounded-lg p-2 text-center">
                      <span className="text-2xl">{findItemById(activePet.accessory)?.emoji}</span>
                      <div className="text-xs text-gray-600 mt-1">{findItemById(activePet.accessory)?.name}</div>
                    </div>
                  ) : (
                    <div className="text-gray-400 text-sm">暂无装饰</div>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">🌸 背景装饰</span>
                  <button 
                    onClick={() => setShowBackgroundSelector(true)}
                    className="text-xs text-purple-600 hover:text-purple-700"
                  >
                    更换
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {activePet?.background ? (
                    <div className="bg-green-50 rounded-lg p-2 text-center">
                      <span className="text-2xl">{findItemById(activePet.background)?.emoji}</span>
                      <div className="text-xs text-gray-600 mt-1">{findItemById(activePet.background)?.name}</div>
                    </div>
                  ) : (
                    <div className="text-gray-400 text-sm">暂无背景</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 装饰配件选择器 */}
        {showAccessorySelector && (
          <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50" onClick={() => setShowAccessorySelector(false)}>
            <div className="bg-white rounded-t-3xl w-full max-w-4xl max-h-[60vh] overflow-hidden animate-slide-up" onClick={e => e.stopPropagation()}>
              <div className="p-4 border-b flex items-center justify-between">
                <h3 className="text-xl font-bold">👑 选择装饰配件</h3>
                <button onClick={() => setShowAccessorySelector(false)} className="text-gray-500 hover:text-gray-700 text-2xl">
                  ✕
                </button>
              </div>
              <div className="p-4 overflow-y-auto max-h-[calc(60vh-80px)]">
                <div className="mb-4">
                  <button 
                    onClick={() => {
                      if (activePet) {
                        setPetAccessory(activePet.id, null);
                        setShowAccessorySelector(false);
                      }
                    }}
                    className={cn(
                      'w-full p-4 rounded-xl border-2 mb-4 transition-all',
                      !activePet?.accessory 
                        ? 'border-purple-500 bg-purple-50' 
                        : 'border-gray-200 hover:border-purple-300'
                    )}
                  >
                    <span className="text-2xl">❌</span>
                    <div className="font-bold">不使用装饰</div>
                  </button>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {PET_ITEMS.accessory.map((item: Item) => {
                    const owned = getItemCount(item.id) > 0;
                    const isActive = activePet?.accessory === item.id;
                    
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          if (owned && activePet) {
                            setPetAccessory(activePet.id, item.id);
                            setShowAccessorySelector(false);
                          }
                        }}
                        disabled={!owned}
                        className={cn(
                          'p-3 rounded-xl border-2 transition-all',
                          isActive ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-300' : 'border-gray-200',
                          owned ? 'hover:border-purple-400 hover:bg-purple-50' : 'opacity-50 cursor-not-allowed'
                        )}
                      >
                        <div className="text-4xl mb-2">{item.emoji}</div>
                        <div className="text-sm">{item.name}</div>
                        {!owned && (
                          <div className="text-xs text-red-500">未拥有</div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 背景装饰选择器 */}
        {showBackgroundSelector && (
          <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50" onClick={() => setShowBackgroundSelector(false)}>
            <div className="bg-white rounded-t-3xl w-full max-w-4xl max-h-[60vh] overflow-hidden animate-slide-up" onClick={e => e.stopPropagation()}>
              <div className="p-4 border-b flex items-center justify-between">
                <h3 className="text-xl font-bold">🌸 选择背景装饰</h3>
                <button onClick={() => setShowBackgroundSelector(false)} className="text-gray-500 hover:text-gray-700 text-2xl">
                  ✕
                </button>
              </div>
              <div className="p-4 overflow-y-auto max-h-[calc(60vh-80px)]">
                <div className="mb-4">
                  <button 
                    onClick={() => {
                      if (activePet) {
                        setPetBackground(activePet.id, null);
                        setShowBackgroundSelector(false);
                      }
                    }}
                    className={cn(
                      'w-full p-4 rounded-xl border-2 mb-4 transition-all',
                      !activePet?.background 
                        ? 'border-purple-500 bg-purple-50' 
                        : 'border-gray-200 hover:border-purple-300'
                    )}
                  >
                    <span className="text-2xl">❌</span>
                    <div className="font-bold">不使用背景</div>
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {PET_ITEMS.background.map((item: Item) => {
                    const owned = getItemCount(item.id) > 0;
                    const isActive = activePet?.background === item.id;
                    
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          if (owned && activePet) {
                            setPetBackground(activePet.id, item.id);
                            setShowBackgroundSelector(false);
                          }
                        }}
                        disabled={!owned}
                        className={cn(
                          'p-4 rounded-xl border-2 transition-all overflow-hidden',
                          isActive ? 'border-purple-500 ring-2 ring-purple-300' : 'border-gray-200',
                          owned ? 'hover:border-purple-400' : 'opacity-50 cursor-not-allowed'
                        )}
                      >
                        <div className={cn('h-16 rounded-lg mb-2 flex items-center justify-center', item.bgStyle)}>
                          <span className="text-3xl">{item.emoji}</span>
                        </div>
                        <div className="text-sm font-medium">{item.name}</div>
                        {!owned && (
                          <div className="text-xs text-red-500">未拥有</div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 mb-6">
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
              <p className="text-xs text-purple-500">购买食物玩具</p>
            </div>
          </button>
        </div>

        {/* 测试模式入口 */}
        <div className="bg-blue-50 rounded-2xl p-4 shadow-warm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🧪</span>
              <div>
                <h3 className="font-bold text-gray-800">测试模式</h3>
                <p className="text-xs text-gray-500">领养新宠物测试不同等级</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isTestMode}
                onChange={(e) => setIsTestMode(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
            </label>
          </div>

          {isTestMode && (
            <div className="space-y-3 mt-4 pt-4 border-t border-blue-100">
              <div className="text-sm font-medium text-gray-700">选择测试等级：</div>
              <div className="grid grid-cols-5 gap-2">
                {PET_LEVELS.map((level) => (
                  <button
                    key={level.level}
                    onClick={() => setTestPetLevel(level.level)}
                    className={cn(
                      'p-2 rounded-xl text-center transition-all',
                      testPetLevel === level.level
                        ? 'bg-blue-500 text-white ring-2 ring-blue-300 ring-offset-2'
                        : 'bg-white hover:bg-blue-100 text-gray-700'
                    )}
                  >
                    <div className="text-xl mb-1">{level.appearance}</div>
                    <div className="text-xs font-bold">Lv{level.level}</div>
                  </button>
                ))}
              </div>
              <div className="text-xs text-blue-600">
                当前：Lv{testPetLevel} {PET_LEVELS.find(l => l.level === testPetLevel)?.name}
              </div>
              <button
                onClick={() => {
                  if (userData.petHome.pets.length > 0) {
                    const confirm = window.confirm(`确定要领养新的 Lv${testPetLevel} 宠物吗？当前有 ${userData.petHome.pets.length} 只宠物。`);
                    if (!confirm) return;
                  }
                  navigate('/pet');
                }}
                className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-bold hover:scale-105 transition-all"
              >
                🐾 前往领养 Lv{testPetLevel} 宠物
              </button>
            </div>
          )}
        </div>

        {showLevelUp && levelUpData && (
          <PetModal
            isOpen={showLevelUp}
            onClose={() => {
              setShowLevelUp(false);
              setLevelUpData(null);
            }}
            type="levelup"
            petType={activePet?.type || 'dog'}
            newLevel={levelUpData.newLevel}
            previousLevel={levelUpData.previousLevel}
          />
        )}

        {feedSuccess && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-full shadow-lg animate-bounce">
            🎉 喂食成功！宠物吃饱了~
          </div>
        )}

        {playSuccess && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-pink-500 text-white px-6 py-3 rounded-full shadow-lg animate-bounce">
            🎮 玩耍开心！宠物很快乐~
          </div>
        )}

        {showMoodPopup && currentMood && (
          <div className="fixed left-1/2 top-1/3 z-50" style={{ transform: 'translateX(-50%)' }}>
            <div className="relative">
              <div className="bg-gradient-to-br from-pink-400 via-purple-400 to-indigo-400 text-white px-8 py-4 rounded-3xl shadow-2xl animate-mood-pop">
                <div className="absolute -top-6 left-1/2 text-6xl animate-bounce" style={{ transform: 'translateX(-50%)' }}>
                  {currentMood.emoji}
                </div>
                <div className="pt-6 text-center">
                  <div className="text-2xl font-bold mb-2 drop-shadow-lg">
                    {currentMood.text}
                  </div>
                  <div className="flex justify-center gap-1 mt-2">
                    <span className="text-lg">✨</span>
                    <span className="text-lg animate-pulse">💕</span>
                    <span className="text-lg">✨</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}