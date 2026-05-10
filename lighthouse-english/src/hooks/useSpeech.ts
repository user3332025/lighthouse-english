import { useCallback, useState, useEffect } from 'react';

function selectFemaleVoice(): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis.getVoices();
  const enUsVoices = voices.filter(v => v.lang === 'en-US');
  if (enUsVoices.length === 0) {
    return voices.find(v => v.lang.startsWith('en'));
  }

  // 女声优先级（从最高质量到低质量）
  const femalePriority = [
    // Google 高质量语音
    { keywords: ['google us english'], score: 100 },
    { keywords: ['google us english female'], score: 100 },
    // Microsoft 高质量语音
    { keywords: ['microsoft aria', 'microsoft jenny', 'microsoft sara', 'microsoft zira'], score: 90 },
    // Apple 增强版语音
    { keywords: ['samantha (enhanced)', 'victoria (enhanced)'], score: 85 },
    // Apple 标准版语音
    { keywords: ['samantha', 'victoria', 'tessa', 'serena'], score: 80 },
    // 其他高质量女声
    { keywords: ['kate', 'susan', 'allison', 'karen'], score: 70 },
    // 通用女声标识
    { keywords: ['female', 'woman'], score: 50 },
  ];

  // 按优先级选择女声
  for (const group of femalePriority) {
    for (const kw of group.keywords) {
      const voice = enUsVoices.find(v => v.name.toLowerCase().includes(kw.toLowerCase()));
      if (voice) {
        return voice;
      }
    }
  }

  // 排除男声
  const maleKeywords = ['male', 'man', 'alex', 'daniel', 'fred', 'george', 'microsoft david', 'microsoft mark'];
  const nonMaleVoices = enUsVoices.filter(v => 
    !maleKeywords.some(kw => v.name.toLowerCase().includes(kw.toLowerCase()))
  );
  if (nonMaleVoices.length > 0) {
    return nonMaleVoices[0];
  }

  // 如果没找到，返回默认的 en-US 语音
  const defaultVoice = enUsVoices.find(v => v.default);
  return defaultVoice || enUsVoices[0];
}

export function useSpeech() {
  const [voicesLoaded, setVoicesLoaded] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    
    const loadVoices = () => {
      window.speechSynthesis.getVoices();
      setVoicesLoaded(true);
    };

    loadVoices();
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
    
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
    };
  }, []);

  const speak = useCallback((text: string) => {
    if (!('speechSynthesis' in window)) {
      return;
    }

    window.speechSynthesis.cancel();
    
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-US';
    u.rate = 0.9;
    u.pitch = 1;
    u.volume = 1;
    
    const selectedVoice = selectFemaleVoice();
    if (selectedVoice) {
      u.voice = selectedVoice;
    }
    
    u.onerror = (event) => {
      console.error('语音错误:', event.error);
    };
    
    window.speechSynthesis.speak(u);
  }, []);

  const speakChinese = useCallback((text: string) => {
    if (!('speechSynthesis' in window)) {
      return;
    }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'zh-CN';
    u.rate = 0.9;
    window.speechSynthesis.speak(u);
  }, []);

  const speakEnglish = useCallback((text: string) => {
    speak(text);
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
    voicesLoaded,
  };
}
