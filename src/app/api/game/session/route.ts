export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getServerSession,
  updateServerSessionStatus,
  registerServerSession,
  type ServerSession,
} from "@/lib/gameServerStore";

function isValidUuid(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const pin = searchParams.get("pin") ?? "";
  const sessionId = searchParams.get("sessionId") ?? "";

  const memorySession =
    getServerSession(pin) ??
    getServerSession(sessionId) ??
    getServerSession(pin || sessionId);

  let supabaseSession: Partial<ServerSession> | null = null;
  try {
    const supabase = await createClient();
    if (sessionId && isValidUuid(sessionId)) {
      const { data } = await supabase
        .from("game_sessions")
        .select("id, pin, status, current_question_index")
        .or(`id.eq.${sessionId},pin.eq.${pin}`)
        .single();

      if (data) {
        supabaseSession = {
          sessionId: data.id as string,
          pin: data.pin as string,
          status: data.status as ServerSession["status"],
          currentQuestionIndex: (data.current_question_index as number) ?? 0,
        };
      }
    }
  } catch (e) {
    console.log("Supabase session GET error:", e);
  }

  // Priorizar estado activo/avanzado en memoria del servidor Node.js
  let finalStatus: ServerSession["status"] = "lobby";

  if (memorySession?.status && memorySession.status !== "lobby") {
    finalStatus = memorySession.status;
  } else if (supabaseSession?.status && supabaseSession.status !== "lobby") {
    finalStatus = supabaseSession.status;
  } else if (memorySession?.status) {
    finalStatus = memorySession.status;
  } else if (supabaseSession?.status) {
    finalStatus = supabaseSession.status;
  }

  const finalQuestionIndex =
    memorySession?.currentQuestionIndex ?? supabaseSession?.currentQuestionIndex ?? 0;

  console.log(`[API GET /api/game/session] pin: "${pin}", sessionId: "${sessionId}" => memoryStatus: "${memorySession?.status}", finalStatus: "${finalStatus}"`);

  return NextResponse.json({
    status: finalStatus,
    currentQuestionIndex: finalQuestionIndex,
    pin: pin || memorySession?.pin || "",
    sessionId: sessionId || memorySession?.sessionId || "",
    quizId: memorySession?.quizId || "",
  });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      pin?: string;
      sessionId?: string;
      quizId?: string;
      status?: ServerSession["status"];
      currentQuestionIndex?: number;
      action?: "register" | "update";
    };

    const pin = body.pin ?? "";
    const sessionId = body.sessionId ?? "";
    const quizId = body.quizId ?? "";
    const status = body.status ?? "lobby";
    const questionIndex = body.currentQuestionIndex ?? 0;

    console.log(`[API POST /api/game/session] pin: "${pin}", sessionId: "${sessionId}", status: "${status}", action: "${body.action}"`);

    if (body.action === "register" && pin && sessionId) {
      registerServerSession(pin, sessionId, quizId);
    }

    if (pin || sessionId) {
      updateServerSessionStatus(pin || sessionId, status, questionIndex);
      if (pin) updateServerSessionStatus(pin, status, questionIndex);
      if (sessionId) updateServerSessionStatus(sessionId, status, questionIndex);
    }

    // Replicar en Supabase si es un UUID válido
    try {
      const supabase = await createClient();
      if (sessionId && isValidUuid(sessionId)) {
        await supabase
          .from("game_sessions")
          .upsert(
            {
              id: sessionId,
              pin: pin || "000000",
              status,
              current_question_index: questionIndex,
            },
            { onConflict: "id" }
          );
      }
    } catch (e) {
      console.log("Supabase session POST update error:", e);
    }

    return NextResponse.json({ success: true, status, currentQuestionIndex: questionIndex });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
