import { PetType } from '@/types';

interface PetIconProps {
  type: PetType;
  level: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  mood?: 'normal' | 'happy' | 'excited';
  className?: string;
}

// 宠物等级装饰数据
const PET_DECORATIONS: Record<PetType, Record<number, { emoji: string; decorations: string[]; background: string }>> = {
  dog: {
    1: { 
      emoji: '🐶', 
      decorations: ['✨', '💫'], 
      background: 'from-amber-200 to-yellow-200' 
    },
    2: { 
      emoji: '🐕', 
      decorations: ['✨', '💫', '⭐'], 
      background: 'from-orange-200 to-amber-200' 
    },
    3: { 
      emoji: '🦮', 
      decorations: ['🦴', '✨', '⭐'], 
      background: 'from-pink-200 to-orange-200' 
    },
    4: { 
      emoji: '🐕‍🦺', 
      decorations: ['🎀', '✨', '⭐'], 
      background: 'from-purple-200 to-pink-200' 
    },
    5: { 
      emoji: '🦮', 
      decorations: ['👑', '✨', '⭐', '💫'], 
      background: 'from-amber-300 to-orange-300' 
    },
  },
  cat: {
    1: { 
      emoji: '🐱', 
      decorations: ['✨', '💫'], 
      background: 'from-pink-200 to-purple-200' 
    },
    2: { 
      emoji: '😺', 
      decorations: ['✨', '💫', '🍊'], 
      background: 'from-orange-200 to-yellow-200' 
    },
    3: { 
      emoji: '😸', 
      decorations: ['🐟', '✨', '💫'], 
      background: 'from-pink-200 to-red-200' 
    },
    4: { 
      emoji: '😼', 
      decorations: ['💎', '✨', '💫'], 
      background: 'from-purple-200 to-blue-200' 
    },
    5: { 
      emoji: '😻', 
      decorations: ['🎀', '✨', '💫', '🌟'], 
      background: 'from-pink-300 to-purple-300' 
    },
  },
  rabbit: {
    1: { 
      emoji: '🐰', 
      decorations: ['✨', '💫'], 
      background: 'from-pink-200 to-pink-100' 
    },
    2: { 
      emoji: '🐇', 
      decorations: ['✨', '💫', '🌱'], 
      background: 'from-green-200 to-yellow-200' 
    },
    3: { 
      emoji: '🐰', 
      decorations: ['🥕', '✨', '💫'], 
      background: 'from-orange-200 to-green-200' 
    },
    4: { 
      emoji: '🐇', 
      decorations: ['🌈', '✨', '💫'], 
      background: 'from-blue-200 to-pink-200' 
    },
    5: { 
      emoji: '🐰', 
      decorations: ['🌸', '✨', '💫', '🌷'], 
      background: 'from-pink-300 to-green-200' 
    },
  },
  bear: {
    1: { 
      emoji: '🐻', 
      decorations: ['🍯', '✨'], 
      background: 'from-amber-200 to-yellow-200' 
    },
    2: { 
      emoji: '🧸', 
      decorations: ['🎀', '✨', '💫'], 
      background: 'from-pink-200 to-amber-200' 
    },
    3: { 
      emoji: '🐻', 
      decorations: ['⭐', '✨', '💫'], 
      background: 'from-yellow-200 to-orange-200' 
    },
    4: { 
      emoji: '🐻‍❄️', 
      decorations: ['❄️', '✨', '💎'], 
      background: 'from-blue-200 to-indigo-200' 
    },
    5: { 
      emoji: '🐼', 
      decorations: ['🎋', '✨', '💫', '🌟'], 
      background: 'from-green-200 to-purple-200' 
    },
  },
  fox: {
    1: { 
      emoji: '🦊', 
      decorations: ['✨', '💫'], 
      background: 'from-orange-200 to-red-200' 
    },
    2: { 
      emoji: '🦝', 
      decorations: ['🧣', '✨', '💫'], 
      background: 'from-red-200 to-pink-200' 
    },
    3: { 
      emoji: '🦊', 
      decorations: ['🍂', '✨', '💫'], 
      background: 'from-orange-200 to-yellow-200' 
    },
    4: { 
      emoji: '🦝', 
      decorations: ['🌰', '✨', '💫'], 
      background: 'from-amber-200 to-orange-200' 
    },
    5: { 
      emoji: '🦊', 
      decorations: ['🌸', '✨', '💫', '🌟'], 
      background: 'from-pink-300 to-orange-300' 
    },
  },
};

export function PetIcon({ type, level, size = 'md', mood = 'normal', className = '' }: PetIconProps) {
  const sizeClasses = {
    sm: 'w-16 h-16 text-4xl',
    md: 'w-24 h-24 text-6xl',
    lg: 'w-36 h-36 text-8xl',
    xl: 'w-48 h-48 text-9xl',
  };

  const moodAnimations = {
    normal: '',
    happy: 'animate-bounce',
    excited: 'animate-pulse scale-110',
  };

  const decoration = PET_DECORATIONS[type]?.[level] || PET_DECORATIONS[type]?.[1];

  return (
    <div className={`relative ${className}`}>
      {/* 背景装饰 */}
      <div className={`absolute inset-0 bg-gradient-to-br ${decoration?.background} rounded-full opacity-30 blur-sm`} />
      
      {/* 装饰元素 */}
      <div className="absolute inset-0 pointer-events-none">
        {decoration?.decorations.map((dec, i) => (
          <span
            key={i}
            className="absolute text-2xl animate-float"
            style={{
              left: `${10 + i * 30}%`,
              top: `${10 + i * 25}%`,
              animationDelay: `${i * 0.2}s`,
            }}
          >
            {dec}
          </span>
        ))}
      </div>
      
      {/* 主宠物 */}
      <div className={`
        relative z-10 rounded-full bg-white/90 backdrop-blur-sm shadow-xl
        flex items-center justify-center
        ${sizeClasses[size]} ${moodAnimations[mood]}
        transition-all duration-300
      `}>
        <span className="select-none">
          {decoration?.emoji}
        </span>
      </div>
    </div>
  );
}
