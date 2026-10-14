import type { ContainerKind } from '@/lib/pantry'

// Shelf illustrations: a carboy for batches still in a fermenter, a bottle for
// bottled ones, and the pantry containers ingredients sit in. Outlines and
// glass are fixed; only the liquid/contents colour changes.

const CARBOY_PATH =
  'M48 6h24v34c0 6 4 9 10 13c20 11 32 24 32 44v99c0 12-8 20-20 20H26c-12 0-20-8-20-20V97c0-20 12-33 32-44c6-4 10-7 10-13V6z'
const CARBOY_LIQUID_PATH =
  'M19.9 65.65H100.1C109 74.1 114 84.1 114 97V196c0 12-8 20-20 20H26c-12 0-20-8-20-20V97C6 84.1 11 74.1 19.9 65.65Z'
const BOTTLE_PATH =
  'M28 6h14v60c0 8 6 12 12 18c6 6 10 12 10 22v94c0 8-6 14-14 14H20c-8 0-14-6-14-14V106c0-10 4-16 10-22c6-6 12-10 12-18V6z'
const BOTTLE_LIQUID_PATH =
  'M28 40h14v26c0 8 6 12 12 18c6 6 10 12 10 22v94c0 8-6 14-14 14H20c-8 0-14-6-14-14V106c0-10 4-16 10-22c6-6 12-10 12-18V40z'

const INK = '#21190C'
const HONEY = '#F4B400'
const GHOST_STROKE = '#8A6A3A'
const BUBBLES: [number, number, number][] = [
  [40, 160, 3],
  [58, 128, 2.2],
  [80, 176, 2.6],
  [70, 100, 1.8],
  [90, 140, 2],
]

interface VesselProps {
  color: string
  className?: string
  // Outline width in the drawing's own units; raise it for small thumbnails.
  stroke?: number
  // A dashed, half-filled outline: something that could be here but isn't yet.
  ghost?: boolean
}

export function Carboy({
  color,
  bubbling = false,
  className,
  stroke = 2.5,
  ghost = false,
}: VesselProps & { bubbling?: boolean }) {
  const outline = ghost
    ? { stroke: GHOST_STROKE, strokeWidth: 2, strokeDasharray: '6 5' }
    : { stroke: INK, strokeWidth: stroke }
  return (
    <svg viewBox="0 -44 120 264" className={className} aria-hidden="true">
      <path d={CARBOY_PATH} fill="#FFFFFF" fillOpacity={ghost ? 0.45 : 0.6} />
      <path d={CARBOY_LIQUID_PATH} fill={color} fillOpacity={ghost ? 0.35 : 1} />
      {!ghost && (
        <line x1="21" y1="66.5" x2="99" y2="66.5" stroke="#FFFFFF" strokeOpacity={0.35} strokeWidth={2} />
      )}
      {bubbling &&
        BUBBLES.map(([cx, cy, r]) => (
          <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={r} fill="#FFF3D6" fillOpacity={0.75} />
        ))}
      {!ghost && (
        <path d="M20 112v70" stroke="#FFFFFF" strokeOpacity={0.45} strokeWidth={4} strokeLinecap="round" />
      )}
      <path d={CARBOY_PATH} fill="none" {...outline} />
      {ghost ? (
        <path d="M60 128v36M42 146h36" stroke="#6E4B00" strokeWidth={3.5} strokeLinecap="round" />
      ) : (
        <>
          <rect x="44" y="0" width="32" height="14" rx="3" fill="#8A5300" stroke={INK} strokeWidth={stroke * 0.8} />
          <rect x="56" y="-14" width="8" height="16" fill="#FFFFFF" fillOpacity={0.8} stroke={INK} strokeWidth={stroke * 0.8} />
          <rect x="46" y="-42" width="28" height="30" rx="9" fill="#FFFFFF" fillOpacity={0.8} stroke={INK} strokeWidth={stroke * 0.8} />
          <rect x="50" y="-26" width="20" height="10" rx="3" fill={HONEY} />
        </>
      )}
    </svg>
  )
}

export function PlannedCarboy({ className, label = true }: { className?: string; label?: boolean }) {
  return (
    <svg viewBox="0 -44 120 264" className={className} aria-hidden="true">
      <path d={CARBOY_PATH} fill="#FFFFFF" fillOpacity={0.35} stroke={GHOST_STROKE} strokeWidth={2} strokeDasharray="6 6" />
      {label && (
        <text x="60" y="150" textAnchor="middle" fontSize="11" fontWeight="700" letterSpacing="1.5" fill="#6E5A2A" className="font-sans">
          PLANNED
        </text>
      )}
    </svg>
  )
}

export function Bottle({
  color,
  label,
  sublabel,
  className,
  stroke = 2.5,
  ghost = false,
}: VesselProps & { label?: string; sublabel?: string }) {
  const outline = ghost
    ? { stroke: GHOST_STROKE, strokeWidth: 2, strokeDasharray: '6 5' }
    : { stroke: INK, strokeWidth: stroke }
  return (
    <svg viewBox="0 -8 70 228" className={className} aria-hidden="true">
      <path d={BOTTLE_PATH} fill="#FFFFFF" fillOpacity={ghost ? 0.45 : 0.6} />
      <path d={BOTTLE_LIQUID_PATH} fill={color} fillOpacity={ghost ? 0.35 : 1} />
      {!ghost && (
        <path d="M14 114v78" stroke="#FFFFFF" strokeOpacity={0.5} strokeWidth={3} strokeLinecap="round" />
      )}
      {label != null && !ghost && (
        <>
          <rect x="10" y="128" width="50" height="44" rx="3" fill="#FFF8E6" stroke={INK} strokeWidth={1.5} />
          <text x="35" y="148" textAnchor="middle" fontSize="11" fontWeight="600" fill={INK} className="font-mono">
            {label}
          </text>
          {sublabel && (
            <text x="35" y="163" textAnchor="middle" fontSize="8" letterSpacing="0.5" fill="#6E6150" className="font-sans">
              {sublabel}
            </text>
          )}
        </>
      )}
      <path d={BOTTLE_PATH} fill="none" {...outline} />
      {ghost ? (
        <path d="M35 140v28M21 154h28" stroke="#6E4B00" strokeWidth={3} strokeLinecap="round" />
      ) : (
        <rect x="27" y="-6" width="16" height="14" rx="2" fill="#B98546" stroke={INK} strokeWidth={stroke * 0.8} />
      )}
    </svg>
  )
}

/** A pantry container for an ingredient, drawn in an 80×120 box. */
export function PantryContainer({
  kind,
  fill,
  className,
  stroke = 2.5,
}: {
  kind: ContainerKind
  fill: string
  className?: string
  stroke?: number
}) {
  const ink = { stroke: INK, strokeWidth: stroke }
  return (
    <svg viewBox="0 0 80 120" className={className} aria-hidden="true">
      {kind === 'honey' && (
        <>
          <rect x="10" y="34" width="60" height="84" rx="14" fill="#FFFFFF" fillOpacity={0.6} />
          <path d="M10 52h60v52a14 14 0 0 1-14 14H24a14 14 0 0 1-14-14z" fill={fill} />
          <path d="M18 60v40" stroke="#FFFFFF" strokeOpacity={0.5} strokeWidth={3} strokeLinecap="round" />
          <rect x="10" y="34" width="60" height="84" rx="14" fill="none" {...ink} />
          <rect x="14" y="20" width="52" height="16" rx="4" fill="#8A5300" {...ink} />
          <polygon points="40,70 50.4,76 50.4,88 40,94 29.6,88 29.6,76" fill="#FFF8E6" stroke={INK} strokeWidth={1.5} />
        </>
      )}
      {kind === 'fruit' && (
        <>
          {[
            [22, 62, 9],
            [38, 58, 9],
            [54, 60, 9],
            [30, 46, 9],
            [47, 44, 9],
            [64, 66, 8],
          ].map(([cx, cy, r]) => (
            <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={r} fill={fill} stroke={INK} strokeWidth={stroke * 0.8} />
          ))}
          <path d="M8 66h64l-7 52H15z" fill="#EAD2A0" strokeLinejoin="round" {...ink} />
          <path d="M13 82h54M15 98h50" stroke="#C9A25A" strokeWidth={2} />
        </>
      )}
      {kind === 'jug' && (
        <>
          <path d="M30 16h20v10c0 4 3 6 8 9c9 5 14 12 14 22v47c0 8-6 14-14 14H22c-8 0-14-6-14-14V57c0-10 5-17 14-22c5-3 8-5 8-9z" fill="#FFFFFF" fillOpacity={0.6} />
          <path d="M8 62h64v42c0 8-6 14-14 14H22c-8 0-14-6-14-14z" fill={fill} />
          <path d="M30 16h20v10c0 4 3 6 8 9c9 5 14 12 14 22v47c0 8-6 14-14 14H22c-8 0-14-6-14-14V57c0-10 5-17 14-22c5-3 8-5 8-9z" fill="none" {...ink} />
          <path d="M60 36c11 1 14 18 6 26" fill="none" stroke={INK} strokeWidth={stroke * 1.6} strokeLinecap="round" />
          <rect x="28" y="6" width="24" height="12" rx="3" fill="#8A5300" {...ink} />
        </>
      )}
      {kind === 'spice' && (
        <>
          <rect x="22" y="30" width="36" height="88" rx="8" fill="#FFFFFF" fillOpacity={0.6} />
          <rect x="22" y="62" width="36" height="56" rx="8" fill={fill} />
          <path d="M30 70l6 40M42 66l-4 44M50 72l-2 38" stroke={INK} strokeOpacity={0.25} strokeWidth={2} strokeLinecap="round" />
          <rect x="22" y="30" width="36" height="88" rx="8" fill="none" {...ink} />
          <rect x="24" y="18" width="32" height="14" rx="3" fill="#8A5300" {...ink} />
        </>
      )}
      {kind === 'wood' && (
        <>
          <rect x="12" y="88" width="26" height="26" rx="3" fill="#9C6A35" transform="rotate(-8 25 101)" {...ink} />
          <rect x="42" y="90" width="26" height="26" rx="3" fill="#8A5A2B" transform="rotate(6 55 103)" {...ink} />
          <rect x="27" y="62" width="26" height="26" rx="3" fill="#A8743C" transform="rotate(12 40 75)" {...ink} />
          <path d="M18 98h12M48 100h12M33 72h10" stroke="#5E3A0E" strokeWidth={1.6} strokeLinecap="round" />
        </>
      )}
      {kind === 'sachet' && (
        <>
          <path d="M16 24h48v88a6 6 0 0 1-6 6H22a6 6 0 0 1-6-6z" fill="#F6EFDD" {...ink} />
          <path d="M16 24l4-6 4 6 4-6 4 6 4-6 4 6 4-6 4 6 4-6 4 6 4-6 4 6" fill="none" strokeLinejoin="round" {...ink} />
          <rect x="16" y="56" width="48" height="26" fill="#FFF1C7" stroke={INK} strokeWidth={stroke * 0.75} />
          <polygon points="40,61 46.9,65 46.9,73 40,77 33.1,73 33.1,65" fill="none" stroke="#8A5300" strokeWidth={2} />
        </>
      )}
      {kind === 'packaging' && (
        <g transform="translate(21 2) scale(0.52)">
          <path d={BOTTLE_PATH} fill="#FFFFFF" fillOpacity={0.75} stroke={INK} strokeWidth={stroke * 1.8} />
          <path d="M14 114v78" stroke="#C9A25A" strokeOpacity={0.6} strokeWidth={4} strokeLinecap="round" />
          <rect x="27" y="-6" width="16" height="14" rx="2" fill="#B98546" stroke={INK} strokeWidth={stroke * 1.6} />
        </g>
      )}
      {kind === 'other' && (
        <>
          <path d="M24 40c-10 14-14 38-12 58 1 12 9 20 20 20h16c11 0 19-8 20-20 2-20-2-44-12-58z" fill="#D9BE8A" {...ink} />
          <path d="M28 40c4-8 20-8 24 0" fill="#D9BE8A" {...ink} />
          <path d="M26 42h28" stroke="#8A5300" strokeWidth={4} strokeLinecap="round" />
          <path d="M30 70h20M28 86h24M30 102h20" stroke="#B89A63" strokeWidth={2} strokeLinecap="round" />
        </>
      )}
    </svg>
  )
}
