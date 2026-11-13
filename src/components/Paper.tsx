import React from 'react';
import { AbsoluteFill, Img, staticFile } from 'remotion';
import { C } from '../theme';

/**
 * Aged cream graph-paper canvas. The 32px minor grid, 160px major grid, age
 * stains and vignette are baked into one PNG (see scripts/make_textures.py) so
 * the browser never has to rasterise ~2000 CSS tiles per frame.
 */
export const GraphPaper: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: C.paper, overflow: 'hidden' }}>
    <Img
      src={staticFile('paper.png')}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
    />
  </AbsoluteFill>
);

/**
 * Subtle film-grain overlay. Kept fully static: the grain is a baked tile and
 * never re-rasterised per frame, which keeps the software renderer fast.
 */
export const FilmGrain: React.FC = () => (
  <AbsoluteFill
    style={{
      backgroundImage: `url(${staticFile('grain.png')})`,
      backgroundRepeat: 'repeat',
      opacity: 0.36,
      pointerEvents: 'none',
    }}
  />
);
