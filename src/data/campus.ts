import type { Zone } from '../types'

// 가상의 대학 캠퍼스 (ERICA 스타일). SVG 좌표계 1000 x 700.
// demandWeight 가 높을수록 더 많은 신고가 몰림 → 핫스팟 형성.
export const ZONES: Zone[] = [
  {
    id: 'eng1',
    name: '제1공학관',
    kind: 'building',
    capacity: 80,
    points: [[60, 80], [240, 80], [240, 200], [60, 200]],
    label: [150, 145],
    pin: [0.345, 0.275],
    demandWeight: 9.5, // 핫스팟
  },
  {
    id: 'eng2',
    name: '제2공학관',
    kind: 'building',
    capacity: 60,
    points: [[260, 80], [420, 80], [420, 200], [260, 200]],
    label: [340, 145],
    pin: [0.435, 0.255],
    demandWeight: 5.0,
  },
  {
    id: 'library',
    name: '중앙도서관',
    kind: 'building',
    capacity: 50,
    points: [[460, 90], [640, 90], [640, 210], [460, 210]],
    label: [550, 155],
    pin: [0.520, 0.275],
    demandWeight: 9.0, // 핫스팟
  },
  {
    id: 'union',
    name: '학생회관',
    kind: 'building',
    capacity: 40,
    points: [[680, 90], [840, 90], [840, 200], [680, 200]],
    label: [760, 150],
    pin: [0.605, 0.285],
    demandWeight: 7.5, // 핫스팟
  },
  {
    id: 'science',
    name: '자연과학관',
    kind: 'building',
    capacity: 55,
    points: [[60, 230], [220, 230], [220, 350], [60, 350]],
    label: [140, 295],
    pin: [0.360, 0.395],
    demandWeight: 3.0,
  },
  {
    id: 'business',
    name: '경상관',
    kind: 'building',
    capacity: 45,
    points: [[240, 230], [400, 230], [400, 350], [240, 350]],
    label: [320, 295],
    pin: [0.455, 0.395],
    demandWeight: 4.0,
  },
  {
    id: 'arts',
    name: '예술체육관',
    kind: 'building',
    capacity: 35,
    points: [[420, 240], [580, 240], [580, 350], [420, 350]],
    label: [500, 300],
    pin: [0.560, 0.400],
    demandWeight: 2.0,
  },
  {
    id: 'admin',
    name: '본관(행정동)',
    kind: 'building',
    capacity: 30,
    points: [[600, 240], [760, 240], [760, 350], [600, 350]],
    label: [680, 300],
    pin: [0.640, 0.400],
    demandWeight: 3.5,
  },
  {
    id: 'lotA',
    name: '제1주차장(정문)',
    kind: 'lot',
    capacity: 120,
    points: [[60, 400], [300, 400], [300, 560], [60, 560]],
    label: [180, 485],
    pin: [0.345, 0.520],
    demandWeight: 8.0, // 핫스팟 (메인 주차장 과밀)
  },
  {
    id: 'lotB',
    name: '제2주차장(중앙)',
    kind: 'lot',
    capacity: 90,
    points: [[320, 400], [540, 400], [540, 560], [320, 560]],
    label: [430, 485],
    pin: [0.360, 0.620],
    demandWeight: 4.5,
  },
  {
    id: 'lotC',
    name: '제3주차장(후문)',
    kind: 'lot',
    capacity: 150,
    points: [[560, 400], [840, 400], [840, 560], [560, 560]],
    label: [700, 485],
    pin: [0.585, 0.615],
    demandWeight: 2.5, // 한산 (멀어서 비어있음)
  },
  {
    id: 'dorm',
    name: '기숙사',
    kind: 'building',
    capacity: 70,
    points: [[860, 90], [960, 90], [960, 260], [860, 260]],
    label: [910, 175],
    pin: [0.640, 0.300],
    demandWeight: 6.0,
  },
  {
    id: 'gym',
    name: '실내체육관',
    kind: 'building',
    capacity: 40,
    points: [[860, 290], [960, 290], [960, 420], [860, 420]],
    label: [910, 355],
    pin: [0.665, 0.520],
    demandWeight: 2.0,
  },
  {
    id: 'lotD',
    name: '제4주차장(기숙사)',
    kind: 'lot',
    capacity: 60,
    points: [[860, 450], [960, 450], [960, 600], [860, 600]],
    label: [910, 525],
    pin: [0.665, 0.635],
    demandWeight: 5.5,
  },
]

export const ZONE_MAP: Record<string, Zone> = Object.fromEntries(
  ZONES.map((z) => [z.id, z]),
)

// 가라(목업) 현재 위치 — 실제 GPS 대신 정문 주차장 부근으로 고정.
// SVG 좌표계(1000 x 700) 기준 좌표 + 가장 가까운 구역.
export const CURRENT_LOCATION = {
  point: [200, 600] as [number, number], // 스키매틱 SVG 좌표 (미사용 가능)
  point2: [0.345, 0.6] as [number, number], // 실제 지도 이미지 정규화 좌표
  nearestZoneId: 'lotA',
  label: '정문 부근',
}

// ===== 실제 지도(Leaflet) 좌표 — 한양대학교 ERICA(안산) 캠퍼스 =====
export const CAMPUS_CENTER: [number, number] = [37.2966, 126.835]

// 정규화 핀 좌표(0~1)를 ERICA 캠퍼스 위경도 박스에 매핑
const CAMPUS_BBOX = { north: 37.3008, south: 37.2924, west: 126.8318, east: 126.8398 }
export function pinToGeo(pin: [number, number]): [number, number] {
  const lat = CAMPUS_BBOX.north - pin[1] * (CAMPUS_BBOX.north - CAMPUS_BBOX.south)
  const lng = CAMPUS_BBOX.west + pin[0] * (CAMPUS_BBOX.east - CAMPUS_BBOX.west)
  return [lat, lng]
}
