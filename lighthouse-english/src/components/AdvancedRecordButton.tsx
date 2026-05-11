/* eslint-disable @typescript-eslint/no-explicit-any -- Web Speech API 各浏览器类型不完整 */
import { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, MicOff, Pause, Play, StopCircle, ArrowRight, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { cn, calculateSimilarity } from '@/lib/utils';
import { unlockAudioFromButtonTap } from '@/lib/gameSfx';
import { getMicrophoneStream } from '@/lib/AudioRecorder';

export type EncouragementTier = 'excellent' | 'well' | 'good' | 'retry';

interface RecordingQuality {
  duration: number;
  volumeLevel: 'low' | 'normal' | 'high';
  clarity: number;
  isValid: boolean;
  issues: string[];
}

interface RecordButtonProps {
  targetText: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  feedbackStyle?: 'score' | 'encouragement';
  onScoreChange?: (score: number) => void;
  onEncouragement?: (tier: EncouragementTier) => void;
  onNext?: () => void;
  recordDisabled?: boolean;
  onRecordReset?: () => void;
  minDuration?: number;
  maxDuration?: number;
}

function tierFromSimilarity(similarity: number): { tier: EncouragementTier; feedback: string } {
  if (similarity >= 0.88) {
    return { tier: 'excellent', feedback: 'Excellent! 太棒了！🎉' };
  }
  if (similarity >= 0.72) {
    return { tier: 'well', feedback: 'Well done! 非常好！🌟' };
  }
  if (similarity >= 0.55) {
    return { tier: 'good', feedback: 'Good! 不错，继续加油！💪' };
  }
  return { tier: 'retry', feedback: 'Nice try! 再听一遍标准音，试一次吧！🐰' };
}

export function AdvancedRecordButton({
  targetText,
  size = 'md',
  className,
  feedbackStyle = 'score',
  onScoreChange,
  onEncouragement,
  onNext,
  recordDisabled = false,
  onRecordReset,
  minDuration = 1,
  maxDuration = 15,
}: RecordButtonProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [score, setScore] = useState<number | null>(null);
  const [encouragementTier, setEncouragementTier] = useState<EncouragementTier | null>(null);
  const [feedback, setFeedback] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioLevels, setAudioLevels] = useState<number[]>([]);
  const [volumeStatus, setVolumeStatus] = useState<'low' | 'normal' | 'high'>('normal');
  const [quality, setQuality] = useState<RecordingQuality | null>(null);
  
  const recognitionRef = useRef<any>(null);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const maxDurationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const sessionGenRef = useRef(0);
  const sessionErrorRef = useRef<string | null>(null);
  const latestTranscriptRef = useRef('');
  const stopRequestedRef = useRef(false);

  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-12 h-12 text-base',
    lg: 'w-14 h-14 text-lg',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-7 h-7',
  };

  const analyzeAudioLevel = useCallback(() => {
    if (!analyserRef.current || !dataArrayRef.current || isPaused) {
      animationFrameRef.current = requestAnimationFrame(analyzeAudioLevel);
      return;
    }

    analyserRef.current.getByteFrequencyData(dataArrayRef.current);
    const average = dataArrayRef.current.reduce((a, b) => a + b) / dataArrayRef.current.length;
    const normalized = average / 255;

    setAudioLevels(prev => {
      const updated = [...prev, normalized];
      if (updated.length > 30) updated.shift();
      return updated;
    });

    if (normalized < 0.1) {
      setVolumeStatus('low');
    } else if (normalized > 0.7) {
      setVolumeStatus('high');
    } else {
      setVolumeStatus('normal');
    }

    animationFrameRef.current = requestAnimationFrame(analyzeAudioLevel);
  }, [isPaused]);

  const evaluateRecordingQuality = (duration: number): RecordingQuality => {
    const issues: string[] = [];
    let isValid = true;

    if (duration < minDuration) {
      issues.push(`录音时长不足，至少需要 ${minDuration} 秒`);
      isValid = false;
    }

    if (volumeStatus === 'low') {
      issues.push('音量过低，请靠近麦克风或提高音量');
      isValid = false;
    }

    if (volumeStatus === 'high') {
      issues.push('音量过高，可能导致失真，请降低音量');
      isValid = false;
    }

    const avgLevel = audioLevels.reduce((a, b) => a + b, 0) / Math.max(audioLevels.length, 1);
    const clarity = avgLevel > 0.1 ? 0.7 + avgLevel * 0.3 : 0.5;

    return {
      duration,
      volumeLevel: volumeStatus,
      clarity: Math.round(clarity * 100),
      isValid,
      issues,
    };
  };

  const evaluate = (spoken: string) => {
    const qualityResult = evaluateRecordingQuality(recordingTime);
    setQuality(qualityResult);

    if (!qualityResult.isValid) {
      setEncouragementTier('retry');
      setScore(null);
      setFeedback('录音质量不佳：' + qualityResult.issues.join('；'));
      setShowResult(true);
      return;
    }

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

  const handleNext = () => {
    onNext?.();
    reset();
  };

  const reset = () => {
    setIsRecording(false);
    setIsPaused(false);
    setTranscript('');
    setScore(null);
    setEncouragementTier(null);
    setFeedback('');
    setShowResult(false);
    setIsProcessing(false);
    setRecordingTime(0);
    setAudioLevels([]);
    setVolumeStatus('normal');
    setQuality(null);
    latestTranscriptRef.current = '';
    sessionErrorRef.current = null;
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    onRecordReset?.();
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

  const buildTranscriptFromResults = (event: any): string => {
    let line = '';
    for (let i = 0; i < event.results.length; i++) {
      line += event.results[i][0]?.transcript ?? '';
    }
    return line.trim();
  };

  const pauseRecording = () => {
    if (!isRecording || isPaused) return;
    
    try {
      recognitionRef.current?.stop?.();
    } catch { /* ignore */ }
    setIsPaused(true);
    clearRecordingTimer();
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  };

  const resumeRecording = () => {
    if (!isRecording || !isPaused) return;
    
    setIsPaused(false);
    recordingTimerRef.current = setInterval(() => {
      setRecordingTime((prev) => prev + 1);
    }, 1000);

    const SpeechRecognition = (window as any).SpeechRecognition || 
                             (window as any).webkitSpeechRecognition;
    if (SpeechRecognition && recognitionRef.current) {
      const instanceId = sessionGenRef.current;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';
      recognitionRef.current.maxAlternatives = 1;

      recognitionRef.current.onresult = (event: any) => {
        const line = buildTranscriptFromResults(event);
        latestTranscriptRef.current += ' ' + line;
        setTranscript(latestTranscriptRef.current.trim());
      };

      recognitionRef.current.onend = () => {
        if (instanceId !== sessionGenRef.current) return;
        if (!isPaused) {
          const spoken = latestTranscriptRef.current.trim();
          if (spoken) {
            setTranscript(spoken);
            evaluate(spoken);
          }
        }
      };

      try {
        recognitionRef.current.start();
      } catch { /* ignore */ }
    }

    animationFrameRef.current = requestAnimationFrame(analyzeAudioLevel);
  };

  const startRecording = async () => {
    if (recordDisabled) return;

    if (typeof window !== 'undefined' && window.location.protocol === 'file:') {
      alert(
        '录音功能需要通过 http:// 或 https:// 访问，不能直接打开本地文件。' +
          '请使用 npm run preview (如 http://localhost:4173) 或本地服务器。'
      );
      return;
    }

    if (typeof window !== 'undefined' && !window.isSecureContext) {
      alert(
        '语音识别需要安全上下文：请使用 https 或 http://localhost（某些浏览器不支持局域网IP）。'
      );
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || 
                             (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      alert('当前浏览器不支持语音识别，请使用 Chrome 或 Edge 浏览器。');
      return;
    }

    // 在用户手势栈内立刻发起 getUserMedia（其后不要有 await），合并重复请求，避免每次点击都再走一遍权限提示
    const micPromise = getMicrophoneStream({ audio: true });

    stopRequestedRef.current = false;
    unlockAudioFromButtonTap();
    try {
      window.speechSynthesis?.cancel?.();
    } catch { /* ignore */ }

    const instanceId = ++sessionGenRef.current;

    try {
      recognitionRef.current?.stop?.();
    } catch { /* ignore */ }
    clearRecordingTimer();
    clearMaxDurationTimer();

    let micStream: MediaStream;
    try {
      micStream = await micPromise;
    } catch (err) {
      console.error('麦克风权限请求失败：', err);
      setFeedback('请允许麦克风权限以使用录音功能');
      setShowResult(true);
      return;
    }

    latestTranscriptRef.current = '';
    setIsRecording(true);
    setIsPaused(false);
    setTranscript('');
    setScore(null);
    setEncouragementTier(null);
    setFeedback('');
    setShowResult(false);
    setIsProcessing(true);
    setRecordingTime(0);
    setAudioLevels([]);
    setVolumeStatus('normal');
    setQuality(null);

    recordingTimerRef.current = setInterval(() => {
      setRecordingTime((prev) => prev + 1);
    }, 1000);

    maxDurationTimerRef.current = window.setTimeout(() => {
      if (instanceId !== sessionGenRef.current) return;
      try {
        recognitionRef.current?.stop?.();
      } catch { /* ignore */ }
    }, maxDuration * 1000);

    try {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioContextRef.current.createMediaStreamSource(micStream);
      source.connect(analyserRef.current);
      dataArrayRef.current = new Uint8Array(analyserRef.current.frequencyBinCount);
      animationFrameRef.current = requestAnimationFrame(analyzeAudioLevel);
    } catch { /* ignore audio analysis errors */ }

    const recognitionInstance = new SpeechRecognition();
    recognitionRef.current = recognitionInstance;
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
        setFeedback('请允许麦克风权限以使用录音功能');
        setShowResult(true);
        return;
      }

      if (code === 'network' || code === 'service-not-allowed') {
        sessionErrorRef.current = code;
        return;
      }

      if (code === 'no-speech' || code === 'audio-capture' || code === 'aborted') {
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

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }

      try {
        audioContextRef.current?.close();
      } catch { /* ignore */ }

      const err = sessionErrorRef.current;
      sessionErrorRef.current = null;

      if (err === 'network') {
        setEncouragementTier('retry');
        setScore(null);
        setFeedback('网络环境限制：无法连接语音识别服务。请尝试使用 Edge 浏览器，或在网络环境允许时重试。');
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
        setFeedback(`语音识别出错：${err}，请重试。`);
        setShowResult(true);
        return;
      }

      const spoken = latestTranscriptRef.current.trim();
      if (spoken) {
        setTranscript(spoken);
        evaluate(spoken);
      } else {
        setEncouragementTier('retry');
        setScore(null);
        setFeedback('没有听清你说的话，请再试一次（说完可稍停半秒，或点停止按钮结束录音）');
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
        setFeedback('无法启动语音识别，请刷新页面后重试。');
        setShowResult(true);
      }
    };

    queueMicrotask(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          tryStart();
        });
      });
    });
  };

  const stopRecording = () => {
    stopRequestedRef.current = true;
    try {
      recognitionRef.current?.stop?.();
    } catch { /* ignore */ }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `${secs}s`;
  };

  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      <div className="flex items-center gap-2">
        <button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={recordDisabled || isProcessing}
          className={cn(
            sizeClasses[size],
            'rounded-full flex items-center justify-center transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2',
            recordDisabled && 'opacity-50 cursor-not-allowed',
            isRecording && !isPaused && 'bg-red-500 hover:bg-red-600 text-white animate-pulse shadow-lg shadow-red-300',
            isRecording && isPaused && 'bg-yellow-500 hover:bg-yellow-600 text-white',
            !isRecording && 'bg-orange-500 hover:bg-orange-600 text-white shadow-md hover:shadow-lg'
          )}
          title={isRecording ? '停止录音' : '开始录音'}
        >
          {isRecording && !isPaused && <StopCircle className={iconSizes[size]} />}
          {isRecording && isPaused && <Play className={iconSizes[size]} />}
          {!isRecording && <Mic className={iconSizes[size]} />}
        </button>

        {isRecording && (
          <button
            onClick={isPaused ? resumeRecording : pauseRecording}
            className={cn(
              'w-10 h-10 rounded-full flex items-center justify-center',
              'bg-gray-100 hover:bg-gray-200 text-gray-600',
              'transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-300'
            )}
            title={isPaused ? '继续录音' : '暂停录音'}
          >
            {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
          </button>
        )}
      </div>

      {isRecording && (
        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center gap-2">
            {volumeStatus === 'low' && <VolumeX className="w-4 h-4 text-red-400" />}
            {volumeStatus === 'normal' && <Volume2 className="w-4 h-4 text-green-400" />}
            {volumeStatus === 'high' && <Volume2 className="w-4 h-4 text-yellow-400" />}
            <span className="text-sm font-medium text-gray-600">{formatTime(recordingTime)}</span>
          </div>
          
          <div className="flex items-end gap-0.5 h-8">
            {audioLevels.map((level, index) => (
              <div
                key={index}
                className={cn(
                  'w-1 rounded-full transition-all duration-100',
                  volumeStatus === 'low' && 'bg-red-300',
                  volumeStatus === 'normal' && 'bg-green-400',
                  volumeStatus === 'high' && 'bg-yellow-400'
                )}
                style={{ height: `${Math.max(level * 100, 10)}%` }}
              />
            ))}
          </div>

          {transcript && (
            <p className="text-sm text-gray-700 bg-gray-50 px-3 py-2 rounded-lg max-w-xs text-center">
              {transcript}
            </p>
          )}
        </div>
      )}

      {showResult && (
        <div className="flex flex-col items-center gap-2 mt-2 p-4 bg-gray-50 rounded-xl min-w-[200px]">
          {score !== null && (
            <div className="flex flex-col items-center">
              <div className={cn(
                'w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold',
                score >= 80 && 'bg-green-100 text-green-600',
                score >= 60 && score < 80 && 'bg-yellow-100 text-yellow-600',
                score < 60 && 'bg-red-100 text-red-600'
              )}>
                {score}
              </div>
              <span className="text-sm text-gray-500">发音相似度</span>
            </div>
          )}

          {quality && !quality.isValid && (
            <div className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">
              {quality.issues.map((issue, i) => (
                <p key={i}>• {issue}</p>
              ))}
            </div>
          )}

          <p className={cn(
            'text-center font-medium',
            encouragementTier === 'excellent' && 'text-green-600',
            encouragementTier === 'well' && 'text-blue-600',
            encouragementTier === 'good' && 'text-orange-600',
            encouragementTier === 'retry' && 'text-red-500',
            !encouragementTier && 'text-gray-700'
          )}>
            {feedback}
          </p>

          <div className="flex gap-2 mt-2">
            <button
              onClick={reset}
              className="flex items-center gap-1 px-3 py-2 text-sm bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              再试一次
            </button>
            {(score !== null && score >= 80) && (
              <button
                onClick={handleNext}
                className="flex items-center gap-1 px-3 py-2 text-sm bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
              >
                下一个
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}