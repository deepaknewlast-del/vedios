import { Easing, interpolate } from 'remotion';
import meta from './audio_meta.json';
import beatsData from './data/beats.json';

export const FPS = meta.fps as number;
export const WIDTH = meta.width as number;
export const HEIGHT = meta.height as number;
export const DURATION_SEC = meta.duration as number;
export const TOTAL_FRAMES = meta.frames as number;
export const audioMeta = meta;

export type StateDef = {
  at: number;
  caption: string;
  zoom: number;
  pan: [number, number];
  focus?: string;
  note: string;
};

export type SectionDef = {
  id: string;
  number: number;
  start: number;
  end: number;
  title: string;
  subtitle: string;
  states: StateDef[];
};

export type Section = SectionDef & {
  startFrame: number;
  endFrame: number;
  index: number;
};

export type Beat = StateDef & {
  index: number;
  section: Section;
  stateIndex: number;
  start: number;
  end: number;
  startFrame: number;
  endFrame: number;
  frames: number;
};

export const PROGRAM = beatsData.program;

export const SECTIONS: Section[] = (beatsData.sections as SectionDef[]).map(
  (s, index) => ({
    ...s,
    index,
    startFrame: Math.round(s.start * FPS),
    endFrame: Math.round(s.end * FPS),
  }),
);

/** Each beat begins exactly on the narration cue that motivates it. */
export const BEATS: Beat[] = SECTIONS.flatMap((section) =>
  section.states.map((state, stateIndex) => {
    const isLast = stateIndex === section.states.length - 1;
    const start = state.at;
    const end = isLast ? section.end : section.states[stateIndex + 1].at;
    const startFrame = Math.round(start * FPS);
    const endFrame = Math.round(end * FPS);
    return {
      ...state,
      index: -1,
      section,
      stateIndex,
      start,
      end,
      startFrame,
      endFrame,
      frames: endFrame - startFrame,
    };
  }),
).map((b, i) => ({ ...b, index: i }));

export const CLICK_TIMES = BEATS.slice(1).map((b) => b.start);
export const WHOOSH_TIMES = [0.12, 34.5, 80.0, 133.2];

export const beatAtFrame = (frame: number): Beat => {
  for (let i = BEATS.length - 1; i >= 0; i--) {
    if (frame >= BEATS[i].startFrame) return BEATS[i];
  }
  return BEATS[0];
};

export const sectionAtFrame = (frame: number): Section => {
  const found = SECTIONS.find((s) => frame < s.endFrame);
  return found ?? SECTIONS[SECTIONS.length - 1];
};

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

export const timecode = (frame: number) => {
  const secs = Math.max(0, Math.floor(frame / FPS));
  return `${String(Math.floor(secs / 60)).padStart(2, '0')}:${String(
    secs % 60,
  ).padStart(2, '0')}`;
};

const keyFrames = BEATS.map((b) => b.startFrame);
const zoomKeys = BEATS.map((b) => b.zoom);
const panXKeys = BEATS.map((b) =>
  b.pan[0] + (BEATS[Math.max(0, b.index - 1)].pan[0] - b.pan[0]) * 0.06,
);
const panYKeys = BEATS.map((b) => b.pan[1]);

const opts = {
  extrapolateLeft: 'clamp' as const,
  extrapolateRight: 'clamp' as const,
  easing: Easing.inOut(Easing.quad),
};

/** Continuous eased push-in / pan — a fresh camera state every 3–5 seconds. */
export const cameraAtFrame = (frame: number) => {
  const driftX = Math.sin(frame / 210) * 4;
  const driftY = Math.cos(frame / 268) * 3;
  const breathe = Math.sin(frame / 101) * 0.0018;
  return {
    scale: interpolate(frame, keyFrames, zoomKeys, opts) + breathe,
    x: interpolate(frame, keyFrames, panXKeys, opts) + driftX,
    y: interpolate(frame, keyFrames, panYKeys, opts) + driftY,
  };
};

/** Narration line live at `time` (seconds), for the transcript ribbon. */
export const narrationAt = (
  cues: { start: number; end: number; text: string }[],
  time: number,
) => {
  if (!cues.length) return '';
  let best = cues[0];
  for (const c of cues) {
    if (time >= c.start - 0.05) best = c;
    else break;
  }
  return best.text;
};
