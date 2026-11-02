import type { View } from '../../content'
import { useLang } from '../LangContext'

const SECTIONS: Exclude<View, 'desk'>[] = ['projects', 'skills', 'experience', 'contact']

export function SectionNav({
  view,
  onNavigate,
  className,
}: {
  view: View
  onNavigate: (view: View) => void
  className?: string
}) {
  const { t } = useLang()
  return (
    <nav aria-label={t.sections} className={className}>
      <ul className="ov-navlist">
        {SECTIONS.map((s) => (
          <li key={s}>
            <button
              type="button"
              className="ov-btn"
              aria-current={view === s ? 'page' : undefined}
              onClick={() => onNavigate(s)}
            >
              {t[s]}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  )
}
