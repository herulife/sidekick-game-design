// Aksara Sunda dasar (vokal/ngalagena)
export type Aksara = { char: string; latin: string };

export const AKSARA_DASAR: Aksara[] = [
  { char: "ᮃ", latin: "a" },
  { char: "ᮄ", latin: "i" },
  { char: "ᮅ", latin: "u" },
  { char: "ᮆ", latin: "é" },
  { char: "ᮇ", latin: "o" },
  { char: "ᮈ", latin: "e" },
  { char: "ᮉ", latin: "eu" },
  { char: "ᮊ", latin: "ka" },
  { char: "ᮌ", latin: "ga" },
  { char: "ᮍ", latin: "nga" },
  { char: "ᮎ", latin: "ca" },
  { char: "ᮏ", latin: "ja" },
  { char: "ᮑ", latin: "nya" },
  { char: "ᮒ", latin: "ta" },
  { char: "ᮓ", latin: "da" },
  { char: "ᮔ", latin: "na" },
  { char: "ᮕ", latin: "pa" },
  { char: "ᮘ", latin: "ba" },
  { char: "ᮙ", latin: "ma" },
  { char: "ᮚ", latin: "ya" },
  { char: "ᮛ", latin: "ra" },
  { char: "ᮜ", latin: "la" },
  { char: "ᮝ", latin: "wa" },
  { char: "ᮞ", latin: "sa" },
  { char: "ᮠ", latin: "ha" },
];

export const KATA: { aksara: string; latin: string }[] = [
  { aksara: "ᮊᮥᮓ", latin: "kuda" },
  { aksara: "ᮘᮕᮊ᮪", latin: "bapak" },
  { aksara: "ᮃᮌᮤᮀ", latin: "aging" },
  { aksara: "ᮞᮕᮤ", latin: "sapi" },
  { aksara: "ᮘᮥᮙᮤ", latin: "bumi" },
];

export const LEVELS = [
  { id: 1, name: "Huruf Dasar", desc: "Aksara dasar Sunda" },
  { id: 2, name: "Gabungan Huruf", desc: "Suku kata gabungan" },
  { id: 3, name: "Kata Sederhana", desc: "Kata pendek" },
  { id: 4, name: "Kalimat Pendek", desc: "Kalimat sederhana" },
];

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
