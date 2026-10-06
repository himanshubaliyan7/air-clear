/**
 * The air, drawn: dots drifting across the plot, more of them for a higher
 * concentration. Decoration only (aria-hidden); the reading itself is the text
 * on top of it. The density comes from lib/timeline.particleCount.
 *
 * With reduced motion one still frame is drawn. The loop stops when the canvas
 * leaves the page, and browsers pause it in a hidden tab.
 */
import { useEffect, useRef } from "react";
import { particleCount } from "@/lib/timeline";
import { prefersReducedMotion } from "@/components/instrument/primitives";

interface Particle {
  x: number;
  y: number;
  radius: number;
  speed: number;
  wobble: number;
  phase: number;
  alpha: number;
  maxAlpha: number;
  tinted: boolean;
  leaving: boolean;
}

/** `tint` is a CSS colour: the category colour a share of the dots take. */
export function AirWindow({ concentration, tint }: { concentration: number | null; tint: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Kept across renders so a change of station thins or thickens the same air.
  const particles = useRef<Particle[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    const still = prefersReducedMotion();
    let width = 0;
    let height = 0;
    let ink = "";
    let frame = 0;
    let last = 0;

    const spawn = (anywhere: boolean): Particle => {
      const maxAlpha = 0.2 + Math.random() * 0.7;
      return {
        x: anywhere ? Math.random() * width : -4,
        y: Math.random() * height,
        radius: 0.5 + Math.random() * Math.random() * 2.6,
        speed: 6 + Math.random() * 26,
        wobble: 0.3 + Math.random() * 0.9,
        phase: Math.random() * Math.PI * 2,
        alpha: still ? maxAlpha : 0,
        maxAlpha,
        tinted: Math.random() < 0.3,
        leaving: false,
      };
    };

    const measure = () => {
      const box = canvas.getBoundingClientRect();
      const ratio = Math.min(2, window.devicePixelRatio || 1);
      width = box.width;
      height = box.height;
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      ink = getComputedStyle(canvas).color;
    };

    const draw = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000 || 0.016);
      last = now;
      const want = particleCount(concentration, width, height);
      let list = particles.current;
      const alive = list.filter((particle) => !particle.leaving).length;
      for (let index = alive; index < want; index += 1) list.push(spawn(still || alive < 5));
      let surplus = alive - want;
      for (const particle of list) {
        if (surplus <= 0) break;
        if (!particle.leaving) {
          particle.leaving = true;
          surplus -= 1;
        }
      }
      list = list.filter((particle) => !(particle.leaving && (still || particle.alpha <= 0.01)));
      particles.current = list;

      context.clearRect(0, 0, width, height);
      for (const particle of list) {
        if (!still) {
          particle.x += particle.speed * dt;
          particle.y += Math.sin((now / 1000) * particle.wobble + particle.phase) * 5 * dt;
          if (particle.x > width + 4) {
            particle.x = -4;
            particle.y = Math.random() * height;
          }
          const goal = particle.leaving ? 0 : particle.maxAlpha;
          particle.alpha += (goal - particle.alpha) * Math.min(1, dt * 2.2);
        }
        context.globalAlpha = particle.alpha;
        context.fillStyle = particle.tinted ? tint : ink;
        context.beginPath();
        context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        context.fill();
      }
      context.globalAlpha = 1;
      if (!still) frame = requestAnimationFrame(draw);
    };

    const redraw = () => {
      measure();
      if (still) draw(0);
    };

    measure();
    last = performance.now();
    if (still) draw(0);
    else frame = requestAnimationFrame(draw);

    const resize = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(redraw);
    resize?.observe(canvas);
    // The theme is a class on <html>; the ink colour follows it.
    const theme = new MutationObserver(redraw);
    theme.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    return () => {
      cancelAnimationFrame(frame);
      resize?.disconnect();
      theme.disconnect();
    };
  }, [concentration, tint]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="absolute inset-0 h-full w-full text-foreground"
    />
  );
}
