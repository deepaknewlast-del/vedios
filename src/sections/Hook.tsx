import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import { fade, revealAt, stagger } from '../anim';
import { CheckMark, ChunkyArrow, CrossMark, InkPanel, Stamp, Tag } from '../components/Ink';
import { C, FONT_MONO, SHADOW_SM, tint } from '../theme';
import { FigureLegend } from './SectionHeader';
import { BEATS, type Beat } from '../timeline';

type Metric = { label: string; v: number; c: string };

const A_METRICS: Metric[] = [
  { label: 'ACCURACY', v: 100, c: C.teal },
  { label: 'POISE', v: 100, c: C.tealLight },
  { label: 'RECALL', v: 100, c: C.mustard },
  { label: 'TIMING', v: 100, c: C.grey },
];
const B_METRICS: Metric[] = [
  { label: 'ACCURACY', v: 92, c: C.teal },
  { label: 'POISE', v: 88, c: C.tealLight },
  { label: 'RECALL', v: 90, c: C.mustard },
  { label: 'TIMING', v: 86, c: C.grey },
];

const MetricRow: React.FC<{ m: Metric; p: number }> = ({ m, p }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 11, height: 38 }}>
    <div
      style={{
        fontFamily: FONT_MONO,
        fontWeight: 700,
        fontSize: 15,
        width: 112,
        letterSpacing: 0.4,
      }}
    >
      {m.label}
    </div>
    <div
      style={{
        position: 'relative',
        width: 288,
        height: 21,
        background: C.paper,
        border: `3px solid ${C.ink}`,
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: `${m.v * p}%`,
          background: m.c,
          borderRight: `3px solid ${C.ink}`,
        }}
      />
      {[25, 50, 75].map((t) => (
        <div
          key={t}
          style={{
            position: 'absolute',
            left: `${t}%`,
            top: 0,
            bottom: 0,
            width: 1,
            background: tint(C.ink, 0.3),
          }}
        />
      ))}
    </div>
    <div
      style={{
        fontFamily: FONT_MONO,
        fontWeight: 700,
        fontSize: 15,
        width: 44,
        textAlign: 'right',
      }}
    >
      {m.v}%
    </div>
  </div>
);

const PANEL_H = 464;

const Dossier: React.FC<{
  which: 'A' | 'B';
  opacity: number;
  state: number;
  localFrame: number;
}> = ({ which, opacity, state, localFrame }) => {
  const isA = which === 'A';
  const metrics = isA ? A_METRICS : B_METRICS;
  const p = revealAt(state, 0, localFrame - (isA ? 0 : 8), false, 30);
  const stampAt = isA ? 2 : 4;
  const stamp = revealAt(state, stampAt, localFrame, true, 30);
  const verdictColor = isA ? C.salmon : C.teal;

  return (
    <div style={{ width: 744, height: 464, opacity: opacity * fade(p + 0.0001) }}>
      <InkPanel style={{ width: 744, height: 464, padding: 0 }}>
        <div
          style={{
            height: 44,
            background: C.ink,
            color: C.white,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 16px',
            fontFamily: FONT_MONO,
            fontWeight: 700,
            fontSize: 19,
            letterSpacing: 1,
          }}
        >
          <span>CANDIDATE {which}</span>
          <span style={{ fontSize: 14, opacity: 0.85 }}>DOSSIER / {isA ? '01' : '02'}</span>
        </div>

        <div style={{ padding: '11px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
            <div
              style={{
                width: 10,
                height: 27,
                background: verdictColor,
                border: `3px solid ${C.ink}`,
              }}
            />
            <div
              style={{
                fontFamily: FONT_MONO,
                fontWeight: 700,
                fontSize: 23,
                letterSpacing: -0.4,
              }}
            >
              {isA ? '100% FLAWLESS' : '88% + MINOR FLAW'}
            </div>
            <div style={{ flex: 1 }} />
            <div
              style={{
                fontFamily: FONT_MONO,
                fontSize: 12,
                fontWeight: 700,
                opacity: 0.58,
                letterSpacing: 0.6,
              }}
            >
              SELF-REPORT
            </div>
          </div>

          <div style={{ height: 3, background: C.ink, margin: '9px 0 7px' }} />

          {metrics.map((m, i) => (
            <div key={m.label} style={{ opacity: stagger(p, i, metrics.length) }}>
              <MetricRow m={m} p={stagger(p, i, metrics.length)} />
            </div>
          ))}

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
            <div style={{ fontFamily: FONT_MONO, fontWeight: 700, fontSize: 15, width: 112 }}>
              ERRORS
            </div>
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                style={{
                  width: 34,
                  height: 26,
                  border: `3px solid ${C.ink}`,
                  background: !isA && i === 2 ? C.salmon : C.paper,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {!isA && i === 2 ? (
                  <span style={{ fontFamily: FONT_MONO, fontWeight: 700, fontSize: 15 }}>!</span>
                ) : (
                  <CheckMark size={15} color={tint(C.ink, 0.45)} />
                )}
              </div>
            ))}
            <div style={{ flex: 1 }} />
            <div
              style={{
                fontFamily: FONT_MONO,
                fontWeight: 700,
                fontSize: 12,
                letterSpacing: 0.4,
                padding: '3px 8px',
                border: `2px solid ${C.ink}`,
                background: isA ? C.grey : C.salmon,
                whiteSpace: 'nowrap',
              }}
            >
              {isA ? 'ZERO LOGGED' : '1 LOGGED'}
            </div>
          </div>

          <div
            style={{
              marginTop: 96,
              borderTop: `3px solid ${C.ink}`,
              paddingTop: 9,
              display: 'flex',
              justifyContent: 'space-between',
              fontFamily: FONT_MONO,
              fontWeight: 700,
              fontSize: 12,
              opacity: 0.62,
            }}
          >
            <span>PANEL NOTE / {isA ? 'NO ERRORS ADMITTED' : 'ONE ERROR ADMITTED, Q3'}</span>
            <span>{isA ? '100 / 100' : '88 / 100'}</span>
          </div>
        </div>

        <div
          style={{
            position: 'absolute',
            right: 18,
            bottom: 14,
            opacity: stamp,
            zIndex: 2,
            pointerEvents: 'none',
          }}
        >
          <Stamp
            color={isA ? C.salmon : C.teal}
            rotate={isA ? -12 : -9}
            fontSize={34}
            scale={0.86 + stamp * 0.14}
          >
            {isA ? 'THREAT' : 'TRUSTED'}
          </Stamp>
        </div>
      </InkPanel>
    </div>
  );
};

const keyFrames = BEATS.map((b) => b.startFrame);
const focusA = BEATS.map((b) => (b.section.id === 'hook' && b.focus === 'A' ? 1 : 0));
const focusB = BEATS.map((b) => (b.section.id === 'hook' && b.focus === 'B' ? 1 : 0));
const opts = { extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const };

const FocusBracket: React.FC<{ w: number; h: number; on: number }> = ({ w, h, on }) => (
  <svg
    width={w + 20}
    height={h + 20}
    viewBox={`0 0 ${w + 20} ${h + 20}`}
    style={{
      position: 'absolute',
      left: -10,
      top: -10,
      pointerEvents: 'none',
      opacity: on,
    }}
  >
    {[
      [1, 1, 1, 1],
      [w + 19, 1, -1, 1],
      [1, h + 19, 1, -1],
      [w + 19, h + 19, -1, -1],
    ].map(([x, y, dx, dy], i) => (
      <path
        key={i}
        d={`M${x} ${y + dy * 40} L${x} ${y} L${x + dx * 40} ${y}`}
        fill="none"
        stroke={C.red}
        strokeWidth={6}
      />
    ))}
  </svg>
);

export const HookSection: React.FC<{ beat: Beat; localFrame: number }> = ({ beat, localFrame }) => {
  const frame = useCurrentFrame();
  const state = beat.stateIndex;
  const aFocus = interpolate(frame, keyFrames, focusA, opts);
  const bFocus = interpolate(frame, keyFrames, focusB, opts);

  const logic = revealAt(state, 0, localFrame, false, 30);
  const reality = revealAt(state, 6, localFrame, true);
  const hostility = revealAt(state, 7, localFrame, true, 32);
  const chips = ['OFFER', 'ALLIES', 'TRUST'].map((c, i) => ({
    c,
    p: revealAt(state, 6, localFrame - i * 5, true, 30),
  }));

  return (
    <div style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
        <div style={{ position: 'relative', width: 744, height: PANEL_H }}>
          <div style={{ transform: 'rotate(-0.5deg)' }}>
            <Dossier which="A" opacity={1} state={state} localFrame={localFrame} />
          </div>
          <FocusBracket w={744} h={PANEL_H} on={aFocus} />
        </div>
        <div
          style={{
            width: 58,
            height: 58,
            borderRadius: '50%',
            background: C.ink,
            color: C.white,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: FONT_MONO,
            fontWeight: 700,
            fontSize: 20,
            flexShrink: 0,
            boxShadow: SHADOW_SM,
            transform: 'rotate(-6deg)',
          }}
        >
          VS
        </div>
        <div style={{ position: 'relative', width: 744, height: PANEL_H }}>
          <div style={{ transform: 'rotate(0.5deg)' }}>
            <Dossier which="B" opacity={1} state={state} localFrame={localFrame} />
          </div>
          <FocusBracket w={744} h={PANEL_H} on={bFocus} />
        </div>
      </div>

      <FigureLegend
        items={[
          { k: 'A', v: '100% FLAWLESS', c: C.teal },
          { k: 'B', v: '88% + FLAW', c: C.salmon },
          { k: 'VERDICT', v: 'THREAT vs TRUSTED', c: C.mustard },
        ]}
        note="FIG 1.1 / THE OFFER DOES NOT GO TO THE HIGHEST SCORE"
      />

      {/* logic vs reality band */}
      <div style={{ position: 'absolute', left: 0, top: 476, width: '100%', height: 140 }}>
        <div
          style={{
            position: 'absolute',
            left: 8,
            top: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            opacity: logic * (state >= 6 ? 0.32 : 1),
          }}
        >
          <Tag bg={C.mustard} size={19}>
            LOGIC SAYS
          </Tag>
          <ChunkyArrow width={190} height={54} dir="left" color={C.mustard} />
          <div style={{ fontFamily: FONT_MONO, fontWeight: 700, fontSize: 17 }}>A WINS</div>
        </div>

        <div
          style={{
            position: 'absolute',
            right: 8,
            top: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            opacity: reality,
          }}
        >
          <div style={{ fontFamily: FONT_MONO, fontWeight: 700, fontSize: 17 }}>B WINS</div>
          <ChunkyArrow width={190} height={54} color={C.teal} />
          <Tag bg={C.teal} size={19}>
            IN REALITY
          </Tag>
        </div>

        {state >= 6 && (
          <div style={{ position: 'absolute', left: 214, top: 4, opacity: 0.9 }}>
            <CrossMark size={30} color={C.red} />
          </div>
        )}

        {state >= 6 && (
          <div style={{ position: 'absolute', left: 470, top: 0, display: 'flex', gap: 9 }}>
            {chips.map(({ c, p }) => (
              <div key={c} style={{ opacity: p, transform: `scale(${0.8 + p * 0.2})` }}>
                <Tag bg={C.mustard} size={15} shadow={false}>
                  {c}
                </Tag>
              </div>
            ))}
          </div>
        )}

        {/* hostility alert strip */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 74,
            width: '100%',
            height: 54,
            opacity: hostility,
            transform: `translateY(${(1 - hostility) * 10}px)`,
            display: 'flex',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <div
            style={{
              flex: 1,
              height: 44,
              border: `3px solid ${C.ink}`,
              background: tint(C.salmon, 0.42),
              boxShadow: SHADOW_SM,
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              padding: '0 16px',
              fontFamily: FONT_MONO,
              fontWeight: 700,
              fontSize: 17,
              letterSpacing: 0.6,
            }}
          >
            <span
              style={{
                background: C.red,
                width: 15,
                height: 15,
                display: 'inline-block',
                border: `2px solid ${C.ink}`,
              }}
            />
            CANDIDATE A SILENTLY TRIGGERS A ROOM FULL OF DEFENSIVE HOSTILITY
          </div>
          <Tag bg={C.salmon} size={15}>
            THE THREAT SIGNAL
          </Tag>
        </div>
      </div>
    </div>
  );
};
