import { NavLink } from 'react-router-dom'

const TABS = [
  { to: '/', label: '홈', icon: '🏠', end: true },
  { to: '/map', label: '참여 지도', icon: '🗺️', end: false },
  { to: '/admin', label: '통계', icon: '📊', end: false },
]

/** 모바일 전용 하단 탭바 (앱 같은 내비게이션) */
export default function BottomNav() {
  return (
    <nav className="bottom-nav">
      {TABS.map((t) => (
        <NavLink
          key={t.to}
          to={t.to}
          end={t.end}
          className={({ isActive }) => `bn-item ${isActive ? 'on' : ''}`}
        >
          <span className="bn-icon">{t.icon}</span>
          <span className="bn-label">{t.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
