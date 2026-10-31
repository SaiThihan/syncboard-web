import { useEffect, useRef } from 'react'

interface Teammate {
  name: string
  color: string
  // each cursor drifts around (cx, cy) with these amplitudes and speeds
  cx: number
  cy: number
  ax: number
  ay: number
  fx: number
  fy: number
  phase: number
}

const TEAMMATES: Teammate[] = [
  {
    name: 'Maya Okafor',
    color: '#2E7D52',
    cx: 450,
    cy: 250,
    ax: 120,
    ay: 55,
    fx: 0.0005,
    fy: 0.0007,
    phase: 0,
  },
  {
    name: 'Priya Raman',
    color: '#B33A4C',
    cx: 330,
    cy: 440,
    ax: 90,
    ay: 45,
    fx: 0.0006,
    fy: 0.0005,
    phase: 2,
  },
]

// The start of an animation, as the CSS variable the animation reads.
const delay = (seconds: string) => ({ '--d': seconds }) as React.CSSProperties

const INK = '#1B2230'
const CARD_STROKE = 'rgba(27,34,48,.18)'

// A decorative board (rectangles, arrows, a circle, text and pen strokes) with two
// teammates' cursors drifting around it. It only shows what the app does, so it is
// hidden from screen readers. The animation is skipped with reduced motion.
export default function BoardScene({ className }: { className?: string }) {
  const cursorRefs = useRef<(SVGGElement | null)[]>([])

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const pos = TEAMMATES.map((t) => ({ x: t.cx, y: t.cy }))

    function place(time: number) {
      TEAMMATES.forEach((t, i) => {
        const targetX =
          t.cx + (reduce ? 0 : t.ax * Math.sin(time * t.fx + t.phase))
        const targetY =
          t.cy + (reduce ? 0 : t.ay * Math.sin(time * t.fy + t.phase * 1.7))
        const ease = reduce ? 1 : 0.1
        pos[i].x += (targetX - pos[i].x) * ease
        pos[i].y += (targetY - pos[i].y) * ease
        cursorRefs.current[i]?.setAttribute(
          'transform',
          `translate(${pos[i].x.toFixed(1)} ${pos[i].y.toFixed(1)})`,
        )
      })
    }

    place(0)
    if (reduce) return
    let frame = 0
    function loop(time: number) {
      place(time)
      frame = requestAnimationFrame(loop)
    }
    frame = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(frame)
  }, [])

  return (
    <div
      aria-hidden="true"
      className={`overflow-hidden rounded-[14px] border bg-[#f8fafc] ${className ?? ''}`}
    >
      <svg viewBox="0 0 760 560" className="block w-full">
        <defs>
          <marker
            id="scene-arrow"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto-start-reverse"
          >
            <path d="M1 1 L9 5 L1 9 Z" fill={INK} />
          </marker>
          <pattern
            id="scene-dots"
            width="24"
            height="24"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="2" cy="2" r="1.2" fill="#C5CEDB" />
          </pattern>
        </defs>
        <rect width="760" height="560" fill="url(#scene-dots)" />

        <g className="scene-pop" style={delay('.1s')}>
          <text className="scene-title" x="50" y="62">
            Launch plan
          </text>
        </g>
        <path
          className="scene-pen scene-draw"
          pathLength={1}
          style={delay('.5s')}
          d="M52 78 C130 90 210 70 322 82"
          stroke="#2F5BEA"
          strokeWidth="4"
        />
        <path
          className="scene-pen scene-draw"
          pathLength={1}
          style={delay('1.9s')}
          d="M690 46 L705 14 L720 46 L684 26 L726 26 Z"
          stroke="#2E7D52"
          strokeWidth="3.5"
        />

        <g className="scene-pop" style={delay('.7s')}>
          <g transform="rotate(-2 145 156)">
            <rect
              x="50"
              y="110"
              width="190"
              height="92"
              rx="14"
              fill="#D3EBDD"
              stroke={CARD_STROKE}
            />
            <text className="scene-card-title" x="70" y="150">
              Idea
            </text>
            <text className="scene-card-text" x="70" y="178">
              Sketch the flow
            </text>
          </g>
        </g>
        <g className="scene-pop" style={delay('1s')}>
          <g transform="rotate(1.5 380 141)">
            <rect
              x="285"
              y="95"
              width="190"
              height="92"
              rx="14"
              fill="#F8E4B0"
              stroke={CARD_STROKE}
            />
            <text className="scene-card-title" x="305" y="135">
              Draft
            </text>
            <text className="scene-card-text" x="305" y="163">
              Add the shapes
            </text>
          </g>
        </g>
        <g className="scene-pop" style={delay('1.3s')}>
          <g transform="rotate(-1 615 166)">
            <rect
              x="520"
              y="120"
              width="190"
              height="92"
              rx="14"
              fill="#CBE7EA"
              stroke={CARD_STROKE}
            />
            <text className="scene-card-title" x="540" y="160">
              Review
            </text>
            <text className="scene-card-text" x="540" y="188">
              Try it together
            </text>
          </g>
        </g>

        <g className="scene-pop" style={delay('1.15s')}>
          <path
            d="M242 156 Q262 138 283 142"
            fill="none"
            stroke={INK}
            strokeWidth="2.5"
            strokeLinecap="round"
            markerEnd="url(#scene-arrow)"
          />
        </g>
        <g className="scene-pop" style={delay('1.45s')}>
          <path
            d="M477 141 Q498 136 518 166"
            fill="none"
            stroke={INK}
            strokeWidth="2.5"
            strokeLinecap="round"
            markerEnd="url(#scene-arrow)"
          />
        </g>
        <path
          className="scene-pen scene-draw"
          pathLength={1}
          style={delay('1.7s')}
          d="M512 118 C560 82 700 90 724 150 C738 206 640 238 560 230 C500 222 492 150 538 110"
          stroke="#B33A4C"
          strokeWidth="4"
        />

        <g className="scene-pop" style={delay('2s')}>
          <text className="scene-note" x="60" y="296">
            Ship it on Friday
          </text>
        </g>
        <path
          className="scene-pen scene-draw"
          pathLength={1}
          style={delay('2.4s')}
          d="M60 310 C150 322 260 300 362 312"
          stroke="#8A5A00"
          strokeWidth="4"
        />

        <g className="scene-pop" style={delay('2.2s')}>
          <rect
            x="60"
            y="352"
            width="250"
            height="118"
            rx="14"
            fill="#FBFCFE"
            stroke={CARD_STROKE}
          />
          <text
            className="scene-card-title"
            x="80"
            y="392"
            style={{ fontSize: 18 }}
          >
            Who owns the rollout?
          </text>
          <text className="scene-card-text" x="80" y="424">
            Maya: I can take it
          </text>
          <text className="scene-card-text" x="80" y="450">
            Priya: I will review
          </text>
        </g>
        <g className="scene-pop" style={delay('2.5s')}>
          <path
            d="M312 412 Q352 400 396 398"
            fill="none"
            stroke={INK}
            strokeWidth="2.5"
            strokeLinecap="round"
            markerEnd="url(#scene-arrow)"
          />
        </g>
        <g className="scene-pop" style={delay('2.7s')}>
          <ellipse
            cx="470"
            cy="396"
            rx="72"
            ry="52"
            fill="#FBFCFE"
            stroke={INK}
            strokeWidth="2.5"
          />
          <text
            className="scene-card-title"
            x="470"
            y="403"
            textAnchor="middle"
          >
            Risk
          </text>
        </g>
        <g className="scene-pop" style={delay('2.9s')}>
          <text
            className="scene-card-title"
            x="568"
            y="402"
            style={{ fontSize: 18 }}
          >
            Needs a plan
          </text>
        </g>
        <path
          className="scene-pen scene-draw"
          pathLength={1}
          style={delay('3.2s')}
          d="M566 416 C610 424 650 412 700 420"
          stroke="#19717F"
          strokeWidth="3.5"
        />
        <path
          className="scene-pen scene-draw"
          pathLength={1}
          style={delay('3.4s')}
          d="M540 500 q20 -24 40 0 t40 0 t40 0 t40 0"
          stroke="#19717F"
          strokeWidth="4"
        />

        {TEAMMATES.map((t, i) => (
          <g
            key={t.name}
            ref={(el) => {
              cursorRefs.current[i] = el
            }}
          >
            <path
              d="M2 2 L2 17 L6.5 13 L9.5 20 L12.5 18.7 L9.6 12 L15.5 12 Z"
              fill={t.color}
              stroke="#FBFCFE"
              strokeWidth="1.5"
              strokeLinejoin="round"
              transform="scale(2)"
            />
            <rect
              x="34"
              y="46"
              rx="18"
              ry="18"
              width={t.name.length * 10 + 24}
              height="36"
              fill={t.color}
            />
            <text
              x="46"
              y="71"
              style={{ fill: '#F8FAFC', font: '600 19px var(--font-sans)' }}
            >
              {t.name}
            </text>
          </g>
        ))}
      </svg>
    </div>
  )
}
