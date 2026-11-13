import React from 'react';
import { C } from '../theme';
import { Character, CoffeeCup, Desk, Window, sh } from './Rig';

/* ---------------------------------------------------------------------------
 * Stages — one frame-sized world per beat group (Bang Motion "kartun panggung").
 *
 * Composition rule used everywhere below: content is laid out as if z = 1 IS
 * the frame, with the subject's chest near (960, 540) and nothing important
 * outside x∈[200,1720], y∈[120,980]. Cameras then only push 1.08–1.45, so a
 * push-in tightens on the subject instead of revealing empty wall.
 *
 * Flat fills, no outlines, no texture. Every stage holds ≥10 living objects.
 * ------------------------------------------------------------------------- */

export const wave = (t: number, period = 2.4, phase = 0) => Math.sin((t / period) * Math.PI * 2 + phase);

/* ------------------------------------------------------------------ room --- */
export const Room: React.FC<{ t: number }> = ({ t }) => (
  <g>
    <rect x={-400} y={-400} width={2720} height={1880} fill={C.paper} />
    {/* dado rail + wall tone */}
    <rect x={-400} y={-400} width={2720} height={1560} fill={C.paper} />
    <rect x={-400} y={560} width={2720} height={640} fill="#EBE3D2" />
    <rect x={-400} y={548} width={2720} height={14} fill="#DCD2BC" />
    {/* floor */}
    <rect x={-400} y={860} width={2720} height={400} fill={C.tealLight} />
    <rect x={-400} y={860} width={2720} height={12} fill={sh(C.tealLight, 0.86)} />
    <Window x={1190} y={150} w={520} h={380} shift={wave(t, 6) * 10} />
    {/* wall clock — the stage's heartbeat */}
    <g transform="translate(300,240)">
      <circle r={72} fill={C.paper} />
      <circle r={72} fill="none" stroke={C.ink} strokeWidth={9} />
      <rect x={-4} y={-40} width={8} height={42} rx={4} fill={C.ink} transform={`rotate(${t * 0.6})`} />
      <rect x={-3} y={-58} width={6} height={60} rx={3} fill={C.red} transform={`rotate(${t * 6})`} />
      <circle r={8} fill={C.ink} />
    </g>
    {/* noticeboard */}
    <g transform="translate(1520,600)">
      <rect x={0} y={0} width={230} height={150} rx={8} fill={C.white} />
      <rect x={16} y={22} width={140} height={12} rx={6} fill={C.ink} opacity={0.75} />
      <rect x={16} y={48} width={190} height={12} rx={6} fill={C.ink} opacity={0.4} />
      <rect x={16} y={74} width={110} height={12} rx={6} fill={C.red} opacity={0.8} />
      <circle cx={196} cy={42} r={13} fill={C.red} />
    </g>
  </g>
);

/* ------------------------------------------------------- stage 1: waiting --- */
export const StageWaiting: React.FC<{ t: number; a: number; b: number; aTalk: number; bTalk: number }> = ({
  t,
  a,
  b,
  aTalk,
  bTalk,
}) => (
  <g>
    <Room t={t} />

    {/* ---- candidate A: shoulders square, arms pinned to his sides ---- */}
    <g transform="translate(620,880)">
      <Character
        x={0}
        ground={0}
        scale={1.06}
        expr={a > 0.5 ? 'flat' : 'smug'}
        blink={a > 0.5 ? 0.85 + Math.sin(t * 9) * 0.1 : ((t * 0.34) % 1) > 0.95 ? 1 : 0}
        talk={aTalk}
        look={{ shirt: '#2E4A5A', pants: '#243A47', hair: 'short', tie: true }}
        pose={{
          torso: -2,
          head: a > 0.5 ? -13 : -2,
          armL: -2,
          armR: 2,
          bob: Math.sin(t * 2.2) * 1.2,
        }}
      />
    </g>

    {/* ---- candidate B: weight on one hip, one hand doing the talking ---- */}
    <g transform="translate(1300,880)">
      <Character
        x={0}
        ground={0}
        scale={1.06}
        expr={b > 0.5 ? 'happy' : 'calm'}
        blink={((t * 0.29 + 0.5) % 1) > 0.94 ? 1 : 0}
        talk={bTalk}
        look={{ shirt: C.mustard, pants: '#3B4A4F', hair: 'wave', hairColor: '#5B3A28' }}
        pose={{
          torso: 3,
          head: 5 + wave(t, 3.6) * 3,
          armL: -30 + wave(t, 2.2) * 14,
          foreL: -26,
          armR: -16,
          bob: Math.sin(t * 2.6 + 1) * 1.8,
        }}
      />
    </g>

    {/* name plates sit in the world, above each head */}
    <Plate x={620} y={252} text="CANDIDATE A" fill={C.ink} ink={C.paper} rot={-3} />
    <Plate x={1300} y={252} text="CANDIDATE B" fill={C.mustard} ink={C.ink} rot={2.5} />

    {/* panel desk in the foreground, plus props */}
    <Desk x={-200} y={960} w={2400} h={34} color={C.mustard} />
    <g transform="translate(960,938)">
      <CoffeeCup x={0} y={0} s={0.95} steam={0.5 + wave(t, 3) * 0.4} />
    </g>
    <g transform="translate(1086,944)">
      <rect x={-84} y={0} width={168} height={20} rx={5} fill={C.white} />
      <rect x={-84} y={-16} width={156} height={20} rx={5} fill={C.paper} transform="rotate(-3)" />
    </g>
    {/* fern, leaves breathing */}
    <g transform="translate(1790,900)">
      <path d="M-40 0 L40 0 L28 70 L-28 70 Z" fill="#C86545" />
      {[-42, -16, 10, 36].map((deg, i) => (
        <ellipse
          key={deg}
          cx={0}
          cy={-64}
          rx={28}
          ry={66}
          fill={i % 2 ? '#9DB874' : '#B9CD8E'}
          transform={`rotate(${deg + wave(t, 4 + i * 0.4, i) * 4} 0 -10)`}
        />
      ))}
    </g>
  </g>
);

const Plate: React.FC<{ x: number; y: number; text: string; fill: string; ink: string; rot: number }> = ({
  x,
  y,
  text,
  fill,
  ink,
  rot,
}) => (
  <g transform={`translate(${x},${y}) rotate(${rot})`}>
    <rect x={-150} y={-34} width={300} height={68} rx={10} fill={fill} />
    <text x={0} y={12} textAnchor="middle" fontFamily='"Space Mono", monospace' fontWeight={700} fontSize={32} fill={ink}>
      {text}
    </text>
  </g>
);

/* --------------------------------------------- stage 2: the spill, close --- */
export const StageSpill: React.FC<{ t: number; spill: number; laugh: number }> = ({ t, spill, laugh }) => (
  <g>
    <rect x={-400} y={-400} width={2720} height={1880} fill={C.salmon} />
    <rect x={-400} y={-400} width={2720} height={1880} fill={C.paper} opacity={0.62} />
    <rect x={-400} y={880} width={2720} height={400} fill={C.tealLight} opacity={0.8} />

    {/* he leans back laughing, cup already going over */}
    <g transform="translate(1060,900)">
      <Character
        x={0}
        ground={0}
        scale={1.22}
        expr={laugh > 0.5 ? 'happy' : 'calm'}
        blink={laugh > 0.5 ? 0.9 : ((t * 0.31) % 1) > 0.95 ? 1 : 0}
        talk={0}
        look={{ shirt: C.mustard, pants: '#3B4A4F', hair: 'wave', hairColor: '#5B3A28' }}
        pose={{
          torso: 5,
          head: 9,
          armL: -46 - laugh * 22,
          foreL: -62,
          armR: -22,
          bob: Math.sin(t * 3) * 2,
        }}
      />
    </g>

    {/* the cup is in his hand, tipping over the desk */}
    <g transform="translate(880,780)">
      <CoffeeCup x={0} y={0} s={0.95} tilt={spill * 96} steam={0} />
    </g>
    {spill > 0.3 && (
      <g opacity={Math.min(1, (spill - 0.3) * 3.2)}>
        <path
          d={`M905 745 Q${960 + spill * 20} ${790 - spill * 20} 1010 850 Q1060 900 1120 928`}
          stroke="#6B4B33"
          strokeWidth={22}
          fill="none"
          strokeLinecap="round"
        />
        <ellipse cx={1080} cy={940} rx={230 * spill} ry={30 * spill} fill="#6B4B33" opacity={0.42} />
      </g>
    )}
    <Desk x={-200} y={952} w={2400} h={34} color={C.mustard} />

    {/* laugh ticks */}
    {laugh > 0.35 &&
      [0, 1, 2].map((i) => (
        <rect
          key={i}
          x={1430 + i * 46}
          y={370 - i * 34}
          width={14}
          height={70}
          rx={7}
          fill={C.ink}
          opacity={laugh}
          transform={`rotate(${-26 + i * 24} 1437 ${405 - i * 34})`}
        />
      ))}
  </g>
);

/* ------------------------------------------ stage 3: the 1966 machine room --- */
export const StageMachine: React.FC<{ t: number; spike: number }> = ({ t, spike }) => (
  <g>
    <rect x={-400} y={-400} width={2720} height={1880} fill="#E8E1D0" />
    <rect x={-400} y={880} width={2720} height={400} fill="#C7C9C4" />
    {/* wall pipes */}
    {[0, 1].map((i) => (
      <rect key={i} x={-400} y={150 + i * 92} width={1500} height={28} rx={14} fill={i ? '#B4B8B2' : '#C7CCC6'} />
    ))}
    {/* the tape machine — centred, sized to read at z=1.2 */}
    <g transform="translate(900,900)">
      <rect x={-540} y={-540} width={1080} height={540} rx={26} fill="#8C9391" />
      <rect x={-506} y={-506} width={1012} height={300} rx={16} fill="#6E7674" />
      {[0, 1].map((i) => {
        const x = -250 + i * 500;
        const ang = (t * 210 + i * 90) % 360;
        return (
          <g key={i} transform={`translate(${x},-305)`}>
            <circle r={118} fill="#3F4744" />
            <circle r={100} fill="#59615E" />
            <g transform={`rotate(${ang})`}>
              {[0, 60, 120, 180, 240, 300].map((a) => (
                <circle key={a} cx={0} cy={-56} r={15} fill="#D8D2C4" transform={`rotate(${a})`} />
              ))}
            </g>
            <circle r={28} fill="#D8D2C4" />
          </g>
        );
      })}
      {/* the meter that spikes on the clatter */}
      <g transform="translate(0,-120)">
        <rect x={-190} y={-52} width={380} height={104} rx={12} fill="#2A3230" />
        <path d="M-150 30 A150 150 0 0 1 150 30" fill="none" stroke="#8FE8D4" strokeWidth={6} opacity={0.45} />
        <g transform={`rotate(${-54 + spike * 100 + wave(t, 1.6) * 3})`}>
          <rect x={-4} y={-124} width={8} height={124} rx={4} fill={C.red} />
        </g>
      </g>
      {Array.from({ length: 7 }).map((_, i) => (
        <rect key={i} x={-300 + i * 92} y={-150} width={70} height={10} rx={5} fill="#7B837F" opacity={0.6} />
      ))}
      <rect x={-540} y={-540} width={1080} height={20} rx={10} fill="#9AA19E" />
      <rect x={-540} y={-16} width={1080} height={16} rx={8} fill="#7B837F" />
    </g>
    {/* dust rising — one motion, one opacity */}
    {Array.from({ length: 10 }).map((_, i) => {
      const q = (t * 0.2 + i * 0.12) % 1;
      return (
        <ellipse
          key={i}
          cx={640 + ((i * 97) % 640) + wave(t, 5 + i, i) * 18}
          cy={840 - q * 560}
          rx={14 + i * 2}
          ry={18 + i * 3}
          fill={C.white}
          opacity={0.55 * (1 - q)}
        />
      );
    })}
    {/* researcher, standing at the machine, tapping a dial */}
    <g transform="translate(1590,900)">
      <Character
        x={0}
        ground={0}
        scale={0.94}
        expr="calm"
        blink={((t * 0.27) % 1) > 0.96 ? 1 : 0}
        look={{ shirt: C.white, pants: '#3B4A4F', hair: 'bald', glasses: true }}
        pose={{
          torso: -2,
          head: -6,
          armL: -78 + wave(t, 2.4) * 5,
          foreL: -30,
          armR: -14,
          bob: Math.sin(t * 2) * 1.4,
        }}
      />
    </g>
  </g>
);

/* ------------------------------------------- stage 4/5: tape close-ups --- */
export const StageTape: React.FC<{ t: number; variant: 'a' | 'b'; spike: number; label: string }> = ({
  t,
  variant,
  spike,
  label,
}) => {
  const ang = t * 200;
  return (
    <g>
      <rect x={-400} y={-400} width={2720} height={1880} fill={variant === 'a' ? '#2F3A38' : '#3A2E28'} />
      {/* reel: close-up, deliberately larger than the frame */}
      <g transform="translate(1180,540)">
        <circle r={400} fill="#232B29" />
        <circle r={356} fill="#3F4744" />
        <circle r={252} fill="#59615E" />
        {[0, 1, 2].map((i) => (
          <circle key={i} r={252 - i * 84} fill="none" stroke="#2A3230" strokeWidth={10} opacity={0.45} />
        ))}
        <g transform={`rotate(${ang})`}>
          {[0, 72, 144, 216, 288].map((a) => (
            <rect key={a} x={-24} y={-252} width={48} height={112} rx={14} fill="#D8D2C4" transform={`rotate(${a})`} />
          ))}
        </g>
        <circle r={60} fill="#D8D2C4" />
        <circle r={22} fill="#2A3230" />
      </g>
      {/* waveform strip along the bottom third */}
      <g transform="translate(0,860)">
        <rect x={-400} y={-90} width={2720} height={260} fill="#1D2422" />
        {Array.from({ length: 110 }).map((_, i) => {
          const x = 20 + i * 18;
          const amp =
            Math.abs(Math.sin(i * 0.66 + t * 4.6)) * 52 * (variant === 'b' && i > 78 ? 1 + spike * 2.1 : 1) + 7;
          return <rect key={i} x={x} y={-amp} width={9} height={amp * 2} rx={4} fill="#8FE8D4" opacity={0.85} />;
        })}
      </g>
      <text x={140} y={170} fontFamily='"Space Mono", monospace' fontWeight={700} fontSize={50} fill={variant === 'a' ? C.mustard : C.salmon}>
        {label}
      </text>
      {/* the 92% chip, diegetic */}
      <g transform="translate(140,236)">
        <rect x={0} y={0} width={230} height={80} rx={12} fill={C.mustard} />
        <text x={115} y={56} textAnchor="middle" fontFamily='"Space Mono", monospace' fontWeight={700} fontSize={42} fill={C.ink}>
          92%
        </text>
      </g>
    </g>
  );
};

/* --------------------------------------------------- stage 6: the scoreboard --- */
export const StageScore: React.FC<{ t: number; grow: number }> = ({ t, grow }) => (
  <g>
    <rect x={-400} y={-400} width={2720} height={1880} fill={C.paper} />
    {Array.from({ length: 11 }).map((_, i) => (
      <rect key={i} x={-400} y={-200 + i * 110} width={2720} height={52} fill={C.white} opacity={0.4} />
    ))}
    <text x={150} y={150} fontFamily='"Space Mono", monospace' fontWeight={700} fontSize={42} fill={C.ink} opacity={0.5}>
      LIKABILITY / N = 2 TAPES
    </text>

    {/* two bars on a shared baseline at y=880 */}
    <g transform="translate(740,820)">
      <rect x={-120} y={-420} width={240} height={420} rx={16} fill={C.grey} opacity={0.4} />
      <rect x={-120} y={-420 * 0.62} width={240} height={420 * 0.62} rx={16} fill={C.teal} />
      <text x={0} y={-456} textAnchor="middle" fontFamily='"Space Mono", monospace' fontWeight={700} fontSize={70} fill={C.ink}>
        58
      </text>
      <text x={0} y={80} textAnchor="middle" fontFamily='"Space Mono", monospace' fontWeight={700} fontSize={34} fill={C.ink}>
        FLAWLESS
      </text>
    </g>
    <g transform="translate(1140,820)">
      <rect x={-120} y={-420} width={240} height={420} rx={16} fill={C.grey} opacity={0.4} />
      <rect
        x={-120}
        y={-420 * Math.min(1, 0.62 + 0.36 * grow)}
        width={240}
        height={420 * Math.min(1, 0.62 + 0.36 * grow)}
        rx={16}
        fill={C.mustard}
      />
      <text x={0} y={-456} textAnchor="middle" fontFamily='"Space Mono", monospace' fontWeight={700} fontSize={70} fill={C.ink}>
        {Math.round(58 + 34 * grow)}
      </text>
      <text x={0} y={80} textAnchor="middle" fontFamily='"Space Mono", monospace' fontWeight={700} fontSize={34} fill={C.ink}>
        + COFFEE
      </text>
    </g>

    {/* arrow from the low bar to the high one, drawn in */}
    {grow > 0.15 && (
      <g opacity={Math.min(1, (grow - 0.15) * 3)}>
        <path d="M880 330 Q960 264 1050 330" stroke={C.red} strokeWidth={18} fill="none" strokeLinecap="round" />
        <path d="M1000 292 L1054 332 L990 366" stroke={C.red} strokeWidth={18} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    )}

    {/* listeners, heads bobbing */}
    <g transform="translate(1420,660)">
      {[0, 1, 2].map((i) => (
        <g key={i} transform={`translate(${i * 130},${wave(t, 1.8 + i * 0.2, i) * 8})`}>
          <circle cx={0} cy={0} r={52} fill={C.paper} />
          <circle cx={0} cy={0} r={52} fill="none" stroke={C.ink} strokeWidth={7} opacity={0.12} />
          <path d="M-70 130 Q-70 56 0 56 Q70 56 70 130 Z" fill={C.tealLight} />
        </g>
      ))}
    </g>
  </g>
);

/* --------------------------------------------------- stage 7: the 2×2 grid --- */
export const StageGrid: React.FC<{ t: number; reveal: number; edge: number; marker?: { x: number; y: number } }> = ({
  t,
  reveal,
  edge,
  marker,
}) => (
  <g>
    <rect x={-400} y={-400} width={2720} height={1880} fill={C.paper} />
    <g transform="translate(480,210)">
      {[
        { x: 0, y: 0, f: '#F2CA6B', label: 'PITY' },
        { x: 510, y: 0, f: C.teal, label: 'ADMIRATION' },
        { x: 0, y: 380, f: C.grey, label: 'CONTEMPT' },
        { x: 510, y: 380, f: C.salmon, label: 'ENVY' },
      ].map((q, i) => (
        <g key={q.label} opacity={Math.max(0, Math.min(1, reveal * 4 - i))}>
          <rect x={q.x} y={q.y} width={500} height={360} fill={q.f} />
          <text
            x={q.x + 34}
            y={q.y + 82}
            fontFamily='"Comic Neue", cursive'
            fontWeight={700}
            fontStyle="italic"
            fontSize={54}
            fill={C.ink}
          >
            {q.label}
          </text>
        </g>
      ))}
      {/* axes */}
      <rect x={-22} y={-34} width={14} height={790} fill={C.ink} />
      <rect x={-22} y={742} width={1050} height={14} fill={C.ink} />
      <text x={-22} y={790} fontFamily='"Space Mono", monospace' fontWeight={700} fontSize={26} fill={C.ink} opacity={0.6}>
        LOW COMPETENCE
      </text>
      <text x={1028} y={790} textAnchor="end" fontFamily='"Space Mono", monospace' fontWeight={700} fontSize={26} fill={C.ink} opacity={0.6}>
        HIGH COMPETENCE
      </text>

      {/* the plotted marker (ENVY by default) */}
      <circle
        cx={marker ? marker.x : 860}
        cy={marker ? marker.y : 560}
        r={44 + wave(t, 1.6) * 6}
        fill="none"
        stroke={C.red}
        strokeWidth={7}
        opacity={edge}
      />
      <circle cx={marker ? marker.x : 860} cy={marker ? marker.y : 560} r={30} fill={C.red} opacity={edge} />
    </g>

    {/* the person the grid is about, standing beside it */}
    <g transform="translate(1640,930)">
      <Character
        x={0}
        ground={0}
        scale={0.68}
        expr="calm"
        blink={((t * 0.3) % 1) > 0.95 ? 1 : 0}
        look={{ shirt: '#2E4A5A', pants: '#243A47', hair: 'short', tie: true }}
        pose={{ torso: -1, head: 2, bob: Math.sin(t * 2.1) * 1.4 }}
      />
    </g>
  </g>
);

/* --------------------------------------------- stage 8: the room shrinks --- */
export const StageEnvy: React.FC<{ t: number; press: number }> = ({ t, press }) => (
  <g>
    <rect x={-400} y={-400} width={2720} height={1880} fill="#E0714F" />
    <g transform={`translate(960,560) scale(${1 + press * 0.015})`}>
      <rect x={-1500 + press * 560} y={-800} width={1500} height={1700} fill="#C86545" />
      <rect x={0} y={-800} width={1500 + press * 560} height={1700} fill="#C86545" />
      <rect x={-800} y={-1000 + press * 420} width={1600} height={1000} fill="#D88560" />
      <rect x={-800} y={0} width={1600} height={1000 - press * 260} fill="#D88560" />

      {/* the ring of stares closes in */}
      {Array.from({ length: 7 }).map((_, i) => {
        const a = (-160 + i * 23) * (Math.PI / 180);
        const r = 470 - press * 120;
        const cx = Math.cos(a) * r;
        const cy = Math.sin(a) * r * 0.62 + 60;
        return (
          <g key={i} transform={`translate(${cx},${cy}) scale(0.82)`}>
            <path d="M-74 190 Q-74 74 0 74 Q74 74 74 190 Z" fill="#8E3B27" opacity={0.9} />
            <circle cx={0} cy={0} r={44} fill="#A8563A" />
            <ellipse cx={-16} cy={-4} rx={10} ry={13} fill={C.ink} />
            <ellipse cx={16} cy={-4} rx={10} ry={13} fill={C.ink} />
            <path d="M-12 30 Q0 22 12 30" stroke={C.ink} strokeWidth={5} fill="none" strokeLinecap="round" />
          </g>
        );
      })}
      <Character
        x={0}
        ground={400}
        scale={1.0}
        expr={press > 0.45 ? 'worried' : 'calm'}
        blink={((t * 0.32) % 1) > 0.94 ? 1 : 0}
        look={{ shirt: '#2E4A5A', pants: '#243A47', hair: 'short', tie: true }}
        pose={{ torso: -2, head: -4, armL: 8, armR: -8, bob: Math.sin(t * 2.4) * 1.2 }}
      />
    </g>
  </g>
);

/* ------------------------------------------ stage 9: the marker migrates --- */
export const StageAdmiration: React.FC<{ t: number; move: number; squash: number }> = ({ t, move, squash }) => {
  const mx = 860 - move * 280;
  const my = 560 - move * 380;
  return (
    <g>
      <StageGrid t={t} reveal={1} edge={1} marker={{ x: mx, y: my }} />
      {move > 0.04 && move < 0.99 && (
        <path
          d={`M880 560 Q${880 - 220} ${560 - 240} ${mx} ${my}`}
          stroke={C.ink}
          strokeWidth={7}
          strokeDasharray="16 18"
          fill="none"
          opacity={0.45}
        />
      )}
      {/* the payoff pose, standing where the dot lands */}
      <g transform={`translate(1640,930)`}>
        <Character
          x={0}
          ground={0}
          scale={0.68}
          expr={squash > 0.5 ? 'happy' : 'calm'}
          blink={0}
          look={{ shirt: '#2E4A5A', pants: '#243A47', hair: 'short', tie: true }}
          pose={{
            torso: 2,
            head: -6,
            armL: -20 - squash * 90,
            armR: 20 + squash * 90,
            bob: -10 * squash + Math.sin(t * 3.2) * 2,
          }}
        />
      </g>
    </g>
  );
};

/* --------------------------------------------------- stage 10: payoff --- */
export const StagePayoff: React.FC<{ t: number; hug: number }> = ({ t, hug }) => (
  <g>
    <Room t={t} />
    <g transform="translate(800,900)">
      <Character
        x={0}
        ground={-6}
        scale={1.0}
        expr={hug > 0.3 ? 'happy' : 'worried'}
        blink={((t * 0.3) % 1) > 0.95 ? 1 : 0}
        look={{ shirt: '#2E4A5A', pants: '#243A47', hair: 'short', tie: true }}
        pose={{
          torso: -1,
          head: -8,
          armL: -14 - hug * 70,
          armR: 14 + hug * 70,
          bob: Math.sin(t * 2.4) * 1.8,
        }}
      />
    </g>
    <g transform="translate(1180,900)">
      <Character
        x={0}
        ground={-6}
        scale={1.04}
        expr="happy"
        blink={0}
        look={{ shirt: C.mustard, pants: '#3B4A4F', hair: 'wave', hairColor: '#5B3A28' }}
        pose={{
          torso: 4,
          head: 6,
          armL: -44 - hug * 66,
          foreL: -34,
          armR: -26,
          bob: Math.sin(t * 2.8 + 1) * 2.4,
        }}
      />
    </g>
    <Desk x={-200} y={1010} w={2400} h={34} color={C.mustard} />
    {/* paper confetti, deterministic */}
    {Array.from({ length: 14 }).map((_, i) => {
      const q = (t * 0.26 + i * 0.11) % 1;
      return (
        <rect
          key={i}
          x={300 + ((i * 149) % 1300)}
          y={-60 + q * 1100}
          width={16}
          height={24}
          rx={4}
          fill={[C.mustard, C.salmon, C.teal, C.white][i % 4]}
          opacity={0.7 * (1 - Math.abs(q - 0.5) * 1.5)}
          transform={`rotate(${(i * 47 + t * 90) % 360} ${300 + ((i * 149) % 1300)} ${-60 + q * 1100})`}
        />
      );
    })}
  </g>
);
