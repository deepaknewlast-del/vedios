import React from 'react';
import { BORDER, C, FONT_MONO, SHADOW, SHADOW_SM } from '../theme';

type DivProps = React.HTMLAttributes<HTMLDivElement>;

/** The core comic-ink card: 3px ink border + hard 4px 4px 0 drop shadow. */
export const InkPanel: React.FC<
  DivProps & { bg?: string; shadow?: boolean; inset?: number }
> = ({ bg = C.white, shadow = true, inset = 0, style, children, ...rest }) => (
  <div
    {...rest}
    style={{
      position: 'relative',
      backgroundColor: bg,
      border: BORDER,
      boxShadow: shadow ? SHADOW : undefined,
      outline: inset ? `${inset}px solid ${C.paper}` : undefined,
      outlineOffset: -inset - 4,
      ...style,
    }}
  >
    {children}
  </div>
);

/** Black square number badge — [ 1 ], [ 2 ], [ 3 ]. */
export const SquareBadge: React.FC<{ n: number; size?: number }> = ({
  n,
  size = 78,
}) => (
  <div
    style={{
      width: size,
      height: size,
      background: C.ink,
      color: C.white,
      border: `3px solid ${C.ink}`,
      boxShadow: SHADOW,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: FONT_MONO,
      fontWeight: 700,
      fontSize: size * 0.37,
      letterSpacing: -1,
      flexShrink: 0,
    }}
  >
    [&nbsp;{n}&nbsp;]
  </div>
);

/** Space Mono callout tag. */
export const Tag: React.FC<{
  children: React.ReactNode;
  bg?: string;
  color?: string;
  size?: number;
  rotate?: number;
  shadow?: boolean;
  style?: React.CSSProperties;
}> = ({
  children,
  bg = C.mustard,
  color = C.ink,
  size = 22,
  rotate = 0,
  shadow = true,
  style,
}) => (
  <div
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      padding: '7px 13px',
      background: bg,
      color,
      border: `3px solid ${C.ink}`,
      boxShadow: shadow ? SHADOW_SM : undefined,
      fontFamily: FONT_MONO,
      fontWeight: 700,
      fontSize: size,
      lineHeight: 1.15,
      letterSpacing: 0.5,
      textTransform: 'uppercase',
      whiteSpace: 'nowrap',
      transform: `rotate(${rotate}deg)`,
      ...style,
    }}
  >
    {children}
  </div>
);

/** Rubber-stamp verdict, double-ruled and rotated. */
export const Stamp: React.FC<{
  children: React.ReactNode;
  color: string;
  rotate?: number;
  fontSize?: number;
  opacity?: number;
  scale?: number;
}> = ({ children, color, rotate = -11, fontSize = 62, opacity = 1, scale = 1 }) => (
  <div
    style={{
      transform: `rotate(${rotate}deg) scale(${scale})`,
      opacity,
      border: `6px solid ${color}`,
      outline: `2px solid ${color}`,
      outlineOffset: 5,
      color,
      padding: '10px 26px',
      fontFamily: FONT_MONO,
      fontWeight: 700,
      fontSize,
      letterSpacing: 6,
      textTransform: 'uppercase',
      background: 'rgba(244,239,226,0.86)',
      whiteSpace: 'nowrap',
      textAlign: 'center',
    }}
  >
    {children}
  </div>
);

export const ChunkyArrow: React.FC<{
  width?: number;
  height?: number;
  color?: string;
  dir?: 'right' | 'left' | 'down' | 'up';
  style?: React.CSSProperties;
}> = ({ width = 260, height = 78, color = C.mustard, dir = 'right', style }) => {
  const rotation =
    dir === 'right' ? 0 : dir === 'down' ? 90 : dir === 'left' ? 180 : 270;
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 260 78"
      style={{ overflow: 'visible', ...style }}
    >
      <g transform={`rotate(${rotation} 130 39)`}>
        <path
          d="M4 24 H166 V7 L256 39 L166 71 V54 H4 Z"
          fill={color}
          stroke={C.ink}
          strokeWidth={5}
          strokeLinejoin="miter"
        />
        <path d="M20 32 H150" stroke={C.ink} strokeWidth={3} opacity={0.35} />
      </g>
    </svg>
  );
};

export const CrossMark: React.FC<{ size?: number; color?: string }> = ({
  size = 44,
  color = C.red,
}) => (
  <svg width={size} height={size} viewBox="0 0 44 44">
    <path
      d="M7 7 L37 37 M37 7 L7 37"
      stroke={color}
      strokeWidth={7}
      strokeLinecap="square"
    />
  </svg>
);

export const CheckMark: React.FC<{ size?: number; color?: string }> = ({
  size = 30,
  color = C.ink,
}) => (
  <svg width={size} height={size} viewBox="0 0 30 30">
    <path
      d="M3 16 L11 24 L27 5"
      fill="none"
      stroke={color}
      strokeWidth={5}
      strokeLinecap="square"
    />
  </svg>
);

export const InkRule: React.FC<{ thickness?: number; color?: string; style?: React.CSSProperties }> = ({
  thickness = 3,
  color = C.ink,
  style,
}) => (
  <div style={{ height: thickness, background: color, width: '100%', ...style }} />
);

/** A tiny punched-hole / binder detail for the textbook margin. */
export const BinderHoles: React.FC<{ style?: React.CSSProperties }> = ({ style }) => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 46,
      ...style,
    }}
  >
    {[0, 1, 2].map((i) => (
      <div
        key={i}
        style={{
          width: 15,
          height: 15,
          borderRadius: '50%',
          background: C.paper,
          border: `3px solid ${C.ink}`,
          opacity: 0.55,
        }}
      />
    ))}
  </div>
);

/** A small square swatch used as a legend key. */
export const Swatch: React.FC<{ color: string; size?: number }> = ({ color, size = 22 }) => (
  <div
    style={{
      width: size,
      height: size,
      background: color,
      border: `3px solid ${C.ink}`,
      flexShrink: 0,
    }}
  />
);
