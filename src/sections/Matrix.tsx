import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import { revealAt } from '../anim';
import { InkPanel, Swatch, Tag } from '../components/Ink';
import { C, FONT_HEAD, FONT_MONO, SHADOW_SM, tint } from '../theme';
import { FigureLegend } from './SectionHeader';
import { type Beat } from '../timeline';

const GRID = { x: 76, y: 2, w: 936, h: 496 };
const HALF_W = GRID.w / 2;
const HALF_H = GRID.h / 2;

const QUADS = [
  {
    key: 'pity',
    label: 'PITY / WARM',
    desc: 'LIKED, NOT RATED',
    color: C.mustard,
    x: 0,
    y: 0,
  },
  {
    key: 'admiration',
    label: 'ADMIRATION',
    desc: 'RESPECT + WARMTH',
    color: C.teal,
    x: 1,
    y: 0,
  },
  {
    key: 'contempt',
    label: 'CONTEMPT',
    desc: 'DISMISSED',
    color: C.grey,
    x: 0,
    y: 1,
  },
  {
    key: 'envy',
    label: 'ENVY / COLD',
    desc: 'RESPECT, NO WARMTH',
    color: C.salmon,
    x: 1,
    y: 1,
  },
];

const QuadrantIcon: React.FC<{ kind: string; color: string }> = ({ kind, color }) => (
  <svg width={74} height={54} viewBox="0 0 74 54">
    {kind === 'pity' && (
      <>
        <circle cx={24} cy={27} r={16} fill="none" stroke={C.ink} strokeWidth={3} strokeDasharray="5 4" />
        <rect x={42} y={12} width={26} height={30} fill={color} stroke={C.ink} strokeWidth={3} />
      </>
    )}
    {kind === 'admiration' && (
      <>
        <path d="M6 44 L23 12 L40 44 Z" fill={color} stroke={C.ink} strokeWidth={3} />
        <circle cx={56} cy={27} r={15} fill={C.white} stroke={C.ink} strokeWidth={3} />
        <path d="M49 27 L54 32 L63 22" fill="none" stroke={C.ink} strokeWidth={3} />
      </>
    )}
    {kind === 'contempt' && (
      <>
        <rect x={8} y={14} width={25} height={25} fill={color} stroke={C.ink} strokeWidth={3} />
        <path d="M44 14 L66 40 M66 14 L44 40" stroke={C.ink} strokeWidth={4} />
      </>
    )}
    {kind === 'envy' && (
      <>
        <path d="M6 40 L20 20 L34 40 Z" fill={color} stroke={C.ink} strokeWidth={3} />
        <path d="M42 12 L60 12 M42 22 L66 22 M42 32 L58 32 M42 42 L64 42" stroke={C.ink} strokeWidth={3} />
      </>
    )}
  </svg>
);

const ANNOTATIONS: { title: string; lines: string[]; color: string }[] = [
  { title: 'SOCIAL PERCEPTION', lines: ['TWO AXES.', 'FOUR OUTCOMES.', 'ONE HIDDEN TRAP.'], color: C.mustard },
  { title: 'X / COMPETENCE', lines: ['SKILL, PRECISION,', 'ERROR-FREE OUTPUT.'], color: C.tealLight },
  { title: 'Y / WARMTH', lines: ['APPROACHABILITY,', 'HUMAN-NESS, SAFETY.'], color: C.tealLight },
  { title: 'PAYOFF GRID', lines: ['WHAT OTHERS FEEL', 'WHEN THEY RATE YOU.'], color: C.mustard },
  { title: 'PLOT: FLAWLESS', lines: ['HIGH COMPETENCE', '+ ZERO FLAWS.'], color: C.salmon },
  { title: 'STATUS THREAT', lines: ['THEIR BRAINS DO NOT', 'READ "VALUE".'], color: C.red },
  { title: 'INVISIBLE WALL', lines: ['PERFECTION MAKES', 'EVERYONE ELSE SMALLER.'], color: C.salmon },
  { title: 'ENVY QUADRANT', lines: ['THEY RESPECT THE SKILL', 'AND ROOT FOR THE TRIP.'], color: C.salmon },
  { title: 'SECRET RESENTMENT', lines: ['COLD COMPETENCE IS', 'A SOCIAL LIABILITY.'], color: C.salmon },
  { title: 'STRATEGIC FLAW', lines: ['ONE SPILLED CUP BREAKS', 'THE THREAT SIGNAL.'], color: C.mustard },
  { title: 'ADMIRATION', lines: ['HUMAN, SAFE, APPROACHABLE.', 'COMPETENCE 92% → 92%.'], color: C.teal },
  { title: 'THE CATCH', lines: ['SAME SPILL, AVERAGE', 'CONTESTANT: CRASH.'], color: C.red },
  { title: 'END OF PART 1', lines: ['THE FLAW IS STRATEGIC.', 'PART 2 EXPLAINS WHEN.'], color: C.teal },
];

export const MatrixSection: React.FC<{ beat: Beat; localFrame: number }> = ({
  beat,
  localFrame,
}) => {
  const frame = useCurrentFrame();
  const s = beat.stateIndex;

  const axes = revealAt(s, 1, localFrame);
  const quadReveal = QUADS.map((_, i) => revealAt(s, 3, localFrame - i * 6));
  const plot = revealAt(s, 4, localFrame, true, 34);
  const threat = revealAt(s, 5, localFrame, true, 34);
  const wall = revealAt(s, 6, localFrame);
  const envyHi = revealAt(s, 7, localFrame);
  const admiration = revealAt(s, 10, localFrame);
  const catchCard = revealAt(s, 11, localFrame, true, 36);

  // Dot migration: ENVY (bottom-right) → ADMIRATION (top-right) on the "strategic flaw" beat.
  const shiftStart = beat.startFrame + 16;
  const shiftEnd = beat.startFrame + beat.frames - 20;
  const shift = interpolate(frame, [shiftStart, shiftEnd], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const start = { x: 660, y: 400 };
  const end = { x: 660, y: 92 };
  const ctrl = { x: 830, y: 246 };
  const dotX =
    (1 - shift) ** 2 * start.x + 2 * (1 - shift) * shift * ctrl.x + shift ** 2 * end.x;
  const dotY =
    (1 - shift) ** 2 * start.y + 2 * (1 - shift) * shift * ctrl.y + shift ** 2 * end.y;

  const pulse = 1 + Math.sin(frame / 8) * 0.07;
  const note = ANNOTATIONS[s];

  return (
    <div style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%' }}>
      {/* Y axis (vertical) */}
      <svg
        width={74}
        height={GRID.h}
        style={{ position: 'absolute', left: 0, top: GRID.y, opacity: 0.4 + 0.6 * axes }}
      >
        <line x1={66} x2={66} y1={8} y2={GRID.h - 8} stroke={C.ink} strokeWidth={4} />
        <path d={`M58 2 L66 12 L74 2`} fill="none" stroke={C.ink} strokeWidth={3} />
        <text
          x={20}
          y={GRID.h / 2}
          transform={`rotate(-90 20 ${GRID.h / 2})`}
          textAnchor="middle"
          fontFamily="Space Mono"
          fontWeight={700}
          fontSize={14}
          fill={C.ink}
          letterSpacing={1.2}
        >
          LOW WARMTH → HIGH WARMTH
        </text>
      </svg>

      {/* X axis */}
      <div
        style={{
          position: 'absolute',
          left: GRID.x,
          top: GRID.y + GRID.h + 6,
          width: GRID.w,
          height: 4,
          background: C.ink,
          opacity: axes,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: GRID.x,
          top: GRID.y + GRID.h + 14,
          width: GRID.w,
          display: 'flex',
          justifyContent: 'space-between',
          fontFamily: FONT_MONO,
          fontWeight: 700,
          fontSize: 16,
          letterSpacing: 1,
          opacity: 0.35 + 0.65 * axes,
        }}
      >
        <span>← LOW COMPETENCE</span>
        <span>HIGH COMPETENCE →</span>
      </div>

      {/* 2x2 grid */}
      <InkPanel
        style={{ position: 'absolute', left: GRID.x, top: GRID.y, width: GRID.w, height: GRID.h }}
        bg={C.paper}
      >
        {QUADS.map((q, i) => {
          const highlight =
            (q.key === 'envy' ? envyHi : q.key === 'admiration' ? admiration : 0) * 0.32;
          return (
            <div
              key={q.key}
              style={{
                position: 'absolute',
                left: q.x * HALF_W,
                top: q.y * HALF_H,
                width: HALF_W,
                height: HALF_H,
                background: tint(q.color, 0.34 + quadReveal[i] * 0.24 + highlight),
                borderRight: q.x === 0 ? `3px solid ${C.ink}` : undefined,
                borderBottom: q.y === 0 ? `3px solid ${C.ink}` : undefined,
                padding: '14px 16px',
                opacity: 0.25 + quadReveal[i] * 0.75,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
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
                      fontSize: 13,
                      letterSpacing: 0.9,
                      marginTop: 7,
                      maxWidth: 300,
                      opacity: 0.8,
                    }}
                  >
                    {q.desc}
                  </div>
                </div>
                <QuadrantIcon kind={q.key} color={q.color} />
              </div>
              <div
                style={{
                  fontFamily: FONT_MONO,
                  fontSize: 11,
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

        {/* invisible comparison wall */}
        <svg
          width={GRID.w}
          height={GRID.h}
          viewBox={`0 0 ${GRID.w} ${GRID.h}`}
          style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
        >
          <line
            x1={HALF_W - 24}
            y1={16}
            x2={HALF_W - 24}
            y2={GRID.h - 16}
            stroke={C.red}
            strokeWidth={4}
            strokeDasharray="10 7"
            opacity={wall * 0.9}
          />
          {[60, 130, 200, 270, 340, 400].map((y) => (
            <path
              key={y}
              d={`M${HALF_W - 42} ${y} L${HALF_W - 6} ${y - 12}`}
              stroke={C.ink}
              strokeWidth={3}
              opacity={wall * 0.55}
            />
          ))}
          {/* migration trajectory */}
          <path
            d={`M${start.x - GRID.x} ${start.y - GRID.y} Q${ctrl.x - GRID.x} ${ctrl.y - GRID.y} ${end.x - GRID.x} ${end.y - GRID.y}`}
            fill="none"
            stroke={C.ink}
            strokeWidth={3}
            strokeDasharray="6 4"
            opacity={shift > 0 ? 0.85 : 0}
          />
        </svg>
      </InkPanel>

      {/* plotted dot + status threat ring */}
      {plot > 0.001 && (
        <svg
          width={1750}
          height={570}
          viewBox="0 0 1750 570"
          style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
        >
          <circle
            cx={dotX}
            cy={dotY}
            r={38 * pulse}
            fill="none"
            stroke={C.red}
            strokeWidth={5}
            strokeDasharray="8 6"
            opacity={threat * (1 - shift)}
          />
          <circle cx={dotX} cy={dotY} r={22} fill={shift > 0.5 ? C.teal : C.red} stroke={C.ink} strokeWidth={4} opacity={plot} />
          <circle cx={dotX} cy={dotY} r={8} fill={C.white} opacity={plot} />
          <path
            d={`M${dotX + 10} ${dotY + 24} L${dotX + 10} ${dotY + 50} L${dotX + 52} ${dotY + 50}`}
            stroke={C.ink}
            strokeWidth={3}
            opacity={plot}
          />
          <rect
            x={dotX + 52}
            y={dotY + 36}
            width={shift > 0.6 ? 176 : 152}
            height={28}
            fill={C.paper}
            stroke={C.ink}
            strokeWidth={3}
            opacity={plot}
          />
          <text
            x={dotX + 62}
            y={dotY + 56}
            fontFamily="Space Mono"
            fontWeight={700}
            fontSize={15}
            fill={C.ink}
            opacity={plot}
          >
            {shift > 0.6 ? 'HUMAN / SAFE' : 'FLAWLESS ✓'}
          </text>
        </svg>
      )}

      {/* STRATEGIC FLAW arrow */}
      {s >= 9 && (
        <div style={{ position: 'absolute', left: 470, top: 168, opacity: 1 - shift * 0.4 }}>
          <Tag bg={C.mustard} size={14}>
            STRATEGIC FLAW ↗
          </Tag>
        </div>
      )}

      {/* right annotation column */}
      <InkPanel
        style={{ position: 'absolute', left: 1040, top: 2, width: 580, height: 496 }}
        bg={C.white}
      >
        <div
          style={{
            height: 46,
            background: C.ink,
            color: C.white,
            fontFamily: FONT_MONO,
            fontWeight: 700,
            fontSize: 15,
            display: 'flex',
            alignItems: 'center',
            padding: '0 14px',
            letterSpacing: 0.9,
          }}
        >
          FIELD ANNOTATION / {String(s + 1).padStart(2, '0')}
        </div>
        <div style={{ padding: '16px 18px' }}>
          <Tag bg={note.color} size={16}>
            {note.title}
          </Tag>
          <div
            style={{
              marginTop: 16,
              fontFamily: FONT_MONO,
              fontWeight: 700,
              fontSize: 15,
              lineHeight: 1.7,
            }}
          >
            {note.lines.map((l) => (
              <div key={l}>{l}</div>
            ))}
          </div>

          <div
            style={{
              height: 3,
              background: C.ink,
              margin: '16px 0 12px',
            }}
          />
          <div style={{ fontFamily: FONT_MONO, fontWeight: 700, fontSize: 12, marginBottom: 8 }}>
            QUADRANT KEY
          </div>
          {QUADS.map((q) => (
            <div
              key={q.key}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 9,
                marginBottom: 5,
                fontFamily: FONT_MONO,
                fontWeight: 700,
                fontSize: 12,
                opacity: q.key === 'envy' ? 1 : 0.8,
              }}
            >
              <Swatch color={q.color} size={20} />
              {q.label}
            </div>
          ))}

          <div
            style={{
              marginTop: 18,
              border: `3px solid ${C.ink}`,
              background: C.paper,
              padding: '10px 12px',
              fontFamily: FONT_MONO,
              fontWeight: 700,
              fontSize: 12,
              lineHeight: 1.75,
            }}
          >
            <div style={{ opacity: 0.6, letterSpacing: 0.8 }}>LIVE READ-OUT</div>
            <div>PLOT &nbsp;/ {shift > 0.55 ? 'ADMIRATION' : 'ENVY'}</div>
            <div>COMPETENCE &nbsp;/ 92%</div>
            <div>WARMTH &nbsp;&nbsp;&nbsp;&nbsp;/ {shift > 0.55 ? 'HIGH' : 'LOW'}</div>
            <div style={{ color: shift > 0.55 ? C.teal : C.red }}>
              THREAT &nbsp;&nbsp;&nbsp;&nbsp;/ {shift > 0.55 ? 'BROKEN' : 'ACTIVE'}
            </div>
          </div>
        </div>
      </InkPanel>

      <FigureLegend
        items={[
          { k: 'ADMIRATION', v: 'HIGH C + HIGH W', c: C.teal },
          { k: 'ENVY', v: 'HIGH C + LOW W', c: C.salmon },
          { k: 'PITY', v: 'LOW C + HIGH W', c: C.mustard },
          { k: 'CONTEMPT', v: 'LOW C + LOW W', c: C.grey },
        ]}
        note="FIG 1.3 / PERCEPTION IS A PAYOFF MATRIX, NOT A MERITOCRACY"
      />

      {/* CATCH / crash card — final beat teaser */}
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
        <InkPanel style={{ width: GRID.w, height: GRID.h }} bg={C.paper}>
          <div style={{ padding: '18px 24px' }}>
            <Tag bg={C.red} color={C.white} size={18}>
              CONTROL CONDITION / AVERAGE CONTESTANT
            </Tag>
            <div
              style={{
                fontFamily: FONT_HEAD,
                fontWeight: 700,
                fontStyle: 'italic',
                fontSize: 42,
                marginTop: 12,
                transform: 'rotate(-1deg)',
              }}
            >
              THE SAME SPILL. THE OPPOSITE RESULT.
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 32, marginTop: 18 }}>
              {[
                { label: 'NO SPILL', h: 120, c: C.grey, v: '58' },
                { label: '+ COFFEE SPILL', h: 36, c: C.red, v: '31' },
              ].map((b) => (
                <div key={b.label} style={{ textAlign: 'center', fontFamily: FONT_MONO, fontWeight: 700 }}>
                  <div style={{ fontSize: 18 }}>{b.v}</div>
                  <div
                    style={{
                      width: 104,
                      height: b.h,
                      background: b.c,
                      border: `3px solid ${C.ink}`,
                      boxShadow: SHADOW_SM,
                      marginTop: 5,
                    }}
                  />
                  <div style={{ fontSize: 13, marginTop: 6 }}>{b.label}</div>
                </div>
              ))}
              <div style={{ flex: 1 }} />
              <div style={{ textAlign: 'right' }}>
                <div
                  style={{
                    fontFamily: FONT_MONO,
                    fontWeight: 700,
                    fontSize: 19,
                    color: C.white,
                    background: C.red,
                    border: `3px solid ${C.ink}`,
                    boxShadow: SHADOW_SM,
                    padding: '6px 12px',
                    letterSpacing: 0.5,
                  }}
                >
                  LIKABILITY ▼ CRASHED
                </div>
                <div style={{ fontFamily: FONT_MONO, fontSize: 13, fontWeight: 700, marginTop: 8 }}>
                  58 → 31 / NOT A SINGLE POINT UP
                </div>
                <div style={{ marginTop: 18, display: 'flex', justifyContent: 'flex-end' }}>
                  <Tag bg={C.mustard} size={15}>
                    CONTINUES IN PART 2 →
                  </Tag>
                </div>
              </div>
            </div>
          </div>
        </InkPanel>
      </div>
    </div>
  );
};
