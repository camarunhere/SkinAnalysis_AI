import { useEffect, useRef } from "react";

/**
 * Quiet, slow-moving canvas backgrounds — one per page, each shaped around
 * what that page is actually for. Low alpha, slow motion, nothing that
 * competes with the content sitting on top.
 *
 * User-portal variants (warm, cosmetic palette):
 *   hero      — soft skin-tone glow + a slow scanning line (landing)
 *   scan      — a rotating radar/magnifier ring (login/register)
 *   glow      — softly pulsing warm blobs (dashboard)
 *   upload    — particles drifting upward, fading (upload & analyze)
 *   heatmap   — pulsing warm-to-cool thermal blobs (Grad-CAM explanation)
 *   droplets  — drifting serum-droplet circles (product recommendations)
 *   timeline  — a calm trend line with rising dots (analysis history)
 *   rings     — calm concentric rings (profile)
 *
 * Admin-portal variants (cool, control-panel palette):
 *   bars      — slow-rising bar-chart silhouettes (system reports)
 *   grid      — a sparse avatar/user node grid (manage users)
 *   cards     — soft rounded squares drifting (manage products)
 *   circuit   — a quiet AI circuit/node network (monitor AI model)
 */
export default function Background({ variant }) {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas.getContext("2d");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let W, H, dpr, raf;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = canvas.clientWidth;
      H = canvas.clientHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const rand = (a, b) => a + Math.random() * (b - a);
    const state = init(variant);

    function init(v) {
      switch (v) {
        case "grid":
          return { nodes: Array.from({ length: 18 }, () => ({
            x: rand(0, 1), y: rand(0, 1), vx: rand(-0.03, 0.03), vy: rand(-0.03, 0.03), r: rand(1.4, 2.6),
          })) };
        case "circuit":
          return { nodes: Array.from({ length: 20 }, () => ({
            x: rand(0, 1), y: rand(0, 1), vx: rand(-0.04, 0.04), vy: rand(-0.04, 0.04), r: rand(1.2, 2.4),
          })) };
        case "timeline":
          return { dots: Array.from({ length: 12 }, () => ({
            x: rand(0, 1), y: rand(0, 1), v: rand(0.05, 0.14), r: rand(1, 2),
          })) };
        case "upload":
          return { particles: Array.from({ length: 22 }, () => ({
            x: rand(0, 1), y: rand(0, 1), v: rand(0.03, 0.08), r: rand(1.5, 3),
          })) };
        case "droplets":
          return { drops: Array.from({ length: 10 }, () => ({
            x: rand(0, 1), y: rand(0, 1), vx: rand(-0.015, 0.015), r: rand(10, 26), phase: rand(0, Math.PI * 2),
          })) };
        case "cards":
          return { cards: Array.from({ length: 9 }, () => ({
            x: rand(0.05, 0.95), y: rand(0.05, 0.95), vy: rand(0.01, 0.03), s: rand(18, 34), phase: rand(0, Math.PI * 2),
          })) };
        case "bars":
          return { bars: Array.from({ length: 9 }, (_, i) => ({
            x: (i + 0.5) / 9, phase: rand(0, Math.PI * 2),
          })) };
        default:
          return {};
      }
    }

    const draw = (t) => {
      ctx.clearRect(0, 0, W, H);

      if (variant === "hero") {
        const cx = W * 0.78, cy = H * 0.22;
        const pulse = 0.5 + 0.5 * Math.sin(t * 0.0006);
        const r = 230 + pulse * 30;
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
        g.addColorStop(0, `rgba(225,29,72,${0.08 + pulse * 0.04})`);
        g.addColorStop(1, "rgba(225,29,72,0)");
        ctx.fillStyle = g;
        ctx.fillRect(cx - r, cy - r, r * 2, r * 2);

        const cx2 = W * 0.15, cy2 = H * 0.82;
        const pulse2 = 0.5 + 0.5 * Math.sin(t * 0.00045 + 2);
        const r2 = 190 + pulse2 * 24;
        const g2 = ctx.createRadialGradient(cx2, cy2, 0, cx2, cy2, r2);
        g2.addColorStop(0, `rgba(217,119,6,${0.07 + pulse2 * 0.03})`);
        g2.addColorStop(1, "rgba(217,119,6,0)");
        ctx.fillStyle = g2;
        ctx.fillRect(cx2 - r2, cy2 - r2, r2 * 2, r2 * 2);

        const scanY = ((t * 0.00004) % 1) * H;
        ctx.strokeStyle = "rgba(225,29,72,0.08)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, scanY);
        ctx.lineTo(W, scanY);
        ctx.stroke();
      }

      if (variant === "scan") {
        const cx = W * 0.5, cy = H * 0.4;
        for (let i = 0; i < 3; i++) {
          const phase = ((t * 0.00035 + i / 3) % 1);
          const r = phase * Math.max(W, H) * 0.55;
          const alpha = (1 - phase) * 0.13;
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(225,29,72,${alpha})`;
          ctx.lineWidth = 2;
          ctx.stroke();
        }
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(t * 0.0002);
        ctx.strokeStyle = "rgba(225,29,72,0.1)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.max(W, H) * 0.4, 0);
        ctx.stroke();
        ctx.restore();
      }

      if (variant === "glow") {
        const cx = W * 0.8, cy = H * 0.25;
        const pulse = 0.5 + 0.5 * Math.sin(t * 0.0007);
        const r = 210 + pulse * 28;
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
        g.addColorStop(0, `rgba(244,63,94,${0.09 + pulse * 0.04})`);
        g.addColorStop(1, "rgba(244,63,94,0)");
        ctx.fillStyle = g;
        ctx.fillRect(cx - r, cy - r, r * 2, r * 2);

        const cx2 = W * 0.12, cy2 = H * 0.85;
        const pulse2 = 0.5 + 0.5 * Math.sin(t * 0.0005 + 2);
        const r2 = 170 + pulse2 * 22;
        const g2 = ctx.createRadialGradient(cx2, cy2, 0, cx2, cy2, r2);
        g2.addColorStop(0, `rgba(245,158,11,${0.08 + pulse2 * 0.04})`);
        g2.addColorStop(1, "rgba(245,158,11,0)");
        ctx.fillStyle = g2;
        ctx.fillRect(cx2 - r2, cy2 - r2, r2 * 2, r2 * 2);
      }

      if (variant === "upload") {
        ctx.fillStyle = "rgba(244,63,94,0.16)";
        for (const p of state.particles) {
          p.y -= p.v / H * 0.6;
          if (p.y < -0.02) { p.y = 1.02; p.x = Math.random(); }
          ctx.beginPath();
          ctx.arc(p.x * W, p.y * H, p.r, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      if (variant === "heatmap") {
        const spots = [
          { x: 0.75, y: 0.2, base: [220, 38, 38] },
          { x: 0.55, y: 0.45, base: [234, 88, 12] },
          { x: 0.2, y: 0.75, base: [245, 158, 11] },
        ];
        for (let i = 0; i < spots.length; i++) {
          const s = spots[i];
          const pulse = 0.5 + 0.5 * Math.sin(t * 0.0006 + i * 2);
          const r = 130 + pulse * 40;
          const cx = W * s.x, cy = H * s.y;
          const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
          g.addColorStop(0, `rgba(${s.base.join(",")},${0.13 + pulse * 0.05})`);
          g.addColorStop(1, `rgba(${s.base.join(",")},0)`);
          ctx.fillStyle = g;
          ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
        }
      }

      if (variant === "droplets") {
        for (const d of state.drops) {
          d.x += d.vx / W;
          if (d.x < -0.05) d.x = 1.05;
          if (d.x > 1.05) d.x = -0.05;
          const wobble = Math.sin(t * 0.0006 + d.phase) * 6;
          ctx.beginPath();
          ctx.arc(d.x * W, d.y * H + wobble, d.r, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(244,114,182,0.10)";
          ctx.fill();
          ctx.beginPath();
          ctx.arc(d.x * W - d.r * 0.3, d.y * H + wobble - d.r * 0.3, d.r * 0.28, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(255,255,255,0.35)";
          ctx.fill();
        }
      }

      if (variant === "timeline") {
        ctx.beginPath();
        for (let x = 0; x <= W; x += 4) {
          const y = H * 0.7 + Math.sin(x * 0.006 + t * 0.0002) * 18;
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.strokeStyle = "rgba(225,29,72,0.13)";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = "rgba(217,119,6,0.14)";
        for (const d of state.dots) {
          d.y -= d.v / H * 0.6;
          if (d.y < -0.02) { d.y = 1.02; d.x = Math.random(); }
          ctx.beginPath();
          ctx.arc(d.x * W, d.y * H, d.r, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      if (variant === "rings") {
        const cx = W * 0.5, cy = H * 0.34;
        for (let i = 0; i < 3; i++) {
          const pulse = 0.5 + 0.5 * Math.sin(t * 0.0005 + i * 1.4);
          const r = 55 + i * 46 + pulse * 8;
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(190,24,93,${0.09 - i * 0.02})`;
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      }

      if (variant === "bars") {
        for (const b of state.bars) {
          const pulse = 0.5 + 0.5 * Math.sin(t * 0.0006 + b.phase);
          const h = H * (0.1 + pulse * 0.22);
          ctx.fillStyle = "rgba(79,70,229,0.08)";
          ctx.fillRect(b.x * W - 14, H - h, 28, h);
        }
      }

      if (variant === "cards") {
        for (const c of state.cards) {
          c.y -= c.vy / H * 0.4;
          if (c.y < -0.05) { c.y = 1.05; c.x = rand(0.05, 0.95); }
          const wobble = Math.sin(t * 0.0005 + c.phase) * 4;
          ctx.save();
          ctx.translate(c.x * W + wobble, c.y * H);
          ctx.rotate(Math.sin(t * 0.0003 + c.phase) * 0.05);
          ctx.strokeStyle = "rgba(71,85,105,0.12)";
          ctx.lineWidth = 1.5;
          ctx.strokeRect(-c.s / 2, -c.s / 2, c.s, c.s);
          ctx.restore();
        }
      }

      if (variant === "grid" || variant === "circuit") {
        const pts = state.nodes;
        const linkDist = variant === "circuit" ? 130 : 150;
        const color = variant === "circuit" ? "79,70,229" : "51,65,85";
        for (const n of pts) {
          n.x += n.vx / W; n.y += n.vy / H;
          if (n.x < 0 || n.x > 1) n.vx *= -1;
          if (n.y < 0 || n.y > 1) n.vy *= -1;
        }
        for (let i = 0; i < pts.length; i++) {
          for (let j = i + 1; j < pts.length; j++) {
            const dx = (pts[i].x - pts[j].x) * W, dy = (pts[i].y - pts[j].y) * H;
            const d = Math.hypot(dx, dy);
            if (d < linkDist) {
              ctx.beginPath();
              ctx.moveTo(pts[i].x * W, pts[i].y * H);
              ctx.lineTo(pts[j].x * W, pts[j].y * H);
              ctx.strokeStyle = `rgba(${color},${0.12 * (1 - d / linkDist)})`;
              ctx.lineWidth = 1;
              ctx.stroke();
            }
          }
        }
        ctx.fillStyle = `rgba(${color},0.24)`;
        for (const n of pts) {
          ctx.beginPath();
          ctx.arc(n.x * W, n.y * H, n.r, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    };

    if (reduced) {
      draw(0);
    } else {
      const loop = (t) => { draw(t); raf = requestAnimationFrame(loop); };
      raf = requestAnimationFrame(loop);
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [variant]);

  return <canvas ref={ref} aria-hidden="true" className="fixed inset-0 w-full h-full pointer-events-none z-0" />;
}

/** Per-variant page tint — soft gradients so the quiet motion still reads clearly. */
export const BG_TINTS = {
  hero: "bg-gradient-to-br from-rose-50 via-orange-50 to-amber-50",
  scan: "bg-gradient-to-br from-rose-50 via-slate-50 to-orange-50",
  glow: "bg-gradient-to-br from-rose-50 via-slate-50 to-amber-50",
  upload: "bg-gradient-to-br from-rose-50 via-slate-50 to-pink-50",
  heatmap: "bg-gradient-to-br from-orange-50 via-slate-50 to-red-50",
  droplets: "bg-gradient-to-br from-pink-50 via-slate-50 to-rose-50",
  timeline: "bg-gradient-to-b from-amber-50 via-slate-50 to-rose-50",
  rings: "bg-gradient-to-br from-slate-50 via-rose-50 to-slate-100",
  bars: "bg-gradient-to-br from-indigo-50 via-slate-50 to-blue-50",
  grid: "bg-gradient-to-br from-slate-50 via-indigo-50 to-slate-100",
  cards: "bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50",
  circuit: "bg-gradient-to-br from-indigo-50 via-slate-50 to-violet-50",
};
