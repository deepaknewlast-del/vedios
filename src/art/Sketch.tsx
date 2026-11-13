import React from 'react';
import { C, FONT_HEAD, FONT_MONO } from '../theme';

/* ---------------------------------------------------------------- gears --- */
export const Gear: React.FC<{
  size?: number;
  color?: string;
  rotate?: number;
  teeth?: number;
  style?: React.CSSProperties;
}> = ({ size = 96, color = C.teal, rotate = 0, teeth = 8, style }) => {
  const r = size / 2;
  const tw = size * 0.16;
  const th = size * 0.22;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={style}>
      <g transform={`translate(${r} ${r}) rotate(${rotate})`}>
        {Array.from({ length: teeth }).map((_, i) => (
          <rect
            key={i}
            x={-tw / 2}
            y={-r + 2}
            width={tw}
            height={th}
            rx={2}
            fill={color}
            stroke={C.ink}
            strokeWidth={4}
            transform={`rotate(${(i * 360) / teeth})`}
          />
        ))}
        <circle cx={0} cy={0} r={r * 0.76} fill={color} stroke={C.ink} strokeWidth={5} />
        <circle cx={0} cy={0} r={r * 0.3} fill={C.paper} stroke={C.ink} strokeWidth={5} />
      </g>
    </svg>
  );
};

/* ------------------------------------------------------------- sparkles --- */
export const Sparkle: React.FC<{
  size?: number;
  color?: string;
  pop?: number;
  rotate?: number;
  style?: React.CSSProperties;
}> = ({ size = 44, color = C.mustard, pop = 1, rotate = 0, style }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    style={{
      transform: `rotate(${rotate}deg) scale(${Math.max(0, pop)})`,
      opacity: Math.max(0, Math.min(1, pop)),
      ...style,
    }}
  >
    <path
      d="M50 3 C57 31 69 43 97 50 C69 57 57 69 50 97 C43 69 31 57 3 50 C31 43 43 31 50 3 Z"
      fill={color}
      stroke={C.ink}
      strokeWidth={6}
      strokeLinejoin="round"
    />
  </svg>
);

export const Star: React.FC<{ size?: number; color?: string; rotate?: number; pop?: number }> = ({
  size = 46,
  color = C.mustard,
  rotate = 0,
  pop = 1,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    style={{ transform: `rotate(${rotate}deg) scale(${Math.max(0, pop)})`, opacity: Math.max(0, Math.min(1, pop)) }}
  >
    <path
      d="M50 4 L61 37 L96 38 L68 59 L78 92 L50 72 L22 92 L32 59 L4 38 L39 37 Z"
      fill={color}
      stroke={C.ink}
      strokeWidth={6}
      strokeLinejoin="round"
    />
  </svg>
);

/** Radiating burst used behind the VS badge. */
export const Burst: React.FC<{ size?: number; color?: string; spikes?: number; spin?: number }> = ({
  size = 190,
  color = C.mustard,
  spikes = 14,
  spin = 0,
}) => (
  <svg width={size} height={size} viewBox="0 0 200 200" style={{ transform: `rotate(${spin}deg)` }}>
    <g>
      {Array.from({ length: spikes }).map((_, i) => {
        const a = (i * 360) / spikes;
        return (
          <path
            key={i}
            d="M100 6 L112 92 L100 100 L88 92 Z"
            fill={color}
            stroke={C.ink}
            strokeWidth={4}
            transform={`rotate(${a} 100 100)`}
          />
        );
      })}
      <circle cx={100} cy={100} r={62} fill={color} stroke={C.ink} strokeWidth={6} />
    </g>
  </svg>
);

/* ---------------------------------------------------------------- arrows --- */
export const SketchArrow: React.FC<{
  w?: number;
  color?: string;
  rotate?: number;
  flip?: boolean;
  style?: React.CSSProperties;
}> = ({ w = 200, color = C.mustard, rotate = 0, flip = false, style }) => (
  <svg
    width={w}
    height={w * 0.42}
    viewBox="0 0 200 84"
    style={{ overflow: 'visible', transform: `rotate(${rotate}deg) scaleX(${flip ? -1 : 1})`, ...style }}
  >
    <path
      d="M6 28 C58 22 112 24 146 30 L146 6 L196 42 L146 78 L146 54 C108 60 58 62 6 54 Z"
      fill={color}
      stroke={C.ink}
      strokeWidth={6}
      strokeLinejoin="round"
    />
    <path d="M20 36 C64 32 104 34 132 38" stroke={C.ink} strokeWidth={3} opacity={0.28} strokeLinecap="round" />
  </svg>
);

export const CurvedArrow: React.FC<{
  w?: number;
  h?: number;
  color?: string;
  flipX?: boolean;
  flipY?: boolean;
}> = ({ w = 250, h = 150, color = C.teal, flipX = false, flipY = false }) => (
  <svg
    width={w}
    height={h}
    viewBox="0 0 250 150"
    style={{ overflow: 'visible', transform: `scale(${flipX ? -1 : 1}, ${flipY ? -1 : 1})` }}
  >
    <path
      d="M12 132 C26 62 116 22 196 48"
      fill="none"
      stroke={C.ink}
      strokeWidth={16}
      strokeLinecap="round"
    />
    <path
      d="M12 132 C26 62 116 22 196 48"
      fill="none"
      stroke={color}
      strokeWidth={9}
      strokeLinecap="round"
    />
    <path
      d="M176 18 L232 46 L178 74 Z"
      fill={color}
      stroke={C.ink}
      strokeWidth={5}
      strokeLinejoin="round"
    />
  </svg>
);

/* --------------------------------------------------------------- callout --- */
export const Callout: React.FC<{
  children: React.ReactNode;
  bg?: string;
  dashed?: boolean;
  rotate?: number;
  width?: number;
  style?: React.CSSProperties;
}> = ({ children, bg = C.white, dashed = false, rotate = 0, width, style }) => (
  <div
    style={{
      display: 'inline-block',
      width,
      background: bg,
      border: dashed ? `3px dashed ${C.ink}` : `3px solid ${C.ink}`,
      boxShadow: dashed ? undefined : `4px 4px 0 ${C.ink}`,
      transform: `rotate(${rotate}deg)`,
      padding: '8px 12px',
      fontFamily: FONT_MONO,
      fontWeight: 700,
      fontSize: 14,
      lineHeight: 1.45,
      ...style,
    }}
  >
    {children}
  </div>
);

/** Hand-written annotation with a wobbly underline. */
export const HandLabel: React.FC<{
  children: React.ReactNode;
  size?: number;
  color?: string;
  rotate?: number;
  underline?: boolean;
  style?: React.CSSProperties;
}> = ({ children, size = 26, color = C.ink, rotate = -1.5, underline = true, style }) => (
  <div style={{ transform: `rotate(${rotate}deg)`, display: 'inline-block', ...style }}>
    <div
      style={{
        fontFamily: FONT_HEAD,
        fontWeight: 700,
        fontStyle: 'italic',
        fontSize: size,
        color,
        lineHeight: 1,
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </div>
    {underline && (
      <svg width="100%" height={12} viewBox="0 0 200 12" preserveAspectRatio="none" style={{ display: 'block', marginTop: 2 }}>
        <path
          d="M2 8 C40 2 80 11 120 5 C150 1 175 7 198 4"
          fill="none"
          stroke={color}
          strokeWidth={4}
          strokeLinecap="round"
        />
      </svg>
    )}
  </div>
);

/* --------------------------------------------------------------- doodles --- */
export const Hatch: React.FC<{ w?: number; h?: number; gap?: number; color?: string; style?: React.CSSProperties }> = ({
  w = 120,
  h = 80,
  gap = 9,
  color = C.ink,
  style,
}) => (
  <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ opacity: 0.18, ...style }}>
    {Array.from({ length: Math.ceil((w + h) / gap) }).map((_, i) => (
      <line
        key={i}
        x1={i * gap - h}
        y1={h}
        x2={i * gap}
        y2={0}
        stroke={color}
        strokeWidth={2.5}
      />
    ))}
  </svg>
);

export const QuestionMark: React.FC<{ size?: number; rotate?: number; color?: string; pop?: number }> = ({
  size = 64,
  rotate = 0,
  color = C.ink,
  pop = 1,
}) => (
  <div
    style={{
      fontFamily: FONT_HEAD,
      fontWeight: 700,
      fontStyle: 'italic',
      fontSize: size,
      color,
      lineHeight: 0.8,
      transform: `rotate(${rotate}deg) scale(${Math.max(0, pop)})`,
      opacity: Math.max(0, Math.min(1, pop)),
      textShadow: `3px 3px 0 ${C.mustard}`,
    }}
  >
    ?
  </div>
);

export const BangMark: React.FC<{ size?: number; rotate?: number; color?: string; pop?: number }> = ({
  size = 64,
  rotate = 0,
  color = C.red,
  pop = 1,
}) => (
  <div
    style={{
      fontFamily: FONT_HEAD,
      fontWeight: 700,
      fontSize: size,
      color,
      lineHeight: 0.8,
      transform: `rotate(${rotate}deg) scale(${Math.max(0, pop)})`,
      opacity: Math.max(0, Math.min(1, pop)),
      textShadow: `3px 3px 0 ${C.ink}`,
    }}
  >
    !
  </div>
);

/** Chunky comic panel with an ink title bar (like a textbook figure). */
export const ComicPanel: React.FC<{
  title?: string;
  tag?: string;
  number?: number;
  bg?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
  barColor?: string;
  titleColor?: string;
}> = ({ title, tag, number, bg = C.white, style, children, barColor = C.ink, titleColor = C.white }) => (
  <div
    style={{
      position: 'relative',
      background: bg,
      border: `3px solid ${C.ink}`,
      boxShadow: `5px 5px 0 ${C.ink}`,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      ...style,
    }}
  >
    {(title || number !== undefined) && (
      <div
        style={{
          height: 38,
          flexShrink: 0,
          background: barColor,
          color: titleColor,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '0 12px',
          borderBottom: `3px solid ${C.ink}`,
        }}
      >
        {number !== undefined && (
          <div
            style={{
              width: 24,
              height: 24,
              background: C.white,
              color: C.ink,
              border: `2px solid ${C.ink}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: FONT_MONO,
              fontWeight: 700,
              fontSize: 14,
              flexShrink: 0,
            }}
          >
            {number}
          </div>
        )}
        <div
          style={{
            fontFamily: FONT_HEAD,
            fontWeight: 700,
            fontStyle: 'italic',
            fontSize: 22,
            letterSpacing: 0.2,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {title}
        </div>
        {tag && (
          <div
            style={{
              fontFamily: FONT_MONO,
              fontSize: 12,
              fontWeight: 700,
              opacity: 0.8,
              whiteSpace: 'nowrap',
            }}
          >
            {tag}
          </div>
        )}
      </div>
    )}
    {children}
  </div>
);

export const Wax = {
  ink: C.ink,
  white: C.white,
};
