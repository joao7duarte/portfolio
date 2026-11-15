import childhood from '../assets/about/childhood.jpg'
import type { Localized } from './types'

/** The About section, opened from the nav or the mug on the desk. Facts only from the master CV. */
export const about = {
  photo: {
    src: childhood,
    alt: {
      en: 'João as a small boy at a desk with a beige CRT computer, his hand on the mouse, looking at the camera.',
      pt: 'João pequeno numa mesa com um computador bege de monitor de tubo, com a mão no mouse, olhando para a câmera.',
    } as Localized,
  },
  caption: {
    en: 'That’s me back in the days of chunky CRT monitors, already poking around to see how things worked :)',
    pt: 'Esse sou eu na época dos monitores de caixa, já fuxicando como as coisas funcionavam :)',
  } as Localized,
  paragraphs: [
    {
      en: 'I’m still poking around, just at a bigger scale. At Embraer, I build the program management system used by Commercial Aviation. Through decastro.dev, my own business, I build AI agents, n8n automations and custom systems.',
      pt: 'Hoje eu continuo fuxicando, só que em coisa maior. Na Embraer, desenvolvo o sistema de gestão de programas da Aviação Comercial. Pela decastro.dev, meu próprio negócio, crio agentes de IA, automações com n8n e sistemas sob medida.',
    },
    {
      en: 'Before code, I spent more than 2 years teaching English, and I’m studying Business Administration and Systems Analysis and Development. That taught me to understand the problem before writing the first line, and to explain things simply.',
      pt: 'Antes do código, passei mais de 2 anos dando aula de inglês, e hoje curso Administração e Análise e Desenvolvimento de Sistemas. Isso me ensinou a entender o problema antes de escrever a primeira linha e a explicar tudo de um jeito simples.',
    },
  ] as Localized[],
}
