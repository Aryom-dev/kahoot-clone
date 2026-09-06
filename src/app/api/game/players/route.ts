export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getServerPlayers, type ServerPlayer } from "@/lib/gameServerStore";

function isValidUuid(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const pin = searchParams.get("pin") ?? "";
  const sessionId = searchParams.get("sessionId") ?? "";

  const lookupKey = pin || sessionId;
  if (!lookupKey) {
    return NextResponse.json({ players: [] });
  }

  const memoryPlayers = getServerPlayers(lookupKey);

  let supabasePlayers: ServerPlayer[] = [];
  try {
    const supabase = await createClient();
    if (sessionId && isValidUuid(sessionId)) {
      const { data } = await supabase
        .from("players")
        .select("*")
        .eq("session_id", sessionId);

      if (data) supabasePlayers = data as ServerPlayer[];
    }
  } catch (e) {
    console.log("Supabase players route error:", e);
  }

  // Combinar y deduplicar jugadores por ID o nickname
  const playerMap = new Map<string, ServerPlayer>();
  memoryPlayers.forEach((p) => playerMap.set(p.nickname, p));
  supabasePlayers.forEach((p) => playerMap.set(p.nickname, p));

  const players = Array.from(playerMap.values());
  return NextResponse.json({ players });
}
