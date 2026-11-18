"""Denoises the baked lightmaps (EXR in the work dir) with OpenImageDenoise and writes the site's WebP files.

  "C:/Program Files/Blender Foundation/Blender 5.3/blender.exe" -b -P blender/denoise.py
"""
import os

import bpy

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(ROOT, 'public', 'models')
WORK_DIR = os.environ.get('BAKE_WORK_DIR', 'D:/CodeStudies/blender-work/portfolio')
NAMES = ['room-shell', 'room-rug', 'room-props']


def compositor_tree(scene):
    """Blender 5 keeps the compositor in a node group; older versions on the scene."""
    if hasattr(scene, 'compositing_node_group'):
        tree = bpy.data.node_groups.new('Denoise', 'CompositorNodeTree')
        scene.compositing_node_group = tree
        return tree, True
    scene.use_nodes = True
    return scene.node_tree, False


def main():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.render.engine = 'BLENDER_WORKBENCH'
    scene.view_settings.view_transform = 'Standard'
    scene.view_settings.look = 'None'
    cam = bpy.data.objects.new('Cam', bpy.data.cameras.new('Cam'))
    scene.collection.objects.link(cam)
    scene.camera = cam
    scene.render.resolution_percentage = 100
    s = scene.render.image_settings
    s.file_format = 'WEBP'
    s.color_mode = 'RGB'
    s.quality = 86

    tree, is_group = compositor_tree(scene)
    nodes, links = tree.nodes, tree.links
    for n in list(nodes):
        nodes.remove(n)
    src = nodes.new('CompositorNodeImage')
    den = nodes.new('CompositorNodeDenoise')
    if is_group:
        out = nodes.new('NodeGroupOutput')
        tree.interface.new_socket('Image', in_out='OUTPUT', socket_type='NodeSocketColor')
        out_socket = out.inputs[0]
    else:
        out = nodes.new('CompositorNodeComposite')
        out_socket = out.inputs['Image']
    links.new(src.outputs['Image'], den.inputs['Image'])
    links.new(den.outputs['Image'], out_socket)

    for name in NAMES:
        img = bpy.data.images.load(os.path.join(WORK_DIR, name + '.exr'))
        src.image = img
        scene.render.resolution_x, scene.render.resolution_y = img.size
        scene.render.filepath = os.path.join(OUT_DIR, name + '.webp')
        bpy.ops.render.render(write_still=True)
        print('denoised', name, os.path.getsize(scene.render.filepath))


main()
