"use client";

import { useState } from "react";
import Image from "next/image";

type AvatarProps = {
  nickname: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
};

const SIZE_MAP = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
  xl: "h-16 w-16 text-lg",
};

const PIXEL_MAP = {
  sm: 32,
  md: 40,
  lg: 48,
  xl: 64,
};

const BACKGROUND_GRADIENTS = [
  "from-pink-500 to-rose-600",
  "from-purple-500 to-indigo-600",
  "from-emerald-400 to-teal-600",
  "from-amber-400 to-orange-600",
  "from-blue-500 to-cyan-600",
  "from-fuchsia-500 to-pink-600",
];

function getHashColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % BACKGROUND_GRADIENTS.length;
  return BACKGROUND_GRADIENTS[index];
}

export default function Avatar({
  nickname,
  size = "md",
  className = "",
}: AvatarProps) {
  const [imgError, setImgError] = useState(false);
  const safeName = nickname || "Jugador";
  const avatarUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(
    safeName
  )}&backgroundColor=transparent`;
  const bgGradient = getHashColor(safeName);

  return (
    <div
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br ${bgGradient} p-0.5 shadow-md backdrop-blur-md ${SIZE_MAP[size]} ${className}`}
    >
      <div className="flex h-full w-full items-center justify-center rounded-[14px] bg-slate-950/40 backdrop-blur-xs">
        {!imgError ? (
          <Image
            src={avatarUrl}
            alt={safeName}
            width={PIXEL_MAP[size]}
            height={PIXEL_MAP[size]}
            className="h-full w-full object-contain p-1 transition-transform duration-300 hover:scale-110"
            unoptimized
            onError={() => setImgError(true)}
          />
        ) : (
          <span className="font-bold tracking-wider text-white uppercase">
            {safeName.slice(0, 2)}
          </span>
        )}
      </div>
    </div>
  );
}
