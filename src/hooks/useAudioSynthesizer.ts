import { useEffect, useRef, useCallback } from 'react';

export interface SynthesizedAudioData {
  subBass: number;
  bass: number;
  mid: number;
  high: number;
  impact: number;
}

interface UseAudioSynthesizerProps {
  isPlaying: boolean;
  progressMs?: number; 
}

export function useAudioSynthesizer({
  isPlaying,
  progressMs = 0,
}: UseAudioSynthesizerProps): () => SynthesizedAudioData | null {
  const audioDataRef = useRef<SynthesizedAudioData>({
    subBass: 0,
    bass: 0,
    mid: 0,
    high: 0,
    impact: 0,
  });

  const requestRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const lastTransientTimeRef = useRef<number>(0);
  const progressMsRef = useRef<number>(progressMs);
  useEffect(() => {
    progressMsRef.current = progressMs;
  }, [progressMs]);

  const lastSyncPosRef = useRef<number>(0);
  const lastSyncTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!isPlaying) {
      audioDataRef.current = { subBass: 0, bass: 0, mid: 0, high: 0, impact: 0 };
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
        requestRef.current = 0;
      }
      startTimeRef.current = 0;
      lastTransientTimeRef.current = 0;
      lastSyncPosRef.current = 0;
      lastSyncTimeRef.current = 0;
      return;
    }

    const msPerBeat = (60 / 120) * 1000; // Hardcoded 120 BPM
    const transientDensityMs = 500;
    
    const animate = (time: number) => {
      if (startTimeRef.current === 0) {
        startTimeRef.current = time;
      }

      const currentProgress = progressMsRef.current;
      if (currentProgress > 0) {
        if (
          lastSyncTimeRef.current === 0 ||
          Math.abs(currentProgress - (lastSyncPosRef.current + (time - lastSyncTimeRef.current))) > 500
        ) {
          lastSyncPosRef.current = currentProgress;
          lastSyncTimeRef.current = time;
        }
      }

      const elapsedMs = (currentProgress > 0 && lastSyncTimeRef.current > 0)
        ? lastSyncPosRef.current + (time - lastSyncTimeRef.current)
        : time - startTimeRef.current;
      
      let isImpact = false;
      const timeSinceLastTransient = elapsedMs - lastTransientTimeRef.current;
      const beatPhase = (((elapsedMs % msPerBeat) + msPerBeat) % msPerBeat) / msPerBeat;
      
      if (timeSinceLastTransient >= transientDensityMs && beatPhase < 0.1) {
        isImpact = true;
        lastTransientTimeRef.current = elapsedMs;
      }

      const pulseDecay = Math.max(0, 1 - beatPhase * 2); 
      
      // Fixed intensity levels instead of varying by section
      const subBass = 0.8 * (pulseDecay * 0.8 + 0.2);
      const bass = 0.8 * (pulseDecay * 0.7 + 0.3);
      const mid = 0.6 + (isImpact ? 0.4 : 0);
      const high = 0.4 + (isImpact ? 0.6 : 0);

      const jitter = (val: number) => val + (Math.random() * 0.05 - 0.025);

      audioDataRef.current = {
        subBass: Math.min(1, Math.max(0, jitter(subBass))),
        bass: Math.min(1, Math.max(0, jitter(bass))),
        mid: Math.min(1, Math.max(0, jitter(mid))),
        high: Math.min(1, Math.max(0, jitter(high))),
        impact: isImpact ? 1 : 0,
      };

      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
        requestRef.current = 0;
      }
    };
  }, [isPlaying]);

  const getAudioData = useCallback((): SynthesizedAudioData | null => {
    if (!isPlaying) return null;
    return audioDataRef.current;
  }, [isPlaying]);

  return getAudioData;
}
