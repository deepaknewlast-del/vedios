import React from 'react';
import { useCurrentFrame } from 'remotion';
import { C } from '../theme';
import { Burst, Gear, QuestionMark, Sparkle, Star } from './Sketch';

/** Ambient comic doodles: gears, sparkles and question marks that bob & pop. */
export const Doodles: React.FC<{
  frame?: number;
  seed?: number;
  items?: ('gear' | 'sparkle' | 'star' | 'q')[];
  opacity?: number;
  /** Explicit safe-area spots: [x, y, kind, size] */
  spots?: [number, number, 'gear' | 'sparkle' | 'star' | 'q', number][];
}> = ({ seed = 0, items = ['gear', 'sparkle', 'star', 'q'], opacity = 1, spots }) => {
  const frame = useCurrentFrame() + seed * 37;
  const bob = (k: number) => Math.sin(frame / (28 + k * 6) + k) * 7;
  const spin = (k: number) => frame * (0.35 + k * 0.12) * (k % 2 ? -1 : 1);
  const pop = (k: number) => 0.85 + Math.sin(frame / (22 + k * 5) + k) * 0.15;

  if (spots) {
    return (
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity }}>
        {spots.map(([x, y, kind, size], i) => {
          const k = i + 1;
          const color = [C.mustard, C.teal, C.salmon, C.grey][i % 4];
          return (
            <div
              key={`${kind}-${i}`}
              style={{ position: 'absolute', left: x, top: y, transform: `translateY(${bob(k)}px)` }}
            >
              {kind === 'gear' && <Gear size={size} color={color} rotate={spin(k)} teeth={8} />}
              {kind === 'sparkle' && <Sparkle size={size} color={color} pop={pop(k)} rotate={spin(k)} />}
              {kind === 'star' && <Star size={size} color={color} pop={pop(k)} rotate={spin(k)} />}
              {kind === 'q' && <QuestionMark size={size} rotate={-8} pop={pop(k)} />}
            </div>
          );
        })}
      </div>
    );
  }

  const gear = items.includes('gear');
  const spark = items.includes('sparkle');
  const star = items.includes('star');
  const q = items.includes('q');

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity }}>
      {gear && (
        <>
          <div style={{ position: 'absolute', left: 1610, top: 6, transform: `translateY(${bob(1)}px)` }}>
            <Gear size={104} color={C.teal} rotate={spin(1)} teeth={9} />
          </div>
          <div style={{ position: 'absolute', left: 1735, top: 96, transform: `translateY(${bob(3)}px)` }}>
            <Gear size={62} color={C.grey} rotate={spin(2) + 20} teeth={7} />
          </div>
          <div style={{ position: 'absolute', left: 12, top: 470, transform: `translateY(${bob(2)}px)` }}>
            <Gear size={72} color={C.mustard} rotate={spin(3)} teeth={8} />
          </div>
        </>
      )}
      {spark && (
        <>
          <div style={{ position: 'absolute', left: 1520, top: 300 }}>
            <Sparkle size={46} color={C.mustard} pop={pop(1)} rotate={spin(4)} />
          </div>
          <div style={{ position: 'absolute', left: 236, top: 24 }}>
            <Sparkle size={34} color={C.salmon} pop={pop(2)} rotate={spin(5)} />
          </div>
          <div style={{ position: 'absolute', left: 1180, top: 610 }}>
            <Sparkle size={28} color={C.teal} pop={pop(3)} rotate={spin(6)} />
          </div>
        </>
      )}
      {star && (
        <>
          <div style={{ position: 'absolute', left: 60, top: 300 }}>
            <Star size={38} color={C.mustard} pop={pop(4)} rotate={spin(7)} />
          </div>
          <div style={{ position: 'absolute', left: 1690, top: 420 }}>
            <Star size={30} color={C.salmon} pop={pop(5)} rotate={spin(8)} />
          </div>
        </>
      )}
      {q && (
        <div style={{ position: 'absolute', left: 1470, top: 120, transform: `translateY(${bob(5)}px)` }}>
          <QuestionMark size={54} rotate={-8} pop={pop(6)} />
        </div>
      )}
    </div>
  );
};

/** 1980s beige CRT monitor with keyboard, like the reference's computer panel. */
export const CrtMonitor: React.FC<{
  width: number;
  height: number;
  children?: React.ReactNode;
  screenBg?: string;
  accent?: string;
}> = ({ width, height, children, screenBg = C.screen, accent = C.grey }) => {
  const bezel = Math.round(width * 0.045);
  const screenW = width - bezel * 2;
  const screenH = Math.round(height * 0.66);
  return (
    <div style={{ position: 'relative', width, height }}>
      {/* monitor shell */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: accent,
          border: `4px solid ${C.ink}`,
          borderRadius: 18,
          boxShadow: `6px 6px 0 ${C.ink}`,
        }}
      />
      {/* vents */}
      <div
        style={{
          position: 'absolute',
          left: bezel,
          bottom: 16,
          display: 'flex',
          gap: 6,
        }}
      >
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} style={{ width: 5, height: 16, background: C.ink, opacity: 0.28, borderRadius: 2 }} />
        ))}
      </div>
      {/* power dot */}
      <div
        style={{
          position: 'absolute',
          right: bezel,
          bottom: 18,
          width: 14,
          height: 14,
          borderRadius: '50%',
          background: C.teal,
          border: `3px solid ${C.ink}`,
        }}
      />
      {/* screen */}
      <div
        style={{
          position: 'absolute',
          left: bezel,
          top: bezel,
          width: screenW,
          height: screenH,
          background: screenBg,
          border: `4px solid ${C.ink}`,
          borderRadius: 10,
          overflow: 'hidden',
        }}
      >
        {children}
        {/* scanlines */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'repeating-linear-gradient(to bottom, rgba(0,0,0,0.16) 0px, rgba(0,0,0,0.16) 2px, transparent 2px, transparent 5px)',
            pointerEvents: 'none',
          }}
        />
      </div>
      {/* stand */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          bottom: -18,
          transform: 'translateX(-50%)',
          width: width * 0.3,
          height: 18,
          background: accent,
          border: `4px solid ${C.ink}`,
          borderTop: 'none',
          borderRadius: '0 0 8px 8px',
        }}
      />
    </div>
  );
};
