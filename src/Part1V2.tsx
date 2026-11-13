import React from 'react';
import { AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { Monolith, Talker } from './art/Monolith';
import { C } from './theme';
import { ENV } from './data/env_v2';
import timing from '../.cache/vo/timing.json';

/**
 * Part 1, v2 — "the room".
 *
 * Two rules this file lives by:
 *
 *  1. CONTENT ANIMATES ON GLOBAL TIME. A shot is only a camera and a layer
 *     stack; it must never restart an object's entrance. (Restarting is what
 *     makes explainers feel like slides: every cut resets the world.)
 *  2. EVERY LINE GETS ITS OWN FRAMING. Camera keyframes are placed on phrase
 *     boundaries, so the lens always points at the thing being said. That is
 *     the fix for "everything is at the same focus".
 */

const P: { text: string; start: number; end: number }[] = (timing as any).phrases;
const TOTAL: number = (timing as any).duration;
const V = { w: 1920, h: 1080 };

/* ------------------------------------------------------------------ maths */

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const ramp = (t: number, a: number, b: number) => clamp01((t - a) / (b - a || 1));
const outCubic = (x: number) => 1 - Math.pow(1 - clamp01(x), 3);
const inCubic = (x: number) => Math.pow(clamp01(x), 3);
const inOut = (x: number) => (clamp01(x) < 0.5 ? 4 * clamp01(x) ** 3 : 1 - Math.pow(-2 * clamp01(x) + 2, 3) / 2);

/** overshoot pop. The slight overshoot is the "catch" the brief asked for. */
const pop = (t: number, at: number, d = 0.22) => {
  const k = clamp01((t - at) / d);
  if (k <= 0) return 0;
  if (k >= 1) return 1;
  return 1 + 1.9 * Math.pow(k - 1, 3) + 0.9 * Math.pow(k - 1, 2);
};
const ringOut = (t: number, at: number, d = 0.5) => {
  const k = clamp01((t - at) / d);
  return { r: k, on: k > 0 && k < 1 };
};
const T = (i: number) => P[Math.max(0, Math.min(P.length - 1, i))].start;

/* --------------------------------------------------------------- surfaces */

const Backdrop: React.FC<{ t: number; tone?: 'paper' | 'night' | 'sun' | 'ink' | 'danger'; drift?: number }> = ({
  t,
  tone = 'paper',
  drift = 1,
}) => {
  const bg = { paper: C.paper, night: '#101A20', sun: C.mustard, ink: C.ink, danger: '#2B1B18' }[tone];
  const fg = tone === 'paper' ? '#DBD1BC' : tone === 'sun' ? '#D9AE4F' : tone === 'danger' ? '#4A2C26' : '#2A3940';
  const scroll = (((t * 46 * drift) % 120) + 120) % 120;
  return (
    <>
      <rect x={-600} y={-600} width={V.w + 1200} height={V.h + 1200} fill={bg} />
      <g opacity={0.85}>
        {Array.from({ length: 10 }).map((_, r) =>
          Array.from({ length: 17 }).map((_, c) => (
            <circle key={`${r}-${c}`} cx={c * 120 + scroll - 80} cy={r * 120 + scroll * 0.35 - 80} r={4.5} fill={fg} />
          )),
        )}
      </g>
    </>
  );
};

const Room: React.FC<{ t: number; windowX?: number; floorY?: number; tone?: 'paper' | 'night' }> = ({
  t,
  windowX = 1480,
  floorY = 620,
  tone = 'paper',
}) => (
  <>
    <rect x={-600} y={-400} width={V.w + 1200} height={floorY + 400} fill="#EFE7D6" />
    <rect x={-600} y={floorY} width={V.w + 1200} height={V.h} fill="#E3D8C0" />
    <rect x={-600} y={floorY - 12} width={V.w + 1200} height={14} fill={C.ink} opacity={tone === 'night' ? 0.4 : 0.1} />
    <g transform={`translate(${windowX},${floorY - 300})`} opacity={0.9}>
      <rect x={-210} y={-260} width={420} height={450} rx={12} fill={C.tealLight} />
      {Array.from({ length: 11 }).map((_, i) => (
        <rect key={i} x={-210} y={-260 + i * 42 + Math.sin(t * 1.2 + i * 0.5) * 3} width={420} height={22} fill={C.white} opacity={0.42} />
      ))}
    </g>
  </>
);

const Plate: React.FC<{
  x: number; y: number; text: string; size?: number; fill?: string; ink?: string; rot?: number; s?: number;
}> = ({ x, y, text, size = 44, fill = C.ink, ink = C.paper, rot = -2, s = 1 }) => {
  const w = text.length * size * 0.64 + 56;
  return (
    <g transform={`translate(${x},${y}) rotate(${rot}) scale(${s})`}>
      <rect x={-w / 2} y={-size * 0.85} width={w} height={size * 1.64} rx={8} fill={fill} />
      <text textAnchor="middle" y={size * 0.36} fontFamily='"Space Mono", monospace' fontWeight={700} fontSize={size} fill={ink}>
        {text}
      </text>
    </g>
  );
};

const Ghost: React.FC<{ x: number; y: number; text: string; size: number; color?: string; o?: number; rot?: number }> = ({
  x, y, text, size, color = C.ink, o = 0.07, rot = 0,
}) => (
  <text x={x} y={y} textAnchor="middle" transform={`rotate(${rot} ${x} ${y})`} fontFamily='"Space Mono", monospace' fontWeight={700} fontSize={size} fill={color} opacity={o}>
    {text}
  </text>
);

/** motion smear: three stacked bars behind anything entering fast */
const Streak: React.FC<{ x: number; y: number; w: number; h: number; dir?: 1 | -1; o?: number }> = ({
  x, y, w, h, dir = 1, o = 0.18,
}) => (
  <g opacity={o}>
    <rect x={x - dir * (w + 90)} y={y + h * 0.05} width={w} height={h * 0.9} fill={C.ink} />
    <rect x={x - dir * (w + 190)} y={y + h * 0.3} width={w * 0.8} height={h * 0.4} fill={C.ink} />
    <rect x={x - dir * (w + 300)} y={y + h * 0.42} width={w * 0.6} height={h * 0.16} fill={C.ink} />
  </g>
);

/* ------------------------------------------------------------------ shots */

type Ctx = { t: number; talk: number };
type Cam = [number, number, number, number]; // [time, zoom, focusX, focusY]
type Shot = {
  from: number;
  to: number;
  cam: Cam[];
  render: (c: Ctx) => React.ReactNode;
};

/* 1 ── "You're in the room." Candidates slam in from the floor and land. */
const RoomShot: Shot['render'] = ({ t, talk }) => {
  const a = pop(t, 1.02, 0.26);
  const b = pop(t, 1.66, 0.26);
  return (
    <>
      <Backdrop t={t} drift={0.8} />
      <Room t={t} floorY={700} windowX={1560} />
      <Ghost x={960} y={980} text="A / B" size={420} o={0.05} />
      <rect x={520} y={700} width={880} height={18} rx={9} fill={C.ink} opacity={0.09} />
      {t > 1.0 && (
        <g opacity={Math.min(1, a * 1.5)}>
          <Streak x={700} y={420} w={200} h={240} dir={1} o={(1 - a) * 0.5} />
          <g transform={`translate(0,${(1 - a) * 300})`}>
            <Monolith x={700} y={700} scale={1.45} color={C.teal} accent={C.tealLight} mood="smug" idle={t} />
          </g>
        </g>
      )}
      {t > 1.62 && (
        <g opacity={Math.min(1, b * 1.5)}>
          <Streak x={1220} y={420} w={200} h={240} dir={1} o={(1 - b) * 0.5} />
          <g transform={`translate(0,${(1 - b) * 300})`}>
            <Monolith x={1220} y={700} scale={1.45} color="#C98B3E" accent={C.mustard} askew={0.75} mood="deflect" talk={talk} idle={t} />
          </g>
        </g>
      )}
      {t > 1.35 && <g opacity={ramp(t, 1.35, 1.7)}><Plate x={700} y={286} text="CANDIDATE A" size={34} fill={C.ink} ink={C.paper} rot={-3} s={pop(t, 1.35, 0.24)} /></g>}
      {t > 1.95 && <g opacity={ramp(t, 1.95, 2.3)}><Plate x={1220} y={286} text="CANDIDATE B" size={34} fill={C.mustard} ink={C.ink} rot={2.5} s={pop(t, 1.95, 0.24)} /></g>}
    </>
  );
};

/* 2 ── same job / questions / answers. The checklist ticks in time with the VO. */
const SameShot: Shot['render'] = ({ t, talk }) => {
  const items: [string, number][] = [
    ['SAME JOB', T(2)],
    ['SAME QUESTIONS', T(3)],
    ['SAME ANSWERS', T(4)],
  ];
  return (
    <>
      <Backdrop t={t} drift={1.5} />
      <Room t={t} floorY={760} windowX={-220} />
      <Ghost x={1380} y={820} text="A" size={680} o={0.05} />
      {items.map(([s, at], i) => {
        const p = pop(t, at, 0.2);
        return (
          <g key={s} transform={`translate(${300 - (1 - p) * 360},${300 + i * 150}) scale(${p})`} opacity={p > 0 ? 1 : 0}>
            <rect x={0} y={-52} width={700} height={104} rx={10} fill={C.white} />
            <rect x={0} y={-52} width={10} height={104} rx={5} fill={C.teal} />
            <rect x={34} y={-22} width={44} height={44} rx={6} fill={C.ink} />
            {t > at + 0.14 && (
              <path d="M42 -2 L56 -22 L72 6" stroke={C.mustard} strokeWidth={9} fill="none" strokeLinecap="round" strokeLinejoin="round" />
            )}
            <text x={104} y={16} fontFamily='"Space Mono", monospace' fontWeight={700} fontSize={44} fill={C.ink}>
              {s}
            </text>
          </g>
        );
      })}
      <Monolith x={1420} y={880} scale={1.55} color={C.teal} accent={C.tealLight} mood="smug" talk={talk} blink={((t * 0.85) % 1) > 0.95 ? 1 : 0} idle={t} />
    </>
  );
};

/* 3 ── perfect: four ticks and a 100 that is already full. */
const PerfectShot: Shot['render'] = ({ t }) => {
  const marks = [T(5) + 0.1, T(6) + 0.1, T(7) + 0.1, T(8) + 0.1];
  return (
    <>
      <Backdrop t={t} tone="night" drift={2.4} />
      <Ghost x={960} y={470} text="100" size={430} color={C.teal} o={0.13} />
      <g opacity={ramp(t, T(5), T(5) + 0.3)}>
        <Plate x={960} y={230} text="CANDIDATE A" size={44} fill={C.tealLight} ink="#101A20" rot={-2} s={pop(t, T(5), 0.3)} />
      </g>
      {marks.map((m, i) => {
        const on = t > m;
        const p = pop(t, m, 0.18);
        const r = ringOut(t, m, 0.42);
        return (
          <g key={i}>
            {r.on && <circle cx={560 + i * 240} cy={650} r={78 + r.r * 90} fill="none" stroke={C.tealLight} strokeWidth={10 * (1 - r.r)} opacity={0.7} />}
            <g transform={`translate(${560 + i * 240},650) scale(${on ? p : 0.55})`} opacity={on ? 1 : 0.14}>
              <circle cx={0} cy={0} r={78} fill={on ? C.tealLight : '#39474D'} />
              <path d="M-36 2 L-10 32 L40 -30" stroke={on ? '#101A20' : '#39474D'} strokeWidth={16} fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </g>
          </g>
        );
      })}
      <g transform="translate(960,880)">
        <rect x={-470} y={-20} width={940} height={40} rx={20} fill="#2A3940" />
        <rect x={-470} y={-20} width={940 * outCubic(ramp(t, T(5), T(8) + 0.5))} height={40} rx={20} fill={C.mustard} />
      </g>
      <g opacity={ramp(t, T(8) - 0.3, T(8) + 0.2)}>
        <text x={960} y={1010} textAnchor="middle" fontFamily='"Space Mono", monospace' fontWeight={700} fontSize={46} fill={C.mustard}>
          ZERO HESITATION. ZERO FLAWS.
        </text>
      </g>
    </>
  );
};

/* 4 ── B is just as sharp. 92 lands beside A's perfect column. */
const SharpShot: Shot['render'] = ({ t, talk }) => {
  const p = pop(t, T(9) + 0.15, 0.3);
  return (
    <>
      <Backdrop t={t} drift={1.4} />
      <Room t={t} floorY={720} windowX={-240} />
      <Monolith x={560} y={900} scale={1.5} color="#C98B3E" accent={C.mustard} askew={0.16} mood="smile" talk={talk} idle={t} />
      <g transform={`translate(1420,${520 - (1 - p) * 160}) scale(${p})`}>
        <rect x={-260} y={-230} width={520} height={360} rx={14} fill={C.ink} />
        <text textAnchor="middle" y={68} fontFamily='"Space Mono", monospace' fontWeight={700} fontSize={200} fill={C.mustard}>
          92
        </text>
        <text textAnchor="middle" y={118} fontFamily='"Space Mono", monospace' fontSize={30} fill={C.paper} opacity={0.65}>
          SAME SCORE
        </text>
      </g>
      <g opacity={0.28} transform="translate(180,900) scale(0.7)">
        <Monolith x={0} y={0} scale={1} color={C.teal} accent={C.tealLight} mood="flat" idle={t} />
      </g>
    </>
  );
};

/* 5 ── the seam. One block leans out of the column and stays out. */
const SeamShot: Shot['render'] = ({ t, talk }) => {
  const lean = outCubic(ramp(t, T(10) + 0.2, T(10) + 1.6));
  const laugh = ramp(t, T(11), T(11) + 0.35);
  return (
    <>
      <Backdrop t={t} tone="sun" drift={1.2} />
      <Ghost x={960} y={940} text="92" size={760} color={C.ink} o={0.08} />
      <Monolith
        x={880} y={940} scale={1.6} color="#C98B3E" accent="#FFE2A6"
        askew={0.28 + lean * 0.9} askewIndex={2} slide={lean}
        mood={laugh > 0.4 ? 'smile' : 'worry'} talk={talk} idle={t}
      />
      <g opacity={t > T(10) + 0.3 ? 1 : 0} transform={`translate(1360,640) rotate(-6) scale(${pop(t, T(10) + 0.4, 0.24)})`}>
        <Plate x={0} y={0} text="LAST QUARTER" size={38} fill={C.ink} ink={C.mustard} rot={0} />
        <path d="M-240 8 L-120 -4" stroke={C.ink} strokeWidth={8} strokeLinecap="round" />
      </g>
      {laugh > 0.2 &&
        [0, 1, 2, 3].map((i) => (
          <circle key={i} cx={1130 + i * 58} cy={420 - ((t * 240 + i * 70) % 280)} r={9 + i * 4} fill={C.ink} opacity={0.28 * laugh} />
        ))}
      <g opacity={laugh}>
        <Plate x={960} y={1020} text="HE LAUGHS" size={40} fill={C.ink} ink={C.mustard} rot={-2} s={pop(t, T(11) + 0.05, 0.25)} />
      </g>
    </>
  );
};

/* 6 ── logic vs gut. Logic is grey and quiet, gut arrives and takes the frame. */
const GutShot: Shot['render'] = ({ t }) => {
  const gut = pop(t, T(13) + 0.1, 0.26);
  const r = ringOut(t, T(13) + 0.25, 0.6);
  return (
    <>
      <Backdrop t={t} drift={1.8} />
      <Ghost x={960} y={840} text="VS" size={600} o={0.05} />
      <g transform="translate(560,520) scale(0.82)">
        <Plate x={0} y={-56} text="LOGIC" size={62} fill="#BEB6A6" ink="#7C7568" rot={-3} />
        <Plate x={0} y={64} text="A WINS" size={46} fill="#BEB6A6" ink="#7C7568" rot={-3} />
      </g>
      <g transform={`translate(1330,520)`}>
        {r.on && <circle cx={0} cy={-10} r={200 + r.r * 340} fill="none" stroke={C.ink} strokeWidth={16 * (1 - r.r)} />}
        <g transform={`scale(${gut})`}>
          <Plate x={0} y={-70} text="GUT" size={74} fill={C.ink} ink={C.mustard} rot={2} />
          <Plate x={0} y={80} text="B WINS" size={54} fill={C.ink} ink={C.paper} rot={2} />
        </g>
      </g>
      <g opacity={ramp(t, T(14), T(14) + 0.35)}>
        <text x={960} y={980} textAnchor="middle" fontFamily='"Space Mono", monospace' fontWeight={700} fontSize={56} fill={C.ink}>
          AND YOUR GUT IS RIGHT
        </text>
      </g>
    </>
  );
};

/* 7 ── B gets everything. Three wins stack up, one per line, each pointing at B. */
const WinsShot: Shot['render'] = ({ t, talk }) => {
  const items: [string, number][] = [
    ['THE OFFER', T(15)],
    ['THE ALLIES', T(16)],
    ['THE TRUST', T(17)],
  ];
  return (
    <>
      <Backdrop t={t} drift={1.5} />
      <Room t={t} floorY={720} windowX={-240} />
      <Monolith x={520} y={920} scale={1.62} color="#C98B3E" accent={C.mustard} askew={0.85} mood="smile" talk={talk} idle={t} />
      {items.map(([s, at], i) => {
        const p = pop(t, at, 0.22);
        const y = 300 + i * 210;
        return (
          <g key={s} opacity={p > 0 ? 1 : 0}>
            <Streak x={1500} y={y - 50} w={280} h={100} dir={-1} o={(1 - p) * 0.55} />
            <g transform={`translate(${1500 - (1 - p) * 820},${y}) scale(${p})`}>
              <rect x={-320} y={-56} width={640} height={112} rx={12} fill={C.ink} />
              <text textAnchor="middle" y={20} fontFamily='"Space Mono", monospace' fontWeight={700} fontSize={52} fill={C.mustard}>
                {s}
              </text>
            </g>
            <g transform={`translate(${1500},${y + 92}) rotate(${-8})`} opacity={p}>
              <rect x={-46} y={-8} width={92} height={16} rx={8} fill={C.ink} />
              <path d="M-46 0 L-92 -26 L-92 26 Z" fill={C.ink} transform="scale(-1,1)" />
            </g>
          </g>
        );
      })}
    </>
  );
};

/* 8 ── and A? the room closes, everyone stares, A stays perfectly still. */
const HostilityShot: Shot['render'] = ({ t }) => {
  const press = inOut(ramp(t, T(18) + 0.6, TOTAL - 0.4));
  const lvl = Math.round(22 + 10 * press);
  return (
    <>
      <rect x={-600} y={-600} width={V.w + 1200} height={V.h + 1200} fill={`rgb(${lvl},${lvl + 5},${lvl + 8})`} />
      {/* the room heats up under the stares: a red wash bleeds in from the edges */}
      <rect x={-600} y={-600} width={V.w + 1200} height={V.h + 1200} fill="#8E2418" opacity={0.16 * press} />
      {/* silhouettes crowd in from both sides, staring at A */}
      {[
        { x: 130, s: 1.15, at: 0.45, dir: -1 },
        { x: 430, s: 0.95, at: 0.8, dir: -1 },
        { x: V.w - 130, s: 1.2, at: 0.6, dir: 1 },
        { x: V.w - 440, s: 0.98, at: 0.95, dir: 1 },
      ].map((q, i) => {
        const p = outCubic(ramp(t, T(18) + q.at, T(18) + 1.5 + q.at));
        return (
          <g key={i} transform={`translate(${q.x + q.dir * 620 * (1 - p)},${640 + (i % 2) * 90}) scale(${q.s * 1.35})`} opacity={0.96}>
            <Monolith x={0} y={0} color="#0A0F12" accent="#141C21" mood="flat" talk={0} idle={t} />
          </g>
        );
      })}
      <g transform={`translate(960,${1000 - press * 26}) scale(${1.62 - press * 0.16})`}>
        <Monolith x={0} y={0} color={C.teal} accent={C.tealLight} mood="flat" talk={0} idle={t} opacity={0.97} />
      </g>
      <g opacity={ramp(t, T(18) - 0.1, T(18) + 0.2)}>
        <Plate x={960} y={262} text="AND A?" size={76} fill={C.paper} ink="#161C20" rot={-3} s={pop(t, T(18), 0.3)} />
      </g>
      <g opacity={ramp(t, T(19) + 0.4, T(19) + 1.0)}>
        <text x={960} y={1024} textAnchor="middle" fontFamily='"Space Mono", monospace' fontWeight={700} fontSize={42} fill="#F08A6E">
          A QUIETLY FILLS THE ROOM WITH HOSTILITY
        </text>
      </g>
    </>
  );
};

/* -------------------------------------------------------------- shot table */

const SHOTS: Shot[] = [
  { from: 0, to: T(1), cam: [[0, 1.0, 960, 560], [T(1), 1.12, 960, 520]], render: RoomShot },
  { from: T(1), to: T(5), cam: [[T(1), 1.1, 940, 560], [T(4), 1.16, 1010, 580]], render: SameShot },
  { from: T(5), to: T(9), cam: [[T(5), 1.06, 960, 540], [T(8), 1.14, 960, 560]], render: PerfectShot },
  { from: T(9), to: T(10), cam: [[T(9), 1.04, 960, 540], [T(10), 1.13, 900, 560]], render: SharpShot },
  { from: T(10), to: T(12), cam: [[T(10), 1.1, 900, 600], [T(11), 1.2, 960, 620]], render: SeamShot },
  { from: T(12), to: T(15), cam: [[T(12), 1.05, 620, 520], [T(13), 1.12, 1150, 540], [T(14), 1.16, 960, 600]], render: GutShot },
  { from: T(15), to: T(18), cam: [[T(15), 1.06, 900, 560], [T(17), 1.12, 1020, 560]], render: WinsShot },
  { from: T(18), to: TOTAL, cam: [[T(18), 1.08, 960, 520], [T(19), 1.16, 960, 640], [TOTAL, 1.24, 960, 700]], render: HostilityShot },
];

/* ---------------------------------------------------------------- assembly */

const camAt = (shot: Shot, t: number): [number, number, number] => {
  const k = shot.cam;
  if (t <= k[0][0]) return [k[0][1], k[0][2], k[0][3]];
  for (let i = 1; i < k.length; i++) {
    if (t <= k[i][0]) {
      const [t0, z0, x0, y0] = k[i - 1];
      const [t1, z1, x1, y1] = k[i];
      const e = inOut((t - t0) / Math.max(0.001, t1 - t0));
      return [z0 + (z1 - z0) * e, x0 + (x1 - x0) * e, y0 + (y1 - y0) * e];
    }
  }
  const last = k[k.length - 1];
  return [last[1], last[2], last[3]];
};

export const Part1V2: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const mouth = (sec: number) => ENV[Math.max(0, Math.min(ENV.length - 1, Math.round(sec * fps)))] ?? 0;

  const shot = SHOTS.find((s) => t >= s.from && t < s.to) ?? SHOTS[SHOTS.length - 1];
  const local = t - shot.from;

  // slow push for the whole shot, on top of the keyframes: nothing is ever static
  const [z0, fx0, fy0] = camAt(shot, t);
  const push = 1 + local * 0.010;
  const z = z0 * push;
  const fx = fx0;
  const fy = fy0;

  const smear = local >= 0 && local < 0.055 ? 1 - local / 0.055 : 0;
  const shake = local >= 0 && local < 0.11 ? Math.sin(local * 230) * (1 - local / 0.11) * 8 : 0;
  const tx = V.w / 2 - fx * z + shake;
  const ty = V.h / 2 - fy * z + shake * 0.35;

  return (
    <AbsoluteFill style={{ background: C.paper, overflow: 'hidden' }}>
      <svg width={V.w} height={V.h} viewBox={`0 0 ${V.w} ${V.h}`}>
        <defs>
          <filter id="smear" x="-15%" y="-15%" width="130%" height="130%">
            <feGaussianBlur stdDeviation={smear * 26} />
          </filter>
          <radialGradient id="vig" cx="0.5" cy="0.42" r="0.82">
            <stop offset="0.52" stopColor="#000" stopOpacity="0" />
            <stop offset="1" stopColor="#000" stopOpacity="0.15" />
          </radialGradient>
        </defs>

        <g filter={smear > 0.01 ? 'url(#smear)' : undefined}>
          <g transform={`translate(${tx},${ty}) scale(${z})`}>{shot.render({ t, talk: mouth(t) })}</g>
        </g>

        {/* speed lines rake across the frame for 3 frames after each cut */}
        {smear > 0.02 && (
          <g opacity={smear * 0.45}>
            {Array.from({ length: 15 }).map((_, i) => (
              <rect key={i} x={-300 + smear * 1100} y={i * 76} width={220 + i * 46} height={9} fill={i % 2 ? C.ink : C.white} />
            ))}
          </g>
        )}
        <rect x={0} y={0} width={V.w} height={V.h} fill="url(#vig)" pointerEvents="none" />
      </svg>

      {/* the one figure that speaks to camera, only while the opening line lands */}
      {t < T(2) + 0.4 && (
        <svg width={V.w} height={V.h} viewBox={`0 0 ${V.w} ${V.h}`} style={{ position: 'absolute', inset: 0 }}>
          <g transform={`translate(${1690 + (1 - outCubic(ramp(t, 0.1, 0.9))) * 700},1130)`}>
            <g transform={`translate(0,${Math.sin(t * 7.5) * 3})`}>
              <Talker x={0} y={0} scale={0.92} talk={mouth(t)} mood="smile" point={ramp(t, 2.2, 2.8)} idle={t} accent={C.tealLight} />
            </g>
          </g>
        </svg>
      )}

      <Audio src={staticFile('part1_mix_v2.wav')} />
    </AbsoluteFill>
  );
};

export const PART1_V2_FRAMES = Math.max(1, Math.round(TOTAL * 60));
void inCubic;
