import type { Education, Job, SpokenLanguage } from './types'

export const experience: Job[] = [
  {
    company: 'Embraer',
    title: {
      en: 'Software Engineering Intern (Full Stack Development)',
      pt: 'Estagiário de Engenharia de Software (Desenvolvimento Full Stack)',
    },
    period: { en: 'Jan 2026 to present', pt: 'Jan. de 2026 até o momento' },
    summary: {
      en: 'I build and maintain the Embraer Program Management System (JavaScript, Node.js, React, Oracle SQL) for Commercial Aviation programs. I am automating a daily manual data update with the Microsoft Graph API and Azure, expected to save about 5 hours a week.',
      pt: 'Desenvolvo e mantenho o Embraer Program Management System (JavaScript, Node.js, React, Oracle SQL) para os programas de Aviação Comercial. Estou automatizando uma atualização manual diária de dados com Microsoft Graph API e Azure, com economia prevista de cerca de 5 horas por semana.',
    },
  },
  {
    company: 'decastro.dev',
    title: {
      en: 'AI Automation & Software Developer (self-employed)',
      pt: 'Desenvolvedor de Software e Automação com IA (autônomo)',
    },
    period: { en: 'Nov 2026 to present', pt: 'Nov. de 2026 até o momento' },
    summary: {
      en: 'My own service business. I build and sell AI agents, MCP integrations and n8n workflows, self-hosted on Linux servers. Client work includes a 3D product configurator built with three.js and Supabase.',
      pt: 'Meu negócio de prestação de serviços. Desenvolvo e vendo agentes de IA, integrações MCP e fluxos no n8n, hospedados em servidores Linux próprios. Entre os projetos para clientes está um configurador de produtos em 3D feito com three.js e Supabase.',
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
    period: { en: 'Jul 2025 to Dec 2027 (expected)', pt: 'Jul. de 2025 a dez. de 2027 (previsão)' },
  },
  {
    school: 'Universidade Anhembi Morumbi',
    degree: { en: "Bachelor's in Business Administration", pt: 'Bacharelado em Administração' },
    period: { en: 'Jan 2024 to Dec 2027 (expected)', pt: 'Jan. de 2024 a dez. de 2027 (previsão)' },
  },
]

export const spokenLanguages: SpokenLanguage[] = [
  { name: { en: 'Portuguese', pt: 'Português' }, level: { en: 'Native', pt: 'Nativo' } },
  { name: { en: 'English', pt: 'Inglês' }, level: { en: 'Fluent', pt: 'Fluente' } },
  { name: { en: 'Spanish', pt: 'Espanhol' }, level: { en: 'Intermediate', pt: 'Intermediário' } },
  { name: { en: 'French', pt: 'Francês' }, level: { en: 'Intermediate', pt: 'Intermediário' } },
]
