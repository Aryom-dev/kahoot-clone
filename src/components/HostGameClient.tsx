"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Trophy,
  Clock,
  ChevronRight,
  BarChart3,
  Medal,
  Home,
  Check,
  Sparkles,
} from "lucide-react";
import Image from "next/image";
import ConnectionBanner from "@/components/ConnectionBanner";
import Avatar from "@/components/Avatar";
import type { GameQuestion } from "@/stores/useGameStore";
import { DATABASE_DEMO_QUIZ } from "@/lib/demoQuizzes";

type HostGameClientProps = {
  sessionId: string;
  quizId: string;
  pin: string;
};

type PlayerResult = {
  id: string;
  nickname: string;
  score: number;
  streak: number;
};

type AnswerRecord = {
  player_id: string;
  option_index: number;
  is_correct: boolean;
  points: number;
};

const OPTION_THEMES = [
  { bg: "bg-[#e21b3c]", border: "border-[#e21b3c]", label: "A", shape: "▲" },
  { bg: "bg-[#1368ce]", border: "border-[#1368ce]", label: "B", shape: "◆" },
  { bg: "bg-[#d89e00]", border: "border-[#d89e00]", label: "C", shape: "●" },
  { bg: "bg-[#26890c]", border: "border-[#26890c]", label: "D", shape: "■" },
];

export default function HostGameClient({
  sessionId,
  quizId,
  pin,
}: HostGameClientProps) {
  const router = useRouter();
  const [questions, setQuestions] = useState<GameQuestion[]>([]);
  const [quizTitle, setQuizTitle] = useState<string>("Juego en vivo");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [phase, setPhase] = useState<"question" | "results" | "leaderboard" | "podium">("question");
  const [timeLeft, setTimeLeft] = useState<number>(20);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [leaderboard, setLeaderboard] = useState<PlayerResult[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Helper para sincronizar estado de la sesión con el servidor Node.js central y Supabase Realtime Broadcast
  const syncServerSession = useCallback(
    async (status: string, questionIdx: number) => {
      try {
        const supabase = createClient();
        const channel = supabase.channel(`game-room-${pin}`);
        channel.subscribe((subStatus) => {
          if (subStatus === "SUBSCRIBED") {
            void channel.send({
              type: "broadcast",
              event: "game_state",
              payload: { status, currentQuestionIndex: questionIdx, pin, sessionId, quizId },
            });
          }
        });

        await fetch("/api/game/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pin,
            sessionId,
            quizId,
            status,
            currentQuestionIndex: questionIdx,
            action: "update",
          }),
          keepalive: true,
        });
      } catch (e) {
        console.log("Error al sincronizar sesión en servidor:", e);
      }
    },
    [pin, sessionId, quizId]
  );

  // Heartbeat continuo del Host para mantener viva la sesión en el servidor central
  useEffect(() => {
    if (!pin && !sessionId) return;
    const currentStatus = phase === "question" ? "active" : phase;

    const heartbeat = () => {
      void syncServerSession(currentStatus, currentQuestionIndex);
    };

    void heartbeat();
    const interval = setInterval(heartbeat, 1200);

    return () => clearInterval(interval);
  }, [pin, sessionId, phase, currentQuestionIndex, syncServerSession]);

  // 1. Cargar Quiz y Preguntas con Respaldo en localStorage
  useEffect(() => {
    const supabase = createClient();
    const loadQuiz = async () => {
      let loadedQuestions: GameQuestion[] = [];
      let title = "Juego en vivo";

      // A) Intentar desde Supabase
      const { data } = await supabase
        .from("quizzes")
        .select("title, questions")
        .eq("id", quizId)
        .single();

      if (data) {
        if (data.title) title = data.title;
        if (Array.isArray(data.questions) && data.questions.length > 0) {
          loadedQuestions = data.questions as GameQuestion[];
        }
      }

      // B) Si no hay preguntas en Supabase, cargar desde localStorage del navegador
      if (loadedQuestions.length === 0 && typeof window !== "undefined") {
        try {
          const localData = localStorage.getItem("monolith_quizzes");
          if (localData) {
            const parsed = JSON.parse(localData) as Array<{
              id: string;
              title: string;
              questions: GameQuestion[];
            }>;
            const match = parsed.find((q) => q.id === quizId) || parsed[0];
            if (match) {
              if (match.title) title = match.title;
              if (Array.isArray(match.questions) && match.questions.length > 0) {
                loadedQuestions = match.questions;
              }
            }
          }
        } catch (e) {
          console.log("Error al cargar quiz desde localStorage:", e);
        }
      }

      // C) Fallback predeterminado al Quiz de Bases de Datos
      if (loadedQuestions.length === 0) {
        title = DATABASE_DEMO_QUIZ.title;
        loadedQuestions = DATABASE_DEMO_QUIZ.questions as GameQuestion[];
      }

      setQuizTitle(title);
      setQuestions(loadedQuestions);
      setLoading(false);
    };

    void loadQuiz();
  }, [quizId]);

  const currentQ = questions[currentQuestionIndex];

  // Helper seguro para actualizar sesión en Supabase y localStorage
  const updateSessionStatus = useCallback(
    async (payload: Record<string, unknown>, fallbackStatus: string) => {
      await syncServerSession(fallbackStatus, currentQuestionIndex);

      const supabase = createClient();
      await supabase
        .from("game_sessions")
        .update(payload)
        .or(`id.eq.${sessionId},pin.eq.${pin}`);

      try {
        localStorage.setItem(
          `monolith_session_${pin}`,
          JSON.stringify({ status: fallbackStatus, currentQuestionIndex })
        );
      } catch (e) {
        console.log("Error actualizando sesión local:", e);
      }
    },
    [sessionId, pin, currentQuestionIndex, syncServerSession]
  );

  // 2. Transición hacia vista de resultados
  const handleShowResults = useCallback(async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setPhase("results");

    try {
      const res = await fetch(
        `/api/game/answer?pin=${pin}&sessionId=${sessionId}&questionIndex=${currentQuestionIndex}&t=${Date.now()}`
      );
      if (res.ok) {
        const data = (await res.json()) as { answers?: AnswerRecord[] };
        if (Array.isArray(data.answers)) {
          setAnswers(data.answers);
        }
      }
    } catch (e) {
      console.log("Error al consultar respuestas en resultados:", e);
    }

    await updateSessionStatus({ status: "results" }, "results");
  }, [pin, sessionId, currentQuestionIndex, updateSessionStatus]);

  // 3. Temporizador de la pregunta activa
  useEffect(() => {
    if (phase !== "question" || !currentQ) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          void handleShowResults();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase, currentQ, handleShowResults]);

  // 4. Escuchar Respuestas en Tiempo Real + Polling
  useEffect(() => {
    if (!sessionId && !pin) return;

    const fetchAnswers = async () => {
      try {
        const res = await fetch(
          `/api/game/answer?pin=${pin}&sessionId=${sessionId}&questionIndex=${currentQuestionIndex}&t=${Date.now()}`
        );
        if (res.ok) {
          const data = (await res.json()) as { answers?: AnswerRecord[] };
          if (Array.isArray(data.answers)) {
            setAnswers(data.answers);
          }
        }
      } catch (e) {
        console.log("Error al consultar respuestas en Host:", e);
      }
    };

    void fetchAnswers();
    const interval = setInterval(() => void fetchAnswers(), 800);

    return () => {
      clearInterval(interval);
    };
  }, [sessionId, pin, currentQuestionIndex]);

  // 5. Cargar Leaderboard y Podio en Tiempo Real
  useEffect(() => {
    if (phase !== "leaderboard" && phase !== "podium") return;

    const fetchPlayers = async () => {
      try {
        const res = await fetch(
          `/api/game/players?pin=${pin}&sessionId=${sessionId}&t=${Date.now()}`
        );
        if (res.ok) {
          const data = (await res.json()) as { players?: PlayerResult[] };
          if (Array.isArray(data.players) && data.players.length > 0) {
            const limit = phase === "podium" ? 3 : 5;
            const sorted = [...data.players].sort((a, b) => b.score - a.score).slice(0, limit);
            setLeaderboard(sorted);
          }
        }
      } catch (e) {
        console.log("Error al consultar clasificación en tiempo real:", e);
      }
    };

    void fetchPlayers();
    const interval = setInterval(() => void fetchPlayers(), 800);

    return () => {
      clearInterval(interval);
    };
  }, [phase, pin, sessionId]);

  // 6. Cargar Leaderboard al cambiar fase
  const handleShowLeaderboard = async () => {
    setPhase("leaderboard");

    try {
      const res = await fetch(`/api/game/players?pin=${pin}&sessionId=${sessionId}&t=${Date.now()}`);
      if (res.ok) {
        const data = (await res.json()) as { players?: PlayerResult[] };
        if (Array.isArray(data.players)) {
          const sorted = [...data.players].sort((a, b) => b.score - a.score).slice(0, 5);
          setLeaderboard(sorted);
        }
      }
    } catch (e) {
      console.log("Error al cargar clasificación en Host:", e);
    }

    await updateSessionStatus({ status: "leaderboard" }, "leaderboard");
  };

  // 7. Avanzar a Siguiente Pregunta o al Podio
  const handleNextQuestion = async () => {
    if (currentQuestionIndex + 1 < questions.length) {
      const nextIdx = currentQuestionIndex + 1;
      const nextQ = questions[nextIdx];
      setCurrentQuestionIndex(nextIdx);
      setTimeLeft(nextQ?.timeLimit || 20);
      setAnswers([]);
      setPhase("question");

      await updateSessionStatus(
        {
          status: "active",
          current_question_index: nextIdx,
          question_start_time: new Date().toISOString(),
        },
        "active"
      );
    } else {
      setPhase("podium");

      try {
        const res = await fetch(`/api/game/players?pin=${pin}&sessionId=${sessionId}&t=${Date.now()}`);
        if (res.ok) {
          const data = (await res.json()) as { players?: PlayerResult[] };
          if (Array.isArray(data.players)) {
            const sorted = [...data.players].sort((a, b) => b.score - a.score).slice(0, 3);
            setLeaderboard(sorted);
          }
        }
      } catch (e) {
        console.log("Error al cargar podio en Host:", e);
      }

      await updateSessionStatus({ status: "ended" }, "ended");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center py-20 text-white">
        <div className="flex items-center gap-3">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-white" />
          <span>Cargando partida...</span>
        </div>
      </div>
    );
  }

  if (!currentQ && phase !== "podium") {
    return (
      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center px-4 py-20 text-center text-white">
        <p className="text-lg font-semibold">No se encontraron preguntas para este quiz.</p>
        <p className="mt-2 text-sm text-zinc-400">
          Asegúrate de haber creado preguntas en el editor del quiz.
        </p>
        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          className="mt-6 rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-black hover:bg-zinc-200"
        >
          Volver al Dashboard
        </button>
      </div>
    );
  }

  const optionCounts = [0, 1, 2, 3].map(
    (idx) => answers.filter((a) => a.option_index === idx).length
  );
  const maxCount = Math.max(...optionCounts, 1);

  return (
    <div
      className={`mx-auto flex w-full max-w-6xl flex-col px-4 py-3 sm:px-6 sm:py-4 justify-between ${
        phase === "podium"
          ? "min-h-screen overflow-y-auto pb-10"
          : "h-screen max-h-screen overflow-hidden"
      }`}
    >
      {/* Banner de Dirección de Conexión en Red Wi-Fi */}
      <ConnectionBanner pin={pin} compact className="mb-2 shrink-0" />

      {/* Bar de control superior del Host */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2.5 shrink-0">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-semibold text-zinc-300">
            <Sparkles className="h-3.5 w-3.5 text-yellow-400" />
            {quizTitle}
          </span>
          <span className="rounded-full bg-white/10 px-2.5 py-0.5 font-mono text-xs text-white">
            PIN: {pin}
          </span>
          {currentQ?.questionType === "reorder" && (
            <span className="rounded-full bg-purple-500/20 px-2.5 py-0.5 text-xs font-bold text-purple-300 border border-purple-400/30">
              🧩 Reordenamiento
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-zinc-400">
            Pregunta {currentQuestionIndex + 1} de {questions.length}
          </span>
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-white"
          >
            <Home className="h-3.5 w-3.5" /> Salir
          </button>
        </div>
      </div>

      {/* VISTA 1: PREGUNTA ACTIVA */}
      {phase === "question" && (
        <div className="my-2 flex flex-1 min-h-0 flex-col justify-between gap-3">
          {/* Diapositiva de contexto previo opcional */}
          {currentQ.contextSlide && (
            <div className="relative overflow-hidden rounded-2xl border border-purple-500/30 bg-gradient-to-r from-purple-950/80 via-slate-900/90 to-indigo-950/80 p-3.5 shadow-xl backdrop-blur-2xl shrink-0 max-h-[16vh] overflow-y-auto">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-500/20 px-2.5 py-0.5 text-[11px] font-bold text-purple-200">
                <Sparkles className="h-3 w-3 text-purple-300" />
                Contexto Previo
              </span>
              <h3 className="mt-1 text-sm font-extrabold text-white sm:text-base">
                {currentQ.contextSlide.title}
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-zinc-300">
                {currentQ.contextSlide.text}
              </p>
            </div>
          )}

          {/* Imagen ilustrativa (ÚNICAMENTE si está presente) */}
          {currentQ.imageUrl && (
            <div className="relative mx-auto h-[20vh] max-h-36 w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-black/40 shadow-md backdrop-blur-md shrink-0">
              <Image
                src={currentQ.imageUrl}
                alt="Imagen de la pregunta"
                fill
                className="object-contain"
                unoptimized
              />
            </div>
          )}

          {/* Título de pregunta + Temporizador */}
          <div className="flex shrink-0 items-center justify-between gap-4">
            <h1 className="text-lg font-bold text-white sm:text-xl lg:text-2xl leading-snug break-words min-w-0 flex-1">
              {currentQ.text}
            </h1>

            <div className="flex shrink-0 items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/20 bg-white/10 backdrop-blur-xl">
                <span className="font-mono text-2xl font-black text-white">
                  {timeLeft}
                </span>
              </div>
              <button
                type="button"
                onClick={() => void handleShowResults()}
                className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full bg-white px-5 text-xs font-semibold text-black transition hover:bg-zinc-200"
              >
                Fin del tiempo
              </button>
            </div>
          </div>

          {/* Opciones de respuesta en cuadrícula Kahoot */}
          <div className="grid flex-1 min-h-0 grid-cols-2 gap-3">
            {currentQ.options.map((opt, idx) => {
              const theme = OPTION_THEMES[idx];
              return (
                <div
                  key={opt.id}
                  className={`relative flex items-center gap-3 rounded-2xl border-2 p-3 transition ${theme.bg} ${theme.border} text-white shadow-lg min-w-0 h-full overflow-hidden`}
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-black/20 text-lg font-black">
                    {theme.shape}
                  </span>
                  <span className="text-sm sm:text-base font-bold leading-snug break-words min-w-0 flex-1">
                    {opt.text}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Contador de respuestas en vivo */}
          <div className="flex shrink-0 items-center justify-between rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-xs backdrop-blur">
            <div className="flex items-center gap-2 text-zinc-300">
              <Clock className="h-3.5 w-3.5 animate-pulse text-emerald-400" />
              <span>Respuestas recibidas:</span>
              <span className="font-mono font-bold text-white">{answers.length}</span>
            </div>
            <p className="text-[11px] text-zinc-500">
              Los jugadores responden desde sus dispositivos en tiempo real.
            </p>
          </div>
        </div>
      )}

      {/* VISTA 2: RESULTADOS DE LA PREGUNTA */}
      {phase === "results" && (
        <div className="mt-6 flex flex-1 flex-col gap-6">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                RESULTADOS
              </span>
              <h2 className="text-2xl font-bold text-white">{currentQ.text}</h2>
            </div>
            <button
              type="button"
              onClick={() => void handleShowLeaderboard()}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-white px-7 text-sm font-semibold text-black transition hover:bg-zinc-200"
            >
              <BarChart3 className="h-4 w-4" />
              Ver Clasificación
            </button>
          </div>

          {/* Gráfico de barras de respuestas */}
          <div className="grid flex-1 items-end gap-4 rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur sm:grid-cols-4">
            {currentQ.options.map((opt, idx) => {
              const theme = OPTION_THEMES[idx];
              const count = optionCounts[idx];
              const isCorrect = currentQ.correctIndex === idx;
              const heightPercent = Math.round((count / maxCount) * 100);

              return (
                <div key={opt.id} className="flex h-full flex-col justify-end gap-3">
                  <div className="relative flex flex-1 items-end justify-center rounded-2xl bg-black/40 p-2">
                    <div
                      style={{ height: `${Math.max(heightPercent, 10)}%` }}
                      className={`w-full rounded-xl transition-all duration-700 ${theme.bg} flex items-center justify-center`}
                    >
                      <span className="font-mono text-lg font-bold text-white">
                        {count}
                      </span>
                    </div>
                  </div>

                  <div
                    className={`flex items-center justify-between rounded-xl p-3 text-white ${
                      isCorrect ? "bg-emerald-600 font-bold ring-2 ring-emerald-400" : theme.bg
                    }`}
                  >
                    <span className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold break-words leading-snug min-w-0 flex-1">
                      <span className="shrink-0">{theme.shape}</span>{" "}
                      <span className="break-words min-w-0 flex-1">{opt.text}</span>
                    </span>
                    {isCorrect && <Check className="h-5 w-5 shrink-0 text-white ml-2" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VISTA 3: TABLA DE POSICIONES (LEADERBOARD) */}
      {phase === "leaderboard" && (
        <div className="mt-6 flex flex-1 flex-col gap-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="h-6 w-6 text-yellow-400" />
              <h2 className="text-2xl font-bold text-white">Clasificación</h2>
            </div>
            <button
              type="button"
              onClick={() => void handleNextQuestion()}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-white px-7 text-sm font-semibold text-black transition hover:bg-zinc-200"
            >
              {currentQuestionIndex + 1 < questions.length ? (
                <>
                  Siguiente Pregunta <ChevronRight className="h-4 w-4" />
                </>
              ) : (
                <>
                  Ver Podio Final <Medal className="h-4 w-4" />
                </>
              )}
            </button>
          </div>

          <div className="flex flex-col gap-3">
            {leaderboard.map((p, idx) => (
              <div
                key={p.id || idx}
                className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.06] p-4 text-white backdrop-blur-xl"
              >
                <div className="flex items-center gap-4">
                  <span
                    className={`flex h-10 w-10 items-center justify-center rounded-xl text-lg font-bold ${
                      idx === 0
                        ? "bg-yellow-400 text-black"
                        : idx === 1
                        ? "bg-slate-300 text-black"
                        : idx === 2
                        ? "bg-amber-600 text-white"
                        : "bg-white/10 text-white"
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <Avatar nickname={p.nickname} size="md" />
                  <span className="text-lg font-semibold">{p.nickname}</span>
                </div>

                <div className="flex items-center gap-4">
                  {p.streak > 1 && (
                    <span className="rounded-full bg-orange-500/20 px-3 py-1 text-xs font-semibold text-orange-300">
                      🔥 Racha x{p.streak}
                    </span>
                  )}
                  <span className="font-mono text-xl font-bold">{p.score} pts</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VISTA 4: PODIO FINAL */}
      {phase === "podium" && (
        <div className="mt-4 flex flex-1 flex-col items-center justify-center text-center py-4">
          <span className="inline-flex items-center gap-2 rounded-full border border-yellow-500/30 bg-yellow-500/10 px-4 py-1.5 text-sm font-semibold text-yellow-300">
            <Trophy className="h-4 w-4" /> ¡Juego Completado!
          </span>

          <h1 className="mt-3 text-3xl font-extrabold text-white sm:text-4xl">
            Podio de Ganadores
          </h1>

          <div className="mt-6 flex items-end justify-center gap-3 sm:gap-6">
            {/* 2º Lugar */}
            {leaderboard[1] && (
              <div className="flex flex-col items-center">
                <Avatar nickname={leaderboard[1].nickname} size="lg" className="mb-2" />
                <span className="text-sm font-semibold text-slate-300 max-w-[100px] truncate">
                  {leaderboard[1].nickname}
                </span>
                <span className="font-mono text-xs text-zinc-400">
                  {leaderboard[1].score} pts
                </span>
                <div className="mt-2 flex h-32 w-20 sm:w-28 flex-col items-center justify-center rounded-t-2xl bg-slate-400 text-black shadow-lg">
                  <Medal className="h-7 w-7" />
                  <span className="text-xl font-black">2º</span>
                </div>
              </div>
            )}

            {/* 1º Lugar */}
            {leaderboard[0] && (
              <div className="flex flex-col items-center">
                <Avatar nickname={leaderboard[0].nickname} size="xl" className="mb-2 ring-4 ring-yellow-400/50" />
                <span className="text-base font-bold text-yellow-300 max-w-[120px] truncate">
                  👑 {leaderboard[0].nickname}
                </span>
                <span className="font-mono text-sm text-zinc-300">
                  {leaderboard[0].score} pts
                </span>
                <div className="mt-2 flex h-40 w-24 sm:w-32 flex-col items-center justify-center rounded-t-2xl bg-yellow-400 text-black shadow-2xl">
                  <Trophy className="h-9 w-9" />
                  <span className="text-2xl font-black">1º</span>
                </div>
              </div>
            )}

            {/* 3º Lugar */}
            {leaderboard[2] && (
              <div className="flex flex-col items-center">
                <Avatar nickname={leaderboard[2].nickname} size="lg" className="mb-2" />
                <span className="text-sm font-semibold text-amber-400 max-w-[100px] truncate">
                  {leaderboard[2].nickname}
                </span>
                <span className="font-mono text-xs text-zinc-400">
                  {leaderboard[2].score} pts
                </span>
                <div className="mt-2 flex h-24 w-20 sm:w-28 flex-col items-center justify-center rounded-t-2xl bg-amber-700 text-white shadow-lg">
                  <Medal className="h-6 w-6" />
                  <span className="text-lg font-black">3º</span>
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="mt-8 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-white px-8 text-base font-bold text-black shadow-xl transition hover:bg-zinc-200"
          >
            <Home className="h-5 w-5" /> Volver al Dashboard
          </button>
        </div>
      )}
    </div>
  );
}
