import React from 'react';
import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from 'remotion';
import { ease } from './anim';
import { PageChrome, PLATE, RIBBON, STAGE } from './components/Chrome';
import { FontFaces } from './Fonts';
import { FilmGrain, GraphPaper } from './components/Paper';
import { C, FONT_MONO, SHADOW_SM, tint } from './theme';
import {
  beatAtFrame,
  cameraAtFrame,
  FPS,
  narrationAt,
  SECTIONS,
  sectionAtFrame,
  timecode,
  TOTAL_FRAMES,
} from './timeline';
import { HookSection } from './sections/Hook';
import { LabSection } from './sections/Lab';
import { MatrixSection } from './sections/Matrix';
import { SectionHeader } from './sections/SectionHeader';
import narration from './data/narration.json';

const SECTION_COLORS = [C.mustard, C.tealLight, C.salmon];

/** Bottom figure ribbon: beat caption + the narration line currently spoken. */
const FigureRibbon: React.FC<{ frame: number; caption: string; kind: string; number: number }> = ({
  frame,
  caption,
  kind,
  number,
}) => {
  const spoken = narrationAt(narration, frame / FPS);
  return (
    <div
      style={{
        position: 'absolute',
        left: RIBBON.left,
        top: RIBBON.top,
        width: RIBBON.width,
        height: RIBBON.height - 6,
        borderTop: `3px solid ${C.ink}`,
        display: 'flex',
        alignItems: 'stretch',
        zIndex: 6,
      }}
    >
      <div
        style={{
          width: 92,
          background: SECTION_COLORS[number - 1],
          border: `3px solid ${C.ink}`,
          boxShadow: SHADOW_SM,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: FONT_MONO,
          fontWeight: 700,
          fontSize: 26,
          flexShrink: 0,
        }}
      >
        §{number}
      </div>
      <div style={{ flex: 1, minWidth: 0, padding: '4px 16px', overflow: 'hidden' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 12,
          }}
        >
          <div
            style={{
              fontFamily: FONT_MONO,
              fontWeight: 700,
              fontSize: 21,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              flex: '1 1 auto',
              minWidth: 0,
            }}
          >
            {caption}
          </div>
          <div
            style={{
              fontFamily: FONT_MONO,
              fontWeight: 700,
              fontSize: 12,
              padding: '2px 7px',
              border: `2px solid ${C.ink}`,
              background: C.white,
              whiteSpace: 'nowrap',
              letterSpacing: 0.4,
              flexShrink: 0,
            }}
          >
            {kind}
          </div>
        </div>
        <div
          style={{
            fontFamily: FONT_MONO,
            fontSize: 13.5,
            marginTop: 3,
            opacity: 0.66,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          TRANSCRIPT // {spoken}
        </div>
      </div>
      <div
        style={{
          width: 104,
          flexShrink: 0,
          borderLeft: `3px solid ${C.ink}`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: FONT_MONO,
          fontWeight: 700,
          fontSize: 18,
        }}
      >
        <div>{timecode(frame)}</div>
        <div style={{ fontSize: 11, opacity: 0.6 }}>TC / P1</div>
      </div>
    </div>
  );
};

/** Hard ink wipe at the two chapter boundaries. */
const ChapterWipe: React.FC<{ frame: number }> = ({ frame }) => {
  const boundaries = SECTIONS.slice(1).map((sec) => sec.startFrame);
  for (let i = 0; i < boundaries.length; i++) {
    const start = boundaries[i];
    if (frame < start || frame > start + 22) continue;
    const p = ease(frame, start, start + 22);
    return (
      <>
        <div
          style={{
            position: 'absolute',
            left: `${-16 + p * 118}%`,
            top: 0,
            width: '16%',
            height: '100%',
            background: C.ink,
            opacity: 0.9,
            zIndex: 7,
            transform: 'skewX(-9deg)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: `${-16 + p * 118 + 3}%`,
            top: 0,
            width: '1.4%',
            height: '100%',
            background: i === 0 ? C.mustard : C.teal,
            zIndex: 7,
            transform: 'skewX(-9deg)',
          }}
        />
      </>
    );
  }
  return null;
};

export const Part1: React.FC = () => {
  const frame = useCurrentFrame();
  if (process.env.REMOTION_BARE === '1') {
    return (
      <AbsoluteFill style={{ backgroundColor: '#F4EFE2', fontSize: 120 }}>
        BARE {frame}
      </AbsoluteFill>
    );
  }
  const beat = beatAtFrame(frame);
  const section = sectionAtFrame(frame);
  const localFrame = frame - beat.startFrame;
  const frameInSection = frame - section.startFrame;
  const cam = cameraAtFrame(frame);
  const sinceBeat = frame - beat.startFrame;
  const flash = sinceBeat < 9 ? (1 - sinceBeat / 9) * 0.075 : 0;
  const endP = ease(frame, TOTAL_FRAMES - 120, TOTAL_FRAMES - 25);

  return (
    <AbsoluteFill style={{ backgroundColor: C.paper }}>
      <FontFaces />
      <Audio src={staticFile('part1_mix.wav')} />

      <GraphPaper />

      {/* ---------- PLATE (camera-transformed) ---------- */}
      <div
        style={{
          position: 'absolute',
          left: PLATE.left,
          top: PLATE.top,
          width: PLATE.width,
          height: PLATE.height,
          overflow: 'hidden',
          zIndex: 2,
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            transform: `translate(${cam.x}px, ${cam.y}px) scale(${cam.scale})`,
            transformOrigin: '50% 50%',
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: STAGE.left,
              top: STAGE.top,
              width: STAGE.width,
              height: STAGE.height,
            }}
          >
            {section.id === 'hook' && <HookSection beat={beat} localFrame={localFrame} />}
            {section.id === 'lab' && <LabSection beat={beat} localFrame={localFrame} />}
            {section.id === 'matrix' && <MatrixSection beat={beat} localFrame={localFrame} />}
          </div>
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          left: PLATE.left,
          top: PLATE.top,
          width: PLATE.width,
          height: 108,
          overflow: 'hidden',
          zIndex: 3,
        }}
      >
        <SectionHeader
          section={section}
          frameInSection={frameInSection}
          note={beat.note}
          noteColor={SECTION_COLORS[section.index]}
        />
      </div>

      <PageChrome />
      <FigureRibbon
        frame={frame}
        caption={beat.caption}
        kind={beat.note}
        number={section.number}
      />

      {/* end card */}
      <div
        style={{
          position: 'absolute',
          right: 96,
          top: RIBBON.top + 12,
          opacity: endP,
          zIndex: 6,
          transform: `translateY(${(1 - endP) * 12}px)`,
        }}
      >
        <div
          style={{
            background: C.ink,
            color: C.white,
            fontFamily: FONT_MONO,
            fontWeight: 700,
            fontSize: 15,
            letterSpacing: 1.6,
            padding: '6px 13px',
          }}
        >
          END OF PART 1 — 2:15 / 4:30
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: C.white,
          opacity: flash,
          pointerEvents: 'none',
          zIndex: 8,
        }}
      />
      <ChapterWipe frame={frame} />
      {process.env.REMOTION_GRAIN_OFF !== '1' && <FilmGrain />}
    </AbsoluteFill>
  );
};
