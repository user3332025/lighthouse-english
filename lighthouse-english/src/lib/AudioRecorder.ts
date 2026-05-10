export type RecordingState = 'idle' | 'recording' | 'paused' | 'stopped' | 'error';

export interface Recording {
  id: string;
  blob: Blob;
  url: string;
  duration: number;
  timestamp: Date;
  targetText?: string;
  similarity?: number;
  quality?: RecordingQuality;
}

export interface RecordingQuality {
  volumeLevel: 'low' | 'normal' | 'high';
  clarity: number;
  hasSpeech: boolean;
  issues: string[];
}

export interface AudioRecorderConfig {
  sampleRate?: number;
  channelCount?: number;
  echoCancellation?: boolean;
  noiseSuppression?: boolean;
  autoStopSilenceDuration?: number;
  minRecordingDuration?: number;
  maxRecordingDuration?: number;
}

export class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private gainNode: GainNode | null = null;
  private filterNode: BiquadFilterNode | null = null;
  private dataArray: Uint8Array | null = null;
  private animationId: number | null = null;
  private startTime: number = 0;
  private durationTimer: NodeJS.Timeout | null = null;
  private silenceTimer: NodeJS.Timeout | null = null;
  
  public state: RecordingState = 'idle';
  public duration: number = 0;
  public volumeLevel: number = 0;
  public quality: RecordingQuality = {
    volumeLevel: 'normal',
    clarity: 100,
    hasSpeech: false,
    issues: []
  };
  
  public onStateChange: ((state: RecordingState) => void) | null = null;
  public onDurationChange: ((duration: number) => void) | null = null;
  public onVolumeChange: ((level: number) => void) | null = null;
  public onDataAvailable: ((data: Uint8Array) => void) | null = null;
  public onError: ((error: string) => void) | null = null;
  public onQualityChange: ((quality: RecordingQuality) => void) | null = null;
  public onSilenceDetected: (() => void) | null = null;
  
  private config: AudioRecorderConfig = {
    sampleRate: 44100,
    channelCount: 1,
    echoCancellation: true,
    noiseSuppression: true,
    autoStopSilenceDuration: 2000,
    minRecordingDuration: 1000,
    maxRecordingDuration: 15000
  };
  
  private silenceFrames: number = 0;
  private speechDetected: boolean = false;
  private volumeHistory: number[] = [];

  constructor(config?: Partial<AudioRecorderConfig>) {
    this.config = { ...this.config, ...config };
  }

  private async initAudioContext(stream: MediaStream) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    this.audioContext = new AudioContextClass();
    
    const source = this.audioContext.createMediaStreamSource(stream);
    
    this.filterNode = this.audioContext.createBiquadFilter();
    this.filterNode.type = 'highpass';
    this.filterNode.frequency.value = 80;
    
    this.gainNode = this.audioContext.createGain();
    this.gainNode.gain.value = 1;
    
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 256;
    const bufferLength = this.analyser.frequencyBinCount;
    this.dataArray = new Uint8Array(bufferLength);
    
    source.connect(this.filterNode);
    this.filterNode.connect(this.gainNode);
    this.gainNode.connect(this.analyser);
    this.analyser.connect(this.audioContext.destination);
    
    this.startVolumeAnalysis();
  }

  private startVolumeAnalysis() {
    const analyze = () => {
      if (!this.analyser || !this.dataArray || this.state !== 'recording') {
        this.animationId = requestAnimationFrame(analyze);
        return;
      }
      
      this.analyser.getByteFrequencyData(this.dataArray);
      
      const average = this.dataArray.reduce((a, b) => a + b, 0) / this.dataArray.length;
      this.volumeLevel = average / 255;
      
      this.volumeHistory.push(this.volumeLevel);
      if (this.volumeHistory.length > 30) {
        this.volumeHistory.shift();
      }
      
      this.updateQuality();
      this.checkSilence();
      
      this.onVolumeChange?.(this.volumeLevel);
      this.onDataAvailable?.(this.dataArray.slice());
      
      this.animationId = requestAnimationFrame(analyze);
    };
    analyze();
  }

  private updateQuality() {
    const avgVolume = this.volumeHistory.reduce((a, b) => a + b, 0) / Math.max(this.volumeHistory.length, 1);
    
    if (avgVolume < 0.1) {
      this.quality.volumeLevel = 'low';
    } else if (avgVolume > 0.7) {
      this.quality.volumeLevel = 'high';
    } else {
      this.quality.volumeLevel = 'normal';
    }
    
    const variance = this.volumeHistory.reduce((sum, v) => sum + Math.pow(v - avgVolume, 2), 0) / Math.max(this.volumeHistory.length, 1);
    this.quality.clarity = Math.round(Math.max(30, 100 - variance * 200));
    
    this.quality.hasSpeech = this.speechDetected;
    
    this.quality.issues = [];
    if (this.quality.volumeLevel === 'low') {
      this.quality.issues.push('音量过低');
    }
    if (this.quality.volumeLevel === 'high') {
      this.quality.issues.push('音量过高');
    }
    if (this.quality.clarity < 50) {
      this.quality.issues.push('声音不够清晰');
    }
    
    this.onQualityChange?.(this.quality);
  }

  private checkSilence() {
    const threshold = 0.05;
    const requiredSilenceFrames = Math.ceil(this.config.autoStopSilenceDuration! / 16);
    
    if (this.volumeLevel < threshold) {
      this.silenceFrames++;
    } else {
      this.silenceFrames = 0;
      if (this.volumeLevel > 0.1) {
        this.speechDetected = true;
      }
    }
    
    if (this.silenceFrames >= requiredSilenceFrames) {
      const elapsed = Date.now() - this.startTime;
      if (elapsed >= this.config.minRecordingDuration!) {
        this.onSilenceDetected?.();
        this.silenceFrames = 0;
      }
    }
  }

  private stopVolumeAnalysis() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  private startDurationTimer() {
    this.startTime = Date.now();
    this.duration = 0;
    
    const maxDuration = this.config.maxRecordingDuration!;
    
    this.durationTimer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
      this.duration = elapsed;
      this.onDurationChange?.(elapsed);
      
      if (Date.now() - this.startTime >= maxDuration) {
        this.stop().catch(() => {});
      }
    }, 1000);
  }

  private stopDurationTimer() {
    if (this.durationTimer) {
      clearInterval(this.durationTimer);
      this.durationTimer = null;
    }
  }

  async start(): Promise<void> {
    try {
      this.state = 'recording';
      this.onStateChange?.('recording');
      
      this.silenceFrames = 0;
      this.speechDetected = false;
      this.volumeHistory = [];
      this.quality = {
        volumeLevel: 'normal',
        clarity: 100,
        hasSpeech: false,
        issues: []
      };

      const constraints: MediaStreamConstraints = {
        audio: {
          sampleRate: this.config.sampleRate,
          channelCount: this.config.channelCount,
          echoCancellation: this.config.echoCancellation,
          noiseSuppression: this.config.noiseSuppression,
          autoGainControl: true,
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.stream = stream;

      await this.initAudioContext(stream);

      const options: MediaRecorderOptions = {};
      const mimeTypes = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/wav'];
      for (const type of mimeTypes) {
        if (MediaRecorder.isTypeSupported(type)) {
          options.mimeType = type;
          break;
        }
      }

      this.mediaRecorder = new MediaRecorder(stream, options);
      this.audioChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onerror = (event) => {
        this.state = 'error';
        this.onStateChange?.('error');
        this.onError?.(`录音错误: ${(event as any).error?.message || '未知错误'}`);
      };

      this.mediaRecorder.start(100);
      this.startDurationTimer();

    } catch (error) {
      this.state = 'error';
      this.onStateChange?.('error');
      const message = error instanceof Error ? error.message : '无法获取麦克风权限';
      this.onError?.(message);
    }
  }

  pause(): void {
    if (this.state !== 'recording') return;
    this.state = 'paused';
    this.onStateChange?.('paused');
    this.stopDurationTimer();
    this.mediaRecorder?.pause();
  }

  resume(): void {
    if (this.state !== 'paused') return;
    this.state = 'recording';
    this.onStateChange?.('recording');
    this.startDurationTimer();
    this.mediaRecorder?.resume();
  }

  stop(): Promise<Recording> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder || this.state === 'idle' || this.state === 'stopped') {
        reject(new Error('未在录音中'));
        return;
      }

      this.mediaRecorder.onstop = async () => {
        this.state = 'stopped';
        this.onStateChange?.('stopped');
        this.stopDurationTimer();
        this.stopVolumeAnalysis();

        if (this.stream) {
          this.stream.getTracks().forEach(track => track.stop());
          this.stream = null;
        }

        if (this.audioContext) {
          await this.audioContext.close();
          this.audioContext = null;
        }

        const blob = new Blob(this.audioChunks, { type: 'audio/wav' });
        const url = URL.createObjectURL(blob);
        const recording: Recording = {
          id: Date.now().toString(),
          blob,
          url,
          duration: this.duration,
          timestamp: new Date(),
          quality: { ...this.quality }
        };

        resolve(recording);
      };

      this.mediaRecorder.stop();
    });
  }

  destroy(): void {
    this.stopDurationTimer();
    this.stopVolumeAnalysis();
    
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    
    if (this.audioContext) {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }
  }
}

export class WavEncoder {
  static toWavBuffer(audioData: Float32Array, sampleRate: number = 44100): ArrayBuffer {
    const buffer = new ArrayBuffer(44 + audioData.length * 2);
    const view = new DataView(buffer);

    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    const writeUint32 = (offset: number, value: number) => {
      view.setUint32(offset, value, true);
    };

    const writeUint16 = (offset: number, value: number) => {
      view.setUint16(offset, value, true);
    };

    writeString(0, 'RIFF');
    writeUint32(4, 36 + audioData.length * 2);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    writeUint32(16, 16);
    writeUint16(20, 1);
    writeUint16(22, 1);
    writeUint32(24, sampleRate);
    writeUint32(28, sampleRate * 2);
    writeUint16(32, 2);
    writeUint16(34, 16);
    writeString(36, 'data');
    writeUint32(40, audioData.length * 2);

    for (let i = 0; i < audioData.length; i++) {
      const s = Math.max(-1, Math.min(1, audioData[i]));
      view.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }

    return buffer;
  }

  static async download(wavBuffer: ArrayBuffer, filename: string = 'recording.wav') {
    const blob = new Blob([wavBuffer], { type: 'audio/wav' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
}