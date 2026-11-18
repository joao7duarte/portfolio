"""Builds the desk mug and exports it to public/models/mug.glb.

Run from the repo root:
  "C:/Program Files/Blender Foundation/Blender 5.3/blender.exe" -b -P blender/mug.py

Units match the site: 1 unit = the scene's unit (mug 0.32 wide, 0.35 tall),
origin at the centre of the base, handle on +X, logo facing the camera (-Y in Blender, +Z in three.js).
"""
import math
import os

import bmesh
import bpy

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_GLB = os.path.join(ROOT, 'public', 'models', 'mug.glb')
OUT_BLEND = os.path.join(ROOT, 'blender', 'mug.blend')

R = 0.16  # top outer radius
H = 0.35  # height
BASE = R * 0.92  # bottom outer radius (slight taper)
WALL = 0.011
SEGMENTS = 40

PAPER = '#fbf6ec'
COFFEE = '#3b2216'
LOGO = '#4caf50'


def lin(hex_color):
    """sRGB hex to linear RGBA, as Blender and glTF expect."""
    h = hex_color.lstrip('#')
    out = []
    for i in (0, 2, 4):
        c = int(h[i:i + 2], 16) / 255
        out.append(c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4)
    return (*out, 1.0)


def material(name, color, roughness, coat=0.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    bsdf = m.node_tree.nodes['Principled BSDF']
    bsdf.inputs['Base Color'].default_value = lin(color)
    bsdf.inputs['Roughness'].default_value = roughness
    if coat and 'Coat Weight' in bsdf.inputs:
        bsdf.inputs['Coat Weight'].default_value = coat
    return m


def outer_radius(z):
    """Outer wall radius at height z (linear taper from base to lip)."""
    t = max(0.0, min(1.0, (z - 0.012) / (H - 0.012)))
    return BASE + (R - BASE) * t


def body():
    # profile in the XZ plane, from the outside of the foot, up and over the lip, down the inside
    r_in_top = R - WALL
    profile = [
        (0.0, 0.0),
        (BASE * 0.80, 0.0),
        (BASE * 0.93, 0.002),
        (BASE * 0.985, 0.006),
        (BASE, 0.014),
    ]
    for i in range(1, 12):
        z = 0.014 + (H - 0.02) * i / 12
        profile.append((outer_radius(z), z))
    profile += [
        (R, H - 0.006),
        (R - 0.0015, H - 0.0015),
        (R - WALL / 2, H),
        (r_in_top + 0.0015, H - 0.0015),
        (r_in_top, H - 0.006),
    ]
    floor = 0.03
    for i in range(1, 6):
        z = H - 0.006 - (H - 0.006 - floor - 0.02) * i / 6
        profile.append((outer_radius(z) - WALL, z))
    profile += [
        (outer_radius(floor) - WALL - 0.008, floor + 0.003),
        (outer_radius(floor) - WALL - 0.02, floor),
        (0.0, floor),
    ]

    bm = bmesh.new()
    verts = [bm.verts.new((r, 0.0, z)) for r, z in profile]
    edges = [bm.edges.new((verts[i], verts[i + 1])) for i in range(len(verts) - 1)]
    bmesh.ops.spin(bm, geom=verts + edges, cent=(0, 0, 0), axis=(0, 0, 1), angle=math.tau, steps=SEGMENTS, use_merge=True)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
    mesh = bpy.data.meshes.new('MugBody')
    bm.to_mesh(mesh)
    bm.free()
    obj = bpy.data.objects.new('MugBody', mesh)
    bpy.context.collection.objects.link(obj)
    return obj


def handle():
    curve = bpy.data.curves.new('HandlePath', 'CURVE')
    curve.dimensions = '3D'
    spline = curve.splines.new('BEZIER')
    pts = [
        (outer_radius(H * 0.80) - 0.01, 0, H * 0.80),
        (R + 0.075, 0, H * 0.74),
        (R + 0.085, 0, H * 0.46),
        (outer_radius(H * 0.24) - 0.01, 0, H * 0.24),
    ]
    spline.bezier_points.add(len(pts) - 1)
    for bp, co in zip(spline.bezier_points, pts):
        bp.co = co
        bp.handle_left_type = bp.handle_right_type = 'AUTO'
    curve.bevel_depth = 0.019
    curve.bevel_resolution = 3
    curve.resolution_u = 12
    curve.use_fill_caps = True
    obj = bpy.data.objects.new('Handle', curve)
    bpy.context.collection.objects.link(obj)
    # flatten the tube a little so it reads as a ceramic strap, not a pipe
    obj.scale = (1, 0.75, 1)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.convert(target='MESH')
    bpy.ops.object.transform_apply(scale=True)
    obj.select_set(False)
    return obj


def coffee():
    z = H - 0.045
    bpy.ops.mesh.primitive_circle_add(vertices=SEGMENTS, radius=outer_radius(z) - WALL - 0.001, fill_type='NGON', location=(0, 0, z))
    obj = bpy.context.active_object
    obj.name = 'Coffee'
    obj.select_set(False)
    return obj


def logo():
    """The </> mark, wrapped onto the front of the mug."""
    text = bpy.data.curves.new('LogoText', 'FONT')
    text.body = '</>'
    text.size = 0.085
    text.extrude = 0.0012
    text.align_x = 'CENTER'
    text.align_y = 'CENTER'
    obj = bpy.data.objects.new('Logo', text)
    bpy.context.collection.objects.link(obj)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.convert(target='MESH')
    obj.select_set(False)

    # densify so the glyphs can bend around the wall
    bm = bmesh.new()
    bm.from_mesh(obj.data)
    bmesh.ops.triangulate(bm, faces=bm.faces)
    bmesh.ops.subdivide_edges(bm, edges=bm.edges, cuts=1, use_grid_fill=True)
    zc = H * 0.5
    for v in bm.verts:
        x, y, depth = v.co
        z = zc + y
        r = outer_radius(z) + 0.0006 + (depth + 0.0012)
        a = x / outer_radius(z)
        v.co = (r * math.sin(a), -r * math.cos(a), z)
    bm.normal_update()
    bm.to_mesh(obj.data)
    bm.free()
    return obj


def main():
    bpy.ops.wm.read_factory_settings(use_empty=True)

    ceramic = material('Ceramic', PAPER, 0.32, coat=0.4)
    brew = material('Coffee', COFFEE, 0.12)
    mark = material('Logo', LOGO, 0.5)

    b = body()
    h = handle()
    for o in (b, h):
        o.data.materials.append(ceramic)
    c = coffee()
    c.data.materials.append(brew)
    lg = logo()
    lg.data.materials.append(mark)

    # smooth shading everywhere, with sharp edges where faces meet at hard angles
    for o in (b, h, c, lg):
        for p in o.data.polygons:
            p.use_smooth = o is not c
    bpy.ops.object.select_all(action='DESELECT')
    for o in (b, h):
        o.select_set(True)
    bpy.context.view_layer.objects.active = b
    bpy.ops.object.join()
    b.name = 'Mug'
    b.data.name = 'Mug'
    bpy.ops.object.shade_auto_smooth(angle=math.radians(40))

    os.makedirs(os.path.dirname(OUT_GLB), exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=OUT_BLEND)
    bpy.ops.export_scene.gltf(
        filepath=OUT_GLB,
        export_format='GLB',
        export_apply=True,
        export_yup=True,
        export_texcoords=False,
        export_meshopt_compression_enable=True,
    )
    print('exported', OUT_GLB, os.path.getsize(OUT_GLB), 'bytes')


main()
