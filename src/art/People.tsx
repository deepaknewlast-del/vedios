import React from 'react';
import { C } from '../theme';

/**
 * Faceless flat-vector characters in the reference's cartoon language:
 * bold ink outlines, one flat accent colour, noodle limbs and props.
 * Nobody has a drawn face — silhouettes and poses only.
 */

type Common = {
  size?: number;
  accent?: string;
  /** 0 = neutral, 1 = fully "posing" */
  pose?: number;
};

const outline = {
  stroke: C.ink,
  strokeWidth: 6,
  strokeLinejoin: 'round' as const,
  strokeLinecap: 'round' as const,
};

/* ------------------------------------------------------------- candidate --- */
/** Seated applicant behind a desk, one hand up mid-answer. */
export const SeatedPerson: React.FC<Common & { lean?: number }> = ({
  size = 300,
  accent = C.mustard,
  pose = 0,
  lean = 0,
}) => {
  const armLift = -18 - pose * 26;
  return (
    <svg width={size} height={size * 1.15} viewBox="0 0 300 345" style={{ overflow: 'visible' }}>
      <g transform={`rotate(${lean} 150 300)`}>
        {/* chair back */}
        <rect x={44} y={168} width={30} height={150} rx={13} fill={C.grey} {...outline} />
        {/* torso */}
        <path
          d="M96 300 C90 226 112 186 150 186 C188 186 210 226 204 300 Z"
          fill={accent}
          {...outline}
        />
        {/* collar + head */}
        <path d="M132 190 L150 214 L168 190" fill={C.white} {...outline} strokeWidth={5} />
        <circle cx={150} cy={146} r={44} fill={C.paper} {...outline} />
        <path d="M108 136 C114 106 186 106 192 136 C186 118 114 118 108 136 Z" fill={C.ink} />
        {/* gesturing arm */}
        <g transform={`rotate(${armLift} 196 224)`}>
          <path d="M196 224 C214 214 224 200 226 186" fill="none" {...outline} strokeWidth={15} />
          <circle cx={228} cy={182} r={12} fill={C.paper} {...outline} strokeWidth={5} />
        </g>
        {/* resting arm */}
        <path d="M104 226 C86 246 84 268 90 288" fill="none" {...outline} strokeWidth={15} />
        <circle cx={92} cy={292} r={12} fill={C.paper} {...outline} strokeWidth={5} />
      </g>
      {/* desk */}
      <rect x={12} y={296} width={276} height={20} rx={6} fill={C.salmon} {...outline} />
      <rect x={34} y={316} width={16} height={28} fill={C.salmon} {...outline} strokeWidth={4} />
      <rect x={250} y={316} width={16} height={28} fill={C.salmon} {...outline} strokeWidth={4} />
    </svg>
  );
};

/* ---------------------------------------------------------------- genius --- */
/** Confident standing figure with a clipboard and a coffee cup. */
export const StandingPerson: React.FC<Common & { spill?: number; armUp?: number }> = ({
  size = 300,
  accent = C.teal,
  pose = 0,
  spill = 0,
  armUp = 0,
}) => {
  const cupAngle = 8 + spill * 78;
  return (
    <svg width={size} height={size * 1.25} viewBox="0 0 300 375" style={{ overflow: 'visible' }}>
      {/* legs */}
      <path d="M132 250 L128 336" fill="none" {...outline} strokeWidth={26} />
      <path d="M170 250 L176 336" fill="none" {...outline} strokeWidth={26} />
      <path d="M104 340 L134 340 M170 340 L200 340" {...outline} strokeWidth={12} />
      {/* torso */}
      <path d="M112 250 C106 186 128 148 151 148 C176 148 196 186 192 250 Z" fill={accent} {...outline} />
      {/* head */}
      <circle cx={151} cy={110} r={40} fill={C.paper} {...outline} />
      <path d="M113 100 C120 74 184 74 190 100 C182 84 120 84 113 100 Z" fill={C.ink} />
      {/* clipboard arm */}
      <g transform={`rotate(${-8 - armUp * 20} 196 176)`}>
        <path d="M196 176 C214 190 222 208 222 224" fill="none" {...outline} strokeWidth={14} />
        <rect x={206} y={216} width={44} height={56} rx={4} fill={C.white} transform="rotate(12 228 244)" {...outline} strokeWidth={5} />
        <path d="M216 234 L240 234 M216 248 L236 248" stroke={C.ink} strokeWidth={4} transform="rotate(12 228 244)" />
      </g>
      {/* coffee arm */}
      <g transform={`rotate(${cupAngle} 104 182)`}>
        <path d="M104 182 C88 196 82 214 82 230" fill="none" {...outline} strokeWidth={14} />
        <g transform="translate(58 214)">
          <path d="M0 8 L46 8 L40 44 L6 44 Z" fill={C.white} {...outline} strokeWidth={5} />
          <ellipse cx={23} cy={8} rx={23} ry={7} fill={C.white} {...outline} strokeWidth={5} />
          <ellipse cx={23} cy={9} rx={16} ry={4} fill={C.salmon} />
          <path d="M46 16 C62 16 62 36 44 36" fill="none" {...outline} strokeWidth={5} />
        </g>
      </g>
      {/* spill puddle appears on cue */}
      {spill > 0.05 && (
        <g opacity={Math.min(1, spill * 1.6)}>
          <ellipse cx={74} cy={330} rx={58 * spill} ry={13 * spill} fill={C.salmon} {...outline} strokeWidth={4} />
          <circle cx={26} cy={300} r={6 * spill} fill={C.salmon} />
          <circle cx={38} cy={282} r={4.5 * spill} fill={C.salmon} />
        </g>
      )}
      {/* impact ticks */}
      <g opacity={spill} stroke={C.ink} strokeWidth={5} strokeLinecap="round">
        <path d="M12 158 L30 170" />
        <path d="M4 186 L26 190" />
        <path d="M18 216 L36 208" />
      </g>
    </svg>
  );
};

/* -------------------------------------------------------------- observers --- */
/** Row of audience silhouettes reacting (used for the likability test). */
export const AudienceRow: React.FC<{
  count?: number;
  width?: number;
  ready?: number;
  color?: string;
}> = ({ count = 5, width = 720, ready = 1, color = C.grey }) => {
  const each = width / count;
  return (
    <svg width={width} height={110} viewBox={`0 0 ${width} 110`} style={{ overflow: 'visible' }}>
      {Array.from({ length: count }).map((_, i) => {
        const wobble = Math.sin((i + 1) * 1.7) * 3;
        const k = Math.max(0, Math.min(1, ready * 1.4 - i * 0.12));
        return (
          <g key={i} transform={`translate(${i * each + each / 2} ${wobble}) scale(${0.82 + k * 0.18})`} opacity={0.45 + k * 0.55}>
            <circle cx={0} cy={26} r={17} fill={C.paper} {...outline} strokeWidth={5} />
            <path d="M-24 96 C-24 62 -12 50 0 50 C12 50 24 62 24 96 Z" fill={color} {...outline} strokeWidth={5} />
          </g>
        );
      })}
    </svg>
  );
};

/* ------------------------------------------------------------------ hands --- */
/** Cartoon hand pointing into a diagram (reference-style pointer). */
export const PointingHand: React.FC<{ size?: number; rotate?: number; flip?: boolean; accent?: string }> = ({
  size = 120,
  rotate = 0,
  flip = false,
  accent = C.paper,
}) => (
  <svg
    width={size}
    height={size * 0.75}
    viewBox="0 0 160 120"
    style={{ overflow: 'visible', transform: `rotate(${rotate}deg) scaleX(${flip ? -1 : 1})` }}
  >
    <path
      d="M96 46 L152 46 C160 46 160 58 152 58 L118 58 L120 74 C122 92 100 96 84 88 L34 62 C26 58 26 44 36 42 Z"
      fill={accent}
      {...outline}
      strokeWidth={5}
    />
    <path d="M64 66 L66 84" stroke={C.ink} strokeWidth={4} opacity={0.35} />
  </svg>
);

/* --------------------------------------------------------------- player A --- */
/** Decision-maker behind the payoff matrix, pen in hand. */
export const JudgeFigure: React.FC<{ size?: number; accent?: string; pulse?: number }> = ({
  size = 240,
  accent = C.teal,
}) => (
  <svg width={size} height={size} viewBox="0 0 240 240" style={{ overflow: 'visible' }}>
    <path d="M62 232 C56 168 78 132 120 132 C162 132 184 168 178 232 Z" fill={accent} {...outline} />
    <circle cx={120} cy={92} r={38} fill={C.paper} {...outline} />
    <path d="M84 84 C90 58 150 58 156 84 C148 70 92 70 84 84 Z" fill={C.ink} />
    <path d="M120 132 L120 176" stroke={C.ink} strokeWidth={4} opacity={0.3} />
    <path d="M150 168 C168 186 176 204 176 218" fill="none" {...outline} strokeWidth={13} />
    <circle cx={178} cy={222} r={10} fill={C.paper} {...outline} strokeWidth={5} />
  </svg>
);
