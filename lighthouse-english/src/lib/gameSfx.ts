/**
 * 轻量游戏音效（Web Audio，无外部资源）。
 * 策略：在用户点击路径里创建 AudioContext；resume 后通过双 requestAnimationFrame 再调度节点，
 * 避免 context 仍为 suspended 时调度导致「全程无声」。关闭的 context 会丢弃并重建。
 */

let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (typeof window === 'undefined') {
    throw new Error('no window');
  }
  if (ctx?.state === 'closed') {
    ctx = null;
  }
  const Ctx =
    window.AudioContext ||
    (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!ctx) {
    ctx = new Ctx({ latencyHint: 'interactive' } as AudioContextOptions);
  }
  return ctx;
}

/** resume 后隔两帧再播，给浏览器把时钟从 suspended 切到 running 的时间 */
function scheduleSound(ac: AudioContext, run: (ac: AudioContext) => void): void {
  try {
    void ac.resume();
  } catch {
    /* ignore */
  }
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      try {
        void ac.resume();
        run(ac);
      } catch {
        /* ignore */
      }
    });
  });
}

/** 唤醒 AudioContext（点击 / pointer 里同步调用） */
export function resumeAudioContext(): void {
  try {
    const ac = getCtx();
    void ac.resume();
  } catch {
    /* ignore */
  }
}

/**
 * 在用户「明确点击」按钮时调用：创建/恢复 context，并唤醒 speechSynthesis。
 * 与 GlobalAudioUnlock 互补，满足最严格的自动播放策略。
 */
export function unlockAudioFromButtonTap(): void {
  try {
    const ac = getCtx();
    void ac.resume();
  } catch {
    /* ignore */
  }
  try {
    const s = window.speechSynthesis;
    if (!s) return;
    s.cancel();
    s.resume?.();
    s.getVoices();
  } catch {
    /* ignore */
  }
}

/** 门闩页点击后短提示音，确认扬声器有输出 */
export function playUnlockBeep(): void {
  try {
    const ac = getCtx();
    scheduleSound(ac, (running) => {
      const t0 = running.currentTime;
      const o = running.createOscillator();
      const g = running.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(440, t0);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(0.28, t0 + 0.03);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.4);
      o.connect(g).connect(running.destination);
      o.start(t0);
      o.stop(t0 + 0.42);
    });
  } catch {
    /* ignore */
  }
}

/** 选错时短促「噗」声 */
export function playWrongPop(freqHz = 340) {
  try {
    const ac = getCtx();
    scheduleSound(ac, (running) => {
      const t0 = running.currentTime;
      const o = running.createOscillator();
      const g = running.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(freqHz, t0);
      o.frequency.exponentialRampToValueAtTime(Math.max(120, freqHz * 0.55), t0 + 0.11);
      g.gain.setValueAtTime(0.22, t0);
      g.gain.exponentialRampToValueAtTime(0.0008, t0 + 0.14);
      o.connect(g).connect(running.destination);
      o.start(t0);
      o.stop(t0 + 0.15);
    });
  } catch {
    /* ignore */
  }
}

/** 小动物依次出现后的柔和提示音 */
export function playThinkChime() {
  try {
    const ac = getCtx();
    scheduleSound(ac, (running) => {
      const t0 = running.currentTime;
      const notes = [523.25, 659.25, 783.99];
      notes.forEach((freq, i) => {
        const o = running.createOscillator();
        const g = running.createGain();
        o.type = 'triangle';
        o.frequency.setValueAtTime(freq, t0 + i * 0.09);
        g.gain.setValueAtTime(0, t0 + i * 0.09);
        g.gain.linearRampToValueAtTime(0.12, t0 + i * 0.09 + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0008, t0 + i * 0.09 + 0.22);
        o.connect(g).connect(running.destination);
        o.start(t0 + i * 0.09);
        o.stop(t0 + i * 0.09 + 0.24);
      });
    });
  } catch {
    /* ignore */
  }
}

/** 答对：明亮大调琶音，带一点「铃铛」感 */
export function playCorrectSparkle() {
  try {
    const ac = getCtx();
    scheduleSound(ac, (running) => {
      const t0 = running.currentTime;
      const freqs = [523.25, 659.25, 783.99, 1046.5];
      const step = 0.07;
      const master = running.createGain();
      master.gain.value = 0.9;
      master.connect(running.destination);

      freqs.forEach((base, i) => {
        const start = t0 + i * step;
        const o1 = running.createOscillator();
        const g1 = running.createGain();
        o1.type = 'sine';
        o1.frequency.setValueAtTime(base, start);
        g1.gain.setValueAtTime(0, start);
        g1.gain.linearRampToValueAtTime(0.16, start + 0.018);
        g1.gain.exponentialRampToValueAtTime(0.0004, start + 0.34);
        o1.connect(g1).connect(master);

        const o2 = running.createOscillator();
        const g2 = running.createGain();
        o2.type = 'sine';
        o2.frequency.setValueAtTime(base * 2, start);
        g2.gain.setValueAtTime(0, start);
        g2.gain.linearRampToValueAtTime(0.055, start + 0.012);
        g2.gain.exponentialRampToValueAtTime(0.0004, start + 0.22);
        o2.connect(g2).connect(master);

        o1.start(start);
        o1.stop(start + 0.36);
        o2.start(start);
        o2.stop(start + 0.28);
      });
    });
  } catch {
    /* ignore */
  }
}
