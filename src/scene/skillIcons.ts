import {
  siCss,
  siGit,
  siJavascript,
  siModelcontextprotocol,
  siN8n,
  siNodedotjs,
  siPython,
  siReact,
  siSupabase,
  siThreedotjs,
  siTypescript,
} from 'simple-icons'

/** Brand logos for the skill keys, keyed by skill id from content.ts. */
export type SkillIcon =
  | { kind: 'path'; path: string; color: string }
  | { kind: 'database'; color: string }
  | { kind: 'oracle'; color: string }

const brand = (icon: { path: string; hex: string }, color = `#${icon.hex}`): SkillIcon => ({
  kind: 'path',
  path: icon.path,
  color,
})

export const SKILL_ICONS: Record<string, SkillIcon> = {
  // React's own cyan is too pale on a paper keycap, so it is darkened
  react: brand(siReact, '#1a9ec4'),
  // same for JavaScript's yellow
  javascript: brand(siJavascript, '#e0b90b'),
  typescript: brand(siTypescript),
  node: brand(siNodedotjs),
  // not in simple-icons: Oracle's red capsule is drawn directly
  oracle: { kind: 'oracle', color: '#f80000' },
  python: brand(siPython),
  supabase: brand(siSupabase),
  mcp: brand(siModelcontextprotocol, '#2b2320'),
  n8n: brand(siN8n),
  // three.js is pure black, so it gets the same espresso as the desk hardware
  three: brand(siThreedotjs, '#2b2320'),
  css: brand(siCss),
  git: brand(siGit),
  // no SQL brand mark: a generic database cylinder in neutral slate
  sql: { kind: 'database', color: '#3f4f60' },
}
