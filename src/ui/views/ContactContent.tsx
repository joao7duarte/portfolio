import { profile } from '../../content'
import { useLang } from '../LangContext'

export function ContactContent() {
  const { t } = useLang()
  return (
    <dl className="ov-contact">
      <div>
        <dt>{t.email}</dt>
        <dd>
          <a className="ov-link" href={`mailto:${profile.email}`}>
            {profile.email}
          </a>
        </dd>
      </div>
      <div>
        <dt>LinkedIn</dt>
        <dd>
          <a className="ov-link" href={profile.linkedIn} target="_blank" rel="noopener noreferrer">
            {profile.linkedInLabel}
            <span className="ov-sr">{t.newTab}</span>
          </a>
        </dd>
      </div>
      <div>
        <dt>GitHub</dt>
        <dd>
          <a className="ov-link" href={profile.github} target="_blank" rel="noopener noreferrer">
            {profile.githubLabel}
            <span className="ov-sr">{t.newTab}</span>
          </a>
        </dd>
      </div>
      <div>
        <dt>{t.location}</dt>
        <dd>{profile.location}</dd>
      </div>
    </dl>
  )
}
