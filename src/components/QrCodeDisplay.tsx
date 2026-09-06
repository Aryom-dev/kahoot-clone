"use client";

import { useState } from "react";
import Image from "next/image";
import { QrCode, X, Sparkles } from "lucide-react";

type QrCodeDisplayProps = {
  url: string;
  pin: string;
  className?: string;
  compact?: boolean;
};

export default function QrCodeDisplay({
  url,
  pin,
  className = "",
  compact = false,
}: QrCodeDisplayProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
    url
  )}`;

  if (compact) {
    return (
      <>
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className={`inline-flex items-center gap-1.5 rounded-lg border border-purple-500/30 bg-purple-500/10 px-2.5 py-1 text-xs font-semibold text-purple-300 transition hover:bg-purple-500/20 active:scale-95 ${className}`}
        >
          <QrCode className="h-3.5 w-3.5" />
          <span>Ver QR</span>
        </button>

        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
            <div className="relative flex w-full max-w-sm flex-col items-center rounded-3xl border border-purple-500/30 bg-gradient-to-b from-slate-900 via-purple-950 to-slate-950 p-6 text-center shadow-2xl backdrop-blur-2xl">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="absolute right-4 top-4 rounded-full p-2 text-zinc-400 hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/20 text-purple-300">
                <QrCode className="h-6 w-6 animate-pulse" />
              </div>

              <h3 className="mt-3 text-lg font-bold text-white">
                Escanea para unirte
              </h3>
              <p className="mt-1 text-xs text-zinc-400">
                Abre la cámara de tu celular y escanea este código.
              </p>

              <div className="relative my-5 rounded-2xl border-4 border-white/20 bg-white p-3 shadow-2xl">
                <Image
                  src={qrImageUrl}
                  alt={`Código QR para el PIN ${pin}`}
                  width={200}
                  height={200}
                  className="rounded-lg object-contain"
                  unoptimized
                />
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-mono font-bold text-emerald-300">
                PIN: {pin}
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div
      className={`flex flex-col items-center rounded-2xl border border-purple-500/30 bg-purple-950/40 p-4 text-center backdrop-blur-md ${className}`}
    >
      <div className="flex items-center gap-1.5 text-xs font-bold text-purple-300 uppercase tracking-wider">
        <Sparkles className="h-3.5 w-3.5 text-purple-400" />
        <span>Escanear QR para Entrar</span>
      </div>

      <div className="relative my-3 rounded-2xl border-2 border-white/20 bg-white p-2.5 shadow-xl transition-transform hover:scale-105">
        <Image
          src={qrImageUrl}
          alt={`Código QR para unirse a la partida PIN ${pin}`}
          width={150}
          height={150}
          className="rounded-md object-contain"
          unoptimized
        />
      </div>

      <p className="text-[11px] font-medium leading-relaxed text-zinc-300 max-w-[24ch]">
        Escanea con tu celular para entrar sin escribir el PIN.
      </p>

      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="mt-2.5 inline-flex items-center gap-1.5 rounded-full border border-purple-400/30 bg-purple-500/20 px-3 py-1 text-xs font-semibold text-purple-200 transition hover:bg-purple-500/30"
      >
        <QrCode className="h-3.5 w-3.5" /> Ampliar QR
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <div className="relative flex w-full max-w-sm flex-col items-center rounded-3xl border border-purple-500/30 bg-gradient-to-b from-slate-900 via-purple-950 to-slate-950 p-6 text-center shadow-2xl backdrop-blur-2xl">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="absolute right-4 top-4 rounded-full p-2 text-zinc-400 hover:bg-white/10 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/20 text-purple-300">
              <QrCode className="h-6 w-6 animate-pulse text-purple-300" />
            </div>

            <h3 className="mt-3 text-xl font-extrabold text-white">
              Escanea el Código QR
            </h3>
            <p className="mt-1 text-xs text-zinc-400">
              Usa la cámara de tu teléfono inteligente para acceder inmediatamente.
            </p>

            <div className="relative my-6 rounded-3xl border-4 border-white/20 bg-white p-4 shadow-2xl">
              <Image
                src={qrImageUrl}
                alt={`Código QR para el PIN ${pin}`}
                width={240}
                height={240}
                className="rounded-xl object-contain"
                unoptimized
              />
            </div>

            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 font-mono text-sm font-black text-emerald-300">
              PIN: {pin}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
