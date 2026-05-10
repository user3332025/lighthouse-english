export type RecordingState = 'idle' | 'recording' | 'paused' | 'stopped' | 'error';

export interface Recording {
  id: string;
  blob: Blob;
  url: string;
  duration: number;
  timestamp: Date;
  targetText?: string;
  similarity?: number;
}

export class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private dataArray: Uint8Array | null = null;
  private animationId: number | null = null;
  private startTime: number = 0;
  private durationTimer: NodeJS.Timeout | null = null;
  
  public state: RecordingState = 'idle';
  public duration: number = 0;
  public volumeLevel: number = 0;
  public onStateChange: ((state: RecordingState) => void) | null = null;
  public onDurationChange: ((duration: number) => void) | null = null;
  public onVolumeChange: ((level: number) => void) | null = null;
  public onDataAvailable: ((data: Uint8Array) => void) | null = null;
  public onError: ((error: string) => void) | null = null;

  constructor() {}

  private async initAudioContext(stream: MediaStream) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    this.audioContext = new AudioContextClass();
    const source = this.audioContext.createMediaStreamSource(stream);
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 256;
    const bufferLength = this.analyser.frequencyBinCount;
    this.dataArray = new Uint8Array(bufferLength);
    source.connect(this.analyser);
    this.startVolumeAnalysis();
  }

  private startVolumeAnalysis() {
    const analyze = () => {
      if (this.analyser && this.dataArray && this.state === 'recording') {
        this.analyser.getByteFrequencyData(this.dataArray);
        const average = this.dataArray.reduce((a, b) => a + b, 0) / this.dataArray.length;
        this.volumeLevel = average / 255;
        this.onVolumeChange?.(this.volumeLevel);
        this.onDataAvailable?.(this.dataArray.slice());
      }
      this.animationId = requestAnimationFrame(analyze);
    };
    analyze();
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
    this.durationTimer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
      this.duration = elapsed;
      this.onDurationChange?.(elapsed);
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

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 44100,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        }
      });
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
