"use client";

import { useFormStatus } from "react-dom";
import { ArrowRight } from "lucide-react";

type SubmitButtonProps = {
  label: string;
  pendingLabel: string;
};

export default function SubmitButton({
  label,
  pendingLabel,
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-1 inline-flex h-[46px] w-full items-center justify-center gap-2 rounded-full bg-white text-sm font-semibold text-black transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? (
        <span className="inline-flex items-center gap-2">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/20 border-t-black" />
          {pendingLabel}
        </span>
      ) : (
        <>
          {label}
          <ArrowRight className="h-4 w-4" />
        </>
      )}
    </button>
  );
}
