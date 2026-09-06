"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

type WaitingRealtimeProps = {
  pin: string;
  initialStatus: string;
  nickname: string;
  playerId: string;
  sessionId: string;
};

export default function WaitingRealtime({
  pin,
  initialStatus,
  nickname,
  playerId,
  sessionId,
}: WaitingRealtimeProps) {
  const router = useRouter();
  const isNavigatingRef = useRef<boolean>(false);

  useEffect(() => {
    const targetUrl = `/play/${pin}/active?nickname=${encodeURIComponent(nickname)}&playerId=${playerId}&sessionId=${sessionId}`;

    const triggerNavigation = () => {
      if (isNavigatingRef.current) return;
      isNavigatingRef.current = true;
      try {
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.href = targetUrl;
      } catch (e) {
        console.log("Error con location.href, usando router.push:", e);
      }
      router.push(targetUrl);
    };

    if (initialStatus === "active" || initialStatus === "question") {
      triggerNavigation();
      return;
    }

    const checkStatus = async () => {
      try {
        const res = await fetch(
          `/api/game/session?pin=${pin}&sessionId=${sessionId}&t=${Date.now()}`,
          {
            cache: "no-store",
            headers: { "Cache-Control": "no-cache" },
          }
        );
        if (res.ok) {
          const data = (await res.json()) as { status?: string };
          if (data.status && data.status !== "lobby") {
            triggerNavigation();
          }
        }
      } catch (e) {
        console.log("Error al verificar estado de la sesión en teléfono:", e);
      }
    };

    void checkStatus();
    const interval = setInterval(() => void checkStatus(), 400);

    return () => {
      clearInterval(interval);
    };
  }, [pin, initialStatus, nickname, playerId, sessionId, router]);

  return null;
}
