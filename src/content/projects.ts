import epmsPhoto from '../assets/projects/epms.jpg'
import jobMatcherArt from '../assets/projects/job-matcher.svg'
import racketPhoto from '../assets/projects/racket-configurator.jpg'
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
      en: 'I develop and maintain the system: full-stack work in JavaScript, Node.js and React, Oracle data integration and Python automation. I turn stakeholder requirements into features, and I am building a Microsoft Graph API and Azure sync that replaces a manual daily data update, expected to save about 5 hours a week.',
      pt: 'Desenvolvo e mantenho o sistema: trabalho full-stack em JavaScript, Node.js e React, integração de dados Oracle e automação em Python. Transformo requisitos dos stakeholders em funcionalidades e estou construindo uma sincronização com Microsoft Graph API e Azure que substitui uma atualização manual diária, com economia prevista de cerca de 5 horas por semana.',
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
    id: 'job-matcher',
    name: { en: 'AI Job Matcher', pt: 'AI Job Matcher' },
    summary: {
      en: 'An AI agent that finds remote software jobs, ranks them against my profile and sends me a daily shortlist.',
      pt: 'Um agente de IA que encontra vagas remotas de software, dá uma nota para cada uma com base no meu perfil e me manda uma lista curta todo dia.',
    },
    problem: {
      en: 'Finding international remote roles that I can actually get meant checking many job boards every day and reading postings that were never a fit.',
      pt: 'Encontrar vagas remotas internacionais que eu realmente consiga pegar exigia olhar vários sites todos os dias e ler muitas vagas que nunca serviam.',
    },
    role: {
      en: 'I built it end to end: a Node.js service that collects postings from 9 sources, filters out the ones I can’t get and scores the rest with the Claude API. n8n workflows run the collection and send the best matches to Telegram, and it also renders ATS-safe résumés from a single source of truth. A person always reviews before applying.',
      pt: 'Construí tudo: um serviço em Node.js que coleta vagas de 9 fontes, descarta as que não se encaixam e dá nota às outras com a API do Claude. Fluxos no n8n rodam a coleta e mandam as melhores vagas no Telegram, e o agente também gera currículos compatíveis com ATS a partir de uma única fonte de dados. Uma pessoa sempre revisa antes de qualquer candidatura.',
    },
    skillIds: ['n8n', 'node', 'javascript', 'sql'],
    codeUrl: 'https://github.com/joao7duarte/ai-job-matcher',
    image: {
      src: jobMatcherArt,
      alt: {
        en: 'Illustration: job postings flow into an n8n workflow that filters them, a ranked list with scores, and a phone receiving the daily shortlist.',
        pt: 'Ilustração: vagas entram em um fluxo do n8n que as filtra, uma lista ordenada com notas e um celular recebendo a lista do dia.',
      },
      caption: { en: 'How the agent works', pt: 'Como o agente funciona' },
    },
  },
  {
    id: 'racket-configurator',
    name: { en: '3D racket configurator (prototype)', pt: 'Configurador 3D de raquetes (protótipo)' },
    summary: {
      en: 'The first prototype of a 3D beach tennis racket configurator, built for a client.',
      pt: 'O primeiro protótipo de um configurador 3D de raquetes de beach tennis, feito para um cliente.',
    },
    problem: {
      en: 'Customers needed to design their own racket (model, colours, finish and a printed name) and see it in 3D before ordering.',
      pt: 'Os clientes precisavam montar a própria raquete (modelo, cores, acabamento e nome impresso) e vê-la em 3D antes de comprar.',
    },
    role: {
      en: 'I designed and built this early version: a real-time 3D preview with three.js that updates as the customer picks a model, colours and a name, with front, back and side views and the price as they go.',
      pt: 'Projetei e construí esta primeira versão: uma prévia 3D em tempo real com three.js que muda conforme o cliente escolhe o modelo, as cores e o nome, com vistas de frente, verso e lateral e o preço atualizado.',
    },
    skillIds: ['three', 'javascript', 'css'],
    image: {
      src: racketPhoto,
      alt: {
        en: 'The configurator with a purple and pink racket in 3D, its specs, view buttons and a row of models to choose from.',
        pt: 'O configurador com uma raquete roxa e rosa em 3D, as especificações, os botões de vista e uma fileira de modelos para escolher.',
      },
      caption: { en: 'First prototype', pt: 'Primeiro protótipo' },
    },
  },
]

export const projects = allProjects.filter((project) => !project.hidden)
