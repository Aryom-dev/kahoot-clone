"use client";

import { useEffect, useState } from "react";

export default function InteractiveBackground({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({
    x: 50,
    y: 50,
  });

  useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent) => {
      let clientX = 0;
      let clientY = 0;

      if ("touches" in e && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else if ("clientX" in e) {
        clientX = e.clientX;
        clientY = e.clientY;
      }

      const x = Math.round((clientX / window.innerWidth) * 100);
      const y = Math.round((clientY / window.innerHeight) * 100);
      setMousePos({ x, y });
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("touchmove", handleMove);

    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("touchmove", handleMove);
    };
  }, []);

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-[#090a0f] text-white">
      {/* Dynamic Orbs background */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        {/* Animated Orb 1 - Purple/Indigo */}
        <div
          className="absolute -top-[10%] left-[15%] h-[500px] w-[500px] rounded-full bg-gradient-to-tr from-indigo-600/30 via-purple-600/20 to-pink-600/10 blur-[130px] transition-transform duration-1000 ease-out"
          style={{
            transform: `translate(${(mousePos.x - 50) * 0.4}px, ${(mousePos.y - 50) * 0.4}px)`,
          }}
        />

        {/* Animated Orb 2 - Emerald/Teal */}
        <div
          className="absolute top-[40%] -right-[10%] h-[550px] w-[550px] rounded-full bg-gradient-to-br from-emerald-600/25 via-teal-600/20 to-cyan-600/10 blur-[140px] transition-transform duration-1000 ease-out"
          style={{
            transform: `translate(${(50 - mousePos.x) * 0.5}px, ${(50 - mousePos.y) * 0.5}px)`,
          }}
        />

        {/* Animated Orb 3 - Magenta/Violet */}
        <div
          className="absolute -bottom-[10%] left-[30%] h-[450px] w-[450px] rounded-full bg-gradient-to-tl from-purple-700/25 via-fuchsia-600/20 to-indigo-800/15 blur-[120px] transition-transform duration-1000 ease-out"
          style={{
            transform: `translate(${(mousePos.x - 50) * 0.3}px, ${(mousePos.y - 50) * 0.3}px)`,
          }}
        />

        {/* Interactive Radial Spotlight following cursor/touch */}
        <div
          className="absolute inset-0 transition-opacity duration-500 opacity-80"
          style={{
            background: `radial-gradient(600px circle at ${mousePos.x}% ${mousePos.y}%, rgba(99, 102, 241, 0.15), rgba(168, 85, 247, 0.08) 40%, transparent 80%)`,
          }}
        />

        {/* Subtle grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex min-h-screen flex-col">
        {children}
      </div>
    </div>
  );
}
