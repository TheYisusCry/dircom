"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";

interface Particle {
  id: number;
  x: number;
  size: number;
  color: string;
  rotation: number;
  duration: number;
  delay: number;
  driftX: number;
}

const colors = [
  "#439441",
  "#eac46a",
  "#efd892",
  "#52b788",
  "#f4a261",
  "#e76f51",
  "#2a9d8f",
];

function createParticles(): Particle[] {
  return Array.from({ length: 45 }).map((_, i) => ({
    id: i,
    x: (i * 2.2 + 5) % 100,
    size: (i % 8) + 6,
    color: colors[i % colors.length],
    rotation: (i * 47) % 360,
    duration: 2.5 + (i % 6) * 0.3,
    delay: (i % 7) * 0.12,
    driftX: ((i % 5) - 2) * 3,
  }));
}

export function CelebrationConfetti({ triggerKey }: { triggerKey: string }) {
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (!triggerKey) return;

    const startTimer = setTimeout(() => setActive(true), 50);
    const endTimer = setTimeout(() => setActive(false), 4500);

    return () => {
      clearTimeout(startTimer);
      clearTimeout(endTimer);
    };
  }, [triggerKey]);

  const particles = active ? createParticles() : [];

  return (
    <AnimatePresence>
      {active && (
        <div
          className="pointer-events-none fixed inset-0 z-50 overflow-hidden"
          aria-hidden="true"
        >
          {particles.map((p) => (
            <motion.div
              key={p.id}
              initial={{
                x: `${p.x}vw`,
                y: "-10vh",
                rotate: 0,
                opacity: 1,
              }}
              animate={{
                y: "110vh",
                x: `${p.x + p.driftX}vw`,
                rotate: p.rotation + 720,
                opacity: [1, 1, 0.8, 0],
              }}
              transition={{
                duration: p.duration,
                delay: p.delay,
                ease: "easeOut",
              }}
              style={{
                position: "absolute",
                width: p.size,
                height: p.size * 1.5,
                backgroundColor: p.color,
                borderRadius: p.id % 3 === 0 ? "50%" : "2px",
              }}
            />
          ))}
        </div>
      )}
    </AnimatePresence>
  );
}
