"use client";

import { useState } from "react";
import { Lock, Eye, EyeOff } from "lucide-react";

type PasswordInputProps = {
  id: string;
  name: string;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
};

export default function PasswordInput({
  id,
  name,
  placeholder = "••••••••",
  autoComplete = "current-password",
  required = true,
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState<boolean>(false);

  return (
    <div className="relative">
      <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
      <input
        id={id}
        name={name}
        type={showPassword ? "text" : "password"}
        autoComplete={autoComplete}
        required={required}
        placeholder={placeholder}
        className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.06] py-2 pl-10 pr-10 text-sm text-white placeholder:text-zinc-500 backdrop-blur outline-none transition focus:border-white/20 focus:bg-white/[0.08] focus:ring-2 focus:ring-white/10"
      />
      <button
        type="button"
        aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
        onClick={() => setShowPassword((v) => !v)}
        className="absolute right-2 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-white/10 hover:text-white"
      >
        {showPassword ? (
          <EyeOff className="h-4 w-4" />
        ) : (
          <Eye className="h-4 w-4" />
        )}
      </button>
    </div>
  );
}
