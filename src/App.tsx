import { Link, NavLink, Route, HashRouter as Router, Routes } from 'react-router-dom'
import { StoreProvider } from './store/store'
import Home from './pages/Home'
import StudentView from './pages/StudentView'
import AdminDashboard from './pages/AdminDashboard'
import BottomNav from './components/BottomNav'
import './App.css'

export default function App() {
  return (
    <StoreProvider>
      <Router>
        <div className="app">
          <header className="topbar">
            <Link to="/" className="brand" aria-label="홈으로">
              <span className="logo">🅿️</span>
              <div>
                <span className="brand-name">Living_Lot</span>
                <span className="brand-sub">살아있는 주차장 · 데이터로 만드는 캠퍼스 주차</span>
              </div>
            </Link>
            <nav className="nav">
              <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>
                홈
              </NavLink>
              <NavLink to="/map" className={({ isActive }) => (isActive ? 'active' : '')}>
                참여 지도
              </NavLink>
              <NavLink to="/admin" className={({ isActive }) => (isActive ? 'active' : '')}>
                통계
              </NavLink>
            </nav>
          </header>
          <main>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/map" element={<StudentView />} />
              <Route path="/admin" element={<AdminDashboard />} />
            </Routes>
          </main>
          <BottomNav />
        </div>
      </Router>
    </StoreProvider>
  )
}
