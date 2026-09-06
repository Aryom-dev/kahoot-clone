import Link from "next/link";
import {
  ArrowRight,
  Gamepad2,
  Sparkles,
  Users,
  Zap,
  Trophy,
  Play,
  ShieldCheck,
} from "lucide-react";
import JoinWithPin from "@/components/JoinWithPin";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      {/* HERO */}
      <section className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 pb-12 pt-10 sm:px-6 sm:pt-16 lg:pt-20">
        <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:gap-8">
          {/* Left — copy */}
          <div className="flex flex-col items-start">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.06] px-3 py-1.5 text-xs font-medium text-zinc-300 backdrop-blur-xl">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white text-black">
                <Sparkles className="h-3 w-3" />
              </span>
              Nueva experiencia — tiempo real con Supabase
            </div>

            <h1 className="mt-6 max-w-[18ch] text-balance text-4xl font-semibold leading-[0.95] tracking-tighter text-white sm:text-5xl lg:text-[56px]">
              Crea juegos
              <span className="font-light tracking-tighter text-zinc-400">
                {" "}
                que todos quieren jugar.
              </span>
            </h1>

            <p className="mt-4 max-w-[52ch] text-pretty text-[15px] leading-7 text-zinc-400 sm:text-base sm:leading-7">
              Monolith te permite diseñar quizzes interactivos en segundos y
              jugarlos en vivo. Comparte un PIN y conecta a decenas de
              jugadores al instante — sin fricción, solo juego.
            </p>

            <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <Link
                href="/create"
                className="inline-flex h-[46px] items-center justify-center gap-2 rounded-full bg-white px-7 text-sm font-semibold text-black transition hover:bg-zinc-100"
              >
                Crear juego
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex h-[46px] items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-7 text-sm font-medium text-white backdrop-blur-xl transition hover:bg-white/[0.08]"
              >
                <Gamepad2 className="h-4 w-4 text-zinc-400" />
                Ver Dashboard
              </Link>
            </div>

            <div className="mt-6 flex items-center gap-4 text-xs text-zinc-500">
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5" /> Sin registro para jugar
              </span>
              <span className="h-3 w-px bg-white/10" />
              <span className="inline-flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" /> Hasta 100 jugadores
              </span>
            </div>
          </div>

          {/* Right — glassmorphism PIN card */}
          <div className="relative">
            {/* Glow behind card */}
            <div
              aria-hidden
              className="pointer-events-none absolute -inset-4 -z-10 rounded-[32px] bg-white/[0.04] blur-2xl"
            />

            <div className="relative overflow-hidden rounded-[28px] border border-white/[0.08] bg-white/[0.06] p-6 backdrop-blur-2xl sm:p-7">
              {/* Top accent */}
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              <div className="absolute -top-24 right-[-40px] h-48 w-48 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.08),transparent_70%)] blur-xl" />

              <div className="relative flex flex-col gap-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white text-black">
                      <Play className="h-4 w-4 fill-black" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-white">
                        Únete a una partida
                      </p>
                      <p className="text-xs text-zinc-400">
                        Introduce el PIN del anfitrión
                      </p>
                    </div>
                  </div>
                  <span className="hidden items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium tracking-wide text-emerald-300 sm:inline-flex">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
                    EN VIVO
                  </span>
                </div>

                <JoinWithPin />

                <div className="rounded-2xl border border-white/[0.06] bg-[#0a0a0e]/60 p-4 backdrop-blur">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium tracking-wide text-zinc-500">
                      EJEMPLO
                    </span>
                    <span className="rounded-full bg-white/10 px-2 py-0.5 font-mono text-[11px] text-zinc-300">
                      PIN: 482 913
                    </span>
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    <div className="flex -space-x-2">
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#0a0a0e] bg-zinc-800 text-[10px] font-medium text-white">
                        A
                      </span>
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#0a0a0e] bg-zinc-700 text-[10px] font-medium text-white">
                        B
                      </span>
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#0a0a0e] bg-zinc-600 text-[10px] font-medium text-white">
                        +8
                      </span>
                    </div>
                    <p className="text-xs leading-5 text-zinc-400">
                      Únete sin cuenta. Solo el PIN y tu apodo.
                    </p>
                  </div>
                </div>

                <p className="text-center text-xs leading-5 text-zinc-500">
                  ¿Eres el anfitrión?{" "}
                  <Link
                    href="/create"
                    className="font-medium text-zinc-300 underline decoration-white/20 underline-offset-4 transition hover:text-white hover:decoration-white/40"
                  >
                    Crea tu juego en 30 segundos
                  </Link>
                </p>
              </div>
            </div>

            {/* Floating mini stat */}
            <div className="absolute -bottom-4 -left-2 hidden items-center gap-2.5 rounded-2xl border border-white/10 bg-zinc-900/80 px-4 py-3 backdrop-blur-xl sm:flex lg:-left-6">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white text-black">
                <Trophy className="h-4 w-4" />
              </span>
              <div>
                <p className="text-xs font-semibold leading-none text-white">
                  +12k partidas
                </p>
                <p className="text-[11px] leading-none text-zinc-400">
                  creadas esta semana
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Features — glass cards */}
        <div className="mt-14 grid gap-3 sm:mt-20 sm:grid-cols-3">
          <article className="group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.04] p-5 backdrop-blur-xl transition hover:bg-white/[0.06]">
            <div className="absolute inset-0 bg-gradient-to-b from-white/[0.06] to-transparent opacity-0 transition group-hover:opacity-100" />
            <Zap className="relative h-5 w-5 text-white" />
            <h3 className="relative mt-3 text-sm font-semibold text-white">
              Tiempo real
            </h3>
            <p className="relative mt-1 text-sm leading-6 text-zinc-400">
              Sincronización instantánea con Supabase Realtime. Sin lag, sin
              recargas.
            </p>
          </article>

          <article className="group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.04] p-5 backdrop-blur-xl transition hover:bg-white/[0.06]">
            <div className="absolute inset-0 bg-gradient-to-b from-white/[0.06] to-transparent opacity-0 transition group-hover:opacity-100" />
            <Users className="relative h-5 w-5 text-white" />
            <h3 className="relative mt-3 text-sm font-semibold text-white">
              Cero fricción
            </h3>
            <p className="relative mt-1 text-sm leading-6 text-zinc-400">
              Los jugadores solo necesitan el PIN. Sin apps, sin registro.
            </p>
          </article>

          <article className="group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.04] p-5 backdrop-blur-xl transition hover:bg-white/[0.06]">
            <div className="absolute inset-0 bg-gradient-to-b from-white/[0.06] to-transparent opacity-0 transition group-hover:opacity-100" />
            <Gamepad2 className="relative h-5 w-5 text-white" />
            <h3 className="relative mt-3 text-sm font-semibold text-white">
              Totalmente tuyo
            </h3>
            <p className="relative mt-1 text-sm leading-6 text-zinc-400">
              Preguntas, imágenes y ritmo a tu medida. Control total del host.
            </p>
          </article>
        </div>
      </section>

      {/* Footer minimal */}
      <footer className="mt-auto border-t border-white/[0.06] py-6">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 text-xs text-zinc-500 sm:px-6">
          <span>© {new Date().getFullYear()} Monolith</span>
          <span className="hidden sm:inline">
            Hecho con Next.js + Supabase + Zustand
          </span>
        </div>
      </footer>
    </div>
  );
}
