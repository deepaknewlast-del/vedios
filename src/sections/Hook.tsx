import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import { revealAt, springIn } from '../anim';
import { AudienceRow, SeatedPerson } from '../art/People';
import { Doodles } from '../art/Doodles';
import {
  Burst,
  ComicPanel,
  HandLabel,
  SketchArrow,
  Sparkle,
  Star,
} from '../art/Sketch';
import { CheckMark, Stamp } from '../components/Ink';
import { C, FONT_HEAD, FONT_MONO, SHADOW_SM, tint } from '../theme';
import { BEATS, type Beat } from '../timeline';

const keyFrames = BEATS.map((b) => b.startFrame);
const focusA = BEATS.map((b) => (b.section.id === 'hook' && b.focus === 'A' ? 1 : 0));
const focusB = BEATS.map((b) => (b.section.id === 'hook' && b.focus === 'B' ? 1 : 0));
const opts = { extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const };

const PANEL_W = 806;
const PANEL_H = 486;

/** Chunky cartoon gauge bar with a hand-drawn feel. */
const Gauge: React.FC<{
  label: string;
  value: number;
  color: string;
  p: number;
  width?: number;
}> = ({ label, value, color, p, width = 250 }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8, opacity: Math.min(1, p * 1.6) }}>
    <div
      style={{
        fontFamily: FONT_MONO,
        fontWeight: 700,
        fontSize: 12,
        width: 78,
        letterSpacing: 0.4,
      }}
    >
      {label}
    </div>
    <div
      style={{
        width,
        height: 17,
        background: C.white,
        border: `3px solid ${C.ink}`,
        position: 'relative',
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: `${value * p}%`,
          background: color,
          borderRight: value > 2 ? `2px solid ${C.ink}` : undefined,
        }}
      />
    </div>
    <div style={{ fontFamily: FONT_MONO, fontWeight: 700, fontSize: 12, width: 34 }}>
      {Math.round(value)}%
    </div>
  </div>
);

const CandidateCard: React.FC<{
  which: 'A' | 'B';
  state: number;
  localFrame: number;
  focus: number;
  frame: number;
}> = ({ which, state, localFrame, focus, frame }) => {
  const isA = which === 'A';
  const appear = revealAt(state, 0, localFrame - (isA ? 0 : 6), false, 32);
  const stamp = revealAt(state, isA ? 2 : 4, localFrame, true, 30);
  const accent = isA ? C.teal : C.salmon;
  const bubble = revealAt(state, isA ? 1 : 3, localFrame, true, 30);
  const breathe = Math.sin((frame + (isA ? 0 : 40)) / 34) * 0.012;

  const gauges = isA
    ? [
        { label: 'ACCURACY', value: 100, color: C.teal, at: 0 },
        { label: 'POISE', value: 100, color: C.mustard, at: 0 },
        { label: 'WARMTH', value: 12, color: C.salmon, at: 0 },
      ]
    : [
        { label: 'ACCURACY', value: 92, color: C.teal, at: 0 },
        { label: 'POISE', value: 86, color: C.mustard, at: 0 },
        { label: 'WARMTH', value: 78, color: '#4E9E8F', at: 0 },
      ];

  return (
    <div
      style={{
        position: 'relative',
        width: PANEL_W,
        height: PANEL_H,
        transform: `translateY(${(1 - appear) * 30}px) scale(${0.93 + appear * 0.07})`,
        opacity: appear,
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: -6,
          border: `5px solid ${focus > 0.5 ? C.red : 'transparent'}`,
          borderRadius: 6,
          pointerEvents: 'none',
        }}
      />
      <ComicPanel
        title={`CANDIDATE ${which}`}
        tag={isA ? 'ROBOTIC PERFECTION' : 'EQUALLY SHARP'}
        number={isA ? 1 : 2}
        bg={C.white}
        style={{ width: PANEL_W, height: PANEL_H }}
        barColor={isA ? C.ink : C.ink}
      >
        {/* accent wash */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 38,
            height: 300,
            background: tint(accent, 0.34),
          }}
        />
        {/* hatch texture in the corner */}
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: 38,
            width: 180,
            height: 120,
            backgroundImage: `repeating-linear-gradient(45deg, ${tint(C.ink, 0.06)} 0 3px, transparent 3px 9px)`,
          }}
        />

        {/* character */}
        <div style={{ position: 'absolute', left: 4, bottom: -4, transform: `scale(${1 + breathe})`, transformOrigin: 'bottom left' }}>
          <SeatedPerson size={296} accent={accent} pose={isA ? 0.12 : 0.95} lean={isA ? 0 : -2} />
        </div>

        {/* speech bubble */}
        <div
          style={{
            position: 'absolute',
            left: 246,
            top: 54,
            width: 330,
            background: C.white,
            border: `3px solid ${C.ink}`,
            borderRadius: 22,
            padding: '10px 15px',
            boxShadow: SHADOW_SM,
            fontFamily: FONT_HEAD,
            fontWeight: 700,
            fontStyle: 'italic',
            fontSize: 21,
            lineHeight: 1.22,
            transform: `scale(${0.7 + bubble * 0.3}) rotate(${(1 - bubble) * -6}deg)`,
            opacity: bubble,
          }}
        >
          {isA ? '“Every answer. Flawless.”' : '“I misread one number last quarter.”'}
          <div
            style={{
              position: 'absolute',
              left: 22,
              bottom: -19,
              width: 0,
              height: 0,
              borderLeft: '15px solid transparent',
              borderRight: '15px solid transparent',
              borderTop: `19px solid ${C.ink}`,
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: 25,
              bottom: -12,
              width: 0,
              height: 0,
              borderLeft: '12px solid transparent',
              borderRight: '12px solid transparent',
              borderTop: `15px solid ${C.white}`,
            }}
          />
        </div>

        {/* gauges */}
        <div
          style={{
            position: 'absolute',
            left: 246,
            top: 148,
            display: 'flex',
            flexDirection: 'column',
            gap: 9,
            background: tint(C.white, 0.9),
            border: `3px dashed ${tint(C.ink, 0.5)}`,
            padding: '9px 11px',
          }}
        >
          {gauges.map((g) => (
            <Gauge
              key={g.label}
              label={g.label}
              value={g.value}
              color={g.color}
              p={revealAt(state, g.at, localFrame, true, 32)}
              width={196}
            />
          ))}
        </div>

        {/* floating note */}
        <div
          style={{
            position: 'absolute',
            right: 18,
            top: 42,
            opacity: revealAt(state, isA ? 2 : 4, localFrame, true, 28),
          }}
        >
          <div
            style={{
              background: isA ? C.salmon : C.mustard,
              border: `3px solid ${C.ink}`,
              boxShadow: SHADOW_SM,
              padding: '6px 11px',
              fontFamily: FONT_MONO,
              fontWeight: 700,
              fontSize: 13,
              transform: 'rotate(3deg)',
              whiteSpace: 'nowrap',
            }}
          >
            {isA ? 'ZERO ERRORS LOGGED' : '+ 1 HUMAN SLIP'}
          </div>
        </div>

        {/* stamp */}
        <div style={{ position: 'absolute', right: 22, bottom: 22, opacity: stamp, pointerEvents: 'none' }}>
          <Stamp
            color={isA ? C.salmon : '#4E9E8F'}
            rotate={isA ? -12 : -8}
            fontSize={42}
            scale={0.78 + stamp * 0.22}
          >
            {isA ? 'THREAT' : 'TRUSTED'}
          </Stamp>
        </div>
      </ComicPanel>
    </div>
  );
};

export const HookSection: React.FC<{ beat: Beat; localFrame: number }> = ({ beat, localFrame }) => {
  const frame = useCurrentFrame();
  const state = beat.stateIndex;
  const aFocus = interpolate(frame, keyFrames, focusA, opts);
  const bFocus = interpolate(frame, keyFrames, focusB, opts);

  const outcome = revealAt(state, 6, localFrame, true, 34);
  const hostility = revealAt(state, 7, localFrame, true, 34);
  const arrowP = revealAt(state, 0, localFrame, false, 30);
  const logicArrow = revealAt(state, 5, localFrame, true, 30);
  const crowd = revealAt(state, 7, localFrame, true, 36);

  return (
    <div style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%' }}>
      <Doodles
        seed={1}
        spots={[
          [1690, 690, 'gear', 62],
          [1610, 760, 'sparkle', 30],
          [40, 745, 'star', 26],
        ]}
      />

      <div
        style={{
          position: 'absolute',
          left: 10,
          top: 0,
          display: 'flex',
          alignItems: 'center',
          gap: 16,
        }}
      >
        <CandidateCard which="A" state={state} localFrame={localFrame} focus={aFocus} frame={frame} />

        {/* VS badge */}
        <div style={{ position: 'relative', width: 120, height: 120, flexShrink: 0 }}>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Burst size={158} color={C.mustard} spin={frame * 0.5} />
          </div>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: FONT_HEAD,
              fontWeight: 700,
              fontStyle: 'italic',
              fontSize: 42,
              color: C.ink,
            }}
          >
            VS
          </div>
          <div
            style={{
              position: 'absolute',
              left: 6,
              top: -26,
              transform: `scale(${0.6 + outcome * 0.4})`,
              opacity: outcome,
            }}
          >
            <Star size={30} color={C.salmon} rotate={14} />
          </div>
        </div>

        <CandidateCard which="B" state={state} localFrame={localFrame} focus={bFocus} frame={frame} />
      </div>

      {/* ---- outcome strip ---- */}
      <div style={{ position: 'absolute', left: 10, top: 498, width: 1740, height: 140 }}>
        <div style={{ position: 'absolute', left: 22, top: 34, opacity: arrowP * (state >= 6 ? 0.3 : 1) }}>
          <SketchArrow w={176} color={C.mustard} rotate={-5} />
        </div>
        <div style={{ position: 'absolute', left: 26, top: -2, opacity: arrowP * (state >= 6 ? 0.55 : 1) }}>
          <HandLabel size={23} rotate={-3} underline={false}>
            LOGIC SAYS A WINS
          </HandLabel>
        </div>

        {logicArrow > 0.2 && state >= 6 && (
          <div style={{ position: 'absolute', left: 96, top: 54, opacity: logicArrow }}>
            <div
              style={{
                fontFamily: FONT_HEAD,
                fontWeight: 700,
                fontSize: 54,
                color: C.red,
                transform: 'rotate(-12deg)',
              }}
            >
              ✕
            </div>
          </div>
        )}

        {/* winner panel */}
        <div
          style={{
            position: 'absolute',
            left: 556,
            top: -6,
            width: 640,
            height: 86,
            opacity: outcome,
            transform: `scale(${0.8 + outcome * 0.2}) rotate(${(1 - outcome) * -3}deg)`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <HandLabel size={27} rotate={-1.5}>
            THE OFFER GOES TO CANDIDATE B
          </HandLabel>
          <div style={{ display: 'flex', gap: 10 }}>
            {['THE OFFER', 'THE ALLIES', 'THE TRUST'].map((t, i) => (
              <div
                key={t}
                style={{
                  background: C.mustard,
                  border: `3px solid ${C.ink}`,
                  boxShadow: SHADOW_SM,
                  padding: '6px 12px',
                  fontFamily: FONT_MONO,
                  fontWeight: 700,
                  fontSize: 14,
                  transform: `rotate(${i % 2 ? 2.6 : -2}deg)`,
                }}
              >
                {t}
              </div>
            ))}
          </div>
        </div>

        <div style={{ position: 'absolute', right: 26, top: 30, opacity: outcome }}>
          <SketchArrow w={176} color="#4E9E8F" rotate={4} flip />
        </div>

        {/* hostility row: reacting crowd (left) + red banner (centre) */}
        <div
          style={{
            position: 'absolute',
            left: 236,
            bottom: -8,
            opacity: hostility,
            transform: `translateY(${(1 - hostility) * 12}px) scale(0.86)`,
            transformOrigin: 'left bottom',
          }}
        >
          <AudienceRow count={5} width={430} ready={crowd} color={C.grey} />
        </div>
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: 92,
            height: 44,
            marginLeft: -14,
            transform: `translateX(-50%) translateY(${(1 - hostility) * 12}px) rotate(-0.6deg)`,
            opacity: hostility,
            background: C.salmon,
            border: `3px solid ${C.ink}`,
            boxShadow: SHADOW_SM,
            padding: '7px 16px',
            fontFamily: FONT_MONO,
            fontWeight: 700,
            fontSize: 15,
            letterSpacing: 0.3,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            whiteSpace: 'nowrap',
          }}
        >
          <span style={{ width: 11, height: 11, background: C.red, border: `2px solid ${C.ink}` }} />
          A ROOM FULL OF DEFENSIVE HOSTILITY
        </div>
      </div>
    </div>
  );
};
