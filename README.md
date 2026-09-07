# Animify: An Audio-Reactive 3D Music Player

Animify is a web-player featuring true audio reactive multi-mood visualizers via Web Audio API in local mode. Users can also connect Spotify (requires premium), to playback music while retaining all the visualizers and moods backed by a fake synthesizer. It also features a dynamic contrast changing UI and accessibility settings. This project was built using Antigravity. This was my project which got me into coding, and helped me understand browsers, JSX, and I am really excited to share this project with you all. I have learned a lot about coding in general, even though most of the code is AI written.

[Live Demo]
[LinkedIn Post]

## Features
1. **Moods:** Features 4 different moods to choose from - **Chill, Energy, Focus, Neutral.** All containing different visualizers and frequency settings. 
2. **Dynamic Backgrounds:** Using in-built Spotify call tools or downloading album arts for local mode, the web-player constantly changes the background to the album art of the song currently playing. Ensuring the visualizers are always fresh and don't get boring.
3. **Local Mode:** This mode works when Spotify is not connected and has true-audio reactive visualizers. Users can also add their own files (instructions provided in the Local Setup section). This is achieved via `Web Audio API` and `AnalyserNode`. 
4. **Spotify SDK Integration:** Users can connect their Spotify for playback inside the web-player using secure `OAuth 2.0` login. (This feature requires Spotify subscription.)
5. **Fake Synthesizer:** Spotify deprecated the `Audio Wave Analysis API` in late 2024, due to misuse by genAI. So I came up with the idea of a fake synthesizer, which always runs on a base 120bpm, and generates fake wave signals, to create an illusion of audio reactivity when Spotify playback is active. 
6. **Dynamic Contrast Changing UI:** Based on the background, the UI changes the colour in real time, so every button is visible at all times, no matter how dark or bright the background gets. 
7. **Volume Matching And Visual Boost:** The visualizer strength is directly connected to the volume and values set by the user under the "Audio" and "Boost" section in the webpage respectively.
8. **Accessibility Settings:** Includes extensive accessibility settings, to ensure a compatible experience for every user. 



## How it works
### Web Audio API & Frequency Extraction:
- Before sending data to React libraries containing the shaders and visualizers, the wave data needs to be precisely separated and cleaned. For this purpose `Web Audio API` and the node it provides, `AnalyserNode` were used. 
- `Web Audio API` creates an `AudioContext` instance cache for each song, within which `AnalyserNode` is used to extract frequency and wave data from the raw data provided by `SourceNode` using **Fast Fourier Transform Analysis**, separating each frequency into `FFT size` of **4096** for maximum accuracy, which in turn also creates **2048** `bins` of **10.7Hz** each. It is in these bins where frequencies are isolated and comparisons are made and passed onto React shaders. The bins are then further grouped into sub-frequency sets - `subbass`, `bass`, `mids`, `high` and `impact`.  
- Bins 2-5 represent `subbass` (20-65Hz). Bins 6-23 represent `bass` (~65-246Hz). Bins 24-185 represent `mids` (~246-2000Hz). Bins 186-929 represent `high` (~2000-10000Hz). Rest of the bins are not considered in calculations, to filter out background static and ultrasonic hiss.
- Each bin gives out raw integer value ranging between **0-255** (8-bit byte values). The values are summed up together and then averaged out in values in between 0.0-1.0 constantly every frame. These float values between 0.0-1.0 decide the strength of the shaders, for example, the background punch for sub-bass.  
- For `impact` a different approach was used, as isolating percussion values (the reason `impact` subset was created) was really messy and most of the time singer's vocals were spilling into the subset. To combat this, an `AND gate` solution was used where the code calls for `getByteFrequencyData()` and `getByteTimeDomainData()`, where `getByteFrequencyData()` represents raw frequencies and `getByteTimeDomainData()` represents transient density, or volume spikes in simple words. The code runs an **AND gate** logic every frame (60 times a second/60fps). AND gate checks for 2 things, physical volume spikes of over 30%, and checks changes in frequency simultaneously every frame outputting a smooth-decay value between 0.0-1.0.
- Throughout all the moods, this pipeline is followed to drive the shaders, with minor changes in each mood.


### Mood Scenes & Visualizers:
**1. Chill:**
- This mood has 3 planes, powered by GLSL. `uLayerType` (0,1 and 2).
  1. **Layer 0:** This layer **desaturates the album cover by 70%** and reduces the overall **brightness by 65%**.  
  2. **Layer 1:** This layer isolates **mid-brightness pixels** from the cover using `smoothstep`, and increases their **brightness by 20%** and adds a **dynamic vinyl grain ranging from 1.5% to 9.5%** based on the `high` subset, and the whole layer is rendered at 60% transparency. 
  3. **Layer 2:** Using `smoothstep`, only **high-brightness pixels are extracted**, with a minimum **brightness threshold of 50%** and is displayed at 70% opacity. `Additive Blending` is then used to project this layer as a glowing light.
  4. Apart from these layers, there's `sparkles` taken from `drei` library in `R3F`, which reacts to `impact` subset.  

- **How these layers work together:**
  1. **Continuous Orbit:** Each plane follows an invisible orbit, determined by a sin/cos equation. The base layer moves the slowest, while the front layer moves the fastest and the widest.
  2. **Mouse parallax:** When the user moves their cursor, each layer shifts in the opposite direction based on the depth index, so that the front layer moves significantly when compared to the base layer.
  3. **Track Transitions:** When the user skips the tracks, all the layers peel and fan themselves out at 120° increments, before smoothly aligning back again, with the new album cover. 

- **Frequency reactivity:**
  1. **Sub-bass/Bass:** All the layers react to these subsets. When a `Sub-bass` is detected, all the layers punch out, and on `bass` all the layers breathe gently in a continuous manner. 
  2. **Mids:** This subset controls the **brightness and warmth** of `Layer 1`.
  3. **Highs:** This subset drives the `film grain` on layer 1, giving the whole scene a moody look based on the strength of high frequencies/treble. 
  4. **Impact:** This subset is hooked to the floating `sparkles`. Whenever the `AND gate` logic pumps out the value above `0.1`, all the particles vibrate and shimmer aggressively across its expanded axis, and slowly move back to its original position, and go back into normal `float` mode when the value is less than `0.1`. 

- **Liquid Glass Hover Lens:**
Adapted from [StarKnightt/liquid-glass](https://github.com/StarKnightt/liquid-glass) by [@StarKnightt](https://github.com/StarKnightt). The lens stays on-screen, revealing the next track's album cover through its area. It is also paired with its own spring physics giving a bouncy and wobbly feel to it when the cursor is moved. 

- **Built-in Shader Effects:**
  - Custom Vignette darkening
  - Dynamic high-frequency film grain

  
**2. Energy:**
- This mood splits the album cover into 4 distinct physical planes using custom GLSL shaders via `uLayerType` (0, 1, 2, and 3):
  1. **Layer 0 (Base):** This plane desaturates the album cover by 100% and reduces the **brightness down to 15%**, acting as a foundation for the other layers to sit on top.
  2. **Layer 1, 2 and 3:** Layer 1 extracts the pure **Red channel**, Layer 2 extracts the pure **Green channel** and Layer 3 extracts the pure **Blue channel** from the album cover. Additive blending is also applied to these layers, so when they align, the original full-colour cover art is rendered, or they split into vibrant chromatic aberration without any heavy post-processing, when they are moving.

- **How these layers work together:** 
  1. **Orbital Float:** Layer 1, 2 and 3 continuously follow a pre-determined orbit. The top-most layer expands its orbit, to stand out from the rest of the layers. 
  2. **3D Tilting:** When the cursor is moved, instead of just sliding flat, each layer rotates on its X and Y axis, giving the feel that they are sliding off each other.
  3. **Transition Slam:** Skipping tracks, or when the next one starts, all the layers violently push everything outwards at up to 25x kinetic force, and then slam back together.

- **Frequency Reactivity:**
  1. **Sub-Bass:** When a spike is detected in `Sub-bass` subset, Layer 1, 2 and 3 punch outwards, before going back into place with a smooth decay. There's also a 5% filter, to safely ignore all the sustained 808s and deep synths, so only new changes beyond this threshold are registered.  
  2. **Bass:** Layer 1, 2 and 3 gently inflate and deflate throughout the track based on a curve along the Z-axis. 
  3. **Mids:** Vocals and other melodies dynamically widen the orbital radius of the planes. 
  4. **Impact:** Whenever a sharp hi-hat/snare impact is detected, the order of Red, Green and Blue planes cycle instantly. So with each hit, the foreground layer changes.


**3. Focus:**
- There are **no layers** involved in this mood, instead the original cover art is desaturated by 25%, brightness reduced by 15%, and a vignette effect applied to it which darkens the edges by 40% when compared to the center.
- There are also 2 frames that float on the cover art in 3D space. The inner frame (Scale 72%) is static, and stays fixed in place. The outer frame (Scale 82%) gently breathes to the `bass` subset, along with a fixed slow sine wave breathing.


**4. Neutral:**
- This mood consists of the raw, static cover art for the track, with zero reactivity and no post-processing involved. 


### The Fake Synthesizer:
- **The problems faced:** 
  So all the waveform and track frequencies are protected behind CORS and DRM. 
  1. **CORS:** It is basically a security header, which tells the browser whether JavaScript can read/inspect the data inside. Spotify doesn't let the browser access the frequency data behind the CORS header.  
  2. **DRM:** This is a hardware-level security measure, which safely decrypts the files and data, inside an isolated sandbox and completely bypasses the browser pipeline, and sends data to the OS/sound card directly. 
  3. Spotify previously allowed developers to query their API, to receive a massive JSON file, containing `beats`, `tatums`, `sections` and `segments`, basically data about when a beat and volume changes were scheduled to occur. Spotify deprecated and restricted the Audio Analysis and Audio Features endpoints in late 2024, citing server costs, and external companies misusing the data for genAI training. 

- **Solution Implemented:** 
Since there was no way to get accurate frequencies and waveform data, the only viable solution was to create a **fake synthesizer**, which would drive the visualizers. The synthesizer was made based on the **standard 120bpm cycle**. Before creating the synthesizer, I used AI to create a small `Python script`, to which I provided about 40 tracks ranging from various genres, and got JSON responses regarding acoustic profiles and volume changes across major genres, to **match the frequency response of real songs, along with volume fluctuations**. 

- **Failed Attempt At Archetypes:**
You can request an artist profile from Spotify, which includes the genres the artist is involved in. Using this data, I tried making different synthesizers or `archetypes` for major genres. Using the Python script mentioned above, I tuned the `archetypes` to each genre, and using the Spotify artist profile, the code would switch the active synthesizer. However, I wasn't able to achieve the results I had hoped for and debugging was a nightmare, so I dropped the idea temporarily. 


### Dynamic Contrast UI:
- Using `useImageBrightness`, the cover art is sampled on a hidden `<canvas>`, to determine its luminance, dynamically switching the UI contrast to maintain readability. For dark album covers, buttons and text switch to white colour, and if the cover art is bright, the buttons change their text colour to black and get a green halo on top of them. 


## Key Commands
| Key / Action | Function |
|---|---|
| `1` | Chill Mood |
| `2` | Energy Mood |
| `3` | Focus Mood |
| `4` | Neutral Mood |
| `M` | Mute |
| `Up Arrow` | Increase Volume |
| `Down Arrow` | Decrease Volume |
| `Left Arrow` | Previous Track |
| `Right Arrow` | Next Track |
| `Space` | Play/Pause |


## Local Installation and Custom Songs Guide 

- **Project Installation:**
```sh
git clone https://github.com/Taher-Bhabrawala/Animify
cd Animify
npm install
npm run dev
```
- **How Users Can Add Their Own Music:**
  1. **Add the Audio File:** Drop the `.mp3` file into `public/audio/` folder.
  2. **Add the Cover Art:** Drop the album cover into `public/images/` folder.
  3. **Register the Song:** Open `src/hooks/useLocalPlayer.ts` and add the song to the desired mood inside `LOCAL_PLAYLISTS`:
```ts 
{
  id: "custom-track-1",
  name: "Song Name",
  primaryArtist: "Artist Name",
  featuredArtists: [],
  albumName: "Album Name",
  albumArtUrl: "/images/my-cover.jpg",
  audioUrl: "/audio/my-song.mp3",
}
```


## Tech Stack
- **Framework and Core:** `Next.js`, `React`, `Node.js`, `TypeScript`, `Vanilla CSS`
- **Audio & Streaming APIs:** `Web Audio API` (AnalyserNode, AudioContext), `Spotify Web Playback SDK`, `OAuth 2.0`
- **3D and Graphics:** `Three.js`, `React Three Fiber`, `Drei`, `GLSL`
- **Animations:** `GSAP`


## Learning:
- FFT meaning along with its application not just in waveform analysis, but in data analytics. 
- CORS/DRM and how data is securely transferred from servers to browsers.
- Basic React hooks. 
- Web Audio API. 
- DOM manipulation.
- What's GLSL and GSAP.
- Canvas and how to effectively use it with div elements. 
- How to use IDEs and agents to write and debug code efficiently. 


## License and Acknowledgements

### Project License
This project is open-source software licensed under the **[MIT License](LICENSE)**. You are free to use, modify, and distribute this software in accordance with the license conditions.

---

### Disclaimer
**Animify** is an independent, non-commercial portfolio and educational project provided "as is" without warranty of any kind. 
* **Spotify Affiliation:** Animify is not affiliated with, endorsed by, authorized by, or in any way officially connected with Spotify AB or any of its subsidiaries. The official Spotify website can be found at [spotify.com](https://www.spotify.com).
* **API Compliance:** Full Spotify Web Playback functionality requires an active Spotify Premium subscription and adherence to the [Spotify Developer Terms of Service](https://developer.spotify.com/terms).
* **Media & Copyright:** Local demonstration tracks, audio snippets, and album artwork referenced in this repository are utilized strictly for non-commercial educational demonstration and portfolio display under Fair Use principles. All musical compositions, sound recordings, and cover art remain the intellectual property and copyright of their respective artists and record labels.

---

### Custom Attributions
* **Liquid Glass Shader:** Adapted from [StarKnightt/liquid-glass](https://github.com/StarKnightt/liquid-glass) by [@StarKnightt](https://github.com/StarKnightt), licensed under the **MIT License**.

---

### Third-Party Open Source Licenses & Attributions
This project utilizes open-source packages, libraries, and APIs, each licensed under their respective copyright holders:
* **Next.js & React:** Copyright (c) Vercel, Inc. / Meta Platforms, Inc. Licensed under the **MIT License**.
* **Three.js:** Copyright (c) 2010–present Ricardo Cabello (Mr.doob) and Three.js authors. Licensed under the **MIT License**.
* **React Three Fiber (`@react-three/fiber`):** Copyright (c) Poimandres. Licensed under the **MIT License**.
* **Drei (`@react-three/drei`):** Copyright (c) Poimandres. Licensed under the **MIT License**.
* **GSAP (GreenSock Animation Platform):** Copyright (c) 2008–present GreenSock, Inc. Utilized under the **Standard GreenSock License** for public web use.
* **TypeScript:** Copyright (c) Microsoft Corporation. Licensed under the **Apache License 2.0**.
* **Web Audio API:** Standardized specification maintained by the **W3C Audio Working Group**.
* **Spotify Web Playback SDK:** Copyright (c) Spotify AB. Utilized under the **Spotify Developer Terms of Service**.

All trademarks, service marks, logos, and brand names belong to their respective owners.
