# Games

A separate home for finished games, playable 3D worlds and browser-native instruments, kept out of the interface and Codevember shelves.

Twelve builds in two shelves: **finished games** with a complete play loop, and **playable worlds, tools and prototypes** that are more about exploring, making sound or building.

| # | Game | Shelf | What it is | Source |
|---|---|---|---|---|
| 01 | [GTA Shenzhen](./gtashenzhen/) | Playable world / prototype | A playable 3D Shenzhen built from OSM data: streets, blocks, traffic, a character and a city to walk through. | [gtashenzhen](https://github.com/bear20252026/gtashenzhen) |
| 02 | [Greyhaven Harbour](./greyhaven-harbour/) | Playable world / prototype | A working container port in the browser: a freighter, tug, quay cranes, cargo yard, terrain, water and a camera tour. | [greyhaven-harbour](https://github.com/bear20252026/greyhaven-harbour) |
| 03 | [Small SF](./smallsf/) | Playable world / prototype | A hand-drawn isometric San Francisco: a DZI city with live transit, planes, boats, traffic, weather and game-night layers. |  |
| 04 | [Curllmooha](./curllmooha/) | Playable world / prototype | A clay-rendered meadow portfolio: grass, weather and a day–night cycle hide the work along paths you can walk through. Editable source is in `curllmooha/source/`. |  |
| 05 | [Cinderwatch](./cinderwatch/) | Finished game | A self-playing 3D isometric tower defense in a single HTML file: four tower types, twenty monster kinds, five lands, and an AI commander you can take over at any time. |  |
| 06 | [Pet the Cat](./pet-the-cat/) | Playable world / prototype | A Japanese cat-petting simulator: thirteen coats, a hand that follows the pointer, tail physics and a purr synthesized in WebAudio. |  |
| 07 | [Little City](./littlecity/) | Finished game | A hand-drawn town diorama builder: place blocks, grow a harbour town, and unlock 102 landmarks, market days, a wedding and a lighthouse. |  |
| 08 | [Raytraced Map](./raytraced-map/) | Playable world / prototype | A WebGPU OpenStreetMap world: extruded buildings, real terrain, and sky light plus sun shadows ray traced into a virtual lightmap. |  |
| 09 | [Facade Crafter](./facade-crafter/) | Playable world / prototype | A WebGPU storefront studio: sketch massing boxes and watch a procedural Paris café, bistro or Tokyo kissaten rebuild live. |  |
| 10 | [Boo-mas](./boo-mas/) | Finished game | A tiny three.js game: a ghost in a Santa hat strings fairy lights around a snow-globe planet, closes loops to light the world and saves Christmas before midnight. |  |
| 11 | [Knockbox](./knockbox/) | Playable instrument / prototype | A browser drum machine with a crooked, off-the-grid swing: four drum rows, a humanize dial, loop chopping, vocal takes, and MIDI, WAV and stem export. Account, crate and sharing need the original server. |  |
| 12 | [TITAN 6X6](./titan-6x6/) | Playable vehicle study / WIP | An armored 6×6 expedition-truck playground: studio orbit, CAD wireframe, and a drive mode with hydraulic suspension and winch physics. The front end is editable and runs without a build step. |  |

The root page is a twelve-card gallery split into two sections: Finished games and Playable worlds, tools & prototypes. Each entry keeps its own `index.html` and assets, with no shared runtime or wrapper.

- GTA Shenzhen ships with a 30 MB `city.json` and a Three.js city in `src/`.
- Greyhaven Harbour is a bundled Three.js scene; open its page and use the arrows, play button and Orbit control.
- Small SF is an unbundled snapshot of the site: DZI code and all local JSON/bin data are here, but the three tile pyramids and the `/api/*` server are external, so the full live layers need the original service or a mirror.
- The full 2.90 GB DZI mirror is registered in [smallsf-offline](https://github.com/bear20252026/smallsf-offline) as a fallback. The live Small SF page still uses `tiles.smallsf.com` for now; switching is a three-field change in `map.json`, `photo.json` and `far.json`.
- Curllmooha is a Vite multi-page build; `curllmooha/source/` holds the editable source, with no `node_modules`.
- Pet the Cat ships as a single-file packed build at `pet-the-cat/index.html` (855 KB, all assets inline); `pet-the-cat/source-version.html` is the modular source entry, with 18 annotated scripts in `src/`, the original restoration in `source/`, and the unpack/build tools in `tools/`. Both paths render with WebGL where available and fall back to Canvas 2D.
- Little City is the Vite-built site from the `gh-pages` branch of [littlecity.io](https://github.com/bear20252026/littlecity.io), mirrored as a static build rather than rebuilt from source. All 107 HTML pages are pinned to `/games/littlecity/` with a `<base>` tag, and every root-absolute link was rewritten relative; `about/`, `gallery/`, `guide/`, `assets/` and the PWA manifest are included, along with `preview.mp4` and the 4:3 card image. The build's inherited PostHog analytics hook is disabled in this mirror.
- Raytraced Map is a Vite build using a relative base, so it runs unchanged under `/games/raytraced-map/`. The renderer is fully local; the map itself streams OpenFreeMap vector tiles, AWS terrain tiles and Nominatim addresses, with the required credits shown in the page.
- Facade Crafter is a Vite build with its local HDRI, texture and contact assets under `dist` copied in place; it is about 51 MB. The geometry editor and procedural facade are local, while the UI fonts come from Google Fonts with system fallbacks.
- All twelve run from static files; nine render through WebGL, Raytraced Map, Facade Crafter and TITAN prefer WebGPU, and Knockbox needs Web Audio.
- Boo-mas is the complete upstream source, not a packaged build: 39 files, plain ES modules, three.js r187 and the four documentation screenshots. It runs from `boo-mas/` without a build step; `preview.jpg` is a 4:3 crop of the upstream title screen for the card.
- Knockbox: 68 core modules, 41 UI components, the four stock drum samples and the `fUji` beat snapshot, all running from static files. The desk, humanize engine, loop chopping and MIDI/WAV export work; `/api/*` features (account, crate, disk sync and sharing) are unavailable without the upstream server.
- TITAN 6X6: one HTML shell, eight plain ES modules, the 8.3 MB GLB and a 4:3 preview. It is intentionally filed as a playable study / WIP, not a finished game.
- Cinderwatch is a self-contained single HTML file; `src/`, `vendor/` and `tools/` are kept as the editable source, and `media/gameplay-20s.mp4` is left upstream to keep the repository lean.

Live: <https://bear20252026.github.io/games/>

## 来源与作者信息

来源与版权信息未在本仓库公开收录。


