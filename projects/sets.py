"""SETS module (D.B. Cooper): 8 cinematic environments built procedurally.
Blender 5.2. Airport, Cabin, Cockpit, Exterior, Rear Door, Forest, Evidence, Finale.
"""
import bpy, math, random, os
from mathutils import Vector

# Add look to path
import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import look

# Set origins
ORIGIN = {
    'airport': (0.0, 0.0, 0.0),
    'cabin': (300.0, 0.0, 0.0),
    'cockpit': (600.0, 0.0, 0.0),
    'exterior': (900.0, 0.0, 0.0),
    'rear_door': (1200.0, 0.0, 0.0),
    'forest': (1500.0, 0.0, 0.0),
    'evidence': (1800.0, 0.0, 0.0),
    'finale': (2100.0, 0.0, 0.0),
}

TEX_DIR = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'tex'))


def _mat(name, rgb, **kwargs):
    return look.film_mat(name, rgb, **kwargs)


def _collection(name, origin):
    """Create a collection for a set at its world origin."""
    coll = bpy.data.collections.get(name) or bpy.data.collections.new(name)
    if coll.name not in bpy.context.scene.collection.children:
        bpy.context.scene.collection.children.link(coll)
    # Create an empty as set origin marker
    empty = bpy.data.objects.get(f'{name}_origin')
    if not empty:
        empty = bpy.data.objects.new(f'{name}_origin', None)
        empty.empty_display_size = 1.0
        empty.empty_display_type = 'ARROWS'
        coll.objects.link(empty)
    empty.location = origin
    return coll


def _anchor(coll, name, loc, rot=(0, 0, 0)):
    """Create an anchor empty in collection."""
    obj = bpy.data.objects.get(f'{coll.name}_{name}')
    if not obj:
        obj = bpy.data.objects.new(f'{coll.name}_{name}', None)
        obj.empty_display_size = 0.3
        obj.empty_display_type = 'SPHERE'
        coll.objects.link(obj)
    obj.location = loc
    obj.rotation_euler = rot
    return obj


def _cube(coll, name, loc, scale, mat=None, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cube_add(size=2, location=loc, rotation=rot)
    obj = bpy.context.object
    obj.name = f'{coll.name}_{name}'
    obj.scale = scale
    bpy.ops.object.transform_apply(scale=True, rotation=True)
    coll.objects.link(obj)
    if mat:
        obj.data.materials.append(mat)
    return obj


def _plane(coll, name, loc, scale, mat=None, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_plane_add(size=2, location=loc, rotation=rot)
    obj = bpy.context.object
    obj.name = f'{coll.name}_{name}'
    obj.scale = scale
    bpy.ops.object.transform_apply(scale=True, rotation=True)
    coll.objects.link(obj)
    if mat:
        obj.data.materials.append(mat)
    return obj


def _cylinder(coll, name, loc, radius, depth, mat=None, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cylinder_add(radius=radius, depth=depth, location=loc, rotation=rot)
    obj = bpy.context.object
    obj.name = f'{coll.name}_{name}'
    coll.objects.link(obj)
    if mat:
        obj.data.materials.append(mat)
    return obj


# ============================================================
# SET 1: AIRPORT TERMINAL (1971 Portland)
# ============================================================
def build_airport():
    ox, oy, oz = ORIGIN['airport']
    coll = _collection('airport', (ox, oy, oz))
    
    # Materials
    conc = _mat('Airport_Concrete', (0.45, 0.45, 0.48), roughness=0.9)
    glass = _mat('Airport_Glass', (0.2, 0.25, 0.35), roughness=0.05, metallic=0.0, clearcoat=1.0)
    glass.blend_method = 'BLEND'
    # glass.shadow_method = 'NONE'  # Not available in Blender 5.2
    metal = _mat('Airport_Metal', (0.35, 0.35, 0.38), roughness=0.4, metallic=0.8)
    tile = _mat('Airport_Tile', (0.55, 0.52, 0.50), roughness=0.85)
    carpet = _mat('Airport_Carpet', (0.25, 0.18, 0.15), roughness=0.95)
    wood = _mat('Airport_Wood', (0.35, 0.25, 0.18), roughness=0.7)
    
    # Floor - large tile expanse
    floor = _plane(coll, 'floor', (ox, oy, oz), (40, 30, 1), tile)
    
    # Glass curtain wall (tarmac side)
    for i in range(-15, 16, 3):
        _cube(coll, f'glass_wall_{i}', (ox + i*2, oy + 25, oz + 2.5), (2.5, 0.15, 5), glass)
        _cube(coll, f'glass_frame_{i}', (ox + i*2, oy + 25.1, oz + 2.5), (2.5, 0.05, 5), metal)
    
    # Ticket counters
    for i in range(-3, 4):
        x = ox + i * 6
        _cube(coll, f'counter_base_{i}', (x, oy + 5, oz + 0.6), (2.5, 1.2, 1.2), wood)
        _cube(coll, f'counter_top_{i}', (x, oy + 5, oz + 1.5), (2.5, 1.2, 0.05), _mat('Counter_Top', (0.2, 0.15, 0.1), roughness=0.3))
        _cube(coll, f'counter_glass_{i}', (x, oy + 5.6, oz + 1.8), (2.5, 0.1, 1.0), glass)
    
    # Benches / seating rows
    for row in range(3):
        for i in range(-8, 9, 2):
            x = ox + i * 1.2
            y = oy + 8 + row * 3
            _cube(coll, f'bench_{row}_{i}', (x, y, oz + 0.45), (0.8, 0.4, 0.45), _mat('Bench_Vinyl', (0.15, 0.1, 0.08), roughness=0.6))
            _cube(coll, f'bench_back_{row}_{i}', (x, y - 0.4, oz + 0.9), (0.8, 0.05, 0.5), _mat('Bench_Vinyl', (0.15, 0.1, 0.08), roughness=0.6))
    
    # Columns
    for i in range(-10, 11, 5):
        for j in [10, 20]:
            _cylinder(coll, f'col_{i}_{j}', (ox + i*2, oy + j, oz + 3), 0.4, 6, conc)
    
    # Ceiling
    _plane(coll, 'ceiling', (ox, oy, oz + 6.5), (40, 30, 1), _mat('Ceiling_Tile', (0.7, 0.7, 0.72), roughness=0.9), rot=(0, 0, 0))
    
    # Fluorescent lights
    for i in range(-12, 13, 4):
        for j in range(-8, 9, 4):
            _cube(coll, f'light_{i}_{j}', (ox + i*2, oy + j*2, oz + 6.3), (1.5, 0.3, 0.1), _mat('Light_Fixture', (0.9, 0.9, 0.95), emission_str=5.0, roughness=0.2))
    
    # Anchors
    anchors = {
        'terminal_entrance': _anchor(coll, 'terminal_entrance', (ox, oy - 12, oz), (0, 0, 0)),
        'crowd_center': _anchor(coll, 'crowd_center', (ox, oy, oz + 1.5), (0, 0, 0)),
        'ticket_counter': _anchor(coll, 'ticket_counter', (ox, oy + 5, oz + 1.5), (0, 0, 0)),
        'cooper_spot': _anchor(coll, 'cooper_spot', (ox + 2, oy - 2, oz), (0, 0, -0.15)),
        'briefcase_spot': _anchor(coll, 'briefcase_spot', (ox + 2.3, oy - 1.9, oz + 0.4), (0, 0, 0)),
        'tarmac': _anchor(coll, 'tarmac', (ox, oy + 30, oz), (0, 0, 0)),
        'cloud_layer': _anchor(coll, 'cloud_layer', (ox, oy, oz + 100), (0, 0, 0)),
    }
    
    return {'collection': coll, 'anchors': anchors}


# ============================================================
# SET 2: BOEING 727 PASSENGER CABIN
# ============================================================
def build_cabin():
    ox, oy, oz = ORIGIN['cabin']
    coll = _collection('cabin', (ox, oy, oz))
    
    # Materials
    vinyl = _mat('Cabin_Vinyl', (0.18, 0.12, 0.10), roughness=0.75)
    fabric = _mat('Cabin_Fabric', (0.22, 0.16, 0.13), roughness=0.9)
    carpet = _mat('Cabin_Carpet', (0.15, 0.10, 0.08), roughness=0.95)
    panel = _mat('Cabin_Panel', (0.35, 0.28, 0.22), roughness=0.65)
    window_glass = _mat('Cabin_Window', (0.1, 0.12, 0.18), roughness=0.02, clearcoat=1.0, metallic=0.0)
    window_glass.blend_method = 'BLEND'
    # window_glass.shadow_method = 'NONE'  # Not available in Blender 5.2
    metal = _mat('Cabin_Metal', (0.4, 0.4, 0.42), roughness=0.3, metallic=0.85)
    overhead = _mat('Cabin_Overhead', (0.3, 0.24, 0.18), roughness=0.7)
    reading_light = _mat('Reading_Light', (1.0, 0.95, 0.85), emission_str=3.0, roughness=0.1)
    
    # Floor
    _plane(coll, 'floor', (ox, oy, oz), (2.5, 20, 1), carpet)
    
    # Ceiling
    _plane(coll, 'ceiling', (ox, oy, oz + 2.2), (2.5, 20, 1), panel, rot=(0, 0, 0))
    
    # Side walls
    _cube(coll, 'wall_left', (ox - 1.25, oy, oz + 1.1), (0.05, 20, 2.2), panel)
    _cube(coll, 'wall_right', (ox + 1.25, oy, oz + 1.1), (0.05, 20, 2.2), panel)
    
    # Seat rows (rows 5-25, 3-3 config)
    seat_mat = vinyl
    for row in range(5, 26):
        y = oy - 10 + (row - 5) * 0.82
        # Left triple (A,B,C)
        for seat_idx, x_off in enumerate([-0.95, -0.55, -0.15]):
            seat_name = f'seat_{row}_{chr(65+seat_idx)}'
            _cube(coll, f'{seat_name}_bottom', (ox + x_off, y, oz + 0.45), (0.35, 0.42, 0.45), seat_mat)
            _cube(coll, f'{seat_name}_back', (ox + x_off, y - 0.42, oz + 0.9), (0.35, 0.05, 0.6), seat_mat)
        # Aisle
        # Right triple (D,E,F)
        for seat_idx, x_off in enumerate([0.15, 0.55, 0.95]):
            seat_name = f'seat_{row}_{chr(68+seat_idx)}'
            _cube(coll, f'{seat_name}_bottom', (ox + x_off, y, oz + 0.45), (0.35, 0.42, 0.45), seat_mat)
            _cube(coll, f'{seat_name}_back', (ox + x_off, y - 0.42, oz + 0.9), (0.35, 0.05, 0.6), seat_mat)
    
    # Windows (every row, both sides)
    for row in range(5, 26):
        y = oy - 10 + (row - 5) * 0.82
        for side, x in [('L', -1.2), ('R', 1.2)]:
            win = _cube(coll, f'window_{row}_{side}', (ox + x, y, oz + 1.1), (0.05, 0.35, 0.45), window_glass)
            win.scale = (1, 1, 1)
    
    # Overhead bins
    for row in range(5, 26):
        y = oy - 10 + (row - 5) * 0.82
        for side, x in [('L', -1.0), ('R', 1.0)]:
            _cube(coll, f'overhead_{row}_{side}', (ox + x, y, oz + 1.9), (0.6, 0.4, 0.3), overhead)
    
    # Reading lights (above each seat pair)
    for row in range(5, 26):
        y = oy - 10 + (row - 5) * 0.82
        for x in [-0.75, -0.35, 0.35, 0.75]:
            _cylinder(coll, f'readlight_{row}_{x}', (ox + x, y, oz + 2.15), 0.04, 0.08, reading_light)
    
    # Forward bulkhead (cockpit door)
    _cube(coll, 'bulkhead_fwd', (ox, oy + 10.5, oz + 1.1), (2.5, 0.1, 2.2), panel)
    _cube(coll, 'cockpit_door', (ox, oy + 10.6, oz + 1.0), (0.9, 0.15, 2.0), _mat('Door', (0.25, 0.18, 0.14), roughness=0.7))
    
    # Aft bulkhead (to galley/rear)
    _cube(coll, 'bulkhead_aft', (ox, oy - 10.5, oz + 1.1), (2.5, 0.1, 2.2), panel)
    
    # Galley hint (behind aft bulkhead)
    _cube(coll, 'galley_counter', (ox, oy - 11.5, oz + 0.9), (2.3, 0.8, 1.0), panel)
    
    # Anchors
    anchors = {
        'window_18f': _anchor(coll, 'window_18f', (ox + 1.2, oy - 10 + (18-5)*0.82, oz + 1.1), (0, 0, 0)),
        'window_18a': _anchor(coll, 'window_18a', (ox - 1.2, oy - 10 + (18-5)*0.82, oz + 1.1), (0, 0, 0)),
        'seat_18e': _anchor(coll, 'seat_18e', (ox + 0.55, oy - 10 + (18-5)*0.82, oz + 0.45), (0, 0, 0)),
        'seat_18f': _anchor(coll, 'seat_18f', (ox + 0.95, oy - 10 + (18-5)*0.82, oz + 0.45), (0, 0, 0)),
        'aisle_18': _anchor(coll, 'aisle_18', (ox, oy - 10 + (18-5)*0.82, oz + 0.45), (0, 0, 0)),
        'tray_18f': _anchor(coll, 'tray_18f', (ox + 0.8, oy - 10 + (18-5)*0.82, oz + 0.85), (0, 0, 0)),
        'fa_position': _anchor(coll, 'fa_position', (ox, oy - 10 + (12-5)*0.82, oz + 1.5), (0, 0, 0)),
        'cockpit_door': _anchor(coll, 'cockpit_door', (ox, oy + 10.5, oz + 1.0), (0, 0, 0)),
        'cooper_spot': _anchor(coll, 'cooper_spot', (ox + 0.95, oy - 10 + (18-5)*0.82, oz + 0.45), (0, 0, math.pi)),
        'briefcase_spot': _anchor(coll, 'briefcase_spot', (ox + 0.6, oy - 10 + (18-5)*0.82, oz + 0.45), (0, 0, 0)),
        'aisle_aft': _anchor(coll, 'aisle_aft', (ox, oy - 10, oz + 0.45), (0, 0, 0)),
        # Cross-set anchors for cockpit references
        'pilot_seat': _anchor(coll, 'pilot_seat', (ox - 0.6 + 300, oy - 0.3, oz + 1.3), (0, 0, 0)),
        'windshield_center': _anchor(coll, 'windshield_center', (ox + 300, oy + 1.5, oz + 1.0), (0, 0, 0)),
    }
    
    return {'collection': coll, 'anchors': anchors}


# ============================================================
# SET 3: COCKPIT
# ============================================================
def build_cockpit():
    ox, oy, oz = ORIGIN['cockpit']
    coll = _collection('cockpit', (ox, oy, oz))
    
    panel_mat = _mat('Cockpit_Panel', (0.1, 0.1, 0.12), roughness=0.3)
    screen_mat = _mat('Cockpit_Screen', (0.05, 0.15, 0.05), emission_str=0.5, roughness=0.1)
    glass_mat = _mat('Cockpit_Glass', (0.08, 0.1, 0.15), roughness=0.01, clearcoat=1.0, metallic=0.0)
    glass_mat.blend_method = 'BLEND'
    # glass_mat.shadow_method = 'NONE'
    seat_mat = _mat('Cockpit_Seat', (0.15, 0.1, 0.08), roughness=0.7)
    
    # Floor
    _plane(coll, 'floor', (ox, oy, oz), (3, 2.5, 1), _mat('Cockpit_Floor', (0.1, 0.1, 0.12), roughness=0.8))
    
    # Windshield (wrap around)
    for i, angle in enumerate([-35, -15, 0, 15, 35]):
        x = 1.3 * math.sin(math.radians(angle))
        z = 1.3 * math.cos(math.radians(angle)) + 0.5
        _cube(coll, f'windshield_{i}', (ox + x, oy + 1.2, oz + z), (0.05, 0.3, 0.7), glass_mat, rot=(0, math.radians(angle), 0))
    
    # Instrument panel
    _cube(coll, 'panel_main', (ox, oy + 0.5, oz + 1.0), (2.5, 0.15, 1.2), panel_mat)
    # Screens/gauges
    for i in range(6):
        x = ox - 1.0 + i * 0.4
        _cube(coll, f'gauge_{i}', (ox + x, oy + 0.55, oz + 1.0), (0.18, 0.1, 0.18), screen_mat)
    
    # Center pedestal
    _cube(coll, 'pedestal', (ox, oy + 0.2, oz + 0.6), (0.6, 0.4, 0.8), panel_mat)
    
    # Pilot seats
    for side, x in [('L', -0.6), ('R', 0.6)]:
        _cube(coll, f'seat_{side}_base', (ox + x, oy - 0.3, oz + 0.5), (0.5, 0.5, 0.5), seat_mat)
        _cube(coll, f'seat_{side}_back', (ox + x, oy - 0.55, oz + 1.0), (0.5, 0.1, 0.6), seat_mat)
        _cube(coll, f'seat_{side}_head', (ox + x, oy - 0.6, oz + 1.3), (0.5, 0.15, 0.3), seat_mat)
    
    # Ceiling
    _plane(coll, 'ceiling', (ox, oy, oz + 1.8), (3, 2.5, 1), panel_mat)
    
    # Anchors
    anchors = {
        'pilot_seat': _anchor(coll, 'pilot_seat', (ox - 0.6, oy - 0.3, oz + 1.3), (0, 0, 0)),
        'copilot_seat': _anchor(coll, 'copilot_seat', (ox + 0.6, oy - 0.3, oz + 1.3), (0, 0, 0)),
        'windshield_center': _anchor(coll, 'windshield_center', (ox, oy + 1.5, oz + 1.0), (0, 0, 0)),
        'instrument_panel': _anchor(coll, 'instrument_panel', (ox, oy + 0.6, oz + 1.0), (0, 0, 0)),
    }
    
    return {'collection': coll, 'anchors': anchors}


# ============================================================
# SET 4: EXTERIOR - BOEING 727 IN FLIGHT
# ============================================================
def build_exterior():
    ox, oy, oz = ORIGIN['exterior']
    coll = _collection('exterior', (ox, oy, oz))
    
    # Aircraft materials
    alum = _mat('Plane_Aluminum', (0.55, 0.58, 0.62), roughness=0.25, metallic=0.85)
    alum_dark = _mat('Plane_Aluminum_Dark', (0.35, 0.38, 0.42), roughness=0.3, metallic=0.8)
    window_mat = _mat('Plane_Window', (0.05, 0.08, 0.15), roughness=0.01, clearcoat=1.0, metallic=0.0)
    window_mat.blend_method = 'BLEND'
    # window_mat.shadow_method = 'NONE'
    tire_mat = _mat('Plane_Tire', (0.08, 0.08, 0.09), roughness=0.9)
    light_nav = _mat('Nav_Light_Red', (1.0, 0.1, 0.05), emission_str=15.0, roughness=0.1)
    light_nav_g = _mat('Nav_Right_Green', (0.05, 1.0, 0.1), emission_str=15.0, roughness=0.1)
    light_strobe = _mat('Strobe_White', (1.0, 1.0, 0.95), emission_str=50.0, roughness=0.05)
    light_landing = _mat('Landing_Light', (1.0, 0.95, 0.85), emission_str=100.0, roughness=0.1)
    engine_mat = _mat('Engine_Metal', (0.3, 0.3, 0.32), roughness=0.2, metallic=0.9)
    
    # Fuselage (simplified cylinder)
    bpy.ops.mesh.primitive_cylinder_add(radius=1.7, depth=33, location=(ox, oy, oz + 2.5), rotation=(math.radians(90), 0, 0))
    fuse = bpy.context.object
    fuse.name = f'{coll.name}_fuselage'
    fuse.data.materials.append(alum)
    coll.objects.link(fuse)
    
    # Nose cone
    bpy.ops.mesh.primitive_cone_add(radius1=1.7, radius2=0, depth=4, location=(ox, oy + 18.5, oz + 2.5), rotation=(math.radians(90), 0, 0))
    nose = bpy.context.object
    nose.name = f'{coll.name}_nose'
    nose.data.materials.append(alum)
    coll.objects.link(nose)
    
    # Tail cone
    bpy.ops.mesh.primitive_cone_add(radius1=1.7, radius2=0.5, depth=3, location=(ox, oy - 16.5, oz + 2.5), rotation=(math.radians(-90), 0, 0))
    tail = bpy.context.object
    tail.name = f'{coll.name}_tail'
    tail.data.materials.append(alum)
    coll.objects.link(tail)
    
    # Vertical stabilizer
    bpy.ops.mesh.primitive_cube_add(size=2, location=(ox, oy - 18, oz + 6), rotation=(0, 0, 0))
    vstab = bpy.context.object
    vstab.name = f'{coll.name}_vstab'
    vstab.scale = (0.15, 4, 5)
    bpy.ops.object.transform_apply(scale=True)
    vstab.data.materials.append(alum)
    coll.objects.link(vstab)
    
    # Horizontal stabilizer
    bpy.ops.mesh.primitive_cube_add(size=2, location=(ox, oy - 18, oz + 8.5), rotation=(0, 0, 0))
    hstab = bpy.context.object
    hstab.name = f'{coll.name}_hstab'
    hstab.scale = (5, 0.1, 2.5)
    bpy.ops.object.transform_apply(scale=True)
    hstab.data.materials.append(alum)
    coll.objects.link(hstab)
    
    # Wings (attached to fuselage sides, aft)
    for side, x_mult in [('L', -1), ('R', 1)]:
        bpy.ops.mesh.primitive_cube_add(size=2, location=(ox + x_mult*8, oy - 2, oz + 2.5), rotation=(0, 0, 0))
        wing = bpy.context.object
        wing.name = f'{coll.name}_wing_{side}'
        wing.scale = (6, 10, 0.3)
        bpy.ops.object.transform_apply(scale=True)
        wing.data.materials.append(alum)
        coll.objects.link(wing)
        
        # Engine pods on rear fuselage (727 has 3 engines at rear)
        if side == 'L':
            # Engine 1 (left)
            bpy.ops.mesh.primitive_cylinder_add(radius=0.7, depth=2.5, location=(ox - 2.5, oy - 8, oz + 2.5), rotation=(math.radians(90), 0, 0))
            eng = bpy.context.object
            eng.name = f'{coll.name}_engine_1'
            eng.data.materials.append(engine_mat)
            coll.objects.link(eng)
        elif side == 'R':
            # Engine 3 (right)
            bpy.ops.mesh.primitive_cylinder_add(radius=0.7, depth=2.5, location=(ox + 2.5, oy - 8, oz + 2.5), rotation=(math.radians(90), 0, 0))
            eng = bpy.context.object
            eng.name = f'{coll.name}_engine_3'
            eng.data.materials.append(engine_mat)
            coll.objects.link(eng)
    
    # Engine 2 (center, tail)
    bpy.ops.mesh.primitive_cylinder_add(radius=0.8, depth=3, location=(ox, oy - 15, oz + 2.5), rotation=(math.radians(90), 0, 0))
    eng2 = bpy.context.object
    eng2.name = f'{coll.name}_engine_2'
    eng2.data.materials.append(engine_mat)
    coll.objects.link(eng2)
    
    # Windows (cabin)
    for row in range(20):
        y = oy - 5 + row * 1.3
        for side, x in [('L', -1.7), ('R', 1.7)]:
            _cube(coll, f'window_{row}_{side}', (ox + x, y, oz + 2.5), (0.03, 0.35, 0.3), window_mat)
    
    # Cockpit windows
    for i, angle in enumerate([-35, -15, 0, 15, 35]):
        x = 1.6 * math.sin(math.radians(angle))
        z = 1.6 * math.cos(math.radians(angle)) + 2.5
        _cube(coll, f'cockpit_win_{i}', (ox + x, oy + 16, oz + z), (0.03, 0.4, 0.5), window_mat, rot=(0, math.radians(angle), 0))
    
    # Navigation lights
    _cylinder(coll, 'nav_left', (ox - 6, oy - 2, oz + 2.5), 0.1, 0.2, light_nav)
    _cylinder(coll, 'nav_right', (ox + 6, oy - 2, oz + 2.5), 0.1, 0.2, light_nav_g)
    _cylinder(coll, 'nav_tail', (ox, oy - 18, oz + 10), 0.1, 0.2, _mat('Nav_Tail_White', (1.0, 1.0, 0.95), emission_str=10.0))
    
    # Strobe lights
    _cylinder(coll, 'strobe_wing_L', (ox - 10, oy - 2, oz + 2.5), 0.08, 0.15, light_strobe)
    _cylinder(coll, 'strobe_wing_R', (ox + 10, oy - 2, oz + 2.5), 0.08, 0.15, light_strobe)
    _cylinder(coll, 'strobe_tail', (ox, oy - 18, oz + 8.5), 0.08, 0.15, light_strobe)
    
    # Landing lights (on wing leading edge)
    for side, x in [('L', -1.7), ('R', 1.7)]:
        _cylinder(coll, f'landing_{side}', (ox + x*3, oy + 2, oz + 2.3), 0.1, 0.3, light_landing, rot=(math.radians(-10), 0, 0))
    
    # Aft airstair (stowed)
    bpy.ops.mesh.primitive_cube_add(size=2, location=(ox, oy - 16.5, oz - 0.5), rotation=(0, 0, 0))
    stair = bpy.context.object
    stair.name = f'{coll.name}_airstair'
    stair.scale = (1.2, 0.5, 2.5)
    bpy.ops.object.transform_apply(scale=True)
    stair.data.materials.append(alum_dark)
    coll.objects.link(stair)
    
    # Anchors
    anchors = {
        'plane_exterior': _anchor(coll, 'plane_exterior', (ox, oy, oz + 2.5), (0, 0, 0)),
        'window_18f': _anchor(coll, 'window_18f', (ox + 1.7, oy - 5 + (18-5)*1.3, oz + 2.5), (0, 0, 0)),
        'window_18a': _anchor(coll, 'window_18a', (ox - 1.7, oy - 5 + (18-5)*1.3, oz + 2.5), (0, 0, 0)),
        'rear_door_area': _anchor(coll, 'rear_door_area', (ox, oy - 16.5, oz + 2.5), (0, 0, 0)),
        'runway_end': _anchor(coll, 'runway_end', (ox, oy - 100, oz), (0, 0, 0)),
        'cloud_layer': _anchor(coll, 'cloud_layer', (ox, oy, oz + 100), (0, 0, 0)),
        'tarmac_crew': _anchor(coll, 'tarmac_crew', (ox, oy + 50, oz), (0, 0, 0)),
        # Cross-set anchors for cabin references
        'seat_18e': _anchor(coll, 'seat_18e', (ox + 0.55 + 300, oy - 10 + (18-5)*0.82, oz + 0.45), (0, 0, 0)),
        'aisle_aft': _anchor(coll, 'aisle_aft', (ox + 300, oy - 10, oz + 0.45), (0, 0, 0)),
    }
    
    return {'collection': coll, 'anchors': anchors}


# ============================================================
# SET 5: REAR DOOR / AIRSTAIR AREA
# ============================================================
def build_rear_door():
    ox, oy, oz = ORIGIN['rear_door']
    coll = _collection('rear_door', (ox, oy, oz))
    
    alum = _mat('Plane_Aluminum', (0.55, 0.58, 0.62), roughness=0.25, metallic=0.85)
    floor_mat = _mat('Stair_Metal', (0.3, 0.3, 0.32), roughness=0.4, metallic=0.7)
    rail_mat = _mat('Stair_Rail', (0.25, 0.25, 0.28), roughness=0.3, metallic=0.8)
    
    # Fuselage section
    bpy.ops.mesh.primitive_cylinder_add(radius=1.7, depth=6, location=(ox, oy, oz + 2.5), rotation=(math.radians(90), 0, 0))
    fuse = bpy.context.object
    fuse.name = f'{coll.name}_fuselage_section'
    fuse.data.materials.append(alum)
    coll.objects.link(fuse)
    
    # Door opening (cut out - represented by frame)
    _cube(coll, 'door_frame_top', (ox, oy, oz + 4.0), (1.2, 0.1, 0.2), alum)
    _cube(coll, 'door_frame_left', (ox - 1.2, oy, oz + 2.0), (0.1, 0.1, 2.2), alum)
    _cube(coll, 'door_frame_right', (ox + 1.2, oy, oz + 2.0), (0.1, 0.1, 2.2), alum)
    _cube(coll, 'door_frame_bottom', (ox, oy, oz + 0.8), (1.2, 0.1, 0.2), alum)
    
    # Airstair deployed (extends down and aft)
    for i in range(8):
        step_y = oy - 0.5 - i * 0.4
        step_z = oz - 0.5 - i * 0.25
        _cube(coll, f'stair_step_{i}', (ox, step_y, step_z), (1.0, 0.05, 0.3), floor_mat)
        # Risers
        if i > 0:
            _cube(coll, f'stair_riser_{i}', (ox, step_y + 0.2, step_z + 0.25), (1.0, 0.02, 0.25), floor_mat)
    
    # Handrails
    for side, x in [('L', -1.1), ('R', 1.1)]:
        for i in range(8):
            y = oy - 0.5 - i * 0.4
            z = oz - 0.3 - i * 0.25
            _cylinder(coll, f'rail_{side}_{i}', (x, y, z + 0.5), 0.03, 0.5, rail_mat)
    
    # Interior aft bulkhead visible through door
    _cube(coll, 'aft_bulkhead', (ox, oy + 2.5, oz + 1.5), (2.0, 0.1, 2.5), _mat('Bulkhead', (0.2, 0.15, 0.12), roughness=0.7))
    
    # Anchors
    anchors = {
        'rear_door_center': _anchor(coll, 'rear_door_center', (ox, oy - 0.2, oz + 1.7), (0, 0, 0)),
        'stairs_bottom': _anchor(coll, 'stairs_bottom', (ox, oy - 3.5, oz - 1.5), (0, 0, 0)),
        'cooper_spot': _anchor(coll, 'cooper_spot', (ox, oy - 0.5, oz + 1.7), (0, 0, math.pi)),
    }
    
    return {'collection': coll, 'anchors': anchors}


# ============================================================
# SET 6: FOREST (Washington Mountains)
# ============================================================
def build_forest():
    ox, oy, oz = ORIGIN['forest']
    coll = _collection('forest', (ox, oy, oz))
    
    bark = _mat('Tree_Bark', (0.25, 0.18, 0.14), roughness=0.9)
    needle = _mat('Tree_Needles', (0.1, 0.18, 0.08), roughness=0.85)
    ground = _mat('Forest_Ground', (0.15, 0.12, 0.08), roughness=0.95)
    rock = _mat('Forest_Rock', (0.3, 0.3, 0.32), roughness=0.9)
    
    # Ground plane
    _plane(coll, 'ground', (ox, oy, oz), (60, 60, 1), ground)
    
    # Trees (procedural placement)
    random.seed(42)
    for _ in range(200):
        x = ox + random.uniform(-28, 28)
        y = oy + random.uniform(-28, 28)
        h = random.uniform(8, 20)
        r = random.uniform(0.3, 0.6)
        
        # Trunk
        bpy.ops.mesh.primitive_cylinder_add(radius=r, depth=h, location=(x, y, oz + h/2))
        trunk = bpy.context.object
        trunk.name = f'{coll.name}_tree_trunk'
        trunk.data.materials.append(bark)
        coll.objects.link(trunk)
        
        # Canopy (cone)
        c_h = h * 0.6
        bpy.ops.mesh.primitive_cone_add(radius1=r*3, radius2=0, depth=c_h, location=(x, y, oz + h + c_h/2))
        canopy = bpy.context.object
        canopy.name = f'{coll.name}_tree_canopy'
        canopy.data.materials.append(needle)
        coll.objects.link(canopy)
    
    # Rocks
    for _ in range(30):
        x = ox + random.uniform(-25, 25)
        y = oy + random.uniform(-25, 25)
        s = random.uniform(0.5, 2.0)
        bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, radius=s, location=(x, y, oz + s/2))
        r = bpy.context.object
        r.name = f'{coll.name}_rock'
        r.data.materials.append(rock)
        coll.objects.link(r)
    
    # Fog volumes (handled by mood)
    
    # Anchors
    anchors = {
        'forest_entry': _anchor(coll, 'forest_entry', (ox, oy, oz + 15), (0, 0, 0)),
        'clearing_center': _anchor(coll, 'clearing_center', (ox + 5, oy + 3, oz), (0, 0, 0)),
    }
    
    return {'collection': coll, 'anchors': anchors}


# ============================================================
# SET 7: EVIDENCE ROOM
# ============================================================
def build_evidence():
    ox, oy, oz = ORIGIN['evidence']
    coll = _collection('evidence', (ox, oy, oz))
    
    wall = _mat('Evidence_Wall', (0.55, 0.52, 0.48), roughness=0.85)
    board = _mat('Evidence_Board', (0.4, 0.35, 0.28), roughness=0.7)
    desk = _mat('Evidence_Desk', (0.35, 0.25, 0.18), roughness=0.65)
    paper = _mat('Evidence_Paper', (0.92, 0.88, 0.82), roughness=0.9)
    photo = _mat('Evidence_Photo', (0.4, 0.35, 0.3), roughness=0.8)
    map_mat = _mat('Evidence_Map', (0.6, 0.55, 0.48), roughness=0.8)
    money_mat = _mat('Evidence_Money', (0.2, 0.35, 0.2), roughness=0.85)
    glass = _mat('Magnifying_Glass', (0.2, 0.25, 0.35), roughness=0.02, clearcoat=1.0, metallic=0.0)
    glass.blend_method = 'BLEND'
    # glass.shadow_method = 'NONE'  # Not available in Blender 5.2
    metal = _mat('Lamp_Metal', (0.3, 0.3, 0.32), roughness=0.3, metallic=0.8)
    lamp_on = _mat('Lamp_Light', (1.0, 0.95, 0.85), emission_str=8.0, roughness=0.1)
    
    # Floor
    _plane(coll, 'floor', (ox, oy, oz), (8, 6, 1), _mat('Office_Carpet', (0.2, 0.18, 0.15), roughness=0.95))
    
    # Walls
    _cube(coll, 'wall_back', (ox, oy - 3, oz + 1.5), (8, 0.1, 3), wall)
    _cube(coll, 'wall_left', (ox - 4, oy, oz + 1.5), (0.1, 6, 3), wall)
    _cube(coll, 'wall_right', (ox + 4, oy, oz + 1.5), (0.1, 6, 3), wall)
    
    # Cork board on back wall
    _cube(coll, 'cork_board', (ox, oy - 2.95, oz + 1.5), (5, 0.12, 2.5), board)
    
    # Desk
    _cube(coll, 'desk', (ox + 2, oy + 1.5, oz + 0.75), (1.5, 1.0, 1.5), desk)
    
    # Desk lamp
    _cylinder(coll, 'lamp_base', (ox + 2.5, oy + 2.0, oz + 0.8), 0.1, 0.5, metal)
    _cylinder(coll, 'lamp_shade', (ox + 2.5, oy + 2.0, oz + 1.5), 0.2, 0.2, _mat('Lamp_Shade', (0.2, 0.15, 0.1), roughness=0.9))
    _cylinder(coll, 'lamp_bulb', (ox + 2.5, oy + 2.0, oz + 1.3), 0.05, 0.1, lamp_on)
    
    # Chair
    _cube(coll, 'chair_base', (ox + 2, oy + 2.5, oz + 0.45), (0.5, 0.5, 0.45), _mat('Chair', (0.15, 0.1, 0.08), roughness=0.7))
    _cube(coll, 'chair_back', (ox + 2, oy + 2.8, oz + 0.9), (0.5, 0.05, 0.5), _mat('Chair', (0.15, 0.1, 0.08), roughness=0.7))
    
    # Filing cabinet
    _cube(coll, 'filing', (ox - 3, oy + 2, oz + 0.7), (0.5, 0.6, 1.4), metal)
    
    # Anchors
    anchors = {
        'evidence_board': _anchor(coll, 'evidence_board', (ox, oy - 2.95, oz + 1.5), (0, 0, 0)),
        'evidence_map': _anchor(coll, 'evidence_map', (ox + 1, oy - 2.95, oz + 1.0), (0, 0, 0)),
        'evidence_money': _anchor(coll, 'evidence_money', (ox - 1, oy - 2.95, oz + 0.5), (0, 0, 0)),
        'desk': _anchor(coll, 'desk', (ox + 2, oy + 1.5, oz + 0.75), (0, 0, 0)),
        'magnifying_spot': _anchor(coll, 'magnifying_spot', (ox + 1.5, oy + 1.8, oz + 0.9), (0, 0, 0)),
    }
    
    return {'collection': coll, 'anchors': anchors}


# ============================================================
# SET 8: FINALE - 727 IN CLOUDS
# ============================================================
def build_finale():
    ox, oy, oz = ORIGIN['finale']
    coll = _collection('finale', (ox, oy, oz))
    
    # Reuse exterior plane but simpler
    alum = _mat('Plane_Aluminum', (0.55, 0.58, 0.62), roughness=0.25, metallic=0.85)
    window_mat = _mat('Plane_Window', (0.05, 0.08, 0.15), roughness=0.01, clearcoat=1.0, metallic=0.0)
    window_mat.blend_method = 'BLEND'
    # window_mat.shadow_method = 'NONE'
    
    # Fuselage
    bpy.ops.mesh.primitive_cylinder_add(radius=1.7, depth=33, location=(ox, oy, oz + 2.5), rotation=(math.radians(90), 0, 0))
    fuse = bpy.context.object
    fuse.name = f'{coll.name}_fuselage'
    fuse.data.materials.append(alum)
    coll.objects.link(fuse)
    
    # Windows
    for row in range(20):
        y = oy - 5 + row * 1.3
        for side, x in [('L', -1.7), ('R', 1.7)]:
            _cube(coll, f'window_{row}_{side}', (ox + x, y, oz + 2.5), (0.03, 0.35, 0.3), window_mat)
    
    # Cloud volumes (handled by mood/fog)
    
    # Anchors
    anchors = {
        'plane_exterior': _anchor(coll, 'plane_exterior', (ox, oy, oz + 2.5), (0, 0, 0)),
        'window_18a': _anchor(coll, 'window_18a', (ox - 1.7, oy - 5 + (18-5)*1.3, oz + 2.5), (0, 0, 0)),
        'cloud_layer': _anchor(coll, 'cloud_layer', (ox, oy, oz + 100), (0, 0, 0)),
    }
    
    return {'collection': coll, 'anchors': anchors}


# ============================================================
# PROPS
# ============================================================
def build_props():
    """Create all loose props used across sets."""
    props = {}
    
    # These are created by chars.py and imported here
    # But we create set-specific duplicates as needed
    
    # Briefcase (hero prop)
    case = _create_briefcase_standalone()
    props['briefcase'] = case
    
    # Parachute pack
    pack = _create_parachute_pack_standalone()
    props['parachute'] = pack
    
    # Deployed canopy
    canopy = _create_parachute_canopy_standalone()
    props['parachute_deployed'] = canopy
    
    # Ticket
    ticket = _create_ticket_standalone()
    props['ticket'] = ticket
    
    # Note
    note = _create_note_standalone()
    props['note'] = note
    
    # Money bag
    bag = _create_money_bag_standalone()
    props['money_bag'] = bag
    
    # Evidence props
    props['evidence_photos'] = _create_evidence_photos()
    props['evidence_map'] = _create_evidence_map()
    props['evidence_money'] = _create_evidence_money_display()
    props['magnifying_glass'] = _create_magnifying_glass()
    props['coffee_cup'] = _create_coffee_cup()
    props['ashtray'] = _create_ashtray()
    
    # Plane exterior (simplified for prop system)
    props['plane_exterior'] = _create_plane_exterior_prop()
    
    # Plane interior seats (for quick duplication)
    props['plane_interior_seats'] = _create_seat_group()
    
    # Instrument panel
    props['instrument_panel'] = _create_instrument_panel()
    
    return props


def _create_briefcase_standalone():
    bpy.ops.mesh.primitive_cube_add(size=0.45, location=(0, 0, 0))
    case = bpy.context.object
    case.name = 'Prop_Briefcase'
    case.scale = (1.0, 0.35, 0.7)
    bpy.ops.object.transform_apply(scale=True)
    bpy.ops.mesh.primitive_torus_add(major_radius=0.12, minor_radius=0.015, location=(0, 0.1, 0.16))
    handle = bpy.context.object
    handle.name = 'Prop_Briefcase_Handle'
    handle.rotation_euler = (math.radians(90), 0, 0)
    bpy.ops.object.transform_apply(rotation=True)
    case.select_set(True)
    handle.select_set(True)
    bpy.context.view_layer.objects.active = case
    bpy.ops.object.join()
    leather = look.film_mat('Prop_Briefcase_Leather', (0.08, 0.06, 0.05), roughness=0.75, metallic=0.0)
    metal = look.film_mat('Prop_Briefcase_Metal', (0.25, 0.25, 0.28), roughness=0.3, metallic=0.9)
    case.data.materials.append(leather)
    case.data.materials.append(metal)
    case.hide_render = True
    return case


def _create_parachute_pack_standalone():
    bpy.ops.mesh.primitive_cube_add(size=0.35, location=(0, 0, 0))
    pack = bpy.context.object
    pack.name = 'Prop_Parachute_Pack'
    pack.scale = (1.0, 0.5, 0.7)
    bpy.ops.object.transform_apply(scale=True)
    canvas = look.film_mat('Prop_Parachute_Canvas', (0.45, 0.40, 0.35), roughness=0.8)
    pack.data.materials.append(canvas)
    pack.hide_render = True
    return pack


def _create_parachute_canopy_standalone():
    bpy.ops.mesh.primitive_cone_add(radius1=5.0, radius2=0.5, depth=4.0, location=(0, 0, -2))
    canopy = bpy.context.object
    canopy.name = 'Prop_Parachute_Canopy'
    bpy.ops.object.mode_set(mode='EDIT')
    bm = bmesh.from_edit_mesh(canopy.data)
    bpy.ops.mesh.loopcut_slide(MESH_OT_loopcut={"number_cuts": 24, "smoothness": 0})
    bpy.ops.object.mode_set(mode='OBJECT')
    nylon = look.film_mat('Prop_Parachute_Nylon', (0.85, 0.82, 0.75), roughness=0.6)
    canopy.data.materials.append(nylon)
    canopy.hide_render = True
    canopy.hide_viewport = True
    return canopy


def _create_ticket_standalone():
    bpy.ops.mesh.primitive_plane_add(size=0.18, location=(0, 0, 0))
    ticket = bpy.context.object
    ticket.name = 'Prop_Ticket'
    ticket.scale = (1.0, 0.7, 1.0)
    bpy.ops.object.transform_apply(scale=True)
    ticket.rotation_euler = (math.radians(90), 0, 0)
    bpy.ops.object.transform_apply(rotation=True)
    mat = look.film_mat('Prop_Ticket_Paper', (0.95, 0.92, 0.85), roughness=0.9)
    ticket.data.materials.append(mat)
    ticket.hide_render = True
    return ticket


def _create_note_standalone():
    bpy.ops.mesh.primitive_plane_add(size=0.12, location=(0, 0, 0))
    note = bpy.context.object
    note.name = 'Prop_Note'
    note.scale = (1.0, 0.6, 1.0)
    bpy.ops.object.transform_apply(scale=True)
    note.rotation_euler = (math.radians(90), 0, 0)
    bpy.ops.object.transform_apply(rotation=True)
    mat = look.film_mat('Prop_Note_Paper', (0.98, 0.96, 0.90), roughness=0.95)
    note.data.materials.append(mat)
    note.hide_render = True
    return note


def _create_money_bag_standalone():
    bpy.ops.mesh.primitive_cylinder_add(radius=0.15, depth=0.30, location=(0, 0, 0))
    bag = bpy.context.object
    bag.name = 'Prop_Money_Bag'
    bpy.ops.object.mode_set(mode='EDIT')
    bm = bmesh.from_edit_mesh(bag.data)
    for v in bm.verts:
        if v.co.z > 0.1:
            v.co.x *= 0.8
            v.co.y *= 0.8
    bmesh.update_edit_mesh(bag.data)
    bpy.ops.object.mode_set(mode='OBJECT')
    canvas = look.film_mat('Prop_Money_Bag_Canvas', (0.55, 0.50, 0.42), roughness=0.85)
    bag.data.materials.append(canvas)
    bag.hide_render = True
    return bag


def _create_evidence_photos():
    # Stack of photos on board
    bpy.ops.mesh.primitive_cube_add(size=0.3, location=(0, 0, 0))
    photos = bpy.context.object
    photos.name = 'Prop_Evidence_Photos'
    photos.scale = (1.5, 0.02, 2.0)
    bpy.ops.object.transform_apply(scale=True)
    mat = look.film_mat('Prop_Photo_Paper', (0.4, 0.35, 0.3), roughness=0.8)
    photos.data.materials.append(mat)
    photos.hide_render = True
    return photos


def _create_evidence_map():
    bpy.ops.mesh.primitive_plane_add(size=0.6, location=(0, 0, 0))
    map_obj = bpy.context.object
    map_obj.name = 'Prop_Evidence_Map'
    map_obj.rotation_euler = (math.radians(90), 0, 0)
    bpy.ops.object.transform_apply(rotation=True)
    mat = look.film_mat('Prop_Map_Paper', (0.6, 0.55, 0.48), roughness=0.8)
    map_obj.data.materials.append(mat)
    map_obj.hide_render = True
    return map_obj


def _create_evidence_money_display():
    # Bills on light table
    bpy.ops.mesh.primitive_cube_add(size=0.15, location=(0, 0, 0))
    bills = bpy.context.object
    bills.name = 'Prop_Evidence_Money'
    bills.scale = (4.0, 0.005, 2.0)
    bpy.ops.object.transform_apply(scale=True)
    mat = look.film_mat('Prop_Money_Bills', (0.2, 0.35, 0.2), roughness=0.85)
    bills.data.materials.append(mat)
    bills.hide_render = True
    return bills


def _create_magnifying_glass():
    # Handle
    bpy.ops.mesh.primitive_cylinder_add(radius=0.015, depth=0.12, location=(0, 0, 0))
    handle = bpy.context.object
    handle.name = 'Prop_Magnifier_Handle'
    # Lens
    bpy.ops.mesh.primitive_cylinder_add(radius=0.05, depth=0.01, location=(0, 0, 0.065))
    lens = bpy.context.object
    lens.name = 'Prop_Magnifier_Lens'
    # Apply materials before joining
    handle.data.materials.append(look.film_mat('Prop_Magnifier_Metal', (0.3, 0.3, 0.32), roughness=0.3, metallic=0.8))
    lens.data.materials.append(look.film_mat('Prop_Magnifier_Glass', (0.2, 0.25, 0.35), roughness=0.02, clearcoat=1.0))
    handle.select_set(True)
    lens.select_set(True)
    bpy.context.view_layer.objects.active = handle
    bpy.ops.object.join()
    handle.hide_render = True
    return handle


def _create_coffee_cup():
    bpy.ops.mesh.primitive_cylinder_add(radius=0.04, depth=0.1, location=(0, 0, 0))
    cup = bpy.context.object
    cup.name = 'Prop_Coffee_Cup'
    cup.data.materials.append(look.film_mat('Prop_Cup_Ceramic', (0.9, 0.88, 0.85), roughness=0.2))
    cup.hide_render = True
    return cup


def _create_ashtray():
    bpy.ops.mesh.primitive_cylinder_add(radius=0.05, depth=0.03, location=(0, 0, 0))
    ash = bpy.context.object
    ash.name = 'Prop_Ashtray'
    ash.data.materials.append(look.film_mat('Prop_Ashtray_Glass', (0.15, 0.15, 0.18), roughness=0.1, clearcoat=1.0))
    ash.hide_render = True
    return ash


def _create_seat_group():
    # Group of 3 seats for quick population
    bpy.ops.object.empty_add(type='PLAIN_AXES', location=(0, 0, 0))
    grp = bpy.context.object
    grp.name = 'Prop_Seat_Group'
    vinyl = look.film_mat('Prop_Seat_Vinyl', (0.18, 0.12, 0.10), roughness=0.75)
    for i, x in enumerate([-0.95, -0.55, -0.15]):
        bpy.ops.mesh.primitive_cube_add(size=0.7, location=(x, 0, 0.45))
        seat = bpy.context.object
        seat.name = f'Prop_Seat_{i}'
        seat.scale = (0.5, 0.6, 0.9)
        bpy.ops.object.transform_apply(scale=True)
        seat.data.materials.append(vinyl)
        seat.parent = grp
        bpy.ops.mesh.primitive_cube_add(size=0.7, location=(x, -0.42, 0.9))
        back = bpy.context.object
        back.name = f'Prop_SeatBack_{i}'
        back.scale = (0.5, 0.07, 1.3)
        bpy.ops.object.transform_apply(scale=True)
        back.data.materials.append(vinyl)
        back.parent = grp
    grp.hide_render = True
    return grp


def _create_instrument_panel():
    bpy.ops.mesh.primitive_cube_add(size=2, location=(0, 0, 0))
    panel = bpy.context.object
    panel.name = 'Prop_Instrument_Panel'
    panel.scale = (1.25, 0.075, 0.6)
    bpy.ops.object.transform_apply(scale=True)
    panel.data.materials.append(look.film_mat('Prop_Panel_Dark', (0.1, 0.1, 0.12), roughness=0.3))
    panel.hide_render = True
    return panel


# ============================================================
# MAIN BUILD FUNCTIONS
# ============================================================
def build_sets():
    """Build all 8 sets and return dict with collections and anchors."""
    sets = {}
    sets['airport'] = build_airport()
    sets['cabin'] = build_cabin()
    sets['cockpit'] = build_cockpit()
    sets['exterior'] = build_exterior()
    sets['rear_door'] = build_rear_door()
    sets['forest'] = build_forest()
    sets['evidence'] = build_evidence()
    sets['finale'] = build_finale()
    return sets


def build_props_dict():
    """Build all props and return dict."""
    return build_props()


def _create_plane_exterior_prop():
    """Create a simplified plane exterior for the prop system."""
    bpy.ops.object.empty_add(type='PLAIN_AXES', location=(0, 0, 0))
    plane = bpy.context.object
    plane.name = 'Prop_Plane_Exterior'
    plane.hide_render = True
    return plane


# Import bmesh
import bmesh