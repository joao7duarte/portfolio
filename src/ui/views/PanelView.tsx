import type { ReactNode } from 'react'
import type { View } from '../../content'
import { BackButton } from '../components/BackButton'
import { LangSwitch } from '../components/LangSwitch'
import { SectionNav } from '../components/SectionNav'

/** Shell for the screens that slide over the desk: skills, experience and contact. */
export function PanelView({
  view,
  title,
  onNavigate,
  children,
}: {
  view: View
  title: string
  onNavigate: (view: View) => void
  children: ReactNode
}) {
  return (
    <>
      <BackButton className="ov-back-corner" onNavigate={onNavigate} />
      <section className="ov-panel" aria-labelledby="ov-panel-title">
        <div className="ov-panel-bar">
          <SectionNav view={view} onNavigate={onNavigate} />
          <LangSwitch />
        </div>
        <div className="ov-panel-body">
          <h1 id="ov-panel-title" tabIndex={-1} data-autofocus>
            {title}
          </h1>
          {children}
        </div>
      </section>
    </>
  )
}
