export interface AudioComparisonResult {
  similarity: number;
  durationMatch: number;
  volumeMatch: number;
  timestamps: number[];
  recommendations: string[];
  recognizedText?: string;
}

export class AudioComparator {
  private sampleRate = 44100;

  private async recognizeSpeech(audioBlob: Blob): Promise<string> {
    return new Promise((resolve) => {
      const SpeechRecognition = (window as any).SpeechRecognition || 
                                (window as any).webkitSpeechRecognition;
      
      if (!SpeechRecognition) {
        resolve('');
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognition.lang = 'en-US';

      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      audio.onloadedmetadata = () => {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const audioContext = new AudioContextClass();
        
        audioContext.decodeAudioData(audioBlob.arrayBuffer()).then((audioBuffer) => {
          const source = audioContext.createBufferSource();
          source.buffer = audioBuffer;
          
          const mediaStreamDestination = audioContext.createMediaStreamDestination();
          source.connect(mediaStreamDestination);
          
          const stream = mediaStreamDestination.stream;
          (recognition as any).stream = stream;
          
          recognition.start();
        }).catch(() => {
          URL.revokeObjectURL(audioUrl);
          resolve('');
        });
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0]?.transcript || '';
        URL.revokeObjectURL(audioUrl);
        resolve(transcript.trim());
      };

      recognition.onerror = () => {
        URL.revokeObjectURL(audioUrl);
        resolve('');
      };

      recognition.onend = () => {
        URL.revokeObjectURL(audioUrl);
      };
    });
  }

  private calculateTextSimilarity(str1: string, str2: string): number {
    const s1 = str1.toLowerCase().trim();
    const s2 = str2.toLowerCase().trim();
    
    if (s1 === s2) return 1;
    if (s1.length === 0 || s2.length === 0) return 0;

    const len1 = s1.length;
    const len2 = s2.length;
    const maxLen = Math.max(len1, len2);

    const matrix: number[][] = [];
    for (let i = 0; i <= len1; i++) matrix[i] = [i];
    for (let j = 0; j <= len2; j++) matrix[0][j] = j;

    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost
        );
      }
    }

    return 1 - matrix[len1][len2] / maxLen;
  }

  async compareAudio(
    userAudioUrl: string,
    referenceAudioUrl?: string,
    targetText?: string
  ): Promise<AudioComparisonResult> {
    try {
      const userAudioData = await this.loadAudio(userAudioUrl);
      const userBlob = await fetch(userAudioUrl).then(r => r.blob());
      
      let recognizedText = '';
      if (targetText) {
        recognizedText = await this.recognizeSpeech(userBlob);
      }
      
      let referenceAudioData: AudioBuffer | null = null;
      if (referenceAudioUrl) {
        try {
          referenceAudioData = await this.loadAudio(referenceAudioUrl);
        } catch {
          referenceAudioData = null;
        }
      }

      const userSamples = this.normalizeAudio(userAudioData);
      let similarity = 0.3;
      
      if (recognizedText && targetText) {
        similarity = this.calculateTextSimilarity(recognizedText, targetText);
      } else if (referenceAudioData) {
        const refSamples = this.normalizeAudio(referenceAudioData);
        similarity = this.calculateWaveformSimilarity(userSamples, refSamples);
      } else if (targetText) {
        similarity = this.estimateSimilarityFromText(targetText, userAudioData.duration);
      }

      const durationMatch = referenceAudioData
        ? this.calculateDurationMatch(userAudioData.duration, referenceAudioData.duration)
        : 0.7;

      const volumeMatch = this.analyzeVolumeConsistency(userSamples);

      const recommendations = this.generateRecommendations(similarity, durationMatch, volumeMatch, recognizedText, targetText);
      const timestamps = this.findSignificantPoints(userSamples);

      return {
        similarity: Math.round(similarity * 100),
        durationMatch: Math.round(durationMatch * 100),
        volumeMatch: Math.round(volumeMatch * 100),
        timestamps,
        recommendations,
        recognizedText
      };
    } catch (error) {
      console.error('Audio comparison error:', error);
      return {
        similarity: 0,
        durationMatch: 0,
        volumeMatch: 0,
        timestamps: [],
        recommendations: ['音频分析失败，请重试']
      };
    }
  }

  private async loadAudio(url: string): Promise<AudioBuffer> {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    const audioContext = new AudioContextClass();
    
    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      await audioContext.close();
      return audioBuffer;
    } catch {
      await audioContext.close();
      throw new Error('无法加载音频');
    }
  }

  private normalizeAudio(audioBuffer: AudioBuffer): Float32Array {
    const channelData = audioBuffer.getChannelData(0);
    const targetLength = Math.min(channelData.length, this.sampleRate * 10);
    const normalized = new Float32Array(targetLength);
    
    for (let i = 0; i < targetLength; i++) {
      const index = Math.floor(i * channelData.length / targetLength);
      normalized[i] = channelData[index];
    }
    
    return this.normalizeArray(normalized);
  }

  private normalizeArray(arr: Float32Array): Float32Array {
    const result = new Float32Array(arr.length);
    let max = 0;
    for (let i = 0; i < arr.length; i++) {
      max = Math.max(max, Math.abs(arr[i]));
    }
    if (max > 0) {
      for (let i = 0; i < arr.length; i++) {
        result[i] = arr[i] / max;
      }
    }
    return result;
  }

  private calculateWaveformSimilarity(a: Float32Array, b: Float32Array): number {
    const minLength = Math.min(a.length, b.length);
    let sum = 0;
    
    for (let i = 0; i < minLength; i++) {
      const diff = Math.abs(a[i] - b[i]);
      sum += diff;
    }
    
    const avgDiff = sum / minLength;
    const similarity = 1 - Math.min(avgDiff, 1);
    
    return Math.max(0, Math.min(1, similarity * 0.7 + 0.3));
  }

  private estimateSimilarityFromText(text: string, duration: number): number {
    const wordCount = text.split(/\s+/).length;
    const expectedDuration = wordCount * 0.5;
    const durationFactor = Math.max(0.5, 1 - Math.abs(duration - expectedDuration) / expectedDuration);
    
    if (duration < 1) return 0.3;
    if (duration < 2) return 0.5;
    if (duration < 5) return 0.7;
    
    return Math.min(0.9, durationFactor * 0.8 + 0.2);
  }

  private calculateDurationMatch(userDuration: number, refDuration: number): number {
    const ratio = Math.min(userDuration, refDuration) / Math.max(userDuration, refDuration);
    return ratio;
  }

  private analyzeVolumeConsistency(samples: Float32Array): number {
    const windowSize = Math.floor(samples.length / 10);
    const volumes: number[] = [];
    
    for (let i = 0; i < 10; i++) {
      let sum = 0;
      const start = i * windowSize;
      for (let j = 0; j < windowSize; j++) {
        sum += Math.abs(samples[start + j]);
      }
      volumes.push(sum / windowSize);
    }
    
    const avgVolume = volumes.reduce((a, b) => a + b, 0) / volumes.length;
    const variance = volumes.reduce((sum, v) => sum + Math.pow(v - avgVolume, 2), 0) / volumes.length;
    const stdDev = Math.sqrt(variance);
    
    return Math.max(0, 1 - stdDev * 2);
  }

  private findSignificantPoints(samples: Float32Array): number[] {
    const points: number[] = [];
    const threshold = 0.3;
    const minGap = samples.length / 20;
    let lastPoint = -minGap;
    
    for (let i = 1; i < samples.length - 1; i++) {
      const current = Math.abs(samples[i]);
      const prev = Math.abs(samples[i - 1]);
      const next = Math.abs(samples[i + 1]);
      
      if (current > threshold && current > prev && current > next && i - lastPoint > minGap) {
        points.push(i / samples.length);
        lastPoint = i;
      }
    }
    
    return points;
  }

  private generateRecommendations(
    similarity: number,
    durationMatch: number,
    volumeMatch: number,
    recognizedText?: string,
    targetText?: string
  ): string[] {
    const recommendations: string[] = [];
    
    if (recognizedText && targetText) {
      recommendations.push(`你说的是: "${recognizedText}"`);
    }
    
    if (similarity < 0.4) {
      recommendations.push('识别结果与目标差异较大，请尝试更清晰地朗读');
    } else if (similarity < 0.6) {
      recommendations.push('发音差异较大，请多听几遍标准发音');
    } else if (similarity < 0.8) {
      recommendations.push('不错！注意某些音节的准确性');
    } else {
      recommendations.push('太棒了！发音非常标准');
    }
    
    if (durationMatch < 0.5) {
      recommendations.push('语速差异较大，请保持与范例相似的节奏');
    }
    
    if (volumeMatch < 0.5) {
      recommendations.push('音量不够稳定，建议保持适中音量');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('发音很好，继续保持！');
    }
    
    return recommendations;
  }
}
