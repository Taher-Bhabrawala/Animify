"use client";

import { useSpotifyPlayer } from "./useSpotifyPlayer";
import { useLocalPlayer, AudioReactivityData } from "./useLocalPlayer";
import { useAudioSynthesizer } from "./useAudioSynthesizer";
import { useChillSynthesizer } from "./useChillSynthesizer";
import type { SpotifyPlayerState, SpotifyPlayerControls } from "./useSpotifyPlayer";
import { useCallback } from "react";

export function useActivePlayer(
  isLoggedIn: boolean,
  mood: "chill" | "energy" | "focus" | "neutral"
): {
  state: SpotifyPlayerState;
  controls: SpotifyPlayerControls;
  isLocal: boolean;
  getAudioData?: () => AudioReactivityData | null;
} {
  const spotify = useSpotifyPlayer(isLoggedIn);
  const local = useLocalPlayer(mood, !isLoggedIn);

  const isNeutral = mood === "neutral";

  // Run the standard heavy synth only for Energy/Focus (disabled for Neutral and Chill)
  const getBaseSynthData = useAudioSynthesizer({
    isPlaying: isLoggedIn && !spotify.state.isPaused && !isNeutral && mood !== "chill",
    progressMs: spotify.state.positionMs,
  });

  // Run the sparse, random synth only for Chill (disabled for Neutral)
  const getChillSynthData = useChillSynthesizer({
    isPlaying: isLoggedIn && !spotify.state.isPaused && !isNeutral && mood === "chill",
  });

  // Dynamically pass the correct audio getter to the visualizers
  const getSpotifyAudioData = useCallback((): AudioReactivityData | null => {
    if (isNeutral) return null;
    return mood === "chill" ? getChillSynthData() : getBaseSynthData();
  }, [mood, isNeutral, getChillSynthData, getBaseSynthData]);

  if (isLoggedIn) {
    return {
      state: spotify.state,
      controls: spotify.controls,
      isLocal: false,
      getAudioData: getSpotifyAudioData,
    };
  }

  return {
    state: local.state,
    controls: local.controls,
    isLocal: true,
    getAudioData: local.getAudioData,
  };
}
