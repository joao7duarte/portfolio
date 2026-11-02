import { projects, skills, type View } from '../../content'
import { useLang } from '../LangContext'

export function SkillsContent({
  activeSkillId,
  onSelectSkill,
  onNavigate,
}: {
  activeSkillId: string | null
  onSelectSkill: (id: string | null) => void
  onNavigate: (view: View) => void
}) {
  const { lang, t } = useLang()
  const active = skills.find((s) => s.id === activeSkillId) ?? null
  const using = active ? projects.filter((p) => p.skillIds.includes(active.id)) : []
  return (
    <>
      <ul className="ov-skilllist">
        {skills.map((s) => (
          <li key={s.id}>
            <button
              type="button"
              className="ov-skill"
              aria-pressed={s.id === activeSkillId}
              onClick={() => onSelectSkill(s.id === activeSkillId ? null : s.id)}
            >
              {s.name}
            </button>
          </li>
        ))}
      </ul>
      <div className="ov-detail" aria-live="polite">
        {active ? (
          <>
            <h2>{active.name}</h2>
            <p>{active.blurb[lang]}</p>
            <h3>{t.usedIn}</h3>
            {using.length > 0 ? (
              <>
                <ul className="ov-plain">
                  {using.map((p) => (
                    <li key={p.id}>{p.name[lang]}</li>
                  ))}
                </ul>
                <button type="button" className="ov-btn ov-solid" onClick={() => onNavigate('projects')}>
                  {t.seeProjects}
                </button>
              </>
            ) : (
              <p>{t.noProjects}</p>
            )}
          </>
        ) : (
          <p className="ov-muted">{t.selectSkill}</p>
        )}
      </div>
    </>
  )
}
