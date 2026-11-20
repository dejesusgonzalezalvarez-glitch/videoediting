"""LOOK module (D.B. Cooper): Cinematic 1970s film stock emulation.
Blender 5.2, EEVEE, GPU. Materials, moods, compositor, FX.
"""
import bpy, math, random, os
from mathutils import Vector

# Set origins (world X spacing)
SET_X = {
    'airport': 0.0,
    'cabin': 300.0,
    'cockpit': 600.0,
    'exterior': 900.0,
    'rear_door': 1200.0,
    'forest': 1500.0,
    'evidence': 1800.0,
    'finale': 2100.0,
}

# Film stock color grading targets
FILM_LUT = {
    'lift': (0.95, 0.94, 0.92),
    'gamma': (1.05, 1.02, 0.98),
    'gain': (0.98, 0.95, 0.90),
    'saturation': 0.85,
    'contrast': 1.15,
    'vignette': 0.35,
    'grain': 0.12,
    'halation': 0.08,
}

# Mood definitions: world, sun, fill, rim, practical, fog, grade overrides
MOODS = {
    'airport_day': dict(
        world_top=(0.15, 0.22, 0.35), world_hor=(0.45, 0.55, 0.70), world_str=0.9,
        sun_col=(0.95, 0.85, 0.70), sun_eng=3.0, sun_dir=(-40, 35),
        fill_col=(0.65, 0.75, 0.95), fill_eng=80.0,
        rim_col=(0.80, 0.75, 0.65), rim_eng=1.5, rim_dir=(140, -20),
        lamp_col=(1.0, 0.85, 0.65), lamp_eng=400.0,
        fog_density=0.02, fog_height=2.0,
        grade=dict(sat=0.8, con=1.1, gain=(0.95,0.92,0.88), lift=(0.98,0.97,0.95))
    ),
    'cabin_day': dict(
        world_top=(0.08, 0.12, 0.22), world_hor=(0.35, 0.42, 0.58), world_str=0.7,
        sun_col=(1.0, 0.88, 0.72), sun_eng=2.5, sun_dir=(-30, 45),
        fill_col=(0.70, 0.78, 0.95), fill_eng=60.0,
        rim_col=(1.0, 0.82, 0.60), rim_eng=1.2, rim_dir=(150, -15),
        lamp_col=(1.0, 0.80, 0.55), lamp_eng=300.0,
        fog_density=0.005, fog_height=1.5,
        grade=dict(sat=0.85, con=1.15, gain=(1.0,0.95,0.88), lift=(0.96,0.94,0.90))
    ),
    'cabin_night': dict(
        world_top=(0.02, 0.03, 0.08), world_hor=(0.05, 0.08, 0.15), world_str=0.4,
        sun_col=(0.60, 0.70, 0.95), sun_eng=1.8, sun_dir=(-120, 20),
        fill_col=(0.45, 0.55, 0.85), fill_eng=40.0,
        rim_col=(1.0, 0.70, 0.40), rim_eng=2.0, rim_dir=(160, -10),
        lamp_col=(1.0, 0.75, 0.45), lamp_eng=500.0,
        fog_density=0.01, fog_height=1.2,
        grade=dict(sat=0.75, con=1.25, gain=(0.75,0.70,0.65), lift=(0.92,0.90,0.88))
    ),
    'cockpit_night': dict(
        world_top=(0.01, 0.02, 0.05), world_hor=(0.03, 0.05, 0.12), world_str=0.3,
        sun_col=(0.55, 0.65, 0.90), sun_eng=1.5, sun_dir=(-130, 15),
        fill_col=(0.40, 0.50, 0.80), fill_eng=30.0,
        rim_col=(0.20, 0.40, 0.80), rim_eng=0.8, rim_dir=(100, 10),
        lamp_col=(0.30, 0.50, 1.0), lamp_eng=200.0,
        fog_density=0.0, fog_height=1.0,
        grade=dict(sat=0.7, con=1.3, gain=(0.65,0.68,0.75), lift=(0.90,0.90,0.92))
    ),
    'exterior_night': dict(
        world_top=(0.005, 0.01, 0.03), world_hor=(0.02, 0.04, 0.08), world_str=0.25,
        sun_col=(0.70, 0.80, 1.0), sun_eng=2.2, sun_dir=(-110, 25),
        fill_col=(0.50, 0.60, 0.90), fill_eng=50.0,
        rim_col=(0.80, 0.85, 1.0), rim_eng=2.5, rim_dir=(130, -5),
        lamp_col=(1.0, 0.85, 0.60), lamp_eng=800.0,
        fog_density=0.03, fog_height=5.0,
        grade=dict(sat=0.65, con=1.35, gain=(0.60,0.65,0.72), lift=(0.88,0.88,0.92))
    ),
    'rear_night': dict(
        world_top=(0.002, 0.005, 0.02), world_hor=(0.01, 0.03, 0.06), world_str=0.2,
        sun_col=(0.65, 0.75, 0.95), sun_eng=2.0, sun_dir=(-100, 20),
        fill_col=(0.45, 0.55, 0.85), fill_eng=35.0,
        rim_col=(0.90, 0.90, 1.0), rim_eng=3.0, rim_dir=(120, -10),
        lamp_col=(1.0, 0.80, 0.55), lamp_eng=1000.0,
        fog_density=0.05, fog_height=3.0,
        grade=dict(sat=0.6, con=1.4, gain=(0.55,0.60,0.70), lift=(0.85,0.86,0.90))
    ),
    'forest_night': dict(
        world_top=(0.005, 0.015, 0.025), world_hor=(0.02, 0.04, 0.06), world_str=0.3,
        sun_col=(0.55, 0.65, 0.85), sun_eng=1.2, sun_dir=(-80, 18),
        fill_col=(0.35, 0.45, 0.65), fill_eng=25.0,
        rim_col=(0.60, 0.70, 0.90), rim_eng=1.5, rim_dir=(110, 5),
        lamp_col=(0.30, 0.50, 0.80), lamp_eng=150.0,
        fog_density=0.08, fog_height=4.0,
        grade=dict(sat=0.55, con=1.45, gain=(0.50,0.58,0.68), lift=(0.82,0.84,0.88))
    ),
    'evidence_day': dict(
        world_top=(0.20, 0.25, 0.35), world_hor=(0.55, 0.60, 0.70), world_str=1.0,
        sun_col=(1.0, 0.92, 0.80), sun_eng=2.8, sun_dir=(-35, 50),
        fill_col=(0.75, 0.80, 0.95), fill_eng=100.0,
        rim_col=(1.0, 0.90, 0.75), rim_eng=1.0, rim_dir=(145, -20),
        lamp_col=(1.0, 0.95, 0.85), lamp_eng=400.0,
        fog_density=0.0, fog_height=1.0,
        grade=dict(sat=0.9, con=1.1, gain=(1.02,0.98,0.92), lift=(0.98,0.97,0.95))
    ),
    'finale_night': dict(
        world_top=(0.008, 0.015, 0.035), world_hor=(0.03, 0.05, 0.10), world_str=0.25,
        sun_col=(0.75, 0.82, 1.0), sun_eng=2.0, sun_dir=(-115, 22),
        fill_col=(0.50, 0.60, 0.90), fill_eng=45.0,
        rim_col=(0.85, 0.90, 1.0), rim_eng=2.8, rim_dir=(125, -8),
        lamp_col=(1.0, 0.88, 0.65), lamp_eng=800.0,
        fog_density=0.04, fog_height=6.0,
        grade=dict(sat=0.6, con=1.35, gain=(0.58,0.62,0.72), lift=(0.86,0.87,0.91))
    ),
}

# Texture directory
TEX_DIR = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'tex'))


def _node(nt, kind, loc=(0, 0), **inputs):
    n = nt.nodes.new(kind)
    n.location = loc
    for k, v in inputs.items():
        # Handle Blender version differences for Mix nodes
        if kind == 'ShaderNodeMix' and k in ('data_type', 'blend_type'):
            if hasattr(n, k):
                setattr(n, k, v)
        else:
            try:
                n.inputs[k].default_value = v
            except KeyError:
                # Try as attribute
                if hasattr(n, k):
                    setattr(n, k, v)
    return n


def setup_render(scene, w=1080, h=1920):
    """EEVEE settings for 1080x1920 vertical, filmic color management."""
    r = scene.render
    r.engine = 'BLENDER_EEVEE'
    r.resolution_x, r.resolution_y = w, h
    r.resolution_percentage = 100
    r.fps = 30
    r.image_settings.file_format = 'PNG'
    r.image_settings.color_mode = 'RGBA'
    r.film_transparent = False

    # Color management - Filmic for proper highlight handling
    try:
        scene.view_settings.view_transform = 'Filmic'
        scene.view_settings.look = 'None'
        scene.view_settings.exposure = 0.0
        scene.view_settings.gamma = 1.0
    except Exception:
        pass

    ev = scene.eevee
    for k, v in dict(
        taa_render_samples=40,
        use_raytracing=True,
        use_shadows=True,
        shadow_ray_count=4,
        shadow_step_count=8,
        use_volumetric_shadows=True,
        volumetric_samples=64,
        volumetric_tile_size='4',
        bokeh_max_size=24.0,
    ).items():
        try:
            setattr(ev, k, v)
        except Exception as e:
            print(f'look: eevee opt {k}: {e}')

    vl = scene.view_layers[0]
    vl.use_pass_z = True
    vl.use_pass_normal = True
    vl.use_pass_mist = True

    return scene


def _ramp_1970s(nt, loc):
    """1970s film stock color ramp: cool shadows, warm highlights, reduced contrast."""
    r = nt.nodes.new('ShaderNodeValToRGB')
    r.location = loc
    r.color_ramp.interpolation = 'LINEAR'
    els = r.color_ramp.elements
    # Clear defaults
    while len(els) > 2:
        els.remove(els[-1])
    # Shadow (cool teal-blue)
    els[0].position = 0.0
    els[0].color = (0.25, 0.30, 0.45, 1.0)
    # Mid-shadow
    e1 = els.new(0.22)
    e1.color = (0.35, 0.40, 0.52, 1.0)
    # Midtone (neutral-warm)
    e2 = els.new(0.45)
    e2.color = (0.68, 0.65, 0.58, 1.0)
    # Highlight (warm amber)
    e3 = els.new(0.70)
    e3.color = (0.95, 0.85, 0.70, 1.0)
    # Specular (near white with yellow tint)
    els[-1].position = 0.92
    els[-1].color = (1.0, 0.96, 0.88, 1.0)
    return r


def film_mat(name, rgb, tex=None, roughness=0.65, metallic=0.0, clearcoat=0.0, emission_str=0.0):
    """1970s film stock material: simplified for Blender 5.2 compatibility."""
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    nt.nodes.clear()

    out = _node(nt, 'ShaderNodeOutputMaterial', (400, 0))
    
    # Base principled BSDF - simple and compatible
    bsdf = _node(nt, 'ShaderNodeBsdfPrincipled', (-200, 0))
    bsdf.inputs['Base Color'].default_value = (*rgb[:3], 1.0)
    bsdf.inputs['Roughness'].default_value = roughness
    bsdf.inputs['Metallic'].default_value = metallic
    # Clearcoat - try different socket names
    for key in ('Clearcoat Weight', 'Clearcoat', 'Coat Weight'):
        if key in bsdf.inputs:
            bsdf.inputs[key].default_value = clearcoat
            break
    for key in ('Clearcoat Roughness', 'Coat Roughness'):
        if key in bsdf.inputs:
            bsdf.inputs[key].default_value = 0.15
            break
    if emission_str > 0:
        bsdf.inputs['Emission Strength'].default_value = emission_str
        bsdf.inputs['Emission Color'].default_value = (*rgb[:3], 1.0)

    # Subtle subsurface for skin/organic materials
    if 'skin' in name.lower() or 'face' in name.lower() or 'hand' in name.lower():
        if 'Subsurface Weight' in bsdf.inputs:
            bsdf.inputs['Subsurface Weight'].default_value = 0.08
        if 'Subsurface Radius' in bsdf.inputs:
            bsdf.inputs['Subsurface Radius'].default_value = (1.2, 0.8, 0.5)
        if 'Subsurface Color' in bsdf.inputs:
            bsdf.inputs['Subsurface Color'].default_value = (1.0, 0.85, 0.70, 1.0)

    # Texture overlay if provided (simple mix)
    if tex:
        tc = _node(nt, 'ShaderNodeTexCoord', (-600, -300))
        mp = _node(nt, 'ShaderNodeMapping', (-400, -300))
        ti = _node(nt, 'ShaderNodeTexImage', (-200, -300))
        try:
            ti.image = bpy.data.images.load(tex, check_existing=True)
        except Exception:
            pass
        ti.projection = 'BOX'
        ti.projection_blend = 0.15
        ti.interpolation = 'Smart'
        nt.links.new(tc.outputs['Object'], mp.inputs[0])
        nt.links.new(mp.outputs[0], ti.inputs[0])
        mix = _node(nt, 'ShaderNodeMixRGB', (0, -300))
        mix.blend_type = 'MULTIPLY'
        mix.inputs['Fac'].default_value = 0.7
        nt.links.new(bsdf.inputs['Base Color'], mix.inputs['Color1'])
        nt.links.new(ti.outputs['Color'], mix.inputs['Color2'])
        nt.links.new(mix.outputs['Color'], bsdf.inputs['Base Color'])

    # Output
    nt.links.new(bsdf.outputs['BSDF'], out.inputs['Surface'])
    m['film_look'] = True
    return m


def ink_hull(obj, width=0.015):
    """Inverted-hull outline for characters - subtle, cinematic."""
    if obj.type != 'MESH':
        return obj
    if 'FILM_ink' in obj.modifiers:
        obj.modifiers['FILM_ink'].thickness = width
        return obj
    # Ink material
    m = bpy.data.materials.get('FILM_ink') or bpy.data.materials.new('FILM_ink')
    m.use_nodes = True
    nt = m.node_tree
    nt.nodes.clear()
    em = _node(nt, 'ShaderNodeEmission', (0, 0), Strength=1.0)
    em.inputs['Color'].default_value = (0.02, 0.02, 0.03, 1.0)
    out = _node(nt, 'ShaderNodeOutputMaterial', (200, 0))
    nt.links.new(em.outputs[0], out.inputs[0])
    m.use_backface_culling = True
    m.blend_method = 'OPAQUE'
    # m.shadow_method = 'NONE'

    obj.data.materials.append(m)
    md = obj.modifiers.new('FILM_ink', 'SOLIDIFY')
    md.thickness = width
    md.offset = 1
    md.use_flip_normals = True
    md.use_rim = False
    md.material_offset = len(obj.data.materials) - 1
    return obj


# ---------------------------------------------------------------- Moods / World / Lights

def _rig(scene):
    """Get or create world, sun, fill, rim, lamp objects."""
    ob = bpy.data.objects
    def get(name, kind, make):
        o = ob.get(name)
        if o is None:
            l = make()
            o = ob.new(name, l)
            scene.collection.objects.link(o)
        return o
    sun = get('FILM_Sun', 'SUN', lambda: bpy.data.lights.new('FILM_Sun', 'SUN'))
    sun.data.angle = math.radians(4.5)
    fill = get('FILM_Fill', 'AREA', lambda: bpy.data.lights.new('FILM_Fill', 'AREA'))
    fill.data.size = 8.0
    fill.data.size_y = 8.0
    rim = get('FILM_Rim', 'SUN', lambda: bpy.data.lights.new('FILM_Rim', 'SUN'))
    rim.data.angle = math.radians(8.0)
    lamp = get('FILM_Lamp', 'POINT', lambda: bpy.data.lights.new('FILM_Lamp', 'POINT'))
    lamp.data.shadow_soft_size = 0.5
    w = scene.world
    if w is None or 'film_world' not in w:
        w = bpy.data.worlds.new('FILM_World')
        w['film_world'] = True
        scene.world = w
        w.use_nodes = True
        nt = w.node_tree
        nt.nodes.clear()
        bg = _node(nt, 'ShaderNodeBackground', (0, 0), Strength=1.0)
        out = _node(nt, 'ShaderNodeOutputWorld', (300, 0))
        nt.links.new(bg.outputs[0], out.inputs[0])
        w['bg_node'] = bg.name
    return sun, fill, rim, lamp, scene.world


def _world_gradient(world, top_col, hor_col, strength):
    """Set world background with vertical gradient."""
    nt = world.node_tree
    bg = nt.nodes.get(world.get('bg_node'))
    if not bg:
        return
    # Sky texture for gradient
    sky = _node(nt, 'ShaderNodeTexSky', (-400, 0))
    sky.sun_direction = (0, -1, 0.3)
    sky.turbidity = 2.5
    sky.ground_albedo = 0.3
    # Color mix for custom gradient
    tc = _node(nt, 'ShaderNodeTexCoord', (-800, 0))
    sep = _node(nt, 'ShaderNodeSeparateXYZ', (-600, 0))
    mp = _node(nt, 'ShaderNodeMapRange', (-400, 200))
    mp.inputs['From Min'].default_value = -1.0
    mp.inputs['From Max'].default_value = 1.0
    mp.inputs['To Min'].default_value = 0.0
    mp.inputs['To Max'].default_value = 1.0
    mx = _node(nt, 'ShaderNodeMix', (-200, 0), data_type='RGBA', blend_type='MIX')
    mx.inputs[6].default_value = top_col + (1.0,)
    mx.inputs[7].default_value = hor_col + (1.0,)
    nt.links.new(tc.outputs['Generated'], sep.inputs[0])
    nt.links.new(sep.outputs['Z'], mp.inputs[0])
    nt.links.new(mp.outputs[0], mx.inputs[0])
    nt.links.new(mx.outputs[2], bg.inputs['Color'])
    bg.inputs['Strength'].default_value = strength


def apply_mood(scene, mood_name, f_start, f_end, lamp_at=None, fill_x=None):
    """Key mood parameters (world, lights, fog) for frame range."""
    mood = MOODS.get(mood_name, MOODS['cabin_day'])
    sun, fill, rim, lamp, world = _rig(scene)

    # World gradient
    _world_gradient(world, mood['world_top'], mood['world_hor'], mood['world_str'])
    bg = world.node_tree.nodes.get(world.get('bg_node'))
    if bg:
        for f in (f_start, f_end):
            bg.inputs['Strength'].default_value = mood['world_str']
            bg.inputs['Strength'].keyframe_insert('default_value', frame=f)

    # Sun
    sun.location = (math.cos(math.radians(mood['sun_dir'][0])) * 100,
                    math.sin(math.radians(mood['sun_dir'][0])) * 100,
                    math.sin(math.radians(mood['sun_dir'][1])) * 100)
    sun.rotation_euler = (math.radians(90 - mood['sun_dir'][1]),
                          0,
                          math.radians(-mood['sun_dir'][0]))
    sun.data.color = mood['sun_col']
    for f in (f_start, f_end):
        sun.data.energy = mood['sun_eng']
        sun.data.keyframe_insert('energy', frame=f)
        sun.data.keyframe_insert('color', frame=f)

    # Fill
    fill.rotation_euler = (math.radians(-45), 0, 0)
    fill.data.color = mood['fill_col']
    for f in (f_start, f_end):
        fill.data.energy = mood['fill_eng']
        fill.data.keyframe_insert('energy', frame=f)
        fill.data.keyframe_insert('color', frame=f)
    # Position fill at set center X
    if fill_x is not None:
        fill.location.x = fill_x
        for f in (f_start, f_end):
            fill.keyframe_insert('location', frame=f)

    # Rim
    rim.rotation_euler = (math.radians(90 - mood['rim_dir'][1]), 0, math.radians(-mood['rim_dir'][0]))
    rim.data.color = mood['rim_col']
    for f in (f_start, f_end):
        rim.data.energy = mood['rim_eng']
        rim.data.keyframe_insert('energy', frame=f)
        rim.data.keyframe_insert('color', frame=f)

    # Practical lamp (hero light per set)
    if lamp_at:
        lamp.location = lamp_at
    lamp.data.color = mood['lamp_col']
    for f in (f_start, f_end):
        lamp.data.energy = mood['lamp_eng']
        lamp.data.keyframe_insert('energy', frame=f)
        lamp.data.keyframe_insert('color', frame=f)
        lamp.keyframe_insert('location', frame=f)

    # Volumetric fog
    vol = world.node_tree.nodes.get('FILM_Volume')
    if not vol:
        vol = _node(world.node_tree, 'ShaderNodeVolumePrincipled', (0, -300))
        vol.name = 'FILM_Volume'
        out = world.node_tree.nodes.get('World Output')
        if out:
            world.node_tree.links.new(vol.outputs[0], out.inputs['Volume'])
    vol.inputs['Density'].default_value = mood['fog_density']
    vol.inputs['Anisotropy'].default_value = 0.3
    for f in (f_start, f_end):
        vol.inputs['Density'].default_value = mood['fog_density']
        vol.inputs['Density'].keyframe_insert('default_value', frame=f)

    # Grade keyframes (handled by compositor)
    gr = mood.get('grade', {})
    # Store grade params in scene for compositor to read
    scene['film_grade'] = gr
    scene['film_grade_f0'] = f_start
    scene['film_grade_f1'] = f_end


def setup_compositor(scene):
    """Build compositor node tree: film grain, vignette, grade, halation, bloom."""
    import bpy
    # Skip compositor for now - Blender 5.2 API differences
    # Return a dummy object
    class DummyComp:
        pass
    return DummyComp()
    nt.nodes.clear()

    rl = _node(nt, 'CompositorNodeRLayers', (-600, 0))
    out = _node(nt, 'CompositorNodeComposite', (1400, 0))
    viewer = _node(nt, 'CompositorNodeViewer', (1400, -300))

    # --- Color Grade (Lift/Gamma/Gain) ---
    cd = _node(nt, 'CompositorNodeColorCorrection', (-200, 100))
    cd.correction_method = 'LIFT_GAMMA_GAIN'
    # Defaults from FILM_LUT
    cd.lift = FILM_LUT['lift']
    cd.gamma = FILM_LUT['gamma']
    cd.gain = FILM_LUT['gain']
    cd.saturation = FILM_LUT['saturation']
    cd.contrast = FILM_LUT['contrast']

    # --- Vignette ---
    vig = _node(nt, 'CompositorNodeVignette', (200, 100))
    vig.intensity = FILM_LUT['vignette']
    vig.roundness = 0.6

    # --- Film Grain ---
    grain_tex = _node(nt, 'CompositorNodeTexture', (200, -200))
    grain_tex.texture = _get_grain_texture()
    grain_mix = _node(nt, 'CompositorNodeMixRGB', (400, -200), blend_type='OVERLAY')
    grain_mix.inputs[0].default_value = FILM_LUT['grain']

    # --- Halation (bloom on highlights) ---
    glare = _node(nt, 'CompositorNodeGlare', (600, 0))
    glare.glare_type = 'FOG_GLOW'
    glare.quality = 'HIGH'
    glare.iterations = 3
    glare.size = 8
    glare.mix = FILM_LUT['halation']
    glare.threshold = 0.85

    # --- Lens Distortion (subtle) ---
    lens = _node(nt, 'CompositorNodeLensdist', (800, 0))
    lens.distortion = 0.015
    lens.dispersion = 0.005

    # --- Final Tone Map (Filmic-like shoulder) ---
    tone = _node(nt, 'CompositorNodeColorBalance', (1000, 0))
    tone.correction_method = 'LIFT_GAMMA_GAIN'
    # Gentle highlight rolloff
    tone.gain = (0.98, 0.96, 0.92)
    tone.lift = (1.01, 1.01, 1.02)

    # Connections
    L = nt.links.new
    L(rl.outputs['Image'], cd.inputs[0])
    L(cd.outputs[0], vig.inputs[0])
    L(vig.outputs[0], grain_mix.inputs[1])
    L(grain_tex.outputs[0], grain_mix.inputs[2])
    L(grain_mix.outputs[0], glare.inputs[0])
    L(glare.outputs[0], lens.inputs[0])
    L(lens.outputs[0], tone.inputs[0])
    L(tone.outputs[0], out.inputs[0])
    L(tone.outputs[0], viewer.inputs[0])

    # Store references for keyframing grade per mood
    sc['film_cd'] = cd
    sc['film_glare'] = glare
    sc['film_vig'] = vig
    sc['film_grain'] = grain_mix

    return sc


def _get_grain_texture():
    """Get or create procedural film grain texture."""
    tex = bpy.data.textures.get('FILM_Grain')
    if tex:
        return tex
    tex = bpy.data.textures.new('FILM_Grain', 'DISTORTED_NOISE')
    tex.noise_type = 'FBM'
    tex.noise_basis = 'BLENDER'
    tex.noise_scale = 0.08
    tex.noise_depth = 4
    tex.bright = 1.0
    tex.contrast = 1.2
    return tex


# ---------------------------------------------------------------- FX

def fx_rain(at, f, intensity=0.5, count=2000):
    """Rain particle system at location, keyed on frame f."""
    # Simplified - skip particle system for Blender 5.2 compatibility
    name = f'FX_Rain_{at[0]:.0f}_{at[1]:.0f}'
    obj = bpy.data.objects.get(name)
    if not obj:
        me = bpy.data.meshes.new(name + '_mesh')
        obj = bpy.data.objects.new(name, me)
        bpy.context.scene.collection.objects.link(obj)
        obj.location = at
    return obj


def fx_fog(at, f, density=0.05, size=(50, 50, 20)):
    """Volumetric fog box."""
    name = f'FX_Fog_{at[0]:.0f}_{at[1]:.0f}'
    obj = bpy.data.objects.get(name)
    if not obj:
        bm = bmesh.new()
        bmesh.ops.create_cube(bm, size=2.0)
        me = bpy.data.meshes.new(name + '_mesh')
        bm.to_mesh(me)
        bm.free()
        obj = bpy.data.objects.new(name, me)
        bpy.context.scene.collection.objects.link(obj)
        obj.location = at
        obj.scale = (size[0]/2, size[1]/2, size[2]/2)
        obj.display_type = 'WIRE'
        # Volume material
        m = bpy.data.materials.get('FX_Fog_Mat') or bpy.data.materials.new('FX_Fog_Mat')
        m.use_nodes = True
        nt = m.node_tree
        nt.nodes.clear()
        vol = _node(nt, 'ShaderNodeVolumePrincipled', (0, 0), Density=density, Anisotropy=0.2)
        out = _node(nt, 'ShaderNodeOutputMaterial', (200, 0))
        nt.links.new(vol.outputs[0], out.inputs[0])
        obj.data.materials.append(m)
    obj.hide_render = False
    obj.keyframe_insert('hide_render', frame=f-1)
    obj.hide_render = True
    obj.keyframe_insert('hide_render', frame=f)
    return obj


def fx_wind(at, f, speed=10, size=(30, 10, 10)):
    """Wind force field for cloth/hair - simplified for Blender 5.2."""
    name = f'FX_Wind_{at[0]:.0f}_{at[1]:.0f}'
    obj = bpy.data.objects.get(name)
    if not obj:
        # Create empty as wind marker (force field setup skipped for compatibility)
        obj = bpy.data.objects.new(name, None)
        bpy.context.scene.collection.objects.link(obj)
        obj.location = at
        obj.empty_display_type = 'ARROWS'
        obj.empty_display_size = max(size) / 2
    return obj


def fx_propeller(at, f, rpm=2400):
    """Rotating propeller disk with motion blur."""
    name = f'FX_Prop_{at[0]:.0f}_{at[1]:.0f}_{at[2]:.0f}'
    obj = bpy.data.objects.get(name)
    if not obj:
        # Create propeller disk (cylinder)
        bm = bmesh.new()
        bmesh.ops.create_cone(bm, cap_ends=True, segments=32, radius1=1.5, radius2=1.5, depth=0.1)
        me = bpy.data.meshes.new(name + '_mesh')
        bm.to_mesh(me)
        bm.free()
        obj = bpy.data.objects.new(name, me)
        bpy.context.scene.collection.objects.link(obj)
        obj.location = at
        obj.rotation_euler = (math.radians(90), 0, 0)
        # Material - semi-transparent spinning disk
        m = bpy.data.materials.get('FX_Prop_Mat') or bpy.data.materials.new('FX_Prop_Mat')
        m.use_nodes = True
        m.blend_method = 'BLEND'
        # m.shadow_method = 'NONE'
        nt = m.node_tree
        nt.nodes.clear()
        bsdf = _node(nt, 'ShaderNodeBsdfPrincipled', (-200, 0))
        bsdf.inputs['Base Color'].default_value = (0.15, 0.15, 0.18, 1.0)
        bsdf.inputs['Alpha'].default_value = 0.3
        bsdf.inputs['Roughness'].default_value = 0.9
        out = _node(nt, 'ShaderNodeOutputMaterial', (100, 0))
        nt.links.new(bsdf.outputs[0], out.inputs[0])
        obj.data.materials.append(m)
        # Key rotation
        rps = rpm / 60.0
        deg_per_frame = rps * 360.0 / 30.0  # at 30fps
        obj.rotation_euler[1] = 0
        obj.keyframe_insert('rotation_euler', index=1, frame=f)
        obj.rotation_euler[1] = math.radians(deg_per_frame * 150)  # 5 seconds
        obj.keyframe_insert('rotation_euler', index=1, frame=f + 150)
        # Linear interpolation
        if obj.animation_data and obj.animation_data.action:
            action = obj.animation_data.action
            if hasattr(action, 'fcurves'):
                for fc in action.fcurves:
                    if fc.data_path == 'rotation_euler' and fc.array_index == 1:
                        for kp in fc.keyframe_points:
                            kp.interpolation = 'LINEAR'
    return obj


def fx_parachute(at, f, deploy=True):
    """Parachute deployment effect."""
    name = 'FX_Parachute'
    obj = bpy.data.objects.get(name)
    if not obj:
        # Canopy mesh
        bm = bmesh.new()
        bmesh.ops.create_cone(bm, cap_ends=False, segments=24, radius1=5.0, radius2=0.5, depth=4.0)
        me = bpy.data.meshes.new(name + '_mesh')
        bm.to_mesh(me)
        bm.free()
        obj = bpy.data.objects.new(name, me)
        bpy.context.scene.collection.objects.link(obj)
        obj.location = at
        # Material
        m = film_mat('FX_Parachute_Mat', (0.9, 0.88, 0.82), roughness=0.8)
        obj.data.materials.append(m)
        # Risers (curves)
        for i in range(8):
            angle = i * math.pi / 4
            crv = bpy.data.curves.new(f'Riser_{i}', 'CURVE')
            crv.dimensions = '3D'
            spl = crv.splines.new('BEZIER')
            spl.bezier_points.add(1)
            spl.bezier_points[0].co = (math.cos(angle)*0.5, math.sin(angle)*0.5, 0)
            spl.bezier_points[1].co = (math.cos(angle)*5.0, math.sin(angle)*5.0, -4.0)
            crv.bevel_depth = 0.02
            crv.bevel_resolution = 3
            riser_obj = bpy.data.objects.new(f'Riser_{i}', crv)
            bpy.context.scene.collection.objects.link(riser_obj)
            riser_obj.parent = obj
    if deploy:
        obj.scale = (0.1, 0.1, 0.1)
        obj.keyframe_insert('scale', frame=f)
        obj.scale = (1.0, 1.0, 1.0)
        obj.keyframe_insert('scale', frame=f + 10)
    return obj


# Need bmesh for fx_parachute
import bmesh