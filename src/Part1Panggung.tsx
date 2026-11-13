import React from 'react';
import { AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame } from 'remotion';
import { FontFaces } from './Fonts';
import { C } from './theme';

/* ---------------------------------------------------------------------------
 * PART 1 — "kartun panggung" (Bang Motion style 6).
 *
 * Laws this file obeys (see docs/STYLE-BRIEF.md):
 *  · 10 frame-sized STAGES, one camera each, zoom 1.08–1.95 — never wide.
 *  · cuts between stages (one 96px slide + blur, the rest hard cuts).
 *  · every stage holds ≥10 living objects, all driven by tl.time() = frame/fps.
 *  · zero captions: text only exists as part of the world.
 *  · flat bright fills, no outlines, no texture, no vignette.
 * ------------------------------------------------------------------------- */

import { Room, StageAdmiration, StageEnvy, StageGrid, StageMachine, StagePayoff, StageSpill, StageScore, StageTape, StageWaiting, wave } from './art/Stages';

const FPS = 60;
const W = 1920;
const H = 1080;

type Cam = { z: number; fx: number; fy: number };
type StageDef = {
  from: number; // seconds
  to: number;
  /** camera keyframes: [timeWithinStage, zoom, focusX, focusY] */
  cam: [number, number, number, number][];
  /** hard cut, or a 96px slide in from a direction */
  enter?: 'cut' | 'left' | 'right';
  render: (t: number, local: number) => React.ReactNode;
};

/* ------------------------------------------------------------- the cut list --- */
export const STAGES: StageDef[] = [
  {
    from: 0,
    to: 15.0,
    enter: 'cut',
    cam: [
      [0, 1.1, 960, 540],
      [4.6, 1.24, 800, 560],
      [8.2, 1.3, 1300, 560],
      [11.6, 1.38, 1300, 540],
      [14.2, 1.3, 960, 550],
    ],
    render: (t, l) => (
      <StageWaiting
        t={t}
        a={l > 5.2 ? 1 : 0}
        b={l > 11 ? 1 : 0}
        aTalk={clamp01(0.5 + 0.5 * Math.sin(l * 7.4) * Math.sin(l * 2.1)) * (l < 5.2 ? 1 : 0.15)}
        bTalk={clamp01(0.5 + 0.5 * Math.sin(l * 6.8) * Math.sin(l * 1.9)) * (l > 11 ? 1 : 0.2)}
      />
    ),
  },
  {
    from: 15.0,
    to: 25.0,
    enter: 'left',
    cam: [
      [0, 1.12, 1010, 560],
      [2.2, 1.3, 950, 600],
      [4.8, 1.42, 880, 640],
      [7.6, 1.3, 1010, 580],
    ],
    render: (t, l) => <StageSpill t={t} spill={clamp01((l - 2.2) / 1.6)} laugh={clamp01((l - 3.4) / 1.2)} />,
  },
  {
    from: 25.0,
    to: 40.0,
    enter: 'cut',
    cam: [
      [0, 1.1, 960, 560],
      [3.0, 1.2, 900, 600],
      [6.6, 1.28, 880, 640],
      [10.6, 1.22, 1300, 620],
      [13.4, 1.34, 1500, 580],
    ],
    render: (t, l) => <StageMachine t={t} spike={clamp01((l - 8) / 0.8)} />,
  },
  {
    from: 40.0,
    to: 50.0,
    enter: 'cut',
    cam: [
      [0, 1.22, 1000, 500],
      [3.0, 1.38, 1010, 520],
      [7.6, 1.3, 1010, 470],
    ],
    render: (t) => <StageTape t={t} variant="a" spike={0} label="TAKE 01 / CLEAN" />,
  },
  {
    from: 50.0,
    to: 62.0,
    enter: 'cut',
    cam: [
      [0, 1.18, 1000, 500],
      [3.8, 1.34, 1020, 520],
      [7.4, 1.44, 1240, 820],
      [9.8, 1.3, 1010, 520],
    ],
    render: (t, l) => <StageTape t={t} variant="b" spike={clamp01((l - 6.4) / 0.6)} label="TAKE 02 / CLATTER" />,
  },
  {
    from: 62.0,
    to: 80.0,
    enter: 'cut',
    cam: [
      [0, 1.08, 940, 600],
      [3.6, 1.18, 800, 640],
      [7.0, 1.26, 1160, 640],
      [10.0, 1.16, 940, 620],
      [14.0, 1.24, 1420, 620],
    ],
    render: (t, l) => <StageScore t={t} grow={clamp01((l - 2.4) / 3.2)} />,
  },
  {
    from: 80.0,
    to: 96.0,
    enter: 'cut',
    cam: [
      [0, 1.1, 940, 560],
      [4.0, 1.18, 900, 580],
      [8.0, 1.26, 1160, 640],
      [12.0, 1.18, 980, 580],
    ],
    render: (t, l) => <StageGrid t={t} reveal={clamp01((l - 1.6) / 2.4)} edge={clamp01((l - 6.0) / 1.2)} />,
  },
  {
    from: 96.0,
    to: 112.0,
    enter: 'cut',
    cam: [
      [0, 1.2, 960, 560],
      [4.0, 1.32, 960, 570],
      [8.0, 1.4, 960, 580],
      [12.0, 1.28, 960, 560],
    ],
    render: (t, l) => <StageEnvy t={t} press={clamp01((l - 3.0) / 6.0)} />,
  },
  {
    from: 112.0,
    to: 126.0,
    enter: 'cut',
    cam: [
      [0, 1.16, 900, 580],
      [3.0, 1.24, 990, 520],
      [6.4, 1.3, 1040, 440],
      [9.6, 1.2, 1000, 500],
    ],
    render: (t, l) => (
      <StageAdmiration t={t} move={clamp01((l - 2.2) / 3.0)} squash={clamp01((l - 5.4) / 1.0)} />
    ),
  },
  {
    from: 126.0,
    to: 135.0,
    enter: 'cut',
    cam: [
      [0, 1.1, 960, 570],
      [3.0, 1.2, 900, 590],
      [6.0, 1.28, 1120, 570],
      [8.2, 1.2, 1000, 570],
    ],
    render: (t, l) => <StagePayoff t={t} hug={clamp01((l - 2.0) / 1.4)} />,
  },
];

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const smooth = (v: number) => v * v * (3 - 2 * v);

/* --------------------------------------------------------------- the camera --- */
export const cameraAt = (stage: StageDef, local: number): Cam => {
  const ks = stage.cam;
  if (local <= ks[0][0]) return { z: ks[0][1], fx: ks[0][2], fy: ks[0][3] };
  for (let i = 1; i < ks.length; i++) {
    if (local <= ks[i][0]) {
      const [t0, z0, x0, y0] = ks[i - 1];
      const [t1, z1, x1, y1] = ks[i];
      const k = smooth((local - t0) / Math.max(0.001, t1 - t0));
      // interpolate zoom logarithmically: feels even, per reference
      const z = Math.exp(Math.log(z0) + (Math.log(z1) - Math.log(z0)) * k);
      return { z, fx: x0 + (x1 - x0) * k, fy: y0 + (y1 - y0) * k };
    }
  }
  const last = ks[ks.length - 1];
  return { z: last[1], fx: last[2], fy: last[3] };
};

/** world transform, clamped so a stage edge can never enter frame */
const applyCam = (cam: Cam, ox = 0, oy = 0) => {
  const z = cam.z;
  let tx = W / 2 - (cam.fx + ox) * z;
  let ty = H / 2 - (cam.fy + oy) * z;
  tx = Math.min(0, Math.max(W - W * z, tx));
  ty = Math.min(0, Math.max(H - H * z, ty));
  return `translate(${tx}px,${ty}px) scale(${z})`;
};

const stageAt = (t: number) => {
  for (let i = 0; i < STAGES.length; i++) if (t < STAGES[i].to) return i;
  return STAGES.length - 1;
};

/* ----------------------------------------------------------------- the film --- */
export const Part1: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const si = stageAt(t);
  const st = STAGES[si];
  const local = t - st.from;
  const cam = cameraAt(st, local);

  // the one staged transition: a 96px slide + 8px blur when the room changes
  const slideQ = st.enter === 'left' ? clamp01(local / 0.42) : 1;
  const ox = st.enter === 'left' ? -96 * (1 - slideQ) ** 3 : 0;
  const blur = st.enter === 'left' && slideQ < 1 ? 8 * (1 - slideQ) : 0;

  return (
    <AbsoluteFill style={{ background: C.paper, overflow: 'hidden' }}>
      <FontFaces />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          filter: blur > 0.05 ? `blur(${blur}px)` : undefined,
          transform: applyCam(cam, ox, 0),
          transformOrigin: '0 0',
        }}
      >
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: 'absolute', inset: 0 }}>
          {st.render(t, local)}
        </svg>
      </div>

      {/* no vignette, no texture — the flat-vector law */}
      <Audio src={staticFile('part1_mix.wav')} />
    </AbsoluteFill>
  );
};

export const PART1_DURATION = 135;
