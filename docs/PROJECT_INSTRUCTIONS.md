# MapForge 3D — Persistent Project Instructions

Last updated: 2026-10-07

These instructions define the operating standard for work on MapForge 3D in the **Acq Inc Homebrew** project. They exist to keep GitHub, Google Drive, and ChatGPT project work aligned.

## Product identity

MapForge 3D is a **local cinematic presentation tool for a physical D&D table**, not a VTT rules engine.

- DM runs the laptop.
- Players see a clean TV presentation over HDMI Extended Display.
- No multiplayer, accounts, networking, combat automation, initiative engine, or rules engine.
- Physical dice and tabletop rules stay outside the app.
- Priority: cinematic immersion, fast scene control, reliable TV presentation, and tactical clarity when needed.

## Creative direction

Approach every environment like a film director and production designer.

For each scene:
- Decide what players should feel first.
- Establish one primary focal point.
- Use foreground / midground / background layering.
- Use motivated practical light, rim light, atmospheric depth, and readable silhouettes.
- Camera movement must have a storytelling purpose.
- Prefer strong establishing shots, controlled reveals, and clean visual hierarchy over generic orbiting.
- A scene should communicate its location and dramatic idea within roughly three seconds on a TV.

The target is not “procedural 3D that technically resembles the map.” The target is a convincing cinematic interpretation that supports play.

## Source fidelity and map enhancement

The Episode 1 source PDF and supplied/enhanced maps are references for layout, encounter identity, and story beats.

- Preserve important spatial relationships and encounter landmarks.
- Hide DM-only information from players.
- Do not print trap letters, DCs, numbered areas, or GM notes into player-facing geometry.
- Improved or newly generated player-facing map art is allowed and encouraged when it improves readability, mood, lighting, presentation, or 3D blocking.
- Source maps are references, not sacred assets.
- Do not commit the copyrighted adventure PDF to the public GitHub repository.
- Be cautious about publicly redistributing derivative source-map assets.

## Mandatory visual QA — non-negotiable

**Never tell the user a build is ready, good, improved, cinematic, or visually successful without personally inspecting the actual rendered frames.**

A passing workflow, successful WebGL startup, clean console, or completed screenshot job is **not** visual QA.

Before presenting a visual change as accepted:

1. Run the GitHub Actions visual-QA workflow.
2. Retrieve the actual QA images or workflow artifact.
3. Open and visually inspect the rendered screenshots.
4. Judge them as production frames, not implementation evidence.
5. If screenshots cannot be inspected, explicitly say the visual result is unverified.
6. If the workflow failed, do not imply the build passed.
7. Do not ship a visual pass merely because the code is syntactically valid or because screenshots were generated.

Minimum required review for changes affecting the connected Warehouse / Area 1 scene:
- Director Orbit.
- Warehouse Orbit.
- Warehouse first-person / Explore.
- Area 1 Orbit.
- Area 1 first-person / Explore.
- TV live view.
- Any reveal / cutaway state affected by the change.

For Episode 1 cinematic rooms, also inspect the relevant 3D scene captures and TV output.

### Visual rejection criteria

Reject and revise the build if any of the following appear:
- floating map slab or visible world void;
- camera embedded in or staring directly into a wall;
- large primitive boxes/boulders dominating composition;
- obviously procedural repetition;
- artificial circular/engineered geometry where the fiction calls for a natural or magical rupture;
- exposed hard scene boundaries;
- toy-like monster or prop silhouette;
- unreadable focal point;
- lighting that feels like an effect rather than a motivated source;
- excessive emissive/neon treatment;
- foreground geometry obscuring the encounter;
- ugly geometry that is merely hidden by darkness instead of corrected;
- player-facing metagame labels.

## Warehouse / Area 1 standing direction

The warehouse rupture must read as a **violent magical catastrophe caused by an artifact**, not a designed shaft, well, mine, or deliberate dungeon entrance.

Required qualities:
- asymmetric, jagged floor failure;
- believable broken structural members;
- collapsed and displaced floor sections;
- debris that follows structural logic;
- restrained magical evidence, not neon decoration;
- a rope that remains functional and readable;
- warehouse embedded in believable Waterdeep context.

The connected world must not look suspended in a void.

Warehouse framing should use:
- believable street continuation;
- distant or partial neighboring architecture;
- haze and occlusion to hide world boundaries;
- context geometry that never dominates the hero shot.

Area 1 should read as a chamber inside a larger underground network:
- cave perimeter and earth mass;
- believable tunnel continuation;
- irregular occlusion at edges;
- fog / darkness used for depth, not as a substitute for geometry;
- no obvious map extrusion edges.

## Camera standards

### Orbit
- Show the environment, not implementation scaffolding.
- Preserve a strong three-quarter composition.
- Keep the scene focal point readable.
- Avoid extreme height that makes the environment feel like a floating diorama.

### Explore / first-person
- Camera starts on navigable ground.
- It must face a meaningful route or focal point.
- Never spawn facing a rock wall, exterior shell, blank void, or hidden backside of geometry.
- Eye height must read as human-scale.
- Test both Warehouse and Area 1 separately.

### TV
- TV presentation is the authoritative player-facing image.
- No editor controls, DM notes, debug states, or labels.
- Composition must remain readable at living-room viewing distance.

## QA workflow requirements

The repository visual-QA suite should:
- launch Chromium with WebGL / SwiftShader support;
- validate WebGL initialization;
- capture Orbit and Explore views;
- capture TV live output;
- capture Episode 1 room scenes;
- validate 2D map fallback and blackout;
- fail on browser/page errors;
- publish preview images and retain full-resolution artifacts.

QA preview publishing is useful, but the authoritative check is manual inspection of the actual rendered frames.

Do not leave stale `failure.txt` or failure screenshots in a way that can be mistaken for current status.

## Working style

- Implement rather than over-plan when the request is clear.
- When the user says “continue,” continue implementation.
- When behind schedule, combine related fixes into a coherent pass rather than fragmenting them into excessive micro-iterations.
- Still visually QA the combined pass before presenting it.
- Be exact about what is verified versus inferred.
- Do not claim work happened in the background unless it was actually scheduled or run through tooling.
- Do not claim visual inspection based only on metadata, file names, workflow success, or screenshot existence.

## Release discipline

Before calling a build the latest recommended version:
- current GitHub main must contain the intended code;
- visual-QA workflow should complete successfully;
- relevant frames must be manually inspected;
- known visual defects should be documented;
- README / version label should match the actual release;
- downloadable release ZIP should be generated only after the visual acceptance pass.

## Incident note — 2026-10-07

A Warehouse / Area 1 immersion pass was committed before manual frame inspection. The rendered result contained:
- blocky primitive city context dominating the warehouse shot;
- a rupture buried by procedural rubble;
- over-strong blue magical fracture effects;
- first-person camera views aimed into walls;
- Area 1 dominated by obvious low-poly perimeter geometry;
- a failed screenshot-QA run.

This is the reason the **Mandatory visual QA** rule above is now a hard project requirement.

No future visual pass should be presented to the user as accepted until the actual frames have been opened and reviewed.
