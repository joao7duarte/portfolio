import { education, experience, profile, spokenLanguages } from '../../content'
import { useLang } from '../LangContext'

export function ExperienceContent() {
  const { lang, t } = useLang()
  return (
    <>
      <ol className="ov-timeline">
        {experience.map((job) => {
          const company = typeof job.company === 'string' ? job.company : job.company[lang]
          return (
            <li key={job.title.en + job.period.en}>
              <h2>{company}</h2>
              <p className="ov-jobtitle">{job.title[lang]}</p>
              <p className="ov-period">{job.period[lang]}</p>
              <p>{job.summary[lang]}</p>
            </li>
          )
        })}
      </ol>
      <h2 className="ov-subhead">{t.education}</h2>
      <ol className="ov-timeline">
        {education.map((item) => (
          <li key={item.degree.en}>
            <h3>{item.degree[lang]}</h3>
            <p className="ov-jobtitle">{item.school}</p>
            <p className="ov-period">{item.period[lang]}</p>
          </li>
        ))}
      </ol>
      <h2 className="ov-subhead">{t.languages}</h2>
      <dl className="ov-langs">
        {spokenLanguages.map((item) => (
          <div key={item.name.en}>
            <dt>{item.name[lang]}</dt>
            <dd>{item.level[lang]}</dd>
          </div>
        ))}
      </dl>
      <a className="ov-link ov-solidlink" href={profile.resumeUrl[lang]} download>
        {t.downloadResume}
      </a>
    </>
  )
}
