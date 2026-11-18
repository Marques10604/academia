// Device capabilities: wake lock, vibration, beep. Every call is feature-detected and wrapped
// in try/catch, so a missing or refused API never breaks logging or the timer.

let audioCtx = null;
let wanted = false;
let sentinel = null;
let listening = false;

// Must be called inside a tap handler: browsers only allow audio after a user gesture.
export function unlockAudio() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    if (!audioCtx) audioCtx = new Ctx();
    if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
  } catch { /* no audio is fine */ }
}

function tone(ctx, start, freq, dur) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.frequency.value = freq;
  gain.gain.value = 0.2;
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(start);
  osc.stop(start + dur);
}

export function beep() {
  try {
    if (!audioCtx || audioCtx.state !== 'running') return;
    const t = audioCtx.currentTime;
    tone(audioCtx, t, 880, 0.15);
    tone(audioCtx, t + 0.25, 880, 0.15);
  } catch { /* ignore */ }
}

export function vibrate(pattern) {
  try {
    if (typeof navigator.vibrate === 'function') navigator.vibrate(pattern);
  } catch { /* ignore */ }
}

async function acquire() {
  try {
    if (!('wakeLock' in navigator) || sentinel) return;
    const lock = await navigator.wakeLock.request('screen');
    sentinel = lock;
    lock.addEventListener('release', () => {
      if (sentinel === lock) sentinel = null;
    });
  } catch { /* refused (for example low battery): keep going without it */ }
}

export function requestWakeLock() {
  wanted = true;
  if (!listening) {
    listening = true;
    // Chrome drops the lock whenever the page is hidden, so take it again when visible.
    document.addEventListener('visibilitychange', () => {
      if (wanted && document.visibilityState === 'visible') acquire();
    });
  }
  return acquire();
}

export async function releaseWakeLock() {
  wanted = false;
  const lock = sentinel;
  sentinel = null;
  try {
    if (lock) await lock.release();
  } catch { /* ignore */ }
}

export function isWakeLockActive() {
  return sentinel !== null;
}
