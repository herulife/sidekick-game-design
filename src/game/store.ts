import { useEffect, useState } from "react";

export type Progress = {
  name: string;
  totalScore: number;
  highestLevel: number;
  totalPlays: number;
  history: { date: string; level: number; score: number }[];
};

const KEY = "sunda-game-progress";

const initial: Progress = {
  name: "",
  totalScore: 0,
  highestLevel: 1,
  totalPlays: 0,
  history: [],
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

export function speak(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "id-ID";
  u.rate = 0.85;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
}
