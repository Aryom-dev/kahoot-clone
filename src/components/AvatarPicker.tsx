"use client";

import { useState } from "react";
import Avatar from "@/components/Avatar";
import { Dices } from "lucide-react";

type AvatarPickerProps = {
  initialNickname?: string;
  onAvatarChange?: (seed: string) => void;
  name?: string;
};

const AVATAR_SEEDS = [
  "Jei",
  "Alex",
  "Sam",
  "Luna",
  "Leo",
  "Maya",
  "Nico",
  "Zara",
  "Kai",
  "Felix",
  "Nova",
  "Aria",
];

export default function AvatarPicker({
  initialNickname = "Jei",
  onAvatarChange,
  name = "avatarSeed",
}: AvatarPickerProps) {
  const [seed, setSeed] = useState<string>(() => initialNickname || AVATAR_SEEDS[0]);

  const handleRandomize = () => {
    const randomSeed = `${seed}-${Math.random().toString(36).slice(2, 6)}`;
    setSeed(randomSeed);
    if (onAvatarChange) onAvatarChange(randomSeed);
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <input type="hidden" name={name} value={seed} />

      <div className="relative group">
        <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 opacity-70 blur-md transition duration-500 group-hover:opacity-100" />
        <div className="relative flex items-center justify-center p-2 rounded-2xl bg-slate-950/80 backdrop-blur-xl">
          <Avatar nickname={seed} size="xl" />
        </div>
      </div>

      <button
        type="button"
        onClick={handleRandomize}
        className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-1.5 text-xs font-bold text-purple-200 backdrop-blur transition hover:scale-105 hover:bg-purple-500/20 active:scale-95"
      >
        <Dices className="h-4 w-4 text-purple-300" />
        <span>🎲 Cambiar Avatar</span>
      </button>
    </div>
  );
}
