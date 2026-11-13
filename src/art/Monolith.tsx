import React from 'react';

/**
 * The v2 cast: no humans.
 *
 * A candidate is a monolith — four blocks stacked in a column, with a small
 * face plate near the top. That is the whole character. It reads in one glance
 * at any size, animates with pure transforms, and never looks like clip-art
 * because there is nothing to draw badly.
 *
 * A = perfectly stacked. B = the same blocks, one of them knocked askew. The
 * audience gets the difference before a single word is spoken.
 */

export type MonoMood = 'flat' | 'smile' | 'smug' | 'worry' | 'shock' | 'deflect';

export type MonoProps = {
  x: number;
  y: number;            // ground line
  scale?: number;
  color: string;
  accent: string;
  /** 0 = dead straight, 1 = fully askew */
  askew?: number;
  /** which block carries the tilt; 2 is the chest block */
  askewIndex?: number;
  /** 0..1 mouth opening, driven by the VO envelope */
  talk?: number;
  mood?: MonoMood;
  /** 0..1 blink progress (1 = closed) */
  blink?: number;
  /** 0..1, how much a second block slides out */
  slide?: number;
  opacity?: number;
  /** extra per-block vertical bounce, in px */
  bounce?: number;
  /** 0..1 tiny idle drift so it never looks frozen */
  idle?: number;
};

const BLOCKS = [
  { w: 96, h: 34 },   // plinth
  { w: 124, h: 78 },  // body
  { w: 138, h: 84 },  // chest / shoulders
  { w: 112, h: 72 },  // head block
];

const MONO_H = BLOCKS.reduce((a, b) => a + b.h, 0);

/** Deterministic per-frame wobble; no Math.random so renders are reproducible. */
const wob = (t: number, seed: number) => Math.sin(t * 2.1 + seed * 1.7) * Math.cos(t * 1.3 + seed);

export const Monolith: React.FC<MonoProps> = ({
  x,
  y,
  scale = 1,
  color,
  accent,
  askew = 0,
  askewIndex = 2,
  talk = 0,
  mood = 'flat',
  blink = 0,
  slide = 0,
  opacity = 1,
  bounce = 0,
  idle = 1,
}) => {
  // stack bottom-up: the head block is the topmost, the plinth the lowest
  const tops = BLOCKS.map((_, i) => -BLOCKS.slice(0, i + 1).reduce((a, b) => a + b.h, 0));
  const drawn = BLOCKS.map((b, i) => {
    const top = tops[i];
    const isHead = i === 3;
    const tilt = i === askewIndex ? askew * 7.5 : askew * 1.2 * (i / 3);
    const nudge = i === askewIndex ? askew * 26 * slide : 0;
    const breathe = Math.sin(i * 0.9) * bounce * (1 + i * 0.12);
    const drift = wob(idle, i) * 1.6;
    return { ...b, i, top, isHead, tilt, nudge, dy: breathe + drift };
  });

  const headTop = tops[3];
  const eyeY = headTop + 30;
  const mouthY = headTop + 54;

  return (
    <g transform={`translate(${x},${y}) scale(${scale})`} opacity={opacity}>
      {/* contact shadow keeps it planted */}
      <ellipse cx={0} cy={2} rx={104 + askew * 16} ry={15} fill="#000" opacity={0.13} />

      {drawn.map((b) => (
        <g key={b.i} transform={`translate(${b.nudge},${b.top + b.dy}) rotate(${b.tilt} 0 ${b.h / 2})`}>
          <rect
            x={-b.w / 2}
            y={0}
            width={b.w}
            height={b.h}
            rx={b.isHead ? 12 : 4}
            fill={b.i === 3 ? accent : color}
          />
          {/* one honest highlight per block: a flat lighter stripe, not a bevel */}
          <rect x={-b.w / 2 + 7} y={6} width={b.w - 14} height={5} rx={2.5} fill="#FFF" opacity={0.16} />
        </g>
      ))}

      {/* face plate sits inside the head block so it tilts with it */}
      <g transform={`translate(0,${eyeY}) rotate(${askew * 12} 0 10)`}>
        <Eye cx={-24} blink={blink} mood={mood} />
        <Eye cx={24} blink={blink} mood={mood} />
      </g>

      {/* the mouth is a slot that opens: the only "talking" cue, so it is loud */}
      <g transform={`translate(0,${mouthY})`}>
        <rect
          x={-26}
          y={-5 - talk * 4}
          width={52}
          height={10 + talk * 26}
          rx={5 + talk * 6}
          fill="#1B1B1B"
        />
        {talk > 0.08 && (
          <rect x={-18} y={2} width={36} height={4 + talk * 8} rx={3} fill="#F2CA6B" opacity={0.85} />
        )}
      </g>
    </g>
  );
};

const Eye: React.FC<{ cx: number; blink: number; mood: MonoMood }> = ({ cx, blink, mood }) => {
  const h = Math.max(2, 20 * (1 - blink));
  const tilt = mood === 'smug' ? -10 : mood === 'worry' ? 12 : mood === 'shock' ? 0 : 0;
  return (
    <g transform={`translate(${cx},0) rotate(${tilt})`}>
      <ellipse cx={0} cy={0} rx={9} ry={h / 2} fill="#1B1B1B" />
      {mood === 'shock' && <circle cx={0} cy={0} r={13} fill="none" stroke="#1B1B1B" strokeWidth={4} />}
    </g>
  );
};

/**
 * The talking body. One big figure, built from the same blocks but at hero
 * scale, with a hand that can point at whatever the line is about.
 * This is the figure the camera can push into.
 */
export const Talker: React.FC<{
  x: number;
  y: number;
  scale?: number;
  talk?: number;
  blink?: number;
  mood?: MonoMood;
  /** -1 .. 1 aiming of the pointing hand */
  point?: number;
  pointUp?: number;
  color?: string;
  accent?: string;
  leanX?: number;
  idle?: number;
}> = ({
  x,
  y,
  scale = 1,
  talk = 0,
  blink = 0,
  mood = 'smile',
  point = 0,
  pointUp = 0,
  color = '#2E4A5A',
  accent = '#8BB8B8',
  leanX = 0,
  idle = 1,
}) => (
  <g transform={`translate(${x},${y}) scale(${scale})`}>
    <ellipse cx={0} cy={2} rx={120} ry={16} fill="#000" opacity={0.13} />
    <g transform={`translate(${leanX},0)`}>
      {/* plinth */}
      <rect x={-74} y={-30} width={148} height={30} rx={4} fill={color} />
      {/* body */}
      <rect x={-86} y={-186} width={172} height={158} rx={6} fill={color} />
      <rect x={-79} y={-180} width={158} height={6} rx={3} fill="#FFF" opacity={0.16} />
      {/* head, a rounded slab that leans with the line */}
      <g transform={`translate(${wob(idle, 3) * 2},0) rotate(${mood === 'smug' ? -3 : 0})`}>
        <rect x={-66} y={-292} width={132} height={112} rx={14} fill={accent} />
        <rect x={-57} y={-284} width={114} height={6} rx={3} fill="#FFF" opacity={0.2} />
        <g transform="translate(0,-246)">
          <Eye cx={-28} blink={blink} mood={mood} />
          <Eye cx={28} blink={blink} mood={mood} />
        </g>
        <g transform="translate(0,-212)">
          <rect x={-32} y={-5 - talk * 5} width={64} height={12 + talk * 30} rx={6 + talk * 7} fill="#1B1B1B" />
          {talk > 0.08 && <rect x={-22} y={3} width={44} height={5 + talk * 10} rx={4} fill="#F2CA6B" opacity={0.85} />}
        </g>
      </g>
      {/* the pointing arm: a two-segment limb with a real pivot at the shoulder */}
      <g transform={`translate(${78 + point * 6},-172) rotate(${-18 - point * 46})`}>
        <rect x={0} y={-9} width={74} height={18} rx={9} fill={color} />
        <g transform={`translate(72,0) rotate(${pointUp * 34})`}>
          <rect x={0} y={-8} width={62} height={16} rx={8} fill={accent} />
          <circle cx={66} cy={0} r={15} fill={accent} />
        </g>
      </g>
    </g>
  </g>
);

export const MONO_HEIGHT = MONO_H;
