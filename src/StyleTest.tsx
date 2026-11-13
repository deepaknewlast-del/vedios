import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { FontFaces } from './Fonts';
import { C, SHADOW_SM } from './theme';
import { Character, Halftone, Impact, Slab, SpeedLines, Sunburst, TornEdge } from './art/Cast';

/* ---------------------------------------------------------------------------
 * STYLE TEST — the hook, cut as a full-bleed cartoon.
 * Full-frame drawings + hard cuts + camera that always has a target + type
 * that slams on the beat. Built to judge the look before re-cutting Part 1.
 * ------------------------------------------------------------------------- */

const FPS = 60;
const f = (t: number) => Math.round(t * FPS);

type Shot = {
  out: number;
  z0: number;
  z1: number;
  fx: number;
  fy: number;
  shake?: number;
};

/** fx/fy is the point of the 1920×1080 drawing the camera sits on. */
const SHOTS: Shot[] = [
  { out: 1.33, z0: 1.0, z1: 1.05, fx: 400, fy: 300 }, // A, left of frame, type has the right
  { out: 4.0, z0: 1.0, z1: 1.06, fx: 960, fy: 520 }, // two-shot, desks and floor
  { out: 6.05, z0: 1.0, z1: 1.1, fx: 430, fy: 330 }, // A medium
  { out: 8.4, z0: 1.06, z1: 1.3, fx: 400, fy: 250 }, // A close, eyes
  { out: 10.2, z0: 1.16, z1: 1.44, fx: 380, fy: 150 }, // A dead-eyed, hold
  { out: 12.25, z0: 1.0, z1: 1.12, fx: 1320, fy: 400 }, // whip to B
  { out: 15.0, z0: 1.02, z1: 1.2, fx: 1330, fy: 340 }, // B laughing
  { out: 17.0, z0: 1.04, z1: 1.26, fx: 1330, fy: 350, shake: 0.5 }, // B, the line
];

const shotAt = (frame: number) => {
  const t = frame / FPS;
  for (let i = 0; i < SHOTS.length; i++) if (t < SHOTS[i].out) return i;
  return SHOTS.length - 1;
};

const startFrame = (shot: number) => (shot === 0 ? 0 : f(SHOTS[shot - 1].out));

const pop = (frame: number, at: number, dur = 15) =>
  interpolate(frame, [at, at + dur * 0.5, at + dur], [0, 1.09, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

/* --------------------------------------------------------------------- set --- */
const Floor: React.FC = () => (
  <>
    <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 210, background: C.tealLight, borderTop: `7px solid ${C.ink}` }} />
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: 210,
        background: 'repeating-linear-gradient(90deg, rgba(24,24,24,.15) 0 6px, transparent 6px 92px)',
      }}
    />
  </>
);

const Backdrop: React.FC<{ frame: number }> = ({ frame }) => (
  <>
    <AbsoluteFill style={{ background: C.paper }} />
    <Sunburst cx={960} cy={420} r={1500} rotate={frame * 0.14} color={C.mustard} opacity={0.5} />
    <Sunburst cx={960} cy={420} r={1080} rotate={-frame * 0.24} color={C.tealLight} opacity={0.72} />
    <Halftone opacity={0.06} gap={24} r={4} />
  </>
);

/* ----------------------------------------------------- candidate A (frame 1) --- */
const ShotA: React.FC<{ frame: number; shot: number }> = ({ frame, shot }) => {
  const blink = ((frame + 40) % 200) < 6 ? 1 : 0;
  const talk = 0.5 + 0.5 * Math.sin(frame / 2.2) * Math.sin(frame / 5.1);
  const isClose = shot === 3 || shot === 4;
  return (
    <AbsoluteFill>
      <Backdrop frame={frame} />
      {/* desk + mug in front of him */}
      <div style={{ position: 'absolute', left: 860, top: 742, width: 900, height: 88, background: C.mustard, border: `7px solid ${C.ink}`, transform: 'rotate(-1deg)' }} />
      <div style={{ position: 'absolute', left: 1180, top: 660, width: 80, height: 76, background: C.white, border: `6px solid ${C.ink}`, borderRadius: '0 0 16px 16px' }} />
      <div style={{ position: 'absolute', left: 1126, top: 684, width: 54, height: 32, border: `6px solid ${C.ink}`, borderRadius: '16px 0 0 16px' }} />

      <div style={{ position: 'absolute', left: isClose ? 1010 : 1050, top: isClose ? 96 : 150 }}>
        <Character
          size={isClose ? 470 : 430}
          pose="stand"
          outfit="suit"
          eyes={shot === 4 ? 'spiral' : talk > 0.72 ? 'narrow' : 'open'}
          brows={shot >= 3 ? 'raised' : 'neutral'}
          mouth={shot === 4 ? 'flat' : 'talk'}
          talk={shot === 4 ? 0 : talk}
          blink={blink}
          headTilt={Math.sin(frame / 13) * 2.4}
          armR={-6 + Math.sin(frame / 17) * 5}
          armL={4 + Math.cos(frame / 19) * 5}
        />
      </div>
      <Floor />

      {/* the wall chart behind him */}
      <div
        style={{
          position: 'absolute',
          right: 46,
          top: 96,
          width: 470,
          height: 262,
          background: C.white,
          border: `7px solid ${C.ink}`,
          boxShadow: SHADOW_SM,
          transform: 'rotate(1.6deg)',
        }}
      >
        <div style={{ fontFamily: '"Space Mono", monospace', fontWeight: 700, fontSize: 20, letterSpacing: 2, padding: '12px 16px' }}>PERFORMANCE REVIEW</div>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} style={{ position: 'absolute', left: 16, right: 16, top: 58 + i * 54, height: 22, background: C.grid }} />
        ))}
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: 16,
              top: 58 + i * 54,
              height: 22,
              width: `${(0.86 + i * 0.045) * 100}%`,
              background: i === 3 ? C.red : C.teal,
              border: `4px solid ${C.ink}`,
              transform: `scaleX(${Math.min(1, (frame - 60) / 40)})`,
              transformOrigin: 'left center',
            }}
          />
        ))}
      </div>
    </AbsoluteFill>
  );
};

/* -------------------------------------------------- the two-shot (frame 2/5) --- */
const ShotTwoShot: React.FC<{ frame: number; shot: number }> = ({ frame, shot }) => {
  const ta = 0.5 + 0.5 * Math.sin(frame / 2.2) * Math.sin(frame / 5.1);
  const tb = 0.5 + 0.5 * Math.sin(frame / 2.6) * Math.sin(frame / 6.3);
  const blinkA = ((frame + 40) % 200) < 6 ? 1 : 0;
  const blinkB = ((frame + 15) % 230) < 6 ? 1 : 0;
  return (
    <AbsoluteFill>
      <Backdrop frame={frame} />
      {/* clock */}
      <svg width={1920} height={1080} style={{ position: 'absolute' }}>
        <g transform="translate(960 132)">
          <circle r={54} fill={C.white} stroke={C.ink} strokeWidth={7} />
          <line x1={0} y1={0} x2={0} y2={-34} stroke={C.ink} strokeWidth={7} strokeLinecap="round" transform={`rotate(${frame * 0.5})`} />
          <line x1={0} y1={0} x2={0} y2={-22} stroke={C.red} strokeWidth={6} strokeLinecap="round" transform={`rotate(${frame * 2.4})`} />
        </g>
      </svg>
      {/* notice board */}
      <div style={{ position: 'absolute', right: 120, top: 210, width: 210, height: 132, background: C.white, border: `7px solid ${C.ink}`, boxShadow: SHADOW_SM, transform: 'rotate(3deg)' }}>
        <div style={{ fontFamily: '"Comic Neue", cursive', fontWeight: 700, fontStyle: 'italic', fontSize: 30, lineHeight: 0.95, padding: '8px 11px' }}>
          HIRING
          <br />
          TODAY
        </div>
      </div>
      <Floor />
      {/* two desks, foreground, framing the pair */}
      <div style={{ position: 'absolute', left: 120, top: 812, width: 700, height: 90, background: C.mustard, border: `7px solid ${C.ink}`, transform: 'rotate(-1.2deg)' }} />
      <div style={{ position: 'absolute', left: 1120, top: 812, width: 700, height: 90, background: C.salmon, border: `7px solid ${C.ink}`, transform: 'rotate(1.2deg)' }} />

      <div style={{ position: 'absolute', left: 400, top: 250 }}>
        <Character
          size={430}
          pose="stand"
          outfit="suit"
          eyes="open"
          brows="neutral"
          mouth="talk"
          talk={ta}
          blink={blinkA}
          headTilt={Math.sin(frame / 15) * 1.8}
        />
      </div>
      <div style={{ position: 'absolute', left: 1100, top: 250 }}>
        <Character
          size={430}
          pose="stand"
          outfit="hoodie"
          eyes={shot === 5 ? 'happy' : 'open'}
          mouth={shot === 5 ? 'laugh' : 'talk'}
          talk={tb}
          blink={blinkB}
          look={-0.4}
          squash={shot === 5 ? 1 - Math.abs(Math.sin(frame / 5.5)) * 0.03 : 1}
        />
      </div>
      <Slab x={396} y={196} bg={C.ink} size={34} rotate={-2} p={pop(frame, startFrame(shot) + 3, 10)}>
        CANDIDATE A
      </Slab>
      <Slab x={1096} y={196} bg={C.mustard} color={C.ink} size={34} rotate={2} p={pop(frame, startFrame(shot) + 8, 10)}>
        CANDIDATE B
      </Slab>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------- candidate B, close (6/7) --- */
const ShotB: React.FC<{ frame: number; shot: number }> = ({ frame, shot }) => {
  const blink = ((frame + 15) % 230) < 6 ? 1 : 0;
  const talk = 0.5 + 0.5 * Math.sin(frame / 2.6) * Math.sin(frame / 6.3);
  return (
    <AbsoluteFill>
      <Backdrop frame={frame} />
      {/* he's mid-laugh: coffee cup knocked over on the desk */}
      <div style={{ position: 'absolute', left: 980, top: 754, width: 820, height: 86, background: C.salmon, border: `7px solid ${C.ink}`, transform: 'rotate(1deg)' }} />
      <div style={{ position: 'absolute', left: 1420, top: 664, width: 92, height: 80, background: C.white, border: `6px solid ${C.ink}`, borderRadius: 14, transform: 'rotate(62deg)' }} />
      <div style={{ position: 'absolute', left: 1150, top: 706, width: 150, height: 32, background: '#6B4B33', borderRadius: 20, opacity: 0.8 }} />
      <Floor />
      <div style={{ position: 'absolute', left: 1010, top: 150 }}>
        <Character
          size={480}
          pose="stand"
          outfit="hoodie"
          eyes={shot === 6 ? 'happy' : 'open'}
          brows={shot === 7 ? 'worried' : 'neutral'}
          mouth={shot === 6 ? 'laugh' : 'talk'}
          talk={shot === 7 ? talk : 0}
          blink={shot === 7 ? blink : 0}
          headTilt={-5 + Math.sin(frame / 10) * 4}
          armR={shot === 7 ? -28 : -12 + Math.sin(frame / 9) * 8}
          armL={shot === 7 ? 10 : 16}
          squash={1 - Math.abs(Math.sin(frame / 5.5)) * 0.022}
        />
      </div>
      <Slab x={880} y={150} bg={C.mustard} color={C.ink} size={34} rotate={-2} p={pop(frame, startFrame(shot) + 3, 10)}>
        CANDIDATE B
      </Slab>
    </AbsoluteFill>
  );
};

/* ---------------------------------------------------------------- the film --- */
export const StyleTest: React.FC = () => {
  const frame = useCurrentFrame();
  const shot = shotAt(frame);
  const s0 = startFrame(shot);
  const inShot = frame - s0;
  const cfg = SHOTS[shot];
  const dur = Math.max(1, f(cfg.out) - s0);
  const k = Math.min(1, inShot / dur);

  const zoom = cfg.z0 + (cfg.z1 - cfg.z0) * k;
  const shake = cfg.shake ? Math.sin(frame * 2.1) * cfg.shake * 7 * (1 - k) : 0;
  // zoom about a focus point, but never let the drawing's edge enter frame
  const maxOff = 0;
  const tx = Math.max(-(zoom - 1) * 1920 + maxOff, Math.min(0, 960 - cfg.fx * zoom));
  const ty = Math.max(-(zoom - 1) * 1080 + maxOff, Math.min(0, 540 - cfg.fy * zoom));

  const scene =
    shot === 0 ? (
      <AbsoluteFill style={{ background: C.paper }}>
        <Halftone opacity={0.09} gap={22} r={4.4} />
        <Sunburst cx={960} cy={520} r={1150} rotate={frame * 0.6} color={C.mustard} opacity={0.3} />
      </AbsoluteFill>
    ) : shot === 1 || shot === 5 ? (
      <ShotTwoShot frame={frame} shot={shot} />
    ) : shot <= 4 ? (
      <ShotA frame={frame} shot={shot} />
    ) : (
      <ShotB frame={frame} shot={shot} />
    );

  const world = (
    <AbsoluteFill style={{ transformOrigin: '0 0', transform: `translate(${tx + shake}px, ${ty}px) scale(${zoom})` }}>{scene}</AbsoluteFill>
  );

  /* ------------------------------------------------------------------- type --- */
  const type = (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      {shot === 0 && (
        <>
          <Impact text="SAME JOB." x={0} y={252} size={200} align="center" p={pop(frame, 0, 11)} rotate={-2} stroke={C.white} />
          <Impact text="TWO PEOPLE." x={0} y={470} size={200} align="center" color={C.red} stroke={C.ink} p={pop(frame, f(0.22), 13)} rotate={1.6} />
          <div style={{ position: 'absolute', left: 0, right: 0, top: 742, display: 'flex', justifyContent: 'center', transform: `scale(${pop(frame, f(0.56), 12)})` }}>
            <div style={{ background: C.ink, color: C.white, fontFamily: '"Comic Neue", cursive', fontWeight: 700, fontStyle: 'italic', fontSize: 40, padding: '9px 30px', letterSpacing: 1.4 }}>
              ONE OF THEM GETS THE OFFER
            </div>
          </div>
        </>
      )}

      {shot === 2 && (
        <>
          <Slab x={92} y={248} bg={C.red} size={68} rotate={-3} p={pop(frame, s0 + 16, 12)}>
            ZERO
          </Slab>
          <Slab x={92} y={356} bg={C.red} size={68} rotate={-3} p={pop(frame, s0 + 26, 12)}>
            HESITATION.
          </Slab>
          <Slab x={92} y={498} bg={C.ink} size={68} rotate={2} p={pop(frame, s0 + 44, 12)}>
            ZERO FLAWS.
          </Slab>
        </>
      )}

      {shot === 3 && (
        <>
          <div
            style={{
              position: 'absolute',
              left: 96,
              top: 232,
              transform: `rotate(-3deg) scale(${pop(frame, s0 + 3, 11)})`,
              background: C.white,
              border: `7px solid ${C.ink}`,
              boxShadow: '9px 9px 0 #181818',
              padding: '14px 24px',
            }}
          >
            <div style={{ fontFamily: '"Space Mono", monospace', fontWeight: 700, fontSize: 19, letterSpacing: 2.2 }}>ANSWERS PERFECT</div>
            <div style={{ fontFamily: '"Comic Neue", cursive', fontStyle: 'italic', fontWeight: 700, fontSize: 108, lineHeight: 0.82 }}>100%</div>
          </div>
          <Impact text="ROBOTIC" x={92} y={556} size={112} color={C.red} stroke={C.ink} p={pop(frame, s0 + 26, 12)} rotate={-1} />
          <Impact text="PERFECTION" x={92} y={664} size={112} color={C.red} stroke={C.ink} p={pop(frame, s0 + 38, 12)} rotate={-1} />
        </>
      )}

      {shot === 4 && (
        <div style={{ position: 'absolute', left: 100, right: 100, top: 830, display: 'flex', justifyContent: 'center' }}>
          <Slab x={0} y={0} bg={C.ink} size={56} rotate={-1.4} p={pop(frame, s0 + 8, 11)}>
            NO BLINKS. NO SWEAT. NO PULSE.
          </Slab>
        </div>
      )}

      {shot === 5 && (
        <Slab x={0} y={150} bg={C.ink} size={58} rotate={-1.6} p={pop(frame, s0 + 10, 11)}>
          …AND THIS ONE
        </Slab>
      )}

      {shot === 6 && (
        <div style={{ position: 'absolute', left: 0, right: 0, top: 848, display: 'flex', justifyContent: 'center' }}>
          <Slab x={0} y={0} bg={C.mustard} color={C.ink} size={62} rotate={-1.6} p={pop(frame, s0 + 12, 12)}>
            AND HE LAUGHS IT OFF
          </Slab>
        </div>
      )}

      {shot === 7 && (
        <>
          <div
            style={{
              position: 'absolute',
              left: 130,
              top: 200,
              transform: `rotate(-2deg) scale(${pop(frame, s0 + 4, 11)})`,
              background: C.white,
              border: `7px solid ${C.ink}`,
              boxShadow: '9px 9px 0 #181818',
              padding: '22px 28px',
              maxWidth: 620,
            }}
          >
            <div style={{ fontFamily: '"Comic Neue", cursive', fontWeight: 700, fontStyle: 'italic', fontSize: 56, lineHeight: 1.02 }}>
              “I misread one number last quarter.”
            </div>
            <div style={{ fontFamily: '"Space Mono", monospace', fontWeight: 700, fontSize: 18, marginTop: 12, opacity: 0.65 }}>+ A SMALL LAUGH</div>
          </div>
          <Impact text="LOGIC SAYS HE LOSES" x={0} y={846} size={98} align="center" color={C.ink} stroke={C.mustard} p={pop(frame, s0 + 46, 12)} rotate={-0.8} />
        </>
      )}
    </AbsoluteFill>
  );

  const flash = shot >= 1 ? Math.max(0, 1 - inShot / 6) * 0.18 : 0;

  return (
    <AbsoluteFill style={{ background: C.paper, overflow: 'hidden' }}>
      <FontFaces />
      {world}
      {type}
      <AbsoluteFill style={{ pointerEvents: 'none', boxShadow: 'inset 0 0 260px rgba(24,24,24,.26)' }} />
      <div style={{ position: 'absolute', inset: 0, background: C.white, opacity: flash, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', right: 26, bottom: 20, fontFamily: '"Space Mono", monospace', fontWeight: 700, fontSize: 15, letterSpacing: 1.4, opacity: 0.4 }}>
        STYLE TEST / SHOT {String(shot + 1).padStart(2, '0')} / {(frame / FPS).toFixed(2)}s
      </div>
    </AbsoluteFill>
  );
};
