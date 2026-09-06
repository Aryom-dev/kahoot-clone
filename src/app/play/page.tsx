import Link from "next/link";
import { Hash, User, Gamepad2, Users } from "lucide-react";
import { joinGame } from "./actions";
import SubmitButton from "@/components/SubmitButton";
import AvatarPicker from "@/components/AvatarPicker";

type PlayPageProps = {
  searchParams: Promise<{ error?: string; pin?: string }>;
};

export default async function PlayPage({ searchParams }: PlayPageProps) {
  const params = await searchParams;
  const error = params.error ? decodeURIComponent(params.error) : "";
  const initialPin = params.pin ? decodeURIComponent(params.pin) : "";

  return (
    <main className="flex flex-1 flex-col">
      {/* Mobile-first: base 320px, centra y escala con sm */}
      <div className="mx-auto flex w-full max-w-[420px] flex-1 flex-col px-4 py-6 sm:max-w-md sm:py-10">
        {/* Header mobile */}
        <div className="flex flex-col items-center text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.04] px-3 py-1 text-xs font-medium text-zinc-400 backdrop-blur">
            <Gamepad2 className="h-3 w-3" />
            Modo jugador — sin registro
          </span>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-white">
            Únete a Monolith
          </h1>
          <p className="mt-1.5 text-sm leading-6 text-zinc-400">
            Introduce el PIN del host y tu apodo para entrar a la sala.
          </p>
        </div>

        {/* Card glassmorphism — mobile-first base, sm mejora */}
        <div className="relative mt-6 overflow-hidden rounded-[28px] border border-white/[0.08] bg-white/[0.06] p-5 backdrop-blur-2xl sm:p-6">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          <div className="pointer-events-none absolute -top-20 right-[-30px] h-40 w-40 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.07),transparent_70%)] blur-xl" />

          <form action={joinGame} className="relative flex flex-col gap-4">
            <div className="mb-2 flex justify-center">
              <AvatarPicker />
            </div>
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="pin"
                className="text-xs font-semibold tracking-widest text-zinc-400"
              >
                PIN DEL JUEGO
              </label>
              <div className="relative">
                <Hash className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <input
                  id="pin"
                  name="pin"
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  required
                  defaultValue={initialPin}
                  placeholder="Ej. 482913"
                  pattern="[0-9]*"
                  maxLength={6}
                  className="h-12 w-full rounded-2xl border border-white/10 bg-[#0a0a0e]/60 py-2 pl-10 pr-4 text-center font-mono text-lg font-bold tracking-[0.2em] text-white placeholder:font-sans placeholder:text-sm placeholder:font-normal placeholder:tracking-normal placeholder:text-zinc-500 backdrop-blur outline-none transition focus:border-white/20 focus:bg-[#0a0a0e]/80 focus:ring-2 focus:ring-white/10 sm:h-11 sm:text-base"
                />
              </div>
              <p className="text-xs leading-5 text-zinc-500">
                6 dígitos que te dio el anfitrión.
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="nickname"
                className="text-xs font-semibold tracking-widest text-zinc-400"
              >
                TU NOMBRE / APODO
              </label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <input
                  id="nickname"
                  name="nickname"
                  type="text"
                  autoComplete="nickname"
                  required
                  placeholder="Ej. Alex"
                  maxLength={24}
                  className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.06] py-2 pl-10 pr-4 text-base font-medium text-white placeholder:text-zinc-500 backdrop-blur outline-none transition focus:border-white/20 focus:bg-white/[0.08] focus:ring-2 focus:ring-white/10 sm:h-11 sm:text-sm"
                />
              </div>
            </div>

            {error && (
              <p
                role="alert"
                className="rounded-2xl border border-red-500/20 bg-red-500/10 px-3.5 py-3 text-sm leading-5 text-red-300"
              >
                {error}
              </p>
            )}

            <SubmitButton label="Unirse a la partida" pendingLabel="Uniéndote..." />
          </form>

          <div className="mt-4 flex items-center gap-2 rounded-2xl border border-white/[0.06] bg-[#0a0a0e]/50 p-3">
            <Users className="h-4 w-4 shrink-0 text-zinc-500" />
            <p className="text-xs leading-5 text-zinc-400">
              No necesitas cuenta. Si el PIN existe y la sala está en{" "}
              <span className="font-mono font-medium text-zinc-200">lobby</span>,
              entrarás al instante.
            </p>
          </div>
        </div>

        <p className="mt-6 text-center text-xs leading-5 text-zinc-500">
          ¿Eres el anfitrión?{" "}
          <Link
            href="/dashboard"
            className="font-medium text-zinc-300 underline decoration-white/20 underline-offset-4 hover:text-white hover:decoration-white/40"
          >
            Crea tu juego
          </Link>{" "}
          ·{" "}
          <Link
            href="/"
            className="underline decoration-white/20 underline-offset-4 hover:text-zinc-300"
          >
            Inicio
          </Link>
        </p>
      </div>
    </main>
  );
}
