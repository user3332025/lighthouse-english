import { useNavigate } from 'react-router-dom';
import { BookOpen, Sparkles } from 'lucide-react';
import { Header } from '@/components/Header';
import { useUserData, PET_FACES } from '@/hooks/useUserData';
import { cn } from '@/lib/utils';
import { playButtonClick } from '@/lib/gameSfx';

const LEARNING_MODULES = [
  {
    id: 'word',
    title: '单词学习',
    description: '按课本单元背单词',
    icon: '📖',
    color: 'from-blue-400 to-blue-500',
    path: '/word-learning',
  },
  {
    id: 'sentence',
    title: '句型练习',
    description: '练习常用句型',
    icon: '📝',
    color: 'from-green-400 to-green-500',
    path: '/sentence',
  },
  {
    id: 'dialogue',
    title: '对话练习',
    description: '情景对话练习',
    icon: '💬',
    color: 'from-pink-400 to-pink-500',
    path: '/dialogue',
  },
  {
    id: 'games',
    title: '游戏中心',
    description: '趣味英语游戏',
    icon: '🎮',
    color: 'from-orange-400 to-orange-500',
    path: '/games',
  },
  {
    id: 'shop',
    title: '积分商店',
    description: '兑换奖励礼品',
    icon: '🎁',
    color: 'from-yellow-400 to-yellow-500',
    path: '/shop',
  },
  {
    id: 'review',
    title: '今日复习',
    description: '智能复习单词',
    icon: '🎯',
    color: 'from-purple-400 to-purple-500',
    path: '/review',
  },
];

export function HomePage() {
  const navigate = useNavigate();
  const { userData, getCurrentLevel, getLevelProgress, getWordsForReview, PET_FACES } = useUserData();
  
  const pendingReviewCount = getWordsForReview().length;

  const activePet = userData.petHome.pets.find(p => p.id === userData.petHome.activePetId);
  const currentPet = activePet ? PET_FACES[activePet.type] : null;
  const currentLevel = getCurrentLevel();
  const levelProgress = getLevelProgress();

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-orange-100 pb-8">
      <Header />

      {/* 欢迎区域 */}
      <div className="bg-gradient-to-r from-primary-400 to-primary-500 text-white py-6 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl md:text-3xl font-bold mb-2 flex items-center justify-center gap-2">
            <span className="text-3xl">🏠</span>
            欢迎来到灯塔英语角！
          </h1>
          <p className="text-primary-100 text-sm md:text-base">
            在这里，和小动物一起快乐学英语吧！
          </p>
        </div>
      </div>

      {/* 小动物状态卡片 */}
      <div className="max-w-4xl mx-auto px-4 -mt-4">
        <div
          className={cn(
            'bg-white rounded-2xl shadow-warm-lg p-4 cursor-pointer transition-transform hover:scale-[1.02]',
            !currentPet && 'border-2 border-dashed border-orange-300'
          )}
          onClick={() => { playButtonClick(); navigate('/pet'); }}
        >
          {currentPet ? (
            <div className="flex items-center gap-4">
              {/* 小动物 */}
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center text-4xl pet-bounce">
                {currentPet.normal}
              </div>

              {/* 状态信息 */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-lg">你的小动物</span>
                  <span className="bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full">
                    Lv{activePet?.level || 1}
                  </span>
                </div>
                <p className="text-gray-600 text-sm mb-2">
                  {currentLevel.name} · 成长值 {activePet?.exp || 0}/40
                </p>
                {/* 成长进度条 */}
                <div className="w-full h-2 bg-orange-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full transition-all duration-500"
                    style={{ width: `${levelProgress}%` }}
                  />
                </div>
              </div>

              {/* 提示 */}
              <div className="text-orange-500">
                <Sparkles className="w-6 h-6" />
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-3 py-2">
              <span className="text-4xl">🐣</span>
              <div className="text-left">
                <p className="font-bold text-gray-800">还没有领养小动物</p>
                <p className="text-sm text-gray-500">点击这里去领养你的小伙伴！</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 学习模块 */}
      <div className="max-w-4xl mx-auto px-4 mt-6">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {LEARNING_MODULES.map((module, index) => (
            <button
              key={module.id}
              onClick={() => navigate(module.path)}
              className={cn(
                'card-pop bg-white rounded-2xl p-5 shadow-warm',
                'hover:shadow-warm-lg transition-all duration-300',
                'text-left group',
                `bg-gradient-to-br ${module.color}`
              )}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-start gap-4">
                {/* 图标 */}
                <div className="w-14 h-14 bg-white/30 rounded-xl flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                  {module.icon}
                </div>

                {/* 文字 */}
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-white mb-1">{module.title}</h3>
                  <p className="text-white/80 text-sm">{module.description}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 底部提示 */}
      <div className="max-w-4xl mx-auto px-4 mt-8 text-center text-gray-500 text-sm">
        <p>🎯 提示：答题可以获得积分，用积分喂养小动物让它成长！</p>
      </div>
    </div>
  );
}
