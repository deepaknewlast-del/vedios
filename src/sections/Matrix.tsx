import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import { revealAt } from '../anim';
import { Doodles } from '../art/Doodles';
import { AudienceRow, JudgeFigure, PointingHand } from '../art/People';
import {
  BangMark,
  Callout,
  ComicPanel,
  HandLabel,
  QuestionMark,
  SketchArrow,
  Sparkle,
  Star,
} from '../art/Sketch';
import { C, FONT_HEAD, FONT_MONO, SHADOW_SM, tint } from '../theme';
import type { Beat } from '../timeline';

const GRID = { x: 118, y: 6, w: 900, h: 470 };
const HALF_W = GRID.w / 2;
const HALF_H = GRID.h / 2;

const QUADS = [
  { key: 'pity', label: 'PITY', sub: 'LIKED, NOT RATED', color: C.mustard, x: 0, y: 0 },
  { key: 'admiration', label: 'ADMIRATION', sub: 'RESPECT + WARMTH', color: C.teal, x: 1, y: 0 },
  { key: 'contempt', label: 'CONTEMPT', sub: 'DISMISSED', color: C.grey, x: 0, y: 1 },
  { key: 'envy', label: 'ENVY', sub: 'RESPECT, NO WARMTH', color: C.salmon, x: 1, y: 1 },
];

const QuadIcon: React.FC<{ kind: string; color: string }> = ({ kind, color }) => {
  if (kind === 'pity')
    return (
      <svg width={60} height={44} viewBox="0 0 60 44">
        <circle cx={18} cy={22} r={14} fill="none" stroke={C.ink} strokeWidth={4} strokeDasharray="5 4" />
        <rect x={34} y={8} width={22} height={26} fill={color} stroke={C.ink} strokeWidth={4} />
      </svg>
    );
  if (kind === 'admiration')
    return (
      <svg width={60} height={44} viewBox="0 0 60 44">
        <path d="M4 38 L18 8 L32 38 Z" fill={color} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
        <circle cx={44} cy={22} r={13} fill={C.white} stroke={C.ink} strokeWidth={4} />
        <path d="M38 22 L43 27 L51 17" fill="none" stroke={C.ink} strokeWidth={4} strokeLinecap="round" />
      </svg>
    );
  if (kind === 'contempt')
    return (
      <svg width={60} height={44} viewBox="0 0 60 44">
        <rect x={6} y={10} width={22} height={22} fill={color} stroke={C.ink} strokeWidth={4} />
        <path d="M38 10 L56 32 M56 10 L38 32" stroke={C.ink} strokeWidth={5} strokeLinecap="round" />
      </svg>
    );
  return (
    <svg width={60} height={44} viewBox="0 0 60 44">
      <path d="M4 36 L16 12 L28 36 Z" fill={color} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
      <path d="M36 10 L56 10 M36 20 L58 20 M36 30 L54 30" stroke={C.ink} strokeWidth={4} strokeLinecap="round" />
    </svg>
  );
};

/** Chunky matrix axis with cartoon arrowheads. */
const AxisY: React.FC<{ p: number }> = ({ p }) => (
  <svg
    width={108}
    height={GRID.h}
    style={{ position: 'absolute', left: 0, top: GRID.y, opacity: p }}
  >
    <line x1={96} x2={96} y1={22} y2={GRID.h - 6} stroke={C.ink} strokeWidth={7} strokeLinecap="round" />
    <path d={`M78 34 L96 6 L114 34 Z`} fill={C.ink} />
    <text
      x={54}
      y={GRID.h / 2}
      transform={`rotate(-90 54 ${GRID.h / 2})`}
      textAnchor="middle"
      fontFamily="Space Mono"
      fontWeight={700}
      fontSize={15}
      fill={C.ink}
      letterSpacing={1.4}
    >
      LOW WARMTH → HIGH WARMTH
    </text>
  </svg>
);

const AxisX: React.FC<{ p: number }> = ({ p }) => (
  <svg
    width={GRID.w}
    height={54}
    style={{ position: 'absolute', left: GRID.x, top: GRID.y + GRID.h + 2, opacity: p }}
  >
    <line x1={6} x2={GRID.w - 22} y1={16} y2={16} stroke={C.ink} strokeWidth={7} strokeLinecap="round" />
    <path d={`M${GRID.w - 34} 0 L${GRID.w - 2} 16 L${GRID.w - 34} 32 Z`} fill={C.ink} />
    <text x={6} y={44} fontFamily="Space Mono" fontWeight={700} fontSize={15} fill={C.ink} letterSpacing={1.2}>
      LOW COMPETENCE
    </text>
    <text
      x={GRID.w - 6}
      y={44}
      textAnchor="end"
      fontFamily="Space Mono"
      fontWeight={700}
      fontSize={15}
      fill={C.ink}
      letterSpacing={1.2}
    >
      HIGH COMPETENCE
    </text>
  </svg>
);

export const MatrixSection: React.FC<{ beat: Beat; localFrame: number }> = ({ beat, localFrame }) => {
  const frame = useCurrentFrame();
  const s = beat.stateIndex;

  const axes = revealAt(s, 1, localFrame);
  const quadReveal = QUADS.map((_, i) => revealAt(s, 3, localFrame - i * 7, true, 30));
  const plot = revealAt(s, 4, localFrame, true, 34);
  const threat = revealAt(s, 5, localFrame, true, 34);
  const wall = revealAt(s, 6, localFrame);
  const envyHi = revealAt(s, 7, localFrame);
  const admiration = revealAt(s, 10, localFrame);
  const catchCard = revealAt(s, 11, localFrame, true, 36);

  const shiftStart = beat.startFrame + 14;
  const shiftEnd = beat.startFrame + beat.frames - 18;
  const shift = interpolate(frame, [shiftStart, shiftEnd], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const start = { x: GRID.x + HALF_W + 300, y: GRID.y + HALF_H + 96 };
  const end = { x: GRID.x + HALF_W + 300, y: GRID.y + 92 };
  const ctrl = { x: GRID.x + HALF_W + 420, y: GRID.y + HALF_H };
  const dotX = (1 - shift) ** 2 * start.x + 2 * (1 - shift) * shift * ctrl.x + shift ** 2 * end.x;
  const dotY = (1 - shift) ** 2 * start.y + 2 * (1 - shift) * shift * ctrl.y + shift ** 2 * end.y;
  const pulse = 1 + Math.sin(frame / 8) * 0.08;

  const NOTE: Record<number, { tag: string; body: string[]; color: string }> = {
    0: { tag: 'SOCIAL PERCEPTION', body: ['TWO AXES.', 'FOUR OUTCOMES.', 'ONE HIDDEN TRAP.'], color: C.mustard },
    1: { tag: 'X / COMPETENCE', body: ['SKILL, PRECISION,', 'ERROR-FREE OUTPUT.'], color: C.tealLight },
    2: { tag: 'Y / WARMTH', body: ['APPROACHABLE,', 'SAFE, HUMAN.'], color: C.tealLight },
    3: { tag: 'PAYOFF GRID', body: ['WHAT OTHERS FEEL', 'WHEN THEY RATE YOU.'], color: C.mustard },
    4: { tag: 'PLOT: FLAWLESS', body: ['HIGH COMPETENCE', '+ ZERO FLAWS.'], color: C.salmon },
    5: { tag: 'STATUS THREAT', body: ['THEIR BRAINS DO NOT', 'READ "VALUE".'], color: C.red },
    6: { tag: 'INVISIBLE WALL', body: ['PERFECTION MAKES', 'EVERYONE ELSE SMALLER.'], color: C.salmon },
    7: { tag: 'ENVY QUADRANT', body: ['THEY RESPECT THE SKILL', 'AND ROOT FOR THE TRIP.'], color: C.salmon },
    8: { tag: 'SECRET RESENTMENT', body: ['COLD COMPETENCE IS', 'A SOCIAL LIABILITY.'], color: C.salmon },
    9: { tag: 'STRATEGIC FLAW', body: ['ONE SPILLED CUP BREAKS', 'THE THREAT SIGNAL.'], color: C.mustard },
    10: { tag: 'ADMIRATION', body: ['HUMAN, SAFE, APPROACHABLE.', 'COMPETENCE 92% → 92%.'], color: C.teal },
    11: { tag: 'THE CATCH', body: ['SAME SPILL, AVERAGE', 'CONTESTANT: CRASH.'], color: C.red },
    12: { tag: 'END OF PART 1', body: ['THE FLAW IS STRATEGIC.', 'PART 2 EXPLAINS WHEN.'], color: C.teal },
  };
  const note = NOTE[Math.min(12, s)] ?? NOTE[0];

  return (
    <div style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%' }}>
      <Doodles seed={3} items={['sparkle', 'star']} />

      <AxisY p={0.3 + axes * 0.7} />
      <AxisX p={0.3 + axes * 0.7} />

      {/* payoff matrix */}
      <ComicPanel
        title="PAYOFF MATRIX"
        tag="COMPETENCE × WARMTH"
        number={3}
        bg={C.paper}
        style={{ position: 'absolute', left: GRID.x, top: GRID.y, width: GRID.w, height: GRID.h }}
      >
        <div style={{ position: 'absolute', left: 0, top: 38, right: 0, bottom: 0 }} />
        {QUADS.map((q, i) => {
          const hi = (q.key === 'envy' ? envyHi : q.key === 'admiration' ? admiration : 0) * 0.34;
          const cellH = (GRID.h - 38) / 2;
          return (
            <div
              key={q.key}
              style={{
                position: 'absolute',
                left: q.x * HALF_W,
                top: 38 + q.y * cellH,
                width: HALF_W,
                background: tint(q.color, 0.4 + quadReveal[i] * 0.2 + hi),
                height: cellH,
                borderRight: q.x === 0 ? `4px solid ${C.ink}` : undefined,
                borderBottom: q.y === 0 ? `4px solid ${C.ink}` : undefined,
                padding: '12px 16px',
                opacity: 0.25 + quadReveal[i] * 0.75,
                overflow: 'hidden',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div>
                  <div
                    style={{
                      fontFamily: FONT_HEAD,
                      fontWeight: 700,
                      fontStyle: 'italic',
                      fontSize: 34,
                      lineHeight: 1,
                      letterSpacing: -0.4,
                    }}
                  >
                    {q.label}
                  </div>
                  <div
                    style={{
                      fontFamily: FONT_MONO,
                      fontWeight: 700,
                      fontSize: 11.5,
                      letterSpacing: 0.8,
                      marginTop: 7,
                      opacity: 0.8,
                    }}
                  >
                    {q.sub}
                  </div>
                </div>
                <QuadIcon kind={q.key} color={q.color} />
              </div>
              <div
                style={{
                  position: 'absolute',
                  left: 16,
                  bottom: 10,
                  fontFamily: FONT_MONO,
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: 0.8,
                  opacity: 0.6,
                }}
              >
                {q.x ? 'HIGH' : 'LOW'} COMP / {q.y ? 'LOW' : 'HIGH'} WARMTH
              </div>
            </div>
          );
        })}

        {/* perfection wall + migration path */}
        <svg
          width={GRID.w}
          height={GRID.h}
          style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
        >
          <line
            x1={HALF_W - 20}
            y1={52}
            x2={HALF_W - 20}
            y2={GRID.h - 14}
            stroke={C.red}
            strokeWidth={5}
            strokeDasharray="12 8"
            opacity={wall * 0.9}
          />
          {[90, 160, 230, 300, 370].map((y) => (
            <path
              key={y}
              d={`M${HALF_W - 40} ${y} L${HALF_W - 4} ${y - 12}`}
              stroke={C.ink}
              strokeWidth={4}
              opacity={wall * 0.5}
            />
          ))}
          <path
            d={`M${start.x - GRID.x} ${start.y - GRID.y} Q${ctrl.x - GRID.x} ${ctrl.y - GRID.y} ${end.x - GRID.x} ${end.y - GRID.y}`}
            fill="none"
            stroke={C.ink}
            strokeWidth={4}
            strokeDasharray="8 7"
            opacity={shift > 0 ? 0.85 : 0}
          />
          {/* plotted marker */}
          <g opacity={plot}>
            <circle
              cx={dotX - GRID.x}
              cy={dotY - GRID.y}
              r={34 * pulse}
              fill="none"
              stroke={C.red}
              strokeWidth={5}
              strokeDasharray="9 7"
              opacity={threat * (1 - shift)}
            />
            <circle
              cx={dotX - GRID.x}
              cy={dotY - GRID.y}
              r={22}
              fill={shift > 0.5 ? '#4E9E8F' : C.red}
              stroke={C.ink}
              strokeWidth={5}
            />
            <circle cx={dotX - GRID.x} cy={dotY - GRID.y} r={7} fill={C.white} />
          </g>
        </svg>

        {/* marker label */}
        <div
          style={{
            position: 'absolute',
            left: dotX - GRID.x + 30,
            top: dotY - GRID.y - 16,
            opacity: plot,
            background: C.paper,
            border: `3px solid ${C.ink}`,
            padding: '3px 9px',
            fontFamily: FONT_MONO,
            fontWeight: 700,
            fontSize: 12,
            whiteSpace: 'nowrap',
            boxShadow: SHADOW_SM,
          }}
        >
          {shift > 0.6 ? 'HUMAN / SAFE ✓' : 'FLAWLESS'}
        </div>

        {/* pointing hand into ENVY */}
        {s >= 7 && s < 10 && (
          <div style={{ position: 'absolute', left: GRID.w - 190, top: 300, opacity: 0.92 }}>
            <PointingHand size={124} rotate={-6} flip />
          </div>
        )}
      </ComicPanel>

      {/* ---- right column ---- */}
      <div style={{ position: 'absolute', left: 1052, top: 0, width: 700 }}>
        <ComicPanel title="FIELD ANNOTATION" tag={`${String(s + 1).padStart(2, '0')} / 13`} bg={C.white} style={{ height: 300 }}>
          <div style={{ padding: '14px 16px' }}>
            <div
              style={{
                display: 'inline-block',
                background: note.color,
                border: `3px solid ${C.ink}`,
                boxShadow: SHADOW_SM,
                padding: '5px 10px',
                fontFamily: FONT_MONO,
                fontWeight: 700,
                fontSize: 14,
                transform: 'rotate(-1.5deg)',
              }}
            >
              {note.tag}
            </div>
            <div
              style={{
                marginTop: 14,
                fontFamily: FONT_HEAD,
                fontWeight: 700,
                fontStyle: 'italic',
                fontSize: 25,
                lineHeight: 1.32,
              }}
            >
              {note.body.map((l) => (
                <div key={l}>{l}</div>
              ))}
            </div>
            <div style={{ position: 'absolute', right: 14, bottom: 10 }}>
              <JudgeFigure size={112} accent={C.teal} />
            </div>
          </div>
        </ComicPanel>

        {/* live readout */}
        <div
          style={{
            marginTop: 16,
            border: `3px solid ${C.ink}`,
            background: C.paper,
            boxShadow: `4px 4px 0 ${C.ink}`,
            padding: '10px 14px',
            fontFamily: FONT_MONO,
            fontWeight: 700,
            fontSize: 13,
            lineHeight: 1.75,
            display: 'flex',
            gap: 26,
          }}
        >
          <div>
            <div style={{ opacity: 0.55, letterSpacing: 1 }}>LIVE READ-OUT</div>
            <div>PLOT / {shift > 0.55 ? 'ADMIRATION' : 'ENVY'}</div>
            <div>WARMTH / {shift > 0.55 ? 'HIGH' : 'LOW'}</div>
          </div>
          <div>
            <div style={{ opacity: 0.55, letterSpacing: 1 }}>&nbsp;</div>
            <div>COMPETENCE / 92%</div>
            <div style={{ color: shift > 0.55 ? '#2E6F63' : C.red }}>
              THREAT / {shift > 0.55 ? 'BROKEN' : 'ACTIVE'}
            </div>
          </div>
        </div>

        {/* legend */}
        <div style={{ marginTop: 14, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {QUADS.map((q) => (
            <div key={q.key} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <span style={{ width: 16, height: 16, background: q.color, border: `3px solid ${C.ink}` }} />
              <span style={{ fontFamily: FONT_MONO, fontWeight: 700, fontSize: 12 }}>{q.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ---- the catch card ---- */}
      <div
        style={{
          position: 'absolute',
          left: GRID.x,
          top: GRID.y,
          width: GRID.w,
          height: GRID.h,
          opacity: catchCard,
          transform: `scale(${0.94 + catchCard * 0.06})`,
          pointerEvents: 'none',
        }}
      >
        <ComicPanel
          title="CONTROL CONDITION"
          tag="AVERAGE CONTESTANT"
          bg={C.paper}
          barColor={C.red}
          style={{ width: GRID.w, height: GRID.h }}
        >
          <div style={{ padding: '16px 22px' }}>
            <HandLabel size={34} rotate={-1}>
              THE SAME SPILL. THE OPPOSITE RESULT.
            </HandLabel>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 40, marginTop: 20 }}>
              {[
                { label: 'NO SPILL', h: 150, c: C.grey, v: '58' },
                { label: '+ COFFEE SPILL', h: 46, c: C.red, v: '31' },
              ].map((b) => (
                <div key={b.label} style={{ textAlign: 'center', fontFamily: FONT_MONO, fontWeight: 700 }}>
                  <div style={{ fontSize: 19 }}>{b.v}</div>
                  <div
                    style={{
                      width: 96,
                      height: b.h,
                      background: b.c,
                      border: `3px solid ${C.ink}`,
                      boxShadow: SHADOW_SM,
                      marginTop: 5,
                    }}
                  />
                  <div style={{ fontSize: 12, marginTop: 7 }}>{b.label}</div>
                </div>
              ))}
              <div style={{ flex: 1 }} />
              <div style={{ textAlign: 'right' }}>
                <div
                  style={{
                    fontFamily: FONT_MONO,
                    fontWeight: 700,
                    fontSize: 18,
                    color: C.white,
                    background: C.red,
                    border: `3px solid ${C.ink}`,
                    boxShadow: SHADOW_SM,
                    padding: '6px 12px',
                    display: 'inline-block',
                  }}
                >
                  LIKABILITY ▼ CRASHED
                </div>
                <div style={{ fontFamily: FONT_MONO, fontSize: 12.5, fontWeight: 700, marginTop: 8 }}>
                  58 → 31 / NOT A SINGLE POINT UP
                </div>
                <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end' }}>
                  <Callout bg={C.mustard} rotate={-1.5}>
                    CONTINUES IN PART 2 →
                  </Callout>
                </div>
              </div>
            </div>
            <div style={{ position: 'absolute', right: 20, bottom: 12, display: 'flex', gap: 10 }}>
              <QuestionMark size={34} rotate={10} pop={catchCard} />
              <BangMark size={34} rotate={-8} pop={catchCard} />
            </div>
          </div>
        </ComicPanel>
      </div>

      {/* bottom-right: axis key + takeaway */}
      <div style={{ position: 'absolute', left: 1052, top: 500, width: 700 }}>
        <div
          style={{
            border: `3px solid ${C.ink}`,
            background: C.white,
            boxShadow: `4px 4px 0 ${C.ink}`,
            padding: '10px 14px',
          }}
        >
          <div style={{ fontFamily: FONT_MONO, fontWeight: 700, fontSize: 11, letterSpacing: 1, opacity: 0.6 }}>
            HOW TO READ IT
          </div>
          <div style={{ display: 'flex', gap: 18, marginTop: 10 }}>
            {[
              { k: 'X', v: 'HOW GOOD YOU ARE', c: C.mustard },
              { k: 'Y', v: 'HOW SAFE YOU FEEL', c: C.teal },
              { k: 'TRAP', v: 'TOP-RIGHT, BOTTOM-HALF', c: C.salmon },
            ].map((it) => (
              <div key={it.k} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <span
                  style={{
                    width: 22,
                    height: 22,
                    background: it.c,
                    border: `3px solid ${C.ink}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: FONT_MONO,
                    fontWeight: 700,
                    fontSize: 11,
                  }}
                >
                  {it.k}
                </span>
                <span style={{ fontFamily: FONT_MONO, fontWeight: 700, fontSize: 11.5 }}>{it.v}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 14, opacity: admiration }}>
          <Sparkle size={34} color={C.mustard} pop={admiration} rotate={frame * 0.5} />
          <HandLabel size={22} rotate={-1}>
            A HUMAN SLIP MOVED YOU HERE
          </HandLabel>
        </div>
      </div>
    </div>
  );
};
