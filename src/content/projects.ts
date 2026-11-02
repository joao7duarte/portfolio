import epmsPhoto from '../assets/projects/epms.jpg'
import type { Project } from './types'

const allProjects: Project[] = [
  {
    id: 'embraer',
    name: { en: 'Embraer Program Management System', pt: 'Embraer Program Management System' },
    summary: {
      en: 'Program management system used at Embraer.',
      pt: 'Sistema de gestão de programas usado na Embraer.',
    },
    problem: {
      en: "It brings the data from the commercial aviation department together in one place, turning it into meaningful insights and dashboards.",
      pt: 'Reúne em um só lugar os dados do departamento de aviação comercial, gerando insights e dashboards com dados relevantes.',
    },
    role: {
      en: 'I develop and maintain the system: full-stack work in JavaScript, Oracle data integration and Python automation.',
      pt: 'Desenvolvo e mantenho o sistema: trabalho full-stack em JavaScript, integração de dados Oracle e automação em Python.',
    },
    skillIds: ['javascript', 'react', 'node', 'oracle', 'sql', 'python', 'git'],
    image: {
      src: epmsPhoto,
      alt: {
        en: 'João standing next to a screen showing the Embraer Program Management System presentation.',
        pt: 'João ao lado de uma tela com a apresentação do Embraer Program Management System.',
      },
      caption: { en: 'Presenting EPMS', pt: 'Apresentando o EPMS' },
    },
  },
  {
    id: 'muteki',
    name: { en: 'Muteki website', pt: 'Site Muteki' },
    summary: {
      en: 'Placeholder: one sentence on what this website is for.',
      pt: 'Provisório: uma frase sobre a finalidade deste site.',
    },
    problem: {
      en: 'Placeholder: what the website needed to achieve.',
      pt: 'Provisório: o que o site precisava alcançar.',
    },
    role: {
      en: 'Placeholder: what you designed and built.',
      pt: 'Provisório: o que você projetou e construiu.',
    },
    skillIds: ['javascript', 'css', 'supabase'],
    liveUrl: '#',
    hidden: true,
  },
]

export const projects = allProjects.filter((project) => !project.hidden)
