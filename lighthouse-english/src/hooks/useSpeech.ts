import { useCallback, useRef, useEffect } from 'react';
import { isSpeechUnlockedFromUserGesture, requestSpeakWhenUnlocked } from '@/lib/speechUnlock';

/** 朗读生命周期（用于自动播完再录音等流程） */
export type SpeakEvents = {
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (ev: SpeechSynthesisErrorEvent) => void;
};

/** 优先选择 en-US 女声 */
function selectFemaleVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | undefined {
  console.log('Available voices:', voices.map(v => ({ name: v.name, lang: v.lang, default: v.default })));
  
  const enUsVoices = voices.filter(voice => voice.lang === 'en-US');
  console.log('en-US voices:', enUsVoices.map(v => ({ name: v.name, default: v.default })));
  
  if (enUsVoices.length === 0) {
    console.log('No en-US voices found, falling back to English voices');
    return voices.find(voice => voice.lang.startsWith('en'));
  }
  
  // 常见女声关键词（按优先级排序）
  const femaleKeywords = [
    // 常见的女声名字
    'samantha', 'victoria', 'tessa', 'serena', 'kate', 'susan', 'zira', 'allison', 'aria', 'sara', 'karen', 'mary', 'linda', 'patricia', 'jennifer',
    // Google voices
    'google us english', 'google uk english female', 'google deutsch female',
    // Microsoft voices
    'microsoft zira', 'microsoft sara', 'microsoft jenny', 'microsoft aria',
    // Apple voices
    'samantha (enhanced)', 'victoria (enhanced)',
    // Generic female indicators
    'female', 'woman'
  ];
  
  // 优先选带女声关键词的
  for (const keyword of femaleKeywords) {
    const voice = enUsVoices.find(v => 
      v.name.toLowerCase().includes(keyword.toLowerCase())
    );
    if (voice) {
      console.log('Selected female voice:', voice.name);
      return voice;
    }
  }
  
  // 尝试排除明显的男声
  const maleKeywords = ['male', 'man', 'alex', 'daniel', 'fred', 'george', 'microsoft david', 'microsoft mark'];
  const nonMaleEnUsVoices = enUsVoices.filter(v => 
    !maleKeywords.some(keyword => v.name.toLowerCase().includes(keyword.toLowerCase()))
  );
  
  if (nonMaleEnUsVoices.length > 0) {
    console.log('Selected non-male voice:', nonMaleEnUsVoices[0].name);
    return nonMaleEnUsVoices[0];
  }
  
  // 其次选默认的 en-US 语音
  const defaultVoice = enUsVoices.find(v => v.default);
  if (defaultVoice) {
    console.log('Selected default voice:', defaultVoice.name);
    return defaultVoice;
  }
  
  // 最后返回第一个 en-US 语音
  console.log('Selected first en-US voice:', enUsVoices[0].name);
  return enUsVoices[0];
}

export function useSpeech() {
  const synthRef = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    synthRef.current = window.speechSynthesis;
    // 预加载 voices 列表
    synthRef.current.getVoices();
    
    const onVoicesChanged = () => {
      synthRef.current?.getVoices();
    };
    synthRef.current.addEventListener('voiceschanged', onVoicesChanged);

    return () => {
      synthRef.current?.removeEventListener('voiceschanged', onVoicesChanged);
    };
  }, []);

  const speak = useCallback((text: string, _lang: string = 'en-US', events?: SpeakEvents) => {
    const runSpeak = () => {
      if (!('speechSynthesis' in window)) return;
      
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'en-US';
      u.rate = 0.9;
      
      // 选择女声
      const voices = window.speechSynthesis.getVoices();
      const femaleVoice = selectFemaleVoice(voices);
      if (femaleVoice) {
        u.voice = femaleVoice;
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
  }, []);

  const speakChinese = useCallback((text: string, events?: SpeakEvents) => {
    // 中文保持原样
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

  return {
    speak,
    speakChinese,
    speakEnglish,
    stop,
    isSupported: typeof window !== 'undefined' && 'speechSynthesis' in window,
  };
}
