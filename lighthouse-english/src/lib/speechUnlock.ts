/**
 * Chromium / Safari 常在「用户手势」之前拦截 speechSynthesis，导致一进页面自动朗读英文无声。
 * 任意 pointer / key 触发后解锁，排队中的 speak 再执行。
 */
let unlocked = false;
const queue: Array<() => void> = [];

export function requestSpeakWhenUnlocked(fn: () => void): void {
  if (unlocked) {
    queueMicrotask(() => fn());
    return;
  }
  queue.push(fn);
}

export function unlockSpeechFromUserGesture(): void {
  if (unlocked) return;
  unlocked = true;
  window.dispatchEvent(new CustomEvent('lighthouse-speech-unlock'));
  const batch = queue.splice(0);
  for (const run of batch) {
    try {
      run();
    } catch {
      /* ignore */
    }
  }
}

export function isSpeechUnlockedFromUserGesture(): boolean {
  return unlocked;
}
