import bg from "@/assets/sunda-bg.jpg";
import { ReactNode } from "react";

export function Frame({ children, title }: { children: ReactNode; title?: string }) {
  return (
    <div
      className="min-h-screen w-full bg-cover bg-center relative"
      style={{ backgroundImage: `url(${bg})` }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-emerald-900/20 via-transparent to-emerald-950/40" />
      {/* leafy borders */}
      <div className="pointer-events-none absolute inset-0 ring-[14px] ring-emerald-950/60 ring-inset" />
      <div className="relative z-10 mx-auto flex min-h-screen max-w-5xl flex-col px-6 py-10">
        {title && (
          <div className="mb-4 inline-flex w-fit rounded-md bg-emerald-950/80 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-amber-100">
            {title}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={
        "rounded-2xl border-2 border-emerald-950/70 bg-[var(--paper)] shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)] " +
        className
      }
    >
      {children}
    </div>
  );
}
