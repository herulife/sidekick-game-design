import { useEffect, useState } from "react";

export type Progress = {
  name: string;
  totalScore: number;
  highestLevel: number;
  totalPlays: number;
  history: { date: string; level: number; score: number }[];
  music: boolean;
  sfx: boolean;
};

const KEY = "sunda-game-progress";

const initial: Progress = {
  name: "",
  totalScore: 0,
  highestLevel: 1,
  totalPlays: 0,
  history: [],
  music: true,
  sfx: true,
};

export function loadProgress(): Progress {
  if (typeof window === "undefined") return initial;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return initial;
    return { ...initial, ...JSON.parse(raw) };
  } catch {
    return initial;
  }
}

export function saveProgress(p: Progress) {
  localStorage.setItem(KEY, JSON.stringify(p));
}

export function useProgress() {
  const [p, setP] = useState<Progress>(initial);
  useEffect(() => setP(loadProgress()), []);
  const update = (next: Partial<Progress> | ((p: Progress) => Progress)) => {
    setP((cur) => {
      const n = typeof next === "function" ? next(cur) : { ...cur, ...next };
      saveProgress(n);
      return n;
    });
  };
  return [p, update] as const;
}

let _voicesCache: SpeechSynthesisVoice[] = [];
let _unlocked = false;

function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return resolve([]);
    const synth = window.speechSynthesis;
    const v = synth.getVoices();
    if (v && v.length) {
      _voicesCache = v;
      return resolve(v);
    }
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      _voicesCache = synth.getVoices();
      resolve(_voicesCache);
    };
    synth.onvoiceschanged = finish;
    // fallback timeout (some Android Chrome never fires the event)
    setTimeout(finish, 800);
  });
}

function pickVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  if (!voices.length) return null;
  return (
    voices.find((v) => /^id(-|_)?ID$/i.test(v.lang)) ||
    voices.find((v) => /^id\b/i.test(v.lang)) ||
    voices.find((v) => /^ms\b/i.test(v.lang)) ||
    voices.find((v) => v.default) ||
    voices[0]
  );
}

/**
 * Speak text. MUST be called inside a user gesture handler on mobile.
 * Creates the utterance synchronously to keep the gesture context alive.
 */
export function speak(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const synth = window.speechSynthesis;

  // Create utterance synchronously (keeps mobile gesture context valid).
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "id-ID";
  u.rate = 0.9;
  u.pitch = 1;
  u.volume = 1;

  // Try to attach a voice immediately if cached.
  const cached = _voicesCache.length ? _voicesCache : synth.getVoices();
  if (cached.length) {
    const v = pickVoice(cached);
    if (v) {
      u.voice = v;
      u.lang = v.lang;
    }
  }

  // Unlock trick for Android Chrome: speak an empty utterance first time.
  if (!_unlocked) {
    _unlocked = true;
    try {
      const warm = new SpeechSynthesisUtterance("");
      warm.volume = 0;
      synth.speak(warm);
    } catch {}
  }

  // Some browsers leave synth in "paused" state; resume defensively.
  try { synth.resume(); } catch {}
  try { synth.cancel(); } catch {}

  const doSpeak = () => {
    try { synth.resume(); } catch {}
    synth.speak(u);
  };

  if (!cached.length) {
    // Voices not ready: load then speak. Safe because utterance was created in gesture.
    loadVoices().then((vs) => {
      const v = pickVoice(vs);
      if (v) {
        u.voice = v;
        u.lang = v.lang;
      }
      doSpeak();
    });
  } else {
    doSpeak();
  }
}

// Pre-warm voices list once on module load (browser only).
if (typeof window !== "undefined" && "speechSynthesis" in window) {
  loadVoices();
}
