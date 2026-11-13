import React from 'react';
import { Composition } from 'remotion';
import { Part1 } from './Part1';
import { CastTest } from './CastTest';
import { Part1V2, PART1_V2_FRAMES } from './Part1V2';
import { Part1 as Part1Panggung } from './Part1Panggung';
import { StyleTest } from './StyleTest';
import { audioMeta } from './timeline';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="Part1"
        component={Part1}
        durationInFrames={audioMeta.frames}
        fps={audioMeta.fps}
        width={audioMeta.width}
        height={audioMeta.height}
      />
      <Composition id="Part1V2" component={Part1V2} durationInFrames={PART1_V2_FRAMES} fps={60} width={1920} height={1080} />
      <Composition id="CastTest" component={CastTest} durationInFrames={600} fps={60} width={1920} height={1080} />
      <Composition id="StyleTest" component={StyleTest} durationInFrames={1020} fps={60} width={1920} height={1080} />
      <Composition id="Part1Panggung" component={Part1Panggung} durationInFrames={8100} fps={60} width={1920} height={1080} />
    </>
  );
};
