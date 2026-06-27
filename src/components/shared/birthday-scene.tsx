"use client"

/**
 * Birthday 3D scenes — glossy, animated SVG icons for the Birthday Wish card.
 * Pure SVG + scoped CSS keyframes (no external assets), matching the style of
 * `WeatherScene3D`.
 *
 *  • Cake3D — a birthday cake with a single lit candle. Only the flame is
 *    animated (flicker + glow); the cake body is static (no "dancing").
 *  • Gift3D — a brand-blue wrapped gift box with a bouncy squash-and-stretch,
 *    a lid "pop", and twinkling sparkles (inspired by the blue gift-box Lottie,
 *    recoloured to the EduFlow brand).
 */

const KEYFRAMES = `
@keyframes bs-flicker {
  0%,100% { transform: scale(1,1) translateY(0);      opacity: 1; }
  25%     { transform: scale(0.9,1.08) translateY(-0.3px); opacity: 0.95; }
  50%     { transform: scale(1.06,0.94) translateY(0.2px); opacity: 0.9; }
  75%     { transform: scale(0.95,1.04) translateY(-0.2px); opacity: 0.97; }
}
@keyframes bs-glow  { 0%,100% { opacity: 0.4; } 50% { opacity: 0.8; } }

/* Lottie-style gift: bounce in with squash & stretch, then settle. */
@keyframes bs-bounce {
  0%,100% { transform: translateY(0)     scale(1, 1); }
  18%     { transform: translateY(-3.5px) scale(0.96, 1.06); }
  40%     { transform: translateY(0)     scale(1.09, 0.91); }
  58%     { transform: translateY(-1.2px) scale(0.98, 1.02); }
  78%     { transform: translateY(0)     scale(1.01, 0.99); }
}
@keyframes bs-lid {
  0%,100% { transform: translateY(0)   rotate(0deg); }
  18%     { transform: translateY(-4px) rotate(-3deg); }
  40%     { transform: translateY(0)   rotate(0deg); }
}
@keyframes bs-twinkle {
  0%,100% { opacity: 0; transform: scale(0.3); }
  50%     { opacity: 1; transform: scale(1); }
}
@media (prefers-reduced-motion: reduce) {
  .bs-flame, .bs-glow, .bs-bounce-g, .bs-lid-g, .bs-twinkle { animation: none !important; }
}
`

export function Cake3D({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} role="img" aria-label="Birthday cake">
      <style>{KEYFRAMES}</style>
      <defs>
        <linearGradient id="bs-cake-base" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3399FF" />
          <stop offset="100%" stopColor="#0062CC" />
        </linearGradient>
        <linearGradient id="bs-cake-top" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#66B2FF" />
          <stop offset="100%" stopColor="#007AFF" />
        </linearGradient>
        <linearGradient id="bs-frost" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#EAF3FF" />
        </linearGradient>
        <radialGradient id="bs-flame-g" cx="50%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#FFF7C2" />
          <stop offset="45%" stopColor="#FFD60A" />
          <stop offset="100%" stopColor="#FF7A00" />
        </radialGradient>
        <radialGradient id="bs-halo" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFE27A" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#FFE27A" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* plate */}
      <ellipse cx="20" cy="35.5" rx="15" ry="2.6" fill="#007AFF" opacity="0.2" />
      <rect x="6" y="32" width="28" height="3.2" rx="1.6" fill="#B9D8FF" />

      {/* bottom tier */}
      <rect x="8" y="22" width="24" height="11" rx="3" fill="url(#bs-cake-base)" />
      {/* frosting drip on bottom tier */}
      <path d="M8 24 q3 4 6 0 q3 4 6 0 q3 4 6 0 q3 4 6 0 V22 H8 Z" fill="url(#bs-frost)" />

      {/* top tier */}
      <rect x="12" y="14.5" width="16" height="8.5" rx="2.5" fill="url(#bs-cake-top)" />
      <path d="M12 16 q2 3 4 0 q2 3 4 0 q2 3 4 0 q2 3 4 0 V14.5 H12 Z" fill="url(#bs-frost)" />

      {/* sprinkles */}
      <circle cx="14" cy="28" r="1" fill="#FFD60A" />
      <circle cx="20" cy="29.5" r="1" fill="#34C759" />
      <circle cx="26" cy="27.5" r="1" fill="#FF3B30" />
      <circle cx="17" cy="20" r="0.9" fill="#FFD60A" />
      <circle cx="23" cy="19.5" r="0.9" fill="#32ADE6" />

      {/* candle */}
      <rect x="19" y="8.5" width="2.2" height="6.5" rx="1.1" fill="#FFFFFF" />
      <rect x="19.7" y="8.5" width="0.8" height="6.5" fill="#B9D8FF" />
      <rect x="19.4" y="6.5" width="1.2" height="2.4" rx="0.6" fill="#3F3F46" />

      {/* candle glow + flame */}
      <circle className="bs-glow" cx="20" cy="4" r="6" fill="url(#bs-halo)"
        style={{ animation: "bs-glow 1.4s ease-in-out infinite" }} />
      <g className="bs-flame" style={{ transformOrigin: "20px 6px", animation: "bs-flicker 0.9s ease-in-out infinite" }}>
        <path d="M20 -0.5 C23 3.5 23.5 6.5 20 8.5 C16.5 6.5 17 3.5 20 -0.5 Z" fill="url(#bs-flame-g)" />
        <path d="M20 2.5 C21.4 4.5 21.6 6 20 7.5 C18.4 6 18.6 4.5 20 2.5 Z" fill="#FFF3B0" opacity="0.9" />
      </g>
    </svg>
  )
}

/** A small 4-point sparkle star. */
function Sparkle({ x, y, r, delay, color }: { x: number; y: number; r: number; delay: string; color: string }) {
  return (
    <path
      className="bs-twinkle"
      d={`M${x} ${y - r} L${x + r * 0.3} ${y - r * 0.3} L${x + r} ${y} L${x + r * 0.3} ${y + r * 0.3} L${x} ${y + r} L${x - r * 0.3} ${y + r * 0.3} L${x - r} ${y} L${x - r * 0.3} ${y - r * 0.3} Z`}
      fill={color}
      style={{ transformOrigin: `${x}px ${y}px`, animation: `bs-twinkle 1.6s ease-in-out ${delay} infinite` }}
    />
  )
}

export function Gift3D({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} role="img" aria-label="Gift">
      <style>{KEYFRAMES}</style>
      <defs>
        {/* EduFlow brand blue (#007AFF) — box body + lid */}
        <linearGradient id="bs-box-front" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3399FF" />
          <stop offset="100%" stopColor="#0062CC" />
        </linearGradient>
        <linearGradient id="bs-box-top" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#66B2FF" />
          <stop offset="100%" stopColor="#007AFF" />
        </linearGradient>
        <linearGradient id="bs-gift-ribbon" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#EAF3FF" />
          <stop offset="100%" stopColor="#B9D8FF" />
        </linearGradient>
      </defs>

      {/* shadow */}
      <ellipse cx="24" cy="44.5" rx="15" ry="3" fill="#007AFF" opacity="0.18" />

      {/* twinkling sparkles */}
      <Sparkle x={8}  y={14} r={3}   delay="0s"   color="#FFD60A" />
      <Sparkle x={41} y={12} r={3.4} delay="0.5s" color="#7FC0FF" />
      <Sparkle x={43} y={30} r={2.6} delay="1s"   color="#FFD60A" />

      <g className="bs-bounce-g" style={{ transformOrigin: "24px 40px", animation: "bs-bounce 2.4s ease-in-out infinite" }}>
        {/* box body */}
        <rect x="12" y="23" width="24" height="16" rx="2.5" fill="url(#bs-box-front)" />
        {/* vertical ribbon on body */}
        <rect x="21.5" y="23" width="5" height="16" fill="url(#bs-gift-ribbon)" />

        {/* lid + bow group (extra pop) */}
        <g className="bs-lid-g" style={{ transformOrigin: "24px 23px", animation: "bs-lid 2.4s ease-in-out infinite" }}>
          <rect x="9" y="16.5" width="30" height="8" rx="2.5" fill="url(#bs-box-top)" />
          <rect x="9" y="18.6" width="30" height="3.4" fill="url(#bs-gift-ribbon)" />
          {/* shine */}
          <rect x="12" y="18" width="8" height="2" rx="1" fill="#FFFFFF" opacity="0.55" />
          {/* bow */}
          <path d="M24 16.5 C20 9 12.5 9.5 15 14.5 C16.2 17 21 16.7 24 16.5 Z" fill="url(#bs-gift-ribbon)" />
          <path d="M24 16.5 C28 9 35.5 9.5 33 14.5 C31.8 17 27 16.7 24 16.5 Z" fill="url(#bs-gift-ribbon)" />
          <circle cx="24" cy="15.8" r="2.6" fill="#EAF3FF" stroke="#7FC0FF" strokeWidth="0.6" />
        </g>
      </g>
    </svg>
  )
}
