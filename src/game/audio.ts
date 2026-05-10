import benarUrl from "@/assets/benar.mp3";
import salahUrl from "@/assets/salah.mp3";
import musikUrl from "@/assets/musik-latar.mp3";
import clickUrl from "@/assets/mouse-click.mp3";
import { useEffect, useState } from "react";

const KEY_MUSIC = "sunda-music-on";
const KEY_SFX = "sunda-sfx-on";

let bgm: HTMLAudioElement | null = null;
let correctEl: HTMLAudioElement | null = null;
let wrongEl: HTMLAudioElement | null = null;
let clickEl: HTMLAudioElement | null = null;

let musicOn = true;
let sfxOn = true;
const listeners = new Set<() => void>();

function notify() { listeners.forEach((l) => l()); }

function ensure() {
  if (typeof window === "undefined") return;
  if (!bgm) {
    bgm = new Audio(musikUrl);
    bgm.loop = true;
    bgm.volume = 0.35;
    correctEl = new Audio(benarUrl);
    wrongEl = new Audio(salahUrl);
    clickEl = new Audio(clickUrl);
    correctEl.volume = 0.9;
    wrongEl.volume = 0.9;
    clickEl.volume = 0.5;
    try {
      const m = localStorage.getItem(KEY_MUSIC);
      const s = localStorage.getItem(KEY_SFX);
      if (m !== null) musicOn = m === "1";
      if (s !== null) sfxOn = s === "1";
    } catch {}
  }
}

function playOne(el: HTMLAudioElement | null) {
  if (!el || !sfxOn) return;
  try {
    el.pause();
    el.currentTime = 0;
    void el.play().catch(() => {});
  } catch {}
}

export const audio = {
  init() { ensure(); },
  isMusicOn() { ensure(); return musicOn; },
  isSfxOn() { ensure(); return sfxOn; },
  startMusic() {
    ensure();
    if (!bgm) return;
    if (!musicOn) return;
    void bgm.play().catch(() => {});
  },
  stopMusic() {
    if (!bgm) return;
    try { bgm.pause(); } catch {}
  },
  toggleMusic() {
    ensure();
    musicOn = !musicOn;
    try { localStorage.setItem(KEY_MUSIC, musicOn ? "1" : "0"); } catch {}
    if (musicOn) { void bgm?.play().catch(() => {}); } else { try { bgm?.pause(); } catch {} }
    notify();
    return musicOn;
  },
  toggleSfx() {
    ensure();
    sfxOn = !sfxOn;
    try { localStorage.setItem(KEY_SFX, sfxOn ? "1" : "0"); } catch {}
    notify();
    return sfxOn;
  },
  click() { ensure(); playOne(clickEl); },
  correct() { ensure(); playOne(correctEl); },
  wrong() { ensure(); playOne(wrongEl); },
  subscribe(fn: () => void) { listeners.add(fn); return () => listeners.delete(fn); },
};

export function useAudioState() {
  const [, setT] = useState(0);
  useEffect(() => audio.subscribe(() => setT((x) => x + 1)), []);
  return { music: audio.isMusicOn(), sfx: audio.isSfxOn() };
}
