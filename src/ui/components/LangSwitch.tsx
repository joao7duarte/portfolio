import type { Lang } from '../../content'
import { useLang } from '../LangContext'

const LANGUAGES: { lang: Lang; short: string; name: string }[] = [
  { lang: 'en', short: 'EN', name: 'English' },
  { lang: 'pt', short: 'PT', name: 'Português' },
]

export function LangSwitch({ className }: { className?: string }) {
  const { lang, setLang, t } = useLang()
  return (
    <div role="group" aria-label={t.language} className={'ov-lang' + (className ? ` ${className}` : '')}>
      {LANGUAGES.map((l) => (
        <button
          key={l.lang}
          type="button"
          lang={l.lang}
          aria-label={l.name}
          aria-pressed={lang === l.lang}
          onClick={() => setLang(l.lang)}
        >
          {l.short}
        </button>
      ))}
    </div>
  )
}
