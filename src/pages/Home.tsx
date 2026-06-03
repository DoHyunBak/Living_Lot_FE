import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, type Variants } from 'framer-motion'
import { useStore } from '../store/store'
import { byHour, byWeekday, computeZoneStats } from '../lib/analytics'
import { timeAgo } from '../lib/format'
import { REPORT_META } from '../types'
import { CURRENT_LOCATION, ZONE_MAP } from '../data/campus'
import CountUp from '../components/CountUp'
import ReportModal from '../components/ReportModal'
import HowItWorks from '../components/HowItWorks'
import SpotlightCard from '../components/premium/SpotlightCard'
import MagneticButton from '../components/premium/MagneticButton'

const SPRING = { type: 'spring', stiffness: 150, damping: 20 } as const

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
}
const item: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: SPRING },
}

export default function Home() {
  const { reports } = useStore()
  const nav = useNavigate()
  const [reportOpen, setReportOpen] = useState(false)

  const stats = useMemo(() => computeZoneStats(reports), [reports])
  const participants = useMemo(() => new Set(reports.map((r) => r.deviceId)).size, [reports])
  const recent = useMemo(
    () => [...reports].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 4),
    [reports],
  )
  const now = new Date()
  const todayCount = useMemo(
    () => reports.filter((r) => r.createdAt.slice(0, 10) === now.toISOString().slice(0, 10)).length,
    [reports, now],
  )
  const peakHour = useMemo(() => {
    const h = byHour(reports)
    return h.reduce((a, b) => (b.count > a.count ? b : a), h[0])
  }, [reports])
  const peakDay = useMemo(() => {
    const w = byWeekday(reports)
    return w.reduce((a, b) => (b.count > a.count ? b : a), w[0])
  }, [reports])

  const hotspot = stats[0]
  const nearest = ZONE_MAP[CURRENT_LOCATION.nearestZoneId]

  return (
    <div className="flex flex-col gap-5">
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 gap-4 lg:grid-cols-4"
      >
        {/* HERO */}
        <motion.div variants={item} className="col-span-2 lg:col-span-2 lg:row-span-2">
          <div className="relative h-full overflow-hidden rounded-3xl bg-gradient-to-br from-brand to-brand-dark p-8 text-white shadow-premium lg:p-9">
            <div className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.07]"
              style={{
                backgroundImage:
                  'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
                backgroundSize: '34px 34px',
              }}
            />
            <div className="relative flex h-full flex-col">
              <span className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-semibold backdrop-blur">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                </span>
                Living Lab · 시민참여 데이터 플랫폼
              </span>

              <h1 className="text-[32px] font-extrabold leading-[1.12] tracking-[-1.2px] lg:text-[44px]">
                살아있는 주차장,
                <br />
                <span className="bg-gradient-to-r from-white to-[#bfe0ff] bg-clip-text text-transparent">
                  데이터가 캠퍼스를 바꿉니다
                </span>
              </h1>

              <p className="mt-4 max-w-md text-[14px] leading-relaxed text-white/85 lg:text-[15px]">
                여러분의 신고 한 건이 모여 <b className="text-white">다음 주차장을 어디에 만들지</b>{' '}
                결정합니다.
              </p>

              <div className="mt-auto pt-7">
                <div className="flex flex-wrap gap-3">
                  <MagneticButton variant="solid" onClick={() => setReportOpen(true)}>
                    📍 현재 위치에서 신고하기
                  </MagneticButton>
                  <MagneticButton variant="ghost" onClick={() => nav('/map')}>
                    🗺️ 지도에서 둘러보기
                  </MagneticButton>
                </div>
                <p className="mt-4 text-[13px] text-white/70">
                  현재 위치: <b className="text-white/90">{CURRENT_LOCATION.label}</b> · {nearest?.name} 근처
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* 핵심 KPI 4개 */}
        <motion.div variants={item}>
          <StatTile label="누적 신고" value={reports.length} sub="시민 신고 데이터" accent />
        </motion.div>
        <motion.div variants={item}>
          <StatTile label="참여 학생" value={participants} sub="고유 참여자" />
        </motion.div>
        <motion.div variants={item}>
          <StatTile label="오늘 신고" value={todayCount} sub="실시간 집계" />
        </motion.div>
        <motion.div variants={item}>
          <StatTile label="활성 구역" value={stats.filter((s) => s.total > 0).length} sub="신고 발생 구역" />
        </motion.div>
      </motion.div>

      {/* 이번 주 핵심 인사이트 + 실시간 신고 */}
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.3 }}
        className="grid grid-cols-1 gap-4 lg:grid-cols-2"
      >
        <motion.div variants={item}>
          <SpotlightCard className="h-full">
            <div className="flex h-full flex-col p-7">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-bold tracking-tight text-ink">📌 이번 주 핵심</h3>
                <button
                  onClick={() => nav('/admin')}
                  className="text-[13px] font-semibold text-brand hover:text-brand-dark"
                >
                  통계 자세히 →
                </button>
              </div>
              <div className="space-y-3">
                <InsightRow
                  icon="🔥"
                  label="가장 많은 신고"
                  value={hotspot ? `${hotspot.name} · ${hotspot.total}건` : '-'}
                />
                <InsightRow icon="⏰" label="가장 붐비는 시간" value={`${peakDay?.day}요일 ${peakHour?.hour}시`} />
                <InsightRow
                  icon="🏗️"
                  label="확장 1순위 후보"
                  value={hotspot ? `${hotspot.name} (점수 ${hotspot.score})` : '-'}
                />
              </div>
              <button
                onClick={() => nav('/admin')}
                className="mt-auto w-full rounded-xl bg-brand-light py-3 text-sm font-bold text-brand-dark transition-colors hover:bg-brand hover:text-white"
              >
                통계 대시보드 보기
              </button>
            </div>
          </SpotlightCard>
        </motion.div>

        <motion.div variants={item}>
          <SpotlightCard className="h-full">
            <div className="p-7">
              <h3 className="mb-4 flex items-center gap-2 text-lg font-bold tracking-tight text-ink">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                </span>
                실시간 신고
              </h3>
              <ul className="space-y-1">
                {recent.map((r) => (
                  <li
                    key={r.id}
                    className="flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-slate-50"
                  >
                    <span
                      className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                      style={{ background: REPORT_META[r.type].color }}
                    />
                    <span className="text-sm text-ink">
                      <b>{ZONE_MAP[r.zoneId]?.name}</b>
                      <span className="text-slate-400"> · {REPORT_META[r.type].short}</span>
                    </span>
                    <span className="ml-auto text-xs tabular-nums text-slate-400">
                      {timeAgo(r.createdAt, now)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </SpotlightCard>
        </motion.div>
      </motion.div>

      <HowItWorks />

      {reportOpen && (
        <ReportModal
          zoneId={CURRENT_LOCATION.nearestZoneId}
          locationLabel={`현재 위치 · ${CURRENT_LOCATION.label}`}
          onClose={() => setReportOpen(false)}
        />
      )}
    </div>
  )
}

/* ── 보조 컴포넌트 ── */

function StatTile({
  label,
  value,
  sub,
  accent = false,
}: {
  label: string
  value: number
  sub: string
  accent?: boolean
}) {
  return (
    <SpotlightCard className="h-full">
      <div className="flex h-full flex-col justify-center p-5 lg:p-6">
        <div className="text-[12px] font-semibold uppercase tracking-wider text-slate-400">{label}</div>
        <div className={`mt-1 text-3xl font-extrabold tracking-[-1.5px] lg:text-4xl ${accent ? 'text-brand' : 'text-ink'}`}>
          <CountUp to={value} />
        </div>
        <div className="mt-1 text-xs text-slate-400">{sub}</div>
      </div>
    </SpotlightCard>
  )
}

function InsightRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3">
      <span className="text-xl">{icon}</span>
      <span className="text-sm text-slate-500">{label}</span>
      <span className="ml-auto text-sm font-bold text-ink">{value}</span>
    </div>
  )
}
