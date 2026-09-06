"use client";

import Link from "next/link";
import { useTransition } from "react";
import { Calendar, FileQuestion, Pencil, Play, Trash2 } from "lucide-react";
import { deleteQuiz } from "@/app/create/actions";

export type QuizCardProps = {
  id: string;
  title: string;
  createdAt: string;
  questions: number;
};

export default function QuizCard({
  id,
  title,
  createdAt,
  questions,
}: QuizCardProps) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = (): void => {
    if (confirm(`¿Estás seguro de eliminar "${title}"?`)) {
      startTransition(async () => {
        await deleteQuiz(id);
      });
    }
  };

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-[22px] border border-white/[0.08] bg-white/[0.06] backdrop-blur-2xl transition hover:border-white/[0.12] hover:bg-white/[0.08]">
      {/* top accent */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      <div className="pointer-events-none absolute -top-20 right-[-30px] h-36 w-36 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.07),transparent_70%)] opacity-0 blur-xl transition group-hover:opacity-100" />

      {/* Cover placeholder */}
      <div className="relative m-3 rounded-2xl border border-white/[0.06] bg-gradient-to-br from-white/[0.08] via-white/[0.03] to-transparent p-4">
        <div className="absolute inset-0 rounded-2xl bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.08),transparent_60%)]" />
        <div className="relative flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 text-[11px] font-medium tracking-wide text-zinc-300 backdrop-blur">
            <FileQuestion className="h-3 w-3" />
            {questions} pregunta{questions !== 1 ? "s" : ""}
          </span>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isPending}
            title="Eliminar juego"
            className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-zinc-400 backdrop-blur transition hover:bg-red-500/20 hover:text-red-300 disabled:opacity-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
        <h3 className="relative mt-4 line-clamp-2 text-[15px] font-semibold leading-6 text-white">
          {title}
        </h3>
      </div>

      <div className="relative flex flex-1 flex-col gap-4 px-5 pb-5 pt-1">
        <div className="flex items-center gap-1.5 text-xs text-zinc-500">
          <Calendar className="h-3.5 w-3.5" />
          <span>Creado el {createdAt}</span>
        </div>

        <div className="mt-auto flex items-center gap-2">
          <Link
            href={`/create?id=${id}`}
            className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-full border border-white/10 bg-white/[0.06] text-sm font-medium text-white backdrop-blur transition hover:bg-white/[0.10] hover:text-white"
          >
            <Pencil className="h-3.5 w-3.5" />
            Editar
          </Link>
          <Link
            href={`/host/lobby/${id}`}
            className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-full bg-white text-sm font-semibold text-black transition hover:bg-zinc-100"
          >
            <Play className="h-3.5 w-3.5 fill-black" />
            Jugar
          </Link>
        </div>
      </div>
    </article>
  );
}
