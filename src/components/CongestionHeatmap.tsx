import { useMemo, useState } from 'react'
import { dayHourMatrix } from '../lib/analytics'
import type { Report } from '../types'

const DAYS = ['월', '화', '수', '목', '금', '토', '일']
const HOUR_LABELS = [0, 3, 6, 9, 12, 15, 18, 21]

function cellColor(t: number): string {
  if (t <= 0) return '#f1f5f9'
  if (t < 0.25) return '#dcfce7'
  if (t < 0.45) return '#bbf7d0'
  if (t < 0.6) return '#fde68a'
  if (t < 0.78) return '#fb923c'
  return '#dc2626'
}

/** 요일 × 시간대 혼잡 히트맵 (캘린더형) */
export default function CongestionHeatmap({ reports }: { reports: Report[] }) {
  const { matrix, max } = useMemo(() => dayHourMatrix(reports), [reports])
  const [hover, setHover] = useState<{ d: number; h: number; v: number } | null>(null)

  return (
    <div className="cong">
      <div className="cong-scroll">
        <div className="cong-grid">
          {/* 시간 축 라벨 */}
          <div className="cong-corner" />
          {Array.from({ length: 24 }, (_, h) => (
            <div key={h} className="cong-hlabel">
              {HOUR_LABELS.includes(h) ? `${h}시` : ''}
            </div>
          ))}

          {matrix.map((row, d) => (
            <Row key={d} day={DAYS[d]} row={row} dIndex={d} max={max} onHover={setHover} />
          ))}
        </div>
      </div>
      <div className="cong-foot">
        <div className="cong-legend">
          <span>한산</span>
          <i style={{ background: '#dcfce7' }} />
          <i style={{ background: '#bbf7d0' }} />
          <i style={{ background: '#fde68a' }} />
          <i style={{ background: '#fb923c' }} />
          <i style={{ background: '#dc2626' }} />
          <span>혼잡</span>
        </div>
        <div className="cong-readout">
          {hover
            ? `${DAYS[hover.d]}요일 ${hover.h}시 · 신고 ${hover.v}건`
            : '칸에 마우스를 올리면 상세가 표시됩니다'}
        </div>
      </div>
    </div>
  )
}

function Row({
  day,
  row,
  dIndex,
  max,
  onHover,
}: {
  day: string
  row: number[]
  dIndex: number
  max: number
  onHover: (v: { d: number; h: number; v: number } | null) => void
}) {
  return (
    <>
      <div className="cong-dlabel">{day}</div>
      {row.map((v, h) => (
        <div
          key={h}
          className="cong-cell"
          style={{ background: cellColor(max ? v / max : 0) }}
          onMouseEnter={() => onHover({ d: dIndex, h, v })}
          onMouseLeave={() => onHover(null)}
          title={`${day} ${h}시 · ${v}건`}
        />
      ))}
    </>
  )
}
