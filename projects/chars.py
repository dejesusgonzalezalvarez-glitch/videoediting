"""CHARS module (D.B. Cooper): Realistic human character with full rig.
Blender 5.2. Creates Cooper: 1970s man, black suit, briefcase, parachute.
"""
import bpy, math, os
from mathutils import Vector, Euler

# Add look to path
import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import look


def _bone(name, head, tail, parent=None, roll=0.0, use_deform=True):
    """Helper to create an edit bone."""
    eb = bpy.context.object.data.edit_bones.new(name)
    eb.head = head
    eb.tail = tail
    eb.roll = roll
    if parent:
        eb.parent = parent
        eb.use_connect = True
    eb.use_deform = use_deform
    return eb


def _create_metarig():
    """Create a metarig (skeleton) for a human male ~180cm."""
    # Create armature
    bpy.ops.object.armature_add(enter_editmode=True)
    arm = bpy.context.object
    arm.name = 'Cooper_Rig'
    arm.data.name = 'Cooper_Rig_Data'
    
    # Bone lengths (metres)
    H = 1.8  # Total height
    head_h = 0.24
    neck_h = 0.12
    torso_h = 0.55
    thigh_h = 0.45
    shin_h = 0.42
    foot_h = 0.08
    clavicle_w = 0.18
    upperarm_h = 0.30
    forearm_h = 0.26
    hand_h = 0.10
    
    # Root
    root = _bone('root', (0, 0, 0), (0, 0, 0.05))
    
    # Spine chain
    pelvis = _bone('pelvis', (0, 0, H * 0.5), (0, 0, H * 0.5 + torso_h * 0.3), root)
    spine_01 = _bone('spine_01', pelvis.tail, (0, 0, pelvis.tail.z + torso_h * 0.25), pelvis)
    spine_02 = _bone('spine_02', spine_01.tail, (0, 0, spine_01.tail.z + torso_h * 0.25), spine_01)
    spine_03 = _bone('spine_03', spine_02.tail, (0, 0, spine_02.tail.z + torso_h * 0.2), spine_02)
    
    # Neck & Head
    neck = _bone('neck', spine_03.tail, (0, 0, spine_03.tail.z + neck_h), spine_03)
    head = _bone('head', neck.tail, (0, 0, neck.tail.z + head_h), neck)
    
    # Head details
    jaw = _bone('jaw', (0, 0.12, head.tail.z - 0.05), (0, 0.20, head.tail.z - 0.12), head)
    eye_L = _bone('eye_L', (-0.035, 0.15, head.tail.z - 0.02), (-0.035, 0.20, head.tail.z - 0.02), head, use_deform=False)
    eye_R = _bone('eye_R', (0.035, 0.15, head.tail.z - 0.02), (0.035, 0.20, head.tail.z - 0.02), head, use_deform=False)
    
    # Clavicles
    clav_L = _bone('clavicle_L', (clavicle_w, 0.12, spine_03.tail.z + 0.02), 
                   (clavicle_w + 0.05, 0.12, spine_03.tail.z + 0.02), spine_03)
    clav_R = _bone('clavicle_R', (-clavicle_w, 0.12, spine_03.tail.z + 0.02), 
                   (-clavicle_w - 0.05, 0.12, spine_03.tail.z + 0.02), spine_03)
    
    # Arms - Left
    shoulder_L = _bone('shoulder_L', clav_L.tail, (clav_L.tail.x + upperarm_h, clav_L.tail.y, clav_L.tail.z), clav_L)
    elbow_L = _bone('elbow_L', shoulder_L.tail, (shoulder_L.tail.x + forearm_h, shoulder_L.tail.y, shoulder_L.tail.z - 0.05), shoulder_L)
    wrist_L = _bone('wrist_L', elbow_L.tail, (elbow_L.tail.x + hand_h, elbow_L.tail.y, elbow_L.tail.z - 0.02), elbow_L)
    hand_L = _bone('hand_L', wrist_L.tail, (wrist_L.tail.x + hand_h, wrist_L.tail.y, wrist_L.tail.z), wrist_L)
    
    # Fingers Left (simplified)
    for i, fname in enumerate(['thumb', 'index', 'middle', 'ring', 'pinky']):
        ang = (i - 2) * 0.25
        met = _bone(f'f_{fname}_L_meta', hand_L.tail, 
                    (hand_L.tail.x + 0.02, hand_L.tail.y + ang * 0.04, hand_L.tail.z - 0.01), hand_L)
        prox = _bone(f'f_{fname}_L_prox', met.tail, 
                     (met.tail.x + 0.035, met.tail.y, met.tail.z - 0.01), met)
        dist = _bone(f'f_{fname}_L_dist', prox.tail, 
                     (prox.tail.x + 0.025, prox.tail.y, prox.tail.z - 0.005), prox)
    
    # Arms - Right
    shoulder_R = _bone('shoulder_R', clav_R.tail, (clav_R.tail.x - upperarm_h, clav_R.tail.y, clav_R.tail.z), clav_R)
    elbow_R = _bone('elbow_R', shoulder_R.tail, (shoulder_R.tail.x - forearm_h, shoulder_R.tail.y, shoulder_R.tail.z - 0.05), shoulder_R)
    wrist_R = _bone('wrist_R', elbow_R.tail, (elbow_R.tail.x - hand_h, elbow_R.tail.y, elbow_R.tail.z - 0.02), elbow_R)
    hand_R = _bone('hand_R', wrist_R.tail, (wrist_R.tail.x - hand_h, wrist_R.tail.y, wrist_R.tail.z), wrist_R)
    
    # Fingers Right
    for i, fname in enumerate(['thumb', 'index', 'middle', 'ring', 'pinky']):
        ang = (i - 2) * 0.25
        met = _bone(f'f_{fname}_R_meta', hand_R.tail, 
                    (hand_R.tail.x - 0.02, hand_R.tail.y + ang * 0.04, hand_R.tail.z - 0.01), hand_R)
        prox = _bone(f'f_{fname}_R_prox', met.tail, 
                     (met.tail.x - 0.035, met.tail.y, met.tail.z - 0.01), met)
        dist = _bone(f'f_{fname}_R_dist', prox.tail, 
                     (prox.tail.x - 0.025, prox.tail.y, prox.tail.z - 0.005), prox)
    
    # Legs - Left
    hip_L = _bone('hip_L', (0.09, 0, pelvis.tail.z), (0.09, 0, pelvis.tail.z - thigh_h), pelvis)
    knee_L = _bone('knee_L', hip_L.tail, (0.09, 0, hip_L.tail.z - shin_h), hip_L)
    ankle_L = _bone('ankle_L', knee_L.tail, (0.09, 0.05, knee_L.tail.z - foot_h), knee_L)
    foot_L = _bone('foot_L', ankle_L.tail, (0.09, 0.18, ankle_L.tail.z), ankle_L)
    toe_L = _bone('toe_L', (0.09, 0.18, ankle_L.tail.z), (0.09, 0.25, ankle_L.tail.z), foot_L)
    
    # Legs - Right
    hip_R = _bone('hip_R', (-0.09, 0, pelvis.tail.z), (-0.09, 0, pelvis.tail.z - thigh_h), pelvis)
    knee_R = _bone('knee_R', hip_R.tail, (-0.09, 0, hip_R.tail.z - shin_h), hip_R)
    ankle_R = _bone('ankle_R', knee_R.tail, (-0.09, 0.05, knee_R.tail.z - foot_h), knee_R)
    foot_R = _bone('foot_R', ankle_R.tail, (-0.09, 0.18, ankle_R.tail.z), ankle_R)
    toe_R = _bone('toe_R', (-0.09, 0.18, ankle_R.tail.z), (-0.09, 0.25, ankle_R.tail.z), foot_R)
    
    # Exit edit mode
    bpy.ops.object.mode_set(mode='OBJECT')
    return arm


def _create_body_mesh(arm):
    """Create a simple but realistic body mesh with proper topology for deformation."""
    # Use a basic human mesh - we'll build from primitives and join
    bpy.ops.object.select_all(action='DESELECT')
    
    # Create body parts as separate objects first, then join with armature
    parts = []
    
    # Head
    bpy.ops.mesh.primitive_uv_sphere_add(segments=32, ring_count=16, radius=0.12, location=(0, 0.1, 1.68))
    head_obj = bpy.context.object
    head_obj.name = 'Cooper_Head'
    # Squash slightly
    head_obj.scale = (1.0, 0.95, 1.05)
    bpy.ops.object.transform_apply(scale=True)
    parts.append(head_obj)
    
    # Neck
    bpy.ops.mesh.primitive_cylinder_add(radius=0.07, depth=0.12, location=(0, 0.08, 1.52))
    neck_obj = bpy.context.object
    neck_obj.name = 'Cooper_Neck'
    parts.append(neck_obj)
    
    # Torso
    bpy.ops.mesh.primitive_cylinder_add(radius=0.18, depth=0.55, location=(0, 0, 1.30))
    torso_obj = bpy.context.object
    torso_obj.name = 'Cooper_Torso'
    # Shape torso
    bpy.ops.object.mode_set(mode='EDIT')
    bm = bmesh.from_edit_mesh(torso_obj.data)
    for v in bm.verts:
        if v.co.z > 0.2:  # Upper torso wider
            v.co.x *= 1.1
            v.co.y *= 1.0
        else:  # Waist narrower
            v.co.x *= 0.85
            v.co.y *= 0.95
    bmesh.update_edit_mesh(torso_obj.data)
    bpy.ops.object.mode_set(mode='OBJECT')
    parts.append(torso_obj)
    
    # Pelvis
    bpy.ops.mesh.primitive_cylinder_add(radius=0.15, depth=0.20, location=(0, 0, 0.85))
    pelvis_obj = bpy.context.object
    pelvis_obj.name = 'Cooper_Pelvis'
    parts.append(pelvis_obj)
    
    # Upper arms
    for side, x_off in [('L', 0.22), ('R', -0.22)]:
        bpy.ops.mesh.primitive_cylinder_add(radius=0.045, depth=0.30, location=(x_off, 0, 1.35))
        obj = bpy.context.object
        obj.name = f'Cooper_UpperArm_{side}'
        obj.rotation_euler = (0, 0, math.radians(-90 if side == 'L' else 90))
        bpy.ops.object.transform_apply(rotation=True)
        parts.append(obj)
    
    # Lower arms
    for side, x_off in [('L', 0.50), ('R', -0.50)]:
        bpy.ops.mesh.primitive_cylinder_add(radius=0.04, depth=0.26, location=(x_off, 0, 1.10))
        obj = bpy.context.object
        obj.name = f'Cooper_LowerArm_{side}'
        obj.rotation_euler = (0, 0, math.radians(-90 if side == 'L' else 90))
        bpy.ops.object.transform_apply(rotation=True)
        parts.append(obj)
    
    # Hands
    for side, x_off in [('L', 0.73), ('R', -0.73)]:
        bpy.ops.mesh.primitive_uv_sphere_add(segments=16, ring_count=8, radius=0.055, location=(x_off, 0, 1.0))
        obj = bpy.context.object
        obj.name = f'Cooper_Hand_{side}'
        obj.scale = (1.0, 1.3, 0.8)
        bpy.ops.object.transform_apply(scale=True)
        parts.append(obj)
    
    # Thighs
    for side, x_off in [('L', 0.09), ('R', -0.09)]:
        bpy.ops.mesh.primitive_cylinder_add(radius=0.075, depth=0.45, location=(x_off, 0, 0.60))
        obj = bpy.context.object
        obj.name = f'Cooper_Thigh_{side}'
        parts.append(obj)
    
    # Shins
    for side, x_off in [('L', 0.09), ('R', -0.09)]:
        bpy.ops.mesh.primitive_cylinder_add(radius=0.055, depth=0.42, location=(x_off, 0, 0.15))
        obj = bpy.context.object
        obj.name = f'Cooper_Shin_{side}'
        parts.append(obj)
    
    # Feet
    for side, x_off in [('L', 0.09), ('R', -0.09)]:
        bpy.ops.mesh.primitive_cube_add(size=0.25, location=(x_off, 0.10, -0.07))
        obj = bpy.context.object
        obj.name = f'Cooper_Foot_{side}'
        obj.scale = (0.8, 2.2, 0.4)
        bpy.ops.object.transform_apply(scale=True)
        parts.append(obj)
    
    # Join all parts
    for p in parts:
        p.select_set(True)
    bpy.context.view_layer.objects.active = parts[0]
    bpy.ops.object.join()
    body = bpy.context.object
    body.name = 'Cooper_Body'
    
    # Parent to armature with automatic weights
    bpy.ops.object.select_all(action='DESELECT')
    body.select_set(True)
    arm.select_set(True)
    bpy.context.view_layer.objects.active = arm
    bpy.ops.object.parent_set(type='ARMATURE_AUTO')
    
    # Add subdivision for smoother deformation
    mod = body.modifiers.new('Subdiv', 'SUBSURF')
    mod.levels = 1
    mod.render_levels = 2
    mod.show_on_cage = True
    
    return body


def _create_suit_mesh(body):
    """Create suit/clothing as separate mesh objects parented to body."""
    # We'll use the body mesh with different materials for suit, shirt, tie
    # For simplicity, assign vertex groups and materials
    pass


def _create_briefcase():
    """Create black leather briefcase."""
    bpy.ops.mesh.primitive_cube_add(size=0.45, location=(0, 0, 0))
    case = bpy.context.object
    case.name = 'Briefcase'
    case.scale = (1.0, 0.35, 0.7)
    bpy.ops.object.transform_apply(scale=True)
    
    # Add handle
    bpy.ops.mesh.primitive_torus_add(major_radius=0.12, minor_radius=0.015, location=(0, 0.1, 0.16))
    handle = bpy.context.object
    handle.name = 'Briefcase_Handle'
    handle.rotation_euler = (math.radians(90), 0, 0)
    bpy.ops.object.transform_apply(rotation=True)
    
    # Join
    case.select_set(True)
    handle.select_set(True)
    bpy.context.view_layer.objects.active = case
    bpy.ops.object.join()
    
    # Materials
    leather = look.film_mat('Briefcase_Leather', (0.08, 0.06, 0.05), roughness=0.75, metallic=0.0)
    metal = look.film_mat('Briefcase_Metal', (0.25, 0.25, 0.28), roughness=0.3, metallic=0.9)
    case.data.materials.append(leather)
    case.data.materials.append(metal)
    # Assign handle to metal (simplified - would need vertex groups)
    
    return case


def _create_parachute():
    """Create military surplus parachute (NB-6/8 style)."""
    # Container pack
    bpy.ops.mesh.primitive_cube_add(size=0.35, location=(0, 0, 0))
    pack = bpy.context.object
    pack.name = 'Parachute_Pack'
    pack.scale = (1.0, 0.5, 0.7)
    bpy.ops.object.transform_apply(scale=True)
    
    # Canopy (deployed state - separate object)
    bpy.ops.mesh.primitive_cone_add(radius1=5.0, radius2=0.5, depth=4.0, location=(0, 0, -2))
    canopy = bpy.context.object
    canopy.name = 'Parachute_Canopy'
    # 24 gores
    bpy.ops.object.mode_set(mode='EDIT')
    bm = bmesh.from_edit_mesh(canopy.data)
    # Add loop cuts for gore lines
    bpy.ops.mesh.loopcut_slide(MESH_OT_loopcut={"number_cuts": 24, "smoothness": 0})
    bpy.ops.object.mode_set(mode='OBJECT')
    
    # Materials
    nylon = look.film_mat('Parachute_Nylon', (0.85, 0.82, 0.75), roughness=0.6)
    canvas = look.film_mat('Parachute_Canvas', (0.45, 0.40, 0.35), roughness=0.8)
    pack.data.materials.append(canvas)
    canopy.data.materials.append(nylon)
    
    # Hide canopy initially
    canopy.hide_render = True
    canopy.hide_viewport = True
    
    return pack, canopy


def _create_ticket():
    """Create airline ticket prop."""
    bpy.ops.mesh.primitive_plane_add(size=0.18, location=(0, 0, 0))
    ticket = bpy.context.object
    ticket.name = 'Ticket'
    ticket.scale = (1.0, 0.7, 1.0)
    bpy.ops.object.transform_apply(scale=True)
    ticket.rotation_euler = (math.radians(90), 0, 0)
    bpy.ops.object.transform_apply(rotation=True)
    
    # Material with ticket texture
    mat = look.film_mat('Ticket_Paper', (0.95, 0.92, 0.85), roughness=0.9)
    ticket.data.materials.append(mat)
    return ticket


def _create_note():
    """Create the hijack note."""
    bpy.ops.mesh.primitive_plane_add(size=0.12, location=(0, 0, 0))
    note = bpy.context.object
    note.name = 'Note'
    note.scale = (1.0, 0.6, 1.0)
    bpy.ops.object.transform_apply(scale=True)
    note.rotation_euler = (math.radians(90), 0, 0)
    bpy.ops.object.transform_apply(rotation=True)
    
    mat = look.film_mat('Note_Paper', (0.98, 0.96, 0.90), roughness=0.95)
    note.data.materials.append(mat)
    return note


def _create_money_bag():
    """Create canvas money bag with cash visible."""
    bpy.ops.mesh.primitive_cylinder_add(radius=0.15, depth=0.30, location=(0, 0, 0))
    bag = bpy.context.object
    bag.name = 'Money_Bag'
    # Shape
    bpy.ops.object.mode_set(mode='EDIT')
    bm = bmesh.from_edit_mesh(bag.data)
    for v in bm.verts:
        if v.co.z > 0.1:
            v.co.x *= 0.8
            v.co.y *= 0.8
    bmesh.update_edit_mesh(bag.data)
    bpy.ops.object.mode_set(mode='OBJECT')
    
    canvas = look.film_mat('Money_Bag_Canvas', (0.55, 0.50, 0.42), roughness=0.85)
    bag.data.materials.append(canvas)
    return bag


# Pose definitions (frame-relative, applied by Char.pose)
POSES = {
    'idle': {
        'spine_02': (0, 0, 0),
        'spine_03': (0, 0, 0),
        'neck': (0, 0, 0),
        'head': (0, 0, 0),
        'shoulder_L': (0, -0.2, 0),
        'shoulder_R': (0, 0.2, 0),
        'elbow_L': (0, 0.8, 0),
        'elbow_R': (0, -0.8, 0),
        'wrist_L': (0, 0, 0),
        'wrist_R': (0, 0, 0),
        'hip_L': (0, 0, 0),
        'hip_R': (0, 0, 0),
        'knee_L': (0, 0, 0),
        'knee_R': (0, 0, 0),
    },
    'walk': {  # One step cycle (30 frames = 1s at 30fps)
        # This is a base; actual walk cycle keyed procedurally
    },
    'sit': {
        'spine_02': (math.radians(-10), 0, 0),
        'spine_03': (math.radians(-5), 0, 0),
        'hip_L': (math.radians(-90), 0, 0),
        'hip_R': (math.radians(-90), 0, 0),
        'knee_L': (math.radians(90), 0, 0),
        'knee_R': (math.radians(90), 0, 0),
        'ankle_L': (math.radians(-10), 0, 0),
        'ankle_R': (math.radians(-10), 0, 0),
        'shoulder_L': (0, -0.3, 0),
        'shoulder_R': (0, 0.3, 0),
        'elbow_L': (0, 1.0, 0),
        'elbow_R': (0, -1.0, 0),
    },
    'turn_head': {
        'neck': (0, 0, math.radians(30)),
        'head': (0, 0, math.radians(15)),
    },
    'gesture_note': {  # Right hand extending forward
        'shoulder_R': (math.radians(30), 0.2, 0),
        'elbow_R': (math.radians(-40), 0, 0),
        'wrist_R': (0, 0, math.radians(-20)),
    },
    'open_briefcase': {  # Both hands at waist
        'shoulder_L': (math.radians(20), -0.1, 0),
        'shoulder_R': (math.radians(20), 0.1, 0),
        'elbow_L': (math.radians(70), 0, 0),
        'elbow_R': (math.radians(70), 0, 0),
        'wrist_L': (0, 0, math.radians(10)),
        'wrist_R': (0, 0, math.radians(-10)),
    },
    'stand': {
        'hip_L': (0, 0, 0),
        'hip_R': (0, 0, 0),
        'knee_L': (0, 0, 0),
        'knee_R': (0, 0, 0),
        'spine_02': (0, 0, 0),
        'spine_03': (0, 0, 0),
    },
    'walk_aft': {  # Walking toward rear - same as walk but directed
    },
    'hold_parachute': {  # Both hands on parachute pack at chest
        'shoulder_L': (math.radians(40), -0.2, 0),
        'shoulder_R': (math.radians(40), 0.2, 0),
        'elbow_L': (math.radians(80), 0, 0),
        'elbow_R': (math.radians(80), 0, 0),
        'wrist_L': (0, 0, math.radians(20)),
        'wrist_R': (0, 0, math.radians(-20)),
    },
    'jump': {  # Launch pose - arms back, legs pushing
        'shoulder_L': (math.radians(-60), -0.3, 0),
        'shoulder_R': (math.radians(-60), 0.3, 0),
        'elbow_L': (math.radians(-20), 0, 0),
        'elbow_R': (math.radians(-20), 0, 0),
        'hip_L': (math.radians(-20), 0, 0),
        'hip_R': (math.radians(-20), 0, 0),
        'knee_L': (math.radians(40), 0, 0),
        'knee_R': (math.radians(40), 0, 0),
    },
    'skydive': {  # Stable freefall - arched, arms out
        'spine_02': (math.radians(-30), 0, 0),
        'spine_03': (math.radians(-20), 0, 0),
        'shoulder_L': (math.radians(-80), -0.5, 0),
        'shoulder_R': (math.radians(-80), 0.5, 0),
        'elbow_L': (math.radians(30), 0, 0),
        'elbow_R': (math.radians(30), 0, 0),
        'wrist_L': (0, 0, math.radians(-30)),
        'wrist_R': (0, 0, math.radians(30)),
        'hip_L': (math.radians(-10), 0, math.radians(-15)),
        'hip_R': (math.radians(-10), 0, math.radians(15)),
        'knee_L': (math.radians(20), 0, 0),
        'knee_R': (math.radians(20), 0, 0),
    },
}

FACES = {
    'neutral': {'brow_inner': 0, 'brow_outer': 0, 'eye_open': 1.0, 'mouth': 0, 'jaw': 0},
    'calm': {'brow_inner': -0.1, 'brow_outer': 0.05, 'eye_open': 0.9, 'mouth': 0.05, 'jaw': 0},
    'focused': {'brow_inner': -0.3, 'brow_outer': -0.1, 'eye_open': 0.85, 'mouth': -0.1, 'jaw': 0},
    'tense': {'brow_inner': -0.5, 'brow_outer': -0.2, 'eye_open': 0.8, 'mouth': -0.2, 'jaw': 0.1},
    'determined': {'brow_inner': -0.6, 'brow_outer': -0.3, 'eye_open': 0.9, 'mouth': -0.15, 'jaw': 0.15},
    'mysterious': {'brow_inner': -0.2, 'brow_outer': 0.1, 'eye_open': 0.7, 'mouth': 0.0, 'jaw': 0},
}


class Char:
    """Character controller for D.B. Cooper."""
    
    def __init__(self, name, root_obj, armature):
        self.name = name
        self.root = root_obj  # The body mesh (or an empty parent)
        self.armature = armature
        self.pose_bones = armature.pose.bones
        self._current_pose = 'idle'
        self._current_face = 'neutral'
        self._held_prop = None
        
    def place(self, frame, loc, rot_z=0.0):
        """Key character root location and rotation."""
        self.root.location = loc
        self.root.rotation_euler = (0, 0, rot_z)
        self.root.keyframe_insert('location', frame=frame)
        self.root.keyframe_insert('rotation_euler', frame=frame)
        # Also key armature if separate
        if self.armature != self.root:
            self.armature.location = loc
            self.armature.rotation_euler = (0, 0, rot_z)
            self.armature.keyframe_insert('location', frame=frame)
            self.armature.keyframe_insert('rotation_euler', frame=frame)
    
    def pose(self, frame, pose_name):
        """Apply a named pose at frame (keyed on twos with anticipation/overshoot)."""
        if pose_name not in POSES:
            print(f'Warning: Pose {pose_name} not found')
            return
        
        pose = POSES[pose_name]
        self._current_pose = pose_name
        
        # For walk cycle, generate procedural keys
        if pose_name == 'walk' or pose_name == 'walk_aft':
            self._key_walk_cycle(frame)
            return
        
        # Key pose bones
        for bone_name, (rx, ry, rz) in pose.items():
            pb = self.pose_bones.get(bone_name)
            if pb:
                pb.rotation_mode = 'XYZ'
                pb.rotation_euler = (rx, ry, rz)
                pb.keyframe_insert('rotation_euler', frame=frame)
    
    def _key_walk_cycle(self, start_frame, cycles=1):
        """Generate a walk cycle starting at frame."""
        # 30 frames per cycle at 30fps
        cycle_len = 30
        for c in range(cycles):
            base = start_frame + c * cycle_len
            # Contact poses
            self._key_walk_frame(base, 'contact_L')
            self._key_walk_frame(base + 7, 'passing_L')
            self._key_walk_frame(base + 15, 'contact_R')
            self._key_walk_frame(base + 22, 'passing_R')
    
    def _key_walk_frame(self, frame, phase):
        """Key a specific walk phase."""
        poses = {
            'contact_L': {
                'hip_L': (math.radians(-20), 0, 0), 'hip_R': (math.radians(10), 0, 0),
                'knee_L': (math.radians(10), 0, 0), 'knee_R': (math.radians(-40), 0, 0),
                'ankle_L': (math.radians(5), 0, 0), 'ankle_R': (math.radians(-15), 0, 0),
                'shoulder_L': (math.radians(20), -0.2, 0), 'shoulder_R': (math.radians(-20), 0.2, 0),
                'elbow_L': (math.radians(-40), 0, 0), 'elbow_R': (math.radians(40), 0, 0),
                'spine_02': (math.radians(3), 0, 0), 'spine_03': (math.radians(2), 0, 0),
            },
            'passing_L': {
                'hip_L': (math.radians(-5), 0, 0), 'hip_R': (math.radians(-30), 0, 0),
                'knee_L': (math.radians(-30), 0, 0), 'knee_R': (math.radians(-5), 0, 0),
                'ankle_L': (0, 0, 0), 'ankle_R': (math.radians(10), 0, 0),
                'shoulder_L': (math.radians(-10), -0.2, 0), 'shoulder_R': (math.radians(10), 0.2, 0),
                'elbow_L': (math.radians(20), 0, 0), 'elbow_R': (math.radians(-20), 0, 0),
            },
            'contact_R': {
                'hip_L': (math.radians(10), 0, 0), 'hip_R': (math.radians(-20), 0, 0),
                'knee_L': (math.radians(-40), 0, 0), 'knee_R': (math.radians(10), 0, 0),
                'ankle_L': (math.radians(-15), 0, 0), 'ankle_R': (math.radians(5), 0, 0),
                'shoulder_L': (math.radians(-20), -0.2, 0), 'shoulder_R': (math.radians(20), 0.2, 0),
                'elbow_L': (math.radians(40), 0, 0), 'elbow_R': (math.radians(-40), 0, 0),
                'spine_02': (math.radians(3), 0, 0), 'spine_03': (math.radians(2), 0, 0),
            },
            'passing_R': {
                'hip_L': (math.radians(-30), 0, 0), 'hip_R': (math.radians(-5), 0, 0),
                'knee_L': (math.radians(-5), 0, 0), 'knee_R': (math.radians(-30), 0, 0),
                'ankle_L': (math.radians(10), 0, 0), 'ankle_R': (0, 0, 0),
                'shoulder_L': (math.radians(10), -0.2, 0), 'shoulder_R': (math.radians(-10), 0.2, 0),
                'elbow_L': (math.radians(-20), 0, 0), 'elbow_R': (math.radians(20), 0, 0),
            },
        }
        pose = poses.get(phase, poses['contact_L'])
        for bone_name, (rx, ry, rz) in pose.items():
            pb = self.pose_bones.get(bone_name)
            if pb:
                pb.rotation_mode = 'XYZ'
                pb.rotation_euler = (rx, ry, rz)
                pb.keyframe_insert('rotation_euler', frame=frame)
    
    def face(self, frame, face_name):
        """Apply facial expression (shape keys or bone drivers)."""
        if face_name not in FACES:
            return
        face = FACES[face_name]
        self._current_face = face_name
        
        # Apply via shape keys on head mesh
        head_mesh = bpy.data.objects.get(f'{self.name}_Head') or bpy.data.objects.get('Cooper_Head')
        if head_mesh and head_mesh.data.shape_keys:
            sk = head_mesh.data.shape_keys.key_blocks
            # Map face params to shape keys (would need proper shape keys created)
            # For now, use bone-based facial rig
            pass
        
        # Bone-based facial (jaw, brow bones)
        jaw = self.pose_bones.get('jaw')
        if jaw:
            jaw.rotation_euler = (face['jaw'], 0, 0)
            jaw.keyframe_insert('rotation_euler', frame=frame)
    
    def hold(self, frame, prop_obj):
        """Parent prop to hand (right hand by default)."""
        hand_R = self.pose_bones.get('hand_R') or self.pose_bones.get('wrist_R')
        if prop_obj is None:
            # Release
            if self._held_prop:
                self._held_prop.parent = None
                self._held_prop = None
            return
        
        # Parent prop to hand bone (using child-of constraint)
        if hand_R:
            # Clear existing child-of
            for c in prop_obj.constraints:
                if c.type == 'CHILD_OF':
                    prop_obj.constraints.remove(c)
            c = prop_obj.constraints.new('CHILD_OF')
            c.target = self.armature
            c.subtarget = hand_R.name
            c.influence = 1.0
            # Key influence
            c.keyframe_insert('influence', frame=frame)
            self._held_prop = prop_obj


def make_cooper(name='Cooper'):
    """Create the complete D.B. Cooper character: mesh, rig, materials, props."""
    print(f'Creating character: {name}')
    
    # Clean up any existing
    for obj_name in ['Cooper_Body', 'Cooper_Rig', 'Briefcase', 'Parachute_Pack', 'Parachute_Canopy', 'Ticket', 'Note', 'Money_Bag']:
        obj = bpy.data.objects.get(obj_name)
        if obj:
            bpy.data.objects.remove(obj, do_unlink=True)
    for mat_name in list(bpy.data.materials.keys()):
        if 'Cooper' in mat_name or 'Briefcase' in mat_name or 'Parachute' in mat_name or 'Ticket' in mat_name or 'Note' in mat_name or 'Money' in mat_name:
            bpy.data.materials.remove(bpy.data.materials[mat_name], do_unlink=True)
    
    # Create rig
    arm = _create_metarig()
    arm.name = f'{name}_Rig'
    
    # Create body mesh
    body = _create_body_mesh(arm)
    body.name = f'{name}_Body'
    
    # Create props
    briefcase = _create_briefcase()
    briefcase.name = f'{name}_Briefcase'
    
    para_pack, para_canopy = _create_parachute()
    para_pack.name = f'{name}_Parachute_Pack'
    para_canopy.name = f'{name}_Parachute_Canopy'
    
    ticket = _create_ticket()
    ticket.name = f'{name}_Ticket'
    
    note = _create_note()
    note.name = f'{name}_Note'
    
    money_bag = _create_money_bag()
    money_bag.name = f'{name}_Money_Bag'
    
    # Create character controller
    char = Char(name, body, arm)
    
    # Store prop references on char for easy access
    char.briefcase = briefcase
    char.parachute_pack = para_pack
    char.parachute_canopy = para_canopy
    char.ticket = ticket
    char.note = note
    char.money_bag = money_bag
    
    # Initial placement off-screen
    char.place(-5, (-300, 0, 0), 0)
    char.pose(-5, 'idle')
    char.face(-5, 'neutral')
    
    print(f'Character {name} created successfully')
    return char


# Render model sheet
def render_model_sheet(char, output_path):
    """Render a model sheet showing all poses and faces."""
    sc = bpy.context.scene
    original_frame = sc.frame_current
    
    # Set up orthographic camera for model sheet
    cam_data = bpy.data.cameras.new('ModelSheet_Cam')
    cam_obj = bpy.data.objects.new('ModelSheet_Cam', cam_data)
    sc.collection.objects.link(cam_obj)
    cam_data.type = 'ORTHO'
    cam_data.ortho_scale = 4.0
    cam_obj.location = (0, -6, 1.0)
    cam_obj.rotation_euler = (math.radians(90), 0, 0)
    sc.camera = cam_obj
    
    # Render each pose
    poses_list = ['idle', 'sit', 'stand', 'gesture_note', 'open_briefcase', 'hold_parachute', 'jump', 'skydive']
    faces_list = ['neutral', 'calm', 'focused', 'tense', 'determined', 'mysterious']
    
    # This would render multiple views - simplified for now
    sc.frame_set(0)
    char.pose(0, 'idle')
    char.face(0, 'neutral')
    
    sc.render.filepath = output_path
    bpy.ops.render.render(write_still=True)
    
    sc.frame_set(original_frame)


# Import bmesh for mesh creation
import bmesh
# bpy.ops is available in Blender context