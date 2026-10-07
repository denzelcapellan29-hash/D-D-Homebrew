# Episode 1 fidelity review and cinematic direction

**Source:** User-supplied, 23-page Episode 1 PDF, *Right Place, Wrong Heroes*, and enhanced area images. Source document is **not** distributed with the public code repository. All references below point to PDF page numbers in the user's local copy.

## Document review

- Pass 1 (p. 1 → 23): story chronology, player-facing locations and encounter descriptions.
- Pass 2 (p. 23 → 1): endings-to-openings causal chain, encounter triggers and landmarks.
- Pass 3 (p. 1 → 23): location-to-concept-art consistency, 3D representation and DM-only information boundaries.

## Scene-reference ledger

| PDF pages | Location | Requirements for player-facing display | DM-specific information to hide |
|---|---|---|---|
| 8–9 | Warehouse/fissure | Ruined warehouse under dockside shops, exposed massive sinkhole, intact rope securely tied to beam, cutaway shaft | Watch intelligence and side goals |
| 9–10 | Area 1 Rats | Fissure enters from western wall of debris chamber; rubble to south, northward footprints lead deeper; rat signs | Rat-count/DC and magical ring reward |
| 10–11 | Area 2 Trials | Rectangular ritual chamber, **four deep pools** (blue, green, clear, cloudy), six structural columns, ornate **double doors** | Specific pool hazards, runes, hidden consequences |
| 12–13 | Area 3 Traps | Widened stone corridor, four subtle plates/areas in sequence, narrow eastern gateway, non-lethal-seeming surfaces | A/B/C/D labels, invisible runes, pit details until revealed |
| 13–14 | Area 4 Tunnels | Collapsed junctions, rough passages, moving debris, ominous vegetation and hidden acid | Skill checks, selected dangers |
| 14–15 | Area 5 Death | Natural cavern with thick webs and **five suspended cocoons**, one humanoid-sized; giant spider in a **dusty floor hollow** | Constable Boot's condition before discovery |
| 15–16 | Area 6 Goblin | Stalagmite cave and nervous goblin carrying wooden stick; carrion crawler approach from next cave | Goblin's secret and negotiation options |
| 16–17 | Area 7 Stomp | Severed bare feet scattered across cave floor; mysterious suspended granite 'Big Foot' hazard | Runic deactivation and player-specific triggers |
| 17–18 | Area 8 Tentacle | Sewer pipes empty into vast cesspool; **central ten-foot-deep water**; green monstrous tentacle | Encounter surprise mechanic |
| 18–19 | Area 9 Dragon | Injured **young brass dragon** (potential ally) and two darkmantles; rock-strewn chamber | Dialogue outcomes and creature stats |
| 19–20 | Area 10 Shrine | Granite altar with runes, broken orrery, fallen City Watch officer, active arcane guardian | Possession reveal and orrery aftermath |
| 21–22 | Exit/epilogue | Return from same sinkhole and report to city/Acq Inc | Ambush and rewards until revealed |

## Presentation principles

1. Original map art is for **2D reference mode**, never stretched across a 3D floor: labels, compass roses and 'Area X' headings are for DMs, not player-world geometry.
2. The TV view should never expose metagame annotations (trap letters, DCs, numbered scenes or DM notes).
3. 3D floor materials should be tiled procedural stone or earth; architectural forms and colored effects are physically modeled.
4. Correctness of the environment matters more than generic spectacle. In particular, Area 5 has five high-hanging cocoons, not nine floor-level rocks; Area 9 dragon is brass, not hostile by default.
5. Procedural scenes are simplified **cinematic interpretations**, not exact semantic reconstructions of the battlemaps. Keep originals available via DM controls.
6. Start in source-appropriate presentation, avoid first-person camera interpenetrating rock geometry, and verify both desktop and standalone TV view.
7. Replay all of Episode 1 using a local Chrome/Chromium test; use captured PNG artifacts to evaluate visual quality manually, not just whether the WebGL renderer starts.

## Visual-QA log

First successful automated rendering pass (v0.6): Orbit and camera modes initialized, but independent screenshot inspection revealed defects: Explore camera obscured by an enormous bright rock face; Area 2 / 3 drawings had **labels printed on the floor**; A–D markings were openly visible to players; Area 5 looked like coarse boulders. This source-fidelity pass introduces 3D stone floor materials and cinematic reconstructions while keeping 2D image fallback.
## Project instruction authority

The root-level **PROJECT_INSTRUCTIONS.md** is the standing operating standard for MapForge development. In particular, visual changes are not accepted until the actual rendered QA frames have been retrieved and manually inspected. Workflow completion, WebGL startup, and screenshot existence are necessary but not sufficient.

The 2026-10-07 Warehouse / Area 1 failure is now a permanent QA lesson: do not present a visual pass as ready when first-person framing, environment composition, or world-edge concealment have not been visually checked.
