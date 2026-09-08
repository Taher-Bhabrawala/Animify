"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import gsap from "gsap";

// ──────────────────────────────────────────
//  Shared texture state for all mood scenes
// ──────────────────────────────────────────

export interface TrackTextures {
  /** The currently displayed track texture (or the "from" texture during transition). */
  texture1Ref: React.MutableRefObject<THREE.Texture | null>;
  /** The incoming track texture (the "to" texture during transition). */
  texture2Ref: React.MutableRefObject<THREE.Texture | null>;
  /** The hover preview texture (next track in queue). */
  hoverTextureRef: React.MutableRefObject<THREE.Texture | null>;
  /** GSAP-animated 0→1 transition progress. */
  progress: { value: number };
  /** GSAP-animated 0→1 hover lens intensity. */
  hoverAmount: { value: number };
  /** Resolution of texture1 for cover-fit UV math. */
  imageRes1: THREE.Vector2;
  /** Resolution of texture2 for cover-fit UV math. */
  imageRes2: THREE.Vector2;
  /** Resolution of hover texture for cover-fit UV math. */
  imageRes3: THREE.Vector2;
}

/**
 * Hook that manages loading, caching, and GSAP crossfade transitions
 * for track artwork textures. All three mood scenes consume this hook
 * so texture logic is never duplicated.
 */
export function useTrackTextures(
  currentTrackUrl: string,
  hoverTrackUrl: string | null,
  hoverActive: boolean
): TrackTextures {
  const lastTrackUrlRef = useRef<string | null>(null);
  const isTransitioningRef = useRef(false);
  const [, setTrigger] = useState(0);

  // Stable refs that persist across renders
  const tex1Ref = useRef<THREE.Texture | null>(null);
  const tex2Ref = useRef<THREE.Texture | null>(null);
  const tex3Ref = useRef<THREE.Texture | null>(null);

  const [progress] = useState(() => ({ value: 0.0 }));
  const [hoverAmount] = useState(() => ({ value: 0.0 }));

  const [imageRes1] = useState(() => new THREE.Vector2(1, 1));
  const [imageRes2] = useState(() => new THREE.Vector2(1, 1));
  const [imageRes3] = useState(() => new THREE.Vector2(1, 1));

  // ── Load / transition the main track texture ──
  useEffect(() => {
    if (!currentTrackUrl) return;
    if (currentTrackUrl === lastTrackUrlRef.current) return;

    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin("anonymous");

    let isActive = true;

    const loadTexture = async () => {
      try {
        const tex = await new Promise<THREE.Texture>((resolve, reject) => {
          loader.load(currentTrackUrl, resolve, undefined, reject);
        });
        tex.minFilter = THREE.LinearFilter;
        tex.magFilter = THREE.LinearFilter;
        tex.generateMipmaps = false;

        const w = (tex.image as HTMLImageElement)?.width || 1024;
        const h = (tex.image as HTMLImageElement)?.height || 1024;

        if (!isActive) {
          tex.dispose();
          return;
        }

        if (!tex1Ref.current) {
          // First texture ever loaded — set directly, no transition
          tex1Ref.current = tex;
          imageRes1.set(w, h);
          progress.value = 0.0;
          lastTrackUrlRef.current = currentTrackUrl;
          setTrigger(p => p + 1);
        } else {
          // Subsequent texture — run GSAP crossfade
          if (isTransitioningRef.current) {
            gsap.killTweensOf(progress);
          }
          isTransitioningRef.current = true;

          const oldTex = tex1Ref.current;
          tex2Ref.current = tex;
          imageRes2.set(w, h);
          setTrigger(p => p + 1);

          gsap.fromTo(
            progress,
            { value: 0.0 },
            {
              value: 1.0,
              duration: 1.5,
              ease: "power2.inOut",
              onComplete: () => {
                if (oldTex) oldTex.dispose();
                tex1Ref.current = tex;
                imageRes1.set(w, h);
                tex2Ref.current = null;
                progress.value = 0.0;
                isTransitioningRef.current = false;
                lastTrackUrlRef.current = currentTrackUrl;
                setTrigger(p => p + 1);
              },
            }
          );
        }
      } catch (err) {
        console.error("useTrackTextures: Error loading track artwork:", err);
      }
    };

    loadTexture();

    return () => {
      isActive = false;
    };
  }, [currentTrackUrl, imageRes1, imageRes2, progress]);

  // ── Load the hover preview texture ──
  useEffect(() => {
    if (!hoverTrackUrl) {
      const old = tex3Ref.current;
      if (old) old.dispose();
      tex3Ref.current = null;
      return;
    }

    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin("anonymous");

    loader.load(
      hoverTrackUrl,
      (tex) => {
        tex.minFilter = THREE.LinearFilter;
        tex.magFilter = THREE.LinearFilter;
        tex.generateMipmaps = false;

        const old = tex3Ref.current;
        if (old) old.dispose();
        tex3Ref.current = tex;
        imageRes3.set(
          (tex.image as HTMLImageElement)?.width || 1024,
          (tex.image as HTMLImageElement)?.height || 1024
        );
        setTrigger(p => p + 1);
      },
      undefined,
      (err: unknown) => console.error("useTrackTextures: Error loading hover texture:", err)
    );
  }, [hoverTrackUrl, imageRes3]);

  // ── Animate hover amount ──
  useEffect(() => {
    if (hoverActive && hoverTrackUrl) {
      gsap.to(hoverAmount, { value: 1.0, duration: 0.8, ease: "power2.out" });
    } else {
      gsap.to(hoverAmount, { value: 0.0, duration: 0.6, ease: "power2.in" });
    }
  }, [hoverActive, hoverTrackUrl, hoverAmount]);

  return {
    texture1Ref: tex1Ref,
    texture2Ref: tex2Ref,
    hoverTextureRef: tex3Ref,
    progress,
    hoverAmount,
    imageRes1,
    imageRes2,
    imageRes3,
  };
}
