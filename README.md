# MapForge 3D — Episode 1 Cinematic v0.7

> **Project operating standard:** see [docs/PROJECT_INSTRUCTIONS.md](docs/PROJECT_INSTRUCTIONS.md). It defines the cinematic direction, source-fidelity rules, mandatory manual visual-QA gate, Warehouse/Area 1 standing direction, camera standards, and release discipline.

A local, single-player 3D tabletop prototype. The ruined warehouse sits above Area 1: Rats, with a continuous rope descending through the west-wall fissure beside the debris chamber. The passage and human footprints continue north.

## Start on Windows

Extract the ZIP, open the `mapforge-3d` folder, and double-click **Start-MapForge.bat**. Python 3 must already be installed. The launcher starts a local server on an available port and opens your default browser. Keep the console window open while playing; Ctrl+C stops it. If your browser does not open, use the URL printed in the console.

You can also open PowerShell in the folder containing `index.html` and run:

```powershell
py -3 launch.py
```

On Mac/Linux, run `python3 launch.py` in that folder.

The previous method still works: run `py -m http.server 8000` on Windows or `python3 -m http.server 8000` on Mac/Linux, then visit http://localhost:8000. Three.js is bundled; no internet connection is needed after downloading. Assets and uploads remain local.

## What's new

- Select miniatures by clicking them or choosing them from the party list. The selected piece has a glowing base ring.
- Name, focus and remove individual miniatures. Names, stable miniature IDs and selection are preserved in project saves.
- **Add hero at this landing** places a piece near the active floor's rope entrance.
- Drag the selected miniature near the rope, then use its **Descend / Climb rope** button. The piece visibly travels between floors; the view follows it on arrival. This works in Orbit mode independently of the Explore camera.
- Camera and miniature rope journeys now ease smoothly through approach, vertical travel and arrival.
- Choose **Tabletop** lighting for a clear view or **Torchlit** for dungeon atmosphere. Enable the carried lantern in Explore mode. Stone and timber use local tiling textures and normal maps; stationary lanterns illuminate the landing and warehouse.
- Basic movement maintains a small clearance from walls and the warehouse hole, with consistent diagonal movement speed.
- The sidebar puts connected levels and miniatures first. Import and terrain settings are collapsible.
- A Windows launcher opens the application without a typed server command.

## Explore

**Warehouse / Area 1** sets the active floor for movement and placement. **View both levels** reveals the full connection with an open shaft front. Under View and shaft settings, hide the upper structure to see the cave, or adjust the depth from 20–150 feet. **60 feet is a provisional depth**, since the supplied images do not state one.

Choose **Explore**, move with WASD or touch arrows, and drag to look. Shift sprints; **E** or the main rope button starts a camera climb/descent near the landing. **Orbit** returns to the overhead camera. Miniature rope controls and camera rope controls are separate. You can keep a party at the warehouse while exploring the cave yourself.

## Maps, projects and exports

Import a PNG, JPG or WEBP using Import a map & terrain settings. Arbitrary maps receive editable single-level 2.5D terrain; the warehouse connection is specific to the bundled demo. In the walkable mask, paint Floor or Rock, then Update geometry. Reset demo restores the bundled Area 1 scene.

Save project writes JSON with the map image, mask, scale, warehouse connection, miniatures, lighting, lantern preference, selection and active view. Open project restores it. Version 1 and 2 projects remain compatible. Wait for rope travel to finish before saving or exporting.

GLB export includes the cave, warehouse, shaft, rope and miniatures, including hidden upper structure. Textures are embedded. The GLB is static geometry; gameplay, camera controls and rope behavior belong to this app. The screenshot and local D20 controls remain available.

## Validation

Browser checks passed for renderer startup, miniature descent/ascent, torchlit lighting, camera rope travel, project save/restore and a textured GLB export containing five embedded images. The rendered scene was visually inspected. Runtime checks also passed for finite geometry, a continuous cave landing, the warehouse hole, token heights, stable IDs/names, depth restoration, proximity gating, eased rope-path continuity, painted-mask restoration and generic single-map compatibility. The Python launcher was checked for serving local files on an available loopback port and stopping cleanly. The Windows batch wrapper was reviewed but cannot be executed in this Linux environment.

## Limits and files

The warehouse is a simplified reconstruction authored from your illustration. Cave terrain is 2.5D extrusion of the original top-down image. There is no automatic semantic recognition of every prop, full physics, climbing rules, prop collision, multiplayer, accounts, combat rules or fog of war. This pass improves the existing scene; it does not add further dungeon areas.

`js/main.js` handles UI/saves, `js/world.js` handles terrain/cameras/miniatures, `js/connection.js` builds the warehouse/shaft, and `js/surfaces.js` handles textured materials and rope easing. `js/analysis.js` builds the editable mask. `launch.py` and `Start-MapForge.bat` provide startup. Three.js 0.180.0 and addons are under `js/vendor/`, with their license. Maps and generated surface textures are under `assets/`.

The demo code is supplied for your further development. Only redistribute the bundled map and reference illustration if you hold the appropriate rights. Third-party Three.js code is covered by `js/vendor/THREE-LICENSE.txt`.

## v0.4 — HDMI cinematic display (local, no accounts)

This is a **minimal TV presentation mode**, not multiplayer. Plug the TV in through HDMI and set Windows Display Settings to **Extend these displays** (not Duplicate). Start MapForge as before, then click **Open TV View** in the top bar. Drag the new browser window to the television and click **Fullscreen** (or press F11 in that window). Keep the MapForge editor on the laptop. Camera motion, lighting, grid visibility, miniature positions, and cutaway changes are mirrored to the TV; toolbar/editor controls remain on the laptop. The warehouse/Area 1 demo is available immediately. Load another image or saved project in the editor to update the TV scene.

The TV window and editor communicate within the same local browser using BroadcastChannel. No internet, backend, pairing code, or account is required. Use the **same browser profile** for both windows; browser popup permission may be required. For smooth performance, a laptop with a dedicated GPU is recommended because two 3D canvases run at once. This version does not add new cinematic animations, audio, or a full scene director; it prioritizes a usable second-screen display.


## Episode 1 — Cinema v0.5 (quick-start for HDMI session)

1. Extract the ZIP and launch with `Start-MapForge.bat` (Windows + Python 3 installed).
2. Connect HDMI, use Windows + P > Extend, and click **Open TV View**.
3. Drag the TV View to the television and click its **Fullscreen** button.
4. Under **Episode 1 / Show Control**, select a scene and click **Show on TV**.
5. Use **Blackout TV** for hidden transitions; **Return to live 3D** for the warehouse/fissure/Area 1 modeled scene.
6. DM-only notes remain in the control window. Use the adventure PDF for checks, exact trap mechanics, and encounter details.

Keyboard while your focus is *not* in a field: left/right arrows change scenes, Space presents selected scene, B blackouts, L returns to live 3D.

**Scope:** This release packages atmospheric art for the warehouse, Areas 1, 2, 3, and 5; atmospheric cue cards for Areas 4, 6, 7, 8, 9, 10, and the return. Only the warehouse/Area 1 connected terrain is currently reconstructed as explorable 3D. Other scenes are TV-ready *2D presentations*, not advertised as 3D worlds. All material is local. No multiplayer, backend, accounts, or additional dependencies.

## v0.6 — Cinematic 3D rooms for tomorrow's session

Areas **2: Trials**, **3: Traps**, and **5: Death** now render as animated-camera Three.js dioramas on the HDMI TV view. They are visually reconstructed from the supplied area illustrations: four luminous pools and stone columns in Trials; copper pressure plates A–D in Traps; and a rocky, webbed cavern with cocoons and a giant spider in Death. These are scenic models, **not mechanically simulated encounters or one-to-one tactical 3D conversions**.

To use: open TV View, select Area 2, Area 3, or Area 5 in the Episode 1 Director panel, then press **Show on TV**. The camera automatically sweeps through the location. For an exact tactical reference, press **Show original 2D map**. **Blackout TV** and **Return to live 3D** still work. Areas 6–10 now have source-informed cinematic dioramas, with 2D fallback images only where supplied. No setup or dependency changes are needed.

The 3D scenes are TV-only presentation environments. They do not change editable Area 1 geometry or save data. All assets are bundled for offline use. JavaScript syntax checks passed. Automated browser rendering could not be completed because the test browser blocked localhost access; perform a five-minute local test before the session.

### Episode 1 visual direction (v0.7)

- New procedurally built scene presentations cover Areas 2, 3, 5, 6, 7, 8, 9 and 10; the existing Area 1 + warehouse connection remains explorable.
- Source art remains a 2D reference; no source-page headings or GM trap labels are projected on 3D ground.
- `docs/episode1-fidelity.md` records the three-pass source review and QA acceptance criteria.
- Cinematic geometry is deliberately interpretive and not a full reconstruction of every encounter.