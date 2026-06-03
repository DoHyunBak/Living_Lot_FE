import { useEffect, useMemo, useState } from 'react'
import { CircleMarker, MapContainer, Marker, Popup, TileLayer, Tooltip, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.heat'
import { CAMPUS_CENTER, CURRENT_LOCATION, ZONES, pinToGeo } from '../data/campus'
import { REPORT_META, type Report, type ReportType } from '../types'

interface Props {
  reports: Report[]
  selectedZoneId?: string | null
  onSelect?: (zoneId: string) => void
  showCurrentLocation?: boolean
  height?: number
  compact?: boolean
}

const ALL_TYPES: ReportType[] = ['shortage', 'illegal', 'idea']

function heatColor(t: number): string {
  if (t <= 0) return '#94a3b8'
  if (t < 0.35) return '#22c55e'
  if (t < 0.6) return '#facc15'
  if (t < 0.8) return '#f97316'
  return '#dc2626'
}

// leaflet.heat 레이어 (useMap 으로 직접 추가)
function HeatLayer({ points, max }: { points: [number, number, number][]; max: number }) {
  const map = useMap()
  useEffect(() => {
    // leaflet.heat 는 L 에 heatLayer 를 확장하지만 타입이 없어 캐스팅
    const layer = (L as unknown as { heatLayer: (p: unknown, o: unknown) => L.Layer }).heatLayer(points, {
      radius: 36,
      blur: 22,
      max, // 가중치는 0~1 정규화됨 (max=1)
      maxZoom: 18,
      minOpacity: 0.12,
      gradient: { 0.35: '#22c55e', 0.6: '#facc15', 0.82: '#f97316', 1: '#dc2626' },
    }).addTo(map)
    return () => {
      map.removeLayer(layer)
    }
  }, [points, max, map])
  return null
}

// 현재 위치 펄스 마커
const hereIcon = L.divIcon({
  className: 'here-divicon',
  html: '<span class="hd-pulse"></span><span class="hd-dot"></span>',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
})

export default function LeafletCampusMap({
  reports,
  selectedZoneId,
  onSelect,
  showCurrentLocation = false,
  height = 480,
  compact = false,
}: Props) {
  const [view, setView] = useState<'heat' | 'marker'>('heat')
  const [active, setActive] = useState<Set<ReportType>>(new Set(ALL_TYPES))

  const toggleType = (t: ReportType) =>
    setActive((prev) => {
      const next = new Set(prev)
      next.has(t) ? next.delete(t) : next.add(t)
      return next.size === 0 ? new Set(ALL_TYPES) : next
    })

  const filtered = useMemo(() => reports.filter((r) => active.has(r.type)), [reports, active])

  // 구역별 집계
  const { perZone, maxTotal } = useMemo(() => {
    const map: Record<string, { total: number; byType: Record<ReportType, number> }> = {}
    for (const z of ZONES) map[z.id] = { total: 0, byType: { illegal: 0, shortage: 0, idea: 0 } }
    for (const r of filtered) {
      if (!map[r.zoneId]) continue
      map[r.zoneId].total++
      map[r.zoneId].byType[r.type]++
    }
    return { perZone: map, maxTotal: Math.max(1, ...ZONES.map((z) => map[z.id].total)) }
  }, [filtered])

  // 히트 포인트 — 감마 커브로 핫스팟만 강조. 약한 구역은 생략.
  const heatPoints = useMemo<[number, number, number][]>(() => {
    const pts: [number, number, number][] = []
    for (const z of ZONES) {
      const total = perZone[z.id].total
      if (total === 0) continue
      const ratio = total / maxTotal
      // 비선형 강조: 상위 구역은 강하게, 중하위는 빠르게 약해짐
      const w = Math.pow(ratio, 2.2)
      if (w < 0.05) continue // 미미한 곳은 히트맵에서 제외
      const [lat, lng] = pinToGeo(z.pin)
      pts.push([lat, lng, w])
    }
    return pts
  }, [perZone, maxTotal])

  const herePos = pinToGeo(CURRENT_LOCATION.point2)

  return (
    <div className="leaflet-wrap">
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

      <MapContainer
        center={CAMPUS_CENTER}
        zoom={16}
        scrollWheelZoom
        style={{ height, width: '100%', borderRadius: 14 }}
        className="leaflet-campus"
      >
        {/* CartoDB Voyager — 무료, 키 불필요, 깔끔한 톤 */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />

        {view === 'heat' && <HeatLayer points={heatPoints} max={1} />}

        {/* 클릭/표시용 구역 마커 */}
        {ZONES.map((z) => {
          const stat = perZone[z.id]
          const intensity = stat.total / maxTotal
          const [lat, lng] = pinToGeo(z.pin)
          const isSel = selectedZoneId === z.id
          const radius = view === 'marker' ? 8 + intensity * 18 : isSel ? 11 : 6
          return (
            <CircleMarker
              key={z.id}
              center={[lat, lng]}
              radius={radius}
              pathOptions={{
                color: isSel ? '#0e4a84' : '#ffffff',
                weight: isSel ? 3 : 2,
                fillColor: heatColor(intensity),
                fillOpacity: view === 'marker' || isSel ? 0.9 : 0.55,
              }}
              eventHandlers={{ click: () => onSelect?.(z.id) }}
            >
              {view === 'marker' && (
                <Tooltip permanent direction="top" offset={[0, -radius]} className="zone-tip">
                  {z.name} · {stat.total}
                </Tooltip>
              )}
              <Popup>
                <div className="leaf-popup">
                  <strong>{z.name}</strong>
                  <div className="lp-row">누적 {stat.total}건 · 주차면 {z.capacity}면</div>
                  <div className="lp-types">
                    {ALL_TYPES.map((t) => (
                      <span key={t}>
                        <i style={{ background: REPORT_META[t].color }} />
                        {REPORT_META[t].short} {stat.byType[t]}
                      </span>
                    ))}
                  </div>
                  {onSelect && (
                    <button className="lp-btn" onClick={() => onSelect(z.id)}>
                      이 구역 신고하기
                    </button>
                  )}
                </div>
              </Popup>
            </CircleMarker>
          )
        })}

        {showCurrentLocation && (
          <Marker position={herePos} icon={hereIcon}>
            <Tooltip permanent direction="top" offset={[0, -12]} className="here-tip">
              📍 현재 위치
            </Tooltip>
          </Marker>
        )}
      </MapContainer>

      <div className="legend">
        <span>적음</span>
        <div className="legend-bar" />
        <span>많음</span>
        {showCurrentLocation && <span className="legend-here">● 현재 위치</span>}
      </div>
    </div>
  )
}
