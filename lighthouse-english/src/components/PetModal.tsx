import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useUserData } from '@/hooks/useUserData';
import { getRandomEncouragement, getLevelUpMessage } from '@/lib/utils';

interface PetModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'encourage' | 'correct' | 'levelup';
  petType?: string;
  newLevel?: number;
  /** 升级弹窗可选：展示上一级 */
  previousLevel?: number;
}

export function PetModal({
  isOpen,
  onClose,
  type,
  petType = 'dog',
  newLevel,
  previousLevel,
}: PetModalProps) {
  const [showContent, setShowContent] = useState(false);
  const { PET_FACES } = useUserData();

  const pet = PET_FACES[petType as keyof typeof PET_FACES] || PET_FACES.dog;

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setShowContent(true), 50);
    } else {
      setShowContent(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const getContent = () => {
    switch (type) {
      case 'encourage':
        return {
          emoji: pet.hungry,
          message: getRandomEncouragement(),
          bgColor: 'bg-orange-100',
          borderColor: 'border-orange-300',
        };
      case 'correct':
        return {
          emoji: pet.happy,
          message: '太棒了！回答正确！🎉',
          bgColor: 'bg-green-100',
          borderColor: 'border-green-300',
        };
      case 'levelup':
        return {
          emoji: '⭐',
          message: getLevelUpMessage(petType),
          bgColor: 'bg-yellow-100',
          borderColor: 'border-yellow-400',
        };
      default:
        return {
          emoji: pet.normal,
          message: '',
          bgColor: 'bg-orange-100',
          borderColor: 'border-orange-300',
        };
    }
  };

  const content = getContent();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 背景遮罩 */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* 弹窗内容 */}
      <div
        className={`
          relative ${content.bgColor} ${content.borderColor} border-4
          rounded-3xl p-6 max-w-sm w-full
          transform transition-all duration-300
          ${showContent ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}
          ${type === 'levelup' ? 'level-up' : 'card-pop'}
        `}
      >
        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 p-2 rounded-full hover:bg-black/10 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        {/* 小动物 */}
        <div className="text-center">
          <div className={`
            text-7xl mb-4 inline-block
            ${type === 'encourage' ? 'animate-bounce' : ''}
            ${type === 'correct' ? 'animate-pulse' : ''}
            ${type === 'levelup' ? 'pet-bounce' : ''}
          `}>
            {content.emoji}
          </div>

          {/* 消息文字 */}
          <p className="text-xl font-bold text-gray-800 leading-relaxed">
            {content.message}
          </p>

          {/* 等级升级特殊显示 */}
          {type === 'levelup' && newLevel && (
            <div className="mt-4 space-y-1">
              {previousLevel != null && previousLevel > 0 && (
                <p className="text-sm text-gray-600">
                  Lv{previousLevel} → Lv{newLevel}
                </p>
              )}
              <span className="inline-block bg-yellow-400 text-yellow-900 px-4 py-2 rounded-full font-bold text-lg">
                等级提升到 Lv{newLevel}！
              </span>
            </div>
          )}

          {/* 继续按钮 */}
          {type !== 'levelup' && (
            <button
              onClick={onClose}
              className="mt-4 px-6 py-2 bg-primary-500 text-white font-bold rounded-full
                         hover:bg-primary-600 transition-colors btn-press shadow-warm"
            >
              继续加油！
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
