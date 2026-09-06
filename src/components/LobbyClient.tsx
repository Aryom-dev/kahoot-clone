"use client";

import { useEffect, useState } from "react";
import { Users, Copy, Check, Crown, Sparkles, Play } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import ConnectionBanner from "@/components/ConnectionBanner";
import Avatar from "@/components/Avatar";
import QrCodeDisplay from "@/components/QrCodeDisplay";

type Player = {
  id: string;
  nickname?: string;
  name?: string;
  player_name?: string;
  username?: string;
  created_at?: string;
};

type LobbyClientProps = {
  pin: string;
  sessionId: string;
  quizTitle: string;
  quizId: string;
};

function getPlayerDisplayName(p: Player): string {
  return p.nickname ?? p.player_name ?? p.name ?? p.username ?? "Jugador";
}

export default function LobbyClient({
  pin,
  sessionId,
  quizTitle,
  quizId,
}: LobbyClientProps) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [copied, setCopied] = useState<boolean>(false);
  const [isStarting, setIsStarting] = useState<boolean>(false);
  const [lanIp, setLanIp] = useState<string>("");
  const [port, setPort] = useState<string>("3000");

  useEffect(() => {
    const detectIp = async () => {
      try {
        const res = await fetch("/api/network-ip");
        if (res.ok) {
          const data = (await res.json()) as { lanIp?: string; port?: string };
          if (data.lanIp) setLanIp(data.lanIp);
          if (data.port) setPort(data.port);
        }
      } catch (e) {
        console.log("Error al detectar IP local:", e);
      }
    };
    void detectIp();
  }, []);

  useEffect(() => {
    if (!pin && !sessionId) return;

    const fetchPlayers = async (): Promise<void> => {
      try {
        const res = await fetch(
          `/api/game/players?pin=${pin}&sessionId=${sessionId}&t=${Date.now()}`,
          {
            cache: "no-store",
            headers: { "Cache-Control": "no-cache" },
          }
        );
        if (res.ok) {
          const body = (await res.json()) as { players?: Player[] };
          if (Array.isArray(body.players)) {
            setPlayers(body.players);
          }
        }
      } catch (e) {
        console.log("Error al consultar jugadores desde servidor:", e);
      }
    };

    void fetchPlayers();
    const interval = setInterval(() => void fetchPlayers(), 800);

    return () => {
      clearInterval(interval);
    };
  }, [pin, sessionId]);

  const handleCopyPin = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(pin);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const handleStartGame = async (): Promise<void> => {
    setIsStarting(true);

    try {
      // 1. Actualizar el estado en el servidor Node.js y esperar la confirmación de la respuesta
      await fetch("/api/game/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pin,
          sessionId,
          status: "active",
          currentQuestionIndex: 0,
          action: "update",
        }),
      });

      // 2. Emitir evento de difusión (Broadcast) vía Supabase Realtime
      const supabase = createClient();
      const channel = supabase.channel(`game-room-${pin}`);
      channel.subscribe((subStatus: string) => {
        if (subStatus === "SUBSCRIBED") {
          void channel.send({
            type: "broadcast",
            event: "game_state",
            payload: { status: "active", currentQuestionIndex: 0, pin, sessionId },
          });
        }
      });
    } catch (e) {
      console.log("Error al iniciar partida:", e);
    }

    // 3. Pequeña pausa para asegurar la salida de red antes de la navegación del Host
    await new Promise((resolve) => setTimeout(resolve, 150));

    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = `/host/game/${sessionId}?quizId=${quizId}&pin=${pin}`;
  };

  const currentHost = typeof window !== "undefined" ? window.location.hostname : "";
  const displayIp =
    currentHost && currentHost !== "localhost" && currentHost !== "127.0.0.1"
      ? currentHost
      : lanIp || "localhost";
  const displayPort =
    typeof window !== "undefined" && window.location.port ? window.location.port : port;

  const isProdHost =
    typeof window !== "undefined" &&
    window.location.hostname !== "localhost" &&
    window.location.hostname !== "127.0.0.1";

  const playUrl =
    typeof window !== "undefined"
      ? isProdHost
        ? `${window.location.origin}/play?pin=${pin}`
        : `http://${displayIp}:${displayPort}/play?pin=${pin}`
      : `http://${displayIp}:${displayPort}/play?pin=${pin}`;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-6 sm:px-6 sm:py-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1.5">
          <div className="inline-flex items-center gap-2 self-start rounded-full border border-white/[0.06] bg-white/[0.04] px-3 py-1 text-xs font-medium text-zinc-400 backdrop-blur">
            <Crown className="h-3 w-3" />
            Sala de espera — Host
          </div>
          <h1 className="max-w-[28ch] text-pretty text-xl font-semibold tracking-tight text-white sm:text-2xl">
            {quizTitle}
          </h1>
        </div>

        {/* Botón grande para Iniciar Partida */}
        <button
          type="button"
          onClick={() => void handleStartGame()}
          disabled={isStarting}
          className="inline-flex h-12 items-center justify-center gap-2.5 rounded-full bg-white px-8 text-base font-bold text-black shadow-[0_8px_24px_rgba(255,255,255,0.15)] transition hover:scale-[1.02] hover:bg-zinc-100 disabled:opacity-60"
        >
          {isStarting ? (
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-black/20 border-t-black" />
          ) : (
            <Play className="h-5 w-5 fill-black" />
          )}
          {isStarting ? "Iniciando..." : "Iniciar Partida"}
        </button>
      </div>

      {/* Banner de Dirección IP de Red Wi-Fi */}
      <ConnectionBanner pin={pin} className="mt-6" />

      {/* PIN gigante + Código QR */}
      <div className="relative mt-6 overflow-hidden rounded-[28px] border border-white/[0.08] bg-white/[0.06] p-6 backdrop-blur-2xl sm:p-8">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        <div className="pointer-events-none absolute -top-24 right-[-40px] h-48 w-48 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.08),transparent_70%)] blur-xl" />

        <div className="relative flex flex-col items-center gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 flex-col items-center text-center md:items-start md:text-left">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-medium tracking-widest text-zinc-300 backdrop-blur">
              <Sparkles className="h-3 w-3" />
              PIN DE LA PARTIDA
            </p>

            <div className="mt-4 flex items-center gap-3">
              <p className="font-mono text-6xl font-black tracking-[0.16em] text-white sm:text-7xl lg:text-8xl">
                {pin}
              </p>
              <button
                type="button"
                onClick={() => void handleCopyPin()}
                aria-label="Copiar PIN"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-zinc-300 backdrop-blur transition hover:bg-white hover:text-black"
              >
                {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
              </button>
            </div>

            <p className="mt-3 max-w-[40ch] text-sm leading-6 text-zinc-400">
              Escanea el código QR o comparte este PIN con los jugadores para que se unan desde{" "}
              <span className="font-medium text-zinc-200">/play</span>.
            </p>

            <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3.5 py-1.5 text-xs font-semibold text-emerald-300">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
              Esperando jugadores · {players.length} conectado{players.length !== 1 ? "s" : ""}
            </div>
          </div>

          <div className="shrink-0">
            <QrCodeDisplay url={playUrl} pin={pin} />
          </div>
        </div>
      </div>

      {/* Jugadores */}
      <div className="mt-6 flex items-center justify-between">
        <h2 className="inline-flex items-center gap-2 text-sm font-semibold tracking-tight text-white">
          <Users className="h-4 w-4" />
          Jugadores unidos
          <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-bold text-black">
            {players.length}
          </span>
        </h2>
        <span className="text-xs text-zinc-500">
          Sincronización multidispositivo activa
        </span>
      </div>

      {players.length === 0 ? (
        <div className="mt-4 flex flex-col items-center justify-center rounded-[22px] border border-dashed border-white/10 bg-white/[0.03] px-6 py-14 text-center backdrop-blur">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] text-zinc-400">
            <Users className="h-5 w-5" />
          </div>
          <p className="mt-3 text-sm font-medium text-white">Esperando jugadores...</p>
          <p className="mt-1 max-w-[36ch] text-sm leading-6 text-zinc-500">
            Cuando alguien se una ingresando el PIN <span className="font-mono font-semibold text-zinc-300">{pin}</span> en la página de inicio o en <span className="font-mono text-zinc-300">/play</span>, su nombre aparecerá aquí al instante.
          </p>
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
          {players.map((p) => {
            const name = getPlayerDisplayName(p);
            return (
              <div
                key={p.id}
                className="group relative flex items-center gap-3 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.06] p-3 backdrop-blur-xl transition hover:bg-white/[0.10]"
              >
                <Avatar nickname={name} size="sm" />
                <span className="min-w-0 flex-1 truncate text-sm font-semibold text-white">
                  {name}
                </span>
                <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
