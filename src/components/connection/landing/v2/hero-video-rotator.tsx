'use client';

import { useEffect, useRef, useState } from 'react';
import { pickNextHeroVideo } from '@/lib/connection/landing/hero-videos';

/** Standard crossfade duration (600–1000ms tunable). */
export const HERO_CROSSFADE_MS = 800;
const CROSSFADE_SEC = HERO_CROSSFADE_MS / 1000;

type HeroVideoRotatorProps = {
  videos: readonly string[];
  initialSrc: string;
  visibilityClassName: string;
};

type Slot = 0 | 1;

function inactiveSlot(active: Slot): Slot {
  return active === 0 ? 1 : 0;
}

function waitForCanPlay(video: HTMLVideoElement, signal: AbortSignal): Promise<void> {
  if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    const onCanPlay = () => {
      cleanup();
      resolve();
    };
    const onError = () => {
      cleanup();
      reject(new Error('video load failed'));
    };
    const onAbort = () => {
      cleanup();
      reject(new Error('aborted'));
    };
    const cleanup = () => {
      video.removeEventListener('canplay', onCanPlay);
      video.removeEventListener('error', onError);
      signal.removeEventListener('abort', onAbort);
    };
    video.addEventListener('canplay', onCanPlay, { once: true });
    video.addEventListener('error', onError, { once: true });
    signal.addEventListener('abort', onAbort);
  });
}

async function tryPlay(video: HTMLVideoElement): Promise<boolean> {
  try {
    video.muted = true;
    await video.play();
    return !video.paused;
  } catch {
    return false;
  }
}

const FIRST_FRAME_TIMEOUT_MS = 4000;

type VideoWithFrameCallback = HTMLVideoElement & {
  requestVideoFrameCallback?: (callback: () => void) => number;
  cancelVideoFrameCallback?: (handle: number) => void;
};

/** Wait until incoming video has a composited frame (Safari-safe before opacity fade). */
function waitForFirstFrame(video: HTMLVideoElement): Promise<boolean> {
  const hasDecodedFrame =
    video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && video.videoWidth > 0;

  if (hasDecodedFrame && video.currentTime > 0) {
    return Promise.resolve(true);
  }

  return new Promise((resolve) => {
    let settled = false;
    let rvfcHandle: number | undefined;
    let pollRaf: number | undefined;

    const finish = (ok: boolean) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(ok);
    };

    const cleanup = () => {
      window.clearTimeout(timeoutId);
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('error', onError);
      if (pollRaf !== undefined) cancelAnimationFrame(pollRaf);
      const rvfcVideo = video as VideoWithFrameCallback;
      if (rvfcHandle !== undefined && rvfcVideo.cancelVideoFrameCallback) {
        rvfcVideo.cancelVideoFrameCallback(rvfcHandle);
      }
    };

    const timeoutId = window.setTimeout(() => finish(false), FIRST_FRAME_TIMEOUT_MS);

    const onError = () => finish(false);

    const frameLooksReady = () =>
      video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && video.videoWidth > 0;

    const onTimeUpdate = () => {
      if (frameLooksReady() && (video.currentTime > 0 || !video.paused)) {
        finish(true);
      }
    };

    const pollCurrentTime = () => {
      if (frameLooksReady() && video.currentTime > 0) {
        finish(true);
        return;
      }
      pollRaf = requestAnimationFrame(pollCurrentTime);
    };

    video.addEventListener('error', onError, { once: true });

    const rvfcVideo = video as VideoWithFrameCallback;
    if (typeof rvfcVideo.requestVideoFrameCallback === 'function') {
      rvfcHandle = rvfcVideo.requestVideoFrameCallback(() => finish(true));
      return;
    }

    video.addEventListener('timeupdate', onTimeUpdate);
    pollRaf = requestAnimationFrame(pollCurrentTime);
  });
}

export function HeroVideoRotator({ videos, initialSrc, visibilityClassName }: HeroVideoRotatorProps) {
  const [activeLayer, setActiveLayer] = useState<Slot>(0);
  const [slotSources, setSlotSources] = useState<[string, string]>(() => [initialSrc, initialSrc]);
  const [opacities, setOpacities] = useState<[number, number]>(() => [1, 0]);

  const videoRef0 = useRef<HTMLVideoElement>(null);
  const videoRef1 = useRef<HTMLVideoElement>(null);

  const currentSrcRef = useRef(initialSrc);
  const nextSrcRef = useRef<string | null>(null);
  const isNextReadyRef = useRef(false);
  const isTransitioningRef = useRef(false);
  const failedRef = useRef(new Set<string>());
  const skipAttemptsRef = useRef(0);
  const activeLayerRef = useRef<Slot>(0);
  const rafRef = useRef<number | null>(null);
  const fadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prepareGenRef = useRef(0);
  const prepareAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    activeLayerRef.current = activeLayer;
  }, [activeLayer]);

  const getVideo = (slot: Slot): HTMLVideoElement | null =>
    slot === 0 ? videoRef0.current : videoRef1.current;

  useEffect(() => {
    const clearFadeTimer = () => {
      if (fadeTimerRef.current !== null) {
        clearTimeout(fadeTimerRef.current);
        fadeTimerRef.current = null;
      }
    };

    const stopRaf = () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };

    const abortPrepare = () => {
      prepareAbortRef.current?.abort();
      prepareAbortRef.current = null;
    };

    const setLayerOpacity = (active: Slot) => {
      setOpacities(active === 0 ? [1, 0] : [0, 1]);
    };

    const prepareNext = async (forInactive: Slot) => {
      abortPrepare();
      const controller = new AbortController();
      prepareAbortRef.current = controller;
      const gen = ++prepareGenRef.current;

      const nextSrc = pickNextHeroVideo(videos, currentSrcRef.current, failedRef.current);
      if (!nextSrc) {
        isNextReadyRef.current = false;
        nextSrcRef.current = null;
        return;
      }

      if (skipAttemptsRef.current >= videos.length) {
        isNextReadyRef.current = false;
        nextSrcRef.current = null;
        return;
      }

      const inactive = getVideo(forInactive);
      if (!inactive || controller.signal.aborted) return;

      isNextReadyRef.current = false;
      nextSrcRef.current = nextSrc;

      setSlotSources((prev) => {
        if (prev[forInactive] === nextSrc) return prev;
        const next: [string, string] = [...prev];
        next[forInactive] = nextSrc;
        return next;
      });

      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => resolve());
      });
      if (controller.signal.aborted || gen !== prepareGenRef.current) return;

      const inactiveEl = getVideo(forInactive);
      if (!inactiveEl) return;

      if (inactiveEl.getAttribute('src') !== nextSrc) {
        inactiveEl.src = nextSrc;
      }
      inactiveEl.preload = 'auto';
      inactiveEl.load();

      try {
        await waitForCanPlay(inactiveEl, controller.signal);
        if (controller.signal.aborted || gen !== prepareGenRef.current) return;
        isNextReadyRef.current = true;
      } catch {
        if (controller.signal.aborted) return;
        failedRef.current.add(nextSrc);
        isNextReadyRef.current = false;
        nextSrcRef.current = null;
        skipAttemptsRef.current += 1;
        if (skipAttemptsRef.current < videos.length) {
          void prepareNext(forInactive);
        }
      }
    };

    const finishTransition = (fromSlot: Slot, toSlot: Slot, nextSrc: string) => {
      const outgoing = getVideo(fromSlot);
      outgoing?.pause();
      if (outgoing) outgoing.currentTime = 0;

      currentSrcRef.current = nextSrc;
      activeLayerRef.current = toSlot;
      setActiveLayer(toSlot);
      isTransitioningRef.current = false;
      isNextReadyRef.current = false;
      nextSrcRef.current = null;
      skipAttemptsRef.current = 0;

      void prepareNext(inactiveSlot(toSlot));
    };

    const executeCrossfade = async (fromSlot: Slot) => {
      if (isTransitioningRef.current) return;

      const activeVideo = getVideo(fromSlot);
      if (!activeVideo) return;

      const toSlot = inactiveSlot(fromSlot);
      const incoming = getVideo(toSlot);
      if (!incoming) return;

      if (!isNextReadyRef.current || !nextSrcRef.current) {
        return;
      }

      if (skipAttemptsRef.current >= videos.length) return;

      isTransitioningRef.current = true;
      stopRaf();

      const nextSrc = nextSrcRef.current;
      incoming.currentTime = 0;

      const played = await tryPlay(incoming);
      if (!played) {
        failedRef.current.add(nextSrc);
        skipAttemptsRef.current += 1;
        isTransitioningRef.current = false;
        isNextReadyRef.current = false;
        nextSrcRef.current = null;
        if (skipAttemptsRef.current < videos.length) {
          void prepareNext(toSlot).then(() => {
            startMonitor(fromSlot);
          });
        } else {
          startMonitor(fromSlot);
        }
        return;
      }

      const frameReady = await waitForFirstFrame(incoming);
      if (!frameReady) {
        incoming.pause();
        incoming.currentTime = 0;
        isTransitioningRef.current = false;
        startMonitor(fromSlot);
        return;
      }

      setLayerOpacity(toSlot);

      clearFadeTimer();
      fadeTimerRef.current = setTimeout(() => {
        fadeTimerRef.current = null;
        finishTransition(fromSlot, toSlot, nextSrc);
        startMonitor(toSlot);
      }, HERO_CROSSFADE_MS);
    };

    const tickCrossfade = (fromSlot: Slot) => {
      const activeVideo = getVideo(fromSlot);
      if (!activeVideo || isTransitioningRef.current) {
        rafRef.current = null;
        return;
      }

      const { duration, currentTime } = activeVideo;
      if (!Number.isFinite(duration) || duration <= 0) {
        rafRef.current = requestAnimationFrame(() => tickCrossfade(fromSlot));
        return;
      }

      const remaining = duration - currentTime;

      if (remaining <= CROSSFADE_SEC && remaining > 0) {
        if (isNextReadyRef.current) {
          void executeCrossfade(fromSlot);
          rafRef.current = null;
          return;
        }
        rafRef.current = requestAnimationFrame(() => tickCrossfade(fromSlot));
        return;
      }

      if (remaining > 0.05) {
        rafRef.current = requestAnimationFrame(() => tickCrossfade(fromSlot));
      } else {
        rafRef.current = requestAnimationFrame(() => tickCrossfade(fromSlot));
      }
    };

    const startMonitor = (fromSlot: Slot) => {
      stopRaf();
      rafRef.current = requestAnimationFrame(() => tickCrossfade(fromSlot));
    };

    const onActivePlaying = (slot: Slot) => {
      void prepareNext(inactiveSlot(slot));
      startMonitor(slot);
    };

    const onEndedFallback = (slot: Slot) => {
      if (isTransitioningRef.current) return;
      if (isNextReadyRef.current) {
        void executeCrossfade(slot);
        return;
      }
      const inactive = inactiveSlot(slot);
      void prepareNext(inactive).then(() => {
        if (isNextReadyRef.current) {
          void executeCrossfade(slot);
        }
      });
    };

    const onActiveError = (slot: Slot) => {
      failedRef.current.add(currentSrcRef.current);
      const inactive = inactiveSlot(slot);
      void prepareNext(inactive).then(() => {
        if (isNextReadyRef.current) {
          void executeCrossfade(slot);
        }
      });
    };

    const resumePlayback = () => {
      const slot = activeLayerRef.current;
      const active = getVideo(slot);
      if (active?.paused) {
        void tryPlay(active);
      }
      if (isTransitioningRef.current) {
        const incoming = getVideo(inactiveSlot(slot));
        if (incoming?.paused) {
          void tryPlay(incoming);
        }
      }
      startMonitor(slot);
    };

    const attachToActive = (slot: Slot) => {
      const active = getVideo(slot);
      if (!active) return () => undefined;

      const onPlaying = () => onActivePlaying(slot);
      const onEnded = () => onEndedFallback(slot);
      const onError = () => onActiveError(slot);

      active.addEventListener('playing', onPlaying);
      active.addEventListener('ended', onEnded);
      active.addEventListener('error', onError);

      if (!active.paused && active.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
        onActivePlaying(slot);
      }

      return () => {
        active.removeEventListener('playing', onPlaying);
        active.removeEventListener('ended', onEnded);
        active.removeEventListener('error', onError);
      };
    };

    const slot = activeLayer;
    const detachActive = attachToActive(slot);

    const onVisibility = () => {
      if (document.visibilityState === 'visible') resumePlayback();
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      detachActive();
      document.removeEventListener('visibilitychange', onVisibility);
      stopRaf();
      clearFadeTimer();
    };
  }, [activeLayer, videos]);

  useEffect(() => {
    const first = videoRef0.current;
    if (first) void tryPlay(first);
  }, []);

  return (
    <div className={`absolute inset-0 bg-[#0f1412] ${visibilityClassName}`} aria-hidden>
      <video
        ref={videoRef0}
        className='absolute inset-0 h-full w-full object-cover transition-opacity ease-in-out'
        style={{
          opacity: opacities[0],
          transitionDuration: `${HERO_CROSSFADE_MS}ms`,
          WebkitTransform: 'translateZ(0)',
          transform: 'translateZ(0)',
        }}
        src={slotSources[0]}
        muted
        playsInline
        autoPlay
        preload='auto'
      />
      <video
        ref={videoRef1}
        className='absolute inset-0 h-full w-full object-cover transition-opacity ease-in-out'
        style={{
          opacity: opacities[1],
          transitionDuration: `${HERO_CROSSFADE_MS}ms`,
          WebkitTransform: 'translateZ(0)',
          transform: 'translateZ(0)',
        }}
        src={slotSources[1]}
        muted
        playsInline
        preload='auto'
      />
    </div>
  );
};
