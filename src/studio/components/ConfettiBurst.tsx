import React, { useEffect, useRef, useState } from "react";

export interface ConfettiBurstEvent {
  id: number;
  x: number;
  y: number;
}

interface ConfettiBurstProps {
  burst: ConfettiBurstEvent | null;
}

type ParticleShape = "ribbon" | "rect" | "circle";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  aspect: number;
  color: string;
  shape: ParticleShape;
  rotation: number;
  rotationSpeed: number;
  tilt: number;
  tiltSpeed: number;
  life: number;
  maxLife: number;
}

const PALETTE = [
  "#10b981", // emerald
  "#22d3ee", // cyan
  "#fbbf24", // amber
  "#a78bfa", // violet
  "#fb7185", // rose
  "#38bdf8", // sky
  "#f97316", // orange
];

const SHAPES: ParticleShape[] = ["ribbon", "rect", "circle"];

function spawnParticles(originX: number, originY: number, count = 88): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    // 70% upward celebratory fountain, 30% radial ring pop
    const isFountain = i < count * 0.7;
    const angle = isFountain
      ? -Math.PI / 2 + (Math.random() - 0.5) * 1.45
      : Math.random() * Math.PI * 2;
    const speed = isFountain
      ? 5.5 + Math.random() * 8.5
      : 2.5 + Math.random() * 5.5;

    const shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
    const size = shape === "circle" ? 3.5 + Math.random() * 3.5 : 5 + Math.random() * 5.5;
    const aspect = shape === "ribbon" ? 0.38 + Math.random() * 0.2 : 0.6 + Math.random() * 0.4;

    particles.push({
      x: originX + (Math.random() - 0.5) * 18,
      y: originY + (Math.random() - 0.5) * 10,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - (isFountain ? 1.5 : 0.5),
      size,
      aspect,
      color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
      shape,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.24,
      tilt: Math.random() * Math.PI * 2,
      tiltSpeed: 0.08 + Math.random() * 0.16,
      life: 0,
      maxLife: 1.45 + Math.random() * 0.85,
    });
  }
  return particles;
}

export const ConfettiBurst: React.FC<ConfettiBurstProps> = ({ burst }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (!burst) return;
    if (
      typeof window === "undefined" ||
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const syncSize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const nextW = Math.floor(window.innerWidth * dpr);
      const nextH = Math.floor(window.innerHeight * dpr);
      if (canvas.width !== nextW || canvas.height !== nextH) {
        canvas.width = nextW;
        canvas.height = nextH;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    syncSize();
    setActive(true);

    const safeX = Number.isFinite(burst.x) ? burst.x : window.innerWidth / 2;
    const safeY = Number.isFinite(burst.y) ? burst.y : window.innerHeight * 0.25;
    particlesRef.current.push(...spawnParticles(safeX, safeY));

    const handleResize = () => syncSize();
    window.addEventListener("resize", handleResize);

    if (rafRef.current === null) {
      lastTimeRef.current = performance.now();

      const tick = (now: number) => {
        const dt = Math.min((now - lastTimeRef.current) / 1000, 0.05);
        lastTimeRef.current = now;
        const step = dt * 60;

        const w = window.innerWidth;
        const h = window.innerHeight;
        ctx.clearRect(0, 0, w, h);

        const alive: Particle[] = [];
        const list = particlesRef.current;

        for (let i = 0; i < list.length; i++) {
          const p = list[i];
          p.life += dt;
          if (p.life >= p.maxLife) continue;

          // Gravity & air resistance
          p.vx *= Math.pow(0.985, step);
          p.vy = p.vy * Math.pow(0.992, step) + 0.26 * step;

          // Subtle horizontal flutter
          p.tilt += p.tiltSpeed * step;
          p.rotation += p.rotationSpeed * step;
          p.x += (p.vx + Math.sin(p.tilt) * 0.45) * step;
          p.y += p.vy * step;

          // Skip drawing if fallen well below viewport
          if (p.y > h + 40) continue;

          const progress = p.life / p.maxLife;
          const alpha = progress > 0.65 ? Math.max(0, 1 - (progress - 0.65) / 0.35) : 1;

          ctx.save();
          ctx.globalAlpha = alpha;
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          // Simulated 3D paper flip along Y axis
          const flipScale = Math.cos(p.tilt);
          ctx.scale(1, Math.abs(flipScale) < 0.15 ? 0.15 : flipScale);
          ctx.fillStyle = p.color;

          if (p.shape === "circle") {
            ctx.beginPath();
            ctx.arc(0, 0, p.size * 0.6, 0, Math.PI * 2);
            ctx.fill();
          } else {
            const rw = p.size;
            const rh = p.size * p.aspect;
            ctx.fillRect(-rw / 2, -rh / 2, rw, rh);
          }

          ctx.restore();
          alive.push(p);
        }

        particlesRef.current = alive;

        if (alive.length > 0) {
          rafRef.current = window.requestAnimationFrame(tick);
        } else {
          ctx.clearRect(0, 0, w, h);
          canvas.width = 0;
          canvas.height = 0;
          rafRef.current = null;
          setActive(false);
        }
      };

      rafRef.current = window.requestAnimationFrame(tick);
    }

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [burst]);

  // Ensure RAF is cancelled on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      particlesRef.current = [];
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      data-testid="confetti-canvas"
      data-active={active ? "true" : "false"}
      className={`fixed inset-0 w-full h-full pointer-events-none z-50 ${
        active ? "block" : "hidden"
      }`}
    />
  );
};
