import React from 'react';
import { useCurrentFrame } from 'remotion';
import { revealAt } from '../anim';
import { CrtMonitor, Doodles } from '../art/Doodles';
import { AudienceRow, StandingPerson } from '../art/People';
import {
  Callout,
  ComicPanel,
  Gear,
  HandLabel,
  SketchArrow,
  Sparkle,
  Star,
} from '../art/Sketch';
import { Stamp } from '../components/Ink';
import { C, FONT_HEAD, FONT_MONO, SHADOW_SM, tint } from '../theme';
import type { Beat } from '../timeline';

const SCREEN_W = 700;
const SCREEN_H = 316;

/** Chunky oscilloscope trace that spikes when the cup falls. */
const Waveform: React.FC<{ frame: number; spike: number }> = ({ frame, spike }) => {
  const pts: string[] = [];
  for (let i = 0; i <= 150; i++) {
    const x = (i / 150) * SCREEN_W;
    const t = i / 7.5 + frame / 8;
    const env = 0.3 + 0.55 * Math.abs(Math.sin(i / 21 + 0.4));
    const burst = i > 118 ? 1 + spike * 2.2 * Math.sin((i - 118) / 1.9) : 1;
    const y = SCREEN_H / 2 + (Math.sin(t) * 74 + Math.sin(t * 2.6) * 20) * env * burst;
    pts.push(`${x.toFixed(1)},${Math.max(8, Math.min(SCREEN_H - 8, y)).toFixed(1)}`);
  }
  return (
    <svg width={SCREEN_W} height={SCREEN_H} viewBox={`0 0 ${SCREEN_W} ${SCREEN_H}`}>
      {[1, 2, 3, 4].map((i) => (
        <line
          key={i}
          x1={0}
          x2={SCREEN_W}
          y1={(SCREEN_H / 5) * i}
          y2={(SCREEN_H / 5) * i}
          stroke={tint(C.tealLight, 0.15)}
          strokeWidth={1}
        />
      ))}
      <line
        x1={0}
        x2={SCREEN_W}
        y1={SCREEN_H / 2}
        y2={SCREEN_H / 2}
        stroke={tint(C.mustard, 0.5)}
        strokeWidth={2}
        strokeDasharray="10 7"
      />
      <polyline points={pts.join(' ')} fill="none" stroke="#6FD3C0" strokeWidth={10} opacity={0.18} />
      <polyline points={pts.join(' ')} fill="none" stroke="#8FE8D4" strokeWidth={3.5} strokeLinejoin="round" />
    </svg>
  );
};

const TapeReel: React.FC<{ label: string; active: boolean; frame: number; offset: number }> = ({
  label,
  active,
  frame,
  offset,
}) => {
  const angle = (frame * (active ? 2.4 : 0.3) + offset) % 360;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <svg width={86} height={86} viewBox="0 0 128 128">
        <circle cx={64} cy={64} r={58} fill={C.paper} stroke={C.ink} strokeWidth={5} />
        <circle cx={64} cy={64} r={44} fill={active ? C.mustard : C.grey} stroke={C.ink} strokeWidth={4} />
        <g transform={`rotate(${angle} 64 64)`}>
          {[0, 60, 120, 180, 240, 300].map((a) => (
            <rect
              key={a}
              x={59}
              y={30}
              width={10}
              height={18}
              rx={2}
              fill={C.paper}
              stroke={C.ink}
              strokeWidth={2}
              transform={`rotate(${a} 64 64)`}
            />
          ))}
        </g>
        <circle cx={64} cy={64} r={12} fill={C.ink} />
      </svg>
      <div
        style={{
          fontFamily: FONT_MONO,
          fontWeight: 700,
          fontSize: 11,
          background: active ? C.ink : C.paper,
          color: active ? C.white : C.ink,
          border: `2px solid ${C.ink}`,
          padding: '1px 7px',
        }}
      >
        {label}
      </div>
    </div>
  );
};

/** Cartoon mug that tips over on cue. */
const TippingCup: React.FC<{ tilt: number; spill: number; size?: number }> = ({ tilt, spill, size = 118 }) => (
  <svg width={size} height={size} viewBox="0 0 160 160" style={{ overflow: 'visible' }}>
    <g transform={`rotate(${tilt} 80 70)`}>
      <path d="M46 40 L114 40 L106 106 L54 106 Z" fill={C.white} stroke={C.ink} strokeWidth={5} strokeLinejoin="round" />
      <ellipse cx={80} cy={40} rx={34} ry={9} fill={C.white} stroke={C.ink} strokeWidth={5} />
      <ellipse cx={80} cy={42} rx={25} ry={5} fill={C.salmon} />
      <path d="M114 50 C140 46 140 88 104 86" fill="none" stroke={C.ink} strokeWidth={6} strokeLinecap="round" />
      <path d="M58 62 L102 62" stroke={C.teal} strokeWidth={5} opacity={0.7} />
    </g>
    {spill > 0.05 && (
      <g opacity={Math.min(1, spill * 1.5)}>
        <ellipse cx={90} cy={132} rx={52 * spill} ry={12 * spill} fill={C.salmon} stroke={C.ink} strokeWidth={3} />
        <circle cx={28} cy={116} r={6 * spill} fill={C.salmon} stroke={C.ink} strokeWidth={2} />
        <circle cx={44} cy={102} r={4 * spill} fill={C.salmon} />
      </g>
    )}
    <g opacity={spill} stroke={C.ink} strokeWidth={4} strokeLinecap="round">
      <path d="M126 22 L140 34" />
      <path d="M138 12 L152 12" />
      <path d="M120 8 L128 0" />
    </g>
  </svg>
);

const Bar: React.FC<{
  label: string;
  height: number;
  color: string;
  value: string;
  grow?: number;
}> = ({ label, height, color, value, grow = 1 }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
    <div style={{ fontFamily: FONT_MONO, fontWeight: 700, fontSize: 15 }}>{value}</div>
    <div
      style={{
        width: 66,
        height: height * grow,
        background: color,
        border: `3px solid ${C.ink}`,
        boxShadow: SHADOW_SM,
      }}
    />
    <div style={{ fontFamily: FONT_MONO, fontWeight: 700, fontSize: 11, textAlign: 'center', lineHeight: 1.2 }}>
      {label}
    </div>
  </div>
);

export const LabSection: React.FC<{ beat: Beat; localFrame: number }> = ({ beat, localFrame }) => {
  const frame = useCurrentFrame();
  const s = beat.stateIndex;
  const takeB = s >= 4;
  const spill = revealAt(s, 6, localFrame, true, 34);
  const cupTilt = 12 + revealAt(s, 6, localFrame, true, 40) * 62;
  const personSpill = revealAt(s, 6, localFrame, true, 36);
  const bars = revealAt(s, 0, localFrame, false, 34);
  const jump = revealAt(s, 9, localFrame, true, 40);
  const stamp = revealAt(s, 10, localFrame, true, 32);
  const crowd = revealAt(s, 8, localFrame, true, 36);
  const recPulse = 0.4 + 0.6 * Math.abs(Math.sin(frame / 7));

  return (
    <div style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%' }}>
      <Doodles seed={2} items={['gear', 'sparkle', 'star']} opacity={0.9} />

      {/* ============ LEFT: the experiment ============ */}
      <div style={{ position: 'absolute', left: 6, top: 0 }}>
        <CrtMonitor width={880} height={392} accent={C.grey}>
          <div style={{ position: 'absolute', left: 14, top: 12 }}>
            <span
              style={{
                fontFamily: FONT_MONO,
                fontWeight: 700,
                fontSize: 12,
                color: '#8FE8D4',
                letterSpacing: 1,
              }}
            >
              ARONSON LAB / 1966
            </span>
          </div>
          <div style={{ position: 'absolute', right: 16, top: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: C.red,
                display: 'inline-block',
                opacity: recPulse,
              }}
            />
            <span style={{ fontFamily: FONT_MONO, fontSize: 11, fontWeight: 700, color: C.mustard }}>REC</span>
          </div>
          <div style={{ position: 'absolute', left: 25, top: 38 }}>
            <Waveform frame={frame} spike={s >= 6 ? 1 : 0} />
          </div>
          <div
            style={{
              position: 'absolute',
              left: 20,
              bottom: 14,
              background: C.mustard,
              border: `3px solid ${C.ink}`,
              padding: '4px 10px',
              fontFamily: FONT_MONO,
              fontWeight: 700,
              fontSize: 20,
              transform: 'rotate(-1.5deg)',
            }}
          >
            QUIZ SCORE: 92%
          </div>
          <div
            style={{
              position: 'absolute',
              right: 20,
              bottom: 18,
              fontFamily: FONT_MONO,
              fontWeight: 700,
              fontSize: 12,
              color: C.paper,
              opacity: 0.8,
            }}
          >
            {takeB ? 'TAKE 02 / CLATTER' : 'TAKE 01 / CLEAN'}
          </div>
        </CrtMonitor>
      </div>

      {/* keyboard sits under the CRT */}
      <div
        style={{
          position: 'absolute',
          left: 196,
          top: 396,
          width: 490,
          height: 34,
          background: C.grey,
          border: `4px solid ${C.ink}`,
          borderRadius: 8,
          boxShadow: `4px 4px 0 ${C.ink}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 5,
        }}
      >
        {Array.from({ length: 18 }).map((_, i) => (
          <div
            key={i}
            style={{
              width: 18,
              height: 14,
              background: C.paper,
              border: `2px solid ${C.ink}`,
              borderRadius: 3,
              opacity: 0.9,
            }}
          />
        ))}
      </div>

      {/* reels + person + cup */}
      <div style={{ position: 'absolute', left: 8, top: 420, display: 'flex', alignItems: 'flex-end', gap: 12 }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <TapeReel label="A" active={!takeB} frame={frame} offset={0} />
          <TapeReel label="B" active={takeB} frame={frame} offset={40} />
        </div>
        <div style={{ position: 'relative', width: 240 }}>
          <StandingPerson size={196} accent={C.teal} spill={personSpill} pose={0.4} />
          <div style={{ position: 'absolute', right: -6, top: 40 }}>
            <TippingCup tilt={cupTilt} spill={spill} size={116} />
          </div>
        </div>
      </div>

      {/* ============ RIGHT: callout + likability ============ */}
      <div style={{ position: 'absolute', left: 890, top: 0, width: 872 }}>
        <ComicPanel
          title="COFFEE SPILL EVENT"
          tag="ZOOM-OUT · TAKE 02"
          bg={C.paper}
          barColor={C.salmon}
          style={{ height: 288 }}
        >
          <div style={{ position: 'absolute', left: 18, top: 56 }}>
            <Callout bg={C.white} dashed rotate={-1.5} width={286}>
              <div style={{ fontSize: 11, opacity: 0.6, letterSpacing: 1 }}>T + 00:47</div>
              <div style={{ marginTop: 5 }}>STIMULUS: CUP CLATTER</div>
              <div>SURFACE: SUIT, FLOOR</div>
            </Callout>
          </div>
          <div style={{ position: 'absolute', left: 48, top: 158 }}>
            <TippingCup tilt={cupTilt} spill={spill} size={140} />
          </div>
          <div style={{ position: 'absolute', right: 26, top: 66, textAlign: 'right' }}>
            <div style={{ fontFamily: FONT_MONO, fontWeight: 700, fontSize: 13, opacity: 0.7 }}>
              COMPETENCE SCORE
            </div>
            <div
              style={{
                fontFamily: FONT_HEAD,
                fontWeight: 700,
                fontStyle: 'italic',
                fontSize: 44,
                color: C.ink,
                lineHeight: 1,
                marginTop: 4,
              }}
            >
              92% → 92%
            </div>
            <div
              style={{
                display: 'inline-block',
                marginTop: 10,
                background: C.teal,
                border: `3px solid ${C.ink}`,
                boxShadow: SHADOW_SM,
                padding: '5px 10px',
                fontFamily: FONT_MONO,
                fontWeight: 700,
                fontSize: 13,
                transform: 'rotate(-2deg)',
              }}
            >
              NOT ONE POINT DEDUCTED
            </div>
          </div>
          <div style={{ position: 'absolute', left: 330, top: 232 }}>
            <HandLabel size={22} rotate={-2}>
              SAME GENIUS, ONE SLIP
            </HandLabel>
          </div>
        </ComicPanel>

        <ComicPanel
          title="LIKABILITY RATING"
          tag="LISTENERS / n = 2 TAPES"
          number={3}
          bg={C.white}
          style={{ marginTop: 14, height: 256 }}
        >
          <div style={{ position: 'relative', height: 218, marginTop: 2 }}>
            <div style={{ position: 'absolute', left: 18, top: 8 }}>
              <AudienceRow count={5} width={170} ready={crowd} color={C.tealLight} />
            </div>
            <div style={{ position: 'absolute', left: 240, bottom: 0, display: 'flex', gap: 62, alignItems: 'flex-end' }}>
              <Bar label="FLAWLESS" height={92} color={C.grey} value="58" grow={bars} />
              <Bar
                label="+ COFFEE"
                height={92}
                color="#4E9E8F"
                value={`${Math.round(58 + jump * 34)}`}
                grow={bars * (1 + jump * 0.5)}
              />
            </div>
            <div
              style={{
                position: 'absolute',
                left: 542,
                top: 54,
                opacity: jump,
                transform: `scale(${0.7 + jump * 0.3}) rotate(4deg)`,
              }}
            >
              <div
                style={{
                  background: C.mustard,
                  border: `3px solid ${C.ink}`,
                  boxShadow: SHADOW_SM,
                  padding: '6px 12px',
                  fontFamily: FONT_MONO,
                  fontWeight: 700,
                  fontSize: 24,
                }}
              >
                +34%
              </div>
            </div>
            <div style={{ position: 'absolute', left: 236, top: 0 }}>
              <HandLabel size={18} rotate={-1} underline={false}>
                LIKABILITY SKYROCKETED
              </HandLabel>
            </div>
          </div>
        </ComicPanel>
      </div>

      {/* pratfall stamp */}
      <div
        style={{
          position: 'absolute',
          left: 430,
          top: 596,
          opacity: stamp,
          transform: `rotate(-6deg) scale(${0.85 + stamp * 0.15})`,
          pointerEvents: 'none',
        }}
      >
        <Stamp color="#4E9E8F" rotate={0} fontSize={30}>
          PRATFALL EFFECT
        </Stamp>
      </div>

      <div style={{ position: 'absolute', left: 420, top: 558 }}>
        <HandLabel size={19} rotate={-1.2} underline={false}>
          THE SAME GENIUS, ONE HUMAN SLIP
        </HandLabel>
      </div>

      {/* floating doodles */}
      <div style={{ position: 'absolute', right: 40, top: 620, opacity: jump }}>
        <Sparkle size={34} color={C.mustard} pop={jump} rotate={frame * 0.8} />
      </div>
      <div style={{ position: 'absolute', right: 250, top: 66, opacity: stamp }}>
        <Star size={30} color={C.salmon} rotate={12} pop={stamp} />
      </div>
      <div style={{ position: 'absolute', left: 700, top: 372, opacity: spill }}>
        <SketchArrow w={104} color={C.salmon} rotate={22} />
      </div>
    </div>
  );
};
