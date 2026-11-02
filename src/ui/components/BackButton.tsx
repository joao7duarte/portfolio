import type { View } from '../../content'
import { useLang } from '../LangContext'

export function BackButton({ className, onNavigate }: { className?: string; onNavigate: (view: View) => void }) {
  const { t } = useLang()
  return (
    <button type="button" className={'ov-btn' + (className ? ` ${className}` : '')} onClick={() => onNavigate('desk')}>
      {t.backToDesk}
    </button>
  )
}
