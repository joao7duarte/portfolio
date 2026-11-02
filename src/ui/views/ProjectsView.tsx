import { useState } from 'react'
import { projects, type View } from '../../content'
import { BackButton } from '../components/BackButton'
import { LangSwitch } from '../components/LangSwitch'
import { SectionNav } from '../components/SectionNav'
import { useLang } from '../LangContext'
import { ProjectWindow } from './ProjectWindow'

export function ProjectsView({
  view,
  activeSkillId,
  onNavigate,
}: {
  view: View
  activeSkillId: string | null
  onNavigate: (view: View) => void
}) {
  const { t } = useLang()
  const [stack, setStack] = useState<string[]>(projects.map((p) => p.id))
  const front = stack[stack.length - 1]
  const bringForward = (id: string) =>
    setStack((s) => (s[s.length - 1] === id ? s : [...s.filter((x) => x !== id), id]))

  return (
    <section className="ov-os" aria-label={t.projects}>
      <div className="ov-taskbar">
        <BackButton onNavigate={onNavigate} />
        <SectionNav view={view} onNavigate={onNavigate} />
        <LangSwitch />
      </div>
      <div className="ov-os-area">
        <h1 className="ov-sr" tabIndex={-1} data-autofocus>
          {t.projects}
        </h1>
        <div className="ov-wins">
          {projects.map((p) => (
            <ProjectWindow
              key={p.id}
              project={p}
              zIndex={stack.indexOf(p.id) + 1}
              isFront={front === p.id}
              activeSkillId={activeSkillId}
              onFront={() => bringForward(p.id)}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
