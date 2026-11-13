import type React from 'react';

/** 1980s retro behavioral textbook design tokens. */
export const C = {
  paper: '#F4EFE2',
  grid: '#E0D8C8',
  ink: '#181818',
  white: '#FFFDF6',
  teal: '#8BB8B8',
  tealLight: '#B8D6D4',
  salmon: '#E39A83',
  mustard: '#F2CA6B',
  grey: '#D3D5D4',
  red: '#E03C31',
  screen: '#1C2422',
} as const;

export const BORDER = `3px solid ${C.ink}`;
export const SHADOW = `4px 4px 0px ${C.ink}`;
export const SHADOW_SM = `3px 3px 0px ${C.ink}`;

export const FONT_HEAD = '"Comic Neue", "Comic Sans MS", cursive';
export const FONT_MONO = '"Space Mono", "Courier New", monospace';

export const inkText: React.CSSProperties = { color: C.ink };

/** Light tint helper for quadrant / panel fills. */
export const tint = (hex: string, alpha: number) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};
