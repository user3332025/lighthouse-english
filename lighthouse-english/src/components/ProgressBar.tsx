interface ProgressBarProps {
  current: number;
  total: number;
  score?: number;
  showScore?: boolean;
}

export function ProgressBar({ current, total }: ProgressBarProps) {
  const progress = (current / total) * 100;

  return (
    <div className="w-full bg-orange-100 rounded-full h-4 overflow-hidden shadow-inner">
      <div
        className="h-full bg-gradient-to-r from-primary-400 to-primary-500 rounded-full transition-all duration-500 progress-bar"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

interface GameHeaderProps {
  currentQuestion: number;
  totalQuestions: number;
  score: number;
  showScore?: boolean;
  onQuit?: () => void;
}

export function GameHeader({ currentQuestion, totalQuestions, score, showScore = false, onQuit }: GameHeaderProps) {
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-warm">
      <div className="flex items-center justify-between gap-4">
        {/* 退出按钮 */}
        {onQuit && (
          <button
            onClick={onQuit}
            className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 rounded-full text-gray-700 font-medium transition-colors"
          >
            退出
          </button>
        )}

        {/* 进度条 */}
        <div className="flex-1">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>题目 {currentQuestion}/{totalQuestions}</span>
            {showScore && <span className="font-bold text-primary-600">得分: {score}</span>}
          </div>
          <ProgressBar current={currentQuestion} total={totalQuestions} />
        </div>
      </div>
    </div>
  );
}
