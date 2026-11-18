"""Builds the desk monitor and exports it to public/models/monitor.glb.

  "C:/Program Files/Blender Foundation/Blender 5.3/blender.exe" -b -P blender/monitor.py

Built in three.js coordinates (Y up, screen facing +Z), origin where the stand meets the desk.
The screen itself is not here: the site draws it as a plane with the live code texture, 1.5 x 0.844
centred at y 0.72, z 0.0256, so the bezel's opening is sized around that.
"""
import math
import os

import bmesh
import bpy
from mathutils import Matrix

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'public', 'models', 'monitor.glb')

W, H, CY = 1.6, 0.95, 0.72  # panel size and centre height, as before
FRONT_Z = 0.025  # bezel face; the screen plane sits just in front of it


def lin(hex_color):
    h = hex_color.lstrip('#')
    out = []
    for i in (0, 2, 4):
        c = int(h[i:i + 2], 16) / 255
        out.append(c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4)
    return (*out, 1.0)


def material(name, color, rough, metal=0.0, emit=None):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = lin(color)
    b.inputs['Roughness'].default_value = rough
    b.inputs['Metallic'].default_value = metal
    if emit:
        b.inputs['Emission Color'].default_value = lin(emit)
        b.inputs['Emission Strength'].default_value = 3.0
    return m


def rounded_box(name, size, radius, segments, mat, loc=(0, 0, 0), rot=(0, 0, 0)):
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    bmesh.ops.scale(bm, vec=size, verts=bm.verts)
    if radius:
        bmesh.ops.bevel(bm, geom=bm.verts[:] + bm.edges[:], offset=radius, segments=segments, affect='EDGES', profile=0.5)
    bmesh.ops.rotate(bm, verts=bm.verts, cent=(0, 0, 0), matrix=Matrix.Rotation(rot[0], 3, 'X'))
    bmesh.ops.translate(bm, verts=bm.verts, vec=loc)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    o = bpy.data.objects.new(name, me)
    bpy.context.collection.objects.link(o)
    o.data.materials.append(mat)
    for p in me.polygons:
        p.use_smooth = True
    return o


def main():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    shell = material('Shell', '#2b2320', 0.42, 0.25)
    bezel = material('Bezel', '#141110', 0.35, 0.1)
    alu = material('Stand', '#4a403b', 0.3, 0.75)
    led = material('Led', '#4caf50', 0.4, emit='#4caf50')

    parts = []
    # front panel: thin black bezel, a slightly thicker chin
    parts.append(rounded_box('Bezel', (W, H, 0.03), 0.018, 4, bezel, loc=(0, CY, FRONT_Z - 0.015)))
    # back housing, deeper in the middle where the electronics live
    parts.append(rounded_box('Back', (W - 0.04, H - 0.04, 0.025), 0.012, 3, shell, loc=(0, CY, FRONT_Z - 0.04)))
    parts.append(rounded_box('Hump', (0.9, 0.55, 0.05), 0.03, 4, shell, loc=(0, CY - 0.04, FRONT_Z - 0.065)))
    # hinge block where the arm meets the panel
    parts.append(rounded_box('Hinge', (0.14, 0.12, 0.05), 0.015, 3, alu, loc=(0, CY - 0.07, FRONT_Z - 0.115)))
    # arm: a flat bar leaning back a little, from the base up to the hinge
    arm_h = CY - 0.05 - 0.02
    lean = 0.12
    parts.append(rounded_box('Arm', (0.075, arm_h, 0.032), 0.01, 3, alu,
                             loc=(0, 0.02 + arm_h / 2, -0.088), rot=(-lean, 0, 0)))
    # base: a thin rounded plate, set back so the arm stands over its middle
    parts.append(rounded_box('Base', (0.5, 0.018, 0.27), 0.009, 4, alu, loc=(0, 0.009, -0.03)))
    parts.append(rounded_box('Foot', (0.13, 0.03, 0.1), 0.012, 3, alu, loc=(0, 0.03, -0.05)))
    # power light on the chin
    parts.append(rounded_box('Led', (0.012, 0.004, 0.004), 0.0015, 2, led, loc=(W / 2 - 0.08, CY - H / 2 + 0.018, FRONT_Z + 0.001)))

    for o in parts:
        o.select_set(True)
    bpy.context.view_layer.objects.active = parts[0]
    bpy.ops.object.join()
    o = bpy.context.view_layer.objects.active
    o.name = 'Monitor'
    bpy.ops.object.shade_auto_smooth(angle=math.radians(35))

    bpy.ops.export_scene.gltf(
        filepath=OUT,
        export_format='GLB',
        export_yup=False,
        export_apply=True,
        export_texcoords=False,
        export_meshopt_compression_enable=True,
    )
    print('exported', OUT, os.path.getsize(OUT))


main()
