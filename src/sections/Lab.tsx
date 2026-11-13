import React from 'react';
import { useCurrentFrame } from 'remotion';
import { revealAt } from '../anim';
import { InkPanel, Stamp, Tag } from '../components/Ink';
import { C, FONT_MONO, SHADOW_SM, tint } from '../theme';
import { FigureLegend } from './SectionHeader';
import type { Beat } from '../timeline';

const SCREEN = { x: 22, y: 44, w: 800, h: 186 };
const DECK = { w: 846, h: 596 };
const RIGHT = { left: 874, w: 746 };
const BAR_H = 74;

/** Crisp waveform drawn as a single SVG polyline. */
const Waveform: React.FC<{ frame: number; spike: number }> = ({ frame, spike }) => {
  const pts: string[] = [];
  for (let i = 0; i <= 190; i++) {
    const x = (i / 190) * SCREEN.w;
    const t = i / 9 + frame / 9;
    const env = 0.24 + 0.6 * Math.abs(Math.sin(i / 27 + 0.4));
    const burst = i > 148 ? 1 + spike * 2.4 * Math.sin((i - 148) / 2.1) : 1;
    const y =
      SCREEN.h / 2 +
      (Math.sin(t) * 56 + Math.sin(t * 2.7) * 14 + Math.sin(t * 0.37) * 9) *
        env *
        burst;
    pts.push(`${x.toFixed(1)},${Math.max(6, Math.min(SCREEN.h - 6, y)).toFixed(1)}`);
  }
  return (
    <svg
      width={SCREEN.w}
      height={SCREEN.h}
      viewBox={`0 0 ${SCREEN.w} ${SCREEN.h}`}
      style={{ display: 'block' }}
    >
      <rect x={0} y={0} width={SCREEN.w} height={SCREEN.h} fill={C.screen} />
      {[1, 2, 3, 4, 5].map((i) => (
        <line
          key={`h${i}`}
          x1={0}
          x2={SCREEN.w}
          y1={(SCREEN.h / 6) * i}
          y2={(SCREEN.h / 6) * i}
          stroke={tint(C.tealLight, 0.13)}
          strokeWidth={1}
        />
      ))}
      {Array.from({ length: 15 }).map((_, i) => (
        <line
          key={`v${i}`}
          x1={((i + 1) * SCREEN.w) / 16}
          x2={((i + 1) * SCREEN.w) / 16}
          y1={0}
          y2={SCREEN.h}
          stroke={tint(C.tealLight, 0.13)}
          strokeWidth={1}
        />
      ))}
      <line
        x1={0}
        x2={SCREEN.w}
        y1={SCREEN.h / 2}
        y2={SCREEN.h / 2}
        stroke={tint(C.mustard, 0.4)}
        strokeWidth={2}
        strokeDasharray="8 6"
      />
      <polyline points={pts.join(' ')} fill="none" stroke={C.teal} strokeWidth={9} opacity={0.2} />
      <polyline points={pts.join(' ')} fill="none" stroke={C.tealLight} strokeWidth={3} />
    </svg>
  );
};

const TapeReel: React.FC<{ label: string; active: boolean; frame: number; offset: number }> = ({
  label,
  active,
  frame,
  offset,
}) => {
  const angle = (frame * (active ? 2.1 : 0.25) + offset) % 360;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
      <svg width={92} height={92} viewBox="0 0 128 128">
        <circle cx={64} cy={64} r={58} fill={C.paper} stroke={C.ink} strokeWidth={4} />
        <circle cx={64} cy={64} r={44} fill={active ? C.mustard : C.grey} stroke={C.ink} strokeWidth={3} />
        <g transform={`rotate(${angle} 64 64)`}>
          {[0, 60, 120, 180, 240, 300].map((a) => (
            <rect
              key={a}
              x={59}
              y={18}
              width={10}
              height={30}
              rx={2}
              fill={C.paper}
              stroke={C.ink}
              strokeWidth={2}
              transform={`rotate(${a} 64 64)`}
            />
          ))}
        </g>
        <circle cx={64} cy={64} r={12} fill={C.ink} />
        <circle cx={64} cy={64} r={4} fill={C.paper} />
      </svg>
      <div
        style={{
          fontFamily: FONT_MONO,
          fontWeight: 700,
          fontSize: 12,
          background: active ? C.ink : C.paper,
          color: active ? C.white : C.ink,
          border: `2px solid ${C.ink}`,
          padding: '1px 6px',
        }}
      >
        {label}
      </div>
    </div>
  );
};

const Bar: React.FC<{
  label: string;
  height: number;
  color: string;
  value: string;
  grow?: number;
}> = ({ label, height, color, value, grow = 1 }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
    <div style={{ fontFamily: FONT_MONO, fontWeight: 700, fontSize: 14 }}>{value}</div>
    <div
      style={{
        width: 74,
        height: height * grow,
        background: color,
        border: `3px solid ${C.ink}`,
        boxShadow: SHADOW_SM,
        position: 'relative',
      }}
    >
      {[0.25, 0.5, 0.75].map((f) => (
        <div
          key={f}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: `${f * 100}%`,
            height: 2,
            background: tint(C.ink, 0.35),
          }}
        />
      ))}
    </div>
    <div
      style={{
        fontFamily: FONT_MONO,
        fontWeight: 700,
        fontSize: 11,
        textAlign: 'center',
        lineHeight: 1.2,
      }}
    >
      {label}
    </div>
  </div>
);

export const LabSection: React.FC<{ beat: Beat; localFrame: number }> = ({ beat, localFrame }) => {
  const frame = useCurrentFrame();
  const s = beat.stateIndex;
  const takeB = s >= 5;
  const spill = revealAt(s, 6, localFrame, true, 32);
  const cupTilt = 22 + revealAt(s, 7, localFrame, true, 40) * 24;
  const bars = revealAt(s, 0, localFrame, false, 34);
  const jump = revealAt(s, 10, localFrame, true, 40);
  const stamp = revealAt(s, 10, localFrame, true, 32);
  const recPulse = 0.4 + 0.6 * Math.abs(Math.sin(frame / 7));

  return (
    <div style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%' }}>
      {/* ============ CRT / TAPE DECK ============ */}
      <InkPanel style={{ position: 'absolute', left: 0, top: 0, width: 890, height: 596 }} bg={C.grey}>
        <div
          style={{
            height: 38,
            background: C.ink,
            color: C.white,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 14px',
            fontFamily: FONT_MONO,
            fontWeight: 700,
            fontSize: 14,
            letterSpacing: 0.8,
          }}
        >
          <span>ARONSON LAB / TAPE RECORDER · 1966</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <span
              style={{
                width: 11,
                height: 11,
                borderRadius: '50%',
                background: C.red,
                display: 'inline-block',
                opacity: recPulse,
              }}
            />
            REC
          </span>
        </div>

        {/* scope screen */}
        <div
          style={{
            position: 'absolute',
            left: SCREEN.x,
            top: SCREEN.y,
            width: SCREEN.w,
            height: SCREEN.h,
            border: `4px solid ${C.ink}`,
            background: C.screen,
            overflow: 'hidden',
          }}
        >
          <Waveform frame={frame} spike={s >= 5 ? 1 : 0} />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'repeating-linear-gradient(to bottom, rgba(0,0,0,0.2) 0px, rgba(0,0,0,0.2) 2px, transparent 2px, transparent 5px)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: 10,
              bottom: 7,
              fontFamily: FONT_MONO,
              fontWeight: 700,
              fontSize: 11,
              color: C.tealLight,
              letterSpacing: 0.8,
              opacity: 0.85,
            }}
          >
            CH1 / VOICE TRACE
          </div>
          <div
            style={{
              position: 'absolute',
              right: 10,
              top: 7,
              fontFamily: FONT_MONO,
              fontWeight: 700,
              fontSize: 11,
              color: C.mustard,
            }}
          >
            {takeB ? 'TAKE 02 / CLATTER' : 'TAKE 01 / CLEAN'}
          </div>
        </div>

        {/* readout */}
        <div
          style={{
            position: 'absolute',
            left: 22,
            top: 244,
            width: 800,
            height: 44,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <div
            style={{
              background: C.mustard,
              border: `3px solid ${C.ink}`,
              boxShadow: SHADOW_SM,
              padding: '5px 13px',
              fontFamily: FONT_MONO,
              fontWeight: 700,
              fontSize: 24,
              letterSpacing: -0.4,
            }}
          >
            QUIZ SCORE: 92%
          </div>
          <Tag bg={takeB ? C.salmon : C.tealLight} size={13}>
            {takeB ? 'TAKE 02' : 'TAKE 01'}
          </Tag>
          <div style={{ flex: 1 }} />
          <div style={{ fontFamily: FONT_MONO, fontSize: 12, fontWeight: 700, opacity: 0.72 }}>
            92 / 100 CORRECT
          </div>
        </div>

        <div style={{ position: 'absolute', left: 22, top: 298, width: 800, height: 3, background: C.ink }} />

        {/* reels + meters */}
        <div
          style={{
            position: 'absolute',
            left: 22,
            top: 310,
            width: 800,
            height: 274,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 22,
          }}
        >
          <TapeReel label="TAPE A" active={!takeB && s >= 1} frame={frame} offset={0} />
          <TapeReel label="TAPE B" active={takeB} frame={frame} offset={30} />
          <div style={{ flex: 1 }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: 320 }}>
            <div style={{ fontFamily: FONT_MONO, fontWeight: 700, fontSize: 12 }}>
              SIGNAL LEVEL / dB
            </div>
            <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', height: 44 }}>
              {Array.from({ length: 20 }).map((_, i) => {
                const h = 8 + Math.abs(Math.sin(i / 2.6 + frame / 6)) * 32;
                return (
                  <div
                    key={i}
                    style={{
                      width: 7,
                      height: h,
                      background: i > 17 ? C.red : i > 13 ? C.mustard : C.teal,
                      border: `2px solid ${C.ink}`,
                    }}
                  />
                );
              })}
            </div>
            <div
              style={{
                marginTop: 8,
                border: `3px solid ${C.ink}`,
                background: C.paper,
                padding: '6px 9px',
                fontFamily: FONT_MONO,
                fontWeight: 700,
                fontSize: 11,
                lineHeight: 1.6,
              }}
            >
              <div>STIMULUS +1 / CUP OF COFFEE</div>
              <div>SUBJECT / SAME GENIUS</div>
              <div style={{ color: C.red }}>SCORE / 92% UNCHANGED</div>
            </div>
          </div>
        </div>
      </InkPanel>

      {/* ============ DASHED ZOOM-OUT CALLOUT ============ */}
      <div
        style={{
          position: 'absolute',
          left: RIGHT.left,
          top: 0,
          width: RIGHT.w,
          height: 300,
          opacity: 0.4 + 0.6 * spill,
          transform: `scale(${0.96 + 0.04 * spill})`,
          transformOrigin: 'left top',
        }}
      >
        <InkPanel style={{ width: RIGHT.w, height: 300 }} bg={C.paper}>
          <svg
            width={RIGHT.w}
            height={300}
            style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
          >
            <rect
              x={6}
              y={6}
              width={RIGHT.w - 12}
              height={286}
              fill="none"
              stroke={C.ink}
              strokeWidth={3}
              strokeDasharray="6 4"
            />
          </svg>
          <div style={{ position: 'absolute', left: 18, top: 14 }}>
            <Tag bg={C.salmon} size={17}>
              COFFEE SPILL EVENT
            </Tag>
          </div>
          <div
            style={{
              position: 'absolute',
              left: 20,
              top: 88,
              fontFamily: FONT_MONO,
              fontWeight: 700,
              fontSize: 12,
              opacity: 0.7,
              writingMode: 'vertical-rl',
              letterSpacing: 1,
            }}
          >
            ZOOM-OUT / DETAIL
          </div>
          <div style={{ position: 'absolute', left: 62, top: 116 }}>
            <CoffeeCup size={190} tilt={cupTilt} />
          </div>
          <div
            style={{
              position: 'absolute',
              left: 276,
              top: 74,
              width: 552,
              fontFamily: FONT_MONO,
              fontSize: 15,
              fontWeight: 700,
              lineHeight: 1.85,
            }}
          >
            <div>T + 00:47 / TAKE 02</div>
            <div>STIMULUS: CUP CLATTER</div>
            <div>SURFACE: SUIT, FLOOR</div>
            <div style={{ marginTop: 8, color: C.red }}>COMPETENCE: 92% → 92%</div>
            <div style={{ marginTop: 8, fontSize: 13, opacity: 0.72 }}>
              NO RESPECT LOST. ONLY THE WALL CAME DOWN.
            </div>
          </div>
        </InkPanel>
      </div>

      {/* dashed leader: scope → callout */}
      <svg
        width="100%"
        height="100%"
        style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: spill }}
      >
        <rect
          x={SCREEN.x + 668}
          y={SCREEN.y + 86}
          width={124}
          height={84}
          fill="none"
          stroke={C.red}
          strokeWidth={3}
          strokeDasharray="6 4"
        />
        <path
          d={`M${SCREEN.x + 792} ${SCREEN.y + 100} L${SCREEN.x + 840} ${SCREEN.y + 30} L${RIGHT.left} ${SCREEN.y + 30}`}
          fill="none"
          stroke={C.ink}
          strokeWidth={3}
          strokeDasharray="6 4"
        />
      </svg>

      {/* ============ LIKABILITY BAR CHART ============ */}
      <InkPanel style={{ position: 'absolute', left: RIGHT.left, top: 318, width: RIGHT.w, height: 278 }} bg={C.white}>
        <div
          style={{
            height: 34,
            borderBottom: `3px solid ${C.ink}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 13px',
            fontFamily: FONT_MONO,
            fontWeight: 700,
            fontSize: 13,
            letterSpacing: 0.5,
          }}
        >
          <span>LIKABILITY RATING / LISTENERS</span>
          <span style={{ opacity: 0.6 }}>n = 2 TAPES</span>
        </div>
        <div style={{ position: 'absolute', left: 18, right: 18, top: 42, bottom: 12 }}>
          {[25, 50, 75].map((t) => (
            <div
              key={t}
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: `${((t - 20) / 80) * BAR_H}px`,
                borderTop: `2px dashed ${tint(C.ink, 0.28)}`,
              }}
            />
          ))}
          <div
            style={{
              position: 'absolute',
              left: 40,
              bottom: 4,
              display: 'flex',
              gap: 62,
              alignItems: 'flex-end',
              opacity: bars,
            }}
          >
            <Bar label="FLAWLESS" height={BAR_H} color={C.grey} value="58" />
            <Bar
              label="+ COFFEE SPILL"
              height={BAR_H}
              grow={1 + jump * 0.585}
              color={C.teal}
              value={`${Math.round(58 + jump * 34)}`}
            />
          </div>
          <div
            style={{
              position: 'absolute',
              left: 286,
              top: 22,
              opacity: jump,
              transform: `scale(${0.7 + jump * 0.3})`,
            }}
          >
            <Tag bg={C.mustard} size={28}>
              +34%
            </Tag>
          </div>
          <div
            style={{
              position: 'absolute',
              right: 1,
              top: 6,
              textAlign: 'right',
              fontFamily: FONT_MONO,
              fontWeight: 700,
              fontSize: 11,
              lineHeight: 1.55,
              opacity: s >= 9 ? 1 : 0.4,
            }}
          >
            <div>NO RESPECT LOST</div>
            <div style={{ opacity: 0.7 }}>0 PTS DEDUCTED</div>
          </div>
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 8,
              fontFamily: FONT_MONO,
              fontWeight: 700,
              fontSize: 12,
              opacity: 0.6,
            }}
          >
            SCALE 0–100
          </div>
        </div>
      </InkPanel>

      <FigureLegend
        items={[
          { k: 'TAKE 01', v: '92% / CLEAN', c: C.grey },
          { k: 'TAKE 02', v: '92% / SPILL', c: C.teal },
          { k: 'DELTA', v: 'LIKABILITY +34%', c: C.mustard },
        ]}
        note="FIG 1.2 / ARONSON 1966 — THE PRATFALL EFFECT"
      />

      {/* ============ PRATFALL STAMP ============ */}
      <div
        style={{
          position: 'absolute',
          left: 96,
          top: 486,
          opacity: stamp,
          pointerEvents: 'none',
        }}
      >
        <Stamp color={C.teal} rotate={-6} fontSize={34} scale={0.85 + stamp * 0.15}>
          PRATFALL EFFECT
        </Stamp>
      </div>
    </div>
  );
};

/** Toppled cup icon — object only, zero human faces or bodies. */
export const CoffeeCup: React.FC<{ size?: number; tilt?: number }> = ({ size = 220, tilt = 34 }) => (
  <svg width={size} height={size * 0.73} viewBox="0 0 220 160">
    <ellipse cx={150} cy={136} rx={66} ry={12} fill={C.salmon} stroke={C.ink} strokeWidth={3} />
    <ellipse cx={188} cy={128} rx={14} ry={6} fill={C.salmon} stroke={C.ink} strokeWidth={2.5} />
    <circle cx={205} cy={112} r={6} fill={C.salmon} stroke={C.ink} strokeWidth={2.5} />
    <circle cx={176} cy={101} r={4.5} fill={C.salmon} stroke={C.ink} strokeWidth={2.5} />
    <g transform={`rotate(${tilt} 96 78)`}>
      <path d="M52 42 L142 42 L130 116 L64 116 Z" fill={C.paper} stroke={C.ink} strokeWidth={4} />
      <ellipse cx={97} cy={42} rx={45} ry={11} fill={C.white} stroke={C.ink} strokeWidth={4} />
      <ellipse cx={97} cy={44} rx={35} ry={6} fill={C.salmon} opacity={0.75} />
      <path d="M142 54 C186 48 188 100 134 100" fill="none" stroke={C.ink} strokeWidth={7} />
      <path d="M62 66 L132 66" stroke={C.teal} strokeWidth={5} opacity={0.75} />
    </g>
    <path
      d="M28 34 L48 46 M20 62 L44 62 M34 92 L54 82"
      stroke={C.ink}
      strokeWidth={4}
      strokeLinecap="square"
    />
  </svg>
);
