import React, { useEffect, useState } from 'react';
import { continueRender, delayRender, staticFile } from 'remotion';

const f = (name: string) => staticFile(`fonts/${name}`);

const css = `
@font-face {
  font-family: 'Comic Neue';
  src: url('${f('comic-neue-latin-700-italic.woff2')}') format('woff2');
  font-weight: 700; font-style: italic; font-display: block;
}
@font-face {
  font-family: 'Comic Neue';
  src: url('${f('comic-neue-latin-700-normal.woff2')}') format('woff2');
  font-weight: 700; font-style: normal; font-display: block;
}
@font-face {
  font-family: 'Comic Neue';
  src: url('${f('comic-neue-latin-400-normal.woff2')}') format('woff2');
  font-weight: 400; font-style: normal; font-display: block;
}
@font-face {
  font-family: 'Comic Neue';
  src: url('${f('comic-neue-latin-400-italic.woff2')}') format('woff2');
  font-weight: 400; font-style: italic; font-display: block;
}
@font-face {
  font-family: 'Space Mono';
  src: url('${f('space-mono-latin-700-normal.woff2')}') format('woff2');
  font-weight: 700; font-style: normal; font-display: block;
}
@font-face {
  font-family: 'Space Mono';
  src: url('${f('space-mono-latin-700-italic.woff2')}') format('woff2');
  font-weight: 700; font-style: italic; font-display: block;
}
@font-face {
  font-family: 'Space Mono';
  src: url('${f('space-mono-latin-400-normal.woff2')}') format('woff2');
  font-weight: 400; font-style: normal; font-display: block;
}
* { box-sizing: border-box; }
`;

/** Injects @font-face rules and blocks the render until both families are ready. */
export const FontFaces: React.FC = () => {
  const [handle] = useState(() => delayRender('Loading Comic Neue + Space Mono'));

  useEffect(() => {
    let cancelled = false;
    const done = () => {
      if (!cancelled) continueRender(handle);
    };
    if (typeof document === 'undefined' || !document.fonts) {
      done();
      return;
    }
    Promise.all([
      document.fonts.load('700 italic 72px "Comic Neue"'),
      document.fonts.load('700 72px "Comic Neue"'),
      document.fonts.load('400 40px "Comic Neue"'),
      document.fonts.load('700 30px "Space Mono"'),
      document.fonts.load('400 26px "Space Mono"'),
    ])
      .then(done)
      .catch(done);
    return () => {
      cancelled = true;
    };
  }, [handle]);

  return <style>{css}</style>;
};
