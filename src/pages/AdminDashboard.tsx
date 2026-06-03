import { useMemo, useState } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useStore } from '../store/store'
import {
  byHour,
  byType,
  byWeek,
  byWeekday,
  computeZoneStats,
  zoneTotals,
  zoneTypeBreakdown,
} from '../lib/analytics'
import { REPORT_META, type ReportType } from '../types'
import { ZONE_MAP } from '../data/campus'
import LeafletCampusMap from '../components/LeafletCampusMap'
import CongestionHeatmap from '../components/CongestionHeatmap'

export default function StatsDashboard() {
  const { reports, resetData } = useStore()
  const [filterType, setFilterType] = useState<ReportType | 'all'>('all')
  const [filterZone, setFilterZone] = useState<string>('all')

  const stats = useMemo(() => computeZoneStats(reports), [reports])
  const hour = useMemo(() => byHour(reports), [reports])
  const weekday = useMemo(() => byWeekday(reports), [reports])
  const week = useMemo(() => byWeek(reports), [reports])
  const types = useMemo(() => byType(reports), [reports])
  const zTotals = useMemo(() => zoneTotals(reports).slice(0, 8), [reports])
  const zBreakdown = useMemo(() => zoneTypeBreakdown(reports), [reports])

  const filtered = useMemo(
    () =>
      reports
        .filter((r) => filterType === 'all' || r.type === filterType)
        .filter((r) => filterZone === 'all' || r.zoneId === filterZone)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [reports, filterType, filterZone],
  )

  const top = stats[0]
  const peakHour = hour.reduce((a, b) => (b.count > a.count ? b : a), hour[0])
  const peakDay = weekday.reduce((a, b) => (b.count > a.count ? b : a), weekday[0])

  return (
    <div className="admin">
      <div className="admin-head">
        <div>
          <h2>📊 통계 대시보드</h2>
          <p className="muted">모두가 함께 보는 캠퍼스 주차 데이터 — 그래프로 한눈에 이해하기</p>
        </div>
        <button className="btn-ghost" onClick={resetData}>
          데이터 재생성
        </button>
      </div>

      {/* KPI */}
      <div className="kpi-row">
        <div className="kpi">
          <span className="kpi-num">{reports.length.toLocaleString()}</span>
          <span className="kpi-lbl">총 신고 건수</span>
        </div>
        <div className="kpi">
          <span className="kpi-num">{top?.name ?? '-'}</span>
          <span className="kpi-lbl">최다 신고 구역</span>
        </div>
        <div className="kpi">
          <span className="kpi-num">{peakHour?.hour}시</span>
          <span className="kpi-lbl">가장 붐비는 시간</span>
        </div>
        <div className="kpi">
          <span className="kpi-num">{peakDay?.day}요일</span>
          <span className="kpi-lbl">가장 붐비는 요일</span>
        </div>
      </div>

      {/* 지도 + 확장 우선순위 */}
      <div className="admin-grid">
        <section className="card span2">
          <h3>🗺️ 주차 수요 히트맵</h3>
          <p className="muted small">신고가 집중된 구역일수록 빨갛게 표시됩니다.</p>
          <LeafletCampusMap reports={reports} compact height={380} />
        </section>

        <section className="card span2">
          <h3>🏗️ 확장 우선순위 랭킹</h3>
          <p className="muted small">
            점수 = (수요 × √지속일수) ÷ 현재 주차면 — 만성적·심각·과밀 구역일수록 높습니다.
          </p>
          <ol className="ranking">
            {stats.slice(0, 6).map((s, i) => (
              <li key={s.zoneId}>
                <span className="rank">{i + 1}</span>
                <span className="rank-name">{s.name}</span>
                <span className="rank-bar-wrap">
                  <span className="rank-bar" style={{ width: `${s.score}%` }} />
                </span>
                <span className="rank-score">{s.score}</span>
              </li>
            ))}
          </ol>
        </section>
      </div>

      {/* 요일 × 시간대 혼잡 히트맵 */}
      <section className="card">
        <h3>🕒 요일 × 시간대 혼잡도</h3>
        <p className="muted small">언제 주차 문제가 몰리는지 한눈에. 진한 칸일수록 신고가 많은 시간대입니다.</p>
        <CongestionHeatmap reports={reports} />
      </section>

      {/* 시간대 / 요일 */}
      <div className="admin-grid">
        <section className="card">
          <h3>⏰ 시간대별 신고</h3>
          <p className="muted small">하루 중 신고가 집중되는 시간 분포</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={hour}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef2f6" vertical={false} />
              <XAxis dataKey="hour" tick={{ fontSize: 11 }} interval={2} />
              <YAxis tick={{ fontSize: 11 }} width={28} />
              <Tooltip cursor={{ fill: 'rgba(14,74,132,0.06)' }} />
              <Bar dataKey="count" fill="#0e4a84" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </section>

        <section className="card">
          <h3>📅 요일별 신고</h3>
          <p className="muted small">평일/주말 신고량 비교</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={weekday}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef2f6" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} width={28} />
              <Tooltip cursor={{ fill: 'rgba(14,74,132,0.06)' }} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {weekday.map((d) => (
                  <Cell key={d.day} fill={d.day === '토' || d.day === '일' ? '#c8102e' : '#0e4a84'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </section>
      </div>

      {/* 유형 도넛 / 주별 추세 */}
      <div className="admin-grid">
        <section className="card">
          <h3>🧩 신고 유형 비율</h3>
          <p className="muted small">어떤 문제가 가장 많이 신고되는가</p>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={types}
                dataKey="count"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={48}
                outerRadius={78}
                paddingAngle={3}
                label={(e) => `${e.name} ${Math.round((e.percent ?? 0) * 100)}%`}
              >
                {types.map((t) => (
                  <Cell key={t.type} fill={t.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </section>

        <section className="card">
          <h3>📈 주별 신고 추세</h3>
          <p className="muted small">신고량이 시간에 따라 어떻게 변하는가</p>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={week}>
              <defs>
                <linearGradient id="trend" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0e4a84" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#0e4a84" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef2f6" vertical={false} />
              <XAxis dataKey="week" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} width={28} />
              <Tooltip />
              <Area type="monotone" dataKey="count" stroke="#0e4a84" strokeWidth={2.5} fill="url(#trend)" />
            </AreaChart>
          </ResponsiveContainer>
        </section>
      </div>

      {/* 구역별 신고 / 구역별 유형 */}
      <div className="admin-grid">
        <section className="card">
          <h3>🏢 구역별 신고 (상위 8)</h3>
          <p className="muted small">어느 건물·주차장에 문제가 집중되는가</p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={zTotals} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef2f6" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={92} />
              <Tooltip cursor={{ fill: 'rgba(14,74,132,0.06)' }} />
              <Bar dataKey="total" fill="#0e4a84" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </section>

        <section className="card">
          <h3>📚 구역별 유형 분해</h3>
          <p className="muted small">구역마다 어떤 문제 유형이 많은가 (누적 막대)</p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={zBreakdown} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef2f6" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={92} />
              <Tooltip cursor={{ fill: 'rgba(14,74,132,0.06)' }} />
              <Bar dataKey="shortage" stackId="a" fill={REPORT_META.shortage.color} name="공간부족" />
              <Bar dataKey="illegal" stackId="a" fill={REPORT_META.illegal.color} name="불법주차" />
              <Bar dataKey="idea" stackId="a" fill={REPORT_META.idea.color} radius={[0, 4, 4, 0]} name="공간제안" />
            </BarChart>
          </ResponsiveContainer>
        </section>
      </div>

      {/* 원자료 테이블 */}
      <section className="card">
        <div className="table-head">
          <h3>📋 신고 원자료</h3>
          <div className="filters">
            <select value={filterType} onChange={(e) => setFilterType(e.target.value as ReportType | 'all')}>
              <option value="all">전체 유형</option>
              {(['shortage', 'illegal', 'idea'] as const).map((t) => (
                <option key={t} value={t}>
                  {REPORT_META[t].short}
                </option>
              ))}
            </select>
            <select value={filterZone} onChange={(e) => setFilterZone(e.target.value)}>
              <option value="all">전체 구역</option>
              {stats.map((s) => (
                <option key={s.zoneId} value={s.zoneId}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>일시</th>
                <th>구역</th>
                <th>유형</th>
                <th>내용</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 100).map((r) => (
                <tr key={r.id}>
                  <td className="nowrap">
                    {new Date(r.createdAt).toLocaleString('ko-KR', {
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td>{ZONE_MAP[r.zoneId]?.name}</td>
                  <td>
                    <span className="tag" style={{ background: REPORT_META[r.type].color }}>
                      {REPORT_META[r.type].short}
                    </span>
                  </td>
                  <td className="note-cell">{r.note || <span className="muted">—</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="muted small">{filtered.length}건 중 상위 100건 표시</p>
      </section>
    </div>
  )
}
