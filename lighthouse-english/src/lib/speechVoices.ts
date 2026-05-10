/** 统一语音的 lang 字段（部分引擎用 en_US、带空格等） */
export function normalizeVoiceLang(lang: string): string {
  return (lang || '').replace(/_/g, '-').replace(/\s+/g, '').trim();
}

function isEnglishVoice(v: SpeechSynthesisVoice): boolean {
  const raw = (v.lang || '').trim();
  if (raw && /^en/i.test(normalizeVoiceLang(raw))) return true;
  // 少数环境英文音色的 lang 为空，仅靠名称判断
  return /english|\ben[-\s]/i.test(v.name);
}

/**
 * Choose a usable zh-CN (or zh-Hans / zh) voice when available.
 */
export function pickChineseVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | undefined {
  const zh =
    voices.find((v) => v.lang === 'zh-CN') ??
    voices.find((v) => /^zh-(CN|Hans|SG)/i.test(v.lang)) ??
    voices.find((v) => /^zh\b/i.test(v.lang));
  return zh;
}

/**
 * Prefer a natural US English voice over generic "English".
 * 只在「确认为英文」的音色里打分，避免与中文等音色混排后绑定错误引擎导致整段无声。
 */
export function pickUsEnglishVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | undefined {
  const candidates = voices.filter(isEnglishVoice);
  if (candidates.length === 0) return undefined;

  const score = (v: SpeechSynthesisVoice) => {
    const nl = normalizeVoiceLang(v.lang).toLowerCase();
    const L = `${nl} ${v.name}`.toLowerCase();
    let s = 0;
    if (nl === 'en-us') s += 100;
    else if (nl.startsWith('en-us')) s += 90;
    else if (/^en/.test(nl)) s += 50;
    if (/united states|u\.s\.|american|samantha|alex|allison|zira|aria|microsoft.*mark|microsoft.*zira|jenny/i.test(L))
      s += 40;
    if (/india|british|uk|australia/i.test(L)) s -= 30;
    return s;
  };

  let best: SpeechSynthesisVoice | undefined;
  let bestScore = -1;
  for (const v of candidates) {
    const sc = score(v);
    if (sc > bestScore) {
      bestScore = sc;
      best = v;
    } else if (sc === bestScore && best && v.default && !best.default) {
      // 同分时优先系统默认英文，部分内核对非默认音色合成英文会失败
      best = v;
    }
  }
  return best ?? candidates[0];
}

/**
 * 将英文拆成多个短句/意群，便于用多次 utterance 串联，在意群间留出停顿（浏览器 TTS 无语调控制时的折中做法）。
 */
export function splitEnglishForProsody(text: string): string[] {
  const t = text.replace(/\s+/g, ' ').trim();
  if (!t) return [];

  const mergeNumericCommas = (parts: string[]): string[] => {
    const merged: string[] = [];
    for (let i = 0; i < parts.length; i++) {
      const piece = parts[i];
      const prev = merged[merged.length - 1];
      if (prev && /\d$/.test(prev.trimEnd()) && /^\d/.test(piece)) {
        merged[merged.length - 1] = `${prev}, ${piece}`;
      } else {
        merged.push(piece);
      }
    }
    return merged.map((s) => s.trim()).filter(Boolean);
  };

  const splitCommasSafe = (seg: string): string[] => {
    if (!seg.includes(',')) return [seg];
    return mergeNumericCommas(seg.split(/,\s+/));
  };

  const sentences = t.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean);

  const out: string[] = [];
  for (const sentence of sentences) {
    const clauses = splitCommasSafe(sentence);
    if (clauses.length === 1 && clauses[0].length > 72 && /;\s/.test(clauses[0])) {
      out.push(...clauses[0].split(/;\s+/).map((s) => s.trim()).filter(Boolean));
    } else {
      out.push(...clauses);
    }
  }

  return out.length ? out : [t];
}
