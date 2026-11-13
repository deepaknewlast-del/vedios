import { interpolate, spring } from 'remotion';
import { clamp01, FPS } from './timeline';

/** Element becomes visible on the beat whose state index === `at`. */
export const revealAt = (
  state: number,
  at: number,
  localFrame: number,
  bounce = false,
  duration = 26,
): number => {
  if (state < at) return 0;
  if (state > at) return 1;
  return spring({
    frame: Math.max(0, localFrame),
    fps: FPS,
    config: bounce
      ? { damping: 12, stiffness: 130, mass: 0.8 }
      : { damping: 200, stiffness: 100 },
    durationInFrames: duration,
  });
};

/** Simple eased 0→1 over a frame window. */
export const ease = (frame: number, from: number, to: number) =>
  interpolate(frame, [from, to], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

export const fade = (v: number) => clamp01(v);

export const stagger = (p: number, i: number, count: number) =>
  clamp01((p - (i / count) * 0.55) / 0.45);
