import { useEffect, useState } from 'react'
import { strings, type Lang } from '../content'

const LANG_KEY = 'portfolio-lang'

/** Saved choice first, otherwise Portuguese. */
function initialLang(): Lang {
  try {
    const saved = localStorage.getItem(LANG_KEY)
    if (saved === 'en' || saved === 'pt') return saved
  } catch {
    // storage can be blocked; fall through to Portuguese
  }
  return 'pt'
}

/** Current language, kept in sync with the page's lang, title and saved preference. */
export function useLangPreference() {
  const [lang, setLang] = useState<Lang>(initialLang)

  useEffect(() => {
    document.documentElement.lang = lang === 'pt' ? 'pt-BR' : 'en'
    document.title = strings[lang].pageTitle
    try {
      localStorage.setItem(LANG_KEY, lang)
    } catch {
      // the switch still works for this visit
    }
  }, [lang])

  return [lang, setLang] as const
}
