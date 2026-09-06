"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { registerServerPlayer } from "@/lib/gameServerStore";

function isValidUuid(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

function formatDemoUuid(pin: string): string {
  const paddedPin = pin.padStart(12, "0");
  return `00000000-0000-4000-8000-${paddedPin}`;
}

export async function joinGame(formData: FormData): Promise<void> {
  const rawPin = (formData.get("pin") as string | null)?.trim() ?? "";
  const rawNickname =
    (formData.get("nickname") as string | null)?.trim() ??
    (formData.get("name") as string | null)?.trim() ??
    "";

  if (!rawPin || !rawNickname) {
    redirect(`/play?error=${encodeURIComponent("Completa PIN y apodo.")}`);
  }

  const pin = rawPin.replace(/\D/g, "").slice(0, 6);
  const nickname = rawNickname.slice(0, 24);

  if (pin.length < 4) {
    redirect(`/play?error=${encodeURIComponent("El PIN debe tener al menos 4 dígitos.")}`);
  }
  if (nickname.length < 2) {
    redirect(`/play?error=${encodeURIComponent("El apodo debe tener al menos 2 caracteres.")}`);
  }

  const supabase = await createClient();

  // Buscar sesión por PIN en Supabase
  const { data: session } = await supabase
    .from("game_sessions")
    .select("id, pin, status")
    .eq("pin", pin)
    .single();

  const sessionId = (session?.id as string | undefined) ?? formatDemoUuid(pin);

  // 1. Registrar inmediatamente en el store del servidor Node.js (compartido entre laptop y celular)
  const serverPlayer = registerServerPlayer(pin, sessionId, nickname);

  // 2. Intentar registrar en Supabase
  let playerId = serverPlayer.id;
  if (isValidUuid(sessionId)) {
    const { data: insertedPlayer } = await supabase
      .from("players")
      .insert({ session_id: sessionId, nickname, score: 0, streak: 0 })
      .select("id")
      .single();

    if (insertedPlayer?.id) {
      playerId = insertedPlayer.id as string;
    }
  }

  const rawAvatarSeed = (formData.get("avatarSeed") as string | null)?.trim() ?? "";
  const avatarSeed = rawAvatarSeed || nickname;

  redirect(
    `/play/${pin}/waiting?nickname=${encodeURIComponent(nickname)}&playerId=${playerId}&sessionId=${sessionId}&avatarSeed=${encodeURIComponent(avatarSeed)}`
  );
}
