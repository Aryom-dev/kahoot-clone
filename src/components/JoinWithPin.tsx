"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Hash } from "lucide-react";

export default function JoinWithPin() {
  const [pin, setPin] = useState<string>("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    const clean = pin.trim();
    if (clean.length < 4) return;
    router.push(`/play?pin=${encodeURIComponent(clean)}`);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full flex-col gap-3 sm:flex-row"
    >
      <label htmlFor="pin-input" className="sr-only">
        PIN del juego
      </label>
      <div className="relative flex-1">
        <Hash className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
        <input
          id="pin-input"
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 8))}
          inputMode="numeric"
          placeholder="Introduce el PIN"
          className="h-[46px] w-full rounded-full border border-white/10 bg-white/[0.06] py-2 pl-10 pr-4 text-sm font-medium tracking-widest text-white placeholder:tracking-normal placeholder:font-normal placeholder:text-zinc-500 backdrop-blur-xl outline-none transition focus:border-white/20 focus:bg-white/[0.08] focus:ring-2 focus:ring-white/10"
        />
      </div>
      <button
        type="submit"
        disabled={pin.trim().length < 4}
        className="inline-flex h-[46px] shrink-0 items-center justify-center gap-2 rounded-full bg-white px-7 text-sm font-semibold text-black transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Unirse
        <ArrowRight className="h-4 w-4" />
      </button>
    </form>
  );
}
