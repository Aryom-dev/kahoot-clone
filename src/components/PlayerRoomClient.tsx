"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  Check,
  X,
  Trophy,
  Sparkles,
  Clock,
  Gamepad2,
  ArrowLeft,
  Hash,
  GripVertical,
} from "lucide-react";
import Avatar from "@/components/Avatar";
import AvatarPicker from "@/components/AvatarPicker";
import type { GameQuestion } from "@/stores/useGameStore";
import { DATABASE_DEMO_QUIZ } from "@/lib/demoQuizzes";

type PlayerRoomClientProps = {
  pin: string;
  nickname: string;
  playerId: string;
  sessionId: string;
  avatarSeed?: string;
  initialStatus?: string;
};

const OPTION_BUTTONS = [
  { bg: "bg-[#e21b3c] active:bg-[#c41532]", border: "border-[#e21b3c]", shape: "▲", label: "A" },
  { bg: "bg-[#1368ce] active:bg-[#0f54a8]", border: "border-[#1368ce]", shape: "◆", label: "B" },
  { bg: "bg-[#d89e00] active:bg-[#b58400]", border: "border-[#d89e00]", shape: "●", label: "C" },
  { bg: "bg-[#26890c] active:bg-[#1e6e09]", border: "border-[#26890c]", shape: "■", label: "D" },
];

export default function PlayerRoomClient({
  pin,
  nickname,
  playerId,
  sessionId,
  avatarSeed,
  initialStatus = "lobby",
}: PlayerRoomClientProps) {
  const [playerAvatarSeed, setPlayerAvatarSeed] = useState<string>(avatarSeed || nickname);
  const [sessionStatus, setSessionStatus] = useState<string>(initialStatus);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [questions, setQuestions] = useState<GameQuestion[]>([]);

  const [submittedIndex, setSubmittedIndex] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [pointsEarned, setPointsEarned] = useState<number>(0);
  const [totalScore, setTotalScore] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(20);

  // Estado para Reordenamiento / Drag & Drop
  const [userOrder, setUserOrder] = useState<number[]>([0, 1, 2, 3]);
  const [draggedPos, setDraggedPos] = useState<number | null>(null);
  const [dragOverPos, setDragOverPos] = useState<number | null>(null);

  const sessionStatusRef = useRef(sessionStatus);
  const currentQuestionIndexRef = useRef(currentQuestionIndex);
  const questionStartTimeRef = useRef<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartPosRef = useRef<number | null>(null);

  useEffect(() => {
    sessionStatusRef.current = sessionStatus;
  }, [sessionStatus]);

  useEffect(() => {
    currentQuestionIndexRef.current = currentQuestionIndex;
  }, [currentQuestionIndex]);

  // 1. Cargar preguntas de Supabase, API o Demo Quiz
  const loadQuestions = useCallback(async (sessionQuizId?: string) => {
    let loadedQuestions: GameQuestion[] = [];

    // A) Si se recibe quizId de Supabase
    if (sessionQuizId && /^[0-9a-f-]{36}$/i.test(sessionQuizId)) {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("quizzes")
          .select("questions")
          .eq("id", sessionQuizId)
          .single();

        if (data && Array.isArray(data.questions) && data.questions.length > 0) {
          loadedQuestions = data.questions as GameQuestion[];
        }
      } catch (e) {
        console.log("Error al cargar preguntas de Supabase:", e);
      }
    }

    // B) Buscar en localStorage si aún no hay preguntas
    if (loadedQuestions.length === 0) {
      try {
        const localData = localStorage.getItem("monolith_quizzes");
        if (localData) {
          const parsed = JSON.parse(localData) as Array<{
            id: string;
            title: string;
            questions: GameQuestion[];
          }>;
          if (Array.isArray(parsed) && parsed.length > 0) {
            const match = sessionQuizId
              ? parsed.find((q) => q.id === sessionQuizId) || parsed[0]
              : parsed.find((q) => q.id === DATABASE_DEMO_QUIZ.id) || parsed[0];
            if (match && Array.isArray(match.questions) && match.questions.length > 0) {
              loadedQuestions = match.questions;
            }
          }
        }
      } catch (e) {
        console.log("Error al cargar preguntas locales en teléfono:", e);
      }
    }

    // C) Respaldar siempre con el quiz demo si sigue vacío o si es el demo quiz
    if (
      loadedQuestions.length === 0 ||
      sessionQuizId === DATABASE_DEMO_QUIZ.id ||
      sessionQuizId?.includes("demo")
    ) {
      loadedQuestions = DATABASE_DEMO_QUIZ.questions as GameQuestion[];
    }

    setQuestions(loadedQuestions);
  }, []);

  useEffect(() => {
    let isMounted = true;
    const initQuestions = async () => {
      await Promise.resolve();
      if (isMounted) {
        await loadQuestions();
      }
    };
    void initQuestions();
    return () => {
      isMounted = false;
    };
  }, [loadQuestions]);

  const currentQ = questions[currentQuestionIndex];

  // 2A. Sincronización en tiempo real vía Supabase Realtime Broadcast
  useEffect(() => {
    if (!pin) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`game-room-${pin}`)
      .on("broadcast", { event: "game_state" }, (payload) => {
        const data = payload.payload as {
          status?: string;
          currentQuestionIndex?: number;
          quizId?: string;
        };
        if (data.quizId) {
          void loadQuestions(data.quizId);
        }
        if (data.status && data.status !== sessionStatusRef.current) {
          console.log("⚡ BROADCAST CAMBIO DE ESTADO:", sessionStatusRef.current, "=>", data.status);
          setSessionStatus(data.status);
        }
        if (
          typeof data.currentQuestionIndex === "number" &&
          data.currentQuestionIndex !== currentQuestionIndexRef.current
        ) {
          setCurrentQuestionIndex(data.currentQuestionIndex);
          setSubmittedIndex(null);
          setIsCorrect(null);
          setPointsEarned(0);
          setTimeLeft(20);
          setUserOrder([0, 1, 2, 3]);
        }
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [pin, loadQuestions]);

  // 2B. Polling continuo de alta frecuencia (400ms) como respaldo de seguridad
  useEffect(() => {
    if (!pin && !sessionId) return;

    const syncSessionState = async () => {
      try {
        const res = await fetch(
          `/api/game/session?pin=${pin}&sessionId=${sessionId}&t=${Date.now()}`,
          {
            cache: "no-store",
            headers: { "Cache-Control": "no-cache" },
          }
        );
        if (res.ok) {
          const data = (await res.json()) as {
            status?: string;
            currentQuestionIndex?: number;
            quizId?: string;
          };

          if (data.quizId) {
            void loadQuestions(data.quizId);
          }

          if (data.status && data.status !== sessionStatusRef.current) {
            console.log("🟢 POLLING CAMBIO DE ESTADO:", sessionStatusRef.current, "=>", data.status);
            setSessionStatus(data.status);
          }

          if (
            typeof data.currentQuestionIndex === "number" &&
            data.currentQuestionIndex !== currentQuestionIndexRef.current
          ) {
            setCurrentQuestionIndex(data.currentQuestionIndex);
            setSubmittedIndex(null);
            setIsCorrect(null);
            setPointsEarned(0);
            setTimeLeft(20);
            setUserOrder([0, 1, 2, 3]);
          }
        }
      } catch (e) {
        console.log("Error sincronizando estado de sesión en sala del jugador:", e);
      }
    };

    void syncSessionState();
    const interval = setInterval(() => void syncSessionState(), 400);

    return () => {
      clearInterval(interval);
    };
  }, [pin, sessionId, loadQuestions]);

  // 3. Temporizador de la pregunta activa
  useEffect(() => {
    if (sessionStatus !== "active" && sessionStatus !== "question") return;

    questionStartTimeRef.current = Date.now();

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentQuestionIndex, sessionStatus]);

  // 4. Responder pregunta de opción múltiple
  const handleSelectOption = useCallback(
    async (optionIdx: number) => {
      if (submittedIndex !== null) return;

      setSubmittedIndex(optionIdx);

      const startTime = questionStartTimeRef.current || Date.now();
      const elapsedSeconds = (Date.now() - startTime) / 1000;
      const timeLimit = currentQ?.timeLimit || 20;
      const correct = currentQ ? currentQ.correctIndex === optionIdx : true;

      let points = 0;
      if (correct) {
        const speedRatio = Math.max(0, (timeLimit - elapsedSeconds) / timeLimit);
        points = Math.round(500 + 500 * speedRatio);
      }

      setIsCorrect(correct);
      setPointsEarned(points);
      setTotalScore((prev) => prev + points);

      const newStreak = correct ? streak + 1 : 0;
      setStreak(newStreak);

      try {
        await fetch("/api/game/answer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            playerId,
            nickname,
            questionIndex: currentQuestionIndex,
            optionIndex: optionIdx,
            isCorrect: correct,
            points,
          }),
        });
      } catch (e) {
        console.log("Error enviando respuesta:", e);
      }
    },
    [submittedIndex, currentQ, streak, sessionId, playerId, nickname, currentQuestionIndex]
  );

  // Lógica de Reordenamiento / Drag & Drop
  const handleReorderSwap = useCallback((fromPos: number, toPos: number) => {
    if (fromPos === toPos || fromPos < 0 || toPos < 0 || fromPos >= 4 || toPos >= 4) return;
    setUserOrder((prev) => {
      const next = [...prev];
      const [movedItem] = next.splice(fromPos, 1);
      next.splice(toPos, 0, movedItem);
      return next;
    });
  }, []);

  const moveOrderItem = (fromIndex: number, direction: "up" | "down") => {
    const toIndex = direction === "up" ? fromIndex - 1 : fromIndex + 1;
    handleReorderSwap(fromIndex, toIndex);
  };

  // Drag & Drop Mouse Handlers
  const handleDragStart = (pos: number) => {
    setDraggedPos(pos);
  };

  const handleDragOver = (e: React.DragEvent, pos: number) => {
    e.preventDefault();
    if (draggedPos !== null && draggedPos !== pos) {
      setDragOverPos(pos);
    }
  };

  const handleDrop = (pos: number) => {
    if (draggedPos !== null && draggedPos !== pos) {
      handleReorderSwap(draggedPos, pos);
    }
    setDraggedPos(null);
    setDragOverPos(null);
  };

  const handleDragEnd = () => {
    setDraggedPos(null);
    setDragOverPos(null);
  };

  // Touch Drag Handlers (móviles táctiles)
  const handleTouchStart = (pos: number) => {
    touchStartPosRef.current = pos;
    setDraggedPos(pos);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartPosRef.current === null) return;
    const touch = e.touches[0];
    if (!touch) return;
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    if (!element) return;
    const itemElem = element.closest("[data-reorder-pos]");
    if (itemElem) {
      const targetPosStr = itemElem.getAttribute("data-reorder-pos");
      if (targetPosStr !== null) {
        const targetPos = parseInt(targetPosStr, 10);
        if (!isNaN(targetPos) && targetPos !== touchStartPosRef.current) {
          handleReorderSwap(touchStartPosRef.current, targetPos);
          touchStartPosRef.current = targetPos;
          setDraggedPos(targetPos);
        }
      }
    }
  };

  const handleTouchEnd = () => {
    touchStartPosRef.current = null;
    setDraggedPos(null);
    setDragOverPos(null);
  };

  const handleSubmitReorder = useCallback(async () => {
    if (submittedIndex !== null) return;
    setSubmittedIndex(99);

    const startTime = questionStartTimeRef.current || Date.now();
    const elapsedSeconds = (Date.now() - startTime) / 1000;
    const timeLimit = currentQ?.timeLimit || 20;

    const targetOrder = currentQ?.correctOrder || [0, 1, 2, 3];
    const correct = userOrder.every((val, idx) => val === targetOrder[idx]);

    let points = 0;
    if (correct) {
      const speedRatio = Math.max(0, (timeLimit - elapsedSeconds) / timeLimit);
      points = Math.round(500 + 500 * speedRatio);
    }

    setIsCorrect(correct);
    setPointsEarned(points);
    setTotalScore((prev) => prev + points);

    const newStreak = correct ? streak + 1 : 0;
    setStreak(newStreak);

    try {
      await fetch("/api/game/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          playerId,
          nickname,
          questionIndex: currentQuestionIndex,
          optionIndex: userOrder[0],
          userOrder,
          isCorrect: correct,
          points,
        }),
      });
    } catch (e) {
      console.log("Error enviando respuesta de reordenamiento:", e);
    }
  }, [submittedIndex, userOrder, currentQ, streak, sessionId, playerId, nickname, currentQuestionIndex]);

  // VISTA 1: SALA DE ESPERA (LOBBY)
  if (sessionStatus === "lobby") {
    return (
      <div className="mx-auto flex w-full max-w-[420px] flex-1 flex-col px-4 py-6 sm:py-10">
        <div className="flex flex-col items-center text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
            Conectado al lobby
          </span>
          <h1 className="mt-4 text-balance text-xl font-semibold tracking-tight text-white sm:text-2xl">
            ¡Estás dentro! Mira tu nombre en la pantalla principal
          </h1>
          <p className="mt-2 text-sm font-medium text-white">
            Te uniste como <span className="font-semibold">{nickname}</span>
          </p>
          <p className="mt-1 max-w-[32ch] text-sm leading-6 text-zinc-400">
            Esperando a que el anfitrión inicie la partida.
          </p>
        </div>

        <div className="relative mt-6 overflow-hidden rounded-[28px] border border-white/[0.08] bg-white/[0.06] p-6 backdrop-blur-2xl">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

          <div className="relative flex flex-col items-center text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-medium tracking-widest text-zinc-300">
              <Hash className="h-3 w-3" />
              PIN
            </span>
            <p className="mt-3 font-mono text-5xl font-black tracking-[0.18em] text-white">
              {pin}
            </p>

            <div className="my-4 flex flex-col items-center justify-center border-b border-white/10 pb-4">
              <AvatarPicker initialNickname={playerAvatarSeed} onAvatarChange={setPlayerAvatarSeed} />
            </div>

            <div className="mt-2 flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] p-3 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <Avatar nickname={playerAvatarSeed} size="md" />
                <div className="text-left">
                  <p className="text-sm font-semibold text-white">{nickname}</p>
                  <p className="text-xs text-zinc-400">Jugador listo</p>
                </div>
              </div>
              <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-medium text-emerald-300">
                En línea
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // VISTA 2: RESULTADOS DE LA PREGUNTA
  if (sessionStatus === "results") {
    return (
      <div className="mx-auto flex w-full max-w-[420px] flex-1 flex-col justify-center px-4 py-8">
        <div className="flex flex-col items-center text-center">
          {isCorrect ? (
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 ring-8 ring-emerald-500/10">
              <Check className="h-10 w-10" />
            </div>
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-500/20 text-red-400 ring-8 ring-red-500/10">
              <X className="h-10 w-10" />
            </div>
          )}

          <h2 className="mt-4 text-3xl font-black text-white">
            {isCorrect ? "¡Correcto!" : "¡Incorrecto!"}
          </h2>

          {isCorrect && (
            <p className="mt-1 font-mono text-xl font-bold text-emerald-400">
              +{pointsEarned} pts
            </p>
          )}

          {streak > 1 && (
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-orange-500/20 px-4 py-1.5 text-xs font-bold text-orange-300">
              🔥 ¡Racha de {streak} respuestas!
            </div>
          )}

          <div className="mt-6 w-full rounded-2xl border border-white/10 bg-white/[0.06] p-4 text-center backdrop-blur-xl">
            <span className="text-xs font-medium text-zinc-400">Puntaje acumulado</span>
            <p className="font-mono text-3xl font-black text-white">{totalScore} pts</p>
          </div>

          <p className="mt-6 text-xs text-zinc-400 animate-pulse">
            Espera a la siguiente pregunta en la pantalla del host...
          </p>
        </div>
      </div>
    );
  }

  // VISTA 3: CLASIFICACIÓN INTERMEDIA (LEADERBOARD)
  if (sessionStatus === "leaderboard") {
    return (
      <div className="mx-auto flex w-full max-w-[420px] flex-1 flex-col items-center justify-center px-4 py-8 text-center">
        <Trophy className="h-16 w-16 text-yellow-400 animate-bounce" />
        <h2 className="mt-4 text-2xl font-bold text-white">Tabla de Posiciones</h2>
        <p className="mt-2 text-sm text-zinc-300">
          Revisa la pantalla del host para ver tu posición en el podio parcial.
        </p>

        <div className="mt-6 w-full rounded-2xl border border-white/10 bg-white/[0.06] p-5 text-center backdrop-blur-xl">
          <span className="text-xs font-medium text-zinc-400">Tu Puntaje Actual</span>
          <p className="font-mono text-4xl font-black text-yellow-400">{totalScore} pts</p>
        </div>
      </div>
    );
  }

  // VISTA 4: PODIO FINAL (GAME ENDED)
  if (sessionStatus === "ended") {
    return (
      <div className="mx-auto flex w-full max-w-[420px] flex-1 flex-col items-center justify-center px-4 py-8 text-center">
        <Sparkles className="h-16 w-16 text-yellow-400 animate-pulse" />
        <h2 className="mt-4 text-3xl font-black text-white">¡Juego Terminado!</h2>
        <p className="mt-2 text-sm text-zinc-300">
          Gracias por participar en la trivia.
        </p>

        <div className="mt-6 w-full rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-6 text-center backdrop-blur-xl">
          <span className="text-xs font-bold text-yellow-300 uppercase tracking-wider">
            Puntaje Final
          </span>
          <p className="mt-1 font-mono text-5xl font-black text-white">{totalScore} pts</p>
        </div>

        <Link
          href="/play"
          className="mt-8 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-white text-sm font-bold text-black shadow-xl hover:bg-zinc-200"
        >
          <ArrowLeft className="h-4 w-4" /> Jugar Otra Partida
        </Link>
      </div>
    );
  }

  // VISTA 5: PREGUNTA ACTIVA (QUESTION / ACTIVE)
  return (
    <div className="mx-auto flex w-full max-w-[420px] flex-1 flex-col px-4 py-4 justify-between">
      {/* Barra superior de info */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <Gamepad2 className="h-4 w-4 text-purple-400" />
          <span className="text-xs font-semibold text-zinc-300">
            Pregunta {currentQuestionIndex + 1}
          </span>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-mono text-white">
          <Clock className="h-3.5 w-3.5 text-yellow-400 animate-pulse" />
          {timeLeft}s
        </div>
      </div>

      {/* Título o banner del tipo de pregunta en pantalla del jugador */}
      <div className="my-2 rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-center backdrop-blur">
        <p className="text-xs font-semibold text-zinc-300">
          {currentQ?.questionType === "reorder"
            ? "🧩 Ordena los elementos de 1º a 4º"
            : "¡Mira la pantalla principal para ver la pregunta!"}
        </p>
      </div>

      {/* ÁREA DE INTERACCIÓN / RESPUESTA */}
      <div className="flex flex-1 flex-col justify-center my-2">
        {submittedIndex !== null ? (
          /* PANTALLA DE ESPERA TRAS RESPONDER */
          <div className="flex flex-col items-center justify-center rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-center backdrop-blur-xl">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
              <Check className="h-8 w-8" />
            </span>
            <h3 className="mt-4 text-xl font-extrabold text-white">
              ¡Respuesta enviada!
            </h3>
            <p className="mt-2 text-sm leading-6 text-zinc-300">
              Mira la pantalla del host para ver el resultado.
            </p>
            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-xs font-semibold text-zinc-300">
              <Clock className="h-4 w-4 animate-pulse text-yellow-400" />
              Tiempo restante: <span className="font-mono font-bold text-white">{timeLeft}s</span>
            </div>
          </div>
        ) : currentQ?.questionType === "reorder" ? (
          /* MODO REORDENAR / PUZZLE PARA JUGADOR ESTILO KAHOOT (DRAG & DROP) */
          <div className="flex flex-1 flex-col gap-3">
            <div className="rounded-2xl border border-purple-500/30 bg-gradient-to-r from-purple-950/60 to-slate-900/60 p-3 text-center backdrop-blur">
              <p className="text-xs font-extrabold text-purple-200 flex items-center justify-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-yellow-300" />
                Arrastra las tarjetas o usa ▲/▼ para ordenar de 1º a 4º:
              </p>
            </div>

            <div className="flex flex-1 flex-col gap-2.5 touch-none select-none">
              {userOrder.map((optIdx, pos) => {
                const opt = currentQ.options[optIdx];
                const theme = OPTION_BUTTONS[optIdx];
                const isBeingDragged = draggedPos === pos;
                const isDragOver = dragOverPos === pos;

                return (
                  <div
                    key={optIdx}
                    data-reorder-pos={pos}
                    draggable
                    onDragStart={() => handleDragStart(pos)}
                    onDragOver={(e) => handleDragOver(e, pos)}
                    onDrop={() => handleDrop(pos)}
                    onDragEnd={handleDragEnd}
                    onTouchStart={() => handleTouchStart(pos)}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    className={`group relative flex items-center justify-between rounded-2xl ${theme.bg} p-3.5 text-white shadow-lg transition-all duration-200 cursor-grab active:cursor-grabbing border-2 ${
                      isBeingDragged
                        ? "opacity-60 scale-95 border-yellow-400 shadow-2xl ring-4 ring-yellow-400/30"
                        : isDragOver
                        ? "border-white scale-[1.02] shadow-xl"
                        : "border-transparent hover:border-white/20"
                    }`}
                  >
                    {/* Badge de posición (1º, 2º, 3º, 4º) */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-black/40 font-mono text-sm font-black tracking-wider text-yellow-300 shadow-inner">
                        {pos + 1}º
                      </span>
                      <span className="text-sm font-bold leading-snug break-words line-clamp-2">
                        {opt?.text || `Opción ${optIdx + 1}`}
                      </span>
                    </div>

                    {/* Drag Handle & Flechas de Respaldo */}
                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          moveOrderItem(pos, "up");
                        }}
                        disabled={pos === 0}
                        className="flex h-8 w-8 items-center justify-center rounded-xl bg-black/30 text-xs text-white disabled:opacity-20 hover:bg-black/50 active:scale-90 transition"
                        title="Mover arriba"
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          moveOrderItem(pos, "down");
                        }}
                        disabled={pos === userOrder.length - 1}
                        className="flex h-8 w-8 items-center justify-center rounded-xl bg-black/30 text-xs text-white disabled:opacity-20 hover:bg-black/50 active:scale-90 transition"
                        title="Mover abajo"
                      >
                        ▼
                      </button>
                      <div className="flex h-8 w-6 items-center justify-center text-white/70">
                        <GripVertical className="h-5 w-5" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => void handleSubmitReorder()}
              className="mt-2 flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-white text-base font-black text-black shadow-xl transition hover:bg-zinc-200 active:scale-95"
            >
              Confirmar Orden 🚀
            </button>
          </div>
        ) : (
          /* MODO KAHOOT PURO: 4 BOTONES GIGANTES SOLO FORMA / COLOR */
          <div className="grid flex-1 grid-cols-2 gap-3 min-h-[320px]">
            {OPTION_BUTTONS.map((opt, idx) => (
              <button
                key={opt.label}
                type="button"
                onClick={() => void handleSelectOption(idx)}
                className={`flex flex-col items-center justify-center rounded-[28px] ${opt.bg} text-white shadow-2xl transition hover:scale-[1.02] active:scale-95`}
              >
                <span className="text-6xl font-black drop-shadow-md">{opt.shape}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
