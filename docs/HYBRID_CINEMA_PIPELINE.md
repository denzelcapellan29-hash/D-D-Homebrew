# MapForge Hybrid Cinema Pipeline

Last updated: 2026-10-07

MapForge should not force every player-facing scene into low-detail real-time geometry. The preferred production model for Episode 1 is:

**cinematic reveal art → playable 3D / 2.5D diorama → original 2D map fallback**

The TV image is the priority. True 3D is useful where interaction, spatial comprehension, or camera movement adds value. High-quality rendered art is preferred when it communicates the encounter better.

## Presentation states

### Cinematic Reveal
A 16:9 source-faithful hero frame shown when the party first enters a location. It should communicate the room's core dramatic idea within roughly three seconds.

### Play View
The interactive room. Use inexpensive 3D for floor, walls, pools, pits, doors, blocking and camera movement. Use 2.5D art, sprites, matte panels and transparent overlays for subjects that look substantially better as rendered art.

### Tactical Map
The original player-safe 2D battlemap when exact positioning matters.

### Focus Shot
Optional close-up art for a creature, artifact, carving, trap detail or story prop. This can be a transparent cutout or full-frame still.

## Optional local/private art manifest

MapForge loads `assets/cinema/manifest.json` when present. This file is intentionally optional so private/session art does not need to be committed to the public repository.

Example:

```json
{
  "scenes": {
    "death": {"hero": "./assets/cinema/death-reveal.png"},
    "dragon": {"hero": "./assets/cinema/dragon-reveal.png"}
  }
}
```

The Director's **Cinematic Reveal** button uses these assets. If a scene has no reveal installed, MapForge falls back to its normal live scene.

Recommended hero asset: 1672×941 or 1920×1080 PNG/JPG, 16:9, player-safe, no GM labels.

Recommended transparent creature/prop asset: PNG/WebP with alpha, 1024–2048 px on longest side, subject fully contained with margin for drop shadow.

## 2.5D rules

- Billboard creature art should remain within about ±25° of its intended camera angle.
- Add a soft ground shadow beneath sprites so they feel planted in the room.
- Keep collision and encounter positions in the 3D scene even if the visible monster is a sprite.
- Use backdrop/matte panels only outside the walkable play area.
- Use slight parallax between foreground, subject and background layers.
- Hide or cross-fade a reveal still before returning to Play View.
- Do not expose DM-only labels, trap letters, DCs, mechanics, or unrevealed secrets.

## Episode 1 source-detail checklist

These details are drawn from the user-supplied Episode 1 source and are the visual acceptance checklist.

### Area 2 — Trials
- Rectangular worked-stone chamber with no obvious earthquake damage.
- Buttresses and six columns visibly support the chamber.
- Four 10-foot-deep pools: **blue, green, clear, and cloudy**.
- Wall carvings visibly depict the pools and **robed figures submerging themselves**.
- Double doors at the far end have a large ornate lock.
- Player-facing art must not explain individual pool mechanics or reveal hidden runes.

Preferred treatment: high-detail reveal art + real pool/column/door geometry + carved-wall matte/relief panels.

### Area 3 — Traps
- East-running passage widens to roughly 30 feet for a long stretch, then narrows again.
- Ornate double doors terminate the sequence.
- Four trap zones should read as plausible floor architecture, not GM-labeled squares.
- Source-specific environmental cues can appear subtly: char/scorch evidence, a pit/floor mechanism, faint magical staining.
- The chamber beyond contains wall slabs with human-sized wrapped bodies, but this should not be spoiled before the doors open.

Preferred treatment: cinematic corridor reveal + interactive floor geometry.

### Area 4 — Tunnels
- Maze-like crossing passages with earthquake damage and partial collapses.
- Cleared/collapsed debris and structural weakness.
- Circular passage overgrown with carnivorous blood weeds.
- Final passage contains an acid-filled pit with floating bones.

Preferred treatment: 2–3 cinematic transition stills rather than forcing a full maze into real-time 3D.

### Area 5 — Death
- Natural cavern.
- Ceiling obscured by thick, dusty webs.
- **Five suspended cocoons**, bottoms hanging about ten feet above the floor.
- Two cocoons have suspiciously humanoid shapes.
- Giant spider hides in a dust-filled depression/hollow in the floor.

Preferred treatment: high-detail spider/cocoon reveal art + simple cave collision floor + web/cocoon overlays.

### Area 6 — Goblin
- Natural cavern with stalactites and stalagmites.
- Gorkoh is frightened/nervous and carries a gnarled piece of bleached wood while bluffing that it is a magic wand.
- Passage continues northeast toward the next cavern.
- A fragile sharp stalactite cluster marks the narrow approach.
- Obvious heap of bones and gear lies to the northeast.

Preferred treatment: transparent high-quality goblin standee + simple cave diorama + source-specific bone/gear and ceiling-cluster props.

### Area 7 — Stomp
- Bare severed feet are scattered across the cave floor.
- Mysterious suspended granite **Big Foot** is the dominant visual.
- Foot-rune motifs appear on the north and south walls.

Preferred treatment: cinematic reveal of the scale gag/hazard + 3D floor/crater + wall-rune art panels.

### Area 8 — Tentacle
- Sewer pipes empty into a vast cesspool.
- Central water is roughly ten feet deep.
- Green monstrous tentacle is the primary reveal.

Preferred treatment: current 3D scene is strong; preserve it and add art only if it clearly improves the TV image.

### Area 9 — Dragon
- Injured **young brass dragon**, not a generic red dragon or default boss pose.
- The dragon is trapped/wounded amid earthquake rubble and should read as a possible ally.
- Two darkmantles are present as secondary threats.
- Rock-strewn cavern, not treasure-hoard spectacle.

Preferred treatment: high-quality wounded brass-dragon standee or full reveal art + rubble interaction geometry + separate darkmantle silhouettes.

### Area 10 — Shrine of Destruction
- Granite altar.
- Broken Orrery of the Wanderer.
- Fallen dwarf/body near the altar.
- Sergeant Teeshe present in the chamber.
- Active arcane/entropy guardian associated with the shrine.

Preferred treatment: current orrery/artifact presentation is strong. Preserve it; add story-character silhouettes/props without spoiling unrevealed mechanics.

## Quality gate

A hybrid asset is accepted only if:
1. it is source-faithful at first glance;
2. it has no GM-only information;
3. it reads clearly on a television;
4. it materially exceeds the quality of the procedural substitute;
5. the actual rendered frame is manually inspected before being called ready.
