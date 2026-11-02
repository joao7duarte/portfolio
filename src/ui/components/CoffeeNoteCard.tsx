import type { View } from '../../content'
import type { CoffeeNote } from '../../lib/useCoffee'
import { useLang } from '../LangContext'

type Props = {
  note: CoffeeNote | null
  onNavigate: (view: View) => void
}

/** The line shown after a click on the mug. The wrapper stays mounted so screen readers announce changes. */
export function CoffeeNoteCard({ note, onNavigate }: Props) {
  const { t } = useLang()
  return (
    <div role="status">
      {note && (
        <p className="ov-coffeeNote">
          {t[note]}
          {note === 'coffeeReward' && (
            <button type="button" className="ov-btn ov-solid" onClick={() => onNavigate('contact')}>
              {t.coffeeTalk}
            </button>
          )}
        </p>
      )}
    </div>
  )
}
