import { useNavigate } from 'react-router-dom';
import { Star, Volume2, VolumeX, Home } from 'lucide-react';
import { useUserData } from '@/hooks/useUserData';
import { VoiceGenderToggle } from '@/components/VoiceGenderToggle';
import { cn } from '@/lib/utils';

interface HeaderProps {
  showBack?: boolean;
  title?: string;
}

export function Header({ showBack = false, title }: HeaderProps) {
  const navigate = useNavigate();
  const { userData, setVoiceEnabled, getCurrentLevel, getLevelProgress, PET_FACES } = useUserData();

  const currentPet = userData.adoptedPet ? PET_FACES[userData.adoptedPet] : null;
  const currentLevel = getCurrentLevel();
  const levelProgress = getLevelProgress();

  return (
    <header className="sticky top-0 z-50 bg-gradient-to-r from-primary-500 to-primary-400 text-white shadow-lg">
      <div className="max-w-4xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* 左侧：返回/主页 */}
          <div className="flex items-center gap-2">
            {showBack ? (
              <button
                onClick={() => navigate(-1)}
                className="p-2 rounded-full hover:bg-primary-600 transition-colors"
              >
                <Home className="w-6 h-6" />
              </button>
            ) : (
              <div className="text-xl font-bold flex items-center gap-2">
                <span className="text-2xl">🏠</span>
                <span className="hidden sm:inline">{title || '灯塔英语角'}</span>
                <span className="sm:hidden">灯塔</span>
              </div>
            )}
          </div>

          {/* 中间：标题（如果有） */}
          {title && showBack && (
            <h1 className="text-lg font-bold absolute left-1/2 -translate-x-1/2">
              {title}
            </h1>
          )}

          {/* 右侧：语音性别切换 + 语音开关 + 积分 + 小动物状态 */}
          <div className="flex items-center gap-4">
            {/* 语音性别切换 */}
            {userData.voiceEnabled && <VoiceGenderToggle />}
            
            {/* 语音开关 */}
            <button
              onClick={() => setVoiceEnabled(!userData.voiceEnabled)}
              className={cn(
                'p-2 rounded-full transition-colors',
                userData.voiceEnabled ? 'bg-primary-600' : 'bg-primary-700/50'
              )}
              title={userData.voiceEnabled ? '语音已开启' : '语音已关闭'}
            >
              {userData.voiceEnabled ? (
                <Volume2 className="w-5 h-5" />
              ) : (
                <VolumeX className="w-5 h-5" />
              )}
            </button>

            {/* 积分显示 */}
            <div className="flex items-center gap-1 bg-primary-600 px-3 py-1.5 rounded-full">
              <Star className="w-5 h-5 text-yellow-300 fill-yellow-300" />
              <span className="font-bold text-lg">{userData.points}</span>
            </div>

            {/* 小动物状态 */}
            {currentPet && (
              <button
                onClick={() => navigate('/pet')}
                className="flex items-center gap-2 bg-primary-600 px-3 py-1.5 rounded-full hover:bg-primary-600/80 transition-colors"
              >
                <span className="text-xl">{currentPet.normal}</span>
                <div className="hidden sm:flex flex-col items-start">
                  <span className="text-xs opacity-80">
                    Lv{userData.petLevel} {currentLevel.name}
                  </span>
                  <div className="w-16 h-1.5 bg-primary-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-300 transition-all duration-300"
                      style={{ width: `${levelProgress}%` }}
                    />
                  </div>
                </div>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
