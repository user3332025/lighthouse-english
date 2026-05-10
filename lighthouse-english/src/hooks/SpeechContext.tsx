import { createContext, useContext, useCallback, useRef, useEffect, useState, ReactNode } from 'react';
import { isSpeechUnlockedFromUserGesture, requestSpeakWhenUnlocked } from '@/lib/speechUnlock';

export type VoiceGender = 'female' | 'male';

export interface SpeakEvents {
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (ev: SpeechSynthesisErrorEvent) => void;
}

interface SpeechContextType {
  speak: (text: string, lang?: string, events?: SpeakEvents) => void;
  speakChinese: (text: string, events?: SpeakEvents) => void;
  speakEnglish: (text: string, events?: SpeakEvents) => void;
  stop: () => void;
  isSupported: boolean;
  voiceGender: VoiceGender;
  setVoiceGender: (gender: VoiceGender) => void;
  toggleVoiceGender: () => void;
}

const SpeechContext = createContext<SpeechContextType | null>(null);

function selectFemaleVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | undefined {
  const enUsVoices = voices.filter(voice => voice.lang === 'en-US');
  if (enUsVoices.length === 0) {
    return voices.find(voice => voice.lang.startsWith('en'));
  }
  
  const femaleKeywords = [
    'samantha', 'victoria', 'tessa', 'serena', 'kate', 'susan', 'zira', 'allison', 'aria', 'sara', 'karen', 'mary', 'linda', 'patricia', 'jennifer',
    'google us english', 'google uk english female',
    'microsoft zira', 'microsoft sara', 'microsoft jenny', 'microsoft aria',
    'samantha (enhanced)', 'victoria (enhanced)',
    'female', 'woman'
  ];
  
  for (const keyword of femaleKeywords) {
    const voice = enUsVoices.find(v => 
      v.name.toLowerCase().includes(keyword.toLowerCase())
    );
    if (voice) return voice;
  }
  
  const maleKeywords = ['male', 'man', 'alex', 'daniel', 'fred', 'george', 'microsoft david', 'microsoft mark'];
  const nonMaleEnUsVoices = enUsVoices.filter(v => 
    !maleKeywords.some(keyword => v.name.toLowerCase().includes(keyword.toLowerCase()))
  );
  
  if (nonMaleEnUsVoices.length > 0) {
    return nonMaleEnUsVoices[0];
  }
  
  const defaultVoice = enUsVoices.find(v => v.default);
  if (defaultVoice) return defaultVoice;
  
  return enUsVoices[0];
}

function selectMaleVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | undefined {
  const enUsVoices = voices.filter(voice => voice.lang === 'en-US');
  if (enUsVoices.length === 0) {
    return voices.find(voice => voice.lang.startsWith('en'));
  }
  
  const maleKeywords = [
    'male', 'man', 'alex', 'daniel', 'fred', 'george',
    'microsoft david', 'microsoft mark', 'microsoft zack',
    'google us english male', 'google uk english male',
    'sam', 'tom', 'mike', 'john', 'robert', 'william', 'david', 'richard'
  ];
  
  for (const keyword of maleKeywords) {
    const voice = enUsVoices.find(v => 
      v.name.toLowerCase().includes(keyword.toLowerCase())
    );
    if (voice) return voice;
  }
  
  const femaleKeywords = ['female', 'woman', 'samantha', 'victoria', 'zira', 'allison', 'aria', 'sara'];
  const nonFemaleEnUsVoices = enUsVoices.filter(v => 
    !femaleKeywords.some(keyword => v.name.toLowerCase().includes(keyword.toLowerCase()))
  );
  
  if (nonFemaleEnUsVoices.length > 0) {
    return nonFemaleEnUsVoices[0];
  }
  
  const defaultVoice = enUsVoices.find(v => v.default);
  if (defaultVoice) return defaultVoice;
  
  return enUsVoices[0];
}

export function SpeechProvider({ children }: { children: ReactNode }) {
  const synthRef = useRef<SpeechSynthesis | null>(null);
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

  const selectVoice = useCallback((voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | undefined => {
    if (voiceGender === 'female') {
      return selectFemaleVoice(voices);
    } else {
      return selectMaleVoice(voices);
    }
  }, [voiceGender]);

  const speak = useCallback((text: string, lang: string = 'en-US', events?: SpeakEvents) => {
    const runSpeak = () => {
      if (!('speechSynthesis' in window)) return;
      
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = lang;
      u.rate = 0.9;
      
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

  const toggleVoiceGender = useCallback(() => {
    setVoiceGender(prev => prev === 'female' ? 'male' : 'female');
  }, []);

  return (
    <SpeechContext.Provider value={{
      speak,
      speakChinese,
      speakEnglish,
      stop,
      isSupported: typeof window !== 'undefined' && 'speechSynthesis' in window,
      voiceGender,
      setVoiceGender,
      toggleVoiceGender,
    }}>
      {children}
    </SpeechContext.Provider>
  );
}

export function useSpeech() {
  const context = useContext(SpeechContext);
  if (!context) {
    throw new Error('useSpeech must be used within a SpeechProvider');
  }
  return context;
}
