import { useId } from 'react';
import { PetType } from '@/types';

interface CSSPetIconProps {
  type: PetType;
  level: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  mood?: 'normal' | 'happy' | 'excited';
  className?: string;
}

/** 单等级宠物的配色与特征（与绘制逻辑共用） */
type PetLevelStyle = {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  features: string[];
  ears: string;
  tail: string;
};

// CSS宠物样式数据
const CSS_PET_STYLES: Record<PetType, Record<number, PetLevelStyle>> = {
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

/** 眼睛（开心时为弯线眼，否则为大眼） */
function FaceEyes({
  style,
  mood,
  snoutOffsetY = 0,
}: {
  style: PetLevelStyle;
  mood: 'normal' | 'happy' | 'excited';
  snoutOffsetY?: number;
}) {
  const { features } = style;
  const happyShape = features.includes('happy-eyes') || mood === 'happy' || mood === 'excited';
  const small = features.includes('small-eyes');
  const alertEyes = features.includes('alert-eyes');
  const rx = small ? 4 : alertEyes ? 7 : 5;
  const ry = small ? 6 : alertEyes ? 9 : 7;
  const y = 44 + snoutOffsetY;

  if (happyShape) {
    return (
      <g>
        <path
          d={`M 34 ${y + 2} Q 40 ${y - 4} 46 ${y + 2}`}
          stroke="#1f2937"
          strokeWidth="2.2"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d={`M 54 ${y + 2} Q 60 ${y - 4} 66 ${y + 2}`}
          stroke="#1f2937"
          strokeWidth="2.2"
          fill="none"
          strokeLinecap="round"
        />
      </g>
    );
  }

  const pupilBoost = mood === 'excited' ? 1.2 : 1;
  return (
    <g>
      <ellipse cx="40" cy={y} rx={rx * pupilBoost} ry={ry * pupilBoost} fill="#1f2937" />
      <ellipse cx="60" cy={y} rx={rx * pupilBoost} ry={ry * pupilBoost} fill="#1f2937" />
      <circle cx="37" cy={y - 2} r="2" fill="white" />
      <circle cx="57" cy={y - 2} r="2" fill="white" />
      {mood === 'excited' && (
        <>
          <circle cx="42" cy={y + 2} r="1.2" fill="white" opacity={0.9} />
          <circle cx="62" cy={y + 2} r="1.2" fill="white" opacity={0.9} />
        </>
      )}
    </g>
  );
}

/** 嘴部曲线（开心时弧度更大） */
function FaceMouth({
  style,
  mood,
  snoutOffsetY = 0,
}: {
  style: PetLevelStyle;
  mood: 'normal' | 'happy' | 'excited';
  snoutOffsetY?: number;
}) {
  const { features } = style;
  const happyShape = features.includes('happy-eyes') || mood === 'happy' || mood === 'excited';
  const mouthY = 60 + snoutOffsetY;
  if (happyShape) {
    return (
      <path
        d={`M 44 ${mouthY} Q 50 ${mouthY + 7} 56 ${mouthY}`}
        stroke="#1f2937"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
    );
  }
  return (
    <path
      d={`M 45 ${mouthY} Q 50 ${mouthY + 5} 55 ${mouthY}`}
      stroke="#1f2937"
      strokeWidth="1.8"
      fill="none"
      strokeLinecap="round"
    />
  );
}

/** 腮红 */
function Cheeks({ y = 54 }: { y?: number }) {
  return (
    <g>
      <ellipse cx="28" cy={y} rx="7" ry="4.5" fill="#fca5a5" opacity={0.55} />
      <ellipse cx="72" cy={y} rx="7" ry="4.5" fill="#fca5a5" opacity={0.55} />
    </g>
  );
}

/** 胡须（猫） */
function Whiskers({ y = 52 }: { y?: number }) {
  return (
    <g stroke="#374151" strokeWidth="1.2" strokeLinecap="round" opacity={0.65}>
      <path d={`M 22 ${y - 2} L 8 ${y - 6}`} />
      <path d={`M 22 ${y + 2} L 6 ${y + 2}`} />
      <path d={`M 22 ${y + 6} L 10 ${y + 10}`} />
      <path d={`M 78 ${y - 2} L 92 ${y - 6}`} />
      <path d={`M 78 ${y + 2} L 94 ${y + 2}`} />
      <path d={`M 78 ${y + 6} L 90 ${y + 10}`} />
    </g>
  );
}

/** 尾巴：按类型与 tail 字段 */
function PetTail({ type, style }: { type: PetType; style: PetLevelStyle }) {
  const { primaryColor, secondaryColor, tail } = style;
  const stroke = secondaryColor;

  if (type === 'rabbit') {
    return (
      <ellipse cx="82" cy="78" rx="9" ry="8" fill={primaryColor} stroke={stroke} strokeWidth="1.5" />
    );
  }

  if (type === 'bear') {
    return (
      <circle cx="78" cy="82" r="4" fill={primaryColor} stroke={stroke} strokeWidth="1.2" />
    );
  }

  if (type === 'fox' || (type === 'dog' && tail === 'fluffy')) {
    return (
      <path
        d="M 78 72 Q 95 58 92 40 Q 88 52 80 60 Q 74 68 78 72 Z"
        fill={primaryColor}
        stroke={stroke}
        strokeWidth="1.8"
      />
    );
  }

  if (type === 'cat') {
    if (tail === 'short') {
      return <path d="M 72 80 Q 82 88 88 82" stroke={stroke} strokeWidth="5" fill="none" strokeLinecap="round" />;
    }
    if (tail === 'medium') {
      return (
        <path
          d="M 70 82 Q 85 92 92 78 Q 88 70 82 76"
          stroke={stroke}
          strokeWidth="5"
          fill="none"
          strokeLinecap="round"
        />
      );
    }
    return (
      <path
        d="M 68 84 Q 88 96 94 72 Q 90 62 84 70 Q 78 78 72 82"
        stroke={stroke}
        strokeWidth="5"
        fill="none"
        strokeLinecap="round"
      />
    );
  }

  // dog
  if (tail === 'short') {
    return (
      <path
        d="M 74 78 Q 88 72 90 60"
        stroke={primaryColor}
        strokeWidth="8"
        fill="none"
        strokeLinecap="round"
      />
    );
  }
  if (tail === 'medium') {
    return (
      <path
        d="M 72 80 Q 86 70 92 52 Q 88 48 84 56"
        stroke={primaryColor}
        strokeWidth="8"
        fill="none"
        strokeLinecap="round"
      />
    );
  }
  return (
    <path
      d="M 70 82 Q 88 68 94 44 Q 96 36 88 42 Q 82 52 76 62 Q 72 72 70 82"
      stroke={primaryColor}
      strokeWidth="7"
      fill="none"
      strokeLinecap="round"
    />
  );
}

/** 狐狸尾尖白毛 */
function FoxTailTip({ style }: { style: PetLevelStyle }) {
  return (
    <path
      d="M 88 42 Q 91 38 89 44 Q 87 48 85 46 Z"
      fill={style.accentColor}
      opacity={0.95}
    />
  );
}

/** 装饰：统一用矢量，避免 emoji 字体不一致 */
function FeatureDecorations({
  type,
  style,
  rainbowGradientId,
}: {
  type: PetType;
  style: PetLevelStyle;
  rainbowGradientId: string;
}) {
  const f = style.features;
  const accent = style.accentColor;

  return (
    <g>
      {f.includes('sparkles') && (
        <g fill="#fbbf24" className="animate-pulse">
          <path d="M 18 22 L 20 26 L 24 26 L 21 29 L 22 34 L 18 31 L 14 34 L 15 29 L 12 26 L 16 26 Z" />
          <path d="M 82 24 L 83 27 L 86 27 L 84 29 L 85 32 L 82 30 L 79 32 L 80 29 L 78 27 L 81 27 Z" />
        </g>
      )}
      {f.includes('crown') && (
        <g className="animate-bounce">
          <path
            d="M 38 14 L 42 22 L 50 12 L 58 22 L 62 14 L 65 26 L 35 26 Z"
            fill="#fbbf24"
            stroke="#d97706"
            strokeWidth="1.2"
          />
          <circle cx="42" cy="22" r="2" fill="#fef3c7" />
          <circle cx="50" cy="18" r="2" fill="#fef3c7" />
          <circle cx="58" cy="22" r="2" fill="#fef3c7" />
        </g>
      )}
      {f.includes('golden-glow') && (
        <circle cx="50" cy="52" r="44" fill="none" stroke="#fbbf24" strokeWidth="2.5" opacity={0.35} />
      )}
      {f.includes('bone-accent') && (
        <g transform="translate(78, 44)">
          <ellipse cx="0" cy="0" rx="10" ry="5" fill={accent} stroke="#92400e" strokeWidth="1" />
          <circle cx="-7" cy="0" r="3.5" fill={accent} stroke="#92400e" strokeWidth="0.8" />
          <circle cx="7" cy="0" r="3.5" fill={accent} stroke="#92400e" strokeWidth="0.8" />
        </g>
      )}
      {f.includes('fish-accent') && (
        <g transform="translate(82, 46)">
          <ellipse cx="0" cy="0" rx="12" ry="7" fill="#60a5fa" stroke="#1d4ed8" strokeWidth="1" />
          <path d="M -12 0 L -18 -4 L -18 4 Z" fill="#93c5fd" />
          <circle cx="5" cy="-2" r="2" fill="#1e293b" />
        </g>
      )}
      {f.includes('carrot-accent') && (
        <g transform="translate(84, 48) rotate(25)">
          <path d="M 0 -12 L 4 8 L -4 8 Z" fill="#fb923c" stroke="#c2410c" strokeWidth="1" />
          <path d="M 0 -12 L -2 -16 M 0 -12 L 2 -16 M 0 -12 L 0 -17" stroke="#16a34a" strokeWidth="1.5" />
        </g>
      )}
      {f.includes('honey-accent') && (
        <g transform="translate(82, 46)">
          <rect x="-8" y="-10" width="16" height="18" rx="3" fill="#fbbf24" stroke="#b45309" strokeWidth="1" />
          <ellipse cx="0" cy="-10" rx="8" ry="3" fill="#fde68a" stroke="#b45309" strokeWidth="0.8" />
        </g>
      )}
      {f.includes('leaf-accent') && (
        <path
          d="M 86 40 Q 94 36 92 48 Q 88 46 86 40"
          fill="#84cc16"
          stroke="#3f6212"
          strokeWidth="0.8"
        />
      )}
      {f.includes('bowtie') && (
        <g transform="translate(50, 76)">
          <path d="M 0 0 L -12 -6 L -12 6 Z" fill="#dc2626" stroke="#991b1b" strokeWidth="0.8" />
          <path d="M 0 0 L 12 -6 L 12 6 Z" fill="#dc2626" stroke="#991b1b" strokeWidth="0.8" />
          <circle cx="0" cy="0" r="3" fill="#b91c1c" />
        </g>
      )}
      {f.includes('diamond') && (
        <path d="M 50 22 L 54 28 L 50 34 L 46 28 Z" fill="#38bdf8" stroke="#0369a1" strokeWidth="0.8" />
      )}
      {f.includes('star-accent') && (
        <path
          d="M 84 38 L 86 44 L 92 44 L 87 48 L 89 54 L 84 50 L 79 54 L 81 48 L 76 44 L 82 44 Z"
          fill="#fde047"
          stroke="#ca8a04"
          strokeWidth="0.6"
        />
      )}
      {f.includes('snow-accent') && (
        <>
          <ellipse cx="38" cy="48" rx="12" ry="10" fill="#ffffff" opacity={0.85} />
          <ellipse cx="62" cy="50" rx="10" ry="9" fill="#ffffff" opacity={0.85} />
        </>
      )}
      {f.includes('bamboo-accent') && (
        <g stroke="#15803d" strokeWidth="2" strokeLinecap="round">
          <path d="M 88 30 L 88 52" />
          <path d="M 85 36 L 91 36 M 85 44 L 91 44" strokeWidth="1.5" />
        </g>
      )}
      {f.includes('scarf-accent') && (
        <path
          d="M 32 72 Q 50 80 68 72 L 68 78 Q 50 86 32 78 Z"
          fill="#dc2626"
          stroke="#991b1b"
          strokeWidth="1"
        />
      )}
      {f.includes('acorn-accent') && (
        <g transform="translate(84, 42)">
          <ellipse cx="0" cy="6" rx="7" ry="9" fill="#92400e" stroke="#451a03" strokeWidth="0.8" />
          <path d="M -5 0 Q 0 -6 5 0 Z" fill="#78350f" />
        </g>
      )}
      {f.includes('rainbow') && (
        <path
          d="M 10 88 Q 50 52 90 88"
          fill="none"
          stroke={`url(#${rainbowGradientId})`}
          strokeWidth="4"
          opacity={0.55}
          strokeLinecap="round"
        />
      )}
      {f.includes('flowers') && (
        <g>
          {[28, 72].map((cx, i) => (
            <g key={i} transform={`translate(${cx}, 14)`}>
              <circle cx="0" cy="0" r="3" fill="#f472b6" />
              <circle cx="-4" cy="-3" r="2.5" fill="#fbcfe8" />
              <circle cx="4" cy="-3" r="2.5" fill="#fbcfe8" />
              <circle cx="-4" cy="3" r="2.5" fill="#fbcfe8" />
              <circle cx="4" cy="3" r="2.5" fill="#fbcfe8" />
            </g>
          ))}
        </g>
      )}
      {f.includes('eating') && type === 'rabbit' && (
        <ellipse cx="78" cy="54" rx="5" ry="3" fill="#fb923c" opacity={0.9} />
      )}
      {f.includes('jumping') && type === 'rabbit' && (
        <ellipse cx="48" cy="94" rx="14" ry="5" fill="#000" opacity={0.08} />
      )}
    </g>
  );
}

/** 狗：垂耳 / 立耳、口吻 */
function DogBody({ style, mood }: { style: PetLevelStyle; mood: 'normal' | 'happy' | 'excited' }) {
  const { primaryColor, secondaryColor, ears } = style;
  const perked = ears === 'perked' || style.features.includes('perked-ears');

  return (
    <g>
      <PetTail type="dog" style={style} />
      <ellipse cx="50" cy="84" rx="26" ry="18" fill={primaryColor} stroke={secondaryColor} strokeWidth="2" />
      {!perked ? (
        <g>
          <ellipse cx="22" cy="38" rx="14" ry="18" fill={primaryColor} stroke={secondaryColor} strokeWidth="1.5" transform="rotate(-25 22 38)" />
          <ellipse cx="78" cy="38" rx="14" ry="18" fill={primaryColor} stroke={secondaryColor} strokeWidth="1.5" transform="rotate(25 78 38)" />
        </g>
      ) : (
        <g>
          <path d="M 28 22 L 22 8 L 38 18 Z" fill={primaryColor} stroke={secondaryColor} strokeWidth="1.5" />
          <path d="M 72 22 L 78 8 L 62 18 Z" fill={primaryColor} stroke={secondaryColor} strokeWidth="1.5" />
        </g>
      )}
      <ellipse cx="50" cy="48" rx="32" ry="28" fill={primaryColor} stroke={secondaryColor} strokeWidth="2" />
      <ellipse cx="50" cy="52" rx="18" ry="14" fill={style.accentColor} />
      <ellipse cx="50" cy="56" rx="14" ry="10" fill={style.accentColor} opacity={0.65} />
      <FaceEyes style={style} mood={mood} snoutOffsetY={2} />
      <ellipse cx="50" cy="56" rx="5.5" ry="4.5" fill="#1f2937" />
      <FaceMouth style={style} mood={mood} snoutOffsetY={2} />
      <Cheeks y={56} />
    </g>
  );
}

/** 猫：三角耳内耳粉、可选胡须 */
function CatBody({ style, mood }: { style: PetLevelStyle; mood: 'normal' | 'happy' | 'excited' }) {
  const { primaryColor, secondaryColor } = style;
  return (
    <g>
      <PetTail type="cat" style={style} />
      <ellipse cx="50" cy="84" rx="24" ry="17" fill={primaryColor} stroke={secondaryColor} strokeWidth="2" />
      <path d="M 26 20 L 34 8 L 40 22 Z" fill={primaryColor} stroke={secondaryColor} strokeWidth="1.5" />
      <path d="M 30 18 L 34 12 L 36 20 Z" fill="#fda4af" opacity={0.9} />
      <path d="M 74 20 L 66 8 L 60 22 Z" fill={primaryColor} stroke={secondaryColor} strokeWidth="1.5" />
      <path d="M 70 18 L 66 12 L 64 20 Z" fill="#fda4af" opacity={0.9} />
      <ellipse cx="50" cy="48" rx="30" ry="27" fill={primaryColor} stroke={secondaryColor} strokeWidth="2" />
      <ellipse cx="50" cy="54" rx="17" ry="13" fill={style.accentColor} />
      <FaceEyes style={style} mood={mood} />
      <ellipse cx="50" cy="56" rx="4" ry="3.5" fill="#fb7185" />
      <FaceMouth style={style} mood={mood} />
      {style.features.includes('whiskers') && <Whiskers />}
      <Cheeks />
    </g>
  );
}

/** 兔：长耳、圆鼻点 */
function RabbitBody({ style, mood }: { style: PetLevelStyle; mood: 'normal' | 'happy' | 'excited' }) {
  const { primaryColor, secondaryColor } = style;
  const jump = style.features.includes('jumping');
  const gTransform = jump ? 'rotate(-8 50 50) translate(0 -4)' : '';

  return (
    <g transform={gTransform}>
      <PetTail type="rabbit" style={style} />
      <ellipse cx="34" cy="18" rx="8" ry="22" fill={primaryColor} stroke={secondaryColor} strokeWidth="1.5" />
      <ellipse cx="38" cy="20" rx="4" ry="14" fill={style.accentColor} opacity={0.85} />
      <ellipse cx="66" cy="18" rx="8" ry="22" fill={primaryColor} stroke={secondaryColor} strokeWidth="1.5" />
      <ellipse cx="62" cy="20" rx="4" ry="14" fill={style.accentColor} opacity={0.85} />
      <ellipse cx="50" cy="84" rx="22" ry="16" fill={primaryColor} stroke={secondaryColor} strokeWidth="2" />
      <ellipse cx="50" cy="50" rx="28" ry="26" fill={primaryColor} stroke={secondaryColor} strokeWidth="2" />
      {style.features.includes('fluffy') && (
        <>
          <circle cx="26" cy="52" r="6" fill={primaryColor} opacity={0.9} />
          <circle cx="74" cy="52" r="6" fill={primaryColor} opacity={0.9} />
        </>
      )}
      <ellipse cx="50" cy="54" rx="16" ry="13" fill={style.accentColor} />
      <FaceEyes style={style} mood={mood} snoutOffsetY={1} />
      <circle cx="50" cy="57" r="3.5" fill="#fb7185" />
      <FaceMouth style={style} mood={mood} snoutOffsetY={1} />
      <Cheeks y={56} />
    </g>
  );
}

/** 熊：圆耳、宽脸 */
function BearBody({ style, mood }: { style: PetLevelStyle; mood: 'normal' | 'happy' | 'excited' }) {
  const { primaryColor, secondaryColor } = style;
  return (
    <g>
      <PetTail type="bear" style={style} />
      <ellipse cx="50" cy="86" rx="28" ry="19" fill={primaryColor} stroke={secondaryColor} strokeWidth="2" />
      <circle cx="22" cy="28" r="12" fill={primaryColor} stroke={secondaryColor} strokeWidth="1.5" />
      <circle cx="78" cy="28" r="12" fill={primaryColor} stroke={secondaryColor} strokeWidth="1.5" />
      <circle cx="22" cy="28" r="6" fill={style.accentColor} opacity={0.75} />
      <circle cx="78" cy="28" r="6" fill={style.accentColor} opacity={0.75} />
      <ellipse cx="50" cy="50" rx="34" ry="30" fill={primaryColor} stroke={secondaryColor} strokeWidth="2" />
      <ellipse cx="50" cy="56" rx="20" ry="16" fill={style.accentColor} />
      <FaceEyes style={style} mood={mood} snoutOffsetY={4} />
      <ellipse cx="50" cy="59" rx="5" ry="4" fill="#1f2937" />
      <FaceMouth style={style} mood={mood} snoutOffsetY={4} />
      <Cheeks y={58} />
    </g>
  );
}

/** 狐狸：尖耳黑尖、白面颊、大尾 */
function FoxBody({ style, mood }: { style: PetLevelStyle; mood: 'normal' | 'happy' | 'excited' }) {
  const { primaryColor, secondaryColor } = style;
  return (
    <g>
      <PetTail type="fox" style={style} />
      <FoxTailTip style={style} />
      <ellipse cx="50" cy="82" rx="22" ry="15" fill={primaryColor} stroke={secondaryColor} strokeWidth="2" />
      <path d="M 28 24 L 34 10 L 42 26 Z" fill={primaryColor} stroke={secondaryColor} strokeWidth="1.5" />
      <path d="M 34 14 L 38 22 L 32 22 Z" fill="#1f2937" opacity={0.85} />
      <path d="M 72 24 L 66 10 L 58 26 Z" fill={primaryColor} stroke={secondaryColor} strokeWidth="1.5" />
      <path d="M 66 14 L 62 22 L 68 22 Z" fill="#1f2937" opacity={0.85} />
      <ellipse cx="50" cy="48" rx="27" ry="24" fill={primaryColor} stroke={secondaryColor} strokeWidth="2" />
      <path d="M 28 48 Q 34 40 38 52 Q 34 58 28 52 Z" fill={style.accentColor} opacity={0.95} />
      <path d="M 72 48 Q 66 40 62 52 Q 66 58 72 52 Z" fill={style.accentColor} opacity={0.95} />
      <FaceEyes style={style} mood={mood} snoutOffsetY={3} />
      <path d="M 44 54 L 50 63 L 56 54 Z" fill="#1f2937" />
      <FaceMouth style={style} mood={mood} snoutOffsetY={3} />
      <Cheeks y={55} />
    </g>
  );
}

function PetSvgLayers({
  type,
  style,
  mood,
}: {
  type: PetType;
  style: PetLevelStyle;
  mood: 'normal' | 'happy' | 'excited';
}) {
  switch (type) {
    case 'dog':
      return <DogBody style={style} mood={mood} />;
    case 'cat':
      return <CatBody style={style} mood={mood} />;
    case 'rabbit':
      return <RabbitBody style={style} mood={mood} />;
    case 'bear':
      return <BearBody style={style} mood={mood} />;
    case 'fox':
      return <FoxBody style={style} mood={mood} />;
    default:
      return <DogBody style={style} mood={mood} />;
  }
}

export function CSSPetIcon({
  type,
  level,
  size = 'md',
  mood = 'normal',
  className = '',
}: CSSPetIconProps) {
  const rainbowId = useId().replace(/:/g, '');
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
    <div
      className={`relative ${className} ${moodAnimations[mood]}`}
      style={{ width: currentSize.width, height: currentSize.height }}
    >
      {/* 多层光晕背景 */}
      <div className="absolute inset-0 rounded-full">
        <div
          className="absolute inset-[-20%] rounded-full opacity-40 animate-pulse"
          style={{
            background: `radial-gradient(circle, ${style.primaryColor}20 0%, transparent 60%)`,
            animationDuration: '3s',
          }}
        />
        <div
          className="absolute inset-[-8%] rounded-full opacity-50"
          style={{
            background: `radial-gradient(circle, ${style.primaryColor}35 0%, ${style.secondaryColor}15 40%, transparent 70%)`,
          }}
        />
        <div
          className="absolute inset-[10%] rounded-full opacity-60"
          style={{
            background: `radial-gradient(circle at 40% 35%, ${style.accentColor}50 0%, ${style.primaryColor}20 50%, transparent 70%)`,
          }}
        />
        <div
          className="absolute inset-0 rounded-full opacity-30"
          style={{
            background: `radial-gradient(ellipse 80% 40% at 50% 85%, ${style.secondaryColor}25 0%, transparent 70%)`,
          }}
        />
      </div>

      <svg viewBox="0 0 100 100" className="w-full h-full">
        <defs>
          <linearGradient id={rainbowId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="33%" stopColor="#fbbf24" />
            <stop offset="66%" stopColor="#22c55e" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
        </defs>
        <PetSvgLayers type={type} style={style} mood={mood} />
        <FeatureDecorations type={type} style={style} rainbowGradientId={rainbowId} />
      </svg>
    </div>
  );
}
