import Link from "next/link";
import { Hexagon, Mail } from "lucide-react";
import { login } from "../actions";
import PasswordInput from "@/components/PasswordInput";
import SubmitButton from "@/components/SubmitButton";

type LoginPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const error = params.error ? decodeURIComponent(params.error) : "";

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-10 sm:py-14">
      <div className="w-full max-w-[420px]">
        {/* Card glassmorphism */}
        <div className="relative overflow-hidden rounded-[28px] border border-white/[0.08] bg-white/[0.06] p-6 backdrop-blur-2xl sm:p-8">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          <div className="pointer-events-none absolute -top-24 right-[-40px] h-48 w-48 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.07),transparent_70%)] blur-xl" />

          <div className="relative flex flex-col gap-6">
            {/* Header */}
            <div className="flex flex-col items-center text-center">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-black">
                <Hexagon className="h-5 w-5 stroke-[2.2]" />
              </span>
              <h1 className="mt-4 text-xl font-semibold tracking-tight text-white sm:text-[22px]">
                Bienvenido de vuelta
              </h1>
              <p className="mt-1.5 text-sm leading-6 text-zinc-400">
                Inicia sesión para continuar en Monolith
              </p>
            </div>

            {/* Form — Server Action */}
            <form action={login} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="email"
                  className="text-xs font-medium tracking-wide text-zinc-300"
                >
                  Correo electrónico
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    placeholder="tu@ejemplo.com"
                    className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.06] py-2 pl-10 pr-4 text-sm text-white placeholder:text-zinc-500 backdrop-blur outline-none transition focus:border-white/20 focus:bg-white/[0.08] focus:ring-2 focus:ring-white/10"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="text-xs font-medium tracking-wide text-zinc-300"
                  >
                    Contraseña
                  </label>
                  <Link
                    href="#"
                    className="text-xs font-medium text-zinc-500 transition hover:text-zinc-300"
                  >
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>
                <PasswordInput
                  id="password"
                  name="password"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
              </div>

              {error && (
                <p
                  role="alert"
                  className="rounded-xl border border-red-500/20 bg-red-500/10 px-3.5 py-2.5 text-xs leading-5 text-red-300"
                >
                  {error}
                </p>
              )}

              <SubmitButton label="Iniciar sesión" pendingLabel="Entrando..." />
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <span className="h-px flex-1 bg-white/10" />
              <span className="text-[11px] tracking-wide text-zinc-500">O</span>
              <span className="h-px flex-1 bg-white/10" />
            </div>

            {/* Toggle link */}
            <p className="text-center text-sm leading-6 text-zinc-400">
              ¿No tienes cuenta?{" "}
              <Link
                href="/auth/signup"
                className="font-medium text-white underline decoration-white/20 underline-offset-4 transition hover:decoration-white/40"
              >
                Regístrate
              </Link>
            </p>
          </div>
        </div>

        <p className="mt-6 text-center text-xs leading-5 text-zinc-500">
          <Link
            href="/"
            className="transition hover:text-zinc-300 hover:underline hover:decoration-white/20 hover:underline-offset-4"
          >
            ← Volver al inicio
          </Link>
        </p>
      </div>
    </main>
  );
}
