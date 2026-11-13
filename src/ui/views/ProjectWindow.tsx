import { skills, type Project } from '../../content'
import { useLang } from '../LangContext'

const skillName = (id: string) => skills.find((s) => s.id === id)?.name ?? id

export function ProjectWindow({
  project,
  zIndex,
  isFront,
  activeSkillId,
  onFront,
}: {
  project: Project
  zIndex: number
  isFront: boolean
  activeSkillId: string | null
  onFront: () => void
}) {
  const { lang, t } = useLang()
  const titleId = `win-${project.id}`
  const external = project.liveUrl?.startsWith('http')
  return (
    <article
      className={'ov-win' + (isFront ? ' ov-front' : '')}
      style={{ zIndex }}
      aria-labelledby={titleId}
      onPointerDown={onFront}
      onFocus={onFront}
    >
      <div className="ov-titlebar">
        <span className="ov-dots" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <h2 className="ov-wintitle" id={titleId}>
          <button type="button" onClick={onFront}>
            {project.name[lang]}
          </button>
        </h2>
      </div>
      <div className="ov-winbody">
        {project.image && (
          <figure className="ov-shot">
            <img src={project.image.src} alt={project.image.alt[lang]} />
            <figcaption>{project.image.caption[lang]}</figcaption>
          </figure>
        )}
        <div className="ov-wintext">
          <p className="ov-summary">{project.summary[lang]}</p>
          <dl className="ov-facts">
            <div>
              <dt>{t.problem}</dt>
              <dd>{project.problem[lang]}</dd>
            </div>
            <div>
              <dt>{t.role}</dt>
              <dd>{project.role[lang]}</dd>
            </div>
          </dl>
          <ul className="ov-tags" aria-label={t.skillsUsed}>
            {project.skillIds.map((id) => (
              <li key={id} className={id === activeSkillId ? 'ov-tag ov-tag-on' : 'ov-tag'}>
                {skillName(id)}
              </li>
            ))}
          </ul>
          {project.liveUrl && (
            <a
              className="ov-link"
              href={project.liveUrl}
              {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
            >
              {t.viewLive}
              {external && <span className="ov-sr">{t.newTab}</span>}
            </a>
          )}
          {project.codeUrl && (
            <a className="ov-link" href={project.codeUrl} target="_blank" rel="noopener noreferrer">
              {t.viewCode}
              <span className="ov-sr">{t.newTab}</span>
            </a>
          )}
        </div>
      </div>
    </article>
  )
}
