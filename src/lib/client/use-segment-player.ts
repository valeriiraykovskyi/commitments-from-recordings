"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type Segment = { start: number; end: number };

/** Playback starts a little early and stops a little late so words are not clipped. */
const LEAD_IN_SEC = 0.15;
const TAIL_SEC = 0.1;
/** How often the reported position is refreshed while playing. */
const POSITION_INTERVAL_MS = 80;

export type SegmentPlayer = {
  /** Plays a segment; playing the segment that is already playing stops it. */
  play: (segment: Segment) => void;
  stop: () => void;
  /** The segment being played, if any. */
  active: Segment | null;
  /** Playback position in seconds while something plays. */
  position: number | null;
};

export const isSameSegment = (a: Segment | null, b: Segment): boolean =>
  a !== null && a.start === b.start && a.end === b.end;

type Playing = { src: string; segment: Segment; position: number };

/**
 * One hidden audio element for the whole page: evidence quotes and
 * transcript lines all play through it, so only one thing plays at a time.
 * The end of a segment is checked on every animation frame for precision,
 * and on `timeupdate` as a backstop, because frames stop in a hidden tab
 * while the audio keeps playing.
 */
export function useSegmentPlayer(src: string | null): SegmentPlayer {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const activeRef = useRef<Segment | null>(null);
  const frameRef = useRef(0);
  const detachRef = useRef<() => void>(() => {});
  const [playing, setPlaying] = useState<Playing | null>(null);

  const stop = useCallback(() => {
    cancelAnimationFrame(frameRef.current);
    detachRef.current();
    audioRef.current?.pause();
    activeRef.current = null;
    setPlaying(null);
  }, []);

  useEffect(() => {
    const audio = new Audio();
    audio.preload = "auto";
    audioRef.current = audio;
    return () => {
      cancelAnimationFrame(frameRef.current);
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    cancelAnimationFrame(frameRef.current);
    detachRef.current();
    audio.pause();
    activeRef.current = null;
    if (src) {
      audio.src = src;
    } else {
      audio.removeAttribute("src");
      audio.load();
    }
  }, [src]);

  const play = useCallback(
    (segment: Segment) => {
      const audio = audioRef.current;
      if (!audio || !src) return;
      if (isSameSegment(activeRef.current, segment)) {
        stop();
        return;
      }
      cancelAnimationFrame(frameRef.current);
      detachRef.current();
      activeRef.current = segment;
      const end = segment.end + TAIL_SEC;
      audio.currentTime = Math.max(0, segment.start - LEAD_IN_SEC);
      setPlaying({ src, segment, position: audio.currentTime });

      /** False once this segment is over or was replaced. */
      const stillPlaying = () => {
        if (activeRef.current !== segment) return false;
        if (audio.ended || audio.currentTime >= end) {
          stop();
          return false;
        }
        return true;
      };
      const publish = () => {
        const position = audio.currentTime;
        setPlaying((current) =>
          current && current.segment === segment ? { ...current, position } : current,
        );
      };

      const onTimeUpdate = () => {
        if (stillPlaying()) publish();
      };
      audio.addEventListener("timeupdate", onTimeUpdate);
      audio.addEventListener("ended", onTimeUpdate);
      detachRef.current = () => {
        audio.removeEventListener("timeupdate", onTimeUpdate);
        audio.removeEventListener("ended", onTimeUpdate);
        detachRef.current = () => {};
      };

      let lastUpdate = 0;
      const tick = (time: number) => {
        if (!stillPlaying()) return;
        if (time - lastUpdate >= POSITION_INTERVAL_MS) {
          lastUpdate = time;
          publish();
        }
        frameRef.current = requestAnimationFrame(tick);
      };
      frameRef.current = requestAnimationFrame(tick);

      audio.play().catch(() => {
        if (activeRef.current === segment) stop();
      });
    },
    [src, stop],
  );

  const current = playing && playing.src === src ? playing : null;
  return { play, stop, active: current?.segment ?? null, position: current?.position ?? null };
}
