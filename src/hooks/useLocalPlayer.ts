"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { SpotifyPlayerState, SpotifyTrackInfo } from "./useSpotifyPlayer";

export const LOCAL_PLAYLISTS = {
  chill: [
    {
      id: "local-chill-1",
      name: "The Color Violet",
      primaryArtist: "Tory Lanez",
      featuredArtists: [],
      albumName: "Alone At Prom",
      albumArtUrl: "/images/alone-at-prom.webp",
      audioUrl: "/audio/tory-lanez-the-color-violet.mp3",
    },
    {
      id: "local-chill-2",
      name: "LET GO",
      primaryArtist: "Central Cee",
      featuredArtists: [],
      albumName: "LET GO",
      albumArtUrl: "/images/let-go.jpg",
      audioUrl: "/audio/central-cee-let-go.mp3",
    },
    {
      id: "local-chill-3",
      name: "MY EYES",
      primaryArtist: "Travis Scott",
      featuredArtists: [],
      albumName: "UTOPIA",
      albumArtUrl: "/images/my-eyes.webp",
      audioUrl: "/audio/travis-scott-my-eyes.mp3",
    },

    {
      id: "local-chill-5",
      name: "CHIHIRO",
      primaryArtist: "Billie Eilish",
      featuredArtists: [],
      albumName: "HIT ME HARD AND SOFT",
      albumArtUrl: "/images/cover2.jpg",
      audioUrl: "/audio/billie-eilish-chihiro.mp3",
    },
    {
      id: "local-chill-6",
      name: "Happier Than Ever",
      primaryArtist: "Billie Eilish",
      featuredArtists: [],
      albumName: "Happier Than Ever",
      albumArtUrl: "/images/img10.jpg",
      audioUrl: "/audio/billie-eilish-happier-than-ever.mp3",
    },
    {
      id: "local-chill-7",
      name: "I Wanna Be Yours",
      primaryArtist: "Arctic Monkeys",
      featuredArtists: [],
      albumName: "AM",
      albumArtUrl: "/images/i-wanna-be-yours.jpg",
      audioUrl: "/audio/arctic-monkeys-i-wanna-be-yours.mp3",
    }
  ],
  energy: [
    {
      id: "local-energy-2",
      name: "In Da Club",
      primaryArtist: "50 Cent",
      featuredArtists: [],
      albumName: "Get Rich or Die Tryin'",
      albumArtUrl: "/images/In Da Club.jpg",
      audioUrl: "/audio/50 Cent - In Da Club (Official Music Video).mp3",
    },
    {
      id: "local-energy-3",
      name: "Clash",
      primaryArtist: "Dave",
      featuredArtists: ["Stormzy"],
      albumName: "We're All Alone In This Together",
      albumArtUrl: "/images/dave-WERE-ALL-ALONE-IN-THIS-TOGETHER-.jpeg",
      audioUrl: "/audio/Dave - Clash (ft. Stormzy).mp3",
    },
    {
      id: "local-energy-4",
      name: "Jimmy Cooks",
      primaryArtist: "Drake",
      featuredArtists: ["21 Savage"],
      albumName: "Honestly, Nevermind",
      albumArtUrl: "/images/Honestly Nevermind.webp",
      audioUrl: "/audio/Drake - Jimmy Cooks (Audio) ft. 21 Savage.mp3",
    },
    {
      id: "local-energy-5",
      name: "MURDER IN MY MIND",
      primaryArtist: "KORDHELL",
      featuredArtists: [],
      albumName: "Murder In My Mind",
      albumArtUrl: "/images/Kordhell cover art.avif",
      audioUrl: "/audio/KORDHELL - MURDER IN MY MIND.mp3",
    },
    {
      id: "local-energy-6",
      name: "DIOR",
      primaryArtist: "POP SMOKE",
      featuredArtists: [],
      albumName: "Meet The Woo",
      albumArtUrl: "/images/Dior.webp",
      audioUrl: "/audio/POP SMOKE - DIOR (OFFICIAL VIDEO).mp3",
    }
  ],
  focus: [
    {
      id: "local-focus-1",
      name: "Aruarian Dance",
      primaryArtist: "Nujabes",
      featuredArtists: [],
      albumName: "Samurai Champloo Music Record: Departure",
      albumArtUrl: "/images/aruarian-dance.jpg",
      audioUrl: "/audio/aruarian-dance.mp3",
    },
    {
      id: "local-focus-2",
      name: "Snowman",
      primaryArtist: "WYS",
      featuredArtists: [],
      albumName: "1 A.M Study Session",
      albumArtUrl: "/images/snowman.jpg",
      audioUrl: "/audio/snowman.mp3",
    }
  ],
  neutral: [
    {
      id: "local-neutral-1",
      name: "The Less I Know The Better",
      primaryArtist: "Tame Impala",
      featuredArtists: [],
      albumName: "Currents",
      albumArtUrl: "/images/currents.jpg",
      audioUrl: "/audio/the-less-i-know-the-better.mp3",
    },

    {
      id: "local-neutral-4",
      name: "ocean eyes",
      primaryArtist: "Billie Eilish",
      featuredArtists: [],
      albumName: "dont smile at me",
      albumArtUrl: "/images/cover3.jpg",
      audioUrl: "/audio/billie-eilish-ocean-eyes.mp3",
    }
  ]
};

export interface AudioReactivityData {
  subBass: number;
  bass: number;
  mid: number;
  high: number;
  impact: number; // Volume transient (spikes) for hi-hats/snares
}

export function useLocalPlayer(mood: "chill" | "energy" | "focus" | "neutral", isEnabled: boolean) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const volumeRef = useRef<number>(0.5); // Add ref to avoid stale closures
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const timeDomainDataArrayRef = useRef<Uint8Array | null>(null);
  const lastRmsRef = useRef<number>(0);
  const impactRef = useRef<number>(0);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  
  // Cache the audio data per-frame so multiple components calling it don't cause double-decay
  const lastProcessedTimeRef = useRef<number>(0);
  const cachedAudioDataRef = useRef<AudioReactivityData | null>(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [prevMood, setPrevMood] = useState(mood);
  if (mood !== prevMood) {
    setPrevMood(mood);
    setCurrentIndex(0);
  }
  const playlist = LOCAL_PLAYLISTS[mood];
  const skipToNextRef = useRef<() => void>(undefined);

  const [isPaused, setIsPaused] = useState(true);
  const [positionMs, setPositionMs] = useState(0);
  const [volume, setVolumeState] = useState(0.5);
  const [durationMs, setDurationMs] = useState(180000);

  const validIndex = currentIndex < playlist.length ? currentIndex : 0;
  const trackData = playlist[validIndex];
  const nextTrackData = playlist[(validIndex + 1) % playlist.length];

  const currentTrack: SpotifyTrackInfo | null = isEnabled && trackData ? {
    id: trackData.id,
    name: trackData.name,
    primaryArtist: trackData.primaryArtist,
    featuredArtists: trackData.featuredArtists,
    albumName: trackData.albumName,
    albumArtUrl: trackData.albumArtUrl,
    durationMs,
  } : null;

  const state: SpotifyPlayerState = {
    currentTrack,
    isPaused,
    positionMs,
    deviceId: "local-device",
    isReady: isEnabled && !!trackData,
    volume,
    nextTrackArtUrl: nextTrackData?.albumArtUrl || null,
  };

  // Initialize Web Audio API
  const initWebAudio = useCallback(() => {
    if (!audioCtxRef.current && audioRef.current) {
      interface WebkitWindow extends Window {
        webkitAudioContext?: typeof AudioContext;
      }
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as WebkitWindow).webkitAudioContext;
      if (!AudioContextClass) return;
      audioCtxRef.current = new AudioContextClass();
      analyserRef.current = audioCtxRef.current.createAnalyser();
      analyserRef.current.fftSize = 4096; // 2048 bins, ~10.7Hz per bin
      
      gainNodeRef.current = audioCtxRef.current.createGain();
      gainNodeRef.current.gain.value = volumeRef.current; // Use ref instead of stale state.volume
      
      // CRITICAL: Force audio element to full volume so the Analyser always
      // receives the full-strength signal. The GainNode above controls the
      // actual speaker output. Without this, if the user changed volume
      // before pressing play (via the fallback path), audioRef.volume would
      // still be reduced, double-attenuating the analyser input.
      audioRef.current.volume = 1.0;
      
      sourceNodeRef.current = audioCtxRef.current.createMediaElementSource(audioRef.current);
      // Route: MediaElement (1.0) → Analyser (full signal) → GainNode (UI volume) → Speakers
      sourceNodeRef.current.connect(analyserRef.current);
      analyserRef.current.connect(gainNodeRef.current);
      gainNodeRef.current.connect(audioCtxRef.current.destination);

      dataArrayRef.current = new Uint8Array(analyserRef.current.frequencyBinCount);
      timeDomainDataArrayRef.current = new Uint8Array(analyserRef.current.fftSize);
    }
    if (audioCtxRef.current?.state === "suspended") {
      audioCtxRef.current.resume();
    }
  }, []);

  // Init audio element once
  useEffect(() => {
    if (!isEnabled) return;
    
    let audio = audioRef.current;
    if (!audio) {
      audio = new Audio();
      audio.crossOrigin = "anonymous";
      audioRef.current = audio;
    }

    // Listeners
    const onTimeUpdate = () => {
      if (audio) {
        setPositionMs((audio.currentTime || 0) * 1000);
        if (audio.duration && !isNaN(audio.duration) && audio.duration !== Infinity) {
          setDurationMs(audio.duration * 1000);
        }
      }
    };
    
    const onEnded = () => {
      if (skipToNextRef.current) skipToNextRef.current();
    };

    const onLoadedMetadata = () => {
      if (audio && audio.duration && !isNaN(audio.duration) && audio.duration !== Infinity) {
        setDurationMs(audio.duration * 1000);
      }
    };

    const onPlay = () => setIsPaused(false);
    const onPause = () => setIsPaused(true);

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);

    return () => {
      if (audio) {
        audio.pause();
        audio.removeEventListener("timeupdate", onTimeUpdate);
        audio.removeEventListener("ended", onEnded);
        audio.removeEventListener("loadedmetadata", onLoadedMetadata);
        audio.removeEventListener("play", onPlay);
        audio.removeEventListener("pause", onPause);
      }
    };
  }, [isEnabled]);

  // Pause local audio immediately when switching to Spotify mode
  useEffect(() => {
    if (!isEnabled && audioRef.current) {
      audioRef.current.pause();
      setIsPaused(true);
    }
  }, [isEnabled]);

  // Load track when index or mood changes
  useEffect(() => {
    if (!isEnabled || !audioRef.current) return;
    
    const validIdx = currentIndex < playlist.length ? currentIndex : 0;
    const currentTrackData = playlist[validIdx];
    if (!currentTrackData?.audioUrl) return;

    const audio = audioRef.current;
    // If the audio was playing OR if it just naturally finished (ended is true), we want to autoplay the next track
    const wasPlaying = (!audio.paused && audio.currentTime > 0) || audio.ended;
    if (!audio.src.endsWith(currentTrackData.audioUrl)) {
      audio.src = currentTrackData.audioUrl;
      audio.load();
      if (wasPlaying) {
        initWebAudio();
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch((err: Error) => {
            if (err.name !== "AbortError") {
              console.error("[LocalPlayer] Play failed:", err);
            }
          });
        }
      }
    }
  }, [currentIndex, mood, isEnabled, playlist, initWebAudio]); // Re-run if mood changes to reset track

  const togglePlay = useCallback(async () => {
    if (!audioRef.current) return;
    initWebAudio();
    if (audioRef.current.paused) {
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch((err: Error) => {
          if (err.name !== "AbortError") {
            console.error("[LocalPlayer] Play failed:", err);
          }
        });
      }
    } else {
      audioRef.current.pause();
    }
  }, [initWebAudio]);

  const skipToNext = useCallback(async () => {
    initWebAudio();
    setCurrentIndex((i) => (i + 1) % playlist.length);
  }, [playlist.length, initWebAudio]);

  useEffect(() => {
    skipToNextRef.current = skipToNext;
  }, [skipToNext]);

  const skipToPrevious = useCallback(async () => {
    initWebAudio();
    if (audioRef.current && audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0;
      return;
    }
    setCurrentIndex(i => (i - 1 + playlist.length) % playlist.length);
  }, [playlist.length, initWebAudio]);

  const seek = useCallback(async (newPositionMs: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = newPositionMs / 1000;
      setPositionMs(newPositionMs);
    }
  }, []);

  const setVolume = useCallback(async (newVolume: number) => {
    volumeRef.current = newVolume; // Update ref for closures
    // We do NOT change audioRef.current.volume because we want the AnalyserNode to always receive a 1.0 full-scale signal.
    // Instead, we adjust the Web Audio GainNode which controls the speaker output after the analyzer.
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = newVolume;
    } else if (audioRef.current) {
      // Fallback if Web Audio isn't initialized yet
      audioRef.current.volume = newVolume;
    }
    setVolumeState(newVolume);
  }, []);

  // Expose frequency data for 3D scenes
  const getAudioData = useCallback((): AudioReactivityData | null => {
    const analyser = analyserRef.current;
    const dataArray = dataArrayRef.current;
    const timeDomainArray = timeDomainDataArrayRef.current;
    if (!analyser || !dataArray || !timeDomainArray) return null;
    if (isPaused) return null;

    // Prevent multiple components from double-processing the audio data in the same frame (60fps = ~16ms)
    const now = performance.now();
    if (now - lastProcessedTimeRef.current < 10 && cachedAudioDataRef.current) {
      return cachedAudioDataRef.current;
    }
    lastProcessedTimeRef.current = now;
    
    // Get Frequency Data (FFT)
    analyser.getByteFrequencyData(dataArray as unknown as Uint8Array<ArrayBuffer>);
    
    // Get Waveform Data (Time Domain)
    analyser.getByteTimeDomainData(timeDomainArray as unknown as Uint8Array<ArrayBuffer>);
    
    // fftSize = 4096 -> 2048 bins -> ~10.7Hz per bin
    let subBassSum = 0;
    for (let i = 2; i < 6; i++) subBassSum += dataArray[i]; // ~20Hz to 60Hz
    
    let bassSum = 0;
    for (let i = 6; i < 24; i++) bassSum += dataArray[i]; // ~60Hz to 250Hz
    
    let midSum = 0;
    for (let i = 24; i < 186; i++) midSum += dataArray[i]; // ~250Hz to 2000Hz
    
    let highSum = 0;
    for (let i = 186; i < 930; i++) highSum += dataArray[i]; // ~2000Hz to 10000Hz

    // Calculate RMS (Root Mean Square) for the waveform volume
    let sumSquares = 0;
    for (let i = 0; i < timeDomainArray.length; i++) {
      // Data is 0-255 centered at 128
      const normalize = (timeDomainArray[i] - 128) / 128;
      sumSquares += normalize * normalize;
    }
    const currentRms = Math.sqrt(sumSquares / timeDomainArray.length);
    
    // Detect transient impact (volume spike)
    // If the current volume is significantly higher than the previous frame, we register a hit
    let currentImpact = 0;
    const transientThreshold = 1.3; // Requires a 30% volume spike to trigger
    if (currentRms > lastRmsRef.current * transientThreshold && currentRms > 0.05) {
      // Calculate how hard the spike was (normalized 0 to 1)
      const rawImpact = Math.min(1.0, (currentRms - (lastRmsRef.current * transientThreshold)) * 10.0);
      
      // THE "AND GATE" (Isolate Hi-Hats/Snares):
      // Multiply the physical impact by the high-frequency energy.
      // - Deep piano chord = high rawImpact, low highEnergy -> 0.2 (Suppressed)
      // - Vocal sustain = low rawImpact, high highEnergy -> 0.0 (Suppressed)
      // - Hi-hat hit = high rawImpact, high highEnergy -> 1.0 (Triggered!)
      const highEnergy = Math.min(1.0, (highSum / 744) / 255);
      
      // Give it a small boost (e.g., 1.5x) since the multiplication naturally lowers the peak value
      currentImpact = Math.min(1.0, rawImpact * highEnergy * 1.5);
    }
    
    // Smooth the impact so it acts like a spring (bounces up instantly, decays slowly)
    if (currentImpact > impactRef.current) {
      impactRef.current = currentImpact; // Instant pop
    } else {
      impactRef.current *= 0.85; // Smooth decay
    }
    
    // Slowly decay the lastRms so it creates a rolling average
    lastRmsRef.current = lastRmsRef.current * 0.8 + currentRms * 0.2;

    // Normalize and cache, scaling by current volume so animations stop at vol 0
    const volScale = volumeRef.current;
    cachedAudioDataRef.current = {
      subBass: Math.min(1.0, (subBassSum / 4) / 255) * volScale,
      bass: Math.min(1.0, (bassSum / 18) / 255) * volScale,
      mid: Math.min(1.0, (midSum / 162) / 255) * volScale,
      high: Math.min(1.0, (highSum / 744) / 255) * volScale,
      impact: impactRef.current * volScale,
    };
    
    return cachedAudioDataRef.current;
  }, [isPaused]);

  return {
    state,
    controls: { skipToNext, skipToPrevious, togglePlay, seek, setVolume },
    getAudioData,
  };
}
