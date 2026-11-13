import type { Localized } from './types'

export const profile = {
  /** The business name, shown as the logo at the top of the desk. */
  brand: 'decastro',
  brandTld: '.dev',
  name: 'João Gabriel Duarte',
  role: {
    en: 'Software Developer',
    pt: 'Desenvolvedor de Software',
  } as Localized,
  location: 'São José dos Campos, SP',
  email: 'decastrodeveloper@gmail.com',
  linkedIn: 'https://www.linkedin.com/in/joaoduarte010/',
  linkedInLabel: 'linkedin.com/in/joaoduarte010',
  github: 'https://github.com/joao7duarte',
  githubLabel: 'github.com/joao7duarte',
  /** One-page PDFs in public/curriculo, made from the master CV without the phone number. */
  resumeUrl: {
    en: '/curriculo/Joao-Gabriel-Duarte-de-Castro-Resume.pdf',
    pt: '/curriculo/Joao-Gabriel-Duarte-de-Castro-Curriculo.pdf',
  } as Localized,
}
