import React from 'react';
import { ease } from '../anim';
import { SquareBadge, Tag } from '../components/Ink';
import { C, FONT_HEAD, FONT_MONO } from '../theme';
import type { Section } from '../timeline';

export const SectionHeader: React.FC<{
  section: Section;
  frameInSection: number;
  note: string;
  noteColor?: string;
}> = ({ section, frameInSection, note, noteColor = C.mustard }) => {
  const p = ease(frameInSection, 0, 20);
  return (
    <div
      style={{
        position: 'absolute',
        left: 34,
        right: 34,
        top: 6,
        height: 108,
        display: 'flex',
        alignItems: 'center',
        gap: 20,
        opacity: p,
        transform: `translateY(${(1 - p) * -18}px)`,
      }}
    >
      <SquareBadge n={section.number} size={64} />
      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <div
          style={{
            fontFamily: FONT_HEAD,
            fontWeight: 700,
            fontStyle: 'italic',
            fontSize: 50,
            lineHeight: 0.96,
            letterSpacing: -0.8,
            transform: 'rotate(-1.1deg)',
            whiteSpace: 'nowrap',
          }}
        >
          {section.title}
        </div>
        <div
          style={{
            fontFamily: FONT_MONO,
            fontWeight: 700,
            fontSize: 15,
            letterSpacing: 1.3,
            marginTop: 7,
            opacity: 0.82,
          }}
        >
          {section.subtitle}
        </div>
      </div>
      <div style={{ flex: '1 1 auto', minWidth: 8 }} />
      <Tag bg={noteColor} size={15}>
        {note}
      </Tag>
      <Tag bg={C.grey} size={14}>
        PLATE {String(section.number).padStart(2, '0')}
      </Tag>
    </div>
  );
};

/** Bottom-of-plate figure legend: keeps every plate visually anchored. */
export const FigureLegend: React.FC<{
  items: { k: string; v: string; c?: string }[];
  note: string;
}> = ({ items, note }) => (
  <div
    style={{
      position: 'absolute',
      left: 40,
      right: 34,
      top: 606,
      height: 58,
      borderTop: `3px solid ${C.ink}`,
      display: 'flex',
      alignItems: 'center',
      gap: 18,
      overflow: 'hidden',
    }}
  >
    <div
      style={{
        fontFamily: FONT_MONO,
        fontWeight: 700,
        fontSize: 13,
        letterSpacing: 1,
        opacity: 0.65,
        whiteSpace: 'nowrap',
      }}
    >
      LEGEND
    </div>
    {items.map((it) => (
      <div
        key={it.k}
        style={{ display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap' }}
      >
        <div
          style={{
            width: 15,
            height: 15,
            background: it.c ?? C.grey,
            border: `3px solid ${C.ink}`,
            flexShrink: 0,
          }}
        />
        <div style={{ fontFamily: FONT_MONO, fontWeight: 700, fontSize: 13 }}>
          {it.k}
          <span style={{ opacity: 0.6 }}> / {it.v}</span>
        </div>
      </div>
    ))}
    <div style={{ flex: 1 }} />
    <div
      style={{
        fontFamily: FONT_MONO,
        fontWeight: 700,
        fontSize: 13,
        letterSpacing: 0.6,
        opacity: 0.7,
        whiteSpace: 'nowrap',
      }}
    >
      {note}
    </div>
  </div>
);
