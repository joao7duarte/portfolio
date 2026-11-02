import { createContext, useContext } from 'react'
import { strings, type Lang } from '../content'

export const LangContext = createContext<{ lang: Lang; setLang: (lang: Lang) => void }>({
  lang: 'en',
  setLang: () => {},
})

export function useLang() {
  const { lang, setLang } = useContext(LangContext)
  return { lang, setLang, t: strings[lang] }
}
