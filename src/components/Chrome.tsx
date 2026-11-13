import React from 'react';
import { useCurrentFrame } from 'remotion';
import { BORDER, C, FONT_HEAD, FONT_MONO, SHADOW_SM, tint } from '../theme';
import { clamp01, DURATION_SEC, FPS, SECTIONS, timecode, TOTAL_FRAMES } from '../timeline';
import { BinderHoles } from './Ink';

const INSET = 22;
const W = 1920;
const HEADER_H = 82;
const FOOTER_H = 76;

const Taglet: React.FC<{ children: React.ReactNode; bg?: string }> = ({
  children,
  bg = C.paper,
}) => (
  <div
    style={{
      background: bg,
      border: `3px solid ${C.ink}`,
      boxShadow: SHADOW_SM,
      padding: '5px 11px',
      fontFamily: FONT_MONO,
      fontWeight: 700,
      fontSize: 17,
      letterSpacing: 1,
      whiteSpace: 'nowrap',
    }}
  >
    {children}
  </div>
);

export const PageChrome: React.FC = () => {
  const frame = useCurrentFrame();
  const progress = clamp01(frame / Math.max(1, TOTAL_FRAMES - 1));
  const railSegments = SECTIONS.map((s) => (s.end - s.start) / DURATION_SEC);

  return (
    <>
      {/* plate frame */}
      <div
        style={{
          position: 'absolute',
          inset: INSET,
          border: BORDER,
          pointerEvents: 'none',
          zIndex: 3,
        }}
      />
      <BinderHoles
        style={{ position: 'absolute', left: 3, top: 300, gap: 60, zIndex: 4 }}
      />

      {/* header */}
      <div
        style={{
          position: 'absolute',
          left: INSET,
          right: INSET,
          top: INSET,
          height: HEADER_H,
          borderBottom: BORDER,
          display: 'flex',
          alignItems: 'center',
          gap: 22,
          padding: '0 24px',
          overflow: 'hidden',
          zIndex: 5,
        }}
      >
        <div
          style={{
            width: 56,
            height: 46,
            background: C.ink,
            color: C.white,
            fontFamily: FONT_MONO,
            fontWeight: 700,
            fontSize: 19,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            letterSpacing: -1,
            boxShadow: SHADOW_SM,
          }}
        >
          TOB
        </div>
        <div
          style={{
            fontFamily: FONT_HEAD,
            fontWeight: 700,
            fontStyle: 'italic',
            fontSize: 38,
            letterSpacing: -0.5,
            lineHeight: 1,
            transform: 'rotate(-1.2deg)',
          }}
        >
          Theory of Behaviour
        </div>
        <div
          style={{
            flex: 1,
            fontFamily: FONT_MONO,
            fontSize: 15,
            fontWeight: 700,
            letterSpacing: 1.1,
            opacity: 0.72,
            textAlign: 'center',
          }}
        >
          FIELD NOTES / BEHAVIORAL SCIENCE / VOL. 01
        </div>
        <Taglet bg={C.mustard}>PART 1 — 2:15</Taglet>
        <Taglet bg={C.tealLight}>1080p / 60</Taglet>
      </div>

      {/* footer progress rail */}
      <div
        style={{
          position: 'absolute',
          left: INSET,
          right: INSET,
          bottom: INSET,
          height: FOOTER_H,
          borderTop: BORDER,
          display: 'flex',
          alignItems: 'center',
          gap: 22,
          padding: '0 26px',
          zIndex: 5,
        }}
      >
        <div
          style={{
            fontFamily: FONT_MONO,
            fontWeight: 700,
            fontSize: 20,
            minWidth: 132,
          }}
        >
          {timecode(frame)} / 02:15
        </div>
        <div
          style={{
            position: 'relative',
            flex: 1,
            height: 30,
            border: BORDER,
            background: C.paper,
            display: 'flex',
            overflow: 'hidden',
          }}
        >
          {railSegments.map((w, i) => (
            <div
              key={i}
              style={{
                width: `${w * 100}%`,
                borderRight: i < railSegments.length - 1 ? BORDER : undefined,
                background:
                  i === 0
                    ? tint(C.mustard, 0.55)
                    : i === 1
                      ? tint(C.tealLight, 0.6)
                      : tint(C.salmon, 0.45),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: FONT_MONO,
                fontWeight: 700,
                fontSize: 14,
                letterSpacing: 1.4,
              }}
            >
              {['01 HOOK', '02 LAB / 1966', '03 MATRIX'][i]}
            </div>
          ))}
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: `${progress * 100}%`,
              background: tint(C.ink, 0.12),
              pointerEvents: 'none',
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: `calc(${progress * 100}% - 7px)`,
              top: -2,
              width: 14,
              height: 34,
              background: C.red,
              border: `3px solid ${C.ink}`,
              pointerEvents: 'none',
            }}
          />
        </div>
        <div
          style={{
            fontFamily: FONT_MONO,
            fontSize: 16,
            fontWeight: 700,
            letterSpacing: 1,
            minWidth: 150,
            textAlign: 'right',
            opacity: 0.8,
          }}
        >
          FRAME {String(frame).padStart(4, '0')} / {TOTAL_FRAMES}
        </div>
      </div>
    </>
  );
};

/** Fixed page geometry (all coordinates are absolute 1920×1080 pixels). */
export const INSET_PX = INSET;
export const PLATE = {
  left: INSET,
  top: INSET + HEADER_H,
  width: W - INSET * 2,
  height: 796,
} as const;
export const RIBBON = {
  left: PLATE.left,
  top: PLATE.top + PLATE.height + 8,
  width: PLATE.width,
  height: 66,
} as const;
export const FOOTER_TOP = 1080 - (INSET + FOOTER_H);

/** Inner stage for section artwork (inside PLATE, below the section header). */
export const STAGE = {
  left: 30,
  top: 112,
  width: PLATE.width - 60,
  height: PLATE.height - 118,
} as const;
