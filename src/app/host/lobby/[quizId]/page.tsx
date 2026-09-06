import { createClient } from "@/lib/supabase/server";
import LobbyClient from "@/components/LobbyClient";
import { registerServerSession } from "@/lib/gameServerStore";

type LobbyPageProps = {
  params: Promise<{ quizId: string }>;
};

function generatePin(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function isValidUuid(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

function formatDemoUuid(pin: string): string {
  const paddedPin = pin.padStart(12, "0");
  return `00000000-0000-4000-8000-${paddedPin}`;
}

export default async function HostLobbyPage({ params }: LobbyPageProps) {
  const { quizId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let quizTitle = "Juego en vivo";
  let realQuizUuid: string | null = null;

  // 1. Si quizId es un UUID válido, intentar obtener el registro desde Supabase
  if (isValidUuid(quizId)) {
    const { data: quiz } = await supabase
      .from("quizzes")
      .select("id, title")
      .eq("id", quizId)
      .single();

    if (quiz) {
      realQuizUuid = quiz.id;
      if (quiz.title) quizTitle = quiz.title;
    }
  }

  // 2. Si no coincidió por ID, buscar la primera fila existente en quizzes de Supabase
  if (!realQuizUuid) {
    const { data: quizzesList } = await supabase
      .from("quizzes")
      .select("id, title")
      .limit(1);

    if (quizzesList && quizzesList.length > 0) {
      realQuizUuid = quizzesList[0].id as string;
      if (quizzesList[0].title) quizTitle = quizzesList[0].title as string;
    }
  }

  // 3. Si no hay ningún quiz en la base de datos, intentar crear uno base
  if (!realQuizUuid) {
    const candidateId = isValidUuid(quizId) ? quizId : crypto.randomUUID();
    const quizPayload: Record<string, unknown> = {
      id: candidateId,
      title: quizTitle,
      questions: [],
    };
    if (user?.id) quizPayload["user_id"] = user.id;

    const { data: created, error: createErr } = await supabase
      .from("quizzes")
      .insert(quizPayload)
      .select("id")
      .single();

    if (!createErr && created) {
      realQuizUuid = created.id;
    } else {
      delete quizPayload["user_id"];
      const { data: retryCreated } = await supabase
        .from("quizzes")
        .insert(quizPayload)
        .select("id")
        .single();
      if (retryCreated) realQuizUuid = retryCreated.id;
    }
  }

  const pin = generatePin();
  const hostId = user?.id ?? null;

  let sessionId = "";
  let finalPin = pin;

  if (realQuizUuid) {
    const candidatePayloads: Record<string, unknown>[] = [];
    const basePayload: Record<string, unknown> = {
      quiz_id: realQuizUuid,
      pin,
      status: "lobby",
    };

    if (hostId && isValidUuid(hostId)) {
      candidatePayloads.push({
        ...basePayload,
        host_id: hostId,
        current_question_index: 0,
      });
      candidatePayloads.push({
        ...basePayload,
        host_id: hostId,
      });
    }

    candidatePayloads.push({
      ...basePayload,
      current_question_index: 0,
    });
    candidatePayloads.push(basePayload);

    let successSession: { id: string; pin: string } | null = null;

    for (const payload of candidatePayloads) {
      const { data, error } = await supabase
        .from("game_sessions")
        .insert(payload)
        .select("id, pin")
        .single();

      if (!error && data) {
        successSession = data as { id: string; pin: string };
        break;
      }
    }

    if (successSession) {
      sessionId = successSession.id;
      finalPin = successSession.pin ?? pin;
    } else {
      sessionId = formatDemoUuid(pin);
    }
  } else {
    sessionId = formatDemoUuid(pin);
  }

  // Registrar sesión en el store global del servidor Node.js
  registerServerSession(finalPin, sessionId, quizId);

  return (
    <div className="flex flex-1 flex-col">
      <LobbyClient
        pin={finalPin}
        sessionId={sessionId}
        quizTitle={quizTitle}
        quizId={quizId}
      />
    </div>
  );
}
