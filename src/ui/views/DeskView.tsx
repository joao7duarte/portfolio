import type { CSSProperties } from 'react'
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
        {/* the logo, drawn as text with a green ".dev" between code brackets; each letter is its own span so it can hop on hover */}
        <h1 className="ov-brand" tabIndex={-1} data-autofocus aria-label={profile.brand + profile.brandTld}>
          <span className="ov-brand-open" aria-hidden="true">
            &lt;
          </span>
          <span className="ov-brand-word" aria-hidden="true">
            {[...profile.brand].map((ch, i) => (
              <span key={i} style={{ '--i': i } as CSSProperties}>
                {ch}
              </span>
            ))}
            <span className="ov-brand-tld">
              {[...profile.brandTld].map((ch, i) => (
                <span key={i} style={{ '--i': profile.brand.length + i } as CSSProperties}>
                  {ch}
                </span>
              ))}
            </span>
          </span>
          <span className="ov-brand-slash" aria-hidden="true">
            /
          </span>
          <span className="ov-brand-close" aria-hidden="true">
            &gt;
          </span>
        </h1>
        <p className="ov-person">{profile.name}</p>
        <p className="ov-role">{profile.role[lang]}</p>
      </header>
      <LangSwitch className="ov-deskLang" />
      <div className="ov-deskFoot">
        <CoffeeNoteCard note={coffeeNote} onNavigate={onNavigate} />
        <SectionNav view="desk" onNavigate={onNavigate} className="ov-deskNav" />
      </div>
    </>
  )
}
