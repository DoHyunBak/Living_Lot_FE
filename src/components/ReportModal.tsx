import { useEffect, useState } from 'react'
import { ZONE_MAP } from '../data/campus'
import ReportForm from './ReportForm'

interface Props {
  zoneId: string
  locationLabel?: string // "현재 위치" 등 컨텍스트 표시
  onClose: () => void
}

export default function ReportModal({ zoneId, locationLabel, onClose }: Props) {
  const [submitted, setSubmitted] = useState(false)

  // ESC 닫기 + 스크롤 잠금
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  // 제출 후 자동 닫기
  useEffect(() => {
    if (!submitted) return
    const t = setTimeout(onClose, 1500)
    return () => clearTimeout(t)
  }, [submitted, onClose])

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="modal-x" onClick={onClose} aria-label="닫기">
          ✕
        </button>
        {locationLabel && (
          <div className="modal-loc">📍 {locationLabel} · {ZONE_MAP[zoneId]?.name}</div>
        )}
        {submitted ? (
          <div className="modal-success">
            <div className="check">✓</div>
            <h3>신고가 접수되었습니다</h3>
            <p className="muted">제출하신 신고는 즉시 지도와 분석에 반영됩니다.</p>
          </div>
        ) : (
          <ReportForm zoneId={zoneId} onDone={() => setSubmitted(true)} onCancel={onClose} />
        )}
      </div>
    </div>
  )
}
