# v3 build contract: D.B. Cooper - El Hombre Que Desapareció
## 50-second cinematic 3D mystery short (1080x1920, 30fps, 1500 frames)

**Goal:** A 50-second vertical Short about the D.B. Cooper hijacking mystery. Blender 5.2 headless, EEVEE, GPU. No narration, no dialogue - pure visual storytelling with Spanish text overlays. Music and SFX only.

**Target numbers (ffmpeg signalstats on final 1080x1920 frames):**
- saturation ≥ 40 (cinematic 70s film look)
- average luma 85–110 (dark mystery palette)
- luma 10–90% spread ≥ 120 (high contrast)
- no pure white blowouts
- no key character cut by frame edges

---

## Inputs (read-only)
- Story, shots, cast: this `CONTRACT.md` + `story.md` + `shots.json` + `acting.json`
- Voice timings: NONE (no narration)
- Reference look: 1970s film aesthetic — desaturated blues/browns, warm interiors, cold exteriors, volumetric fog, film grain

---

## Workspace
`C:\Users\Roberth 2\Desktop\Gilmer\Creación de videos con IA\projects\db-cooper\`
**Each agent writes ONLY its own files.**

---

## Sets (all in one .blend world, spaced apart on X)

| id | origin | what | used for (shots) |
|---|---|---|---|
| `airport` | (0,0,0) | 1971 Portland airport terminal, rain, passengers, ticket counter, glass doors to tarmac | s1 (0-150) |
| `cabin` | (300,0,0) | Boeing 727 passenger cabin: seats, windows, overhead bins, aisle, 1970s textures | s2 (150-300), s3 (300-450), s4 (450-600), s5 (600-750) |
| `cockpit` | (600,0,0) | Boeing 727 flight deck: pilot/copilot seats, instrument panel, windshield | s4 (450-600) partial |
| `exterior` | (900,0,0) | Boeing 727 flying at night: clouds, stars, city lights below, wing lights | s2 (150-300) ext, s6 (750-900) |
| `rear_door` | (1200,0,0) | Aft airstair area: open door, wind, night sky, stairs deployed | s7 (900-1050) |
| `forest` | (1500,0,0) | Washington mountains: dense conifers, fog, rain, moonlight, rugged terrain | s8 (1050-1200) |
| `evidence` | (1800,0,0) | FBI investigation room: board with photos, map, money, documents, magnifying glass | s9 (1200-1350) |
| `finale` | (2100,0,0) | Boeing 727 in clouds, silhouette in window, pull back to black | s10 (1350-1500) |

---

## Module API (Python, `import` from `lib/`)
**look.py** (agent LOOK)
- `setup_render(scene)`: EEVEE settings, 1080x1920, colour management for film look
- `film_mat(name, rgb, tex=None)` returns Material: painted 1970s film stock emulation with subtle grain, halation, color grading
- `ink_hull(obj, width)`: inverted-hull outline for characters
- `apply_mood(scene, mood, f_start, f_end)`: world, lights, fog keyed per frame range. Moods: `airport_day`, `cabin_day`, `cabin_night`, `cockpit_night`, `exterior_night`, `rear_night`, `forest_night`, `evidence_day`, `finale_night`
- `setup_compositor(scene)`: film grain, vignette, bloom, grade to target numbers, halation
- `fx_rain(at, f, intensity)`, `fx_fog(at, f)`, `fx_wind(at, f)`, `fx_propeller(at, f)`, `fx_parachute(at, f)`

**chars.py** (agent CHARS)
- `make_cooper(name)` returns `Char`: 1970s man, black suit, white shirt, black tie, dark hair, briefcase. Rigged for walk, sit, turn_head, hand_gestures, open_briefcase, stand, walk_aft, hold_parachute, jump.
- `Char.root`: the object to place
- `Char.place(f, loc, rot_z)`: keys location
- `Char.pose(f, name)`, name ∈ {idle, walk, sit, turn_head, gesture_note, open_briefcase, stand, walk_aft, hold_parachute, jump, skydive}
- `Char.face(f, name)`, name ∈ {neutral, calm, focused, tense, determined, mysterious}
- `Char.hold(f, prop_obj)`: parents prop to hand
- Also render `chars/model_sheet.png` showing all poses/faces

**sets.py** (agent SETS)
- `build_sets()` returns `{set_id: {'collection': c, 'anchors': {name: Empty}}}` for all 8 sets. Anchors: `cooper_spot`, `window_seat`, `aisle`, `cockpit_door`, `pilot_seat`, `copilot_seat`, `rear_door_center`, `stairs_bottom`, `forest_entry`, `evidence_board`, `finale_window`
- `build_props()` returns props: `briefcase`, `ticket`, `note`, `money_bag`, `parachute`, `parachute_deployed`, `plane_exterior`, `plane_interior_seats`, `instrument_panel`, `evidence_photos`, `evidence_map`, `evidence_money`, `magnifying_glass`, `coffee_cup`, `ashtray`, `cigarette`
- Procedural textures for 1970s materials: vinyl seats, brushed metal, formica, wool carpet, aluminum skin
- Uses `look.film_mat` and `look.ink_hull`

**shots.json** (agent SHOTS, data file)
- Array of 10 shots `{id, set, f_in, f_out, transition_in, camera:[{f, pos, target, lens, roll}], actions:[{f, char, place|pose|face|hold, args}], props:[{f, prop, action, args}], fx:[{f, type, at}], mood, size, subj, push, az, el, az1, el1, camrel}`
- Positions in set-local metres from set origin
- Shot sizes: XW (extreme wide), WIDE, MED, CU, ECU (extreme close-up)
- No hard cuts — travel/whip/dissolve transitions
- Text overlays defined per shot in `text_overlays.json`

**integrator**: `scene.py` builds everything from modules + shots.json, runs gate (middle frame per shot) and full render.

---

## Agent Boundaries (STRICT)
| Agent | Owns | Must NOT touch |
|---|---|---|
| LOOK | look.py, compositor, materials, moods, FX | chars.py, sets.py, shots.json, scene.py |
| CHARS | chars.py, cooper model, rig, poses, faces | look.py, sets.py, shots.json, scene.py |
| SETS | sets.py, all 8 sets, props, textures | look.py, chars.py, shots.json, scene.py |
| SHOTS | shots.json, text_overlays.json, timing | look.py, chars.py, sets.py, scene.py |
| INTEGRATOR | scene.py (reads all, writes nothing else) | — |

---

## Deliverables
- `db_cooper_final.mp4` (1080x1920, 30fps, 50s, H.264, AAC)
- `scene.blend` (complete Blender file)
- `scripts/` (all Python build scripts)
- `models/` (character, props)
- `music/` (soundtrack stems)
- `sfx/` (sound effects)
- `renders/` (PNG sequences per shot)
- `contact_sheets/` (1fps sheets per shot)
- `critic_report.md` (frame-accurate evaluation)
- `storyboard.md` (visual script)
- `documentation.md` (build log)