import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { Monolith, Talker } from './art/Monolith';

/** Scratch pad for the v2 cast: extreme cases side by side, at real size. */
export const CastTest: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const talk = Math.abs(Math.sin(t * 5));

  return (
    <AbsoluteFill style={{ background: '#F4EFE2' }}>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080">
        <rect x={0} y={820} width={1920} height={260} fill="#E7DFCE" />
        {/* A: pristine */}
        <Monolith x={330} y={820} scale={1.15} color="#2E4A5A" accent="#8BB8B8" mood="smug" talk={0} idle={t} />
        {/* B: same blocks, one askew */}
        <Monolith x={690} y={820} scale={1.15} color="#C98B3E" accent="#F2CA6B" askew={0.85} mood="deflect" talk={talk} idle={t} />
        {/* the talker at hero scale */}
        <Talker x={1230} y={860} scale={1.05} talk={talk} mood="smile" point={0.7} idle={t} />
        {/* a small stack for far shots */}
        <Monolith x={1680} y={820} scale={0.6} color="#8E3B27" accent="#E39A83" askew={0.3} mood="flat" talk={0} idle={t} />
      </svg>
    </AbsoluteFill>
  );
};
