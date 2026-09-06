"use client";

import { useEffect, useState } from "react";
import { Globe, Copy, Check, Hash, Smartphone, Wifi } from "lucide-react";

type ConnectionBannerProps = {
  pin: string;
  className?: string;
  compact?: boolean;
};

export default function ConnectionBanner({
  pin,
  className = "",
  compact = false,
}: ConnectionBannerProps) {
  const [lanIp, setLanIp] = useState<string>("");
  const [port, setPort] = useState<string>("3000");
  const [copiedUrl, setCopiedUrl] = useState<boolean>(false);
  const [copiedPin, setCopiedPin] = useState<boolean>(false);

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
        console.log("Error al detectar IP de red local:", e);
      }
    };
    void detectIp();
  }, []);

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

  const playAddress =
    typeof window !== "undefined"
      ? isProdHost
        ? `${window.location.origin}/play`
        : `http://${displayIp}:${displayPort}/play`
      : `http://${displayIp}:${displayPort}/play`;

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(playAddress);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } catch {
      setCopiedUrl(false);
    }
  };

  const handleCopyPin = async () => {
    try {
      await navigator.clipboard.writeText(pin);
      setCopiedPin(true);
      setTimeout(() => setCopiedPin(false), 2000);
    } catch {
      setCopiedPin(false);
    }
  };

  if (compact) {
    return (
      <div
        className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-indigo-500/30 bg-indigo-950/60 px-4 py-2.5 backdrop-blur-md ${className}`}
      >
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-300">
            <Smartphone className="h-4 w-4" />
          </div>
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-300">
              Dirección para unirse:
            </span>
            <p className="font-mono text-xs font-bold text-white">{playAddress}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void handleCopyUrl()}
            className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/10 px-2.5 py-1 text-xs text-indigo-200 transition hover:bg-white hover:text-black"
          >
            {copiedUrl ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copiedUrl ? "¡Copiado!" : "Copiar enlace"}</span>
          </button>

          <div className="flex items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1">
            <Hash className="h-3 w-3 text-emerald-400" />
            <span className="font-mono text-xs font-black text-emerald-300">{pin}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-indigo-500/40 bg-gradient-to-r from-indigo-950/90 via-purple-950/80 to-slate-900/90 p-4 shadow-2xl backdrop-blur-xl sm:p-5 ${className}`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-indigo-400/30 bg-indigo-500/20 text-indigo-300 shadow-[0_0_15px_rgba(99,102,241,0.25)]">
            <Wifi className="h-6 w-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/20 px-2.5 py-0.5 text-[11px] font-bold text-indigo-200">
                <Globe className="h-3 w-3" /> Dirección de red Wi-Fi detectada
              </span>
            </div>
            <p className="mt-1 text-xs font-medium text-zinc-300">
              Entra a esta dirección desde tu celular u otros dispositivos para jugar:
            </p>
            <p className="mt-0.5 font-mono text-base font-extrabold text-white sm:text-lg">
              {playAddress}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-center">
          <button
            type="button"
            onClick={() => void handleCopyUrl()}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-4 text-xs font-semibold text-white backdrop-blur transition hover:bg-white hover:text-black"
          >
            {copiedUrl ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
            {copiedUrl ? "Dirección copiada" : "Copiar dirección"}
          </button>

          <button
            type="button"
            onClick={() => void handleCopyPin()}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 text-xs font-bold text-emerald-300 backdrop-blur transition hover:bg-emerald-500/20"
          >
            <Hash className="h-4 w-4 text-emerald-400" />
            <span>PIN: {pin}</span>
            {copiedPin ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4 opacity-60" />}
          </button>
        </div>
      </div>
    </div>
  );
}
