import { useRef, useState } from 'react'
import type { ReportType } from '../types'
import { REPORT_META } from '../types'
import { ZONE_MAP } from '../data/campus'
import { useStore } from '../store/store'

const TYPES: ReportType[] = ['shortage', 'illegal', 'idea']

interface AIResult {
  type: ReportType
  confidence: number
  tags: string[]
}

// 가짜 AI 사진 분석 결과 생성
function fakeAnalyze(): AIResult {
  const r = Math.random()
  const type: ReportType = r < 0.45 ? 'illegal' : r < 0.85 ? 'shortage' : 'idea'
  const tagMap: Record<ReportType, string[]> = {
    illegal: ['차량 1대 감지', '통로 점유 추정', '구획선 침범'],
    shortage: ['주차면 포화', '빈 자리 미검출', '대기 차량 감지'],
    idea: ['미사용 공간 감지', '평탄한 지면', '확장 가능 추정'],
  }
  return { type, confidence: 84 + Math.floor(Math.random() * 14), tags: tagMap[type] }
}

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
  const [photo, setPhoto] = useState<string | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [ai, setAi] = useState<AIResult | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const zone = ZONE_MAP[zoneId]

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setPhoto(reader.result as string)
      setAi(null)
      setAnalyzing(true)
      // AI 분석 시늉 (1.9초)
      setTimeout(() => {
        const result = fakeAnalyze()
        setAi(result)
        setType(result.type) // AI 추천 유형 자동 적용
        setAnalyzing(false)
      }, 1900)
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="report-form">
      <h3>{zone?.name} 신고</h3>

      {/* 사진 첨부 + AI 분석 */}
      <label className="field-label">사진 (선택) · AI 자동 분석</label>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFile}
        hidden
      />
      {!photo ? (
        <button className="photo-drop" onClick={() => fileRef.current?.click()}>
          <span className="pd-icon">📷</span>
          <span className="pd-text">사진 촬영 / 업로드</span>
          <span className="pd-sub">AI가 상황을 자동으로 판독합니다</span>
        </button>
      ) : (
        <div className="photo-box">
          <img src={photo} alt="신고 사진" />
          {analyzing && (
            <div className="ai-overlay">
              <span className="ai-spinner" />
              <span>AI가 사진을 분석하고 있어요…</span>
            </div>
          )}
          <button className="photo-x" onClick={() => { setPhoto(null); setAi(null) }}>
            ✕
          </button>
        </div>
      )}

      {ai && (
        <div className="ai-result">
          <div className="ai-result-head">
            <span className="ai-badge">🤖 AI 판독</span>
            <span className="ai-conf">신뢰도 {ai.confidence}%</span>
          </div>
          <div className="ai-verdict">
            <span className="dot" style={{ background: REPORT_META[ai.type].color }} />
            <b>{REPORT_META[ai.type].label}</b> 으로 추정됩니다
          </div>
          <div className="ai-confbar">
            <span style={{ width: `${ai.confidence}%`, background: REPORT_META[ai.type].color }} />
          </div>
          <div className="ai-tags">
            {ai.tags.map((t) => (
              <span key={t} className="ai-tag">{t}</span>
            ))}
          </div>
          <p className="ai-note">아래 유형이 AI 추천으로 자동 선택되었습니다. 필요하면 바꿀 수 있어요.</p>
        </div>
      )}

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
            {ai?.type === t && <span className="ai-pick">AI 추천</span>}
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
          disabled={analyzing}
          onClick={() => {
            addReport({ zoneId, type, note: note.trim() })
            onDone()
          }}
        >
          {analyzing ? '분석 중…' : '신고 제출'}
        </button>
      </div>
    </div>
  )
}
