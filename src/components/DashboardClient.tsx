"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Sparkles } from "lucide-react";
import QuizCard, { type QuizCardProps } from "@/components/QuizCard";
import { DATABASE_DEMO_QUIZ, seedDemoQuizzes } from "@/lib/demoQuizzes";

type Props = {
  initialQuizzes: QuizCardProps[];
  userEmail?: string;
};

export default function DashboardClient({
  initialQuizzes,
  userEmail,
}: Props) {
  useEffect(() => {
    seedDemoQuizzes();
  }, []);

  const [quizzes] = useState<QuizCardProps[]>(() => {
    // Fusión inicial de quizzes de Supabase con respaldo en localStorage y Demo Quiz
    if (typeof window === "undefined") {
      return initialQuizzes.length > 0
        ? initialQuizzes
        : [
            {
              id: DATABASE_DEMO_QUIZ.id,
              title: DATABASE_DEMO_QUIZ.title,
              createdAt: "Destacado",
              questions: DATABASE_DEMO_QUIZ.questions.length,
            },
          ];
    }
    try {
      seedDemoQuizzes();
      const localData = localStorage.getItem("monolith_quizzes");
      const parsed = localData
        ? (JSON.parse(localData) as Array<{
            id: string;
            title: string;
            created_at?: string;
            questions?: unknown[];
          }>)
        : [];

      const formattedLocal: QuizCardProps[] = parsed.map((q) => ({
        id: q.id,
        title: q.title || "Quiz sin título",
        createdAt: q.created_at
          ? new Date(q.created_at).toLocaleDateString("es-ES")
          : "Reciente",
        questions: Array.isArray(q.questions) ? q.questions.length : 0,
      }));

      const map = new Map<string, QuizCardProps>();

      // Añadir quiz de demostración por defecto
      map.set(DATABASE_DEMO_QUIZ.id, {
        id: DATABASE_DEMO_QUIZ.id,
        title: DATABASE_DEMO_QUIZ.title,
        createdAt: "Destacado",
        questions: DATABASE_DEMO_QUIZ.questions.length,
      });

      formattedLocal.forEach((q) => map.set(q.id, q));
      initialQuizzes.forEach((q) => map.set(q.id, q));

      return Array.from(map.values());
    } catch (e) {
      console.log("Error merging local quizzes:", e);
    }
    return initialQuizzes.length > 0
      ? initialQuizzes
      : [
          {
            id: DATABASE_DEMO_QUIZ.id,
            title: DATABASE_DEMO_QUIZ.title,
            createdAt: "Destacado",
            questions: DATABASE_DEMO_QUIZ.questions.length,
          },
        ];
  });

  return (
    <div className="flex flex-1 flex-col">
      <section className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-8 sm:px-6 sm:py-10">
        {/* Encabezado */}
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.04] px-3 py-1 text-xs font-medium text-zinc-400 backdrop-blur">
              <Sparkles className="h-3 w-3" />
              Panel del creador {userEmail ? `(${userEmail})` : "(Invitado / Demo)"}
            </div>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-white sm:text-[28px] sm:leading-none">
              Tus Juegos en Monolith
            </h1>
            <p className="mt-2 max-w-[52ch] text-sm leading-6 text-zinc-400 sm:text-[14px]">
              Gestiona, edita y lanza tus partidas en vivo. Crea un nuevo juego
              o continúa donde lo dejaste.
            </p>
          </div>

          <Link
            href="/create"
            className="inline-flex h-11 shrink-0 items-center justify-center gap-2 self-start rounded-full bg-white px-6 text-sm font-semibold text-black shadow-[0_1px_0_rgba(255,255,255,0.15)_inset,0_8px_24px_rgba(255,255,255,0.08)] transition hover:bg-zinc-100 sm:self-auto"
          >
            <Plus className="h-4 w-4" />
            Crear Nuevo Juego
          </Link>
        </div>

        <div className="mt-8 h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />



        {quizzes.length > 0 ? (
          <>
            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
              {quizzes.map((quiz) => (
                <QuizCard key={quiz.id} {...quiz} />
              ))}
            </div>
            <p className="mt-8 text-xs leading-5 text-zinc-500">
              Mostrando {quizzes.length} juego{quizzes.length !== 1 ? "s" : ""}{" "}
              de tu biblioteca.
            </p>
          </>
        ) : (
          <div className="mt-12 flex flex-col items-center justify-center rounded-[22px] border border-dashed border-white/10 bg-white/[0.03] px-6 py-14 text-center backdrop-blur">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-black">
              <Sparkles className="h-5 w-5" />
            </div>
            <p className="mt-4 text-sm font-semibold text-white">
              Aún no tienes juegos
            </p>
            <p className="mt-1 max-w-[36ch] text-sm leading-6 text-zinc-500">
              Crea tu primer juego en Monolith y aparecerá aquí. Podrás editarlo
              y lanzarlo en vivo con un PIN.
            </p>
            <Link
              href="/create"
              className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-full bg-white px-6 text-sm font-semibold text-black shadow-[0_8px_24px_rgba(255,255,255,0.08)] transition hover:bg-zinc-100"
            >
              <Plus className="h-4 w-4" />
              Crear Nuevo Juego
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
