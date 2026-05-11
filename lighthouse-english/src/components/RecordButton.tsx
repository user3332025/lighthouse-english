/* eslint-disable @typescript-eslint/no-explicit-any -- Web Speech API 各浏览器类型不完整 */
import { useState, useRef } from 'react';
import { Mic, StopCircle, ArrowRight } from 'lucide-react';
import { cn, calculateSimilarity } from '@/lib/utils';
import { unlockAudioFromButtonTap } from '@/lib/gameSfx';

/** 鼓励模式下的等级（不展示分数） */
export type EncouragementTier = 'excellent' | 'well' | 'good' | 'retry';

interface RecordButtonProps {
  targetText: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  /** 默认 'score'：显示分数；'encouragement'：仅 Good / Well done / Excellent 等鼓励语 */
  feedbackStyle?: 'score' | 'encouragement';
  onScoreChange?: (score: number) => void;
  /** 仅在 feedbackStyle 为 encouragement 时回调 */
  onEncouragement?: (tier: EncouragementTier) => void;
  onNext?: () => void; // 达到80分后进入下一个的回调
  /** 为 true 时禁用麦克风（例如「先听标准音再录」未完成） */
  recordDisabled?: boolean;
  /** 内部「再试一次」重置时回调（用于重新要求「先听再录」） */
  onRecordReset?: () => void;
}

function tierFromSimilarity(similarity: number): { tier: EncouragementTier; feedback: string } {
  if (similarity >= 0.88) {
    return { tier: 'excellent', feedback: 'Excellent! 太棒了！' };
  }
  if (similarity >= 0.72) {
    return { tier: 'well', feedback: 'Well done! 非常好！' };
  }
  if (similarity >= 0.55) {
    return { tier: 'good', feedback: 'Good! 不错，继续加油！' };
  }
  return { tier: 'retry', feedback: 'Nice try! 再听一遍标准音，试一次吧！' };
}

export function RecordButton({
  targetText,
  size = 'md',
  className,
  feedbackStyle = 'score',
  onScoreChange,
  onEncouragement,
  onNext,
  recordDisabled = false,
  onRecordReset,
}: RecordButtonProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [score, setScore] = useState<number | null>(null);
  const [encouragementTier, setEncouragementTier] = useState<EncouragementTier | null>(null);
  const [feedback, setFeedback] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  /** 避免 setState 异步导致 onend/onerror 里拿不到本轮的 recognition / 计时器 */
  const recognitionRef = useRef<any>(null);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const maxDurationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** 新一轮开始录音时递增，用于丢弃上一轮延迟触发的 onend/onerror */
  const sessionGenRef = useRef(0);
  /** onerror 与 onend 之间传递非致命错误码（如 network） */
  const sessionErrorRef = useRef<string | null>(null);
  /** onend 时 React 的 transcript 仍是点击瞬间的旧值；用 ref 存当前识别到的整段文本 */
  const latestTranscriptRef = useRef('');
  const stopRequestedRef = useRef(false);

  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  // 评估发音
  const evaluate = (spoken: string) => {
    const similarity = calculateSimilarity(spoken, targetText);
    const calculatedScore = Math.round(similarity * 100);

    if (feedbackStyle === 'encouragement') {
      const { tier, feedback: msg } = tierFromSimilarity(similarity);
      setEncouragementTier(tier);
      setScore(null);
      setFeedback(msg);
      onEncouragement?.(tier);
    } else {
      setScore(calculatedScore);
      setEncouragementTier(null);
      onScoreChange?.(calculatedScore);

      if (calculatedScore >= 80) {
        setFeedback('太棒了！可以进入下一个了！🎉');
      } else if (calculatedScore >= 60) {
        setFeedback('很接近了！再试一次！💪');
      } else {
        setFeedback('继续加油，多听几遍！🐰');
      }
    }

    setShowResult(true);
  };

  // 进入下一个
  const handleNext = () => {
    onNext?.();
    reset();
  };

  const clearRecordingTimer = () => {
    if (recordingTimerRef.current != null) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  };

  const clearMaxDurationTimer = () => {
    if (maxDurationTimerRef.current != null) {
      clearTimeout(maxDurationTimerRef.current);
      maxDurationTimerRef.current = null;
    }
  };

  // 从 result 事件拼出当前累计文本（含尚未 isFinal 的 interim，避免 onend 时 final 仍为空）
  const buildTranscriptFromResults = (event: any): string => {
    let line = '';
    for (let i = 0; i < event.results.length; i++) {
      line += event.results[i][0]?.transcript ?? '';
    }
    return line.trim();
  };

  // 开始录音
  const startRecording = () => {
    if (recordDisabled) return;

    if (typeof window !== 'undefined' && window.location.protocol === 'file:') {
      alert(
        'Recording needs this page opened with http:// or https://, not a local file (file://). ' +
          'Use npm run preview (e.g. http://localhost:4173) or a local server / start-full.bat.'
      );
      return;
    }

    // Chrome 等对语音识别要求「安全上下文」：http + 局域网 IP 常为非安全环境，会秒断或无法识别
    if (typeof window !== 'undefined' && !window.isSecureContext) {
      alert(
        'Speech recognition needs a secure context: use https, or http://localhost (not a raw LAN IP in some browsers).'
      );
      return;
    }

    // 检查浏览器支持
    const SpeechRecognition = (window as any).SpeechRecognition || 
                             (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      alert('This browser does not support speech recognition. Try Chrome or Edge.');
      return;
    }

    // 用户手势内：唤醒 AudioContext + 停掉朗读，避免与麦克风/Web Speech 争用（单词页自动 TTS 常见）
    unlockAudioFromButtonTap();
    try {
      window.speechSynthesis?.cancel?.();
    } catch {
      /* ignore */
    }

    stopRequestedRef.current = false;
    const instanceId = ++sessionGenRef.current;

    // 若上一轮未清干净，先停掉
    try {
      recognitionRef.current?.stop?.();
    } catch {
      /* ignore */
    }
    clearRecordingTimer();
    clearMaxDurationTimer();

    latestTranscriptRef.current = '';
    setIsRecording(true);
    setTranscript('');
    setScore(null);
    setEncouragementTier(null);
    setFeedback('');
    setShowResult(false);
    setIsProcessing(true);
    setRecordingTime(0);

    recordingTimerRef.current = setInterval(() => {
      setRecordingTime((prev) => prev + 1);
    }, 1000);

    const recognitionInstance = new SpeechRecognition();
    recognitionRef.current = recognitionInstance;
    // continuous：说完一句后仍可继续说或等用户点「停」；由 latestTranscriptRef 汇总 interim+final
    recognitionInstance.continuous = true;
    recognitionInstance.interimResults = true;
    recognitionInstance.lang = 'en-US';
    recognitionInstance.maxAlternatives = 1;

    recognitionInstance.onresult = (event: any) => {
      const line = buildTranscriptFromResults(event);
      latestTranscriptRef.current = line;
      setTranscript(line);
    };

    recognitionInstance.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      if (instanceId !== sessionGenRef.current) return;

      clearRecordingTimer();
      clearMaxDurationTimer();

      const code = event.error as string;

      if (code === 'not-allowed') {
        if (stopRequestedRef.current) {
          stopRequestedRef.current = false;
          return;
        }
        sessionGenRef.current += 1;
        if (recognitionRef.current === recognitionInstance) {
          recognitionRef.current = null;
        }
        setIsRecording(false);
        setIsProcessing(false);
        alert('请允许麦克风权限以使用录音功能');
        return;
      }

      if (code === 'network' || code === 'service-not-allowed') {
        sessionErrorRef.current = code;
        return;
      }

      if (code === 'no-speech' || code === 'audio-capture' || code === 'aborted') {
        // 多数情况会再触发 onend，由 onend 统一收尾与提示
        return;
      }

      sessionErrorRef.current = code;
    };

    recognitionInstance.onend = () => {
      if (instanceId !== sessionGenRef.current) return;

      clearRecordingTimer();
      clearMaxDurationTimer();

      if (recognitionRef.current === recognitionInstance) {
        recognitionRef.current = null;
      }
      stopRequestedRef.current = false;
      setIsRecording(false);
      setIsProcessing(false);

      const err = sessionErrorRef.current;
      sessionErrorRef.current = null;

      if (err === 'network') {
        setEncouragementTier('retry');
        setScore(null);
        setFeedback(
          '网络环境限制：无法连接语音识别服务。请尝试使用 Edge 浏览器，或在网络环境允许时重试。'
        );
        setShowResult(true);
        return;
      }
      if (err === 'service-not-allowed') {
        setEncouragementTier('retry');
        setScore(null);
        setFeedback('当前环境不允许使用语音识别，请用 https 或 http://localhost 打开页面后再试。');
        setShowResult(true);
        return;
      }
      if (err) {
        alert(`语音识别出错：${err}，请重试。`);
        return;
      }

      const spoken = latestTranscriptRef.current.trim();
      if (spoken) {
        setTranscript(spoken);
        evaluate(spoken);
      } else {
        setEncouragementTier('retry');
        setScore(null);
        setFeedback('没有听清你说的话，请再试一次（说完可稍停半秒，或点红色按钮结束录音）');
        setShowResult(true);
      }
    };

    const tryStart = () => {
      if (instanceId !== sessionGenRef.current) return;
      try {
        recognitionInstance.start();
      } catch (e) {
        console.error(e);
        clearRecordingTimer();
        clearMaxDurationTimer();
        if (recognitionRef.current === recognitionInstance) {
          recognitionRef.current = null;
        }
        setIsRecording(false);
        setIsProcessing(false);
        alert('无法启动语音识别，请刷新页面后重试。');
      }
    };

    // 与 useSpeech 类似：在 cancel TTS 后隔两帧再 start，减少 InvalidState / 秒断
    queueMicrotask(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          tryStart();
        });
      });
    });

    // 最长 15 秒；超时主动 stop 会触发 onend 并带上已有 interim/final
    maxDurationTimerRef.current = window.setTimeout(() => {
      if (instanceId !== sessionGenRef.current) return;
      try {
        if (recognitionRef.current === recognitionInstance) {
          recognitionInstance.stop();
        }
      } catch {
        /* ignore */
      }
    }, 15000);
  };

  // 手动停止录音
  const stopRecording = () => {
    try {
      recognitionRef.current?.stop?.();
    } catch {
      /* ignore */
    }
    clearRecordingTimer();
    clearMaxDurationTimer();
    setIsRecording(false);
    setIsProcessing(false);
  };

  // 重置
  const reset = () => {
    sessionGenRef.current += 1;
    try {
      recognitionRef.current?.stop?.();
    } catch {
      /* ignore */
    }
    clearRecordingTimer();
    clearMaxDurationTimer();
    recognitionRef.current = null;
    latestTranscriptRef.current = '';
    setTranscript('');
    setScore(null);
    setEncouragementTier(null);
    setFeedback('');
    setShowResult(false);
    setIsRecording(false);
    setIsProcessing(false);
    setRecordingTime(0);
    onRecordReset?.();
  };

  return (
    <div className={cn('inline-flex flex-col items-center', className)}>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={isRecording ? stopRecording : startRecording}
          disabled={recordDisabled || (isProcessing && !isRecording)}
          className={cn(
            'relative flex items-center justify-center rounded-full transition-all duration-200',
            sizeClasses[size],
            isRecording 
              ? 'bg-red-500 hover:bg-red-600' 
              : 'bg-primary-500 hover:bg-primary-600',
            !isRecording && !isProcessing && !recordDisabled && 'active:scale-95',
            (isProcessing && !isRecording) || recordDisabled ? 'opacity-50 cursor-not-allowed' : ''
          )}
          title={
            isRecording
              ? '点击停止'
              :             recordDisabled ? '当前不可录音' : '点击录音'
          }
        >
          {isRecording ? (
            <StopCircle className={cn(iconSizes[size], 'text-white')} />
          ) : (
            <Mic className={cn(iconSizes[size], 'text-white')} />
          )}
        </button>
      </div>

      {/* 录音状态 */}
      {isRecording && (
        <div className="mt-2 flex flex-col items-center">
          <div className="flex items-center gap-2 text-xs text-red-500 animate-pulse">
            <span>● 录音中</span>
            <span className="font-mono">{recordingTime}秒</span>
          </div>
        </div>
      )}

      {/* 处理中状态 */}
      {isProcessing && !isRecording && (
        <div className="mt-2 text-xs text-gray-500">
          识别中...
        </div>
      )}

      {/* 结果显示 */}
      {showResult && (feedbackStyle === 'encouragement' ? encouragementTier !== null : score !== null) && (
        <div className="mt-2 p-2 bg-white rounded-lg shadow-md border border-gray-200 min-w-48">
          {feedbackStyle === 'score' ? (
            <div className="text-center mb-2">
              <span className={cn(
                'text-2xl font-bold',
                score! >= 80 ? 'text-green-500' :
                score! >= 60 ? 'text-yellow-500' : 'text-red-500'
              )}>
                {score}分
              </span>
            </div>
          ) : (
            <div className="text-center mb-2">
              <span className={cn(
                'text-xl font-bold',
                encouragementTier === 'excellent' && 'text-green-600',
                encouragementTier === 'well' && 'text-emerald-600',
                encouragementTier === 'good' && 'text-amber-600',
                encouragementTier === 'retry' && 'text-gray-600'
              )}>
                {encouragementTier === 'excellent' && 'Excellent'}
                {encouragementTier === 'well' && 'Well done'}
                {encouragementTier === 'good' && 'Good'}
                {encouragementTier === 'retry' && 'Keep going'}
              </span>
            </div>
          )}

          {transcript && (
            <div className="text-xs text-gray-600 mb-2 text-center">
              你说的是："{transcript}"
            </div>
          )}

          <p className={cn(
            'text-sm text-center mb-2',
            feedbackStyle === 'score'
              ? (score! >= 80 ? 'text-green-600 font-medium' : 'text-gray-700')
              : (encouragementTier === 'excellent' || encouragementTier === 'well'
                  ? 'text-green-700 font-medium'
                  : 'text-gray-700')
          )}>
            {feedback}
          </p>

          <div className="flex justify-center gap-2">
            <button
              onClick={reset}
              className="px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300"
            >
              再试一次
            </button>
            {feedbackStyle === 'score' ? (
              score! >= 80 && (
                <button
                  onClick={handleNext}
                  className="px-3 py-1 text-xs bg-green-500 text-white rounded-full hover:bg-green-600 flex items-center gap-1"
                >
                  下一个 <ArrowRight className="w-3 h-3" />
                </button>
              )
            ) : (
              (encouragementTier === 'excellent' || encouragementTier === 'well') && (
                <button
                  onClick={handleNext}
                  className="px-3 py-1 text-xs bg-green-500 text-white rounded-full hover:bg-green-600 flex items-center gap-1"
                >
                  下一个 <ArrowRight className="w-3 h-3" />
                </button>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}
