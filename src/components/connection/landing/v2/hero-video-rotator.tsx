'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { pickNextHeroVideo } from '@/lib/connection/landing/hero-videos';

const FADE_MS = 400;
const PRELOAD_THRESHOLD = 0.85;

type HeroVideoRotatorProps = {
  videos: readonly string[];
  initialSrc: string;
  visibilityClassName: string;
};

function waitForVideoData(video: HTMLVideoElement): Promise<void> {
  if (video.readyState >= 2) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const onReady = () => {
      cleanup();
      resolve();
    };
    const onError = () => {
      cleanup();
      reject(new Error('video load failed'));
    };
    const cleanup = () => {
      video.removeEventListener('loadeddata', onReady);
      video.removeEventListener('error', onError);
    };
    video.addEventListener('loadeddata', onReady, { once: true });
    video.addEventListener('error', onError, { once: true });
    video.load();
  });
}

export function HeroVideoRotator({ videos, initialSrc, visibilityClassName }: HeroVideoRotatorProps) {
  const [activeSlot, setActiveSlot] = useState(0);
  const [slotSources, setSlotSources] = useState<[string, string]>(() => [initialSrc, initialSrc]);
  const [opacities, setOpacities] = useState<[number, number]>(() => [1, 0]);

  const currentSrcRef = useRef(initialSrc);
  const failedRef = useRef(new Set<string>());
  const transitioningRef = useRef(false);
  const preloadedNextRef = useRef<string | null>(null);
  const skipAttemptsRef = useRef(0);
  const activeSlotRef = useRef(0);
  const videoRef0 = useRef<HTMLVideoElement>(null);
  const videoRef1 = useRef<HTMLVideoElement>(null);
  const refs = [videoRef0, videoRef1] as const;

  useEffect(() => {
    activeSlotRef.current = activeSlot;
  }, [activeSlot]);

  const playVideo = useCallback(async (video: HTMLVideoElement | null) => {
    if (!video) return false;
    try {
      await video.play();
      return true;
    } catch {
      return false;
    }
  }, []);

  const advanceToNext = useCallback(
    async (fromSlot: number) => {
      if (transitioningRef.current) return;
      transitioningRef.current = true;

      const nextSrc = pickNextHeroVideo(videos, currentSrcRef.current, failedRef.current);
      if (!nextSrc) {
        transitioningRef.current = false;
        return;
      }

      if (skipAttemptsRef.current >= videos.length) {
        transitioningRef.current = false;
        return;
      }

      const inactiveSlot = fromSlot === 0 ? 1 : 0;
      const inactiveVideo = refs[inactiveSlot].current;
      preloadedNextRef.current = null;

      if (!inactiveVideo) {
        transitioningRef.current = false;
        return;
      }

      setSlotSources((prev) => {
        if (prev[inactiveSlot] === nextSrc) return prev;
        const next: [string, string] = [...prev];
        next[inactiveSlot] = nextSrc;
        return next;
      });

      await new Promise((resolve) => requestAnimationFrame(resolve));

      try {
        if (inactiveVideo.getAttribute('src') !== nextSrc) {
          inactiveVideo.src = nextSrc;
        }
        await waitForVideoData(inactiveVideo);
        inactiveVideo.currentTime = 0;

        const played = await playVideo(inactiveVideo);
        if (!played) {
          failedRef.current.add(nextSrc);
          skipAttemptsRef.current += 1;
          transitioningRef.current = false;
          void advanceToNext(fromSlot);
          return;
        }

        skipAttemptsRef.current = 0;
        setOpacities(inactiveSlot === 0 ? [1, 0] : [0, 1]);

        window.setTimeout(() => {
          refs[fromSlot].current?.pause();
          currentSrcRef.current = nextSrc;
          activeSlotRef.current = inactiveSlot;
          setActiveSlot(inactiveSlot);
          transitioningRef.current = false;
        }, FADE_MS);
      } catch {
        failedRef.current.add(nextSrc);
        skipAttemptsRef.current += 1;
        transitioningRef.current = false;
        void advanceToNext(fromSlot);
      }
    },
    [playVideo, videos],
  );

  useEffect(() => {
    const video = refs[activeSlot].current;
    if (!video) return;

    const onTimeUpdate = () => {
      if (transitioningRef.current || !Number.isFinite(video.duration) || video.duration <= 0) return;
      if (video.currentTime / video.duration < PRELOAD_THRESHOLD) return;
      if (preloadedNextRef.current) return;

      const nextSrc = pickNextHeroVideo(videos, currentSrcRef.current, failedRef.current);
      if (!nextSrc) return;

      const inactiveSlot = activeSlot === 0 ? 1 : 0;
      preloadedNextRef.current = nextSrc;
      setSlotSources((prev) => {
        if (prev[inactiveSlot] === nextSrc) return prev;
        const next: [string, string] = [...prev];
        next[inactiveSlot] = nextSrc;
        return next;
      });
    };

    video.addEventListener('timeupdate', onTimeUpdate);
    return () => video.removeEventListener('timeupdate', onTimeUpdate);
  }, [activeSlot, videos]);

  useEffect(() => {
    const video = refs[activeSlot].current;
    if (!video) return;

    const onEnded = () => {
      void advanceToNext(activeSlotRef.current);
    };

    const onError = () => {
      failedRef.current.add(currentSrcRef.current);
      void advanceToNext(activeSlotRef.current);
    };

    video.addEventListener('ended', onEnded);
    video.addEventListener('error', onError);
    return () => {
      video.removeEventListener('ended', onEnded);
      video.removeEventListener('error', onError);
    };
  }, [activeSlot, advanceToNext]);

  useEffect(() => {
    void playVideo(refs[0].current);
  }, [playVideo]);

  return (
    <div className={`absolute inset-0 bg-[#0f1412] ${visibilityClassName}`} aria-hidden>
      {([0, 1] as const).map((slot) => (
        <video
          key={slot}
          ref={refs[slot]}
          className='absolute inset-0 h-full w-full object-cover transition-opacity duration-[400ms] ease-in-out'
          style={{ opacity: opacities[slot] }}
          src={slotSources[slot]}
          muted
          playsInline
          autoPlay={slot === 0}
          preload='metadata'
        />
      ))}
    </div>
  );
}
