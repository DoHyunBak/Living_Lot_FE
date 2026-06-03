import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useStore } from '../store/store'
import { computeZoneStats } from '../lib/analytics'
import { REPORT_META } from '../types'
import { CURRENT_LOCATION, ZONE_MAP } from '../data/campus'
import LeafletCampusMap from '../components/LeafletCampusMap'
import ReportForm from '../components/ReportForm'

export default function StudentView() {
  const { reports, deviceId } = useStore()
  const stats = useMemo(() => computeZoneStats(reports), [reports])
  // 진입 시 가라(목업) 현재 위치 기준으로 가장 가까운 구역을 자동 선택
  const [selected, setSelected] = useState<string | null>(CURRENT_LOCATION.nearestZoneId)
  const [reporting, setReporting] = useState(false)
  const [justSubmitted, setJustSubmitted] = useState(false)

  // 홈에서 "현재 위치에서 신고" 로 진입한 경우 바로 신고 폼 오픈
  const locState = useLocation().state as { reportHere?: boolean } | null
  useEffect(() => {
    if (locState?.reportHere) {
      setSelected(CURRENT_LOCATION.nearestZoneId)
      setReporting(true)
    }
  }, [locState])

  // 현재 위치에서 바로 신고 시작
  const reportAtCurrentLocation = () => {
    setSelected(CURRENT_LOCATION.nearestZoneId)
    setReporting(true)
    setJustSubmitted(false)
  }

  const myReports = reports
    .filter((r) => r.deviceId === deviceId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  const selStat = stats.find((s) => s.zoneId === selected)

  return (
    <div className="student-view">
      <div className="map-panel">
        <div className="panel-head">
          <h2>캠퍼스 주차 현황</h2>
          <p className="muted">지도를 눌러 신고하세요. 색이 진할수록 신고가 많은 구역입니다.</p>
        </div>
        <div className="loc-banner">
          <span>
            📍 현재 위치: <b>{CURRENT_LOCATION.label}</b> ·{' '}
            {ZONE_MAP[CURRENT_LOCATION.nearestZoneId]?.name} 근처
          </span>
          <button className="loc-report-btn" onClick={reportAtCurrentLocation}>
            현재 위치에서 신고
          </button>
        </div>
        <LeafletCampusMap
          reports={reports}
          selectedZoneId={selected}
          showCurrentLocation
          height={520}
          onSelect={(id) => {
            setSelected(id)
            setReporting(false)
            setJustSubmitted(false)
          }}
        />
      </div>

      <aside className="side-panel">
        {!selected && (
          <div className="empty-hint">
            <h3>📍 구역을 선택하세요</h3>
            <p className="muted">
              주차 공간이 부족하거나, 불법주차를 발견했거나, 활용하면 좋을 유휴 공간이 있다면 해당
              위치를 눌러 신고할 수 있어요.
            </p>
            <p className="muted small">
              여러분의 신고가 쌓여 캠퍼스 주차장 확장 우선순위가 결정됩니다.
            </p>
          </div>
        )}

        {selected && !reporting && (
          <div className="zone-detail">
            <h3>{ZONE_MAP[selected]?.name}</h3>
            <div className="stat-row">
              <div className="stat-box">
                <span className="num">{selStat?.total ?? 0}</span>
                <span className="lbl">누적 신고</span>
              </div>
              <div className="stat-box">
                <span className="num">{ZONE_MAP[selected]?.capacity}</span>
                <span className="lbl">현재 주차면</span>
              </div>
            </div>
            {selStat && selStat.total > 0 && (
              <ul className="type-breakdown">
                {(['shortage', 'illegal', 'idea'] as const).map((t) => (
                  <li key={t}>
                    <span className="dot" style={{ background: REPORT_META[t].color }} />
                    {REPORT_META[t].short}
                    <b>{selStat.byType[t]}</b>
                  </li>
                ))}
              </ul>
            )}
            {justSubmitted && (
              <div className="success-banner">✓ 신고가 접수되었습니다. 감사합니다!</div>
            )}
            <button className="btn-primary full" onClick={() => setReporting(true)}>
              이 구역 신고하기
            </button>
          </div>
        )}

        {selected && reporting && (
          <ReportForm
            zoneId={selected}
            onDone={() => {
              setReporting(false)
              setJustSubmitted(true)
            }}
          />
        )}

        {myReports.length > 0 && (
          <div className="my-reports">
            <h4>내 신고 ({myReports.length})</h4>
            <ul>
              {myReports.slice(0, 5).map((r) => (
                <li key={r.id}>
                  <span className="dot" style={{ background: REPORT_META[r.type].color }} />
                  {ZONE_MAP[r.zoneId]?.name} · {REPORT_META[r.type].short}
                </li>
              ))}
            </ul>
          </div>
        )}
      </aside>
    </div>
  )
}
