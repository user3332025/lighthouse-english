import { useCallback, useRef, useEffect, useState } from 'react';
import { isSpeechUnlockedFromUserGesture, requestSpeakWhenUnlocked } from '@/lib/speechUnlock';

/** 朗读生命周期（用于自动播完再录音等流程） */
export type SpeakEvents = {
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (ev: SpeechSynthesisErrorEvent) => void;
};

/** 语音性别类型 */
export type VoiceGender = 'female' | 'male';

/** 选择 en-US 女声 */
function selectFemaleVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | undefined {
  const enUsVoices = voices.filter(voice => voice.lang === 'en-US');
  if (enUsVoices.length === 0) {
    return voices.find(voice => voice.lang.startsWith('en'));
  }
  
  // 常见女声关键词（按优先级排序）
  const femaleKeywords = [
    'samantha', 'victoria', 'tessa', 'serena', 'kate', 'susan', 'zira', 'allison', 'aria', 'sara', 'karen', 'mary', 'linda', 'patricia', 'jennifer',
    'google us english', 'google uk english female',
    'microsoft zira', 'microsoft sara', 'microsoft jenny', 'microsoft aria',
    'samantha (enhanced)', 'victoria (enhanced)',
    'female', 'woman'
  ];
  
  // 优先选带女声关键词的
  for (const keyword of femaleKeywords) {
    const voice = enUsVoices.find(v => 
      v.name.toLowerCase().includes(keyword.toLowerCase())
    );
    if (voice) return voice;
  }
  
  // 尝试排除明显的男声
  const maleKeywords = ['male', 'man', 'alex', 'daniel', 'fred', 'george', 'microsoft david', 'microsoft mark'];
  const nonMaleEnUsVoices = enUsVoices.filter(v => 
    !maleKeywords.some(keyword => v.name.toLowerCase().includes(keyword.toLowerCase()))
  );
  
  if (nonMaleEnUsVoices.length > 0) {
    return nonMaleEnUsVoices[0];
  }
  
  // 其次选默认的 en-US 语音
  const defaultVoice = enUsVoices.find(v => v.default);
  if (defaultVoice) return defaultVoice;
  
  // 最后返回第一个 en-US 语音
  return enUsVoices[0];
}

/** 选择 en-US 男声 */
function selectMaleVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | undefined {
  const enUsVoices = voices.filter(voice => voice.lang === 'en-US');
  if (enUsVoices.length === 0) {
    return voices.find(voice => voice.lang.startsWith('en'));
  }
  
  // 常见男声关键词（按优先级排序）
  const maleKeywords = [
    'male', 'man', 'alex', 'daniel', 'fred', 'george',
    'microsoft david', 'microsoft mark', 'microsoft zack',
    'google us english male', 'google uk english male',
    'sam', 'tom', 'mike', 'john', 'robert', 'william', 'david', 'richard'
  ];
  
  // 优先选带男声关键词的
  for (const keyword of maleKeywords) {
    const voice = enUsVoices.find(v => 
      v.name.toLowerCase().includes(keyword.toLowerCase())
    );
    if (voice) return voice;
  }
  
  // 尝试排除明显的女声
  const femaleKeywords = ['female', 'woman', 'samantha', 'victoria', 'zira', 'allison', 'aria', 'sara'];
  const nonFemaleEnUsVoices = enUsVoices.filter(v => 
    !femaleKeywords.some(keyword => v.name.toLowerCase().includes(keyword.toLowerCase()))
  );
  
  if (nonFemaleEnUsVoices.length > 0) {
    return nonFemaleEnUsVoices[0];
  }
  
  // 其次选默认的 en-US 语音
  const defaultVoice = enUsVoices.find(v => v.default);
  if (defaultVoice) return defaultVoice;
  
  // 最后返回第一个 en-US 语音
  return enUsVoices[0];
}

export function useSpeech() {
  const synthRef = useRef<SpeechSynthesis | null>(null);
  // 默认使用女声
  const [voiceGender, setVoiceGender] = useState<VoiceGender>('female');

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    synthRef.current = window.speechSynthesis;
    synthRef.current.getVoices();
    
    const onVoicesChanged = () => {
      synthRef.current?.getVoices();
    };
    synthRef.current.addEventListener('voiceschanged', onVoicesChanged);

    return () => {
      synthRef.current?.removeEventListener('voiceschanged', onVoicesChanged);
    };
  }, []);

  /** 根据当前设置选择语音 */
  const selectVoice = useCallback((voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | undefined => {
    if (voiceGender === 'female') {
      return selectFemaleVoice(voices);
    } else {
      return selectMaleVoice(voices);
    }
  }, [voiceGender]);

  const speak = useCallback((text: string, _lang: string = 'en-US', events?: SpeakEvents) => {
    const runSpeak = () => {
      if (!('speechSynthesis' in window)) return;
      
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'en-US';
      u.rate = 0.9;
      
      // 根据当前性别选择语音
      const voices = window.speechSynthesis.getVoices();
      const selectedVoice = selectVoice(voices);
      if (selectedVoice) {
        u.voice = selectedVoice;
      }
      
      if (events?.onStart) u.onstart = events.onStart;
      if (events?.onEnd) u.onend = events.onEnd;
      if (events?.onError) u.onerror = events.onError;
      
      window.speechSynthesis.speak(u);
    };

    if (isSpeechUnlockedFromUserGesture()) {
      runSpeak();
    } else {
      requestSpeakWhenUnlocked(runSpeak);
    }
  }, [selectVoice]);

  const speakChinese = useCallback((text: string, events?: SpeakEvents) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'zh-CN';
    u.rate = 0.9;
    if (events?.onStart) u.onstart = events.onStart;
    if (events?.onEnd) u.onend = events.onEnd;
    if (events?.onError) u.onerror = events.onError;
    window.speechSynthesis.speak(u);
  }, []);

  const speakEnglish = useCallback((text: string, events?: SpeakEvents) => {
    speak(text, 'en-US', events);
  }, [speak]);

  const stop = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }, []);

  /** 切换语音性别 */
  const toggleVoiceGender = useCallback(() => {
    setVoiceGender(prev => prev === 'female' ? 'male' : 'female');
  }, []);

  return {
    speak,
    speakChinese,
    speakEnglish,
    stop,
    isSupported: typeof window !== 'undefined' && 'speechSynthesis' in window,
    voiceGender,
    setVoiceGender,
    toggleVoiceGender,
  };
}
