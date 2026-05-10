import { Volume2 } from 'lucide-react';
import { useSpeech } from '@/hooks/useSpeech';
import { resumeAudioContext, unlockAudioFromButtonTap } from '@/lib/gameSfx';
import { useUserData } from '@/hooks/useUserData';
import { cn } from '@/lib/utils';

interface SpeechButtonProps {
  text: string;
  lang?: 'en' | 'zh';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  /** 成功开始朗读后回调（用于「先听再录」等流程） */
  onSpeak?: () => void;
}

export function SpeechButton({
  text,
  lang = 'en',
  size = 'md',
  className,
  onSpeak,
}: SpeechButtonProps) {
  const { speakEnglish, speakChinese, isSupported } = useSpeech();
  const { userData, setVoiceEnabled } = useUserData();

  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
  };

  const handleClick = () => {
    unlockAudioFromButtonTap();
    resumeAudioContext();
    try {
      window.speechSynthesis?.resume?.();
    } catch {
      /* ignore */
    }
    if (!isSupported) {
      alert('抱歉，您的浏览器不支持语音朗读（speechSynthesis）');
      return;
    }
    // 手动点喇叭时自动打开「语音」总开关，避免右上角关掉后这里按钮消失、无法试听
    if (!userData.voiceEnabled) {
      setVoiceEnabled(true);
    }
    if (lang === 'en') {
      speakEnglish(text);
    } else {
      speakChinese(text);
    }
    onSpeak?.();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        'flex items-center justify-center rounded-full',
        'bg-primary-500 hover:bg-primary-600 text-white',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        sizeClasses[size],
        className
      )}
    >
      <Volume2 className={cn(size === 'sm' ? 'w-4 h-4' : 'w-5 h-5')} />
    </button>
  );
}
