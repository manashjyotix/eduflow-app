"use client"

/**
 * WeatherScene3D — animated, glossy "3D" SVG weather scenes.
 * Replaces flat single-color icons with live, looping animations:
 * spinning sun rays, drifting clouds, falling rain/snow, lightning flashes.
 * Pure SVG + CSS keyframes — no external assets, no API key.
 */

export type WeatherCondition =
  | "clear" | "partly-cloudy" | "cloudy" | "rain" | "snow" | "fog" | "storm"

const KEYFRAMES = `
@keyframes ws-spin   { to { transform: rotate(360deg); } }
@keyframes ws-drift  { 0%,100% { transform: translateX(-1.5px); } 50% { transform: translateX(1.5px); } }
@keyframes ws-bob    { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-1.5px); } }
@keyframes ws-fall   { 0% { transform: translateY(-3px); opacity: 0; } 30% { opacity: 1; } 100% { transform: translateY(7px); opacity: 0; } }
@keyframes ws-flash  { 0%,40%,60%,100% { opacity: 0.15; } 45%,55% { opacity: 1; } }
@keyframes ws-pulse  { 0%,100% { opacity: 0.85; } 50% { opacity: 0.35; } }
`

function Defs() {
  return (
    <defs>
      <radialGradient id="ws-sun" cx="50%" cy="40%" r="60%">
        <stop offset="0%" stopColor="#FFE27A" />
        <stop offset="60%" stopColor="#FFC53D" />
        <stop offset="100%" stopColor="#FF9500" />
      </radialGradient>
      <linearGradient id="ws-cloud" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="100%" stopColor="#CFD8E3" />
      </linearGradient>
      <linearGradient id="ws-cloud-dark" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#B9C2CE" />
        <stop offset="100%" stopColor="#8893A2" />
      </linearGradient>
      <linearGradient id="ws-drop" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#7FC8FF" />
        <stop offset="100%" stopColor="#1E88E5" />
      </linearGradient>
    </defs>
  )
}

function Sun({ x = 18, y = 18, r = 9 }: { x?: number; y?: number; r?: number }) {
  return (
    <g>
      <g style={{ transformOrigin: `${x}px ${y}px`, animation: "ws-spin 18s linear infinite" }}>
        {Array.from({ length: 8 }).map((_, i) => {
          const a = (i * Math.PI) / 4
          const x1 = x + Math.cos(a) * (r + 2)
          const y1 = y + Math.sin(a) * (r + 2)
          const x2 = x + Math.cos(a) * (r + 6)
          const y2 = y + Math.sin(a) * (r + 6)
          return (
            <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
              stroke="#FFC53D" strokeWidth={2} strokeLinecap="round" />
          )
        })}
      </g>
      <circle cx={x} cy={y} r={r} fill="url(#ws-sun)" />
      <circle cx={x - r * 0.3} cy={y - r * 0.3} r={r * 0.35} fill="#FFFFFF" opacity={0.35} />
    </g>
  )
}

function Cloud({ x = 0, y = 0, dark = false, animate = "ws-drift" }: { x?: number; y?: number; dark?: boolean; animate?: string }) {
  return (
    <g style={{ transform: `translate(${x}px,${y}px)`, animation: `${animate} 5s ease-in-out infinite` }}>
      <ellipse cx="20" cy="26" rx="15" ry="9" fill={dark ? "url(#ws-cloud-dark)" : "url(#ws-cloud)"} />
      <circle cx="13" cy="22" r="7" fill={dark ? "url(#ws-cloud-dark)" : "url(#ws-cloud)"} />
      <circle cx="24" cy="19" r="9" fill={dark ? "url(#ws-cloud-dark)" : "url(#ws-cloud)"} />
      <ellipse cx="20" cy="27" rx="15" ry="6" fill="#FFFFFF" opacity={0.25} />
    </g>
  )
}

function Drops({ snow = false }: { snow?: boolean }) {
  return (
    <g>
      {[10, 20, 30].map((cx, i) => (
        snow ? (
          <circle key={i} cx={cx} cy={32} r={2} fill="#E8F4FF"
            style={{ animation: `ws-fall 1.4s linear ${i * 0.35}s infinite` }} />
        ) : (
          <line key={i} x1={cx} y1={30} x2={cx} y2={35} stroke="url(#ws-drop)" strokeWidth={2.2} strokeLinecap="round"
            style={{ animation: `ws-fall 1s linear ${i * 0.3}s infinite` }} />
        )
      ))}
    </g>
  )
}

export function WeatherScene3D({ condition, className }: { condition: WeatherCondition; className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} role="img" aria-label={condition}>
      <style>{KEYFRAMES}</style>
      <Defs />

      {condition === "clear" && <Sun x={20} y={20} r={10} />}

      {condition === "partly-cloudy" && (
        <>
          <Sun x={26} y={14} r={7} />
          <Cloud x={-2} y={8} />
        </>
      )}

      {condition === "cloudy" && (
        <>
          <Cloud x={2} y={2} dark animate="ws-bob" />
          <Cloud x={6} y={9} />
        </>
      )}

      {condition === "rain" && (
        <>
          <Cloud x={0} y={0} dark />
          <Drops />
        </>
      )}

      {condition === "snow" && (
        <>
          <Cloud x={0} y={0} />
          <Drops snow />
        </>
      )}

      {condition === "fog" && (
        <>
          <Cloud x={0} y={-2} />
          {[30, 34, 38].map((y, i) => (
            <line key={i} x1={6} y1={y} x2={34} y2={y} stroke="#B9C2CE" strokeWidth={2.4} strokeLinecap="round"
              style={{ animation: `ws-drift 3s ease-in-out ${i * 0.4}s infinite` }} />
          ))}
        </>
      )}

      {condition === "storm" && (
        <>
          <Cloud x={0} y={0} dark />
          <polygon points="20,28 16,36 20,36 17,42 26,33 21,33 24,28"
            fill="#FFD60A" style={{ animation: "ws-flash 2.2s ease-in-out infinite" }} />
          <Drops />
        </>
      )}
    </svg>
  )
}
