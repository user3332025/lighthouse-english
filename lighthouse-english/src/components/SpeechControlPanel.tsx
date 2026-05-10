import { cn } from '@/lib/utils';
import { SpeechButton } from './SpeechButton';
import { RecordButton } from './RecordButton';

interface SpeechControlPanelProps {
  speechText?: string;
  speechLang?: 'en' | 'zh';
  recordTargetText?: string;
  showSpeech?: boolean;
  showRecord?: boolean;
  recordDisabled?: boolean;
  recordSize?: 'sm' | 'md' | 'lg';
  speechSize?: 'sm' | 'md' | 'lg';
  feedbackStyle?: 'score' | 'encouragement';
  onScoreChange?: (score: number) => void;
  onEncouragement?: (tier: 'excellent' | 'well' | 'good' | 'retry') => void;
  onNext?: () => void;
  onRecordReset?: () => void;
  className?: string;
  layout?: 'horizontal' | 'vertical';
  gap?: 'sm' | 'md' | 'lg';
}

export function SpeechControlPanel({
  speechText = '',
  speechLang = 'en',
  recordTargetText = '',
  showSpeech = true,
  showRecord = true,
  recordDisabled = false,
  recordSize = 'md',
  speechSize = 'md',
  feedbackStyle = 'score',
  onScoreChange,
  onEncouragement,
  onNext,
  onRecordReset,
  className,
  layout = 'horizontal',
  gap = 'md',
}: SpeechControlPanelProps) {
  const gapClasses = {
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
  };

  const controlButtons = [];

  if (showSpeech && speechText) {
    controlButtons.push(
      <div key="speech" className="flex flex-col items-center">
        <SpeechButton
          text={speechText}
          lang={speechLang}
          size={speechSize}
          className="shadow-md"
        />
        <span className="mt-1 text-xs text-gray-500 text-center">听发音</span>
      </div>
    );
  }

  if (showRecord && recordTargetText) {
    controlButtons.push(
      <div key="record" className="flex flex-col items-center">
        <RecordButton
          targetText={recordTargetText}
          size={recordSize}
          feedbackStyle={feedbackStyle}
          onScoreChange={onScoreChange}
          onEncouragement={onEncouragement}
          onNext={onNext}
          recordDisabled={recordDisabled}
          onRecordReset={onRecordReset}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex items-center',
        layout === 'vertical' ? 'flex-col' : 'flex-row',
        gapClasses[gap],
        className
      )}
    >
      {controlButtons}
    </div>
  );
}