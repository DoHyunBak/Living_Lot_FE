import type { Report, ReportType } from '../types'
import { ZONES } from './campus'

// 결정적(seeded) 난수 → 새로고침해도 같은 데이터셋 유지
function mulberry32(seed: number) {
  return function () {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const rand = mulberry32(20260603)

function pick<T>(arr: T[]): T {
  return arr[Math.floor(rand() * arr.length)]
}

// 가중치 기반 존 선택 → 핫스팟 형성
function weightedZoneId(): string {
  const total = ZONES.reduce((s, z) => s + z.demandWeight, 0)
  let r = rand() * total
  for (const z of ZONES) {
    r -= z.demandWeight
    if (r <= 0) return z.id
  }
  return ZONES[ZONES.length - 1].id
}

// 유형 분포: 부족 55% / 불법 35% / 제안 10%
function weightedType(): ReportType {
  const r = rand()
  if (r < 0.55) return 'shortage'
  if (r < 0.9) return 'illegal'
  return 'idea'
}

// 시간대: 출근 피크(08:30~10:00) + 점심 피크(13:00~14:00) 양봉 분포
function peakHour(): { h: number; m: number } {
  const r = rand()
  let h: number
  if (r < 0.45) h = 8 + Math.floor(rand() * 2) // 8~9시 (출근)
  else if (r < 0.75) h = 13 // 점심
  else if (r < 0.9) h = 10 + Math.floor(rand() * 3) // 10~12 오전
  else h = 15 + Math.floor(rand() * 5) // 오후 산발
  return { h, m: Math.floor(rand() * 60) }
}

const NOTES: Record<ReportType, string[]> = {
  shortage: [
    '자리가 하나도 없어서 10분째 돌고 있어요.',
    '만차라 다른 주차장으로 이동했습니다.',
    '오전마다 자리 찾기가 너무 힘듭니다.',
    '수업 늦을 뻔했어요. 공간이 부족합니다.',
    '',
  ],
  illegal: [
    '통로에 이중 주차되어 있어 차를 못 뺍니다.',
    '장애인 구역에 일반 차량이 주차했습니다.',
    '소화전 앞에 주차되어 있습니다.',
    '인도 위에 올라와서 주차했어요.',
    '',
  ],
  idea: [
    '건물 뒤편 공터를 주차장으로 활용하면 좋겠어요.',
    '이 잔디밭 옆 공간은 늘 비어있습니다.',
    '낮 시간 거의 안 쓰는 공간 같아요.',
    '',
  ],
}

const DEVICE_IDS = Array.from({ length: 140 }, (_, i) => `dev-${1000 + i}`)

export function generateReports(count = 500): Report[] {
  const reports: Report[] = []
  const now = new Date('2026-06-03T18:00:00')
  const SPAN_DAYS = 56 // 약 8주

  for (let i = 0; i < count; i++) {
    // 날짜: 최근일수록 약간 더 많게(가속 곡선), 주말은 희박
    let dayOffset = 0
    for (let attempt = 0; attempt < 10; attempt++) {
      const skew = Math.pow(rand(), 1.4) // 최근 쪽으로 치우침
      dayOffset = Math.floor(skew * SPAN_DAYS)
      const d = new Date(now)
      d.setDate(d.getDate() - dayOffset)
      const dow = d.getDay()
      // 주말(0,6)은 85% 확률로 제외 → 평일 집중
      if ((dow === 0 || dow === 6) && rand() < 0.85) continue
      break
    }

    const d = new Date(now)
    d.setDate(d.getDate() - dayOffset)
    const { h, m } = peakHour()
    d.setHours(h, m, Math.floor(rand() * 60), 0)

    const type = weightedType()
    reports.push({
      id: `r${i.toString().padStart(4, '0')}`,
      zoneId: weightedZoneId(),
      type,
      note: pick(NOTES[type]),
      createdAt: d.toISOString(),
      deviceId: pick(DEVICE_IDS),
    })
  }

  // 시간순 정렬
  reports.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  return reports
}
