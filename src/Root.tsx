import React from 'react';
import { Composition } from 'remotion';
import { Part1 } from './Part1';
import { audioMeta } from './timeline';

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="Part1"
      component={Part1}
      durationInFrames={audioMeta.frames}
      fps={audioMeta.fps}
      width={audioMeta.width}
      height={audioMeta.height}
    />
  );
};
