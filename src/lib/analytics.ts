import type { Report, ReportType } from '../types'
import { REPORT_META } from '../types'
import { ZONES, ZONE_MAP } from '../data/campus'

export interface ZoneStat {
  zoneId: string
  name: string
  capacity: number
  total: number
  byType: Record<ReportType, number>
  // 신고가 발생한 서로 다른 날짜 수 (만성도/지속성)
  persistenceDays: number
  // 0~1 정규화된 히트 강도
  intensity: number
  // 확장 우선순위 점수
  score: number
}

const dayKey = (iso: string) => iso.slice(0, 10)

/** 존별 집계 + 확장 우선순위 점수 계산 */
export function computeZoneStats(reports: Report[]): ZoneStat[] {
  const acc: Record<
    string,
    { total: number; byType: Record<ReportType, number>; days: Set<string> }
  > = {}
  for (const z of ZONES) {
    acc[z.id] = { total: 0, byType: { illegal: 0, shortage: 0, idea: 0 }, days: new Set() }
  }
  for (const r of reports) {
    const a = acc[r.zoneId]
    if (!a) continue
    a.total++
    a.byType[r.type]++
    a.days.add(dayKey(r.createdAt))
  }

  const maxTotal = Math.max(1, ...ZONES.map((z) => acc[z.id].total))

  // 원시 점수 계산 → 이후 0~100 으로 정규화
  const raw = ZONES.map((z) => {
    const a = acc[z.id]
    // 수요 = 불법/부족 신고 (제안은 공급측이라 제외)
    const demand =
      a.byType.illegal * REPORT_META.illegal.severity +
      a.byType.shortage * REPORT_META.shortage.severity
    const persistence = a.days.size
    // 점수 = (수요 × √지속일수) / 현재 수용능력
    const score = (demand * Math.sqrt(persistence)) / Math.max(20, z.capacity)
    return { z, a, score }
  })

  const maxScore = Math.max(1e-6, ...raw.map((r) => r.score))

  return raw
    .map(({ z, a, score }) => ({
      zoneId: z.id,
      name: z.name,
      capacity: z.capacity,
      total: a.total,
      byType: a.byType,
      persistenceDays: a.days.size,
      intensity: a.total / maxTotal,
      score: Math.round((score / maxScore) * 100),
    }))
    .sort((x, y) => y.score - x.score)
}

/** 시간대(0~23)별 신고 수 */
export function byHour(reports: Report[]) {
  const buckets = Array.from({ length: 24 }, (_, h) => ({ hour: h, count: 0 }))
  for (const r of reports) buckets[new Date(r.createdAt).getHours()].count++
  return buckets
}

/** 요일별 신고 수 (월~일) */
export function byWeekday(reports: Report[]) {
  const labels = ['일', '월', '화', '수', '목', '금', '토']
  const counts = [0, 0, 0, 0, 0, 0, 0]
  for (const r of reports) counts[new Date(r.createdAt).getDay()]++
  // 월~일 순서로 재배열
  const order = [1, 2, 3, 4, 5, 6, 0]
  return order.map((i) => ({ day: labels[i], count: counts[i] }))
}

/** 주별 추세 (신고 건수/주간) */
export function byWeek(reports: Report[]) {
  const map = new Map<string, number>()
  for (const r of reports) {
    const d = new Date(r.createdAt)
    const onejan = new Date(d.getFullYear(), 0, 1)
    const week = Math.ceil(((d.getTime() - onejan.getTime()) / 86400000 + onejan.getDay() + 1) / 7)
    const key = `${week}주`
    map.set(key, (map.get(key) ?? 0) + 1)
  }
  return [...map.entries()]
    .map(([week, count]) => ({ week, count, n: parseInt(week) }))
    .sort((a, b) => a.n - b.n)
    .map(({ week, count }) => ({ week, count }))
}

/** 유형별 분포 */
export function byType(reports: Report[]) {
  const counts: Record<ReportType, number> = { illegal: 0, shortage: 0, idea: 0 }
  for (const r of reports) counts[r.type]++
  return (Object.keys(counts) as ReportType[]).map((t) => ({
    type: t,
    name: REPORT_META[t].short,
    count: counts[t],
    color: REPORT_META[t].color,
  }))
}

export function zoneName(id: string) {
  return ZONE_MAP[id]?.name ?? id
}

/** 요일(월~일) × 시간대(0~23) 혼잡 매트릭스 */
export function dayHourMatrix(reports: Report[]) {
  // dayOrder: 0=월 ... 6=일
  const matrix = Array.from({ length: 7 }, () => new Array(24).fill(0))
  const toRow = (jsDay: number) => (jsDay + 6) % 7 // 일(0)→6, 월(1)→0 ...
  let max = 0
  for (const r of reports) {
    const d = new Date(r.createdAt)
    const row = toRow(d.getDay())
    const h = d.getHours()
    matrix[row][h]++
    if (matrix[row][h] > max) max = matrix[row][h]
  }
  return { matrix, max }
}

/** 구역별 신고 수 (내림차순) — 가로 막대용 */
export function zoneTotals(reports: Report[]) {
  const map: Record<string, number> = {}
  for (const z of ZONES) map[z.id] = 0
  for (const r of reports) if (map[r.zoneId] !== undefined) map[r.zoneId]++
  return ZONES.map((z) => ({ id: z.id, name: z.name, total: map[z.id] }))
    .sort((a, b) => b.total - a.total)
}

/** 구역별 유형 분해 (스택 막대용, 상위 N) */
export function zoneTypeBreakdown(reports: Report[], topN = 8) {
  const map: Record<string, Record<ReportType, number>> = {}
  for (const z of ZONES) map[z.id] = { illegal: 0, shortage: 0, idea: 0 }
  for (const r of reports) if (map[r.zoneId]) map[r.zoneId][r.type]++
  return ZONES.map((z) => ({
    name: z.name,
    ...map[z.id],
    total: map[z.id].illegal + map[z.id].shortage + map[z.id].idea,
  }))
    .sort((a, b) => b.total - a.total)
    .slice(0, topN)
}
