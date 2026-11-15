import { about, type View } from '../../content'
import { useLang } from '../LangContext'

export function AboutContent({ onNavigate }: { onNavigate: (view: View) => void }) {
  const { lang, t } = useLang()
  return (
    <>
      <figure className="ov-about-photo">
        <img src={about.photo.src} alt={about.photo.alt[lang]} width={460} height={460} />
        <figcaption>{about.caption[lang]}</figcaption>
      </figure>
      <div className="ov-about-text">
        {about.paragraphs.map((p) => (
          <p key={p.en}>{p[lang]}</p>
        ))}
      </div>
      <button type="button" className="ov-btn ov-solid ov-about-cta" onClick={() => onNavigate('contact')}>
        {t.getInTouch}
      </button>
    </>
  )
}
