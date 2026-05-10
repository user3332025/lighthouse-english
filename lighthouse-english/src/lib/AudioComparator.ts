export interface AudioComparisonResult {
  similarity: number;
  durationMatch: number;
  volumeMatch: number;
  timestamps: number[];
  recommendations: string[];
  recognizedText?: string;
  pronunciationScore?: number;
  fluencyScore?: number;
}

export interface RecognitionConfig {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
  maxAlternatives?: number;
}

export class AudioComparator {
  private sampleRate = 44100;
  private recognitionConfig: RecognitionConfig = {
    language: 'en-US',
    continuous: false,
    interimResults: false,
    maxAlternatives: 3
  };

  constructor(config?: Partial<RecognitionConfig>) {
    this.recognitionConfig = { ...this.recognitionConfig, ...config };
  }

  private async recognizeSpeech(audioBlob: Blob): Promise<string> {
    return new Promise((resolve) => {
      const SpeechRecognition = (window as any).SpeechRecognition || 
                                (window as any).webkitSpeechRecognition;
      
      if (!SpeechRecognition) {
        resolve('');
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = this.recognitionConfig.continuous!;
      recognition.interimResults = this.recognitionConfig.interimResults!;
      recognition.maxAlternatives = this.recognitionConfig.maxAlternatives!;
      recognition.lang = this.recognitionConfig.language!;
      recognition.timeout = 5000;

      recognition.onresult = (event: any) => {
        let bestTranscript = '';
        let highestConfidence = 0;
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          for (let j = 0; j < result.length; j++) {
            const transcript = result[j].transcript;
            const confidence = result[j].confidence || 0;
            
            if (confidence > highestConfidence) {
              highestConfidence = confidence;
              bestTranscript = transcript;
            }
          }
        }
        
        resolve(bestTranscript.trim());
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        resolve('');
      };

      recognition.onend = () => {
        // 识别结束但没有结果时也返回空字符串
      };

      const audioUrl = URL.createObjectURL(audioBlob);
      
      fetch(audioUrl)
        .then(response => response.arrayBuffer())
        .then(arrayBuffer => {
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          const audioContext = new AudioContextClass();
          
          audioContext.decodeAudioData(arrayBuffer)
            .then((audioBuffer: AudioBuffer) => {
              const source = audioContext.createBufferSource();
              source.buffer = audioBuffer;
              
              const mediaStreamDestination = audioContext.createMediaStreamDestination();
              source.connect(mediaStreamDestination);
              
              const stream = mediaStreamDestination.stream;
              (recognition as any).stream = stream;
              
              recognition.start();
              
              source.start();
            })
            .catch(() => {
              URL.revokeObjectURL(audioUrl);
              audioContext.close();
              resolve('');
            });
        })
        .catch(() => {
          URL.revokeObjectURL(audioUrl);
          resolve('');
        });
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

  private calculateWordSimilarity(str1: string, str2: string): number {
    const words1 = str1.toLowerCase().trim().split(/\s+/).filter(w => w.length > 0);
    const words2 = str2.toLowerCase().trim().split(/\s+/).filter(w => w.length > 0);
    
    if (words1.length === 0 || words2.length === 0) return 0;
    
    const matchedWords = new Set<string>();
    
    for (const word1 of words1) {
      for (const word2 of words2) {
        if (this.calculateTextSimilarity(word1, word2) >= 0.8) {
          matchedWords.add(word1);
        }
      }
    }
    
    const precision = matchedWords.size / words1.length;
    const recall = matchedWords.size / words2.length;
    
    if (precision + recall === 0) return 0;
    
    return 2 * precision * recall / (precision + recall);
  }

  private calculateWeightedSimilarity(recognizedText: string, targetText: string): number {
    const exactMatch = this.calculateTextSimilarity(recognizedText, targetText);
    const wordMatch = this.calculateWordSimilarity(recognizedText, targetText);
    
    return (exactMatch * 0.6 + wordMatch * 0.4);
  }

  private analyzePronunciationQuality(audioBuffer: AudioBuffer): number {
    const channelData = audioBuffer.getChannelData(0);
    let totalEnergy = 0;
    let zeroCrossings = 0;
    
    for (let i = 0; i < channelData.length; i++) {
      totalEnergy += channelData[i] * channelData[i];
      if (i > 0) {
        if (channelData[i] * channelData[i - 1] < 0) {
          zeroCrossings++;
        }
      }
    }
    
    const avgEnergy = totalEnergy / channelData.length;
    const avgZeroCrossings = zeroCrossings / (channelData.length - 1);
    
    const energyScore = Math.min(1, avgEnergy * 1000);
    const clarityScore = Math.min(1, avgZeroCrossings * 2000);
    
    return Math.round(((energyScore + clarityScore) / 2) * 100);
  }

  private analyzeFluency(audioBuffer: AudioBuffer, targetText: string): number {
    const duration = audioBuffer.duration;
    const wordCount = targetText.split(/\s+/).length;
    const expectedDuration = Math.max(wordCount * 0.4, 0.5);
    
    const durationRatio = Math.min(1, duration / expectedDuration);
    const normalizedDuration = Math.abs(duration - expectedDuration) / expectedDuration;
    const durationScore = Math.max(0, 1 - normalizedDuration);
    
    return Math.round(((durationRatio + durationScore) / 2) * 100);
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
        similarity = this.calculateWeightedSimilarity(recognizedText, targetText);
      } else if (referenceAudioData) {
        const refSamples = this.normalizeAudio(referenceAudioData);
        similarity = this.calculateWaveformSimilarity(userSamples, refSamples);
      } else if (targetText) {
        similarity = this.estimateSimilarityFromText(targetText, userAudioData.duration);
      }

      const pronunciationScore = this.analyzePronunciationQuality(userAudioData);
      const fluencyScore = targetText ? this.analyzeFluency(userAudioData, targetText) : undefined;

      const durationMatch = referenceAudioData
        ? this.calculateDurationMatch(userAudioData.duration, referenceAudioData.duration)
        : targetText ? this.calculateDurationMatch(userAudioData.duration, targetText.split(/\s+/).length * 0.5) : 0.7;

      const volumeMatch = this.analyzeVolumeConsistency(userSamples);

      const recommendations = this.generateRecommendations(
        similarity, 
        durationMatch, 
        volumeMatch, 
        recognizedText, 
        targetText,
        pronunciationScore,
        fluencyScore
      );
      const timestamps = this.findSignificantPoints(userSamples);

      return {
        similarity: Math.round(similarity * 100),
        durationMatch: Math.round(durationMatch * 100),
        volumeMatch: Math.round(volumeMatch * 100),
        timestamps,
        recommendations,
        recognizedText,
        pronunciationScore,
        fluencyScore
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
    
    if (duration < 0.5) return 0.2;
    if (duration < 1) return 0.4;
    if (duration < 3) return 0.6;
    
    return Math.min(0.85, durationFactor * 0.8 + 0.2);
  }

  private calculateDurationMatch(userDuration: number, refDuration: number): number {
    const ratio = Math.min(userDuration, refDuration) / Math.max(userDuration, refDuration);
    return Math.max(0.3, ratio);
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
    
    return Math.max(0, Math.min(1, 1 - stdDev * 2));
  }

  private findSignificantPoints(samples: Float32Array): number[] {
    const points: number[] = [];
    const threshold = 0.25;
    const minGap = samples.length / 20;
    let lastPoint = -minGap;
    let inSpeech = false;
    
    for (let i = 1; i < samples.length - 1; i++) {
      const current = Math.abs(samples[i]);
      const prev = Math.abs(samples[i - 1]);
      const next = Math.abs(samples[i + 1]);
      
      if (current > threshold && current > prev && current > next && i - lastPoint > minGap) {
        if (!inSpeech) {
          points.push(i / samples.length);
          inSpeech = true;
        }
        lastPoint = i;
      } else if (current < threshold * 0.5) {
        inSpeech = false;
      }
    }
    
    return points.slice(0, 10);
  }

  private generateRecommendations(
    similarity: number,
    durationMatch: number,
    volumeMatch: number,
    recognizedText?: string,
    targetText?: string,
    pronunciationScore?: number,
    fluencyScore?: number
  ): string[] {
    const recommendations: string[] = [];
    
    if (recognizedText && targetText) {
      recommendations.push(`你说的是: "${recognizedText}"`);
    }
    
    if (similarity < 0.3) {
      recommendations.push('没有识别到有效语音，请靠近麦克风清晰朗读');
    } else if (similarity < 0.5) {
      recommendations.push('识别结果与目标差异较大，请尝试更清晰地朗读');
    } else if (similarity < 0.7) {
      recommendations.push('发音有一些差异，注意某些音节的准确性');
    } else if (similarity < 0.85) {
      recommendations.push('不错！继续努力，发音会越来越标准');
    } else {
      recommendations.push('太棒了！发音非常标准！');
    }
    
    if (pronunciationScore !== undefined && pronunciationScore < 60) {
      recommendations.push('语音清晰度较低，建议提高音量或在安静环境中录制');
    }
    
    if (fluencyScore !== undefined && fluencyScore < 50) {
      recommendations.push('语速不太稳定，尽量保持均匀的节奏');
    }
    
    if (durationMatch < 0.4) {
      recommendations.push('语速与目标差异较大，请调整朗读速度');
    } else if (durationMatch < 0.6) {
      recommendations.push('语速接近目标，再调整一下节奏');
    }
    
    if (volumeMatch < 0.4) {
      recommendations.push('音量不够稳定，建议保持适中音量');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('发音很好，继续保持！');
    }
    
    return recommendations;
  }
}