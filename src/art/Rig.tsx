import React from 'react';
import { C } from '../theme';

/* ---------------------------------------------------------------------------
 * Rig — "kartun panggung" sendi rig, port of the Bang Motion joint hierarchy.
 * Local units: feet at y = 0, hip at -214, neck at -160... but re-proportioned
 * for a cartoon head (bigger) so the figure reads at 1080p.
 *
 * Hierarchy (all rotations are around the joint's own origin):
 *   root (hip 0,0)
 *   ├─ thigh ±26,-214 → shin +102 → foot +96
 *   ├─ torso 0,-214 : body -152..+8
 *   │   ├─ arm (drawn BEFORE body)  ±50,-126 → fore +78 → hand +74
 *   │   ├─ arm (drawn AFTER body)
 *   │   └─ head 0,-160 : chin at the joint, overlaps 14px into the neck
 * ------------------------------------------------------------------------- */

export const SKIN = '#D19A6E';
export const SKIN_DARK = '#B8814F';

export type Expr = 'happy' | 'calm' | 'worried' | 'shock' | 'smug' | 'flat';

export const SIDES = ['L', 'R'] as const;
export type Side = (typeof SIDES)[number];

/** darken a hex by factor (Bang Motion's sh()) */
export const sh = (hex: string, f: number) => {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.round(((n >> 16) & 255) * f);
  const g = Math.round(((n >> 8) & 255) * f);
  const b = Math.round((n & 255) * f);
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
};

/* --------------------------------------------------------------- the head --- */
/** Flat vector head, no outline, chin at local (0,0). ~150 wide / 190 tall. */
export const Head: React.FC<{
  expr: Expr;
  blink?: number; // 0..1
  hair?: 'short' | 'wave' | 'curl' | 'bald';
  hairColor?: string;
  glasses?: boolean;
  talk?: number; // 0..1 mouth open
  tilt?: number;
  skin?: string;
}> = ({ expr, blink = 0, hair = 'short', hairColor = C.ink, glasses = false, talk = 0, skin = SKIN }) => {
  const eyeY = -86;
  const open = Math.max(0.08, (1 - blink) * (expr === 'shock' ? 1.5 : expr === 'smug' ? 0.55 : 1));
  const eyeR = expr === 'shock' ? 11 : 8.5;
  const mouth = () => {
    if (talk > 0.12 || expr === 'shock')
      return <ellipse cx={0} cy={-42} rx={13} ry={7 + talk * 11} fill={C.ink} />;
    if (expr === 'worried') return <path d="M-18 -36 Q0 -48 18 -36" stroke={C.ink} strokeWidth={6} fill="none" strokeLinecap="round" />;
    if (expr === 'flat') return <path d="M-16 -42 L16 -42" stroke={C.ink} strokeWidth={6} fill="none" strokeLinecap="round" />;
    if (expr === 'smug') return <path d="M-17 -46 Q2 -32 19 -44" stroke={C.ink} strokeWidth={6} fill="none" strokeLinecap="round" />;
    if (expr === 'happy') return <path d="M-20 -48 Q0 -26 20 -48" stroke={C.ink} strokeWidth={7} fill="none" strokeLinecap="round" />;
    return <path d="M-16 -44 Q0 -33 16 -44" stroke={C.ink} strokeWidth={6} fill="none" strokeLinecap="round" />;
  };

  return (
    <g>
      {/* ears */}
      <ellipse cx={-73} cy={-70} rx={13} ry={19} fill={skin} />
      <ellipse cx={73} cy={-70} rx={13} ry={19} fill={skin} />
      {/* skull: rounded, slightly wider at the cheeks */}
      <path
        d="M-76 -118 C-76 -178 76 -178 76 -118 L74 -66 C74 -10 -74 -10 -74 -66 Z"
        fill={skin}
      />
      {/* jaw shading */}
      <path d="M-74 -66 C-74 -10 74 -10 74 -66 Z" fill={SKIN_DARK} opacity={0.16} />
      {/* hair */}
      {hair !== 'bald' && (
        <path
          d={
            hair === 'curl'
              ? 'M-78 -108 C-84 -186 82 -192 76 -106 C70 -140 40 -150 20 -146 C30 -128 -6 -126 -20 -134 C-40 -140 -62 -132 -70 -104 Z'
              : hair === 'wave'
                ? 'M-78 -110 C-82 -182 84 -188 76 -108 C62 -140 26 -150 4 -142 C-14 -132 -50 -136 -70 -104 Z'
                : 'M-77 -114 C-79 -180 79 -184 77 -112 C64 -140 30 -146 8 -140 C-12 -132 -56 -138 -77 -114 Z'
          }
          fill={hairColor}
        />
      )}
      {/* brows */}
      <path
        d={expr === 'worried' ? 'M-40 -108 Q-28 -118 -16 -110' : expr === 'shock' ? 'M-40 -114 Q-28 -124 -16 -116' : 'M-40 -106 Q-28 -113 -16 -108'}
        stroke={C.ink}
        strokeWidth={5}
        fill="none"
        strokeLinecap="round"
      />
      <path
        d={expr === 'worried' ? 'M-16 -110 Q-4 -118 8 -108' : expr === 'shock' ? 'M-16 -116 Q-4 -124 8 -114' : 'M-16 -108 Q-4 -113 8 -106'}
        stroke={C.ink}
        strokeWidth={5}
        fill="none"
        strokeLinecap="round"
        transform="translate(32 0)"
      />
      {/* eyes: solid dots (style law) with a squashed-ellipse blink */}
      <ellipse cx={-28} cy={eyeY} rx={eyeR} ry={eyeR * open} fill={C.ink} />
      <ellipse cx={28} cy={eyeY} rx={eyeR} ry={eyeR * open} fill={C.ink} />
      {glasses && (
        <g stroke={C.ink} strokeWidth={4} fill="none">
          <circle cx={-28} cy={eyeY} r={19} />
          <circle cx={28} cy={eyeY} r={19} />
          <path d="M-9 -86 L9 -86" />
        </g>
      )}
      {/* cheeks */}
      <ellipse cx={-48} cy={-52} rx={13} ry={8} fill="#E0714F" opacity={0.28} />
      <ellipse cx={48} cy={-52} rx={13} ry={8} fill="#E0714F" opacity={0.28} />
      {mouth()}
    </g>
  );
};

/* ------------------------------------------------------------ the hand --- */
/* ------------------------------------------------------------ the figure --- */
export type Look = {
  shirt?: string;
  pants?: string;
  shoes?: string;
  hair?: 'short' | 'wave' | 'curl' | 'bald';
  hairColor?: string;
  glasses?: boolean;
  tie?: boolean;
  apron?: boolean;
  skin?: string;
};

/* ---------------------------------------------------------------------------
 * Character — SVG group with joints exposed as <g> refs, driven by frame props.
 * All angles in degrees. Deterministic: pure props → pure markup.
 * ------------------------------------------------------------------------- */
export type Pose = {
  thighL?: number;
  thighR?: number;
  shinL?: number;
  shinR?: number;
  armL?: number;
  armR?: number;
  foreL?: number;
  foreR?: number;
  torso?: number;
  head?: number;
  lean?: number;
  bob?: number;
};

export const Character: React.FC<{
  x: number;
  ground: number;
  scale?: number;
  pose?: Pose;
  expr?: Expr;
  blink?: number;
  talk?: number;
  look?: Look;
  /** draw order stays fixed; back arm is behind the body */
}> = ({ x, ground, scale = 1, pose = {}, expr = 'calm', blink = 0, talk = 0, look = {} }) => {
  const {
    thighL = 0,
    thighR = 0,
    shinL = 0,
    shinR = 0,
    armL = 0,
    armR = 0,
    foreL = 0,
    foreR = 0,
    torso = 0,
    head = 0,
    lean = 0,
    bob = 0,
  } = pose;
  const { shirt = C.teal, pants = C.paper, shoes = '#2C2A2E', skin = SKIN } = look;
  const shirtDark = sh(shirt, 0.87);
  const skinDark = sh(skin, 0.9);
  const T = (tx: number, ty: number, r = 0) => `translate(${tx},${ty}) rotate(${r})`;

  const leg = (side: Side, thigh: number, shin: number) => {
    const sx = side === 'L' ? -26 : 26;
    const dk = side === 'R' ? 0.9 : 1;
    return (
      <g transform={T(sx, -214)}>
        <g transform={`rotate(${thigh})`}>
          <rect x={-24} y={0} width={48} height={112} rx={21} fill={sh(pants, dk)} />
          <g transform="translate(0,102)">
            <g transform={`rotate(${shin})`}>
              <rect x={-21} y={0} width={42} height={104} rx={18} fill={sh(pants, dk)} />
              <g transform="translate(0,96)">
                <path d="M-27 -6 Q-27 14 -4 14 L22 14 Q33 14 33 2 L33 -6 Z" fill={sh(shoes, dk)} />
              </g>
            </g>
          </g>
        </g>
      </g>
    );
  };

  const arm = (side: Side, up: number, fore: number, front: boolean) => {
    const s = side === 'L' ? -1 : 1;
    return (
      <g transform={T(50 * s, -126)}>
        <g transform={`rotate(${up})`}>
          <rect x={-17} y={-12} width={34} height={92} rx={16} fill={front ? shirt : shirtDark} />
          <g transform="translate(0,72)">
            <g transform={`rotate(${fore})`}>
              <rect x={-14} y={-10} width={28} height={80} rx={13} fill={front ? skin : skinDark} />
              <g transform="translate(0,66)">
                <ellipse cx={0} cy={8} rx={16} ry={19} fill={front ? skin : skinDark} />
              </g>
            </g>
          </g>
        </g>
      </g>
    );
  };

  return (
    <g transform={`translate(${x},${ground + bob}) scale(${scale})`}>
      <ellipse cx={0} cy={8} rx={78} ry={16} fill={C.ink} opacity={0.13} />
      <g transform={`rotate(${lean})`}>
        {leg('L', thighL, shinL)}
        {leg('R', thighR, shinR)}
        <g transform={T(0, -214)}>
          <g transform={`rotate(${torso})`}>
            {/* back arm */}
            {arm('R', armR, foreR, false)}
            {/* body */}
            <path
              d="M-50 -152 C-66 -144 -72 -112 -68 -76 L-60 8 C-30 22 30 22 60 8 L68 -76 C72 -112 60 -144 46 -152 Z"
              fill={shirt}
            />
            <path d="M46 -146 C64 -130 68 -100 64 -62 L57 8 L34 12 L40 -140 Z" fill={shirtDark} />
            {/* neck + collar */}
            <rect x={-16} y={-176} width={32} height={34} rx={12} fill={skinDark} />
            {look.tie ? (
              <g>
                <path d="M-22 -152 L0 -136 L22 -152 L22 -128 L0 -112 L-22 -128 Z" fill={C.paper} />
                <path d="M0 -128 L-8 -96 L8 -96 Z" fill={C.red} />
              </g>
            ) : (
              <path d="M-24 -152 Q0 -136 24 -152 L24 -140 Q0 -124 -24 -140 Z" fill={sh(collarColor(look), 0.94)} />
            )}
            {/* belt */}
            <rect x={-62} y={-4} width={124} height={22} rx={9} fill={sh(shirt, 0.78)} />
            {/* front arm */}
            {arm('L', armL, foreL, true)}
            {/* head */}
            <g transform="translate(0,-160)">
              <g transform={`rotate(${head})`}>
                <g transform="translate(0,0)">
                  <g transform="scale(0.94)">
                    <Head expr={expr} blink={blink} talk={talk} hair={look.hair} hairColor={look.hairColor} glasses={look.glasses} skin={skin} />
                  </g>
                </g>
              </g>
            </g>
          </g>
        </g>
      </g>
    </g>
  );
};

const collarColor = (look: Look) => look.shirt ?? C.teal;

/* ------------------------------------------------------------- props --- */
export const CoffeeCup: React.FC<{ x: number; y: number; s?: number; tilt?: number; steam?: number }> = ({
  x,
  y,
  s = 1,
  tilt = 0,
  steam = 0,
}) => (
  <g transform={`translate(${x},${y}) rotate(${tilt}) scale(${s})`}>
    <path d="M-34 -76 L34 -76 L28 0 Q0 8 -28 0 Z" fill={C.paper} />
    <path d="M-30 -64 L30 -64 L26 0 Q0 6 -26 0 Z" fill="#8A5A3B" opacity={0.9} transform="translate(0 -6)" />
    <ellipse cx={0} cy={-76} rx={34} ry={9} fill="#6B4B33" />
    <path d="M34 -62 Q56 -58 52 -36 Q48 -18 30 -20" stroke={C.paper} strokeWidth={9} fill="none" />
    {[0, 1, 2].map((i) => (
      <ellipse
        key={i}
        cx={-12 + i * 12}
        cy={-96 - (steam * 40 + i * 10)}
        rx={9}
        ry={13}
        fill={C.white}
        opacity={0.55 - i * 0.12}
      />
    ))}
  </g>
);

export const Desk: React.FC<{ x: number; y: number; w: number; h?: number; color?: string }> = ({
  x,
  y,
  w,
  h = 22,
  color = C.mustard,
}) => (
  <g>
    <rect x={x} y={y} width={w} height={h} rx={6} fill={color} />
    <rect x={x} y={y + h} width={w} height={12} rx={4} fill={sh(color, 0.82)} />
    <rect x={x + 40} y={y + h + 12} width={16} height={180} fill={sh(color, 0.72)} />
    <rect x={x + w - 56} y={y + h + 12} width={16} height={180} fill={sh(color, 0.72)} />
  </g>
);

export const Window: React.FC<{ x: number; y: number; w: number; h: number; shift?: number }> = ({
  x,
  y,
  w,
  h,
  shift = 0,
}) => (
  <g>
    <rect x={x} y={y} width={w} height={h} rx={10} fill="#BFDCE0" />
    <rect x={x} y={y} width={w} height={h} rx={10} fill="#FFF3DC" opacity={0.25} />
    {/* blinds, drifting so the light is never dead */}
    {Array.from({ length: 9 }).map((_, i) => (
      <rect
        key={i}
        x={x}
        y={y + 12 + i * (h / 9)}
        width={w}
        height={10}
        fill={C.white}
        opacity={0.75}
        transform={`translate(${shift * (i % 2 ? 1 : -0.6)},0)`}
      />
    ))}
  </g>
);
