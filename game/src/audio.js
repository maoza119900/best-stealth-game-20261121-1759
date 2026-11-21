// Tiny synthesized sounds (WebAudio, no files): a soft chime for a
// lantern, a low alarm when spotted, a thud for a pebble, a sad fall for
// being caught. Silent when audio is unavailable; the game never depends
// on it.
export function createAudio() {
  let ctx = null;

  function ensure() {
    if (ctx) return ctx;
    try {
      const AC = window.AudioContext ?? window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    } catch {
      return null;
    }
    return ctx;
  }

  function tone(freq, seconds, type, gainValue, when = 0) {
    const ac = ensure();
    if (!ac) return;
    try {
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(gainValue, ac.currentTime + when);
      gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + when + seconds);
      osc.connect(gain).connect(ac.destination);
      osc.start(ac.currentTime + when);
      osc.stop(ac.currentTime + when + seconds + 0.02);
    } catch {
      // Audio is decoration; ignore failures.
    }
  }

  return {
    unlock() {
      ensure();
    },
    lantern() {
      tone(880, 0.25, 'sine', 0.12);
      tone(1318, 0.35, 'sine', 0.08, 0.07);
    },
    spotted() {
      tone(196, 0.4, 'sawtooth', 0.1);
      tone(147, 0.5, 'sawtooth', 0.1, 0.15);
    },
    pebble() {
      tone(220, 0.08, 'triangle', 0.1);
    },
    caught() {
      tone(110, 0.6, 'sawtooth', 0.12);
    },
    clear() {
      tone(523, 0.2, 'sine', 0.1);
      tone(659, 0.2, 'sine', 0.1, 0.12);
      tone(784, 0.4, 'sine', 0.1, 0.24);
    },
  };
}
