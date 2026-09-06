// Store global en memoria del servidor Node.js (compartido entre laptop y teléfonos)

export type ServerPlayer = {
  id: string;
  pin: string;
  sessionId: string;
  nickname: string;
  score: number;
  streak: number;
  created_at: string;
};

export type ServerSession = {
  sessionId: string;
  pin: string;
  quizId: string;
  status: "lobby" | "active" | "question" | "results" | "leaderboard" | "ended";
  currentQuestionIndex: number;
  questionStartTime?: string;
};

export type ServerAnswer = {
  sessionId: string;
  playerId: string;
  questionIndex: number;
  optionIndex: number;
  isCorrect: boolean;
  points: number;
};

type GlobalStore = {
  sessions: Map<string, ServerSession>;
  players: Map<string, ServerPlayer[]>;
  answers: Map<string, ServerAnswer[]>;
};

declare global {
  var __MONOLITH_GAME_STORE__: GlobalStore | undefined;
}

if (!globalThis.__MONOLITH_GAME_STORE__) {
  globalThis.__MONOLITH_GAME_STORE__ = {
    sessions: new Map(),
    players: new Map(),
    answers: new Map(),
  };
}

export const gameServerStore = globalThis.__MONOLITH_GAME_STORE__;

export function extractPinFromId(id: string): string {
  if (!id) return "";
  const parts = id.split("-");
  const lastPart = parts[parts.length - 1];
  if (lastPart && /^\d+$/.test(lastPart)) {
    const unpadded = lastPart.replace(/^0+/, "");
    if (unpadded.length >= 4) return unpadded;
  }
  return "";
}

export function registerServerSession(pin: string, sessionId: string, quizId: string): ServerSession {
  const derivedPin = pin || extractPinFromId(sessionId);
  const session: ServerSession = {
    sessionId,
    pin: derivedPin,
    quizId,
    status: "lobby",
    currentQuestionIndex: 0,
  };

  if (derivedPin) gameServerStore.sessions.set(derivedPin, session);
  if (sessionId) gameServerStore.sessions.set(sessionId, session);

  console.log("[REGISTER SESSION] store size:", gameServerStore.sessions.size, "keys:", [...gameServerStore.sessions.keys()]);
  return session;
}

export function updateServerSessionStatus(
  pinOrSessionId: string,
  status: ServerSession["status"],
  questionIndex = 0
): void {
  const derivedPin = extractPinFromId(pinOrSessionId) || pinOrSessionId;

  console.log("[POST updateServerSessionStatus] pinOrSessionId:", pinOrSessionId, "status:", status, "store keys:", [...gameServerStore.sessions.keys()]);

  let updatedCount = 0;
  // Actualización por clave directa
  const direct = gameServerStore.sessions.get(pinOrSessionId) ?? gameServerStore.sessions.get(derivedPin);
  if (direct) {
    direct.status = status;
    direct.currentQuestionIndex = questionIndex;
    if (direct.pin) gameServerStore.sessions.set(direct.pin, direct);
    if (direct.sessionId) gameServerStore.sessions.set(direct.sessionId, direct);
    updatedCount++;
  }

  // Actualización por escaneo global de sesiones
  for (const session of gameServerStore.sessions.values()) {
    const sessionDerivedPin = extractPinFromId(session.sessionId);
    if (
      session.pin === pinOrSessionId ||
      session.sessionId === pinOrSessionId ||
      session.pin === derivedPin ||
      sessionDerivedPin === derivedPin
    ) {
      session.status = status;
      session.currentQuestionIndex = questionIndex;
      if (session.pin) gameServerStore.sessions.set(session.pin, session);
      if (session.sessionId) gameServerStore.sessions.set(session.sessionId, session);
      updatedCount++;
    }
  }

  console.log("[POST updateServerSessionStatus] match encontrado, actualizadas:", updatedCount, "sesiones");
}

export function registerServerPlayer(pin: string, sessionId: string, nickname: string): ServerPlayer {
  const derivedPin = pin || extractPinFromId(sessionId);
  const lookupKey = derivedPin || sessionId;

  const players = gameServerStore.players.get(lookupKey) ?? [];
  const existing = players.find((p) => p.nickname === nickname);
  if (existing) return existing;

  const newPlayer: ServerPlayer = {
    id: `player-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    pin: derivedPin,
    sessionId,
    nickname,
    score: 0,
    streak: 0,
    created_at: new Date().toISOString(),
  };

  const updated = [...players, newPlayer];
  if (derivedPin) gameServerStore.players.set(derivedPin, updated);
  if (sessionId) gameServerStore.players.set(sessionId, updated);
  return newPlayer;
}

export function getServerPlayers(pinOrSessionId: string): ServerPlayer[] {
  if (!pinOrSessionId) return [];
  const derivedPin = extractPinFromId(pinOrSessionId) || pinOrSessionId;

  const byKey = gameServerStore.players.get(pinOrSessionId) ?? gameServerStore.players.get(derivedPin);
  if (byKey && byKey.length > 0) return byKey;

  for (const list of gameServerStore.players.values()) {
    if (
      list.some(
        (p) =>
          p.pin === pinOrSessionId ||
          p.sessionId === pinOrSessionId ||
          p.pin === derivedPin ||
          extractPinFromId(p.sessionId) === derivedPin
      )
    ) {
      return list;
    }
  }

  return [];
}

export function getServerSession(pinOrSessionId: string): ServerSession | undefined {
  if (!pinOrSessionId) return undefined;
  const derivedPin = extractPinFromId(pinOrSessionId) || pinOrSessionId;

  console.log("[GET getServerSession] buscando pinOrSessionId:", pinOrSessionId, "derivedPin:", derivedPin, "keys:", [...gameServerStore.sessions.keys()]);

  const direct = gameServerStore.sessions.get(pinOrSessionId) ?? gameServerStore.sessions.get(derivedPin);
  if (direct) {
    console.log("[GET getServerSession] match directo encontrado:", direct.status);
    return direct;
  }

  for (const session of gameServerStore.sessions.values()) {
    const sessionDerivedPin = extractPinFromId(session.sessionId);
    if (
      session.pin === pinOrSessionId ||
      session.sessionId === pinOrSessionId ||
      session.pin === derivedPin ||
      (sessionDerivedPin && sessionDerivedPin === derivedPin)
    ) {
      console.log("[GET getServerSession] match en loop encontrado:", session.status);
      return session;
    }
  }

  console.log("[GET getServerSession] NO se encontró coincidencia en store");
  return undefined;
}

export function recordServerAnswer(
  sessionId: string,
  playerId: string,
  questionIndex: number,
  optionIndex: number,
  isCorrect: boolean,
  points: number,
  nickname?: string
): void {
  const derivedPin = extractPinFromId(sessionId) || sessionId;

  const existingAnswers =
    gameServerStore.answers.get(sessionId) ??
    gameServerStore.answers.get(derivedPin) ??
    [];

  const newAnswer: ServerAnswer = {
    sessionId,
    playerId,
    questionIndex,
    optionIndex,
    isCorrect,
    points,
  };

  const updatedAnswers = [
    ...existingAnswers.filter(
      (a) => !(a.playerId === playerId && a.questionIndex === questionIndex)
    ),
    newAnswer,
  ];

  if (sessionId) gameServerStore.answers.set(sessionId, updatedAnswers);
  if (derivedPin) gameServerStore.answers.set(derivedPin, updatedAnswers);

  // Actualizar puntaje y racha del jugador
  for (const list of gameServerStore.players.values()) {
    const p = list.find(
      (item) => item.id === playerId || (nickname && item.nickname === nickname)
    );
    if (p) {
      p.score += points;
      p.streak = isCorrect ? p.streak + 1 : 0;
    }
  }

  console.log(`[RECORD ANSWER] player: ${playerId}, q: ${questionIndex}, opt: ${optionIndex}, points: ${points}`);
}

export function getServerAnswers(pinOrSessionId: string, questionIndex: number): ServerAnswer[] {
  if (!pinOrSessionId) return [];
  const derivedPin = extractPinFromId(pinOrSessionId) || pinOrSessionId;

  const direct =
    gameServerStore.answers.get(pinOrSessionId) ??
    gameServerStore.answers.get(derivedPin);

  if (direct && direct.length > 0) {
    return direct.filter((a) => a.questionIndex === questionIndex);
  }

  for (const list of gameServerStore.answers.values()) {
    if (
      list.some(
        (a) =>
          a.sessionId === pinOrSessionId ||
          extractPinFromId(a.sessionId) === derivedPin ||
          extractPinFromId(a.sessionId) === pinOrSessionId
      )
    ) {
      return list.filter((a) => a.questionIndex === questionIndex);
    }
  }

  return [];
}
