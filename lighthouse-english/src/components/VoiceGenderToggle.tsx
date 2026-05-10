import { useSpeech } from '@/hooks/useSpeech';
import { cn } from '@/lib/utils';

export function VoiceGenderToggle() {
  const { voiceGender, toggleVoiceGender } = useSpeech();

  return (
    <button
      onClick={toggleVoiceGender}
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-full',
        'transition-all duration-300',
        voiceGender === 'female'
          ? 'bg-pink-100 text-pink-700 hover:bg-pink-200'
          : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
      )}
    >
      <span className="text-lg">
        {voiceGender === 'female' ? '👩' : '👨'}
      </span>
      <span className="text-sm font-medium">
        {voiceGender === 'female' ? '女声' : '男声'}
      </span>
    </button>
  );
}
