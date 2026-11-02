import { profile, type View } from '../../content'
import type { CoffeeNote } from '../../lib/useCoffee'
import { CoffeeNoteCard } from '../components/CoffeeNoteCard'
import { LangSwitch } from '../components/LangSwitch'
import { SectionNav } from '../components/SectionNav'
import { useLang } from '../LangContext'

type Props = {
  coffeeNote: CoffeeNote | null
  onNavigate: (view: View) => void
}

export function DeskView({ coffeeNote, onNavigate }: Props) {
  const { lang } = useLang()
  return (
    <>
      <header className="ov-identity">
        <h1 tabIndex={-1} data-autofocus>
          {profile.name}
        </h1>
        <p className="ov-role">{profile.role[lang]}</p>
        <p className="ov-headline">{profile.headline[lang]}</p>
      </header>
      <LangSwitch className="ov-deskLang" />
      <div className="ov-deskFoot">
        <CoffeeNoteCard note={coffeeNote} onNavigate={onNavigate} />
        <SectionNav view="desk" onNavigate={onNavigate} className="ov-deskNav" />
      </div>
    </>
  )
}
