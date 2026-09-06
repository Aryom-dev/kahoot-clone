"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { Check, X, Trophy, Sparkles, Clock, Gamepad2, ArrowLeft } from "lucide-react";
import type { GameQuestion } from "@/stores/useGameStore";

type PlayerGameClientProps = {
  pin: string;
  nickname: string;
  playerId: string;
  sessionId: string;
};

const OPTION_BUTTONS = [
  { bg: "bg-[#e21b3c] active:bg-[#c41532]", shape: "▲", label: "A" },
  { bg: "bg-[#1368ce] active:bg-[#0f54a8]", shape: "◆", label: "B" },
  { bg: "bg-[#d89e00] active:bg-[#b58400]", shape: "●", label: "C" },
  { bg: "bg-[#26890c] active:bg-[#1e6e09]", shape: "■", label: "D" },
];

export default function PlayerGameClient({
  pin,
  nickname,
  playerId,
  sessionId,
}: PlayerGameClientProps) {
  const [questions, setQuestions] = useState<GameQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [sessionStatus, setSessionStatus] = useState<string>("active");
  const [quizTitle, setQuizTitle] = useState<string>("Monolith Game");

  const [submittedIndex, setSubmittedIndex] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [pointsEarned, setPointsEarned] = useState<number>(0);
  const [totalScore, setTotalScore] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(20);

  const questionStartTimeRef = useRef<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Cargar preguntas
  useEffect(() => {
    const loadQuestions = async () => {
      let loadedQuestions: GameQuestion[] = [];
      let title = "Monolith Game";

      try {
        const localData = localStorage.getItem("monolith_quizzes");
        if (localData) {
          const parsed = JSON.parse(localData) as Array<{
            id: string;
            title: string;
            questions: GameQuestion[];
          }>;
          if (Array.isArray(parsed) && parsed.length > 0) {
            const match = parsed[0];
            if (match.title) title = match.title;
            if (Array.isArray(match.questions)) loadedQuestions = match.questions;
          }
        }
      } catch (e) {
        console.log("Error al cargar preguntas locales en teléfono:", e);
      }

      setQuizTitle(title);
      setQuestions(loadedQuestions);
    };

    void loadQuestions();
  }, []);

  const currentQ = questions[currentQuestionIndex];

  // Reset del temporizador cuando cambia la pregunta
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

  // 2. Polling continuo al servidor para sincronizar estado de la sesión
  useEffect(() => {
    if (!pin && !sessionId) return;

    const syncSessionState = async () => {
      try {
        const res = await fetch(`/api/game/session?pin=${pin}&sessionId=${sessionId}`);
        if (res.ok) {
          const data = (await res.json()) as { status?: string; currentQuestionIndex?: number };
          if (data.status && data.status !== sessionStatus) {
            setSessionStatus(data.status);
          }

          if (
            typeof data.currentQuestionIndex === "number" &&
            data.currentQuestionIndex !== currentQuestionIndex
          ) {
            setCurrentQuestionIndex(data.currentQuestionIndex);
            setSubmittedIndex(null);
            setIsCorrect(null);
            setPointsEarned(0);
            setTimeLeft(20);
            questionStartTimeRef.current = Date.now();
          }
        }
      } catch (e) {
        console.log("Error sincronizando estado de sesión en cliente:", e);
      }
    };

    void syncSessionState();
    const interval = setInterval(() => void syncSessionState(), 1000);

    return () => {
      clearInterval(interval);
    };
  }, [pin, sessionId, sessionStatus, currentQuestionIndex]);

  // 3. Responder pregunta y enviar al servidor
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

      // Enviar respuesta por HTTP POST a la API del servidor
      try {
        await fetch("/api/game/answer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            playerId,
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
    [submittedIndex, currentQ, streak, sessionId, playerId, currentQuestionIndex]
  );

  // VISTA: FIN DE JUEGO (PODIO)
  if (sessionStatus === "ended") {
    return (
      <div className="mx-auto flex w-full max-w-[420px] flex-1 flex-col items-center justify-center px-4 py-8 text-center sm:max-w-md sm:py-12">
        <div className="relative w-full overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.06] p-6 backdrop-blur-2xl">
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-yellow-400 text-black shadow-lg">
              <Trophy className="h-8 w-8" />
            </div>
          </div>
          <h1 className="mt-4 text-2xl font-black text-white sm:text-3xl">
            ¡Partida Finalizada!
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Gran esfuerzo, <span className="font-semibold text-white">{nickname}</span>
          </p>

          <div className="mt-6 rounded-2xl border border-white/10 bg-[#0a0a0e]/60 p-4">
            <p className="text-xs text-zinc-400">Puntaje Final</p>
            <p className="mt-1 font-mono text-3xl font-black text-white">{totalScore} pts</p>
          </div>

          <Link
            href="/play"
            className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-white text-sm font-bold text-black transition hover:bg-zinc-100"
          >
            <ArrowLeft className="h-4 w-4" /> Volver a Inicio
          </Link>
        </div>
      </div>
    );
  }

  // VISTA: PANTALLA DE RESULTADOS TRAS CADA PREGUNTA
  if (sessionStatus === "results") {
    return (
      <div className="mx-auto flex w-full max-w-[420px] flex-1 flex-col justify-center px-4 py-8 text-center sm:max-w-md">
        <div
          className={`relative overflow-hidden rounded-[28px] border p-6 text-white backdrop-blur-2xl ${
            isCorrect
              ? "border-emerald-500/30 bg-emerald-950/40"
              : "border-red-500/30 bg-red-950/40"
          }`}
        >
          <div className="flex justify-center">
            <span
              className={`flex h-16 w-16 items-center justify-center rounded-full text-white shadow-xl ${
                isCorrect ? "bg-emerald-500" : "bg-red-500"
              }`}
            >
              {isCorrect ? <Check className="h-8 w-8 stroke-[3]" /> : <X className="h-8 w-8 stroke-[3]" />}
            </span>
          </div>

          <h2 className="mt-4 text-2xl font-black">
            {isCorrect ? "¡Correcto!" : "Incorrecto"}
          </h2>

          <p className="mt-2 font-mono text-lg font-bold">
            {isCorrect ? `+${pointsEarned} pts` : "+0 pts"}
          </p>

          {streak > 1 && (
            <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-orange-500/20 px-3 py-1 text-xs font-semibold text-orange-300">
              🔥 Racha de {streak} correctas
            </p>
          )}

          <div className="mt-6 rounded-2xl border border-white/10 bg-black/40 p-4">
            <p className="text-xs text-zinc-400">Tu puntaje acumulado</p>
            <p className="mt-1 font-mono text-2xl font-bold text-white">{totalScore} pts</p>
          </div>

          <p className="mt-4 text-xs text-zinc-400">
            Mira la pantalla del host para ver la clasificación general.
          </p>
        </div>
      </div>
    );
  }

  // VISTA: ESPERANDO TABLA DE POSICIONES
  if (sessionStatus === "leaderboard") {
    return (
      <div className="mx-auto flex w-full max-w-[420px] flex-1 flex-col items-center justify-center px-4 py-8 text-center sm:max-w-md">
        <div className="w-full rounded-[28px] border border-white/10 bg-white/[0.06] p-6 text-white backdrop-blur-2xl">
          <Sparkles className="mx-auto h-8 w-8 text-yellow-400" />
          <h2 className="mt-3 text-xl font-bold">Clasificación en pantalla</h2>
          <p className="mt-2 text-sm text-zinc-400">
            Revisa la pantalla principal para ver el ranking actual.
          </p>
          <div className="mt-4 rounded-xl bg-white/10 p-3 font-mono text-lg font-bold">
            Puntaje: {totalScore} pts
          </div>
        </div>
      </div>
    );
  }

  // VISTA: SELECCIÓN DE RESPUESTA (JUEGO ACTIVO)
  return (
    <div className="mx-auto flex w-full max-w-[420px] flex-1 flex-col px-4 py-4 sm:max-w-md sm:py-6">
      {/* Header mini para celular con Temporizador */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3 text-xs text-zinc-400">
        <span className="inline-flex items-center gap-1.5 font-medium text-white">
          <Gamepad2 className="h-3.5 w-3.5 text-emerald-400" /> {nickname}
        </span>

        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/10 px-3 py-1 font-mono text-sm font-black text-white">
          <Clock className="h-3.5 w-3.5 text-yellow-400 animate-pulse" />
          {timeLeft}s
        </span>

        <span className="font-mono font-bold text-emerald-400">
          {totalScore} pts
        </span>
      </div>

      <div className="mt-4 flex flex-1 flex-col gap-4">
        {/* Banner de estado y título del Quiz */}
        <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.06] p-3 text-xs backdrop-blur">
          <span className="font-semibold text-white">
            Pregunta {currentQuestionIndex + 1}
            {questions.length ? ` de ${questions.length}` : ""}
          </span>
          <span className="text-zinc-400 truncate max-w-[15ch]">
            {quizTitle}
          </span>
        </div>

        {/* Pregunta en la pantalla del celular */}
        {currentQ && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 text-center backdrop-blur">
            <h2 className="text-base font-bold text-white leading-snug">
              {currentQ.text}
            </h2>
          </div>
        )}

        {/* Si ya respondió: Pantalla de confirmación instantánea */}
        {submittedIndex !== null ? (
          <div className="flex flex-1 flex-col items-center justify-center rounded-[28px] border border-emerald-500/30 bg-emerald-950/20 p-8 text-center backdrop-blur">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg">
              <Check className="h-9 w-9 stroke-[3]" />
            </div>
            <h3 className="mt-4 text-2xl font-black text-white">
              ¡Respuesta enviada!
            </h3>
            <p className="mt-2 text-sm leading-6 text-zinc-300">
              Esperando a que termine el tiempo o respondan los demás jugadores.
            </p>
            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-xs font-semibold text-zinc-300">
              <Clock className="h-4 w-4 animate-pulse text-yellow-400" />
              Tiempo restante: <span className="font-mono font-bold text-white">{timeLeft}s</span>
            </div>
          </div>
        ) : (
          /* Botones táctiles Kahoot para el Jugador */
          <div className="grid flex-1 grid-cols-2 gap-3">
            {OPTION_BUTTONS.map((opt, idx) => {
              const optionText = currentQ?.options?.[idx]?.text;
              return (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => void handleSelectOption(idx)}
                  className={`flex flex-col items-center justify-center rounded-[24px] ${opt.bg} p-6 text-white shadow-xl transition active:scale-95`}
                >
                  <span className="text-4xl font-black">{opt.shape}</span>
                  <span className="mt-2 text-xs font-bold tracking-widest uppercase">
                    OPCIÓN {opt.label}
                  </span>
                  {optionText && (
                    <span className="mt-1 text-xs font-medium text-white/90 line-clamp-2 text-center px-1">
                      {optionText}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
