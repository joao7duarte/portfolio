import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
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
  // On narrow screens the panel opens at half height. A section whose content needs scrolling opens at
  // nearly full height straight away, and any other grows once the reader scrolls (a skill's details can add text).
  const [full, setFull] = useState(false)
  const section = useRef<HTMLElement>(null)
  const body = useRef<HTMLDivElement>(null)
  const bar = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const panel = section.current
    const content = body.current
    if (!panel?.parentElement || !content) return
    // measured against the half-height panel, since the panel may still be animating from the last section
    const halfBody = panel.parentElement.clientHeight * 0.5 - (bar.current?.offsetHeight ?? 0)
    // the content's own height: scrollHeight can't be used, it never drops below the panel's current height
    const last = content.lastElementChild
    if (!last) return
    const pad = parseFloat(getComputedStyle(content).paddingBottom)
    const needed = last.getBoundingClientRect().bottom - content.getBoundingClientRect().top + content.scrollTop + pad
    setFull(needed > halfBody + 1)
  }, [view, title])

  const onScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (e.currentTarget.scrollTop > 8) setFull(true)
  }

  return (
    <>
      <BackButton className="ov-back-corner" onNavigate={onNavigate} />
      <section ref={section} className={'ov-panel' + (full ? ' ov-panel-full' : '')} aria-labelledby="ov-panel-title">
        <div className="ov-panel-bar" ref={bar}>
          <SectionNav view={view} onNavigate={onNavigate} />
          <LangSwitch />
        </div>
        <div className="ov-panel-body" ref={body} onScroll={onScroll}>
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
