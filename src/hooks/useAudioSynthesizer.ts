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
        if (lastSyncTimeRef.current === 0) {
          lastSyncPosRef.current = currentProgress;
          lastSyncTimeRef.current = time;
        } else {
          const estimatedPos = lastSyncPosRef.current + (time - lastSyncTimeRef.current);
          const drift = currentProgress - estimatedPos;
          // If seeked or large jump (>1.5s), hard reset
          if (Math.abs(drift) > 1500) {
            lastSyncPosRef.current = currentProgress;
            lastSyncTimeRef.current = time;
          } else {
            // Smoothly nudge clock by 5% of drift per frame to eliminate sudden beat teleports
            lastSyncPosRef.current += drift * 0.05;
          }
        }
      }

      const elapsedMs = (currentProgress > 0 && lastSyncTimeRef.current > 0)
        ? lastSyncPosRef.current + (time - lastSyncTimeRef.current)
        : time - startTimeRef.current;
      
      const beatPhase = (((elapsedMs % msPerBeat) + msPerBeat) % msPerBeat) / msPerBeat;

      // Fast per-beat pseudo-random kick velocity (0.75 to 1.0) seeded by beat index via sine hash
      const currentBeatIndex = Math.floor(elapsedMs / msPerBeat);
      const kickPower = 0.75 + 0.25 * Math.abs(Math.sin(currentBeatIndex * 12.9898 + 4.1414));

      // Fuller, more resonant exponential decay across the beat (relaxed from 2.5 to 1.4 so kicks linger with weight)
      const pulseDecay = Math.pow(Math.max(0, 1.0 - beatPhase), 1.4);

      // Fast harmonic sine flutter (analogous to resonant 808 sub-bass harmonics)
      const flutter = Math.sin(time * 0.035) * 0.02 + Math.sin(time * 0.075) * 0.015;

      let isImpact = false;
      const timeSinceLastTransient = elapsedMs - lastTransientTimeRef.current;
      if (timeSinceLastTransient >= transientDensityMs && beatPhase < 0.1) {
        isImpact = true;
        lastTransientTimeRef.current = elapsedMs;
      }

      // Continuous natural sub-bass and bass levels
      const subBass = (0.2 + 0.8 * pulseDecay * kickPower) + flutter;
      const bass    = (0.3 + 0.7 * pulseDecay * kickPower) + (flutter * 0.8);
      const mid     = 0.55 + (isImpact ? 0.45 : 0) + (Math.sin(time * 0.02) * 0.05);
      const high    = 0.35 + (isImpact ? 0.65 : 0) + (Math.cos(time * 0.04) * 0.03);

      audioDataRef.current = {
        subBass: Math.min(1, Math.max(0, subBass)),
        bass: Math.min(1, Math.max(0, bass)),
        mid: Math.min(1, Math.max(0, mid)),
        high: Math.min(1, Math.max(0, high)),
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
