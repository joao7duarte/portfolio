"""Builds the room, lights it with Cycles and bakes the light into textures.

Run from the repo root (GPU is used when available):
  "C:/Program Files/Blender Foundation/Blender 5.3/blender.exe" -b -P blender/room.py -- [samples]

Outputs (all loaded by src/scene/BakedRoom.tsx):
  public/models/room.glb            geometry with a lightmap UV per atlas
  public/models/room-{shell,rug,props}.webp   baked light + colour

Everything is built directly in three.js coordinates (Y up, +Z towards the camera),
so the glTF is exported without the usual Z-up conversion.
The menu objects (monitor, keyboard, mug, notebook, phone) are not exported: they stay live in three.js,
but stand-ins for them sit in the bake so they cast shadows and the screen throws its glow.
"""
import math
import os
import random
import sys

import bmesh
import bpy
import numpy as np
from mathutils import Euler, Matrix, Vector

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(ROOT, 'public', 'models')
WORK_DIR = os.environ.get('BAKE_WORK_DIR', 'D:/CodeStudies/blender-work/portfolio')
ARGS = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
EXPORT_ONLY = ARGS[:1] == ['export']  # re-export room.glb from the saved bake, no new bake
SAMPLES = int(ARGS[0]) if ARGS and not EXPORT_ONLY else 256

# --- dimensions shared with the site (src/scene/dims.ts, Room.tsx, Gadgets.tsx, Keyboard.tsx) ---
DESK_WIDTH = 3.4
DESK_TOP = DESK_WIDTH / 2
WALL_X = 6.5
WALL_Z = -1.4
FLOOR_Z_END = 9.0
WALL_H = 6.0
LAMP_POS = (1.4, DESK_TOP, -0.55)
LAMP_TILT = -0.7
WIN_POS = (-0.15, DESK_TOP + 1.3, WALL_Z)
WIN_W, WIN_H, WIN_T = 2.2, 1.45, 0.07
MONITOR_POS = (0, DESK_TOP, -0.4)
NOTEBOOK_POS, NOTEBOOK_ROT = (-1.35, DESK_TOP, 0.3), 0.2
PHONE_POS, PHONE_ROT = (1.38, DESK_TOP, 0.3), -0.45
KEYBOARD_POS = (0.08, DESK_TOP, 0.3)
MUG_POS = (-0.9, DESK_TOP, -0.2)

PLASTER = '#eadfcd'
FLOOR = '#d8c8ae'
WALNUT = '#8a5a3a'
WALNUT_DARK = '#6f4630'
GRAPHITE = '#2b2320'
PAPER = '#fbf6ec'
ACCENT = '#1f5c4d'
GLOW_GREEN = '#4caf50'

ATLAS = {'shell': 2048, 'rug': 1024, 'props': 2048, 'outside': 1024}


# ---------------------------------------------------------------- helpers
def lin(hex_color, a=1.0):
    h = hex_color.lstrip('#')
    out = []
    for i in (0, 2, 4):
        c = int(h[i:i + 2], 16) / 255
        out.append(c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4)
    return (*out, a)


MATS = {}


def mat(name, color, rough=0.8, metal=0.0, emit=None, emit_strength=0.0):
    key = (name, color, rough, metal, emit, emit_strength)
    if key in MATS:
        return MATS[key]
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    bsdf = m.node_tree.nodes['Principled BSDF']
    bsdf.inputs['Base Color'].default_value = lin(color)
    bsdf.inputs['Roughness'].default_value = rough
    bsdf.inputs['Metallic'].default_value = metal
    if emit:
        bsdf.inputs['Emission Color'].default_value = lin(emit)
        bsdf.inputs['Emission Strength'].default_value = emit_strength
    MATS[key] = m
    return m


def link(obj):
    bpy.context.collection.objects.link(obj)
    return obj


def new_obj(name, bm):
    mesh = bpy.data.meshes.new(name)
    bm.to_mesh(mesh)
    bm.free()
    return link(bpy.data.objects.new(name, mesh))


def finish(obj, material, loc=(0, 0, 0), rot=(0, 0, 0), scale=None):
    if material is not None:
        obj.data.materials.append(material)
    if scale:
        obj.data.transform(Matrix.Diagonal((*scale, 1)))
    obj.data.transform(Euler(rot, 'XYZ').to_matrix().to_4x4())
    obj.data.transform(Matrix.Translation(loc))
    for p in obj.data.polygons:
        p.use_smooth = True
    return obj


def box(name, size, material, loc=(0, 0, 0), rot=(0, 0, 0), bevel=0.0, segments=3):
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    bmesh.ops.scale(bm, vec=size, verts=bm.verts)
    if bevel > 0:
        bmesh.ops.bevel(bm, geom=bm.verts[:] + bm.edges[:], offset=min(bevel, min(size) / 2 - 1e-4),
                        segments=segments, affect='EDGES', profile=0.5)
    o = new_obj(name, bm)
    finish(o, material, loc, rot)
    shade_flat_sharp(o)
    return o


def cylinder(name, r_top, r_bottom, h, material, loc=(0, 0, 0), rot=(0, 0, 0), segs=32, cap=True):
    """Like three's CylinderGeometry: axis along +Y, centred on loc."""
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=cap, cap_tris=False, segments=segs, radius1=r_bottom, radius2=r_top, depth=h)
    # bmesh cones run along Z; turn to Y with the top at +Y
    bmesh.ops.rotate(bm, verts=bm.verts, cent=(0, 0, 0), matrix=Matrix.Rotation(-math.pi / 2, 3, 'X'))
    o = new_obj(name, bm)
    finish(o, material, loc, rot)
    shade_flat_sharp(o)
    return o


def sphere(name, r, material, loc=(0, 0, 0), scale=(1, 1, 1), rot=(0, 0, 0)):
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=16, v_segments=10, radius=r)
    o = new_obj(name, bm)
    finish(o, material, loc, rot, scale)
    return o


def plane(name, w, h, material, loc=(0, 0, 0), rot=(0, 0, 0)):
    """Like three's PlaneGeometry: in XY, facing +Z."""
    bm = bmesh.new()
    bmesh.ops.create_grid(bm, x_segments=1, y_segments=1, size=0.5)
    bmesh.ops.scale(bm, vec=(w, h, 1), verts=bm.verts)
    o = new_obj(name, bm)
    finish(o, material, loc, rot)
    return o


def shade_flat_sharp(o, angle=40):
    """Smooth across gentle bevels, crisp across real corners."""
    mesh = o.data
    bm = bmesh.new()
    bm.from_mesh(mesh)
    for e in bm.edges:
        if e.is_manifold and e.calc_face_angle(0) > math.radians(angle):
            e.smooth = False
    bm.to_mesh(mesh)
    bm.free()


def place(objs, loc=(0, 0, 0), rot=(0, 0, 0)):
    """Moves a group of parts as one, like a three.js <group position rotation>."""
    m = Matrix.Translation(loc) @ Euler(rot, 'XYZ').to_matrix().to_4x4()
    for o in objs:
        o.data.transform(m)
    return objs


def join(name, objs):
    objs = [o for o in objs if o is not None]
    bpy.ops.object.select_all(action='DESELECT')
    for o in objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    if len(objs) > 1:
        bpy.ops.object.join()
    o = bpy.context.view_layer.objects.active
    o.name = name
    o.data.name = name
    return o


# ---------------------------------------------------------------- the room
def shell():
    wall = mat('Plaster', PLASTER, 1.0)
    floor = plane('Floor', 2 * WALL_X, FLOOR_Z_END - WALL_Z, mat('Floor', FLOOR, 0.95),
                  loc=(0, 0, (FLOOR_Z_END + WALL_Z) / 2), rot=(-math.pi / 2, 0, 0))

    # back wall with an opening for the window: four panels around it
    cx, cy = WIN_POS[0], WIN_POS[1]
    l, r = cx - WIN_W / 2, cx + WIN_W / 2
    b, t = cy - WIN_H / 2, cy + WIN_H / 2
    panels = []
    for (x0, x1, y0, y1) in [(-WALL_X, l, 0, WALL_H), (r, WALL_X, 0, WALL_H), (l, r, 0, b), (l, r, t, WALL_H)]:
        panels.append(plane('BackWall', x1 - x0, y1 - y0, wall, loc=((x0 + x1) / 2, (y0 + y1) / 2, WALL_Z)))
    # the reveal: depth of the wall around the opening
    depth = 0.16
    reveal = mat('Reveal', PLASTER, 1.0)
    panels += [
        plane('Reveal', WIN_W, depth, reveal, loc=(cx, b, WALL_Z - depth / 2), rot=(-math.pi / 2, 0, 0)),
        plane('Reveal', WIN_W, depth, reveal, loc=(cx, t, WALL_Z - depth / 2), rot=(math.pi / 2, 0, 0)),
        plane('Reveal', depth, WIN_H, reveal, loc=(l, cy, WALL_Z - depth / 2), rot=(0, math.pi / 2, 0)),
        plane('Reveal', depth, WIN_H, reveal, loc=(r, cy, WALL_Z - depth / 2), rot=(0, -math.pi / 2, 0)),
    ]
    side_len = FLOOR_Z_END - WALL_Z
    left = plane('LeftWall', side_len, WALL_H, wall, loc=(-WALL_X, WALL_H / 2, WALL_Z + side_len / 2), rot=(0, math.pi / 2, 0))
    right = plane('RightWall', side_len, WALL_H, wall, loc=(WALL_X, WALL_H / 2, WALL_Z + side_len / 2), rot=(0, -math.pi / 2, 0))
    skirting = box('Skirting', (2 * WALL_X, 0.14, 0.03), mat('Skirting', '#f4ecdc', 0.9), loc=(0, 0.07, WALL_Z + 0.015))
    return join('Shell', [floor, *panels, left, right, skirting])


def rug():
    w, d = 4.4, 3.15
    bm = bmesh.new()
    bmesh.ops.create_grid(bm, x_segments=1, y_segments=1, size=0.5)
    bmesh.ops.scale(bm, vec=(w, d, 1), verts=bm.verts)
    bmesh.ops.bevel(bm, geom=bm.verts[:], offset=0.11, segments=6, affect='VERTICES')
    # albedo UVs straight from position, matching the canvas texture on the site
    uv = bm.loops.layers.uv.new('Albedo')
    for f in bm.faces:
        for loop in f.loops:
            loop[uv].uv = (loop.vert.co.x / w + 0.5, loop.vert.co.y / d + 0.5)
    o = new_obj('Rug', bm)
    m = bpy.data.materials.new('RugWeave')
    m.use_nodes = True
    nt = m.node_tree
    tex = nt.nodes.new('ShaderNodeTexImage')
    tex.image = rug_image()
    uvn = nt.nodes.new('ShaderNodeUVMap')
    uvn.uv_map = 'Albedo'
    nt.links.new(uvn.outputs['UV'], tex.inputs['Vector'])
    bsdf = nt.nodes['Principled BSDF']
    nt.links.new(tex.outputs['Color'], bsdf.inputs['Base Color'])
    bsdf.inputs['Roughness'].default_value = 1.0
    # plane in XY facing +Z, laid flat: canvas top towards the wall
    finish(o, m, loc=(0, 0.006, 0.6), rot=(-math.pi / 2, 0, 0))
    return o


def rug_image():
    """The site's rug canvas (textures.ts useRugTexture), redrawn with numpy."""
    W, H = 1024, 736
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    img = np.zeros((H, W, 3), np.float32)
    img[:] = np.array([0xc9, 0x9d, 0x72]) / 255

    def over(mask, color, alpha=1.0):
        c = np.array(color[:3]) if not isinstance(color, str) else np.array([int(color[i:i + 2], 16) for i in (1, 3, 5)]) / 255
        a = (mask.astype(np.float32) * alpha)[..., None]
        img[:] = img * (1 - a) + c * a

    over((xx % 7) < 2, (90 / 255, 60 / 255, 30 / 255), 0.10)
    over((yy % 9) < 2, (255 / 255, 240 / 255, 215 / 255), 0.10)

    def stroke_rect(x, y, w, h, lw, color):
        half = lw / 2
        outer = (xx >= x - half) & (xx <= x + w + half) & (yy >= y - half) & (yy <= y + h + half)
        inner = (xx > x + half) & (xx < x + w - half) & (yy > y + half) & (yy < y + h - half)
        over(outer & ~inner, color)

    stroke_rect(40, 40, W - 80, H - 80, 34, ACCENT)
    stroke_rect(92, 92, W - 184, H - 184, 10, PAPER)
    stroke_rect(116, 116, W - 232, H - 232, 6, '#a7623f')
    for i in range(7):
        cx = 190 + i * ((W - 380) / 6)
        diamond = (np.abs(xx - cx) / 26 + np.abs(yy - H / 2) / 34) <= 1
        over(diamond, (251 / 255, 246 / 255, 236 / 255), 0.55)

    rgba = np.concatenate([img, np.ones((H, W, 1), np.float32)], axis=2)
    image = bpy.data.images.new('RugWeave', W, H, alpha=False)
    image.colorspace_settings.name = 'sRGB'
    image.pixels.foreach_set(rgba[::-1].ravel())  # Blender rows start at the bottom
    image.pack()
    return image


def desk():
    top = box('DeskTop', (DESK_WIDTH, 0.06, 1.4), mat('Walnut', WALNUT, 0.7), loc=(0, DESK_TOP - 0.03, 0), bevel=0.02)
    leg_m = mat('WalnutDark', WALNUT_DARK, 0.7)
    legs = [box('Leg', (0.08, DESK_TOP - 0.06, 0.08), leg_m, loc=(x, (DESK_TOP - 0.06) / 2, z), bevel=0.014, segments=2)
            for x in (-1.55, 1.55) for z in (-0.55, 0.55)]
    rail = box('Rail', (3.1, 0.04, 0.03), leg_m, loc=(0, DESK_TOP * 0.7, -0.55))
    return [top, *legs, rail]


def chair():
    frame = mat('Frame', GRAPHITE, 0.45, 0.3)
    cushion = mat('Cushion', ACCENT, 0.9)
    LEGS, LEG_LEN, CASTER_R, BASE_Y, SEAT_Y = 5, 0.72, 0.075, 0.18, 1.0
    parts = []
    for i in range(LEGS):
        a = i / LEGS * math.tau
        leg = box('ChairLeg', (0.1, 0.06, LEG_LEN), frame, loc=(0, BASE_Y, LEG_LEN / 2), bevel=0.012, segments=2)
        caster = sphere('Caster', CASTER_R, frame, loc=(0, CASTER_R, LEG_LEN - 0.02))
        parts += place([leg, caster], rot=(0, a, 0))
    parts.append(cylinder('Lift', 0.05, 0.08, SEAT_Y - BASE_Y, frame, loc=(0, (BASE_Y + SEAT_Y) / 2, 0), segs=16))
    parts.append(box('Seat', (1.2, 0.18, 1.12), cushion, loc=(0, SEAT_Y + 0.07, 0.03), bevel=0.08, segments=4))
    back = [
        box('BackBar', (0.16, 0.6, 0.05), frame, loc=(0, 0.25, -0.03)),
        box('Back', (1.1, 0.86, 0.14), cushion, loc=(0, 0.7, 0.03), bevel=0.07, segments=4),
    ]
    parts += place(back, loc=(0, SEAT_Y, -0.54), rot=(-0.14, 0, 0))
    for side in (-1, 1):
        arm = [
            box('ArmPost', (0.07, 0.42, 0.1), frame, loc=(0, 0.21, 0)),
            box('ArmPad', (0.14, 0.06, 0.58), frame, loc=(0, 0.44, 0.03), bevel=0.025, segments=2),
        ]
        parts += place(arm, loc=(side * 0.66, SEAT_Y, 0.02))
    return place(parts, loc=(-2.15, 0, 1.55), rot=(0, 1.2, 0))


def ring(name, r_out, r_in, material, loc, rot, segs=32):
    bm = bmesh.new()
    outer = bmesh.ops.create_circle(bm, cap_ends=False, segments=segs, radius=r_out)['verts']
    inner = bmesh.ops.create_circle(bm, cap_ends=False, segments=segs, radius=r_in)['verts']
    for i in range(segs):
        bm.faces.new((outer[i], outer[(i + 1) % segs], inner[(i + 1) % segs], inner[i]))
    o = new_obj(name, bm)
    finish(o, material, loc=loc, rot=rot)
    return o


def tower():
    """Mid-tower with a glass side on +x showing the parts inside, front panel facing +z."""
    W, H, D, T = 0.42, 1.0, 0.9, 0.02  # outer size and panel thickness
    Y0 = 0.03  # standing on its feet
    cy = Y0 + H / 2
    steel = mat('Case', '#1c1a19', 0.55, 0.2)
    inside = mat('CaseInside', '#141312', 0.8)
    front_m = mat('Grille', '#2a2725', 0.9)
    parts = [
        box('CaseLeft', (T, H, D), steel, loc=(-W / 2 + T / 2, cy, 0), bevel=0.008),
        box('CaseTop', (W, T, D), steel, loc=(0, Y0 + H - T / 2, 0), bevel=0.008),
        box('CaseBottom', (W, T, D), steel, loc=(0, Y0 + T / 2, 0), bevel=0.008),
        box('CaseBack', (W, H, T), inside, loc=(0, cy, -D / 2 + T / 2)),
        box('CaseFront', (W, H, 0.04), front_m, loc=(0, cy, D / 2 - 0.02), bevel=0.02),
        # glass frame: thin rails around the window
        box('Rail', (0.012, T, D), steel, loc=(W / 2 - 0.006, Y0 + H - T / 2, 0)),
        box('Rail', (0.012, T, D), steel, loc=(W / 2 - 0.006, Y0 + T / 2, 0)),
    ]
    # vent ribs on the front panel and the top
    for i in range(9):
        y = Y0 + 0.16 + i * 0.075
        parts.append(box('Rib', (W - 0.12, 0.012, 0.01), mat('Rib', '#191716', 0.7), loc=(0.01, y, D / 2 + 0.003)))
    for i in range(6):
        z = -D / 2 + 0.14 + i * 0.06
        parts.append(box('TopRib', (W - 0.14, 0.006, 0.02), mat('Rib', '#191716', 0.7), loc=(0, Y0 + H + 0.002, z)))

    # inside: motherboard on the far wall, PSU shroud at the bottom, CPU cooler, GPU, RAM
    board_x = -W / 2 + T + 0.006
    parts.append(box('Board', (0.012, 0.62, 0.6), mat('Board', '#1f2a25', 0.6), loc=(board_x, cy + 0.12, -0.08)))
    parts.append(box('Shroud', (W - T - 0.01, 0.2, D - 0.06), mat('Shroud', '#1a1817', 0.7), loc=(T / 2, Y0 + T + 0.1, 0)))
    cooler_x = board_x + 0.09
    parts.append(box('Cooler', (0.16, 0.16, 0.06), mat('Fins', '#8d8682', 0.35, 0.8), loc=(cooler_x, cy + 0.22, -0.12), bevel=0.006))
    parts.append(box('CoolerFan', (0.17, 0.17, 0.025), mat('FanBody', '#121111', 0.6), loc=(cooler_x, cy + 0.22, -0.075), bevel=0.01))
    gpu_m = mat('Gpu', '#3a3633', 0.5, 0.3)
    parts.append(box('Gpu', (0.14, 0.05, 0.5), gpu_m, loc=(board_x + 0.07, cy - 0.06, -0.02), bevel=0.008))
    parts.append(box('GpuPlate', (0.14, 0.008, 0.5), mat('GpuPlate', '#57504b', 0.35, 0.8), loc=(board_x + 0.07, cy - 0.03, -0.02)))
    for i in range(4):
        parts.append(box('Ram', (0.035, 0.12, 0.008), mat('Ram', '#24201e', 0.5), loc=(board_x + 0.024, cy + 0.22, 0.02 + i * 0.022)))

    glow = mat('Glow', GLOW_GREEN, 1.0, emit=GLOW_GREEN, emit_strength=6.0)
    glows = [
        # front light strip and power button
        plane('Strip', 0.012, H - 0.12, glow, loc=(-W / 2 + 0.035, cy, D / 2 + 0.004)),
        cylinder('Button', 0.018, 0.018, 0.008, glow, loc=(0, Y0 + H - 0.07, D / 2 + 0.004), rot=(math.pi / 2, 0, 0), segs=16),
        # front intake fans seen side-on through the glass, rear fan, cooler ring, GPU edge, RAM tops
        ring('Fan', 0.075, 0.062, glow, loc=(0.1, cy + 0.2, D / 2 - 0.2), rot=(0, math.pi / 2, 0)),
        ring('Fan', 0.075, 0.062, glow, loc=(0.1, cy - 0.02, D / 2 - 0.2), rot=(0, math.pi / 2, 0)),
        ring('Fan', 0.062, 0.05, glow, loc=(0.1, cy + 0.26, -D / 2 + 0.14), rot=(0, math.pi / 2, 0)),
        ring('CoolerRing', 0.07, 0.06, glow, loc=(cooler_x, cy + 0.22, -0.061), rot=(0, 0, 0)),
        box('GpuEdge', (0.004, 0.008, 0.44), glow, loc=(board_x + 0.141, cy - 0.06, -0.02)),
    ]
    for i in range(4):
        glows.append(box('RamGlow', (0.035, 0.006, 0.008), glow, loc=(board_x + 0.024, cy + 0.283, 0.02 + i * 0.022)))

    feet_m = mat('Feet', '#0e0d0c', 0.8)
    parts += [cylinder('Foot', 0.03, 0.03, 0.03, feet_m, loc=(sx * (W / 2 - 0.05), 0.015, sz * (D / 2 - 0.08)), segs=12)
              for sx in (-1, 1) for sz in (-1, 1)]

    # tempered glass: lets light through in the bake, drawn as a faint tint on the site
    gm = bpy.data.materials.new('GlassTint')
    gm.use_nodes = True
    gm.node_tree.nodes['Principled BSDF'].inputs['Alpha'].default_value = 0.0
    glass = plane('Glass', D - 0.02, H - 0.04, gm, loc=(W / 2 - 0.004, cy, 0), rot=(0, math.pi / 2, 0))

    # turned so the glass side faces the camera, clear of the desk legs
    loc, rot = (0.95, 0, -0.05), (0, -0.7, 0)
    body = place(parts, loc=loc, rot=rot)
    place(glows, loc=loc, rot=rot)
    place([glass], loc=loc, rot=rot)
    # a little green spill inside, as the fans would give
    light('POINT', 'CaseGlow', (loc[0] + 0.05, cy, loc[2] + 0.05), GLOW_GREEN, 12.0, shadow_soft_size=0.15)
    # and a soft white fill so the parts read through the glass
    light('POINT', 'CaseFill', (loc[0] + 0.1, cy + 0.3, loc[2] + 0.1), '#dfe8ff', 6.0, shadow_soft_size=0.2)
    return body, glows, glass


def lamp():
    metal = mat('LampMetal', GRAPHITE, 0.45, 0.3)
    base = [
        cylinder('LampBase', 0.1, 0.11, 0.02, metal, loc=(0, 0.01, 0)),
        cylinder('LampPole', 0.008, 0.008, 0.42, metal, loc=(0, 0.22, 0), segs=12),
    ]
    shade = mat('Shade', '#f0dcb8', 0.8, emit='#ffb766', emit_strength=0.6)
    head = [
        cylinder('LampArm', 0.008, 0.008, 0.2, metal, loc=(0, 0.1, 0), segs=12),
        cylinder('LampShade', 0.035, 0.09, 0.15, shade, loc=(0, 0.22, 0), cap=False),
    ]
    # the shade is open: give it a back face so it reads from inside
    for o in head[1:]:
        mod = o.modifiers.new('thick', 'SOLIDIFY')
        mod.thickness = 0.004
        bpy.context.view_layer.objects.active = o
        bpy.ops.object.modifier_apply(modifier=mod.name)
    bulb = sphere('Bulb', 0.028, mat('Bulb', '#ffe2b0', 1.0, emit='#ffe2b0', emit_strength=12.0), loc=(0, 0.17, 0))
    place(head + [bulb], loc=(0, 0.43, 0), rot=(0, 0, LAMP_TILT))
    place(base + head + [bulb], loc=LAMP_POS)
    return base + head, bulb


def books():
    specs = [((0.3, 0.045, 0.21), ACCENT, 0.08, 0.0225),
             ((0.27, 0.035, 0.2), '#c9714f', -0.12, 0.0625),
             ((0.25, 0.04, 0.19), '#eee3cf', 0.2, 0.1)]
    parts = [box('Book', s, mat('Book' + c, c, 0.85), loc=(0, y, 0), rot=(0, r, 0), bevel=0.005, segments=2) for s, c, r, y in specs]
    return place(parts, loc=(1.0, DESK_TOP, -0.22))


def plant():
    parts = [
        cylinder('Pot', 0.26, 0.19, 0.4, mat('Pot', '#b9714f', 0.85), loc=(0, 0.2, 0), segs=28),
        cylinder('Soil', 0.24, 0.24, 0.002, mat('Soil', '#3a2a20', 1.0), loc=(0, 0.39, 0), segs=28),
    ]
    for i in range(9):
        a = i / 9 * math.tau
        lean = 0.35 + (i % 3) * 0.18
        h = 0.55 + (i % 3) * 0.14
        color = '#2f7a5f' if i % 2 else ACCENT
        leaf = sphere('Leaf', 1.0, mat('Leaf' + color, color, 0.7), loc=(0, h / 2, 0), scale=(0.07, h / 2, 0.025))
        parts += place([leaf], loc=(0, 0.4, 0), rot=(0, a, lean))
    return place(parts, loc=(2.4, 0, -0.65))


def window():
    """Casement window set in the wall opening: walnut casing, two sashes with glass, a deep sill."""
    wood = mat('Walnut', WALNUT, 0.7)
    trim = mat('WalnutDark', WALNUT_DARK, 0.7)
    W, H = WIN_W, WIN_H
    cx, cy, wz = WIN_POS
    parts = []
    # casing on the wall face around the opening
    c, ct = 0.09, 0.022
    parts += [
        box('Casing', (W + 2 * c, c, ct), wood, loc=(cx, cy + H / 2 + c / 2, wz + ct / 2), bevel=0.006, segments=2),
        box('Casing', (c, H, ct), wood, loc=(cx - W / 2 - c / 2, cy, wz + ct / 2), bevel=0.006, segments=2),
        box('Casing', (c, H, ct), wood, loc=(cx + W / 2 + c / 2, cy, wz + ct / 2), bevel=0.006, segments=2),
    ]
    # sill (stool) jutting into the room, with an apron under it
    parts.append(box('Sill', (W + 0.34, 0.045, 0.26), wood, loc=(cx, cy - H / 2 - 0.0225, wz - 0.03), bevel=0.01, segments=2))
    parts.append(box('Apron', (W + 0.14, 0.1, ct), trim, loc=(cx, cy - H / 2 - 0.095, wz + ct / 2), bevel=0.005, segments=2))

    # the window unit, set halfway into the reveal
    uz = wz - 0.09
    f, fd = 0.05, 0.07  # outer frame width and depth
    parts += [
        box('Frame', (W, f, fd), wood, loc=(cx, cy + H / 2 - f / 2, uz)),
        box('Frame', (W, f, fd), wood, loc=(cx, cy - H / 2 + f / 2, uz)),
        box('Frame', (f, H, fd), wood, loc=(cx - W / 2 + f / 2, cy, uz)),
        box('Frame', (f, H, fd), wood, loc=(cx + W / 2 - f / 2, cy, uz)),
    ]
    glass_m = bpy.data.materials.new('WindowGlass')
    glass_m.use_nodes = True
    glass_m.node_tree.nodes['Principled BSDF'].inputs['Alpha'].default_value = 0.0
    glass = []
    # two sashes side by side, each with its own frame and a transom bar near the top
    sw, sh = (W - 2 * f) / 2, H - 2 * f
    s, sd = 0.045, 0.05
    for side in (-1, 1):
        sx = cx + side * sw / 2
        parts += [
            box('Sash', (sw, s, sd), wood, loc=(sx, cy + sh / 2 - s / 2, uz + 0.005), bevel=0.004, segments=2),
            box('Sash', (sw, s, sd), wood, loc=(sx, cy - sh / 2 + s / 2, uz + 0.005), bevel=0.004, segments=2),
            box('Sash', (s, sh, sd), wood, loc=(sx - sw / 2 + s / 2, cy, uz + 0.005), bevel=0.004, segments=2),
            box('Sash', (s, sh, sd), wood, loc=(sx + sw / 2 - s / 2, cy, uz + 0.005), bevel=0.004, segments=2),
            box('Transom', (sw - 2 * s, 0.03, 0.035), wood, loc=(sx, cy + sh * 0.22, uz + 0.005)),
        ]
        glass.append(plane('WindowGlass', sw - 2 * s, sh - 2 * s, glass_m, loc=(sx, cy, uz)))
        # handle on the meeting stiles
        parts.append(box('Handle', (0.014, 0.09, 0.02), mat('LampMetal', GRAPHITE, 0.45, 0.3),
                         loc=(sx - side * (sw / 2 - s / 2), cy - 0.05, uz + 0.04), bevel=0.004, segments=2))
    return parts, glass


def outside():
    """The city at night seen from a high floor: blocks of flats with lit windows, rooftops in the moonlight."""
    rng = random.Random(7)
    facade = [mat('Facade' + c, c, 0.9) for c in ('#23262e', '#2a2a30', '#1e2129', '#2c2826')]
    roof = mat('Roof', '#30323a', 0.9)
    warm = mat('CityWarm', '#ffcf8a', 1.0, emit='#ffcf8a', emit_strength=3.0)
    cool = mat('CityCool', '#bcd4ff', 1.0, emit='#bcd4ff', emit_strength=3.0)
    base_y = -14.0
    bodies, warm_w, cool_w = [], [], []
    rows = [(-6.0, -6.5), (-12.0, -4.5), (-19.0, -3.0), (-27.0, -2.2)]
    for r, (z, top_mid) in enumerate(rows):
        x = -34.0 + rng.uniform(0, 1.5)
        while x < 14:
            w = rng.uniform(1.4, 3.2)
            d = rng.uniform(1.6, 3.0)
            top = top_mid + rng.uniform(-1.2, 1.2)
            h = top - base_y
            bx = x + w / 2
            bodies.append(box('Block', (w, h, d), facade[rng.randrange(len(facade))], loc=(bx, base_y + h / 2, z - d / 2)))
            bodies.append(box('RoofCap', (w + 0.08, 0.08, d + 0.08), roof, loc=(bx, top + 0.04, z - d / 2)))
            if rng.random() < 0.45:
                tw, th = rng.uniform(0.3, 0.7), rng.uniform(0.25, 0.6)
                bodies.append(box('RoofBox', (tw, th, tw), roof, loc=(bx + rng.uniform(-w / 3, w / 3), top + th / 2 + 0.08, z - d / 2)))
            # windows on the face towards us, a grid with some lit
            cols = max(2, int((w - 0.3) / 0.42))
            gap = (w - 0.3) / cols
            y = top - 0.45
            while y > base_y + 0.6:
                for c in range(cols):
                    if rng.random() < 0.42:
                        wx = x + 0.15 + gap * (c + 0.5)
                        target = warm_w if rng.random() < 0.8 else cool_w
                        target.append(plane('Win', 0.26, 0.34, warm if target is warm_w else cool, loc=(wx, y, z + 0.004)))
                y -= 0.55
            x += w + rng.uniform(0.15, 0.6)
    # street lamps along the roads between the rows
    for z in (-6.6, -12.8, -19.9):
        for i in range(14):
            lx = -32 + i * 3.4 + rng.uniform(-0.4, 0.4)
            warm_w.append(plane('Lamp', 0.22, 0.22, warm, loc=(lx, base_y + 1.1, z + 0.4)))
    ground = plane('Ground', 100, 50, mat('Ground', '#14151a', 1.0), loc=(-10, base_y, -20), rot=(-math.pi / 2, 0, 0))
    return join('Outside', bodies + [ground]), join('CityWarm', warm_w), join('CityCool', cool_w)


def stand_ins():
    """Menu objects, only so they shadow the desk and light it. Not exported."""
    dark = mat('Proxy', GRAPHITE, 0.5)
    light = mat('ProxyLight', PAPER, 0.6)
    mx, my, mz = MONITOR_POS
    screen = mat('Screen', '#1b1d24', 0.5, emit='#a9c1ff', emit_strength=1.6)
    objs = [
        # same shape as blender/monitor.py: base plate, leaning arm, panel with a deeper back
        box('MonBase', (0.5, 0.018, 0.27), dark, loc=(mx, my + 0.009, mz - 0.03)),
        box('MonArm', (0.075, 0.65, 0.032), dark, loc=(mx, my + 0.345, mz - 0.088), rot=(-0.12, 0, 0)),
        box('MonBody', (1.6, 0.95, 0.03), dark, loc=(mx, my + 0.72, mz + 0.01), bevel=0.018),
        box('MonHump', (0.9, 0.55, 0.05), dark, loc=(mx, my + 0.68, mz - 0.04)),
        plane('MonScreen', 1.5, 0.844, screen, loc=(mx, my + 0.72, mz + 0.0256)),
        box('Keys', (1.6, 0.06, 0.46), mat('ProxyKeys', '#4a403a', 0.6), loc=(KEYBOARD_POS[0], DESK_TOP + 0.03, KEYBOARD_POS[2])),
        box('Notebook', (0.5, 0.045, 0.66), light, loc=(NOTEBOOK_POS[0], DESK_TOP + 0.0225, NOTEBOOK_POS[2]), rot=(0, NOTEBOOK_ROT, 0)),
        box('Phone', (0.2, 0.012, 0.4), mat('ProxyPhone', '#5a4a40', 0.5), loc=(PHONE_POS[0], DESK_TOP + 0.006, PHONE_POS[2]), rot=(0, PHONE_ROT, 0)),
        cylinder('Mug', 0.16, 0.147, 0.35, light, loc=(MUG_POS[0], DESK_TOP + 0.175, MUG_POS[2]), segs=32),
    ]
    return objs


# ---------------------------------------------------------------- lights
def aim(obj, target):
    d = Vector(target) - obj.location
    obj.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()


def light(kind, name, loc, color, energy, **kw):
    data = bpy.data.lights.new(name, kind)
    data.color = lin(color)[:3]
    data.energy = energy
    for k, v in kw.items():
        setattr(data, k, v)
    o = link(bpy.data.objects.new(name, data))
    o.location = loc
    return o


def lights():
    lx, ly, lz = LAMP_POS
    spot = light('SPOT', 'LampSpot', (lx + 0.08, ly + 0.52, lz), '#ffb35e', 170, spot_size=1.7, spot_blend=1.0, shadow_soft_size=0.04)
    aim(spot, (0.9, DESK_TOP, -0.05))
    light('POINT', 'LampBulb', (lx + 0.15, ly + 0.6, lz + 0.1), '#ffb35e', 130, shadow_soft_size=0.06)

    # moonlight through the window opening, raking down over the desk and floor
    sun = light('SUN', 'Moon', (0, 10, -10), '#9fb4ff', 1.4, angle=math.radians(3))
    sun.rotation_euler = Vector((0.4, -4.7, 4.0)).to_track_quat('-Z', 'Y').to_euler()

    # the night sky itself, a soft cool panel just outside the opening
    sky = light('AREA', 'Sky', (WIN_POS[0], WIN_POS[1], WALL_Z - 0.3), '#8fa8ff', 70, shape='RECTANGLE', size=WIN_W, size_y=WIN_H)
    aim(sky, (WIN_POS[0], WIN_POS[1] - 0.6, WALL_Z + 3))

    world = bpy.data.worlds.new('Night')
    bpy.context.scene.world = world
    bg = world.node_tree.nodes['Background']
    bg.inputs['Color'].default_value = lin('#c9d4ff')
    bg.inputs['Strength'].default_value = 0.12


# ---------------------------------------------------------------- bake
def setup_cycles():
    scene = bpy.context.scene
    scene.render.engine = 'CYCLES'
    scene.cycles.samples = SAMPLES
    scene.cycles.use_denoising = False
    scene.cycles.max_bounces = 6
    scene.cycles.diffuse_bounces = 4
    try:
        prefs = bpy.context.preferences.addons['cycles'].preferences
        for backend in ('OPTIX', 'CUDA', 'HIP', 'ONEAPI'):
            try:
                prefs.compute_device_type = backend
                prefs.get_devices()
                gpus = [d for d in prefs.devices if d.type != 'CPU']
                if gpus:
                    for d in prefs.devices:
                        d.use = d.type != 'CPU'
                    scene.cycles.device = 'GPU'
                    print('bake device:', backend, [d.name for d in gpus])
                    break
            except TypeError:
                continue
    except Exception as e:  # noqa: BLE001
        print('GPU setup failed, using CPU:', e)
    scene.view_settings.view_transform = 'Standard'
    scene.view_settings.look = 'None'
    scene.render.bake.margin = 8
    scene.render.bake.use_pass_direct = True
    scene.render.bake.use_pass_indirect = True
    scene.render.bake.use_pass_diffuse = True
    scene.render.bake.use_pass_glossy = False
    scene.render.bake.use_pass_transmission = False
    scene.render.bake.use_pass_emit = True


def lightmap_uv(obj, margin):
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    uv = obj.data.uv_layers.new(name='Bake')
    obj.data.uv_layers.active = uv
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.uv.smart_project(angle_limit=math.radians(60), island_margin=margin, area_weight=0.0, scale_to_bounds=False)
    bpy.ops.uv.pack_islands(rotate=True, margin=margin)
    bpy.ops.object.mode_set(mode='OBJECT')


def bake(obj, size, name):
    img = bpy.data.images.new(name, size, size, float_buffer=True, alpha=False)
    for m in {s.material for s in obj.material_slots if s.material}:
        nt = m.node_tree
        node = nt.nodes.get('BakeTarget') or nt.nodes.new('ShaderNodeTexImage')
        node.name = 'BakeTarget'
        node.image = img
        uvn = nt.nodes.get('BakeUV') or nt.nodes.new('ShaderNodeUVMap')
        uvn.name = 'BakeUV'
        uvn.uv_map = 'Bake'
        nt.nodes.active = node
    # materials that read their own UVs (the rug) must not lose them: only the lightmap is the render target
    obj.data.uv_layers['Bake'].active = True
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    print('baking', name, size, 'px,', SAMPLES, 'samples')
    bpy.ops.object.bake(type='COMBINED', use_clear=True, margin=8)
    os.makedirs(WORK_DIR, exist_ok=True)
    exr = os.path.join(WORK_DIR, name + '.exr')
    img.filepath_raw = exr
    img.file_format = 'OPEN_EXR'
    img.save()
    return img


def save_webp(img, path, quality=86):
    s = bpy.context.scene.render.image_settings
    s.file_format = 'WEBP'
    s.color_mode = 'RGB'
    s.quality = quality
    img.save_render(path)


def strip_uvs(obj):
    for uv in list(obj.data.uv_layers):
        if uv.name != 'Bake':
            obj.data.uv_layers.remove(uv)


def main():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    setup_cycles()

    shell_obj = shell()
    rug_obj = rug()
    tower_body, glows, glass = tower()
    lamp_parts, bulb = lamp()
    win_parts, win_glass = window()
    props_obj = join('Props', desk() + chair() + tower_body + lamp_parts + books() + plant() + win_parts)
    join('WindowGlass', win_glass)
    outside_obj, _, _ = outside()
    join('Glow', glows)
    bulb.name = 'Bulb'
    stand_ins()
    lights()

    lightmap_uv(shell_obj, 0.004)
    lightmap_uv(rug_obj, 0.01)
    lightmap_uv(props_obj, 0.003)
    lightmap_uv(outside_obj, 0.004)

    imgs = {
        'shell': bake(shell_obj, ATLAS['shell'], 'room-shell'),
        'rug': bake(rug_obj, ATLAS['rug'], 'room-rug'),
        'props': bake(props_obj, ATLAS['props'], 'room-props'),
        'outside': bake(outside_obj, ATLAS['outside'], 'room-outside'),
    }
    os.makedirs(OUT_DIR, exist_ok=True)
    for key, img in imgs.items():
        save_webp(img, os.path.join(OUT_DIR, f'room-{key}.webp'))

    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(WORK_DIR, 'room.blend'))

    export()


def export():
    """Only what the site draws, with the lightmap as the one UV set, meshopt-compressed."""
    names = ('Shell', 'Rug', 'Props', 'Outside', 'Glow', 'Bulb', 'Glass', 'WindowGlass', 'CityWarm', 'CityCool')
    objs = [bpy.data.objects[n] for n in names]
    for o in objs[:4]:
        strip_uvs(o)
    bpy.ops.object.select_all(action='DESELECT')
    for o in objs:
        o.select_set(True)
    bpy.ops.export_scene.gltf(
        filepath=os.path.join(OUT_DIR, 'room.glb'),
        export_format='GLB',
        use_selection=True,
        export_yup=False,
        export_materials='NONE',
        export_normals=False,
        export_apply=True,
        export_meshopt_compression_enable=True,
    )
    for f in sorted(os.listdir(OUT_DIR)):
        print(f, os.path.getsize(os.path.join(OUT_DIR, f)))


if EXPORT_ONLY:
    bpy.ops.wm.open_mainfile(filepath=os.path.join(WORK_DIR, 'room.blend'))
    export()
else:
    main()
