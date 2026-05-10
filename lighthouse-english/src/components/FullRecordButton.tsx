import { useState, useRef, useEffect } from 'react';
import { Mic, Pause, StopCircle, RotateCcw, ArrowRight, CheckCircle2 } from 'lucide-react';
import { AudioRecorder, Recording, RecordingState } from '../lib/AudioRecorder';
import { AudioComparator, AudioComparisonResult } from '../lib/AudioComparator';
import { AudioPlayer } from './AudioPlayer';
import { RecordingHistory } from './RecordingHistory';

interface FullRecordButtonProps {
  targetText: string;
  referenceAudioUrl?: string;
  size?: 'sm' | 'md' | 'lg';
  onRecordingComplete?: (recording: Recording, result: AudioComparisonResult) => void;
  onScoreChange?: (score: number) => void;
  onNext?: () => void;
  feedbackStyle?: 'score' | 'encouragement';
  minDuration?: number;
  maxDuration?: number;
}

export function FullRecordButton({
  targetText,
  referenceAudioUrl,
  size = 'md',
  onRecordingComplete,
  onScoreChange,
  onNext,
  feedbackStyle = 'score',
  minDuration = 1,
  maxDuration = 15,
}: FullRecordButtonProps) {
  const [recorderState, setRecorderState] = useState<RecordingState>('idle');
  const [duration, setDuration] = useState(0);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [audioData, setAudioData] = useState<Uint8Array | null>(null);
  const [currentRecording, setCurrentRecording] = useState<Recording | null>(null);
  const [comparisonResult, setComparisonResult] = useState<AudioComparisonResult | null>(null);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showResult, setShowResult] = useState(false);

  const recorderRef = useRef<AudioRecorder | null>(null);
  const comparatorRef = useRef<AudioComparator | null>(null);

  useEffect(() => {
    recorderRef.current = new AudioRecorder();
    comparatorRef.current = new AudioComparator();

    recorderRef.current.onStateChange = (state) => setRecorderState(state);
    recorderRef.current.onDurationChange = (dur) => setDuration(dur);
    recorderRef.current.onVolumeChange = (level) => setVolumeLevel(level);
    recorderRef.current.onDataAvailable = (data) => setAudioData(data);
    recorderRef.current.onError = (error) => {
      console.error('录音错误:', error);
    };

    const saved = localStorage.getItem('recordings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setRecordings(parsed.map((r: any) => ({
          ...r,
          timestamp: new Date(r.timestamp)
        })));
      } catch {
        // ignore
      }
    }

    return () => {
      recorderRef.current?.destroy();
    };
  }, []);

  const saveRecordings = (newRecordings: Recording[]) => {
    setRecordings(newRecordings);
    try {
      const toSave = newRecordings.map(r => ({
        ...r,
        blob: undefined,
        url: undefined
      }));
      localStorage.setItem('recordings', JSON.stringify(toSave));
    } catch {
      // ignore
    }
  };

  const handleStart = async () => {
    if (!recorderRef.current) return;
    setShowResult(false);
    setCurrentRecording(null);
    setComparisonResult(null);
    await recorderRef.current.start();
  };

  const handlePause = () => {
    recorderRef.current?.pause();
  };

  const handleResume = () => {
    recorderRef.current?.resume();
  };

  const handleStop = async () => {
    if (!recorderRef.current) return;
    
    setIsProcessing(true);
    
    try {
      const recording = await recorderRef.current.stop();
      const recordingWithText = { ...recording, targetText };
      
      setCurrentRecording(recordingWithText);

      const result = await comparatorRef.current!.compareAudio(
        recording.url,
        referenceAudioUrl,
        targetText
      );

      setComparisonResult(result);
      
      const updatedRecording = { ...recordingWithText, similarity: result.similarity };
      setCurrentRecording(updatedRecording);
      
      saveRecordings([updatedRecording, ...recordings]);

      if (result.similarity !== undefined) {
        onScoreChange?.(result.similarity);
      }

      onRecordingComplete?.(updatedRecording, result);

      setShowResult(true);
    } catch (error) {
      console.error('录音失败:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRetry = () => {
    setShowResult(false);
    setCurrentRecording(null);
    setComparisonResult(null);
    setRecorderState('idle');
    setDuration(0);
  };

  const handleDeleteRecording = (id: string) => {
    const updated = recordings.filter(r => r.id !== id);
    saveRecordings(updated);
    
    if (currentRecording?.id === id) {
      setCurrentRecording(null);
      setShowResult(false);
    }
  };

  const handleClearAll = () => {
    saveRecordings([]);
    setCurrentRecording(null);
    setShowResult(false);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `${secs}s`;
  };

  const getVolumeColor = () => {
    if (volumeLevel < 0.1) return 'text-red-400';
    if (volumeLevel < 0.3) return 'text-yellow-400';
    if (volumeLevel > 0.8) return 'text-orange-400';
    return 'text-green-400';
  };

  const getScoreColor = (score?: number) => {
    if (!score) return 'text-gray-600';
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBg = (score?: number) => {
    if (!score) return 'bg-gray-100';
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-14 h-14',
    lg: 'w-18 h-18'
  };

  const iconSizes = {
    sm: 'w-5 h-5',
    md: 'w-7 h-7',
    lg: 'w-9 h-9'
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex flex-col items-center gap-2">
        <div className="flex items-center gap-3">
          {recorderState === 'idle' && (
            <button
              onClick={handleStart}
              disabled={isProcessing}
              className={`${sizeClasses[size]} rounded-full bg-gradient-to-r from-orange-400 to-orange-500 text-white flex items-center justify-center hover:from-orange-500 hover:to-orange-600 transition-all shadow-lg hover:shadow-xl disabled:opacity-50`}
            >
              <Mic className={iconSizes[size]} />
            </button>
          )}

          {recorderState === 'recording' && (
            <>
              <button
                onClick={handlePause}
                className={`${sizeClasses[size]} rounded-full bg-yellow-500 text-white flex items-center justify-center hover:bg-yellow-600 transition-all shadow-lg`}
              >
                <Pause className={iconSizes[size]} />
              </button>
              <button
                onClick={handleStop}
                className={`${sizeClasses[size]} rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-all shadow-lg`}
              >
                <StopCircle className={iconSizes[size]} />
              </button>
            </>
          )}

          {recorderState === 'paused' && (
            <>
              <button
                onClick={handleResume}
                className={`${sizeClasses[size]} rounded-full bg-green-500 text-white flex items-center justify-center hover:bg-green-600 transition-all shadow-lg`}
              >
                <Mic className={iconSizes[size]} />
              </button>
              <button
                onClick={handleStop}
                className={`${sizeClasses[size]} rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-all shadow-lg`}
              >
                <StopCircle className={iconSizes[size]} />
              </button>
            </>
          )}

          {(recorderState === 'stopped' || recorderState === 'error') && showResult === false && (
            <button
              onClick={handleStart}
              className={`${sizeClasses[size]} rounded-full bg-gradient-to-r from-orange-400 to-orange-500 text-white flex items-center justify-center hover:from-orange-500 hover:to-orange-600 transition-all shadow-lg hover:shadow-xl`}
            >
              <RotateCcw className={iconSizes[size]} />
            </button>
          )}
        </div>

        {(recorderState === 'recording' || recorderState === 'paused') && (
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-2">
              <div className={`text-sm font-mono ${getVolumeColor()}`}>
                {formatTime(duration)}
              </div>
              <div className="flex items-end gap-0.5 h-4">
                {[...Array(10)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-1 rounded-full transition-all duration-100 ${
                      i < Math.floor(volumeLevel * 10) ? getVolumeColor().replace('text-', 'bg-') : 'bg-gray-200'
                    }`}
                    style={{ height: `${(i + 1) * 4}px` }}
                  />
                ))}
              </div>
            </div>
            {audioData && (
              <div className="flex items-end gap-0.5 h-8">
                {[...Array(20)].map((_, i) => {
                  const sample = audioData[Math.floor(i * audioData.length / 20)] || 0;
                  const height = (sample / 255) * 100;
                  return (
                    <div
                      key={i}
                      className={`w-1.5 rounded-full transition-all duration-100 ${getVolumeColor().replace('text-', 'bg-')}`}
                      style={{ height: `${Math.max(4, height)}%` }}
                    />
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {isProcessing && (
        <div className="text-sm text-gray-500 animate-pulse">
          分析中...
        </div>
      )}

      {showResult && currentRecording && (
        <div className="w-full max-w-sm">
          <AudioPlayer
            recording={currentRecording}
            showControls={true}
          />

          {comparisonResult && (
            <div className="mt-4 space-y-3">
              {feedbackStyle === 'score' && comparisonResult.similarity !== undefined && (
                <div className="flex items-center justify-center gap-4">
                  <div className={`w-20 h-20 rounded-full flex items-center justify-center ${getScoreBg(comparisonResult.similarity)}`}>
                    <span className={`text-2xl font-bold ${getScoreColor(comparisonResult.similarity)}`}>
                      {comparisonResult.similarity}
                    </span>
                  </div>
                  <div className="text-left">
                    <div className="text-sm text-gray-500">发音相似度</div>
                    {comparisonResult.similarity >= 80 && (
                      <div className="flex items-center gap-1 text-green-600 text-sm">
                        <CheckCircle2 className="w-4 h-4" />
                        太棒了！
                      </div>
                    )}
                  </div>
                </div>
              )}

              {comparisonResult.recommendations.length > 0 && (
                <div className="bg-blue-50 rounded-lg p-3">
                  {comparisonResult.recommendations.map((rec, i) => (
                    <div key={i} className="text-sm text-blue-700 flex items-start gap-2">
                      <span className="text-blue-400 mt-0.5">•</span>
                      {rec}
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={handleRetry}
                  className="flex-1 py-2 px-4 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  再试一次
                </button>
                {onNext && comparisonResult.similarity && comparisonResult.similarity >= 80 && (
                  <button
                    onClick={onNext}
                    className="flex-1 py-2 px-4 text-sm bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    下一个
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <RecordingHistory
        recordings={recordings}
        onDelete={handleDeleteRecording}
        onClearAll={handleClearAll}
      />
    </div>
  );
}
