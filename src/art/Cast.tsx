import React from 'react';
import { interpolate } from 'remotion';
import { C, SHADOW_SM } from '../theme';

/* ------------------------------------------------------------------ tones --- */
export const SKIN = '#EFC59E';
export const SKIN_SHADE = '#E0AC82';
export const HAIR_DARK = '#2B2622';
export const HAIR_WARM = '#5B3A28';
export const SUIT = '#2E4A5A';
export const SUIT_LIGHT = '#3D6478';
export const HOODIE = '#F2CA6B';

export type Eyes = 'open' | 'wide' | 'narrow' | 'closed' | 'happy' | 'spiral';
export type Brows = 'neutral' | 'raised' | 'angry' | 'worried';
export type Mouth = 'smile' | 'flat' | 'grimace' | 'o' | 'smirk' | 'laugh' | 'talk';

/* ------------------------------------------------------------------ face --- */
const Eye: React.FC<{
  x: number;
  y: number;
  variant: Eyes;
  look: number;
  blink: number;
}> = ({ x, y, variant, look, blink }) => {
  const lid = blink > 0.5 ? 0.08 : 1;
  if (variant === 'closed') {
    return <path d={`M${x - 11} ${y} q11 9 22 0`} fill="none" stroke={C.ink} strokeWidth={4.5} strokeLinecap="round" />;
  }
  if (variant === 'happy') {
    return <path d={`M${x - 11} ${y + 3} q11 -13 22 0`} fill="none" stroke={C.ink} strokeWidth={4.5} strokeLinecap="round" />;
  }
  const rx = variant === 'wide' ? 12 : 9.5;
  const ry = (variant === 'wide' ? 13 : variant === 'narrow' ? 7 : 11) * lid;
  const pr = variant === 'wide' ? 5 : 4.4;
  return (
    <g>
      <ellipse cx={x} cy={y} rx={rx} ry={Math.max(ry, 1)} fill={C.white} stroke={C.ink} strokeWidth={3.4} />
      {lid > 0.5 && (
        <circle cx={x + look * 3.4} cy={y + (variant === 'narrow' ? 1 : 1.6)} r={pr} fill={C.ink} />
      )}
      {variant === 'narrow' && (
        <path d={`M${x - 12} ${y - 5} L${x + 12} ${y - 8}`} stroke={C.ink} strokeWidth={4.5} strokeLinecap="round" />
      )}
    </g>
  );
};

const Brow: React.FC<{ x: number; y: number; variant: Brows; flip: boolean }> = ({ x, y, variant, flip }) => {
  const d =
    variant === 'raised'
      ? `M${x - 13} ${y - 4} q13 -9 26 -2`
      : variant === 'angry'
        ? `M${x - 13} ${y + 4} q13 -10 26 2`
        : variant === 'worried'
          ? `M${x - 13} ${y - 2} q13 6 26 -4`
          : `M${x - 13} ${y} q13 -5 26 0`;
  return (
    <path
      d={d}
      fill="none"
      stroke={C.ink}
      strokeWidth={5}
      strokeLinecap="round"
      transform={flip ? `scale(-1,1) translate(${-x * 2},0)` : undefined}
    />
  );
};

const MouthShape: React.FC<{ variant: Mouth; talk: number }> = ({ variant, talk }) => {
  const open = variant === 'talk' ? 3 + talk * 12 : 0;
  if (variant === 'laugh') {
    return (
      <g>
        <path d="M104 147 q16 24 32 0 q-16 10 -32 0 Z" fill={C.ink} />
        <path d="M110 155 q10 9 20 0" fill="none" stroke={C.red} strokeWidth={4.5} strokeLinecap="round" />
      </g>
    );
  }
  if (variant === 'o' || (variant === 'talk' && talk > 0.15)) {
    return <ellipse cx={120} cy={153} rx={7.5} ry={3.6 + open * 0.5} fill={C.ink} />;
  }
  if (variant === 'grimace') {
    return (
      <path
        d="M104 152 q16 9 32 0"
        fill="none"
        stroke={C.ink}
        strokeWidth={4.5}
        strokeLinecap="round"
        transform="rotate(180 120 154)"
      />
    );
  }
  if (variant === 'flat') return <path d="M106 153 h28" stroke={C.ink} strokeWidth={4.5} strokeLinecap="round" />;
  if (variant === 'smirk') return <path d="M104 150 q16 13 32 -4" fill="none" stroke={C.ink} strokeWidth={4.5} strokeLinecap="round" />;
  return <path d="M102 147 q18 17 36 0" fill="none" stroke={C.ink} strokeWidth={4.5} strokeLinecap="round" />;
};

/* ------------------------------------------------------------- character --- */
export type CharProps = {
  /** 0 = neutral. */
  x?: number;
  y?: number;
  size?: number;
  pose?: 'sit' | 'stand';
  outfit?: 'suit' | 'hoodie';
  eyes?: Eyes;
  brows?: Brows;
  mouth?: Mouth;
  talk?: number;
  look?: number;
  blink?: number;
  headTilt?: number;
  bodyRot?: number;
  armL?: number;
  armR?: number;
  /** vertical squash, 1 = neutral */
  squash?: number;
  lean?: number;
  accent?: string;
  style?: React.CSSProperties;
};

export const Character: React.FC<CharProps> = ({
  x = 0,
  y = 0,
  size = 420,
  pose = 'sit',
  outfit = 'suit',
  eyes = 'open',
  brows = 'neutral',
  mouth = 'smile',
  talk = 0,
  look = 0,
  blink = 0,
  headTilt = 0,
  bodyRot = 0,
  armL = 0,
  armR = 0,
  squash = 1,
  lean = 0,
  accent,
  style,
}) => {
  const isSuit = outfit === 'suit';
  const shirt = isSuit ? SUIT : HOODIE;
  const shirtShade = isSuit ? SUIT_LIGHT : '#E0B457';
  const w = 240;
  const h = 440;
  // cartoon proportions: big head, short legs, hands as mitts
  const hipY = pose === 'sit' ? 292 : 300;
  const shoulderY = 214;
  return (
    <svg
      width={size}
      height={size * (h / w)}
      viewBox={`0 0 ${w} ${h}`}
      style={{ overflow: 'visible', position: 'absolute', left: x, top: y, ...style }}
      shapeRendering="geometricPrecision"
    >
      <g
        transform={`translate(120 ${pose === 'sit' ? 402 : 418}) scale(1 ${squash}) translate(-120 ${pose === 'sit' ? -402 : -418})`}
      >
        <g transform={`rotate(${bodyRot + lean} 120 320)`}>
          {/* ------------------------------------------------ chair (seated) --- */}
          {pose === 'sit' && (
            <g>
              <rect x={52} y={272} width={150} height={20} rx={8} fill={C.mustard} stroke={C.ink} strokeWidth={7} />
              <rect x={40} y={196} width={24} height={86} rx={11} fill={C.mustard} stroke={C.ink} strokeWidth={7} />
              <path d="M62 292 L54 384" stroke={C.ink} strokeWidth={11} strokeLinecap="round" />
              <path d="M192 292 L200 384" stroke={C.ink} strokeWidth={11} strokeLinecap="round" />
            </g>
          )}

          {/* ------------------------------------------------ legs --- */}
          {pose === 'sit' ? (
            <g>
              <path d={`M104 ${hipY} q-10 40 4 62`} fill="none" stroke={C.ink} strokeWidth={26} strokeLinecap="round" />
              <path d={`M140 ${hipY} q10 40 -4 62`} fill="none" stroke={C.ink} strokeWidth={26} strokeLinecap="round" />
              <ellipse cx={92} cy={368} rx={27} ry={14} fill={C.ink} />
              <ellipse cx={150} cy={368} rx={27} ry={14} fill={C.ink} />
            </g>
          ) : (
            <g>
              <path d={`M106 ${hipY} l-5 96`} fill="none" stroke={C.ink} strokeWidth={26} strokeLinecap="round" />
              <path d={`M138 ${hipY} l5 96`} fill="none" stroke={C.ink} strokeWidth={26} strokeLinecap="round" />
              <ellipse cx={94} cy={404} rx={28} ry={14} fill={C.ink} />
              <ellipse cx={150} cy={404} rx={28} ry={14} fill={C.ink} />
            </g>
          )}

          {/* ------------------------------------------------ back arm --- */}
          <g transform={`rotate(${armL} 88 ${shoulderY})`}>
            <path
              d={`M88 ${shoulderY} q-22 30 -18 54`}
              fill="none"
              stroke={C.ink}
              strokeWidth={19}
              strokeLinecap="round"
            />
            <circle cx={68} cy={shoulderY + 62} r={13} fill={SKIN} stroke={C.ink} strokeWidth={6} />
          </g>

          {/* ------------------------------------------------ neck + torso --- */}
          <path d="M104 158 l0 62 l32 0 l0 -62 Z" fill={SKIN_SHADE} stroke={C.ink} strokeWidth={6} strokeLinejoin="round" />
          <path
            d={`M86 ${shoulderY} q-11 44 -3 62 l0 20 q4 12 12 12 l50 0 q8 0 12 -12 l0 -20 q8 -18 -3 -62 q-16 -14 -34 -14 q-18 0 -34 14 Z`}
            fill={shirt}
            stroke={C.ink}
            strokeWidth={7}
            strokeLinejoin="round"
          />
          {/* soft inner shade */}
          <path d={`M99 ${shoulderY + 14} q-7 40 -2 56 l10 0 q-6 -32 -2 -56 Z`} fill={shirtShade} opacity={0.7} />

          {isSuit ? (
            <g>
              <path d="M120 208 l-17 24 l17 26 l17 -26 Z" fill={C.white} stroke={C.ink} strokeWidth={5} strokeLinejoin="round" />
              <path d="M120 234 l-7 46 l14 0 Z" fill={C.red} stroke={C.ink} strokeWidth={4.5} strokeLinejoin="round" />
              <path d="M120 206 l-19 26" fill="none" stroke={C.ink} strokeWidth={4.5} />
              <path d="M120 206 l19 26" fill="none" stroke={C.ink} strokeWidth={4.5} />
            </g>
          ) : (
            <g>
              <path d="M104 214 q16 14 32 0" fill="none" stroke={C.ink} strokeWidth={5.5} />
              <path d="M105 232 q-5 14 1 22" fill="none" stroke={C.ink} strokeWidth={4.5} />
              <path d="M135 232 q5 14 -1 22" fill="none" stroke={C.ink} strokeWidth={4.5} />
              <path d="M92 286 h56" stroke={C.ink} strokeWidth={5} opacity={0.35} />
            </g>
          )}

          {/* ------------------------------------------------ front arm --- */}
          <g transform={`rotate(${armR} 152 ${shoulderY})`}>
            <path
              d={`M152 ${shoulderY} q24 26 22 52`}
              fill="none"
              stroke={shirt}
              strokeWidth={20}
              strokeLinecap="round"
            />
            <path
              d={`M152 ${shoulderY} q24 26 22 52`}
              fill="none"
              stroke={C.ink}
              strokeWidth={4}
              strokeLinecap="round"
              opacity={0.22}
            />
            <ellipse cx={176} cy={shoulderY + 62} rx={14} ry={13} fill={SKIN} stroke={C.ink} strokeWidth={6} />
          </g>

          {/* ------------------------------------------------ head --- */}
          <g transform={`rotate(${headTilt} 120 118)`}>
            {/* ears */}
            <ellipse cx={60} cy={112} rx={11} ry={14} fill={SKIN} stroke={C.ink} strokeWidth={6} />
            <ellipse cx={180} cy={112} rx={11} ry={14} fill={SKIN} stroke={C.ink} strokeWidth={6} />
            {/* cranium */}
            <path
              d="M120 26
                 q-58 0 -62 62
                 q-2 26 4 42
                 q7 20 22 28
                 q14 8 36 8
                 q22 0 36 -8
                 q15 -8 22 -28
                 q6 -16 4 -42
                 q-4 -62 -62 -62 Z"
              fill={SKIN}
              stroke={C.ink}
              strokeWidth={7}
              strokeLinejoin="round"
            />
            {/* hair */}
            {isSuit ? (
              <path
                d="M58 84 q-8 -56 62 -58 q70 2 62 58 q-16 -24 -34 -26 q-8 12 -30 14 q-24 2 -60 12 Z"
                fill={HAIR_DARK}
                stroke={C.ink}
                strokeWidth={6}
                strokeLinejoin="round"
              />
            ) : (
              <g>
                <path
                  d="M56 96 q-8 -68 64 -70 q72 2 64 70 q-12 -34 -32 -34 q-6 14 -26 16 q-26 2 -70 18 Z"
                  fill={HAIR_WARM}
                  stroke={C.ink}
                  strokeWidth={6}
                  strokeLinejoin="round"
                />
                <path d="M146 34 q22 10 24 34" fill="none" stroke={C.ink} strokeWidth={4.5} />
                <path d="M96 30 q-12 8 -14 22" fill="none" stroke={C.ink} strokeWidth={4.5} />
              </g>
            )}
            {/* face */}
            <Brow x={98} y={98} variant={brows} flip />
            <Brow x={142} y={98} variant={brows} flip={false} />
            <Eye x={99} y={116} variant={eyes} look={look} blink={blink} />
            <Eye x={141} y={116} variant={eyes} look={look} blink={blink} />
            <ellipse cx={76} cy={140} rx={12} ry={6.5} fill={C.salmon} opacity={0.45} />
            <ellipse cx={164} cy={140} rx={12} ry={6.5} fill={C.salmon} opacity={0.45} />
            <path d="M120 128 q-8 14 3 16" fill="none" stroke={C.ink} strokeWidth={4.5} strokeLinecap="round" opacity={0.7} />
            <MouthShape variant={mouth} talk={talk} />
            {accent && <circle cx={166} cy={70} r={5} fill={accent} />}
          </g>
        </g>
      </g>
    </svg>
  );
};


export const Sunburst: React.FC<{
  cx: number;
  cy: number;
  r: number;
  rotate?: number;
  color?: string;
  rays?: number;
  opacity?: number;
}> = ({ cx, cy, r, rotate = 0, color = C.tealLight, rays = 22, opacity = 1 }) => (
  <svg width={1920} height={1080} style={{ position: 'absolute', left: 0, top: 0, opacity }}>
    <g transform={`rotate(${rotate} ${cx} ${cy})`}>
      {Array.from({ length: rays }).map((_, i) => {
        const a0 = (i / rays) * Math.PI * 2;
        const a1 = ((i + 0.55) / rays) * Math.PI * 2;
        return (
          <path
            key={i}
            d={`M${cx} ${cy} L${cx + Math.cos(a0) * r} ${cy + Math.sin(a0) * r} L${cx + Math.cos(a1) * r} ${cy + Math.sin(a1) * r} Z`}
            fill={color}
            opacity={0.6}
          />
        );
      })}
    </g>
  </svg>
);

export const Halftone: React.FC<{ color?: string; opacity?: number; gap?: number; r?: number }> = ({
  color = C.ink,
  opacity = 0.14,
  gap = 18,
  r = 3.4,
}) => (
  <svg width={1920} height={1080} style={{ position: 'absolute', left: 0, top: 0, opacity }}>
    <defs>
      <pattern id="ht" width={gap} height={gap} patternUnits="userSpaceOnUse">
        <circle cx={gap / 2} cy={gap / 2} r={r} fill={color} />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#ht)" />
  </svg>
);

export const SpeedLines: React.FC<{ x: number; y: number; w?: number; h?: number; n?: number; p?: number; flip?: boolean }> = ({
  x,
  y,
  w = 420,
  h = 420,
  n = 9,
  p = 1,
  flip = false,
}) => (
  <svg width={w} height={h} style={{ position: 'absolute', left: x, top: y, opacity: p, transform: flip ? 'scaleX(-1)' : undefined }}>
    {Array.from({ length: n }).map((_, i) => {
      const t = i / (n - 1);
      const yy = 30 + t * (h - 60);
      const len = (0.45 + 0.55 * Math.abs(Math.sin(i * 2.1))) * w * p;
      return (
        <line
          key={i}
          x1={w - len}
          y1={yy}
          x2={w}
          y2={yy}
          stroke={C.ink}
          strokeWidth={3 + (i % 3) * 2}
          strokeLinecap="round"
          opacity={0.5}
        />
      );
    })}
  </svg>
);

/* ------------------------------------------------------- kinetic typography --- */
export const Impact: React.FC<{
  text: string;
  x: number;
  y: number;
  size?: number;
  color?: string;
  stroke?: string;
  rotate?: number;
  /** 0..1 */
  p?: number;
  align?: 'left' | 'center' | 'right';
  font?: string;
  letter?: number;
  shadow?: boolean;
  style?: React.CSSProperties;
}> = ({
  text,
  x,
  y,
  size = 160,
  color = C.ink,
  stroke,
  rotate = 0,
  p = 1,
  align = 'left',
  letter = -1,
  shadow = false,
  style,
}) => {
  const s = interpolate(p, [0, 0.55, 0.8, 1], [1.75, 0.94, 1.03, 1]);
  const o = interpolate(p, [0, 0.18, 1], [0, 1, 1]);
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: `rotate(${rotate}deg) scale(${s})`,
        transformOrigin: align === 'center' ? '50% 50%' : 'left center',
        opacity: o,
        fontFamily: '"Comic Neue", "Comic Sans MS", cursive',
        fontWeight: 700,
        fontStyle: 'italic',
        fontSize: size,
        letterSpacing: letter,
        lineHeight: 0.92,
        color,
        whiteSpace: 'pre',
        textAlign: align,
        width: align === 'center' ? '100%' : undefined,
        marginLeft: align === 'center' ? -x : 0,
        WebkitTextStroke: stroke ? `${size * 0.045}px ${stroke}` : undefined,
        paintOrder: 'stroke fill',
        textShadow: shadow ? `6px 7px 0 ${C.ink}` : undefined,
        ...style,
      }}
    >
      {text}
    </div>
  );
};

export const Slab: React.FC<{
  children: React.ReactNode;
  x: number;
  y: number;
  bg?: string;
  color?: string;
  p?: number;
  rotate?: number;
  size?: number;
  pad?: string;
}> = ({ children, x, y, bg = C.ink, color = C.white, p = 1, rotate = -2, size = 54, pad = '10px 26px' }) => (
  <div
    style={{
      position: 'absolute',
      left: x,
      top: y,
      transform: `rotate(${rotate}deg) scale(${interpolate(p, [0, 0.6, 1], [0.6, 1.06, 1])})`,
      opacity: p,
      background: bg,
      color,
      fontFamily: '"Comic Neue", cursive',
      fontWeight: 700,
      fontStyle: 'italic',
      fontSize: size,
      padding: pad,
      boxShadow: SHADOW_SM,
      whiteSpace: 'nowrap',
    }}
  >
    {children}
  </div>
);

/** Torn paper edge used for the big scene transitions. */
export const TornEdge: React.FC<{ p: number; color?: string; from?: 'left' | 'right' | 'top' }> = ({
  p,
  color = C.paper,
  from = 'left',
}) => {
  if (p <= 0) return null;
  const teeth = 26;
  const pts: string[] = [];
  for (let i = 0; i <= teeth; i++) {
    const t = i / teeth;
    const yy = t * 1080;
    const jag = i % 2 === 0 ? 0 : 26 + ((i * 37) % 22);
    pts.push(`${(1 - p) * 2100 + jag},${yy}`);
  }
  const path = `M${from === 'right' ? 2100 : -100} 0 L${pts.join(' L')} L${from === 'right' ? 2100 : -100} 1080 Z`;
  return (
    <svg width={1920} height={1080} style={{ position: 'absolute', left: 0, top: 0 }}>
      <path d={path} fill={color} />
    </svg>
  );
};
