import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Frame, Panel } from "@/game/Frame";
import { AKSARA_DASAR, KATA, LEVELS, shuffle } from "@/game/data";
import { speak, useProgress } from "@/game/store";
import { audio, useAudioState } from "@/game/audio";
import avatar from "@/assets/sunda-avatar.png";
import sgGreet from "@/assets/sg-greet.jpg";
import sgHappy from "@/assets/sg-happy.jpg";
import sgConfused from "@/assets/sg-confused.jpg";
import sgCheer from "@/assets/sg-cheer.jpg";
import sgWave from "@/assets/sg-wave.jpg";
import sgHero from "@/assets/sg-hero.jpg";
import { BookOpen, Music, Volume2, Heart, Star, Lock, RotateCcw, ChevronLeft, ChevronRight, Check, X, Trash2, Home, Trophy, PartyPopper, Eye, EyeOff, UserPlus, LogIn } from "lucide-react";

export const Route = createFileRoute("/")({ component: Game });

type Screen =
  | "splash"
  | "register"
  | "login"
  | "menu"
  | "levelSelect"
  | "learn"
  | "quiz"
  | "writing"
  | "reading"
  | "result"
  | "finalCelebration"
  | "progress"
  | "settings";

function Btn({
  children, onClick, variant = "primary", className = "", disabled,
}: { children: React.ReactNode; onClick?: () => void; variant?: "primary" | "ghost" | "danger" | "soft"; className?: string; disabled?: boolean }) {
  const base = "rounded-xl px-6 py-3 font-semibold transition-all active:translate-y-0.5 shadow-md disabled:opacity-50";
  const styles = {
    primary: "bg-primary text-primary-foreground hover:brightness-110 border-2 border-emerald-950/40",
    ghost: "bg-[var(--paper)] text-foreground border-2 border-emerald-950/50 hover:bg-[var(--paper-deep)]",
    danger: "bg-destructive text-destructive-foreground hover:brightness-110 border-2 border-red-950/40",
    soft: "bg-accent text-accent-foreground hover:brightness-105 border-2 border-amber-900/40",
  }[variant];
  const handle = () => { audio.click(); onClick?.(); };
  return <button disabled={disabled} onClick={handle} className={`${base} ${styles} ${className}`}>{children}</button>;
}

function Game() {
  const [screen, setScreen] = useState<Screen>("splash");
  const [progress, setProgress] = useProgress();
  const [level, setLevel] = useState(1);
  const [lastResult, setLastResult] = useState<{ score: number; correct: number; total: number } | null>(null);

  const go = (s: Screen) => setScreen(s);

  return (
    <>
      {screen === "splash" && <Splash onStart={() => go(progress.password ? "login" : "register")} />}
      {screen === "register" && (
        <RegisterScreen
          onDone={(name, kelas, password) => {
            setProgress((p) => ({ ...p, name, kelas, password }));
            toast.success("Akun berhasil dibuat!");
            go("menu");
          }}
          onSwitchLogin={() => go("login")}
          hasAccount={!!progress.password}
        />
      )}
      {screen === "login" && (
        <LoginScreen
          name={progress.name}
          kelas={progress.kelas}
          expectedPassword={progress.password}
          onSuccess={() => go("menu")}
          onSwitchRegister={() => go("register")}
        />
      )}
      {screen === "menu" && (
        <Menu
          progress={progress}
          onLearn={() => go("levelSelect")}
          onWriting={() => go("writing")}
          onReading={() => go("reading")}
          onQuiz={() => { setLevel(progress.highestLevel || 1); go("quiz"); }}
          onProgress={() => go("progress")}
          onSettings={() => go("settings")}
          onExit={() => go("splash")}
        />
      )}
      {screen === "levelSelect" && (
        <LevelSelect
          progress={progress}
          onPick={(lv: number) => { setLevel(lv); go("learn"); }}
          onBack={() => go("menu")}
        />
      )}
      {screen === "learn" && (
        <Learn
          level={level}
          onNext={() => go(level >= 3 ? "reading" : "quiz")}
          onBack={() => go("levelSelect")}
        />
      )}
      {screen === "quiz" && (
        <Quiz
          level={level}
          onDone={(score, correct, total) => {
            setProgress((p) => ({
              ...p,
              totalScore: p.totalScore + score,
              highestLevel: Math.max(p.highestLevel, level + (correct / total >= 0.7 ? 1 : 0)),
              totalPlays: p.totalPlays + 1,
              history: [
                { date: new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }), level, score },
                ...p.history,
              ].slice(0, 8),
            }));
            setLastResult({ score, correct, total });
            go("result");
          }}
          onBack={() => go("menu")}
        />
      )}
      {screen === "writing" && <Writing onBack={() => go("menu")} />}
      {screen === "reading" && (
        <Reading
          onDone={(score, correct, total) => {
            setProgress((p) => ({
              ...p,
              totalScore: p.totalScore + score,
              totalPlays: p.totalPlays + 1,
              highestLevel: Math.max(p.highestLevel, level + (correct / total >= 0.7 ? 1 : 0)),
              history: [
                { date: new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }), level, score },
                ...p.history,
              ].slice(0, 8),
            }));
            setLastResult({ score, correct, total });
            go("result");
          }}
          onBack={() => go("menu")}
        />
      )}
      {screen === "result" && (
        <Result
          {...lastResult!}
          level={level}
          onAgain={() => go(level >= 3 ? "reading" : "quiz")}
          onNext={() => {
            if (level >= 4) { go("finalCelebration"); return; }
            const nl = level + 1;
            setLevel(nl);
            go(nl >= 3 ? "reading" : "quiz");
          }}
          onMenu={() => go("menu")}
          onProgress={() => go("progress")}
          onExit={() => go("splash")}
        />
      )}
      {screen === "finalCelebration" && (
        <FinalCelebration onMenu={() => { setLevel(1); go("menu"); }} />
      )}
      {screen === "progress" && <ProgressScreen progress={progress} onBack={() => go("menu")} />}
      {screen === "settings" && (
        <Settings
          progress={progress}
          onSave={(name) => { setProgress({ name }); toast.success("Pengaturan disimpan"); }}
          onToggleMusic={() => { const on = audio.toggleMusic(); setProgress((p) => ({ ...p, music: on })); toast(on ? "Musik dinyalakan" : "Musik dimatikan"); }}
          onToggleSfx={() => { const on = audio.toggleSfx(); setProgress((p) => ({ ...p, sfx: on })); }}
          onChangeProfile={() => { setProgress({ name: "" }); go("name"); }}
          onReset={() => {
            setProgress((p) => ({ ...p, totalScore: 0, highestLevel: 1, totalPlays: 0, history: [] }));
            toast.success("Progres direset");
          }}
          onBack={() => go("menu")}
        />
      )}
    </>
  );
}

// ---- Screens ----

function Splash({ onStart }: { onStart: () => void }) {
  const [showHelp, setShowHelp] = useState(false);
  const [music, setMusic] = useState(false);
  const toggleMusic = () => {
    setMusic((m) => {
      const nm = !m;
      toast(nm ? "Musik dinyalakan" : "Musik dimatikan");
      if (nm) speak("Wilujeng sumping di Sunda Game");
      return nm;
    });
  };
  return (
    <Frame>
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <div className="mb-2 text-2xl font-medium text-emerald-50 drop-shadow">Wilujeng Sumping</div>
        <h1 className="text-7xl font-bold tracking-tight text-amber-100 drop-shadow-lg md:text-8xl">SUNDA GAME</h1>
        <p className="mt-3 text-lg text-emerald-50/90 drop-shadow">Sundanese Educational Game</p>
        <img src={sgHero} alt="Karakter Sunda" className="my-4 h-64 w-auto rounded-2xl object-cover drop-shadow-xl" />
        <Btn onClick={onStart} className="px-12 text-xl">MULAI</Btn>
        <div className="mt-8 flex gap-3">
          <Btn variant="ghost" className="text-sm" onClick={() => setShowHelp(true)}>
            <BookOpen className="mr-2 inline h-4 w-4" />Petunjuk
          </Btn>
          <Btn variant="ghost" className="text-sm" onClick={toggleMusic}>
            <Music className="mr-2 inline h-4 w-4" />{music ? "Musik: ON" : "Musik: OFF"}
          </Btn>
        </div>
      </div>
      {showHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setShowHelp(false)}>
          <Panel className="max-w-lg p-6" >
            <div onClick={(e) => e.stopPropagation()}>
              <h3 className="text-2xl font-bold text-primary">Petunjuk Permainan</h3>
              <ul className="mt-3 space-y-2 text-sm">
                <li>1. Pilih <b>Mulai Belajar</b> untuk mengenal aksara Sunda.</li>
                <li>2. Setiap level diakhiri dengan <b>Kuis</b>. Capai 70% benar untuk membuka level berikutnya.</li>
                <li>3. Kamu memiliki <b>3 nyawa</b> di setiap kuis. Hati-hati menjawab!</li>
                <li>4. Gunakan <b>Latihan Menulis</b> untuk menebalkan aksara di kanvas.</li>
                <li>5. Tekan tombol <Volume2 className="inline h-4 w-4" /> untuk mendengar bacaan.</li>
              </ul>
              <div className="mt-5 text-right">
                <Btn onClick={() => setShowHelp(false)}>Tutup</Btn>
              </div>
            </div>
          </Panel>
        </div>
      )}
    </Frame>
  );
}

function NameScreen({ initial, onContinue }: { initial: string; onContinue: (n: string) => void }) {
  const [n, setN] = useState(initial);
  return (
    <Frame>
      <div className="flex flex-1 items-center justify-center">
        <Panel className="w-full max-w-xl p-10 text-center">
          <h2 className="text-3xl font-bold text-foreground">LEBETKEUN NAMI PAMAÉN</h2>
          <p className="mt-2 text-muted-foreground">Mangga lebetkeun nami anjeun</p>
          <input
            value={n}
            onChange={(e) => setN(e.target.value)}
            placeholder="Ketik nami anjeun"
            className="mt-6 w-full rounded-lg border-2 border-emerald-950/40 bg-white/70 px-4 py-3 text-lg outline-none focus:border-primary"
          />
          <Btn
            onClick={() => {
              if (!n.trim()) { toast.error("Nami pamaén dibutuhkan"); return; }
              onContinue(n.trim());
            }}
            className="mt-6 w-full text-lg"
          >MULAI</Btn>
        </Panel>
      </div>
    </Frame>
  );
}

function Menu({ progress, onLearn, onWriting, onReading, onQuiz, onProgress, onSettings, onExit }: any) {
  return (
    <Frame>
      <div className="flex justify-between">
        <Panel className="flex items-center gap-3 px-3 py-2">
          <img src={avatar} alt="" width={40} height={40} className="rounded-full bg-amber-100" />
          <span className="pr-3 font-semibold">Halo, {progress.name}!</span>
        </Panel>
        <div className="flex gap-2">
          <Panel className="flex items-center gap-2 px-4 py-2"><Star className="h-4 w-4 text-amber-500" /><div className="text-xs">Level<div className="font-bold">{progress.highestLevel}</div></div></Panel>
          <Panel className="flex items-center gap-2 px-4 py-2"><Star className="h-4 w-4 text-amber-500" /><div className="text-xs">Skor<div className="font-bold">{progress.totalScore}</div></div></Panel>
        </div>
      </div>
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <h1 className="text-7xl font-bold text-amber-100 drop-shadow-lg">SUNDA GAME</h1>
        <p className="mt-2 text-emerald-50">Sundanese Educational Game</p>
        <div className="mt-10 flex w-full max-w-sm flex-col gap-3">
          <Btn onClick={onLearn} className="text-lg"><BookOpen className="mr-2 inline h-5 w-5" />Belajar Aksara Sunda</Btn>
          <Btn variant="soft" onClick={onWriting} className="text-lg">Latihan Menulis</Btn>
          <Btn variant="soft" onClick={onReading} className="text-lg"><Volume2 className="mr-2 inline h-5 w-5" />Latihan Membaca</Btn>
          <Btn variant="soft" onClick={onQuiz} className="text-lg"><Trophy className="mr-2 inline h-5 w-5" />Kuis</Btn>
          <Btn variant="ghost" onClick={onProgress} className="text-lg">Lihat Progres</Btn>
          <Btn variant="ghost" className="text-lg" onClick={onSettings}>Pengaturan</Btn>
          <Btn variant="danger" onClick={onExit} className="text-lg">Keluar</Btn>
        </div>
      </div>
    </Frame>
  );
}

function LevelSelect({ progress, onPick, onBack }: any) {
  return (
    <Frame>
      <Panel className="mx-auto mt-6 w-full max-w-3xl p-8">
        <h2 className="text-center text-3xl font-bold text-primary">PILIH LEVEL</h2>
        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          {LEVELS.map((l) => {
            const unlocked = l.id <= progress.highestLevel;
            return (
              <button
                key={l.id}
                onClick={() => unlocked && onPick(l.id)}
                disabled={!unlocked}
                className={`rounded-xl border-2 p-4 text-center transition ${unlocked ? "border-primary bg-amber-50 hover:scale-105" : "border-muted bg-muted/40 opacity-60"}`}
              >
                <div className="font-bold">Level {l.id}</div>
                <div className="mt-1 text-xs text-muted-foreground">{l.name}</div>
                <div className="mt-3 flex justify-center">
                  {unlocked ? <Star className="h-10 w-10 fill-amber-400 text-amber-500" /> : <Lock className="h-10 w-10 text-muted-foreground" />}
                </div>
                <div className="mt-2 text-xs">{unlocked ? `0/${l.id === 1 ? 30 : 20}` : "Terkunci"}</div>
              </button>
            );
          })}
        </div>
        <p className="mt-6 text-center text-sm text-muted-foreground">Selesaikan level sebelumnya untuk membuka level berikutnya.</p>
      </Panel>
      <div className="mt-4"><Btn variant="ghost" onClick={onBack}><ChevronLeft className="mr-1 inline h-4 w-4" />Kembali</Btn></div>
    </Frame>
  );
}

function Settings({ progress, onSave, onReset, onBack, onToggleMusic, onToggleSfx, onChangeProfile }: { progress: any; onSave: (n: string) => void; onReset: () => void; onBack: () => void; onToggleMusic: () => void; onToggleSfx: () => void; onChangeProfile: () => void }) {
  const [name, setName] = useState(progress.name);
  const [confirm, setConfirm] = useState(false);
  return (
    <Frame title="Pengaturan">
      <Panel className="mx-auto mt-6 w-full max-w-2xl p-8">
        <h2 className="text-2xl font-bold text-primary">Pengaturan</h2>
        <div className="mt-6 space-y-4">
          <div>
            <label className="text-sm font-semibold">Nama Pemain</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-lg border-2 border-emerald-950/40 bg-white/70 px-4 py-3 outline-none focus:border-primary"
            />
            <Btn className="mt-2" onClick={() => name.trim() && onSave(name.trim())}>Simpan Nama</Btn>
          </div>
          <div className="border-t border-emerald-950/20 pt-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold"><Music className="h-4 w-4" />Musik</div>
              <Btn variant={progress.music ? "primary" : "ghost"} onClick={onToggleMusic}>{progress.music ? "ON" : "OFF"}</Btn>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold"><Volume2 className="h-4 w-4" />Efek Suara</div>
              <Btn variant={progress.sfx ? "primary" : "ghost"} onClick={onToggleSfx}>{progress.sfx ? "ON" : "OFF"}</Btn>
            </div>
          </div>
          <div className="border-t border-emerald-950/20 pt-4">
            <div className="text-sm font-semibold">Ganti Profil</div>
            <p className="text-xs text-muted-foreground">Kembali ke halaman input nama untuk berganti pemain.</p>
            <Btn variant="soft" className="mt-2" onClick={onChangeProfile}>Ganti Profil</Btn>
          </div>
          <div className="border-t border-emerald-950/20 pt-4">
            <div className="text-sm font-semibold">Reset Progres</div>
            <p className="text-xs text-muted-foreground">Hapus semua skor, level, dan riwayat. Aksi ini tidak bisa dibatalkan.</p>
            {!confirm ? (
              <Btn variant="danger" className="mt-2" onClick={() => setConfirm(true)}>
                <Trash2 className="mr-1 inline h-4 w-4" />Reset Progres
              </Btn>
            ) : (
              <div className="mt-2 flex gap-2">
                <Btn variant="danger" onClick={() => { onReset(); setConfirm(false); }}>Ya, Reset</Btn>
                <Btn variant="ghost" onClick={() => setConfirm(false)}>Batal</Btn>
              </div>
            )}
          </div>
        </div>
      </Panel>
      <div className="mt-4"><Btn variant="ghost" onClick={onBack}><ChevronLeft className="mr-1 inline h-4 w-4" />Kembali</Btn></div>
    </Frame>
  );
}

function Learn({ level, onNext, onBack }: { level: number; onNext: () => void; onBack: () => void }) {
  const list = AKSARA_DASAR;
  const [i, setI] = useState(0);
  const a = list[i];
  return (
    <Frame title={`Level ${level} - Huruf Dasar`}>
      <div className="mb-2 text-right text-sm font-semibold text-emerald-50">{i + 1} / {list.length}</div>
      <Panel className="relative mx-auto w-full max-w-2xl p-10 text-center">
        <div className="font-aksara text-[180px] leading-none text-foreground">{a.char}</div>
        <button onClick={() => speak(a.latin)} className="absolute right-6 top-6 rounded-full bg-primary p-3 text-primary-foreground shadow"><Volume2 className="h-6 w-6" /></button>
        <div className="mt-6 text-2xl">Bacaannya: <span className="font-bold text-primary">{a.latin}</span></div>
        <div className="mt-1 text-sm text-muted-foreground">Dengar suara lalu ulangi bacaannya.</div>
      </Panel>
      <div className="mt-6 flex justify-between">
        <Btn variant="ghost" onClick={() => i === 0 ? onBack() : setI(i - 1)}><RotateCcw className="mr-1 inline h-4 w-4" />Sebelumnya</Btn>
        <Btn onClick={() => i + 1 < list.length ? setI(i + 1) : onNext()}>Selanjutnya<ChevronRight className="ml-1 inline h-4 w-4" /></Btn>
      </div>
    </Frame>
  );
}

function Quiz({ level, onDone, onBack }: { level: number; onDone: (score: number, correct: number, total: number) => void; onBack: () => void }) {
  const total = 10;
  const questions = useMemo(() => shuffle(AKSARA_DASAR).slice(0, total), []);
  const [i, setI] = useState(0);
  const [hearts, setHearts] = useState(3);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [feedback, setFeedback] = useState<null | { ok: boolean; answer: string }>(null);

  const q = questions[i];
  const options = useMemo(() => {
    const wrongs = shuffle(AKSARA_DASAR.filter((x) => x.latin !== q.latin)).slice(0, 3);
    return shuffle([q, ...wrongs]);
  }, [q]);

  const choose = (latin: string) => {
    if (feedback) return;
    const ok = latin === q.latin;
    setFeedback({ ok, answer: q.latin });
    if (ok) { setScore((s) => s + 10); setCorrect((c) => c + 1); toast.success("Léres! Jawaban benar."); audio.correct(); }
    else { setHearts((h) => h - 1); toast.error(`Salah. Jawaban: ${q.latin}`); audio.wrong(); }
  };

  const next = () => {
    const newHearts = feedback?.ok ? hearts : hearts; // already decremented
    const gameOver = !feedback?.ok && newHearts <= 0;
    setFeedback(null);
    if (gameOver || i + 1 >= total) onDone(score, correct, total);
    else setI(i + 1);
  };

  if (feedback) {
    return (
      <Frame title={`Level ${level} - Huruf Dasar`}>
        <TopBar hearts={hearts} score={score} />
        <Panel className="mx-auto mt-6 w-full max-w-2xl p-12 text-center">
          {feedback.ok ? (
            <>
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary text-primary-foreground"><Check className="h-12 w-12" /></div>
              <h2 className="mt-4 text-5xl font-bold text-primary">LÉRES!</h2>
              <p className="mt-2 text-lg">Jawabanmu benar!</p>
              <img src={sgHappy} alt="" className="mx-auto mt-3 h-44 w-auto" />
            </>
          ) : (
            <>
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-destructive text-destructive-foreground"><X className="h-12 w-12" /></div>
              <h2 className="mt-4 text-5xl font-bold text-destructive">SALAH!</h2>
              <p className="mt-2 text-lg">Jawaban yang benar adalah:</p>
              <img src={sgConfused} alt="" className="mx-auto mt-3 h-44 w-auto" />
            </>
          )}
          <div className="mt-3 text-4xl font-bold">{feedback.answer}</div>
          <Btn onClick={next} className="mt-8 w-full max-w-xs">Lanjut</Btn>
        </Panel>
      </Frame>
    );
  }

  return (
    <Frame title={`Level ${level} - Huruf Dasar`}>
      <TopBar hearts={hearts} score={score} onBack={onBack} />
      <Panel className="mx-auto mt-6 w-full max-w-2xl p-8">
        <p className="text-center text-sm text-muted-foreground">Pilih jawaban yang sesuai dengan aksara Sunda berikut!</p>
        <div className="mt-4 rounded-xl border-2 border-dashed border-emerald-950/30 p-6 text-center">
          <div className="font-aksara text-[140px] leading-none">{q.char}</div>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3">
          {options.map((o) => (
            <button key={o.latin} onClick={() => { audio.click(); choose(o.latin); }} className="rounded-xl border-2 border-emerald-950/40 bg-[var(--paper-deep)] py-4 text-xl font-bold hover:border-primary hover:bg-primary hover:text-primary-foreground">
              {o.latin}
            </button>
          ))}
        </div>
        <div className="mt-4 text-right text-sm text-muted-foreground">{i + 1} / {total}</div>
      </Panel>
    </Frame>
  );
}

function TopBar({ hearts, score, onBack }: { hearts: number; score: number; onBack?: () => void }) {
  return (
    <div className="flex items-center justify-between">
      {onBack ? <Btn variant="ghost" onClick={onBack} className="px-3 py-1 text-xs"><ChevronLeft className="inline h-3 w-3" /></Btn> : <div />}
      <div className="flex items-center gap-3">
        <div className="flex gap-1">
          {[0,1,2].map((n) => <Heart key={n} className={`h-6 w-6 ${n < hearts ? "fill-red-500 text-red-500" : "text-muted-foreground/40"}`} />)}
        </div>
        <Panel className="px-3 py-1 text-sm font-bold">Skor: {score}</Panel>
      </div>
    </div>
  );
}

function Writing({ onBack }: { onBack: () => void }) {
  const list = AKSARA_DASAR;
  const [i, setI] = useState(0);
  const [paths, setPaths] = useState<string[]>([]);
  const [drawing, setDrawing] = useState(false);
  const a = list[i];

  const onPointer = (e: React.PointerEvent<SVGSVGElement>, type: "down" | "move" | "up") => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left, y = e.clientY - rect.top;
    if (type === "down") { setDrawing(true); setPaths((p) => [...p, `M ${x} ${y}`]); }
    else if (type === "move" && drawing) {
      setPaths((p) => { const c = [...p]; c[c.length - 1] += ` L ${x} ${y}`; return c; });
    } else if (type === "up") setDrawing(false);
  };

  return (
    <Frame title="Latihan Menulis">
      <div className="mb-2 flex items-center justify-between">
        <Panel className="px-3 py-1 text-sm">Latihan Menulis</Panel>
        <div className="text-sm font-semibold text-emerald-50">{i + 1} / {list.length}</div>
      </div>
      <Panel className="mx-auto w-full max-w-2xl p-6 text-center">
        <p className="text-sm">Tebalkan aksara Sunda berikut!</p>
        <div className="relative mx-auto mt-3 aspect-square w-full max-w-md rounded-xl border-2 border-dashed border-emerald-950/40 bg-amber-50/40">
          <div className="font-aksara pointer-events-none absolute inset-0 flex items-center justify-center text-[260px] leading-none text-emerald-950/20">{a.char}</div>
          <svg
            className="absolute inset-0 h-full w-full touch-none"
            onPointerDown={(e) => onPointer(e, "down")}
            onPointerMove={(e) => onPointer(e, "move")}
            onPointerUp={(e) => onPointer(e, "up")}
            onPointerLeave={(e) => onPointer(e, "up")}
          >
            {paths.map((d, idx) => <path key={idx} d={d} stroke="oklch(0.5 0.14 145)" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round" />)}
          </svg>
          <button onClick={() => speak(a.latin)} className="absolute right-3 bottom-3 rounded-full bg-primary p-2 text-primary-foreground"><Volume2 className="h-5 w-5" /></button>
        </div>
        <div className="mt-2 text-xl">Bacaan: <b className="text-primary">{a.latin}</b></div>
      </Panel>
      <div className="mt-4 flex justify-between">
        <Btn variant="ghost" onClick={() => setPaths([])}><RotateCcw className="mr-1 inline h-4 w-4" />Ulangi</Btn>
        <div className="flex gap-2">
          <Btn variant="ghost" onClick={onBack}>Menu</Btn>
          <Btn variant="soft" onClick={() => {
            if (paths.length < 1) { toast.error("Coba tebalkan dulu aksaranya!"); return; }
      toast.success(`Bagus! Kamu menulis "${a.latin}"`);
      audio.correct();
          }}><Check className="mr-1 inline h-4 w-4" />Selesai</Btn>
          <Btn onClick={() => { setPaths([]); setI((i + 1) % list.length); }}>Selanjutnya</Btn>
        </div>
      </div>
    </Frame>
  );
}

function Reading({ onDone, onBack }: { onDone: (score: number, correct: number, total: number) => void; onBack: () => void }) {
  const [i, setI] = useState(0);
  const [ans, setAns] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const k = KATA[i];
  const check = () => {
    const ok = ans.trim().toLowerCase() === k.latin.toLowerCase();
    if (ok) {
      setScore((s) => s + 10);
      setCorrect((c) => c + 1);
      toast.success("Léres! Jawaban benar.");
      audio.correct();
      setMsg("Léres! Jawaban benar.");
    } else {
      toast.error(`Salah. Jawaban: ${k.latin}`);
      audio.wrong();
      setMsg(`Salah. Jawaban: ${k.latin}`);
    }
  };
  const next = () => {
    setAns(""); setMsg(null);
    if (i + 1 >= KATA.length) onDone(score, correct, KATA.length); else setI(i + 1);
  };
  return (
    <Frame title="Membaca Kata">
      <div className="mb-2 flex items-center justify-between">
        <Panel className="px-3 py-1 text-sm">Membaca Kata</Panel>
        <div className="text-sm font-semibold text-emerald-50">{i + 1} / {KATA.length}</div>
      </div>
      <Panel className="mx-auto w-full max-w-2xl p-8 text-center">
        <p className="text-sm">Baca kata aksara Sunda berikut!</p>
        <div className="font-aksara mx-auto mt-4 rounded-xl border-2 border-dashed border-emerald-950/30 p-6 text-[110px] leading-none">{k.aksara}</div>
        <button onClick={() => speak(k.latin)} className="mx-auto mt-3 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-primary-foreground"><Volume2 className="h-5 w-5" />Dengar</button>
        <div className="mt-6 text-left">
          <p className="text-sm">Tulis bacaan latin di bawah ini!</p>
          <input value={ans} onChange={(e) => setAns(e.target.value)} placeholder="Ketik jawaban..." className="mt-2 w-full rounded-lg border-2 border-emerald-950/40 bg-white/70 px-4 py-3 outline-none focus:border-primary" />
        </div>
        {msg && <div className={`mt-3 font-semibold ${msg.startsWith("Léres") ? "text-primary" : "text-destructive"}`}>{msg}</div>}
        {msg && (
          <img
            src={msg.startsWith("Léres") ? sgCheer : sgConfused}
            alt=""
            className="mx-auto mt-2 h-32 w-auto"
          />
        )}
        <div className="mt-4 flex justify-end gap-2">
          <Btn variant="ghost" onClick={onBack}>Menu</Btn>
          {msg ? <Btn onClick={next}>Selanjutnya</Btn> : <Btn onClick={check}>Cek Jawaban</Btn>}
        </div>
      </Panel>
    </Frame>
  );
}

function Result({ score, correct, total, level, onAgain, onNext, onMenu, onProgress, onExit }: any) {
  const stars = Math.round((correct / total) * 3);
  const label = stars === 3 ? "Hebat!" : stars === 2 ? "Cukup Baik!" : "Coba Lagi!";
  const passed = correct / total >= 0.7;
  return (
    <Frame>
      <Panel className="mx-auto mt-12 w-full max-w-2xl p-8">
        <div className="mx-auto mb-4 w-fit rounded-lg bg-primary px-6 py-2 font-bold text-primary-foreground">HASIL PERMAINAN</div>
        <div className="grid grid-cols-2 gap-6">
          <div className="rounded-xl bg-[var(--paper-deep)] p-6 text-center">
            <div className="text-sm">Skor Akhir</div>
            <div className="my-1 text-6xl font-bold text-primary">{score}</div>
            <div className="flex justify-center gap-1">{[0,1,2].map((n) => <Star key={n} className={`h-7 w-7 ${n < stars ? "fill-amber-400 text-amber-500" : "text-muted-foreground/40"}`} />)}</div>
            <div className="mt-2 font-semibold">{label}</div>
          </div>
          <div className="rounded-xl bg-[var(--paper-deep)] p-6 text-sm">
            <Row k="Benar" v={correct} />
            <Row k="Salah" v={total - correct} />
            <Row k="Total Soal" v={total} />
            <Row k="Level" v={level} />
          </div>
        </div>
        <div className={`mt-4 rounded-lg p-3 text-center text-sm font-semibold ${passed ? "bg-primary/15 text-primary" : "bg-destructive/15 text-destructive"}`}>
          {passed ? <><Trophy className="mr-1 inline h-4 w-4" />Skor memenuhi syarat untuk naik level!</> : "Skor belum cukup. Tetap di level ini, ulangi ya!"}
        </div>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Btn onClick={onAgain}>Main Lagi</Btn>
          <Btn variant="soft" onClick={onNext} disabled={!passed}>Lanjut Level</Btn>
          <Btn variant="ghost" onClick={onProgress}>Lihat Progres</Btn>
          <Btn variant="ghost" onClick={onMenu}>Menu Utama</Btn>
          <Btn variant="danger" onClick={onExit}>Keluar Game</Btn>
        </div>
      </Panel>
    </Frame>
  );
}

function FinalCelebration({ onMenu }: { onMenu: () => void }) {
  return (
    <Frame title="Selesai">
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <PartyPopper className="h-12 w-12 text-amber-300 drop-shadow" />
        <h1 className="mt-2 text-6xl font-bold text-amber-100 drop-shadow-lg">WILUJENG!</h1>
        <p className="mt-3 max-w-md text-lg text-emerald-50 drop-shadow">
          Kamu telah menyelesaikan permainan ini.
        </p>
        <img src={sgWave} alt="" className="my-6 h-64 w-auto rounded-2xl object-cover drop-shadow-xl" />
        <Btn onClick={onMenu} className="px-10 text-lg"><Home className="mr-2 inline h-5 w-5" />Selesai</Btn>
      </div>
    </Frame>
  );
}
function Row({ k, v }: { k: string; v: any }) {
  return <div className="flex justify-between border-b border-emerald-950/10 py-2 last:border-0"><span>{k}</span><span className="font-bold">: {v}</span></div>;
}

function ProgressScreen({ progress, onBack }: any) {
  return (
    <Frame>
      <Panel className="mx-auto mt-6 w-full max-w-3xl p-8">
        <div className="mb-4 inline-flex w-fit rounded-md bg-emerald-950/80 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-amber-100">Progres Pembelajaran</div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="flex flex-col items-center justify-center text-center">
            <img src={avatar} alt="" width={140} height={140} className="rounded-full bg-amber-100 p-2" />
            <div className="mt-2 text-xl font-bold">{progress.name || "Pamaén"}</div>
          </div>
          <div className="space-y-2 text-sm">
            <Row k="Total Skor" v={progress.totalScore} />
            <Row k="Level Tertinggi" v={progress.highestLevel} />
            <Row k="Total Bermain" v={`${progress.totalPlays} Kali`} />
          </div>
        </div>
        <div className="mt-6">
          <div className="rounded-t-lg bg-primary px-4 py-2 font-semibold text-primary-foreground">Riwayat Skor</div>
          <div className="rounded-b-lg border-2 border-t-0 border-emerald-950/30 bg-[var(--paper-deep)] p-3">
            {progress.history.length === 0 ? (
              <div className="py-4 text-center text-sm text-muted-foreground">Belum ada riwayat permainan.</div>
            ) : progress.history.map((h: any, idx: number) => (
              <div key={idx} className="grid grid-cols-4 border-b border-emerald-950/10 py-2 text-sm last:border-0">
                <span>{idx + 1}.</span><span>{h.date}</span><span>Level {h.level}</span><span className="text-right font-bold">{h.score}</span>
              </div>
            ))}
          </div>
        </div>
      </Panel>
      <div className="mt-4"><Btn variant="ghost" onClick={onBack}><ChevronLeft className="mr-1 inline h-4 w-4" />Kembali</Btn></div>
    </Frame>
  );
}
