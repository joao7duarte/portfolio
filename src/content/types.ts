export type View = 'desk' | 'projects' | 'skills' | 'experience' | 'contact'

export type Lang = 'en' | 'pt'

export type Localized = Record<Lang, string>

export type Skill = {
  id: string
  name: string
  keyLabel: string
  blurb: Localized
}

export type Project = {
  id: string
  name: Localized
  summary: Localized
  problem: Localized
  role: Localized
  skillIds: string[]
  liveUrl?: string
  image?: { src: string; alt: Localized; caption: Localized }
  /** Kept in the code but left off the site. */
  hidden?: boolean
}

export type Job = {
  company: string
  title: Localized
  period: Localized
  summary: Localized
}

export type Education = {
  school: string
  degree: Localized
  period: Localized
}
