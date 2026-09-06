"use client";

import { useState, useEffect, useTransition, use } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Clock,
  Plus,
  Save,
  Trash2,
  Check,
  Sparkles,
  Image as ImageIcon,
  FileText,
  Search,
  X,
  Wand2,
} from "lucide-react";
import { saveQuiz } from "./actions";
import { createClient } from "@/lib/supabase/client";
import {
  searchWikipediaArticles,
  generateQuizFromWikipedia,
  type WikipediaSearchResult,
} from "@/lib/wikipedia";

type TimeLimit = 10 | 20 | 30;

type GameOption = {
  id: string;
  text: string;
};

type ContextSlide = {
  title: string;
  text: string;
  imageUrl?: string;
};

type Question = {
  id: string;
  text: string;
  timeLimit: TimeLimit;
  questionType?: "multiple_choice" | "reorder";
  imageUrl?: string;
  contextSlide?: ContextSlide;
  options: [GameOption, GameOption, GameOption, GameOption];
  correctIndex: number;
  correctOrder?: [number, number, number, number];
};

const OPTION_COLORS: { bg: string; label: string }[] = [
  { bg: "bg-[#e21b3c]", label: "A" },
  { bg: "bg-[#1368ce]", label: "B" },
  { bg: "bg-[#d89e00]", label: "C" },
  { bg: "bg-[#26890c]", label: "D" },
];

function createEmptyOption(index: number): GameOption {
  return { id: `opt-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 6)}`, text: "" };
}

function createEmptyQuestion(): Question {
  return {
    id: `q-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    text: "",
    timeLimit: 20,
    options: [
      createEmptyOption(0),
      createEmptyOption(1),
      createEmptyOption(2),
      createEmptyOption(3),
    ],
    correctIndex: 0,
  };
}

type PageProps = {
  searchParams?: Promise<{ id?: string; error?: string }>;
};

export default function CreateGamePage({ searchParams }: PageProps) {
  const router = useRouter();
  const resolvedParams = searchParams ? use(searchParams) : undefined;
  const editId = resolvedParams?.id ?? "";

  const [gameTitle, setGameTitle] = useState<string>("");
  const [questions, setQuestions] = useState<Question[]>(() => [createEmptyQuestion()]);
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [saved, setSaved] = useState<boolean>(false);
  const [error, setError] = useState<string>(resolvedParams?.error ?? "");
  const [isPending, startTransition] = useTransition();

  // Wikipedia & AI Generator Modal State
  const [isWikiModalOpen, setIsWikiModalOpen] = useState<boolean>(false);
  const [wikiQuery, setWikiQuery] = useState<string>("");
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [wikiResults, setWikiResults] = useState<WikipediaSearchResult[]>([]);
  const [isSearchingWiki, setIsSearchingWiki] = useState<boolean>(false);
  const [isGeneratingWiki, setIsGeneratingWiki] = useState<boolean>(false);

  // Cargar datos si se está editando un quiz existente
  useEffect(() => {
    if (!editId) return;
    const fetchQuiz = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("quizzes")
        .select("*")
        .eq("id", editId)
        .single();

      if (data && !error) {
        setGameTitle(data.title ?? "");
        if (Array.isArray(data.questions) && data.questions.length > 0) {
          setQuestions(data.questions as Question[]);
        }
      } else {
        try {
          const localData = localStorage.getItem("monolith_quizzes");
          if (localData) {
            const parsed = JSON.parse(localData) as Array<{ id: string; title: string; questions: Question[] }>;
            const match = parsed.find((q) => q.id === editId);
            if (match) {
              setGameTitle(match.title ?? "");
              if (Array.isArray(match.questions)) setQuestions(match.questions);
            }
          }
        } catch (e) {
          console.log("Local quiz load error:", e);
        }
      }
    };
    void fetchQuiz();
  }, [editId]);

  const activeQuestion: Question | undefined = questions[activeIndex];

  const updateActiveQuestion = (patch: Partial<Question>): void => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === activeIndex ? { ...q, ...patch } : q))
    );
  };

  const handleQuestionText = (value: string): void => {
    updateActiveQuestion({ text: value });
  };

  const handleImageUrl = (value: string): void => {
    updateActiveQuestion({ imageUrl: value.trim() || undefined });
  };

  const handleTimeLimit = (value: TimeLimit): void => {
    updateActiveQuestion({ timeLimit: value });
  };

  const handleOptionText = (optIndex: number, value: string): void => {
    if (!activeQuestion) return;
    const nextOptions = activeQuestion.options.map((opt, i) =>
      i === optIndex ? { ...opt, text: value } : opt
    ) as [GameOption, GameOption, GameOption, GameOption];
    updateActiveQuestion({ options: nextOptions });
  };

  const handleCorrectIndex = (index: number): void => {
    updateActiveQuestion({ correctIndex: index });
  };

  const handleToggleContextSlide = (): void => {
    if (!activeQuestion) return;
    if (activeQuestion.contextSlide) {
      updateActiveQuestion({ contextSlide: undefined });
    } else {
      updateActiveQuestion({
        contextSlide: {
          title: `Contexto previo`,
          text: `Lee atenta la siguiente información antes de responder la pregunta:`,
          imageUrl: activeQuestion.imageUrl,
        },
      });
    }
  };

  const handleAddQuestion = (): void => {
    const next = createEmptyQuestion();
    setQuestions((prev) => [...prev, next]);
    setActiveIndex(questions.length);
    setError("");
    setSaved(false);
  };

  const handleRemoveQuestion = (index: number): void => {
    if (questions.length <= 1) return;
    setQuestions((prev) => prev.filter((_, i) => i !== index));
    setActiveIndex((prev) => {
      if (prev === index) return Math.max(0, prev - 1);
      if (prev > index) return prev - 1;
      return prev;
    });
    setSaved(false);
  };

  // AI & Wikipedia Generator Actions
  const handleSearchWiki = async (): Promise<void> => {
    if (!wikiQuery.trim()) return;
    setIsSearchingWiki(true);
    const results = await searchWikipediaArticles(wikiQuery);
    setWikiResults(results);
    setIsSearchingWiki(false);
  };

  const handleGenerateAIQuiz = async (topicTitle?: string): Promise<void> => {
    const topicToUse = topicTitle || wikiQuery.trim();
    if (!topicToUse) return;

    setIsGeneratingWiki(true);
    setError("");
    try {
      const res = await fetch("/api/ai-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topicToUse,
          questionCount,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.questions && data.questions.length > 0) {
          setGameTitle(data.title);
          setQuestions(data.questions as Question[]);
          setActiveIndex(0);
          setIsWikiModalOpen(false);
          setWikiQuery("");
          setWikiResults([]);
        } else {
          setError("No se pudieron generar preguntas con IA.");
        }
      } else {
        // Fallback a Wikipedia si falla API de IA
        const generated = await generateQuizFromWikipedia(topicToUse);
        if (generated && generated.questions.length > 0) {
          setGameTitle(generated.title);
          setQuestions(generated.questions.slice(0, questionCount) as Question[]);
          setActiveIndex(0);
          setIsWikiModalOpen(false);
          setWikiQuery("");
          setWikiResults([]);
        }
      }
    } catch (e) {
      console.log("Error al generar trivia con IA:", e);
    } finally {
      setIsGeneratingWiki(false);
    }
  };

  const handleSave = (): void => {
    setError("");
    if (!gameTitle.trim()) {
      setError("Añade un título al juego.");
      return;
    }
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.text.trim()) {
        setError(`La pregunta ${i + 1} está vacía.`);
        setActiveIndex(i);
        return;
      }
      const empty = q.options.filter((o) => !o.text.trim());
      if (empty.length > 0) {
        setError(`Completa las 4 opciones de la pregunta ${i + 1}.`);
        setActiveIndex(i);
        return;
      }
    }

    const targetQuizId = editId || crypto.randomUUID();

    const quizObj = {
      id: targetQuizId,
      title: gameTitle.trim(),
      created_at: new Date().toISOString(),
      questions,
    };
    try {
      const existing = JSON.parse(localStorage.getItem("monolith_quizzes") || "[]");
      const filtered = Array.isArray(existing)
        ? existing.filter((q: { id: string }) => q.id !== quizObj.id)
        : [];
      localStorage.setItem("monolith_quizzes", JSON.stringify([quizObj, ...filtered]));
    } catch (e) {
      console.log("Local storage save notice:", e);
    }

    const formData = new FormData();
    formData.set("quizId", targetQuizId);
    formData.set("title", gameTitle.trim());
    formData.set("questions", JSON.stringify(questions));

    startTransition(async () => {
      try {
        await saveQuiz(formData);
        setSaved(true);
        router.push("/dashboard");
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        if (message.includes("NEXT_REDIRECT")) return;
        setSaved(true);
        router.push("/dashboard");
      }
    });
  };

  return (
    <div className="flex flex-1 flex-col">
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-6 sm:px-6 sm:py-8">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.06] px-3.5 py-2 text-sm font-medium text-zinc-300 backdrop-blur transition hover:bg-white/[0.08] hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Dashboard</span>
            <span className="sm:hidden">Volver</span>
          </Link>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsWikiModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-gradient-to-r from-purple-600/20 via-pink-600/20 to-indigo-600/20 px-4 py-2 text-xs font-bold text-purple-200 shadow-md backdrop-blur transition hover:scale-105 hover:border-purple-400/50"
            >
              <Wand2 className="h-4 w-4 text-purple-300" />
              <span>Generar Trivia con IA 🤖</span>
            </button>

            <span className="hidden items-center gap-2 text-xs text-zinc-400 sm:inline-flex">
              <Sparkles className="h-3.5 w-3.5 text-yellow-400" />
              {questions.length} pregunta{questions.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        {/* Título grande */}
        <div className="relative mt-6 overflow-hidden rounded-[24px] border border-white/[0.08] bg-white/[0.06] p-5 backdrop-blur-2xl sm:p-6">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          <label htmlFor="game-title" className="text-xs font-semibold tracking-widest text-zinc-400">
            TÍTULO DEL JUEGO {editId ? "(EDITANDO)" : ""}
          </label>
          <input
            id="game-title"
            value={gameTitle}
            onChange={(e) => setGameTitle(e.target.value)}
            placeholder="Ej. Sistema Solar — Trivia de Ciencias"
            className="mt-2 w-full bg-transparent text-2xl font-semibold tracking-tight text-white placeholder:text-zinc-600 outline-none sm:text-3xl"
          />
        </div>

        {/* Layout: Sidebar + Main */}
        <div className="mt-6 flex flex-1 flex-col gap-6 lg:flex-row lg:items-start">
          {/* Sidebar — diapositivas */}
          <aside className="flex w-full shrink-0 flex-col gap-3 lg:sticky lg:top-[80px] lg:w-[300px]">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-xs font-semibold tracking-widest text-zinc-400">PREGUNTAS</h2>
              <span className="rounded-full border border-white/10 bg-white/[0.06] px-2 py-0.5 text-xs font-medium text-zinc-300">
                {questions.length}
              </span>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
              {questions.map((q, idx) => {
                const isActive = idx === activeIndex;
                return (
                  <div key={q.id} className="relative shrink-0">
                    <button
                      type="button"
                      onClick={() => setActiveIndex(idx)}
                      className={`flex w-[220px] flex-col items-start gap-2 rounded-2xl border p-3 text-left transition lg:w-full ${
                        isActive
                          ? "border-white bg-white text-black shadow-lg"
                          : "border-white/[0.08] bg-white/[0.04] text-zinc-300 backdrop-blur hover:bg-white/[0.08] hover:text-white"
                      }`}
                    >
                      <div className="flex w-full items-center justify-between">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-bold tracking-wide ${
                            isActive ? "bg-black text-white" : "bg-white/10 text-zinc-300"
                          }`}
                        >
                          {idx + 1}
                        </span>

                        <div className="flex items-center gap-1">
                          {q.contextSlide && (
                            <span className="rounded-md bg-purple-500/20 px-1.5 py-0.5 text-[10px] font-bold text-purple-300">
                              Diapositiva
                            </span>
                          )}
                          {q.imageUrl && <ImageIcon className="h-3 w-3 text-cyan-400" />}
                        </div>
                      </div>

                      <span className="line-clamp-2 text-sm font-medium leading-5">
                        {q.text.trim() ? q.text : "Pregunta sin título"}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 text-xs ${
                          isActive ? "text-zinc-600" : "text-zinc-500"
                        }`}
                      >
                        <Clock className="h-3 w-3" />
                        {q.timeLimit}s • {q.options.filter((o) => o.text.trim()).length}/4
                      </span>
                    </button>
                    {questions.length > 1 && (
                      <button
                        type="button"
                        aria-label={`Eliminar pregunta ${idx + 1}`}
                        onClick={() => handleRemoveQuestion(idx)}
                        className="absolute -right-2 -top-2 inline-flex h-6 w-6 items-center justify-center rounded-full border border-white/15 bg-zinc-900 text-zinc-400 shadow hover:bg-white hover:text-black"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={handleAddQuestion}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-dashed border-white/15 bg-white/[0.04] text-sm font-medium text-zinc-300 backdrop-blur transition hover:bg-white/[0.08] hover:text-white"
            >
              <Plus className="h-4 w-4" />
              Añadir pregunta
            </button>
          </aside>

          {/* Main — editor pregunta */}
          <section className="min-w-0 flex-1">
            {activeQuestion ? (
              <div className="relative overflow-hidden rounded-[24px] border border-white/[0.08] bg-white/[0.06] backdrop-blur-2xl">
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                <div className="relative flex flex-col gap-6 p-5 sm:p-6 lg:p-7">
                  {/* Pregunta + tiempo */}
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <h3 className="text-sm font-semibold tracking-tight text-white">
                        Pregunta {activeIndex + 1}
                      </h3>
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-medium text-zinc-400">Tipo:</span>
                          <div className="inline-flex rounded-full border border-white/10 bg-white/[0.04] p-1 backdrop-blur">
                            <button
                              type="button"
                              onClick={() => updateActiveQuestion({ questionType: "multiple_choice" })}
                              className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold transition ${
                                (activeQuestion.questionType || "multiple_choice") === "multiple_choice"
                                  ? "bg-white text-black shadow"
                                  : "text-zinc-400 hover:text-white"
                              }`}
                            >
                              Opción Múltiple
                            </button>
                            <button
                              type="button"
                              onClick={() => updateActiveQuestion({ questionType: "reorder" })}
                              className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold transition ${
                                activeQuestion.questionType === "reorder"
                                  ? "bg-purple-500 text-white shadow"
                                  : "text-zinc-400 hover:text-white"
                              }`}
                            >
                              🧩 Reordenar
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-medium text-zinc-400">Tiempo:</span>
                          <div className="inline-flex rounded-full border border-white/10 bg-white/[0.04] p-1 backdrop-blur">
                            {[10, 20, 30].map((t) => {
                              const selected = activeQuestion.timeLimit === t;
                              return (
                                <button
                                  key={t}
                                  type="button"
                                  onClick={() => handleTimeLimit(t as TimeLimit)}
                                  className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold transition ${
                                    selected ? "bg-white text-black shadow" : "text-zinc-400 hover:text-white"
                                  }`}
                                >
                                  <Clock className="h-3 w-3" />
                                  {t}s
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>

                    <textarea
                      id="question-text"
                      value={activeQuestion.text}
                      onChange={(e) => handleQuestionText(e.target.value)}
                      placeholder="Escribe tu pregunta aquí… Ej. ¿En qué año llegó el ser humano a la Luna?"
                      rows={3}
                      className="min-h-[96px] w-full resize-none rounded-2xl border border-white/10 bg-[#0a0a0e]/60 p-4 text-[15px] font-medium leading-6 text-white placeholder:text-zinc-500 backdrop-blur outline-none transition focus:border-white/20 focus:bg-[#0a0a0e]/80 focus:ring-2 focus:ring-white/10"
                    />
                  </div>

                  {/* Adjuntar Imagen y Diapositiva de Contexto */}
                  <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-md">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-300">
                        <ImageIcon className="h-4 w-4 text-cyan-400" /> URL de Imagen Opcional
                      </span>
                      <button
                        type="button"
                        onClick={handleToggleContextSlide}
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold transition ${
                          activeQuestion.contextSlide
                            ? "bg-purple-500 text-white"
                            : "border border-purple-500/30 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20"
                        }`}
                      >
                        <FileText className="h-3.5 w-3.5" />
                        {activeQuestion.contextSlide
                          ? "✓ Pantalla de contexto activada"
                          : "+ Añadir pantalla de contexto previa"}
                      </button>
                    </div>

                    <input
                      type="url"
                      value={activeQuestion.imageUrl || ""}
                      onChange={(e) => handleImageUrl(e.target.value)}
                      placeholder="https://ejemplo.com/imagen.jpg"
                      className="w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2 text-xs text-white placeholder:text-zinc-600 outline-none"
                    />

                    {activeQuestion.imageUrl && (
                      <div className="relative mt-2 h-36 w-full overflow-hidden rounded-xl border border-white/10 bg-black/40">
                        <Image
                          src={activeQuestion.imageUrl}
                          alt="Previsualización"
                          fill
                          className="object-contain"
                          unoptimized
                        />
                      </div>
                    )}

                    {/* Editor de pantalla de contexto previa */}
                    {activeQuestion.contextSlide && (
                      <div className="mt-3 flex flex-col gap-3 rounded-xl border border-purple-500/30 bg-purple-950/30 p-3.5 backdrop-blur-md">
                        <span className="text-xs font-bold tracking-wider text-purple-300">
                          DIAPOSITIVA DE CONTEXTO PREVIA (OPCIONAL)
                        </span>
                        <input
                          type="text"
                          value={activeQuestion.contextSlide.title}
                          onChange={(e) =>
                            updateActiveQuestion({
                              contextSlide: {
                                ...activeQuestion.contextSlide!,
                                title: e.target.value,
                              },
                            })
                          }
                          placeholder="Título del contexto (Ej. Resumen Histórico)"
                          className="w-full rounded-lg border border-purple-400/20 bg-black/50 px-3 py-1.5 text-xs text-white outline-none"
                        />
                        <textarea
                          rows={2}
                          value={activeQuestion.contextSlide.text}
                          onChange={(e) =>
                            updateActiveQuestion({
                              contextSlide: {
                                ...activeQuestion.contextSlide!,
                                text: e.target.value,
                              },
                            })
                          }
                          placeholder="Escribe el texto explicativo que leerán los jugadores antes de responder..."
                          className="w-full resize-none rounded-lg border border-purple-400/20 bg-black/50 p-3 text-xs text-white outline-none"
                        />
                      </div>
                    )}
                  </div>

                  {/* Opciones */}
                  <div>
                    <div className="mb-3 flex items-center justify-between">
                      <h4 className="text-xs font-semibold tracking-widest text-zinc-400">
                        {activeQuestion.questionType === "reorder"
                          ? "ELEMENTOS A REORDENAR (EN SECUENCIA CORRECTA 1º A 4º)"
                          : "OPCIONES DE RESPUESTA"}
                      </h4>
                      <span className="text-xs text-zinc-400">
                        {activeQuestion.questionType === "reorder"
                          ? "Escribe los ítems en su orden correcto"
                          : "Marca la correcta con el círculo"}
                      </span>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      {activeQuestion.options.map((opt, optIdx) => {
                        const color = OPTION_COLORS[optIdx];
                        const isCorrect = activeQuestion.correctIndex === optIdx;
                        return (
                          <label
                            key={opt.id}
                            className={`group relative flex items-center gap-3 rounded-2xl border p-3 pr-2 transition ${
                              isCorrect
                                ? "border-white/25 bg-white/[0.10] shadow-[0_0_0_1px_rgba(255,255,255,0.08)_inset]"
                                : "border-white/10 bg-white/[0.04] hover:bg-white/[0.06]"
                            }`}
                          >
                            <span
                              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white shadow ${color.bg}`}
                            >
                              {color.label}
                            </span>
                            <input
                              type="text"
                              value={opt.text}
                              onChange={(e) => handleOptionText(optIdx, e.target.value)}
                              placeholder={`Opción ${optIdx + 1}`}
                              className="min-w-0 flex-1 bg-transparent text-sm font-medium text-white placeholder:text-zinc-500 outline-none"
                            />
                            <span className="relative inline-flex shrink-0 items-center">
                              <input
                                type="radio"
                                name={`correct-${activeQuestion.id}`}
                                checked={isCorrect}
                                onChange={() => handleCorrectIndex(optIdx)}
                                className="peer h-5 w-5 appearance-none rounded-full border border-white/20 bg-white/5 checked:border-white checked:bg-white"
                              />
                              <Check className="pointer-events-none absolute left-1/2 top-1/2 hidden h-3 w-3 -translate-x-1/2 -translate-y-1/2 text-black peer-checked:block" />
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Footer save */}
                  <div className="flex flex-col gap-3 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs leading-5 text-zinc-400">
                      {activeQuestion.options.filter((o) => o.text.trim()).length}/4 opciones con texto •{" "}
                      {activeQuestion.text.trim() ? "Pregunta lista" : "Escribe la pregunta"}
                    </p>
                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={isPending}
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-white px-7 text-sm font-semibold text-black shadow-[0_8px_24px_rgba(255,255,255,0.12)] transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isPending ? (
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/20 border-t-black" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      {isPending ? "Guardando..." : "Guardar Juego"}
                    </button>
                  </div>

                  {error && (
                    <p
                      role="alert"
                      className="rounded-xl border border-red-500/20 bg-red-500/10 px-3.5 py-2.5 text-xs leading-5 text-red-300"
                    >
                      {error}
                    </p>
                  )}
                  {saved && (
                    <p
                      role="status"
                      className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3.5 py-2.5 text-xs leading-5 text-emerald-300"
                    >
                      ¡Juego guardado exitosamente! 🚀 Redirigiendo al dashboard...
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-10 text-center text-sm text-zinc-400 backdrop-blur">
                No hay pregunta seleccionada.
              </div>
            )}
          </section>
        </div>
      </div>

      {/* MODAL GENERADOR DE TRIVIAS CON IA Y WIKIPEDIA */}
      {isWikiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md">
          <div className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-purple-500/30 bg-gradient-to-b from-slate-900 via-purple-950 to-slate-950 p-6 shadow-2xl backdrop-blur-2xl">
            <button
              type="button"
              onClick={() => setIsWikiModalOpen(false)}
              className="absolute right-4 top-4 rounded-full p-2 text-zinc-400 hover:bg-white/10 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/20 text-purple-300">
                <Wand2 className="h-5 w-5 animate-pulse text-purple-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Generar Trivia con IA & Wikipedia 🤖📚</h3>
                <p className="text-xs text-zinc-400">
                  Crea un quiz con redacción humana en español, distractores y explicaciones.
                </p>
              </div>
            </div>

            {/* Selector de número de preguntas */}
            <div className="mt-5 flex flex-col gap-2 rounded-2xl border border-purple-500/20 bg-purple-900/20 p-3.5 backdrop-blur-md">
              <span className="text-xs font-semibold text-purple-300">
                Número de preguntas a generar:
              </span>
              <div className="flex gap-2">
                {[3, 5, 8, 10].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setQuestionCount(num)}
                    className={`flex-1 rounded-xl py-2 text-xs font-bold transition ${
                      questionCount === num
                        ? "bg-purple-600 text-white shadow-md ring-2 ring-purple-400"
                        : "border border-white/10 bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    {num} Preguntas
                  </button>
                ))}
              </div>
            </div>

            {/* Búsqueda de tema */}
            <div className="mt-4 flex flex-col gap-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={wikiQuery}
                  onChange={(e) => setWikiQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && void handleGenerateAIQuiz()}
                  placeholder="Ej. Mitología Griega, Inteligencia Artificial, Copa Mundial..."
                  className="flex-1 rounded-xl border border-white/15 bg-black/50 px-4 py-2.5 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-purple-400"
                />
                <button
                  type="button"
                  onClick={() => void handleSearchWiki()}
                  disabled={isSearchingWiki || !wikiQuery.trim()}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-purple-400/30 bg-purple-500/20 px-3.5 text-xs font-bold text-purple-200 transition hover:bg-purple-500/30 disabled:opacity-40"
                >
                  <Search className="h-3.5 w-3.5" />
                  Buscar Wiki
                </button>
              </div>

              <button
                type="button"
                onClick={() => void handleGenerateAIQuiz()}
                disabled={isGeneratingWiki || !wikiQuery.trim()}
                className="mt-1 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 text-sm font-bold text-white shadow-lg transition hover:brightness-110 disabled:opacity-50"
              >
                {isGeneratingWiki ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                ) : (
                  <Wand2 className="h-4 w-4" />
                )}
                {isGeneratingWiki
                  ? `Generando ${questionCount} preguntas con IA...`
                  : `⚡ Generar ${questionCount} Preguntas con IA`}
              </button>
            </div>

            {isGeneratingWiki && (
              <div className="mt-6 flex flex-col items-center justify-center py-8 text-center text-purple-300">
                <span className="h-8 w-8 animate-spin rounded-full border-3 border-purple-400/20 border-t-purple-400" />
                <p className="mt-3 text-sm font-medium">
                  Sintetizando {questionCount} preguntas en español con contexto explicativo...
                </p>
              </div>
            )}

            {!isGeneratingWiki && wikiResults.length > 0 && (
              <div className="mt-5 flex max-h-[220px] flex-col gap-2 overflow-y-auto pr-1">
                <p className="text-xs font-semibold tracking-wider text-purple-300 uppercase">
                  O selecciona un artículo de Wikipedia sugerido:
                </p>
                {wikiResults.map((res) => (
                  <button
                    key={res.title}
                    type="button"
                    onClick={() => void handleGenerateAIQuiz(res.title)}
                    className="flex flex-col items-start gap-1 rounded-xl border border-white/10 bg-white/5 p-3 text-left transition hover:border-purple-400/50 hover:bg-purple-500/10"
                  >
                    <span className="text-sm font-bold text-white">{res.title}</span>
                    <span className="line-clamp-2 text-xs text-zinc-400">{res.description}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
