import { profile, type View } from '../../content'
import { LangSwitch } from '../components/LangSwitch'
import { SectionNav } from '../components/SectionNav'
import { useLang } from '../LangContext'

export function DeskView({ onNavigate }: { onNavigate: (view: View) => void }) {
  const { lang, t } = useLang()
  return (
    <>
      <header className="ov-identity">
        <h1 tabIndex={-1} data-autofocus>
          {profile.name}
        </h1>
        <p className="ov-headline">{profile.headline[lang]}</p>
        <p className="ov-hint">{t.hint}</p>
      </header>
      <LangSwitch className="ov-deskLang" />
      <SectionNav view="desk" onNavigate={onNavigate} className="ov-deskNav" />
    </>
  )
}
