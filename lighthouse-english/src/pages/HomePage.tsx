import { useNavigate } from 'react-router-dom';
import { BookOpen, Sparkles } from 'lucide-react';
import { Header } from '@/components/Header';
import { useUserData, PET_FACES } from '@/hooks/useUserData';
import { cn } from '@/lib/utils';

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
    id: 'listening',
    title: '听力练习',
    description: '听音选图训练',
    icon: '👂',
    color: 'from-cyan-400 to-cyan-500',
    path: '/listening',
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
];

export function HomePage() {
  const navigate = useNavigate();
  const { userData, getCurrentLevel, getLevelProgress, getWordsForReview } = useUserData();
  
  const pendingReviewCount = getWordsForReview().length;

  const currentPet = userData.adoptedPet ? PET_FACES[userData.adoptedPet] : null;
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
          onClick={() => navigate('/pet')}
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
                    Lv{userData.petLevel}
                  </span>
                </div>
                <p className="text-gray-600 text-sm mb-2">
                  {currentLevel.name} · 成长值 {userData.petExp}/40
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
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-primary-500" />
          选择学习内容
        </h2>

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

      {/* 复习入口 */}
      <div className="max-w-4xl mx-auto px-4 mt-6">
        <div className="bg-white rounded-2xl shadow-warm-lg p-4">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="text-xl">📚</span>
            智能复习
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => navigate('/review')}
              className="bg-gradient-to-br from-purple-400 to-purple-500 rounded-xl p-4 text-white text-left hover:opacity-90 transition-opacity"
            >
              <div className="text-3xl mb-2">🎯</div>
              <p className="font-bold">今日复习</p>
              <p className="text-sm text-white/80">
                {pendingReviewCount > 0 ? `${pendingReviewCount} 个单词待复习` : '暂无待复习单词'}
              </p>
            </button>
            
            <button
              onClick={() => navigate('/review')}
              className={cn(
                'rounded-xl p-4 text-left transition-opacity',
                userData.wrongQuestions.length > 0
                  ? 'bg-gradient-to-br from-red-400 to-red-500 text-white hover:opacity-90'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              )}
            >
              <div className="text-3xl mb-2">❌</div>
              <p className="font-bold">错题本</p>
              <p className="text-sm">
                {userData.wrongQuestions.length > 0 
                  ? `${userData.wrongQuestions.length} 道错题` 
                  : '暂无错题'}
              </p>
            </button>
            
            <button
              onClick={() => navigate('/review')}
              className={cn(
                'rounded-xl p-4 text-left transition-opacity',
                userData.markedWords.length > 0
                  ? 'bg-gradient-to-br from-yellow-400 to-yellow-500 text-white hover:opacity-90'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              )}
            >
              <div className="text-3xl mb-2">⭐</div>
              <p className="font-bold">重点词</p>
              <p className="text-sm">
                {userData.markedWords.length > 0 
                  ? `${userData.markedWords.length} 个单词` 
                  : '暂无标记'}
              </p>
            </button>
          </div>
        </div>
      </div>

      {/* 底部提示 */}
      <div className="max-w-4xl mx-auto px-4 mt-8 text-center text-gray-500 text-sm">
        <p>🎯 提示：答题可以获得积分，用积分喂养小动物让它成长！</p>
      </div>
    </div>
  );
}
