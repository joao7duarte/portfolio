import { useEffect, useRef } from 'react'
import { strings, type Lang, type View } from '../content'
import { LangContext } from './LangContext'
import { ContactContent } from './views/ContactContent'
import { DeskView } from './views/DeskView'
import { ExperienceContent } from './views/ExperienceContent'
import { PanelView } from './views/PanelView'
import { ProjectsView } from './views/ProjectsView'
import { SkillsContent } from './views/SkillsContent'
import './styles/index.css'

type Props = {
  view: View
  lang: Lang
  activeSkillId: string | null
  onNavigate: (view: View) => void
  onSelectSkill: (id: string | null) => void
  onLangChange: (lang: Lang) => void
}

function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

export function Overlay({ view, lang, activeSkillId, onNavigate, onSelectSkill, onLangChange }: Props) {
  const rootRef = useRef<HTMLDivElement>(null)
  const first = useRef(true)

  // Escape returns to the desk.
  useEffect(() => {
    if (view === 'desk') return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onNavigate('desk')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [view, onNavigate])

  // Move focus to the new view's heading when the view changes.
  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    const delay = view === 'projects' && !prefersReducedMotion() ? 520 : 0
    const t = window.setTimeout(() => {
      rootRef.current
        ?.querySelector<HTMLElement>('[data-autofocus]')
        ?.focus({ preventScroll: true })
    }, delay)
    return () => window.clearTimeout(t)
  }, [view])

  return (
    <LangContext.Provider value={{ lang, setLang: onLangChange }}>
      <div className="ov-root" ref={rootRef}>
        {view === 'desk' && <DeskView onNavigate={onNavigate} />}

        {view === 'projects' && (
          <ProjectsView view={view} activeSkillId={activeSkillId} onNavigate={onNavigate} />
        )}

        {(view === 'skills' || view === 'experience' || view === 'contact') && (
          <PanelView view={view} title={strings[lang][view]} onNavigate={onNavigate}>
            {view === 'skills' && (
              <SkillsContent
                activeSkillId={activeSkillId}
                onSelectSkill={onSelectSkill}
                onNavigate={onNavigate}
              />
            )}
            {view === 'experience' && <ExperienceContent />}
            {view === 'contact' && <ContactContent />}
          </PanelView>
        )}
      </div>
    </LangContext.Provider>
  )
}
