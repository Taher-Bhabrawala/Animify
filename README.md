# Animify: An Audio-Reactive 3D Music Player

Animify is a web-player featuring true audio reactive multi-mood visualizers via Web Audio API in local mode. Users can also connect Spotify (requires premium), to playback music while retaining all the visualizers and moods backed by a fake synthesizer. It also features a dynamic contrast changing UI and accessibility settings. This project was built using Antigravity, this was my project which got me into coding, and understading broswers, jsx, and I am really excited to share this project with you all.

[Live Demo]
[LinkedIn Post]

## Features
1. **Moods:** Features 4 different moods to choose from - **Chill, Energy, Focus, Neutral.** All containing different visualizers and frequency settings. 
2. **Dynamic Backgrounds:** Using in-built Spotify call tools or downloading album arts for local mode, the web-player constantly changes the background to the album art of the song currently playing. Ensuring the visualizers are always fresh and don't get boring.
3. **Local Mode:** This mode works when Spotify is not connected and has true-audio reactive visualizers. Users can also add their own files (instructions provided in the Local Setup section). This is achieved via `Web Audio API` and `AnalyserNode`. 
4. **Spotify SDK Integration:** Users can connect their Spotify for playback inside the web-player using secure `oAuth 2.0` login. (This feature requires Spotify subscription.)
5. **Fake Synthesizer:** Spotify deprecated the `Audio Wave Analysis API` in late 2024, due to misuse by genAI. So I came up with the idea of a fake synthesizer, which always runs on a base 120bpm, and gives fake wave signal, to create an illusion of audio reactivity when Spotify playback is active. 
6. **Dynamic Contrast Changing UI:** Based on the background, the UI changes the colour in real time, so every button is visible at all times, no matter how dark or bright the background gets. 
7.  **Volume Matching And Visual Boost:** The visualizer strength is directly connected to the volume and values set by the user under the "Audio" and "Boost" section in the webpage respectively.
8. **Accessibility Settings:** Includes extensive accessibility settings, to ensure a compatible experience for every user. 



## How it works
### Web Audio API & Frequency Extraction:
- Before sending data to React libraries containing the shaders and visualizers, the wave data needs to be precisely separated and cleaned. For this purpose `Web Audio API` and the node it provides, `AnalyserNode` was used. 
- `Web Audio API` creates an `AudioContext` instance cache for each song, within which `AnalyserNode` is used to extract frequency and wave data from the raw data provided by `SourceNode` using **Fast Fourier Transform Analysis**, separating each frequency into `FFT size` of **4096** for maximum accuracy, which in turn also creates **2048** `bins` of **10.7Hz** each. It is in these bins where frequencies are isolated and comparisons are made and passed onto React shaders. The bins are then further grouped into sub-frequency sets - `subbass`, `bass`, `mids`, `high` and `impact`.  
- Bins 2-5 represent `subbass` (20-65Hz). Bins 6-23 represent `bass` (~65-258Hz). Bins 24-185 represent `mids` (~258-2000Hz). Bins 186-929 represent `high` (~2000-10000Hz). Rest of the bins are not considered in calculations, to filter out background static and ultrasonic hiss.
- Each bin gives out raw integer value ranging from between **0-255** (8-bit byte values). The values are summed up together and then averaged out in values in between 0.0-1.0 constantly every frame. These float values between 0.0-1.0 decide the strength of the shaders, for example, the background punch for sub-bass.  
- For `impact` a different approach was used, as isolating percussion values (the reason `impact` subset was created) was really messy and most of the time singer's vocal were spilling into the subset. To combat this, an `AND gate` solution was used where the code calls for `getByteFrequencyData()` and `getByteTimeDomainData()`, where `getByteFrequencyData()` represents raw frequencies and `getByteTimeDomainData()` represents transient density, or volume spikes in simple words. The code runs an **AND gate** logic every frame (60 times a second/60fps). AND gate checks for 2 things, physical volume spikes of over 30%, and checks changes in frequency simultaneously every frame outputting a smooth-decay value between 0.0-1.0.
- Throughout all the moods, this pipeline is followed to drive the shaders, with minor changes in each mood.


### Mood Scenes & Visualizers:
1. **Chill:**
- This mood has 3 planes, powered by GLSL. `uLayerType` (0,1 and 2).
1. Layer 0: This layer **desaturates the album cover by 70%** and reduce the overall **brightness by 65%**.  
2. Layer 1: This layer only showcase **mid-brightness pixels** from the cover using `smoothstep`, and increases their **brightness by 20%** and adds a **dynamic vinyl grain ranging from 1.5% to 9.5%** based on the `impact` subset, and the whole layer is rendered at 60% transparency. 
3. Layer 2: Using `smoothstep`, only **high-brightness pixels are extracted**, with a minimum **brightness threshold of 50%** and is displayed at 70% opacity. `Additive Blending` is then used to project this layer as a glowing light.

- **How do these layers layers work togehter:**
1. **Continous Orbit:** Each plane follows a invisible orbit, determined by a sin/cos equation. The base layer moves the slowest, while the front layer moves the fastest and the widest.
2. **Mouse parallax:** When the user, moves their cursor, each layer shifts in the opposite direction based on the depth index, so that the front layer moves significantly when compared to the base layer.
3. **Track Transitions:** When the user skips the tracks, all the layers peel and fan themselves out at 120∘ increments, before smoothly aligning back again, with the new album cover. 

- **Frequency reactivity:**

2. **Energy:**    
      - [Explain the RGB channel splitting (Red, Green, Blue on separate planes), kinetic mouse-driven offsets, `<MeshDistortMaterial>` blob, and post-processing (Bloom, ChromaticAberration, Glitch)...]
3. **Focus:**
      - [Explain the clean single-plane design, gentle desaturation, vignette, and the intentionally minimal/static aesthetic...]
4. **Neutral:**
      - [Explain the raw static background with zero shaders/animations, pure album art display...]

### The Fake Synthesizer:
- **The Problem:** [Explain that Spotify deprecated the `Audio Wave Analysis API` in late 2024, and CORS/DRM blocks `AnalyzerNode` on cross-origin streams...]
- **The Solution:** [Explain how `useChillSynthesizer.ts` uses deterministic math — layered sine waves, Perlin noise, and `currentTime` — to generate simulated bass, mid, high, and impact values that mimic the real frequency bands explained above...]

### Custom GLSL Shaders:
- [Explain vertex and fragment shaders, `coverUv` aspect-ratio math, Simplex noise displacement, desaturation, and vignette — all written by hand, no third-party shader files...]

### Texture Lifecycle & Memory Management:
- [Explain how `useTrackTextures.ts` loads images via `THREE.TextureLoader`, uses GSAP to crossfade uniforms, and calls `.dispose()` on old textures to prevent GPU memory leaks...]

### Dynamic Contrast UI:
- [Explain how `useImageBrightness` samples pixel luminance from album art on a hidden `<canvas>` and dynamically switches text/icon colors between black and white...]

### Local Player Engine:
- [Explain how `useLocalPlayer.ts` manages playlist queues, `useRef`-based state for event listeners, and the `useActivePlayer` abstraction layer...]




## Key Commands
| Key / Action | Function |
|---|---|
| `[Key]` | [What it does] |
| `[Key]` | [What it does] |
| `[Key]` | [What it does] |

## Tech Stack
- **Framework and Core:** `Next.js`, `React`, `Node.js`, `TypeScript`, `Vanilla CSS`
- **3D and Graphics:** `Three.js`, `React Three Fiber`, `Drei`, `GLSL`
- **Post-Processing:** `@react-three/postprocessing` (`Bloom`, `ChromaticAberration`, `DepthOfField`, `Glitch`, `Vignette`, `Noise`)
- **Animations:** `GSAP`

## What I learnt and Key Challenges

### Learning:
- [Learning 1]
- [Learning 2]
- [Learning 3]
- [Learning 4]
- [Learning 5]

### Key Challenges I faced:
- **[Challenge 1 Name]:** [Explain the problem and how you solved it...]
- **[Challenge 2 Name]:** [Explain the problem and how you solved it...]
- **[Challenge 3 Name]:** [Explain the problem and how you solved it...]
- **[Challenge 4 Name]:** [Explain the problem and how you solved it...]