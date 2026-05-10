import { useCallback, useRef, useEffect } from 'react';
import {
  pickChineseVoice,
  pickUsEnglishVoice,
  normalizeVoiceLang,
  splitEnglishForProsody,
} from '@/lib/speechVoices';
import { isSpeechUnlockedFromUserGesture, requestSpeakWhenUnlocked } from '@/lib/speechUnlock';

/** 朗读生命周期（用于自动播完再录音等） */
export type SpeakEvents = {
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (ev: SpeechSynthesisErrorEvent) => void;
};

export function useSpeech() {
  const synthRef = useRef<SpeechSynthesis | null>(null);
  /** 防止连续点击朗读时，前一次「等 voices」监听器误触发后一次 */
  const speakGenRef = useRef(0);

  // 初始化语音合成（不在卸载时 cancel，避免多路由/多组件实例打断全局朗读）
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    synthRef.current = window.speechSynthesis;

    synthRef.current.getVoices();

    const onVoices = () => {
      synthRef.current?.getVoices();
    };
    synthRef.current.onvoiceschanged = onVoices;

    return () => {
      if (synthRef.current?.onvoiceschanged === onVoices) {
        synthRef.current.onvoiceschanged = null as unknown as typeof synthRef.current.onvoiceschanged;
      }
    };
  }, []);

  const speak = useCallback((text: string, lang: string = 'en-US', events?: SpeakEvents) => {
    const runSpeak = () => {
    if (!synthRef.current) {
      synthRef.current = window.speechSynthesis;
    }

    const gen = ++speakGenRef.current;

    // 取消之前的语音；Chrome 等需在 cancel 后稍等再 speak，否则整段无声
    synthRef.current.cancel();

    const isEnglish = /^en/i.test(lang);
    const isChinese = /^zh/i.test(lang);

    /** 绑定音色后仍合成失败时，降级为不指定 voice（仅 lang），兼容 Edge/部分国产内核 */
    const EN_TTS_RETRY_ERRORS = new Set([
      'voice-unavailable',
      'language-unavailable',
      'synthesis-failed',
      'synthesis-unavailable',
    ]);

    const trySpeak = () => {
      const synth = synthRef.current;
      if (!synth || gen !== speakGenRef.current) return;

      if (!text.trim()) {
        queueMicrotask(() => events?.onEnd?.());
        return;
      }

      const buildAndSpeak = () => {
        if (gen !== speakGenRef.current) return;
        const voices = synth.getVoices();

        let selectedVoice: SpeechSynthesisVoice | undefined;
        if (isEnglish) {
          selectedVoice = pickUsEnglishVoice(voices);
        } else if (isChinese) {
          selectedVoice = pickChineseVoice(voices);
        } else {
          const prefix = lang.split('-')[0].toLowerCase();
          selectedVoice = voices.find((v) => v.lang.toLowerCase().startsWith(prefix));
        }

        let utterLangEn = 'en-US';
        if (isEnglish && selectedVoice) {
          const vl = normalizeVoiceLang(selectedVoice.lang);
          if (vl && /^en/i.test(vl)) utterLangEn = vl;
        }

        /** 英文拆段串联：意群间略有停顿，减轻一整句「念稿」感（仍为系统 TTS，无法精细标调） */
        if (isEnglish) {
          const chunks = splitEnglishForProsody(text);
          if (chunks.length > 1) {
            let idx = 0;
            let englishRetried = false;

            const speakNext = () => {
              if (gen !== speakGenRef.current) return;
              if (idx >= chunks.length) {
                events?.onEnd?.();
                return;
              }
              const chunk = chunks[idx];
              const u = new SpeechSynthesisUtterance(chunk);
              u.lang = utterLangEn;
              u.rate = 0.9;
              u.pitch = 1;
              u.volume = 1;
              if (selectedVoice) u.voice = selectedVoice;

              if (idx === 0) {
                u.onstart = () => events?.onStart?.();
              }

              u.onend = () => {
                if (gen !== speakGenRef.current) return;
                idx += 1;
                if (idx < chunks.length) {
                  window.setTimeout(() => {
                    if (gen !== speakGenRef.current) return;
                    speakNext();
                  }, 72);
                } else {
                  events?.onEnd?.();
                }
              };

              u.onerror = (e) => {
                events?.onError?.(e);
                if (
                  idx === 0 &&
                  !englishRetried &&
                  gen === speakGenRef.current &&
                  EN_TTS_RETRY_ERRORS.has(e.error)
                ) {
                  englishRetried = true;
                  window.setTimeout(() => {
                    if (gen !== speakGenRef.current) return;
                    const u2 = new SpeechSynthesisUtterance(text);
                    u2.lang = 'en-US';
                    u2.rate = 0.9;
                    u2.pitch = 1;
                    u2.volume = 1;
                    u2.onstart = () => events?.onStart?.();
                    u2.onend = () => events?.onEnd?.();
                    u2.onerror = (ev) => events?.onError?.(ev);
            synth.speak(u2);
                  }, 64);
                }
              };

              synth.speak(u);
            };

            speakNext();
            return;
          }
        }

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.onstart = () => events?.onStart?.();
        utterance.onend = () => events?.onEnd?.();
        let englishRetried = false;
        utterance.onerror = (e) => {
          events?.onError?.(e);
          if (
            !isEnglish ||
            englishRetried ||
            gen !== speakGenRef.current ||
            !EN_TTS_RETRY_ERRORS.has(e.error)
          ) {
            return;
          }
          englishRetried = true;
          window.setTimeout(() => {
            if (gen !== speakGenRef.current) return;
            const u2 = new SpeechSynthesisUtterance(text);
            u2.lang = 'en-US';
            u2.rate = 0.9;
            u2.pitch = 1;
            u2.volume = 1;
            u2.onstart = () => events?.onStart?.();
            u2.onend = () => events?.onEnd?.();
            u2.onerror = (ev) => events?.onError?.(ev);
            synth.speak(u2);
          }, 64);
        };
        // 默认语言；英文在绑定具体音色后改为与该音色一致（en-US+en-GB 等错配时 Edge/部分内核会整段无声）
        utterance.lang = isEnglish ? utterLangEn : lang;
        utterance.rate = 0.9;
        utterance.pitch = 1;
        utterance.volume = 1;

        if (selectedVoice) {
          utterance.voice = selectedVoice;
        }

        synth.speak(utterance);
      };

      // Chromium 首次 getVoices() 常返回空数组，必须等 voiceschanged 后再选音/朗读，否则常无声
      if (synth.getVoices().length === 0) {
        let done = false;
        const run = () => {
          if (done || gen !== speakGenRef.current) return;
          done = true;
          buildAndSpeak();
        };
        const t = window.setTimeout(() => {
          synth.removeEventListener('voiceschanged', onV);
          run();
        }, 900);
        const onV = () => {
          window.clearTimeout(t);
          synth.removeEventListener('voiceschanged', onV);
          run();
        };
        synth.addEventListener('voiceschanged', onV);
        void synth.getVoices();
        return;
      }

      buildAndSpeak();
    };

    // 用 0ms + 双 rAF：既满足 cancel 后微延迟，又尽量保留用户手势链（Safari 对 TTS 极敏感）
    window.setTimeout(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => trySpeak());
      });
    }, 0);
    };

    if (isSpeechUnlockedFromUserGesture()) {
      runSpeak();
      return;
    }
    requestSpeakWhenUnlocked(runSpeak);
  }, []);

  const speakChinese = useCallback((text: string, events?: SpeakEvents) => {
    speak(text, 'zh-CN', events);
  }, [speak]);

  const speakEnglish = useCallback((text: string, events?: SpeakEvents) => {
    speak(text, 'en-US', events);
  }, [speak]);

  const stop = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel();
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
