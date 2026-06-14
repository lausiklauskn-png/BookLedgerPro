// src/ui/mycelCanvas.js
// Dezenter, animierter Mycel-Hintergrund (driftende Knoten + feine Fäden).
// Bewusst ADDITIV gedacht (Browser-Lehre 8: keine cursor-Tricks, kein cursor:none).
// Respektiert prefers-reduced-motion (dann ein statisches Bild, keine Animation).
// Self-stopping: sobald das Canvas aus dem DOM entfernt ist, endet die rAF-Schleife.

export function createMycelBackground({ count = 26 } = {}) {
  const canvas = document.createElement('canvas');
  canvas.className = 'mycel-bg';
  canvas.setAttribute('aria-hidden', 'true');
  const ctx = canvas.getContext('2d');
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let nodes = [];
  let w = 0, h = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);

  function resize() {
    const r = canvas.getBoundingClientRect();
    w = Math.max(1, r.width); h = Math.max(1, r.height);
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function seed() {
    nodes = Array.from({ length: count }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.12, vy: (Math.random() - 0.5) * 0.12,
      r: 1 + Math.random() * 1.6,
    }));
  }

  function accent() {
    return getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#0f766e';
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    const col = accent();
    // Fäden zwischen nahen Knoten
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const d = Math.hypot(dx, dy);
        if (d < 130) {
          ctx.globalAlpha = 0.10 * (1 - d / 130);
          ctx.strokeStyle = col;
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }
    }
    // Knoten
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = col;
    for (const n of nodes) {
      ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function step() {
    if (!document.body.contains(canvas)) return; // self-stop bei Entfernen aus DOM
    for (const n of nodes) {
      n.x += n.vx; n.y += n.vy;
      if (n.x < 0 || n.x > w) n.vx *= -1;
      if (n.y < 0 || n.y > h) n.vy *= -1;
    }
    draw();
    requestAnimationFrame(step);
  }

  // Initialisierung nach dem Einhängen (Maße erst dann bekannt).
  requestAnimationFrame(() => {
    resize(); seed(); draw();
    if (!reduce) requestAnimationFrame(step);
  });
  window.addEventListener('resize', () => { resize(); seed(); draw(); });

  return canvas;
}
