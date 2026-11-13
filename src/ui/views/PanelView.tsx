import { useRef, useState, type ReactNode } from 'react'
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
  // On narrow screens the panel grows to nearly full height once the reader scrolls,
  // and drops back to half height when they scroll back to the top.
  const [full, setFull] = useState(false)
  const lastTop = useRef(0)
  // a new section starts at half height again
  const [shownView, setShownView] = useState(view)
  if (shownView !== view) {
    setShownView(view)
    setFull(false)
  }
  const onScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const body = e.currentTarget
    const top = body.scrollTop
    if (top > 8) setFull(true)
    // Growing can clamp the scroll back to 0 when the content then fits: only a real scroll up collapses it.
    else if (top === 0 && lastTop.current > 0 && body.scrollHeight > body.clientHeight + 1) setFull(false)
    lastTop.current = top
  }

  return (
    <>
      <BackButton className="ov-back-corner" onNavigate={onNavigate} />
      <section className={'ov-panel' + (full ? ' ov-panel-full' : '')} aria-labelledby="ov-panel-title">
        <div className="ov-panel-bar">
          <SectionNav view={view} onNavigate={onNavigate} />
          <LangSwitch />
        </div>
        <div className="ov-panel-body" onScroll={onScroll}>
          {/* brand motif: section titles sit in code brackets, like the logo */}
          <h1 id="ov-panel-title" tabIndex={-1} data-autofocus>
            <span className="ov-tagmark" aria-hidden="true">
              &lt;
            </span>
            {title}
            <span className="ov-tagmark" aria-hidden="true">
              /&gt;
            </span>
          </h1>
          {children}
        </div>
      </section>
    </>
  )
}
