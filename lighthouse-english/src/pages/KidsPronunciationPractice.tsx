import { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, Square, Volume2, RotateCw, CheckCircle, XCircle, Star, Trophy, Play, Pause } from 'lucide-react';
import { AudioRecorder, Recording, RecordingQuality } from '../lib/AudioRecorder';
import { AudioComparator, AudioComparisonResult } from '../lib/AudioComparator';
import { useSpeech } from '../hooks/SpeechContext';

interface Word {
  id: string;
  word: string;
  phonetic: string;
  chinese: string;
}

export function KidsPronunciationPractice() {
  const [currentStep, setCurrentStep] = useState<'ready' | 'recording' | 'analyzing' | 'result'>('ready');
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentRecording, setCurrentRecording] = useState<Recording | null>(null);
  const [comparisonResult, setComparisonResult] = useState<AudioComparisonResult | null>(null);
  const [recordingQuality, setRecordingQuality] = useState<RecordingQuality>({
    volumeLevel: 'normal',
    clarity: 100,
    hasSpeech: false,
    issues: []
  });
  const [audioData, setAudioData] = useState<Uint8Array | null>(null);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [recordingsHistory, setRecordingsHistory] = useState<Recording[]>([]);
  const [isPlayingReference, setIsPlayingReference] = useState(false);
  const [isPlayingOwn, setIsPlayingOwn] = useState(false);
  
  const recorderRef = useRef<AudioRecorder | null>(null);
  const comparatorRef = useRef<AudioComparator | null>(null);
  const referenceAudioRef = useRef<HTMLAudioElement | null>(null);
  const ownAudioRef = useRef<HTMLAudioElement | null>(null);
  
  const { speak } = useSpeech();

  const words: Word[] = [
    { id: '1', word: 'apple', phonetic: '/ˈæpl/', chinese: '苹果' },
    { id: '2', word: 'banana', phonetic: '/bəˈnænə/', chinese: '香蕉' },
    { id: '3', word: 'cat', phonetic: '/kæt/', chinese: '猫' },
    { id: '4', word: 'dog', phonetic: '/dɒɡ/', chinese: '狗' },
    { id: '5', word: 'elephant', phonetic: '/ˈelɪfənt/', chinese: '大象' },
    { id: '6', word: 'flower', phonetic: '/ˈflaʊər/', chinese: '花' },
    { id: '7', word: 'green', phonetic: '/ɡriːn/', chinese: '绿色' },
    { id: '8', word: 'happy', phonetic: '/ˈhæpi/', chinese: '快乐的' },
    { id: '9', word: 'ice', phonetic: '/aɪs/', chinese: '冰' },
    { id: '10', word: 'jump', phonetic: '/dʒʌmp/', chinese: '跳' }
  ];

  const currentWord = words[currentWordIndex];

  useEffect(() => {
    recorderRef.current = new AudioRecorder({
      minRecordingDuration: 500,
      maxRecordingDuration: 5000,
      autoStopSilenceDuration: 1500
    });
    comparatorRef.current = new AudioComparator();

    recorderRef.current.onStateChange = () => {};
    recorderRef.current.onDurationChange = () => {};
    recorderRef.current.onVolumeChange = (level) => setVolumeLevel(level);
    recorderRef.current.onDataAvailable = (data) => setAudioData(data);
    recorderRef.current.onQualityChange = (q) => setRecordingQuality(q);
    recorderRef.current.onSilenceDetected = handleSilenceDetected;
    recorderRef.current.onError = (error) => {
      alert('录音出错：' + error);
    };

    const saved = localStorage.getItem('kidsRecordings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setRecordingsHistory(parsed.map((r: any) => ({
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

  const handleSilenceDetected = useCallback(() => {
    if (currentStep === 'recording') {
      stopRecording();
    }
  }, [currentStep]);

  const startRecording = async () => {
    if (!recorderRef.current) return;
    setCurrentStep('recording');
    setCurrentRecording(null);
    setComparisonResult(null);
    await recorderRef.current.start();
  };

  const stopRecording = async () => {
    if (!recorderRef.current) return;
    setCurrentStep('analyzing');
    
    try {
      const recording = await recorderRef.current.stop();
      const recordingWithText = { ...recording, targetText: currentWord.word };
      setCurrentRecording(recordingWithText);

      const result = await comparatorRef.current!.compareAudio(
        recording.url,
        undefined,
        currentWord.word
      );

      setComparisonResult(result);
      
      const updatedRecording = { ...recordingWithText, similarity: result.similarity };
      setCurrentRecording(updatedRecording);
      
      const newHistory = [updatedRecording, ...recordingsHistory].slice(0, 50);
      setRecordingsHistory(newHistory);
      
      try {
        const toSave = newHistory.map(r => ({
          ...r,
          blob: undefined,
          url: undefined
        }));
        localStorage.setItem('kidsRecordings', JSON.stringify(toSave));
      } catch {
        // ignore
      }

      setCurrentStep('result');
    } catch (error) {
      console.error('录音失败:', error);
      setCurrentStep('ready');
      alert('录音失败，请重试');
    }
  };

  const playReference = () => {
    speak(currentWord.word, 'en-US', {
      onStart: () => setIsPlayingReference(true),
      onEnd: () => setIsPlayingReference(false),
      onError: () => setIsPlayingReference(false)
    });
  };

  const playOwnRecording = () => {
    if (!currentRecording) return;
    
    if (isPlayingOwn && ownAudioRef.current) {
      ownAudioRef.current.pause();
      setIsPlayingOwn(false);
    } else if (ownAudioRef.current) {
      ownAudioRef.current.play().catch(() => {});
      setIsPlayingOwn(true);
    }
  };

  const retryRecording = () => {
    setCurrentStep('ready');
    setCurrentRecording(null);
    setComparisonResult(null);
    if (ownAudioRef.current) {
      ownAudioRef.current.pause();
    }
    setIsPlayingOwn(false);
  };

  const nextWord = () => {
    setCurrentWordIndex((prev) => (prev + 1) % words.length);
    retryRecording();
  };

  const getScoreColor = (score?: number) => {
    if (!score) return 'bg-gray-200';
    if (score >= 90) return 'bg-gradient-to-r from-green-400 to-green-500';
    if (score >= 70) return 'bg-gradient-to-r from-yellow-400 to-yellow-500';
    if (score >= 50) return 'bg-gradient-to-r from-orange-400 to-orange-500';
    return 'bg-gradient-to-r from-red-400 to-red-500';
  };

  const getScoreTextColor = (score?: number) => {
    if (!score) return 'text-gray-600';
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    if (score >= 50) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreBg = (score?: number) => {
    if (!score) return 'bg-gray-50';
    if (score >= 90) return 'bg-green-50';
    if (score >= 70) return 'bg-yellow-50';
    if (score >= 50) return 'bg-orange-50';
    return 'bg-red-50';
  };

  const getScoreFeedback = (score?: number) => {
    if (!score) return { emoji: '🤔', text: '加油！' };
    if (score >= 90) return { emoji: '🎉', text: '太棒了！完美发音！' };
    if (score >= 70) return { emoji: '👍', text: '很好！继续努力！' };
    if (score >= 50) return { emoji: '💪', text: '不错，再试一次！' };
    return { emoji: '🔄', text: '再试一次！' };
  };

  const renderStars = (score?: number) => {
    const stars = score ? Math.floor(score / 20) : 0;
    return (
      <div className="flex gap-1 justify-center">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            className={`w-8 h-8 ${i <= stars ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
          />
        ))}
      </div>
    );
  };

  const feedback = comparisonResult?.similarity ? getScoreFeedback(comparisonResult.similarity) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-2">
            🏆 英语发音小达人 🏆
          </h1>
          <p className="text-gray-600 text-lg">第 {currentWordIndex + 1} 个 / 共 {words.length} 个</p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-8 mb-6">
          <div className="text-center mb-8">
            <div className="text-6xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-500 mb-4">
              {currentWord.word}
            </div>
            <p className="text-2xl md:text-3xl text-gray-500 mb-2">{currentWord.phonetic}</p>
            <p className="text-xl md:text-2xl text-gray-600">{currentWord.chinese}</p>
          </div>

          <button
            onClick={playReference}
            className="w-full mb-6 py-6 px-8 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-2xl font-bold shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={currentStep === 'recording'}
          >
            <div className="flex items-center justify-center gap-3">
              {isPlayingReference ? <Pause className="w-10 h-10" /> : <Volume2 className="w-10 h-10" />}
              <span>听标准发音</span>
            </div>
          </button>

          {currentStep === 'ready' && (
            <div className="text-center">
              <button
                onClick={startRecording}
                className="w-full py-8 px-8 rounded-2xl bg-gradient-to-r from-orange-400 to-pink-500 text-white text-2xl font-bold shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all active:scale-95"
              >
                <div className="flex items-center justify-center gap-3">
                  <Mic className="w-12 h-12" />
                  <span>开始录音 🎤</span>
                </div>
              </button>
              <p className="text-gray-500 mt-4 text-lg">点击按钮，跟着读一遍！</p>
            </div>
          )}

          {currentStep === 'recording' && (
            <div className="text-center">
              <div className="mb-6">
                <div className="flex items-end justify-center gap-1 h-24 mb-4">
                  {[...Array(15)].map((_, i) => {
                    const height = Math.max(20, Math.random() * volumeLevel * 120);
                    return (
                      <div
                        key={i}
                        className="w-3 md:w-4 rounded-full bg-gradient-to-t from-orange-400 to-pink-500 animate-pulse"
                        style={{ height: `${height}%`, animationDelay: `${i * 50}ms` }}
                      />
                    );
                  })}
                </div>

                {audioData && (
                  <div className="flex items-end justify-center gap-1 h-20 mb-4">
                    {[...Array(20)].map((_, i) => {
                      const sample = audioData[Math.floor(i * audioData.length / 20)] || 0;
                      const height = Math.max(10, (sample / 255) * 100);
                      return (
                        <div
                          key={i}
                          className="w-2 md:w-3 rounded-full bg-gradient-to-t from-purple-400 to-pink-400"
                          style={{ height: `${height}%` }}
                        />
                      );
                    })}
                  </div>
                )}

                {recordingQuality.issues.length > 0 && (
                  <div className="text-orange-500 text-sm mb-4">
                    {recordingQuality.issues[0] === '音量过低' && '🔊 声音再大一点！'}
                    {recordingQuality.issues[0] === '音量过高' && '🔊 声音小一点点！'}
                    {recordingQuality.issues[0] === '声音不够清晰' && '💬 说话再清楚一点！'}
                  </div>
                )}
              </div>

              <button
                onClick={stopRecording}
                className="w-full py-8 px-8 rounded-2xl bg-gradient-to-r from-red-500 to-pink-600 text-white text-2xl font-bold shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all active:scale-95"
              >
                <div className="flex items-center justify-center gap-3">
                  <Square className="w-12 h-12" />
                  <span>停止录音</span>
                </div>
              </button>
              <p className="text-gray-500 mt-4 text-lg">说完了就点这里！</p>
            </div>
          )}

          {currentStep === 'analyzing' && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin-slow">
                <div className="w-24 h-24 border-8 border-t-blue-500 border-r-purple-500 border-b-pink-500 border-l-cyan-500 rounded-full animate-spin"></div>
              </div>
              <p className="text-xl text-gray-600 mt-6">正在分析你的发音...</p>
            </div>
          )}

          {currentStep === 'result' && currentRecording && comparisonResult && (
            <div className="space-y-6">
              <div className={`text-center p-8 rounded-3xl ${getScoreBg(comparisonResult.similarity)}`}>
                {feedback && (
                  <div className="text-6xl mb-4">{feedback.emoji}</div>
                )}
                <div className={`text-5xl md:text-6xl font-bold ${getScoreTextColor(comparisonResult.similarity)} mb-2`}>
                  {comparisonResult.similarity || 0}
                  <span className="text-2xl">分</span>
                </div>
                {renderStars(comparisonResult.similarity)}
                {feedback && (
                  <p className={`text-xl md:text-2xl font-bold mt-4 ${getScoreTextColor(comparisonResult.similarity)}`}>
                    {feedback.text}
                  </p>
                )}
              </div>

              {comparisonResult.recognizedText && (
                <div className="bg-blue-50 rounded-2xl p-6 text-center">
                  <p className="text-gray-600 text-lg mb-2">你读的是：</p>
                  <p className="text-2xl font-bold text-blue-600">{comparisonResult.recognizedText}</p>
                </div>
              )}

              {comparisonResult.recommendations.length > 0 && (
                <div className="bg-yellow-50 rounded-2xl p-6">
                  <p className="text-gray-700 text-lg text-center">
                    💡 {comparisonResult.recommendations[comparisonResult.recommendations.length - 1]}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-white border-2 border-blue-200 rounded-2xl p-4 text-center">
                  <p className="text-gray-500 mb-2">清晰度</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {comparisonResult.pronunciationScore || 0}
                  </p>
                </div>
                <div className="bg-white border-2 border-purple-200 rounded-2xl p-4 text-center">
                  <p className="text-gray-500 mb-2">流畅度</p>
                  <p className="text-3xl font-bold text-purple-600">
                    {comparisonResult.fluencyScore || 0}
                  </p>
                </div>
              </div>

              <button
                onClick={playOwnRecording}
                className="w-full mb-4 py-6 px-8 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 text-white text-2xl font-bold shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all active:scale-95"
              >
                <div className="flex items-center justify-center gap-3">
                  {isPlayingOwn ? <Pause className="w-10 h-10" /> : <Play className="w-10 h-10" />}
                  <span>听听自己的录音</span>
                </div>
              </button>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={retryRecording}
                  className="py-6 px-6 rounded-2xl bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 text-xl font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all active:scale-95"
                >
                  <div className="flex items-center justify-center gap-2">
                    <RotateCw className="w-8 h-8" />
                    <span>再试一次</span>
                  </div>
                </button>

                <button
                  onClick={nextWord}
                  className="py-6 px-6 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xl font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all active:scale-95"
                >
                  <div className="flex items-center justify-center gap-2">
                    <Trophy className="w-8 h-8" />
                    <span>下一个单词</span>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
          <h3 className="text-xl font-bold text-gray-700 mb-4 text-center">📚 学习进度</h3>
          <div className="flex justify-center gap-2 flex-wrap">
            {words.slice(0, Math.min(10, words.length)).map((word, index) => {
              const hasRecording = recordingsHistory.some(r => r.targetText === word.word && r.similarity && r.similarity >= 70);
              const isCurrent = index === currentWordIndex;
              return (
                <button
                  key={word.id}
                  onClick={() => {
                    setCurrentWordIndex(index);
                    retryRecording();
                  }}
                  className={`w-12 h-12 rounded-xl font-bold text-lg flex items-center justify-center transition-all ${
                    isCurrent
                      ? 'bg-gradient-to-r from-orange-400 to-pink-500 text-white shadow-lg scale-110'
                      : hasRecording
                        ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {hasRecording ? <CheckCircle className="w-5 h-5" /> : index + 1}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {currentRecording && (
        <audio
          ref={ownAudioRef}
          src={currentRecording.url}
          onEnded={() => setIsPlayingOwn(false)}
          onError={() => setIsPlayingOwn(false)}
        />
      )}

      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 2s linear infinite;
        }
      `}</style>
    </div>
  );
}
