import { staticFile } from 'remotion';
import { useEffect, useState } from 'react';

/**
 * Mouth-sync envelope.
 *
 * Lipsync by eye is the fastest way to make a "talking" figure look dead: the
 * mouth opens on a sine wave while the voice is silent, and the illusion dies.
 * Instead we measure the actual voiceover once in the browser, keep a small
 * envelope of it, and use that number to drive every mouth in the piece.
 *
 *  - measured from the same WAV the composition plays, so it cannot drift
 *  - 30 buckets/second: enough for syllables at 60fps, tiny to keep
 *  - smoothed so mouths close on quiet consonants instead of chattering
 */

export type Envelope = { start: number; rate: number; values: Float32Array; duration: number };

let cache: Promise<Envelope> | null = null;

export const loadEnvelope = (timeline: { start: number; end: number }[], src = 'part1_mix_v2.wav') =>
  new Promise<Envelope>((resolve, reject) => {
    const url = staticFile(src);
    fetch(url)
      .then((r) => r.arrayBuffer())
      .then((buf) => {
        const ctx = new OfflineAudioContext(1, 1, 44100);
        ctx.decodeAudioData(
          buf,
          (audio) => {
            const data = audio.getChannelData(0);
            const rate = 30;
            const hop = Math.floor(audio.sampleRate / rate);
            const n = Math.floor(data.length / hop);
            const values = new Float32Array(n);
            let peak = 1e-6;
            for (let i = 0; i < n; i++) {
              let sum = 0;
              const a = i * hop;
              for (let j = a; j < a + hop; j++) sum += data[j] * data[j];
              const rms = Math.sqrt(sum / hop);
              values[i] = rms;
              if (rms > peak) peak = rms;
            }
            for (let i = 0; i < n; i++) values[i] = Math.min(1, values[i] / peak);
            // attack fast, release slow: mouths open on the syllable, close lazily
            let prev = 0;
            for (let i = 0; i < n; i++) {
              const target = values[i];
              prev = target > prev ? prev + (target - prev) * 0.65 : prev + (target - prev) * 0.22;
              values[i] = prev;
            }
            void timeline;
            resolve({ start: 0, rate, values, duration: audio.duration });
          },
          (err) => reject(err),
        );
      })
      .catch(reject);
  });

export const getEnvelope = (src: string) => {
  if (!cache) cache = loadEnvelope([], src);
  return cache;
};

export const useEnvelope = (src: string): Envelope | null => {
  const [env, setEnv] = useState<Envelope | null>(null);
  useEffect(() => {
    let alive = true;
    getEnvelope(src).then((e) => {
      if (alive) setEnv(e);
    });
    return () => {
      alive = false;
    };
  }, [src]);
  return env;
};

/** Loudness at a time in seconds, 0..1. */
export const sample = (env: Envelope | null, t: number) => {
  if (!env) return 0;
  const i = Math.floor((t - env.start) * env.rate);
  if (i < 0 || i >= env.values.length) return 0;
  return env.values[i];
};

/** Map loudness to a mouth opening that reads as speech, not as noise. */
export const mouth = (env: Envelope | null, t: number) => {
  const v = sample(env, t);
  // gate out room noise, then shape the top so it does not pin open
  const g = v < 0.10 ? 0 : (v - 0.10) / 0.55;
  return Math.min(1, Math.max(0, g)) * 0.95 + 0.05;
};
