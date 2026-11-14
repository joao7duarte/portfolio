import { useState } from 'react'
import type { View } from './content'
import { useLangPreference } from './lib/useLangPreference'
import { StudioScene } from './scene/StudioScene'
import { Overlay } from './ui/Overlay'

export default function App() {
  const [view, setView] = useState<View>('desk')
  const [activeSkillId, setActiveSkillId] = useState<string | null>(null)
  const [lang, setLang] = useLangPreference()

  return (
    <div className="app">
      <StudioScene
        view={view}
        lang={lang}
        activeSkillId={activeSkillId}
        onNavigate={setView}
        onSelectSkill={setActiveSkillId}
      />
      <Overlay
        view={view}
        lang={lang}
        activeSkillId={activeSkillId}
        onNavigate={setView}
        onSelectSkill={setActiveSkillId}
        onLangChange={setLang}
      />
    </div>
  )
}
