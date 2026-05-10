import { PetType } from '@/types';

interface CSSPetIconProps {
  type: PetType;
  level: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  mood?: 'normal' | 'happy' | 'excited';
  className?: string;
}

// CSS宠物样式数据
const CSS_PET_STYLES: Record<PetType, Record<number, {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  features: string[];
  ears: string;
  tail: string;
}>> = {
  dog: {
    1: {
      primaryColor: '#fbbf24',
      secondaryColor: '#f59e0b',
      accentColor: '#fef3c7',
      features: ['small-eyes', 'round-head'],
      ears: 'floppy',
      tail: 'short',
    },
    2: {
      primaryColor: '#f59e0b',
      secondaryColor: '#d97706',
      accentColor: '#fef3c7',
      features: ['happy-eyes', 'perked-ears'],
      ears: 'perked',
      tail: 'medium',
    },
    3: {
      primaryColor: '#d97706',
      secondaryColor: '#b45309',
      accentColor: '#fef3c7',
      features: ['sparkles', 'bone-accent'],
      ears: 'perked',
      tail: 'medium',
    },
    4: {
      primaryColor: '#b45309',
      secondaryColor: '#92400e',
      accentColor: '#fef3c7',
      features: ['bowtie', 'alert-eyes'],
      ears: 'perked',
      tail: 'long',
    },
    5: {
      primaryColor: '#92400e',
      secondaryColor: '#78350f',
      accentColor: '#fef3c7',
      features: ['crown', 'sparkles', 'golden-glow'],
      ears: 'perked',
      tail: 'long',
    },
  },
  cat: {
    1: {
      primaryColor: '#f472b6',
      secondaryColor: '#db2777',
      accentColor: '#fce7f3',
      features: ['small-eyes', 'round-head'],
      ears: 'pointy',
      tail: 'short',
    },
    2: {
      primaryColor: '#db2777',
      secondaryColor: '#be185d',
      accentColor: '#fce7f3',
      features: ['happy-eyes', 'whiskers'],
      ears: 'pointy',
      tail: 'medium',
    },
    3: {
      primaryColor: '#be185d',
      secondaryColor: '#9d174d',
      accentColor: '#fce7f3',
      features: ['sparkles', 'fish-accent'],
      ears: 'pointy',
      tail: 'medium',
    },
    4: {
      primaryColor: '#9d174d',
      secondaryColor: '#831843',
      accentColor: '#fce7f3',
      features: ['diamond', 'alert-eyes'],
      ears: 'pointy',
      tail: 'long',
    },
    5: {
      primaryColor: '#831843',
      secondaryColor: '#681a42',
      accentColor: '#fce7f3',
      features: ['crown', 'sparkles', 'golden-glow'],
      ears: 'pointy',
      tail: 'long',
    },
  },
  rabbit: {
    1: {
      primaryColor: '#f472b6',
      secondaryColor: '#ec4899',
      accentColor: '#fce7f3',
      features: ['small-eyes', 'fluffy'],
      ears: 'long',
      tail: 'fluffy',
    },
    2: {
      primaryColor: '#ec4899',
      secondaryColor: '#db2777',
      accentColor: '#fce7f3',
      features: ['happy-eyes', 'carrot-accent'],
      ears: 'long',
      tail: 'fluffy',
    },
    3: {
      primaryColor: '#db2777',
      secondaryColor: '#be185d',
      accentColor: '#fce7f3',
      features: ['sparkles', 'eating'],
      ears: 'long',
      tail: 'fluffy',
    },
    4: {
      primaryColor: '#be185d',
      secondaryColor: '#9d174d',
      accentColor: '#fce7f3',
      features: ['rainbow', 'jumping'],
      ears: 'long',
      tail: 'fluffy',
    },
    5: {
      primaryColor: '#9d174d',
      secondaryColor: '#831843',
      accentColor: '#fce7f3',
      features: ['crown', 'sparkles', 'golden-glow', 'flowers'],
      ears: 'long',
      tail: 'fluffy',
    },
  },
  bear: {
    1: {
      primaryColor: '#78350f',
      secondaryColor: '#451a03',
      accentColor: '#fef3c7',
      features: ['small-eyes', 'honey-accent'],
      ears: 'round',
      tail: 'tiny',
    },
    2: {
      primaryColor: '#451a03',
      secondaryColor: '#3f1f0f',
      accentColor: '#fef3c7',
      features: ['happy-eyes', 'bowtie'],
      ears: 'round',
      tail: 'tiny',
    },
    3: {
      primaryColor: '#3f1f0f',
      secondaryColor: '#2d150b',
      accentColor: '#fef3c7',
      features: ['sparkles', 'star-accent'],
      ears: 'round',
      tail: 'tiny',
    },
    4: {
      primaryColor: '#e0e7ff',
      secondaryColor: '#c7d2fe',
      accentColor: '#e0f2fe',
      features: ['snow-accent', 'alert-eyes'],
      ears: 'round',
      tail: 'tiny',
    },
    5: {
      primaryColor: '#1f2937',
      secondaryColor: '#111827',
      accentColor: '#ffffff',
      features: ['crown', 'sparkles', 'golden-glow', 'bamboo-accent'],
      ears: 'round',
      tail: 'tiny',
    },
  },
  fox: {
    1: {
      primaryColor: '#f97316',
      secondaryColor: '#ea580c',
      accentColor: '#fef3c7',
      features: ['small-eyes', 'fluffy-tail'],
      ears: 'pointy',
      tail: 'fluffy',
    },
    2: {
      primaryColor: '#ea580c',
      secondaryColor: '#c2410c',
      accentColor: '#fef3c7',
      features: ['happy-eyes', 'scarf-accent'],
      ears: 'pointy',
      tail: 'fluffy',
    },
    3: {
      primaryColor: '#c2410c',
      secondaryColor: '#9a3412',
      accentColor: '#fef3c7',
      features: ['sparkles', 'leaf-accent'],
      ears: 'pointy',
      tail: 'fluffy',
    },
    4: {
      primaryColor: '#9a3412',
      secondaryColor: '#7c2d12',
      accentColor: '#fef3c7',
      features: ['acorn-accent', 'alert-eyes'],
      ears: 'pointy',
      tail: 'fluffy',
    },
    5: {
      primaryColor: '#7c2d12',
      secondaryColor: '#4c1d95',
      accentColor: '#fef3c7',
      features: ['crown', 'sparkles', 'golden-glow', 'flowers'],
      ears: 'pointy',
      tail: 'fluffy',
    },
  },
};

export function CSSPetIcon({ 
  type, 
  level, 
  size = 'md', 
  mood = 'normal', 
  className = '' 
}: CSSPetIconProps) {
  const sizes = {
    sm: { width: 64, height: 64, scale: 1 },
    md: { width: 96, height: 96, scale: 1.5 },
    lg: { width: 144, height: 144, scale: 2.25 },
    xl: { width: 192, height: 192, scale: 3 },
  };

  const moodAnimations = {
    normal: '',
    happy: 'animate-pulse',
    excited: 'animate-bounce',
  };

  const style = CSS_PET_STYLES[type]?.[level] || CSS_PET_STYLES[type]?.[1];
  const currentSize = sizes[size];

  return (
    <div className={`relative ${className} ${moodAnimations[mood]}`} style={{ width: currentSize.width, height: currentSize.height }}>
      {/* 背景光晕 */}
      <div 
        className="absolute inset-0 rounded-full opacity-50"
        style={{ 
          background: `radial-gradient(circle, ${style.primaryColor}40 0%, transparent 70%)`,
        }}
      />

      {/* 主体CSS绘制 */}
      <svg 
        viewBox="0 0 100 100" 
        className="w-full h-full"
      >
        {/* 耳朵 */}
        <g transform="translate(15, 10)">
          <ellipse 
            cx="15" cy="15" rx="12" ry="20" 
            fill={style.primaryColor}
          />
          <ellipse 
            cx="85" cy="15" rx="12" ry="20" 
            fill={style.primaryColor}
          />
        </g>

        {/* 头部 */}
        <ellipse 
          cx="50" cy="50" rx="35" ry="30"
          fill={style.primaryColor}
          stroke={style.secondaryColor}
          strokeWidth="2"
        />

        {/* 脸部白色区域 */}
        <ellipse 
          cx="50" cy="55" rx="20" ry="15"
          fill={style.accentColor}
        />

        {/* 眼睛 */}
        <g>
          <ellipse cx="40" cy="45" rx="6" ry="8" fill="#1f2937" />
          <ellipse cx="60" cy="45" rx="6" ry="8" fill="#1f2937" />
          
          {/* 瞳孔高光 */}
          <circle cx="38" cy="42" r="2" fill="white" />
          <circle cx="58" cy="42" r="2" fill="white" />
        </g>

        {/* 鼻子 */}
        <ellipse cx="50" cy="58" rx="4" ry="3" fill="#1f2937" />

        {/* 嘴巴 */}
        <path d="M 45 62 Q 50 68 55 62" stroke="#1f2937" strokeWidth="2" fill="none" />

        {/* 腮红 */}
        <ellipse cx="30" cy="55" rx="8" ry="5" fill="#fca5a5" opacity="0.6" />
        <ellipse cx="70" cy="55" rx="8" ry="5" fill="#fca5a5" opacity="0.6" />

        {/* 身体 */}
        <ellipse 
          cx="50" cy="85" rx="28" ry="20"
          fill={style.primaryColor}
          stroke={style.secondaryColor}
          strokeWidth="2"
        />

        {/* 装饰元素 */}
        {style.features.includes('sparkles') && (
          <g>
            <text x="25" y="25" fontSize="12" textAnchor="middle" className="animate-pulse">✨</text>
            <text x="75" y="25" fontSize="12" textAnchor="middle" className="animate-pulse">✨</text>
          </g>
        )}
        {style.features.includes('crown') && (
          <text x="50" y="18" fontSize="20" textAnchor="middle" className="animate-bounce">👑</text>
        )}
        {style.features.includes('bone-accent') && (
          <text x="85" y="50" fontSize="14" textAnchor="middle">🦴</text>
        )}
        {style.features.includes('fish-accent') && (
          <text x="85" y="50" fontSize="14" textAnchor="middle">🐟</text>
        )}
        {style.features.includes('carrot-accent') && (
          <text x="85" y="50" fontSize="14" textAnchor="middle">🥕</text>
        )}
        {style.features.includes('honey-accent') && (
          <text x="85" y="50" fontSize="14" textAnchor="middle">🍯</text>
        )}
        {style.features.includes('leaf-accent') && (
          <text x="85" y="50" fontSize="14" textAnchor="middle">🍂</text>
        )}
        {style.features.includes('golden-glow') && (
          <circle cx="50" cy="50" r="45" fill="none" stroke="#fbbf24" strokeWidth="3" opacity="0.4" />
        )}
      </svg>
    </div>
  );
}
