"""SCENE Integrator (D.B. Cooper): Builds the complete film from lib/* + shots.json.
Blender 5.2 headless, EEVEE, GPU.
Usage:
  blender -b -P scene.py -- gate OUTDIR [shot_ids...]     # render middle frame of each shot
  blender -b -P scene.py -- frames OUTDIR A B [SAMPLES]   # render frames A..B-1 as PNG
  blender -b -P scene.py -- save OUTDIR                   # save .blend file
"""
import bpy, sys, os, json, math
from mathutils import Vector, Euler, Quaternion

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE + '/lib')
import look, sets, chars

args = sys.argv[sys.argv.index('--') + 1:]
MODE, OUT = args[0], args[1]
SAMPLES = 64

SHOTS = json.load(open(HERE + '/shots.json'))
END = SHOTS[-1]['f_out']

# Clear scene
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
sc.frame_start, sc.frame_end = 0, END

# Setup render
look.setup_render(sc)
sc.eevee.taa_render_samples = SAMPLES

# Build sets and props
S = sets.build_sets()
P = sets.build_props_dict()
A = {sid: d['anchors'] for sid, d in S.items()}

# Set origins for world positioning
ORIGIN = sets.ORIGIN


def W(set_id, v):
    """Convert shot-local position to world Vector."""
    if isinstance(v, dict):
        anchor_obj = A[set_id].get(v['anchor'])
        if not anchor_obj:
            print(f"WARNING: Anchor {v['anchor']} not found in set {set_id}")
            return Vector((ORIGIN[set_id][0] + v['off'][0], -v['off'][1], v['off'][2]))
        a = anchor_obj.location
        o = v['off']
        return Vector((a.x + o[0], a.y - o[1], a.z + o[2]))
    return Vector((ORIGIN[set_id][0] + v[0], -v[1], v[2]))


def constant(idb, names=None):
    """Set keyframe interpolation to CONSTANT for given data paths."""
    if not idb.animation_data or not idb.animation_data.action:
        return
    for fc in idb.animation_data.action.fcurves:
        if names is None or fc.data_path in names:
            for k in fc.keyframe_points:
                k.interpolation = 'CONSTANT'


# ===============================================================
# CHARACTERS
# ===============================================================
print("Creating characters...")
CH = {}
# Main character: Cooper
cooper = chars.make_cooper('Cooper')
CH['cooper'] = cooper

# Proxy characters (simplified - just for background)
# Flight attendant proxy
bpy.ops.object.armature_add(enter_editmode=False)
fa_arm = bpy.context.object
fa_arm.name = 'FA_Proxy_Rig'
fa_body = bpy.data.objects.get('Cooper_Body').copy()
fa_body.data = fa_body.data.copy()
fa_body.name = 'FA_Proxy_Body'
fa_body.parent = fa_arm
bpy.context.scene.collection.objects.link(fa_body)
# Simple proxy - reuse Cooper mesh but different position
CH['fa_proxy'] = type('ProxyChar', (), {
    'name': 'FA_Proxy',
    'root': fa_body,
    'armature': fa_arm,
    'pose_bones': fa_arm.pose.bones,
    'place': lambda self, f, loc, rot_z=0: (
        setattr(self.root, 'location', loc),
        setattr(self.root, 'rotation_euler', (0, 0, rot_z)),
        self.root.keyframe_insert('location', frame=f),
        self.root.keyframe_insert('rotation_euler', frame=f)
    ),
    'pose': lambda self, f, name: None,
    'face': lambda self, f, name: None,
})()

# Pilot proxies
for proxy_name, x_off in [('pilot_proxy', -0.6), ('copilot_proxy', 0.6)]:
    bpy.ops.object.armature_add(enter_editmode=False)
    p_arm = bpy.context.object
    p_arm.name = f'{proxy_name}_Rig'
    p_body = bpy.data.objects.get('Cooper_Body').copy()
    p_body.data = p_body.data.copy()
    p_body.name = f'{proxy_name}_Body'
    p_body.parent = p_arm
    bpy.context.scene.collection.objects.link(p_body)
    CH[proxy_name] = type('ProxyChar', (), {
        'name': proxy_name,
        'root': p_body,
        'armature': p_arm,
        'pose_bones': p_arm.pose.bones,
        'place': lambda self, f, loc, rot_z=0: (
            setattr(self.root, 'location', loc),
            setattr(self.root, 'rotation_euler', (0, 0, rot_z)),
            self.root.keyframe_insert('location', frame=f),
            self.root.keyframe_insert('rotation_euler', frame=f)
        ),
        'pose': lambda self, f, name: None,
        'face': lambda self, f, name: None,
    })()

# Ground crew proxies
for proxy_name in ['ground_crew1', 'ground_crew2']:
    bpy.ops.object.armature_add(enter_editmode=False)
    g_arm = bpy.context.object
    g_arm.name = f'{proxy_name}_Rig'
    g_body = bpy.data.objects.get('Cooper_Body').copy()
    g_body.data = g_body.data.copy()
    g_body.name = f'{proxy_name}_Body'
    g_body.parent = g_arm
    bpy.context.scene.collection.objects.link(g_body)
    CH[proxy_name] = type('ProxyChar', (), {
        'name': proxy_name,
        'root': g_body,
        'armature': g_arm,
        'pose_bones': g_arm.pose.bones,
        'place': lambda self, f, loc, rot_z=0: (
            setattr(self.root, 'location', loc),
            setattr(self.root, 'rotation_euler', (0, 0, rot_z)),
            self.root.keyframe_insert('location', frame=f),
            self.root.keyframe_insert('rotation_euler', frame=f)
        ),
        'pose': lambda self, f, name: None,
        'face': lambda self, f, name: None,
    })()

# Agent proxy (evidence room)
bpy.ops.object.armature_add(enter_editmode=False)
ag_arm = bpy.context.object
ag_arm.name = 'Agent_Proxy_Rig'
ag_body = bpy.data.objects.get('Cooper_Body').copy()
ag_body.data = ag_body.data.copy()
ag_body.name = 'Agent_Proxy_Body'
ag_body.parent = ag_arm
bpy.context.scene.collection.objects.link(ag_body)
CH['agent_proxy'] = type('ProxyChar', (), {
    'name': 'Agent_Proxy',
    'root': ag_body,
    'armature': ag_arm,
    'pose_bones': ag_arm.pose.bones,
    'place': lambda self, f, loc, rot_z=0: (
        setattr(self.root, 'location', loc),
        setattr(self.root, 'rotation_euler', (0, 0, rot_z)),
        self.root.keyframe_insert('location', frame=f),
        self.root.keyframe_insert('rotation_euler', frame=f)
    ),
    'pose': lambda self, f, name: None,
    'face': lambda self, f, name: None,
})()

# Initial placement off-screen for all
for c in CH.values():
    if hasattr(c, 'root'):
        c.root.location = (-300, 0, 0)
        c.root.keyframe_insert('location', frame=-5)
        c.root.rotation_euler = (0, 0, 0)
        c.root.keyframe_insert('rotation_euler', frame=-5)

print(f"Created {len(CH)} characters")


# ===============================================================
# CAMERA
# ===============================================================
cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam'))
sc.collection.objects.link(cam)
sc.camera = cam
cam.data.clip_end = 5000
cam.data.clip_start = 0.01
cam.data.sensor_width = 36
cam.data.sensor_fit = 'HORIZONTAL'
cam.data.dof.use_dof = True
cam.data.dof.aperture_fstop = 2.8


# ===============================================================
# SET VISIBILITY & MOODS
# ===============================================================
vis = {sid: set() for sid in S}
for s in SHOTS:
    vis[s['set']].add(s['id'])


def _vis(scene, *a):
    f = scene.frame_current
    cur = next((x['set'] for x in SHOTS if x['f_in'] <= f < x['f_out']), SHOTS[-1]['set'])
    for sid, d in S.items():
        d['collection'].hide_render = (sid != cur)
        d['collection'].hide_viewport = (sid != cur)

bpy.app.handlers.frame_change_pre.append(_vis)

# Mood runs
LAMP_POS = {
    ('airport_day', 'airport'): (0, 25, 6),
    ('cabin_day', 'cabin'): (300, 0, 3),
    ('cabin_night', 'cabin'): (300, 0, 3),
    ('cockpit_night', 'cockpit'): (600, 0.5, 2),
    ('exterior_night', 'exterior'): (900, 0, 50),
    ('rear_night', 'rear_door'): (1200, -1, 3),
    ('forest_night', 'forest'): (1500, 0, 10),
    ('evidence_day', 'evidence'): (1800, -1, 3),
    ('finale_night', 'finale'): (2100, 0, 50),
}

runs = []
for s_ in SHOTS:
    key = (s_['mood'], s_['set'])
    if runs and runs[-1][0] == key:
        runs[-1][2] = s_['f_out'] - 1
    else:
        runs.append([key, s_['f_in'], s_['f_out'] - 1])

comp = look.setup_compositor(sc)
for key, f0, f1 in runs:
    lamp_at = LAMP_POS.get(key)
    fill_x = ORIGIN[key[1]][0]
    look.apply_mood(sc, key[0], f0, f1, lamp_at=lamp_at, fill_x=fill_x)

# Make mood keyframes constant interpolation
for idb in (bpy.data.worlds.get('FILM_World'),
            bpy.data.objects.get('FILM_Sun'),
            bpy.data.objects.get('FILM_Fill'),
            bpy.data.objects.get('FILM_Rim'),
            bpy.data.objects.get('FILM_Lamp')):
    if idb and idb.animation_data and idb.animation_data.action:
        action = idb.animation_data.action
        if hasattr(action, 'fcurves'):
            for fc in action.fcurves:
                for k in fc.keyframe_points:
                    k.interpolation = 'CONSTANT'


# ===============================================================
# PROP HOME POSITIONS
# ===============================================================
HOME = {}
for k, o in P.items():
    if o:
        HOME[(k, 'default')] = Vector(o.location)

# Hide all props initially
for o in P.values():
    if o:
        o.hide_render = True
        o.hide_viewport = True


def key_vis(obj, frame, visible):
    if obj:
        obj.hide_render = not visible
        obj.keyframe_insert('hide_render', frame=frame)


def key_loc(obj, frame, loc, rot=None, snap=True):
    if not obj:
        return
    obj.location = loc
    obj.keyframe_insert('location', frame=frame)
    if rot:
        obj.rotation_euler = rot
        obj.keyframe_insert('rotation_euler', frame=frame)


# ===============================================================
# PER-SHOT PROCESSING
# ===============================================================
print("Processing shots...")

for s in SHOTS:
    sid, f0, f1 = s['set'], s['f_in'], s['f_out']
    print(f"  Shot {s['id']} ({sid}) frames {f0}-{f1}")
    
    # --- Characters ---
    for a in sorted(s['actions'], key=lambda x: x['f']):
        f, ck, act, ar = a['f'], a['char'], a['act'], a['args']
        char = CH.get(ck)
        if not char:
            print(f"    WARNING: Character {ck} not found")
            continue
        
        if act == 'place':
            loc = W(sid, ar['loc'])
            rz = ar.get('rot_z', 0.0)
            char.place(f, loc, rz)
        elif act == 'pose':
            char.pose(f, ar['name'])
        elif act == 'face':
            char.face(f, ar['name'])
        elif act == 'hold':
            prop = P.get(ar['prop']) if ar.get('prop') else None
            char.hold(f, prop)
    
    # --- Props ---
    for q in sorted(s['props'], key=lambda x: x['f']):
        pk, f, act, ar = q['prop'], q['f'], q['action'], q.get('args', {})
        obj = P.get(pk)
        if not obj:
            print(f"    WARNING: Prop {pk} not found")
            continue
        
        if act == 'appear':
            at = W(sid, ar['at']) if 'at' in ar else HOME.get((pk, 'default'), Vector((0,0,0)))
            key_loc(obj, f, at)
            key_vis(obj, f - 1, False)
            key_vis(obj, f, True)
        elif act == 'move':
            to = W(sid, ar['to']) if 'to' in ar else HOME.get((pk, 'default'), Vector((0,0,0)))
            key_loc(obj, f, to)
        elif act == 'swap':
            # Swap to different prop (e.g., parachute -> deployed)
            new_pk = ar.get('to')
            new_obj = P.get(new_pk)
            if new_obj:
                key_vis(obj, f, False)
                key_loc(new_obj, f, obj.location.copy())
                key_vis(new_obj, f - 1, False)
                key_vis(new_obj, f, True)
    
    # --- FX ---
    for x in s.get('fx', []):
        t, f = x['type'], x['f']
        at = W(sid, x['at'])
        if t == 'rain':
            look.fx_rain(at, f, x.get('args', {}).get('intensity', 0.5))
        elif t == 'fog':
            look.fx_fog(at, f, x.get('args', {}).get('density', 0.05))
        elif t == 'wind':
            look.fx_wind(at, f, x.get('args', {}).get('speed', 10))
        elif t == 'propeller':
            look.fx_propeller(at, f, x.get('args', {}).get('rpm', 2400))
        elif t == 'parachute':
            look.fx_parachute(at, f, x.get('args', {}).get('deploy', True))


# ===============================================================
# CAMERA ANIMATION
# ===============================================================
print("Animating camera...")

def lookat_euler(pos, tgt, roll_deg):
    q = (tgt - pos).to_track_quat('-Z', 'Y') @ Quaternion((0, 0, 1), math.radians(roll_deg))
    return q.to_euler()

prev_eul = None
for s in SHOTS:
    for i, k in enumerate(s['camera']):
        f = k['f']
        sid = s['set']
        pos = W(sid, k['pos'])
        tgt = W(sid, k['target'])
        eul = lookat_euler(pos, tgt, k.get('roll_deg', 0))
        
        if prev_eul:
            eul.make_compatible(prev_eul)
        
        sc.frame_set(f)
        cam.location = pos
        cam.rotation_euler = eul
        cam.data.lens = k.get('lens', 35)
        cam.data.dof.focus_distance = (tgt - pos).length
        cam.data.dof.aperture_fstop = k.get('fstop', 2.8)
        
        cam.keyframe_insert('location', frame=f)
        cam.keyframe_insert('rotation_euler', frame=f)
        cam.data.keyframe_insert('lens', frame=f)
        cam.data.dof.keyframe_insert('focus_distance', frame=f)
        cam.data.dof.keyframe_insert('aperture_fstop', frame=f)
        
        prev_eul = eul

# Smooth camera interpolation
if cam.animation_data and cam.animation_data.action:
    action = cam.animation_data.action
    if hasattr(action, 'fcurves'):
        for fc in action.fcurves:
            for kp in fc.keyframe_points:
                kp.interpolation = 'BEZIER'
                kp.easing = 'EASE_IN_OUT'
if cam.data.animation_data and cam.data.animation_data.action:
    action = cam.data.animation_data.action
    if hasattr(action, 'fcurves'):
        for fc in action.fcurves:
            for kp in fc.keyframe_points:
                kp.interpolation = 'BEZIER'
                kp.easing = 'EASE_IN_OUT'


# ===============================================================
# TEXT OVERLAYS (as 3D text objects for compositing)
# ===============================================================
print("Creating text overlays...")

FONT_PATH = "C:/Windows/Fonts/arialbd.ttf"  # Bold for cinematic look

def create_text_overlay(text, frame_start, frame_end, location, scale=0.1, color=(1, 0.85, 0.5, 1), anchor='center'):
    """Create a 3D text object for overlay."""
    bpy.ops.object.text_add(location=location)
    txt = bpy.context.object
    txt.data.body = text
    txt.data.size = scale
    # align_x expects uppercase: LEFT, CENTER, RIGHT, JUSTIFY, FLUSH
    txt.data.align_x = anchor.upper()
    txt.data.align_y = 'CENTER'
    try:
        txt.data.font = bpy.data.fonts.load(FONT_PATH)
    except:
        pass
    
    # Material
    mat = bpy.data.materials.new(f'TextMat_{text[:10]}')
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    em = nt.nodes.new('ShaderNodeEmission')
    em.inputs['Color'].default_value = color
    em.inputs['Strength'].default_value = 1.5
    out = nt.nodes.new('ShaderNodeOutputMaterial')
    nt.links.new(em.outputs[0], out.inputs[0])
    txt.data.materials.append(mat)
    
    # Visibility keyframes
    txt.hide_render = True
    txt.keyframe_insert('hide_render', frame=frame_start - 1)
    txt.hide_render = False
    txt.keyframe_insert('hide_render', frame=frame_start)
    txt.keyframe_insert('hide_render', frame=frame_end)
    txt.hide_render = True
    txt.keyframe_insert('hide_render', frame=frame_end + 1)
    
    # Fade animation (scale)
    txt.scale = (0.01, 0.01, 0.01)
    txt.keyframe_insert('scale', frame=frame_start)
    txt.scale = (1, 1, 1)
    txt.keyframe_insert('scale', frame=frame_start + 15)
    txt.scale = (1, 1, 1)
    txt.keyframe_insert('scale', frame=frame_end - 15)
    txt.scale = (0.01, 0.01, 0.01)
    txt.keyframe_insert('scale', frame=frame_end)
    
    return txt

# Process text overlays from shots
for s in SHOTS:
    if 'text_overlay' in s:
        to = s['text_overlay']
        if isinstance(to, list):
            for t in to:
                create_text_overlay(
                    t['text'], t['f_in'], t['f_out'],
                    location=(0, -5, 1.5),  # In front of camera
                    scale=0.08 if t.get('size') != 'large' else 0.15,
                    color=(1, 0.85, 0.5, 1) if t.get('color') == 'amber' else (0.95, 0.95, 1.0, 1)
                )
        else:
            create_text_overlay(
                to['text'], to['f_in'], to['f_out'],
                location=(0, -5, 1.5),
                scale=0.08,
                color=(1, 0.85, 0.5, 1) if to.get('color') == 'amber' else (0.95, 0.95, 1.0, 1)
            )


# ===============================================================
# RENDER SETTINGS
# ===============================================================
sc.render.filepath = OUT
sc.render.image_settings.file_format = 'PNG'
sc.render.image_settings.color_mode = 'RGBA'
sc.render.image_settings.color_depth = '16'
sc.render.use_motion_blur = False


# ===============================================================
# EXECUTION MODES
# ===============================================================
os.makedirs(OUT, exist_ok=True)

def render_frame(frame, path):
    sc.frame_set(frame)
    sc.render.filepath = path
    bpy.ops.render.render(write_still=True)

if MODE == 'gate':
    ids = args[2:] if len(args) > 2 else None
    for s in SHOTS:
        if ids and s['id'] not in ids:
            continue
        fm = (s['f_in'] + s['f_out']) // 2
        render_frame(fm, os.path.join(OUT, s['id'] + '.png'))
        print(f"GATE: {s['id']} frame {fm}")

elif MODE == 'frames':
    a, b = int(args[2]), int(args[3])
    if len(args) > 4:
        sc.eevee.taa_render_samples = int(args[4])
    for f in range(a, b):
        render_frame(f, os.path.join(OUT, f'f{f:04d}.png'))
        if f % 30 == 0:
            print(f"  Rendered frame {f}/{b}")

elif MODE == 'save':
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT, 'scene.blend'))
    print(f"Saved scene to {OUT}/scene.blend")

print("Done.")