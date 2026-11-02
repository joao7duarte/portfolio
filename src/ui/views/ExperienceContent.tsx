import { education, experience, profile } from '../../content'
import { useLang } from '../LangContext'

export function ExperienceContent() {
  const { lang, t } = useLang()
  return (
    <>
      <ol className="ov-timeline">
        {experience.map((job) => (
          <li key={job.company + job.period.en}>
            <h2>{job.company}</h2>
            <p className="ov-jobtitle">{job.title[lang]}</p>
            <p className="ov-period">{job.period[lang]}</p>
            <p>{job.summary[lang]}</p>
          </li>
        ))}
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
      <a className="ov-link ov-solidlink" href={profile.resumeUrl}>
        {t.downloadResume}
      </a>
    </>
  )
}
