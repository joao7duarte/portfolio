# João Gabriel Duarte: portfolio

A portfolio site built around a 3D workshop desk. Each object opens a section: the monitor shows projects, the keyboard shows skills, the notebook shows experience and the phone shows contact details. The site is available in English and Portuguese.

Built with React, TypeScript, Vite, three.js and React Three Fiber.

## Run it

```bash
npm install
```

```bash
npm run dev
```

```bash
npm run build
```

## Structure

```
src/
  App.tsx        Holds the current view, selected skill and language
  content/       All text and data, split by subject, in both languages
  lib/           Language preference hook
  scene/         The 3D desk: room, objects, camera and drawn textures
  ui/            The HTML interface over the scene
    components/  Shared controls: language switch, section nav, back button
    views/       One file per screen or screen section
    styles/      CSS, one file per area
  assets/        Images used by the site
```

To change what the site says, edit `src/content/`. To hide a project without deleting it, set `hidden: true` on it in `src/content/projects.ts`.
