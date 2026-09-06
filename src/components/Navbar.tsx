"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import {
  Hexagon,
  LayoutDashboard,
  Plus,
  LogIn,
  LogOut,
  User,
  Menu,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { logout } from "@/app/auth/actions";

type UserState = {
  email?: string;
  id?: string;
} | null;

export default function Navbar() {
  const [open, setOpen] = useState<boolean>(false);
  const [user, setUser] = useState<UserState>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const supabase = createClient();

    // 1. Obtener usuario inicial
    const fetchUser = async () => {
      try {
        const { data } = await supabase.auth.getUser();
        setUser(data.user ? { email: data.user.email, id: data.user.id } : null);
      } catch (e) {
        console.log("Error fetching user in Navbar:", e);
      }
    };
    void fetchUser();

    // 2. Suscribirse a cambios en la autenticación (Login, Logout, Token Refresh)
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ? { email: session.user.email, id: session.user.id } : null);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleLogout = (): void => {
    startTransition(async () => {
      await logout();
      setUser(null);
    });
  };

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#08080a]/70 backdrop-blur-xl">
      <nav className="mx-auto flex h-[64px] w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2.5"
          onClick={() => setOpen(false)}
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-black">
            <Hexagon className="h-[18px] w-[18px] stroke-[2.2]" />
          </span>
          <span className="text-[17px] font-semibold tracking-tight text-white">
            Monolith
          </span>
        </Link>

        {/* Desktop links */}
        <div className="hidden items-center gap-1 md:flex">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium text-zinc-400 transition hover:bg-white/[0.06] hover:text-white"
          >
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </Link>
          <Link
            href="/create"
            className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium text-zinc-400 transition hover:bg-white/[0.06] hover:text-white"
          >
            <Plus className="h-4 w-4" />
            Crear Juego
          </Link>
        </div>

        {/* Right side — Dinámico según estado de autenticación */}
        <div className="flex items-center gap-2">
          {user ? (
            <div className="hidden items-center gap-3 md:flex">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3.5 py-1.5 text-xs font-medium text-zinc-300 backdrop-blur">
                <User className="h-3.5 w-3.5 text-emerald-400" />
                <span className="max-w-[160px] truncate">{user.email}</span>
              </span>

              <button
                type="button"
                onClick={handleLogout}
                disabled={isPending}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-medium text-zinc-300 backdrop-blur transition hover:bg-red-500/20 hover:text-red-300 disabled:opacity-50"
              >
                <LogOut className="h-4 w-4" />
                {isPending ? "Saliendo..." : "Cerrar Sesión"}
              </button>
            </div>
          ) : (
            <Link
              href="/auth/login"
              className="hidden items-center gap-2 rounded-full bg-white px-5 py-2 text-sm font-medium text-black transition hover:bg-zinc-200 md:inline-flex"
            >
              <LogIn className="h-4 w-4" />
              Iniciar Sesión
            </Link>
          )}

          {/* Mobile toggle */}
          <button
            type="button"
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-zinc-300 backdrop-blur transition hover:bg-white/10 hover:text-white md:hidden"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </nav>

      {/* Mobile menu — glassmorphism panel */}
      {open && (
        <div className="border-t border-white/[0.06] bg-[#0a0a0e]/80 backdrop-blur-xl md:hidden">
          <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-4">
            {user && (
              <div className="mb-2 flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] p-3 text-xs text-zinc-300">
                <User className="h-4 w-4 text-emerald-400" />
                <span className="truncate">{user.email}</span>
              </div>
            )}
            <Link
              href="/dashboard"
              onClick={() => setOpen(false)}
              className="inline-flex items-center gap-2.5 rounded-xl border border-white/[0.04] bg-white/[0.04] px-4 py-3 text-sm font-medium text-zinc-200 backdrop-blur transition hover:bg-white/[0.08] hover:text-white"
            >
              <LayoutDashboard className="h-4 w-4 text-zinc-400" />
              Dashboard
            </Link>
            <Link
              href="/create"
              onClick={() => setOpen(false)}
              className="inline-flex items-center gap-2.5 rounded-xl border border-white/[0.04] bg-white/[0.04] px-4 py-3 text-sm font-medium text-zinc-200 backdrop-blur transition hover:bg-white/[0.08] hover:text-white"
            >
              <Plus className="h-4 w-4 text-zinc-400" />
              Crear Juego
            </Link>

            {user ? (
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  handleLogout();
                }}
                disabled={isPending}
                className="mt-2 inline-flex items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-300 transition hover:bg-red-500/20"
              >
                <LogOut className="h-4 w-4" />
                {isPending ? "Saliendo..." : "Cerrar Sesión"}
              </button>
            ) : (
              <Link
                href="/auth/login"
                onClick={() => setOpen(false)}
                className="mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-medium text-black transition hover:bg-zinc-100"
              >
                <LogIn className="h-4 w-4" />
                Iniciar Sesión / Registro
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
