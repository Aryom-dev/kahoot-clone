export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { recordServerAnswer, getServerAnswers } from "@/lib/gameServerStore";

function isValidUuid(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("sessionId") ?? "";
  const pin = searchParams.get("pin") ?? "";
  const questionIndex = parseInt(searchParams.get("questionIndex") ?? "0", 10);

  const lookupKey = sessionId || pin;
  const memoryAnswers = getServerAnswers(lookupKey, questionIndex);

  let supabaseAnswers: Array<{ player_id: string; option_index: number; is_correct: boolean; points: number }> = [];
  try {
    const supabase = await createClient();
    if (sessionId && isValidUuid(sessionId)) {
      const { data } = await supabase
        .from("answers")
        .select("player_id, option_index, is_correct, points")
        .eq("session_id", sessionId)
        .eq("question_index", questionIndex);
      if (data) supabaseAnswers = data as typeof supabaseAnswers;
    }
  } catch (e) {
    console.log("Supabase answers GET error:", e);
  }

  const combined =
    memoryAnswers.length > 0
      ? memoryAnswers.map((a) => ({
          player_id: a.playerId,
          option_index: a.optionIndex,
          is_correct: a.isCorrect,
          points: a.points,
        }))
      : supabaseAnswers;

  return NextResponse.json({ answers: combined });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      sessionId: string;
      playerId: string;
      questionIndex: number;
      optionIndex: number;
      userOrder?: number[];
      isCorrect: boolean;
      points: number;
      nickname?: string;
    };

    const { sessionId, playerId, questionIndex, optionIndex, isCorrect, points, nickname } = body;

    // 1. Guardar en memoria global del servidor Node.js
    recordServerAnswer(sessionId, playerId, questionIndex, optionIndex, isCorrect, points, nickname);

    // 2. Guardar en Supabase si es UUID válido
    try {
      const supabase = await createClient();
      if (isValidUuid(sessionId) && isValidUuid(playerId)) {
        await supabase.from("answers").insert({
          session_id: sessionId,
          player_id: playerId,
          question_index: questionIndex,
          option_index: optionIndex,
          is_correct: isCorrect,
          points: points,
        });

        const { data: player } = await supabase
          .from("players")
          .select("score, streak")
          .eq("id", playerId)
          .single();

        const currentScore = (player?.score as number) ?? 0;
        const currentStreak = (player?.streak as number) ?? 0;

        await supabase
          .from("players")
          .update({
            score: currentScore + points,
            streak: isCorrect ? currentStreak + 1 : 0,
          })
          .eq("id", playerId);
      }
    } catch (e) {
      console.log("Error al guardar respuesta en Supabase:", e);
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
