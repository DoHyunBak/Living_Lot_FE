export type ReportType = 'illegal' | 'shortage' | 'idea'

export const REPORT_META: Record<
  ReportType,
  { label: string; short: string; color: string; severity: number }
> = {
  illegal: { label: '불법 주차 신고', short: '불법주차', color: '#ef4444', severity: 1.0 },
  shortage: { label: '주차 공간 부족', short: '공간부족', color: '#f59e0b', severity: 0.8 },
  idea: { label: '유휴 공간 제안', short: '공간제안', color: '#3b82f6', severity: 0.0 },
}

export interface Report {
  id: string
  zoneId: string
  type: ReportType
  note: string
  createdAt: string // ISO
  deviceId: string
}

export type ZoneKind = 'building' | 'lot'

export interface Zone {
  id: string
  name: string // 한글
  kind: ZoneKind
  capacity: number // 현재 주차 가능 면수
  // SVG 좌표계 (1000 x 700) 폴리곤 꼭지점 (스키매틱 지도용 - 미사용 가능)
  points: [number, number][]
  // 라벨 위치
  label: [number, number]
  // 실제 지도 이미지 위 핀 위치 (정규화 0~1)
  pin: [number, number]
  // 데이터 생성용 수요 가중치 (핫스팟 형성)
  demandWeight: number
}
