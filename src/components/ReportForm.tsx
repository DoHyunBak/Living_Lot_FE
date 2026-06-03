import { useState } from 'react'
import type { ReportType } from '../types'
import { REPORT_META } from '../types'
import { ZONE_MAP } from '../data/campus'
import { useStore } from '../store/store'

const TYPES: ReportType[] = ['shortage', 'illegal', 'idea']

export default function ReportForm({
  zoneId,
  onDone,
  onCancel,
}: {
  zoneId: string
  onDone: () => void
  onCancel?: () => void
}) {
  const { addReport } = useStore()
  const [type, setType] = useState<ReportType>('shortage')
  const [note, setNote] = useState('')
  const zone = ZONE_MAP[zoneId]

  return (
    <div className="report-form">
      <h3>{zone?.name} 신고</h3>
      <label className="field-label">유형</label>
      <div className="type-picker">
        {TYPES.map((t) => (
          <button
            key={t}
            className={`type-btn ${type === t ? 'active' : ''}`}
            style={
              type === t
                ? { borderColor: REPORT_META[t].color, color: REPORT_META[t].color }
                : undefined
            }
            onClick={() => setType(t)}
          >
            <span className="dot" style={{ background: REPORT_META[t].color }} />
            {REPORT_META[t].label}
          </button>
        ))}
      </div>

      <label className="field-label">설명 (선택)</label>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="상황을 간단히 적어주세요"
        rows={3}
      />

      <div className="form-actions">
        <button className="btn-ghost" onClick={onCancel ?? onDone}>
          취소
        </button>
        <button
          className="btn-primary"
          onClick={() => {
            addReport({ zoneId, type, note: note.trim() })
            onDone()
          }}
        >
          신고 제출
        </button>
      </div>
    </div>
  )
}
