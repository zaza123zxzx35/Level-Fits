import React, { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  size: number;
  speedY: number;
  speedX: number;
  color: string;
  alpha: number;
  decay: number;
}

export function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let particles: Particle[] = [];

    // Electric blue (#00C8FF) and Dark Purple (#7B2FBE) shadow embers
    const colors = ["rgba(0, 200, 255, ", "rgba(123, 47, 190, ", "rgba(88, 28, 135, ", "rgba(139, 92, 246, "];

    const createParticle = (width: number, height: number, initAtBottom = false): Particle => {
      return {
        x: Math.random() * width,
        y: initAtBottom ? height + Math.random() * 20 : Math.random() * height,
        size: Math.random() * 2.8 + 0.5,
        speedY: -(Math.random() * 0.7 + 0.2), // drifts upwards slowly
        speedX: (Math.random() - 0.5) * 0.3,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: Math.random() * 0.7 + 0.15,
        decay: Math.random() * 0.0018 + 0.0008,
      };
    };

    const handleResize = (entries: ResizeObserverEntry[]) => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        canvas.width = width;
        canvas.height = height;

        // Initialize particles
        particles = [];
        for (let i = 0; i < 45; i++) {
          particles.push(createParticle(width, height, false));
        }
      }
    };

    const resizeObserver = new ResizeObserver(handleResize);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p, idx) => {
        p.y += p.speedY;
        p.x += p.speedX;
        p.alpha -= p.decay;

        // Draw particle with glowing shadows
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color}${p.alpha})`;
        ctx.shadowColor = p.color === "rgba(0, 200, 255, " ? "#00C8FF" : "#7B2FBE";
        ctx.shadowBlur = 8;
        ctx.fill();

        // Regenerate if dead or out of bounds
        if (p.alpha <= 0 || p.y < -10 || p.x < -10 || p.x > canvas.width + 10) {
          particles[idx] = createParticle(canvas.width, canvas.height, true);
        }
      });

      // Clear shadow properties for next elements
      ctx.shadowBlur = 0;
      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationId);
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0 pointer-events-none w-full h-full overflow-hidden z-[0]">
      <canvas ref={canvasRef} className="block w-full h-full bg-[#0D0D1A] opacity-50" />
    </div>
  );
}
