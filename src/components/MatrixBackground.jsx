import { useEffect, useRef } from 'react';

const NeuralBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let animationFrameId;
    let particles = [];
    let lastFrameTime = 0;
    const TARGET_FPS = 15; // Throttle to 15fps — barely noticeable for a background effect but saves massive CPU
    const FRAME_INTERVAL = 1000 / TARGET_FPS;
    
    // Config — reduced particle count significantly
    const particleCount = 25; // Was 60
    const connectionDistance = 120; // Was 150
    const speed = 0.2; // Was 0.3
    let themeColor = '#64748b';

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      themeColor = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim() || '#64748b';
      initParticles();
    };

    const initParticles = () => {
      particles = [];
      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * speed,
          vy: (Math.random() - 0.5) * speed,
          radius: Math.random() * 1.5 + 0.5
        });
      }
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    const draw = (timestamp) => {
      animationFrameId = requestAnimationFrame(draw);
      
      // Throttle frame rate
      if (timestamp - lastFrameTime < FRAME_INTERVAL) return;
      lastFrameTime = timestamp;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < particleCount; i++) {
        const p = particles[i];

        // Move
        p.x += p.vx;
        p.y += p.vy;

        // Bounce off edges
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        // Draw particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = themeColor;
        ctx.globalAlpha = 0.4;
        ctx.fill();

        // Connect particles — only check nearby (skip most)
        for (let j = i + 1; j < particleCount; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const distSq = dx * dx + dy * dy;

          if (distSq < connectionDistance * connectionDistance) {
            const dist = Math.sqrt(distSq);
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = themeColor;
            ctx.globalAlpha = 0.15 * (1 - dist / connectionDistance);
            ctx.stroke();
          }
        }
      }
      
    };

    animationFrameId = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: -1,
        opacity: 0.15,
        pointerEvents: 'none'
      }}
    />
  );
};

export default NeuralBackground;
