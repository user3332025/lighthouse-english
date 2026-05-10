import { useEffect, useState } from 'react';
import { shuffleArray } from '@/lib/utils';
import { playThinkChime, playWrongPop, resumeAudioContext } from '@/lib/gameSfx';
import { cn } from '@/lib/utils';

const POOL = ['🐰', '🐻', '🐱', '🐶', '🦊', '🐼'];

interface WrongAnswerEncourageOverlayProps {
  open: boolean;
  /** 优先展示的小动物（如用户领养的 normal 表情） */
  petEmoji?: string;
  onDismiss: () => void;
}

/**
 * 选错后不立刻揭示正确答案：全屏依次跳出小动物 + 提示，再让用户重选。
 */
export function WrongAnswerEncourageOverlay({
  open,
  petEmoji,
  onDismiss,
}: WrongAnswerEncourageOverlayProps) {
  const [phase, setPhase] = useState(0);
  const [animals, setAnimals] = useState<string[]>([]);

  useEffect(() => {
    if (!open) {
      setPhase(0);
      return;
    }
    resumeAudioContext();
    const first = petEmoji ?? POOL[Math.floor(Math.random() * POOL.length)];
    const rest = shuffleArray(POOL.filter((e) => e !== first)).slice(0, 2);
    setAnimals([first, ...rest]);
    setPhase(0);

    const ids: ReturnType<typeof setTimeout>[] = [];
    ids.push(
      setTimeout(() => {
        setPhase(1);
        playWrongPop(360);
      }, 100)
    );
    ids.push(
      setTimeout(() => {
        setPhase(2);
        playWrongPop(420);
      }, 900)
    );
    ids.push(
      setTimeout(() => {
        setPhase(3);
        playWrongPop(300);
      }, 1700)
    );
    ids.push(
      setTimeout(() => {
        setPhase(4);
        playThinkChime();
      }, 2500)
    );
    return () => ids.forEach(clearTimeout);
  }, [open, petEmoji]);

  if (!open) return null;

  const visible = animals.slice(0, Math.min(phase, 3));

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="wrong-encourage-title"
    >
      <div className="absolute inset-0 bg-amber-950/35 backdrop-blur-[2px]" aria-hidden />

      <div
        className={cn(
          'relative max-w-md w-full rounded-3xl border-4 border-amber-200 bg-gradient-to-b from-amber-50 to-orange-50',
          'shadow-2xl px-6 py-8 text-center card-pop'
        )}
      >
        <h2 id="wrong-encourage-title" className="text-lg font-bold text-amber-900 mb-2">
          {phase < 4 ? '小伙伴来陪你想一想' : '不着急，再试一次'}
        </h2>
        <p className="text-sm text-amber-800/90 mb-6">
          {phase < 4 ? '看看是谁来给你加油啦～' : '正确答案先不告诉你，动动脑筋再选哦'}
        </p>

        <div className="flex min-h-[140px] flex-wrap items-center justify-center gap-4 mb-6">
          {visible.map((emoji, i) => (
            <span
              key={`${emoji}-${i}`}
              className="text-6xl encourage-pop inline-block select-none"
              style={{ animationDelay: `${i * 80}ms` }}
              aria-hidden
            >
              {emoji}
            </span>
          ))}
        </div>

        {phase >= 4 && (
          <button
            type="button"
            onClick={onDismiss}
            className="w-full py-3 rounded-2xl bg-primary-500 text-white font-bold text-lg shadow-warm hover:bg-primary-600 transition-colors btn-press"
          >
            我知道了，再选一次
          </button>
        )}
      </div>
    </div>
  );
}
