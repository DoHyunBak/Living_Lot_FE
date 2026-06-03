import { useEffect, useMemo, useRef, useState } from 'react'
import { CURRENT_LOCATION, ZONES } from '../data/campus'
import campusImg from '../assects/campus_erica.png'
import { REPORT_META, type Report, type ReportType } from '../types'

interface Props {
  reports: Report[]
  selectedZoneId?: string | null
  onSelect?: (zoneId: string) => void
  showCurrentLocation?: boolean
  compact?: boolean // 관리자 등에서 필터/컨트롤 최소화
}

const MIN_SCALE = 1
const MAX_SCALE = 5
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))
const ALL_TYPES: ReportType[] = ['shortage', 'illegal', 'idea']

// 강도(0~1) → RGB (초록 → 노랑 → 주황 → 빨강)
function heatRGB(t: number): [number, number, number] {
  const stops: [number, [number, number, number]][] = [
    [0, [34, 197, 94]],
    [0.4, [250, 204, 21]],
    [0.7, [249, 115, 22]],
    [1, [220, 38, 38]],
  ]
  let lo = stops[0]
  let hi = stops[stops.length - 1]
  for (let i = 0; i < stops.length - 1; i++) {
    if (t >= stops[i][0] && t <= stops[i + 1][0]) {
      lo = stops[i]
      hi = stops[i + 1]
      break
    }
  }
  const f = (t - lo[0]) / (hi[0] - lo[0] || 1)
  return lo[1].map((v, i) => Math.round(v + (hi[1][i] - v) * f)) as [number, number, number]
}

export default function CampusImageMap({
  reports,
  selectedZoneId,
  onSelect,
  showCurrentLocation = false,
  compact = false,
}: Props) {
  const [view, setView] = useState<'heat' | 'marker'>('heat')
  const [active, setActive] = useState<Set<ReportType>>(new Set(ALL_TYPES))
  const [calibrate, setCalibrate] = useState(false)

  // 줌/팬
  const [scale, setScale] = useState(1)
  const [tx, setTx] = useState(0)
  const [ty, setTy] = useState(0)
  const viewportRef = useRef<HTMLDivElement>(null)
  const drag = useRef({ active: false, sx: 0, sy: 0, moved: false })

  const toggleType = (t: ReportType) =>
    setActive((prev) => {
      const next = new Set(prev)
      if (next.has(t)) next.delete(t)
      else next.add(t)
      if (next.size === 0) return new Set(ALL_TYPES) // 전부 끄면 전체로
      return next
    })

  // 구역별 집계 (활성 유형만)
  const { perZone, maxTotal } = useMemo(() => {
    const map: Record<string, { total: number; byType: Record<ReportType, number> }> = {}
    for (const z of ZONES) map[z.id] = { total: 0, byType: { illegal: 0, shortage: 0, idea: 0 } }
    for (const r of reports) {
      if (!map[r.zoneId] || !active.has(r.type)) continue
      map[r.zoneId].total++
      map[r.zoneId].byType[r.type]++
    }
    const mx = Math.max(1, ...ZONES.map((z) => map[z.id].total))
    return { perZone: map, maxTotal: mx }
  }, [reports, active])

  function clampPan(value: number, viewportSize: number, s: number) {
    return clamp(value, viewportSize - viewportSize * s, 0)
  }
  function zoomAt(clientX: number, clientY: number, factor: number) {
    const vp = viewportRef.current
    if (!vp) return
    const rect = vp.getBoundingClientRect()
    const mx = clientX - rect.left
    const my = clientY - rect.top
    setScale((prev) => {
      const next = clamp(prev * factor, MIN_SCALE, MAX_SCALE)
      const ratio = next / prev
      setTx((px) => clampPan(mx - (mx - px) * ratio, rect.width, next))
      setTy((py) => clampPan(my - (my - py) * ratio, rect.height, next))
      return next
    })
  }
  useEffect(() => {
    const vp = viewportRef.current
    if (!vp) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      zoomAt(e.clientX, e.clientY, e.deltaY < 0 ? 1.15 : 1 / 1.15)
    }
    vp.addEventListener('wheel', onWheel, { passive: false })
    return () => vp.removeEventListener('wheel', onWheel)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const reset = () => {
    setScale(1)
    setTx(0)
    setTy(0)
  }
  function zoomBtn(factor: number) {
    const vp = viewportRef.current
    if (!vp) return
    const rect = vp.getBoundingClientRect()
    zoomAt(rect.left + rect.width / 2, rect.top + rect.height / 2, factor)
  }
  function onPointerDown(e: React.PointerEvent) {
    drag.current = { active: true, sx: e.clientX - tx, sy: e.clientY - ty, moved: false }
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!drag.current.active) return
    const vp = viewportRef.current
    if (!vp) return
    const rect = vp.getBoundingClientRect()
    drag.current.moved = true
    setTx(clampPan(e.clientX - drag.current.sx, rect.width, scale))
    setTy(clampPan(e.clientY - drag.current.sy, rect.height, scale))
  }
  const onPointerUp = () => (drag.current.active = false)

  return (
    <div className="img-map-wrap">
      {/* 상단 툴바 */}
      <div className="map-toolbar">
        <div className="seg">
          <button className={view === 'heat' ? 'on' : ''} onClick={() => setView('heat')}>
            히트맵
          </button>
          <button className={view === 'marker' ? 'on' : ''} onClick={() => setView('marker')}>
            마커
          </button>
        </div>
        {!compact && (
          <div className="type-chips">
            {ALL_TYPES.map((t) => (
              <button
                key={t}
                className={`chip ${active.has(t) ? 'on' : ''}`}
                style={active.has(t) ? { background: REPORT_META[t].color, borderColor: REPORT_META[t].color } : undefined}
                onClick={() => toggleType(t)}
              >
                <span className="chip-dot" style={{ background: active.has(t) ? '#fff' : REPORT_META[t].color }} />
                {REPORT_META[t].short}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="map-controls">
        {!compact && (
          <button className={`calib-toggle ${calibrate ? 'on' : ''}`} onClick={() => setCalibrate((v) => !v)}>
            {calibrate ? '보정 ON' : '보정'}
          </button>
        )}
        <button className="zoom-btn" onClick={() => zoomBtn(1.3)} title="확대">＋</button>
        <button className="zoom-btn" onClick={() => zoomBtn(1 / 1.3)} title="축소">－</button>
        <button className="zoom-btn" onClick={reset} title="원래대로">⟳</button>
      </div>

      <div
        className={`img-map ${scale > 1 ? 'pannable' : ''}`}
        ref={viewportRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div
          className="img-map-inner"
          style={{ transform: `translate(${tx}px, ${ty}px) scale(${scale})`, transformOrigin: '0 0' }}
          onClick={(e) => {
            if (!calibrate) return
            const r = (e.currentTarget as HTMLElement).getBoundingClientRect()
            const x = ((e.clientX - r.left) / r.width).toFixed(3)
            const y = ((e.clientY - r.top) / r.height).toFixed(3)
            // eslint-disable-next-line no-console
            console.log(`pin: [${x}, ${y}],`)
          }}
        >
          <img src={campusImg} alt="ERICA 캠퍼스 지도" draggable={false} />

          {/* 히트맵 레이어 */}
          {view === 'heat' && (
            <div className="heat-layer">
              {ZONES.map((z) => {
                const total = perZone[z.id].total
                if (total === 0) return null
                const intensity = total / maxTotal
                const [r, g, b] = heatRGB(intensity)
                const radius = 70 + intensity * 130 // px (줌과 함께 스케일)
                return (
                  <span
                    key={z.id}
                    className="heat-blob"
                    style={{
                      left: `${z.pin[0] * 100}%`,
                      top: `${z.pin[1] * 100}%`,
                      width: radius,
                      height: radius,
                      background: `radial-gradient(circle, rgba(${r},${g},${b},${0.45 + intensity * 0.35}) 0%, rgba(${r},${g},${b},0) 68%)`,
                    }}
                  />
                )
              })}
            </div>
          )}

          {/* 마커/라벨 */}
          {ZONES.map((z) => {
            const total = perZone[z.id].total
            const intensity = total / maxTotal
            const [r, g, b] = heatRGB(intensity)
            const color = total === 0 ? '#94a3b8' : `rgb(${r},${g},${b})`
            const isSel = selectedZoneId === z.id
            const showMarker = view === 'marker' || isSel
            return (
              <button
                key={z.id}
                className={`map-pin2 ${isSel ? 'sel' : ''} ${showMarker ? '' : 'dotonly'}`}
                style={{
                  left: `${z.pin[0] * 100}%`,
                  top: `${z.pin[1] * 100}%`,
                  transform: `translate(-50%, ${showMarker ? '-100%' : '-50%'}) scale(${1 / scale})`,
                  zIndex: isSel ? 6 : 3,
                }}
                onClick={(e) => {
                  e.stopPropagation()
                  if (drag.current.moved) return
                  onSelect?.(z.id)
                }}
                title={`${z.name} · ${total}건`}
              >
                {showMarker ? (
                  <>
                    <span className="pin2-body" style={{ background: color }}>
                      {total > 0 ? total : ''}
                    </span>
                    <span className="pin2-tip" style={{ borderTopColor: color }} />
                    <span className="pin2-name">{z.name}</span>
                  </>
                ) : (
                  <span className="pin2-dot" style={{ background: color }} />
                )}
              </button>
            )
          })}

          {showCurrentLocation && (
            <div
              className="map-here"
              style={{
                left: `${CURRENT_LOCATION.point2[0] * 100}%`,
                top: `${CURRENT_LOCATION.point2[1] * 100}%`,
                transform: `translate(-50%, -50%) scale(${1 / scale})`,
              }}
            >
              <span className="here-pulse" />
              <span className="here-dot" />
              <span className="here-label">📍 현재 위치</span>
            </div>
          )}
        </div>
      </div>

      <div className="legend">
        <span>적음</span>
        <div className="legend-bar" />
        <span>많음</span>
        {showCurrentLocation && <span className="legend-here">● 현재 위치</span>}
      </div>
    </div>
  )
}
