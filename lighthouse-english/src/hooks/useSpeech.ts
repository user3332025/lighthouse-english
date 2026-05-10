import { useCallback, useState, useEffect } from 'react';

export type VoiceGender = 'female' | 'male';

function selectVoice(gender: VoiceGender): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis.getVoices();
  const enUsVoices = voices.filter(v => v.lang === 'en-US');
  if (enUsVoices.length === 0) {
    return voices.find(v => v.lang.startsWith('en'));
  }

  const femaleKeywords = ['female', 'woman', 'samantha', 'victoria', 'tessa', 'serena', 'kate', 'susan', 'zira', 'allison', 'aria', 'sara', 'google us english', 'microsoft zira', 'microsoft sara'];
  const maleKeywords = ['male', 'man', 'alex', 'daniel', 'fred', 'george', 'microsoft david', 'microsoft mark', 'google us english male'];

  if (gender === 'female') {
    for (const kw of femaleKeywords) {
      const voice = enUsVoices.find(v => v.name.toLowerCase().includes(kw.toLowerCase()));
      if (voice) return voice;
    }
    const nonMale = enUsVoices.filter(v => !maleKeywords.some(kw => v.name.toLowerCase().includes(kw.toLowerCase())));
    if (nonMale.length > 0) return nonMale[0];
  } else {
    for (const kw of maleKeywords) {
      const voice = enUsVoices.find(v => v.name.toLowerCase().includes(kw.toLowerCase()));
      if (voice) return voice;
    }
    const nonFemale = enUsVoices.filter(v => !femaleKeywords.some(kw => v.name.toLowerCase().includes(kw.toLowerCase())));
    if (nonFemale.length > 0) return nonFemale[0];
  }
  
  const def = enUsVoices.find(v => v.default);
  return def || enUsVoices[0];
}

export function useSpeech() {
  const [voiceGender, setVoiceGender] = useState<VoiceGender>('female');
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
      console.log('浏览器不支持语音合成');
      return;
    }

    window.speechSynthesis.cancel();
    
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-US';
    u.rate = 0.9;
    u.pitch = 1;
    u.volume = 1;
    
    const selectedVoice = selectVoice(voiceGender);
    if (selectedVoice) {
      u.voice = selectedVoice;
      console.log('使用语音:', selectedVoice.name);
    }
    
    u.onerror = (event) => {
      console.error('语音错误:', event.error);
      // 降级：不指定语音，只使用语言设置
      const fallbackU = new SpeechSynthesisUtterance(text);
      fallbackU.lang = 'en-US';
      fallbackU.rate = 0.9;
      window.speechSynthesis.speak(fallbackU);
    };
    
    u.onend = () => {
      console.log('语音播放完成');
    };
    
    window.speechSynthesis.speak(u);
    console.log('开始播放:', text);
  }, [voiceGender]);

  const speakChinese = useCallback((text: string) => {
    if (!('speechSynthesis' in window)) {
      console.log('浏览器不支持语音合成');
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
    voicesLoaded,
  };
}
