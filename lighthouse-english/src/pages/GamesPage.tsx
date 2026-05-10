import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { cn } from '@/lib/utils';

const GAMES = [
  {
    id: 'listening',
    title: '听力选择',
    description: '听发音，选图片',
    icon: '👂',
    color: 'from-blue-400 to-blue-500',
    path: '/games/listening',
  },
  {
    id: 'matching',
    title: '拼写匹配',
    description: '单词图片连连看',
    icon: '🧩',
    color: 'from-green-400 to-green-500',
    path: '/games/matching',
  },
  {
    id: 'ordering',
    title: '句子排序',
    description: '排列正确句子顺序',
    icon: '📝',
    color: 'from-purple-400 to-purple-500',
    path: '/games/ordering',
  },
];

export function GamesPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-orange-100 pb-8">
      <Header showBack title="游戏中心" />

      <div className="max-w-4xl mx-auto px-4 mt-4">
        {/* 欢迎语 */}
        <div className="bg-gradient-to-r from-purple-400 to-pink-400 rounded-2xl p-6 text-white text-center mb-6">
          <div className="text-4xl mb-2">🎮</div>
          <h2 className="text-xl font-bold mb-1">游戏中心</h2>
          <p className="text-white/80">边玩边学，快乐学英语！</p>
        </div>

        {/* 游戏列表 */}
        <div className="grid grid-cols-1 gap-4">
          {GAMES.map((game, index) => (
            <button
              key={game.id}
              onClick={() => navigate(game.path)}
              className={cn(
                'card-pop bg-white rounded-2xl p-5 shadow-warm',
                'hover:shadow-warm-lg transition-all duration-300',
                'text-left group',
                `bg-gradient-to-br ${game.color}`
              )}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-center gap-4">
                {/* 图标 */}
                <div className="w-16 h-16 bg-white/30 rounded-xl flex items-center justify-center text-4xl group-hover:scale-110 transition-transform">
                  {game.icon}
                </div>

                {/* 文字 */}
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-white mb-1">{game.title}</h3>
                  <p className="text-white/80 text-sm">{game.description}</p>
                </div>

                {/* 箭头 */}
                <div className="text-white/60 group-hover:text-white group-hover:translate-x-2 transition-all">
                  →
                </div>
              </div>

              {/* 积分提示 */}
              <div className="mt-3 pt-3 border-t border-white/20">
                <span className="text-white/70 text-sm">
                  答对每题 <span className="font-bold text-yellow-300">+10 积分</span>
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* 提示 */}
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <h3 className="font-bold text-yellow-800 mb-2">🎯 游戏小贴士</h3>
          <ul className="text-yellow-700 text-sm space-y-1">
            <li>• 先确保语音功能已开启（右上角喇叭图标）</li>
            <li>• 答错也不要灰心，可以重新尝试</li>
            <li>• 完成全部题目可以获得更多积分</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
