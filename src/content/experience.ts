import type { Education, Job } from './types'

export const experience: Job[] = [
  {
    company: 'Embraer',
    title: { en: 'Software Engineering Intern', pt: 'Estagiário de Engenharia de Software' },
    period: { en: 'Jan 2026 to present', pt: 'Jan. de 2026 até o momento' },
    summary: {
      en: 'I develop and maintain the Embraer Program Management System: full-stack JavaScript (Node.js, React) with Git, focused on system integration and end-to-end solutions; automation with Python (Selenium, Playwright); Oracle queries, table creation and data integration; Agile (Scrum) work with requirements analysis, QA and cross-functional teams.',
      pt: 'Desenvolvo e mantenho o Embraer Program Management System: full-stack em JavaScript (Node.js, React) com Git, com foco em integração de sistemas e soluções de ponta a ponta; automação com Python (Selenium, Playwright); consultas, criação de tabelas e integração de dados em Oracle; trabalho ágil (Scrum) com análise de requisitos, QA e times multidisciplinares.',
    },
  },
  {
    company: 'Upwork',
    title: { en: 'English Teacher (ESL), freelance', pt: 'Professor de Inglês (ESL), autônomo' },
    period: { en: 'Dec 2024 to Jan 2026', pt: 'Dez. de 2024 a jan. de 2026' },
    summary: {
      en: 'Remote English classes for children from China.',
      pt: 'Aulas de inglês remotas para crianças da China.',
    },
  },
  {
    company: 'KidsGarden',
    title: { en: 'English Teacher (ESL)', pt: 'Professor de Inglês (ESL)' },
    period: { en: 'Nov 2023 to Apr 2025', pt: 'Nov. de 2023 a abr. de 2025' },
    summary: {
      en: 'Full-time, on-site at an English school for babies and children in São José dos Campos.',
      pt: 'Tempo integral, presencial, em uma escola de inglês para bebês e crianças em São José dos Campos.',
    },
  },
]

export const education: Education[] = [
  {
    school: 'Universidade Anhembi Morumbi',
    degree: {
      en: 'Technology degree in Systems Analysis and Development',
      pt: 'Curso Superior de Tecnologia em Análise e Desenvolvimento de Sistemas',
    },
    period: { en: 'Jul 2025 to Dec 2027', pt: 'Jul. de 2025 a dez. de 2027' },
  },
  {
    school: 'Universidade Anhembi Morumbi',
    degree: { en: "Bachelor's in Business Administration", pt: 'Bacharelado em Administração' },
    period: { en: 'Jan 2024 to Dec 2027', pt: 'Jan. de 2024 a dez. de 2027' },
  },
]
