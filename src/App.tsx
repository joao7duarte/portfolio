import { useEffect, useState } from 'react'
import type { View } from './content'
import { useCoffee } from './lib/useCoffee'
import { useLangPreference } from './lib/useLangPreference'
import { StudioScene } from './scene/StudioScene'
import { Overlay } from './ui/Overlay'

export default function App() {
  const [view, setView] = useState<View>('desk')
  const [activeSkillId, setActiveSkillId] = useState<string | null>(null)
  const [lang, setLang] = useLangPreference()
  const { coffee, onMugClick, dismissNote } = useCoffee()

  // A mug note belongs to the desk, so it doesn't wait there for the visitor's return.
  useEffect(() => {
    if (view !== 'desk') dismissNote()
  }, [view, dismissNote])

  return (
    <div className="app">
      <StudioScene
        view={view}
        lang={lang}
        activeSkillId={activeSkillId}
        coffee={coffee}
        onNavigate={setView}
        onSelectSkill={setActiveSkillId}
        onMugClick={onMugClick}
      />
      <Overlay
        view={view}
        lang={lang}
        activeSkillId={activeSkillId}
        coffeeNote={coffee.note}
        onNavigate={setView}
        onSelectSkill={setActiveSkillId}
        onLangChange={setLang}
      />
    </div>
  )
}
