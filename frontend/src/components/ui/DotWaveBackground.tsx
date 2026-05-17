'use client';

import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  originX: number;
  originY: number;
  size: number;
  phase: number;
}

export default function DotWaveBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let particles: Particle[] = [];
    let time = 0;

    function resize() {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initParticles();
    }

    function initParticles() {
      if (!canvas) return;
      particles = [];
      const gap = 28;

      for (let x = 0; x < canvas.width + gap; x += gap) {
        for (let y = 0; y < canvas.height + gap; y += gap) {
          particles.push({
            x,
            y,
            originX: x,
            originY: y,
            size: Math.random() * 1.6 + 0.8,
            phase: Math.random() * Math.PI * 2,
          });
        }
      }
    }

    function draw() {
      if (!ctx || !canvas) return;
      time += 0.004;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const waveX = Math.sin(time + p.originY * 0.004 + p.phase) * 14;
        const waveY = Math.sin(time * 0.7 + p.originX * 0.004 + p.phase) * 14;
        const pulse = Math.sin(time * 1.5 + p.phase) * 0.25 + 0.5;

        p.x = p.originX + waveX;
        p.y = p.originY + waveY;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${pulse * 0.5})`;
        ctx.fill();
      }

      animId = requestAnimationFrame(draw);
    }

    window.addEventListener('resize', resize);
    resize();
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-0"
    />
  );
}
