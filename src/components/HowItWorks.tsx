import { useEffect, useRef, useState, type ReactNode } from 'react'

/* 미니멀 2D 라인 아이콘 (stroke=currentColor, 브랜드 컬러 상속) */
const stroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

function PinIcon() {
  return (
    <svg viewBox="0 0 24 24" {...stroke}>
      <path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  )
}
function ChartIcon() {
  return (
    <svg viewBox="0 0 24 24" {...stroke}>
      <path d="M4 19V5" />
      <path d="M4 19h16" />
      <rect x="7" y="11" width="3" height="5" rx="0.5" />
      <rect x="12.5" y="7" width="3" height="9" rx="0.5" />
      <rect x="18" y="13" width="3" height="3" rx="0.5" />
    </svg>
  )
}
function BuildIcon() {
  return (
    <svg viewBox="0 0 24 24" {...stroke}>
      <path d="M4 21h16" />
      <path d="M6 21V8l6-3 6 3v13" />
      <path d="M10 12h0M14 12h0M10 16h0M14 16h0" />
    </svg>
  )
}

const STAGES: { icon: ReactNode; tag: string; title: string; desc: string; metric: string }[] = [
  {
    icon: <PinIcon />,
    tag: 'STEP 1',
    title: '신고',
    desc: '주차 공간 부족·불법주차·유휴 공간을 발견하면 지도에서 한 번에 신고합니다.',
    metric: '시민 = 센서',
  },
  {
    icon: <ChartIcon />,
    tag: 'STEP 2',
    title: '분석',
    desc: '신고가 모여 수요 히트맵과 시간대별 혼잡 패턴으로 살아 움직입니다.',
    metric: '데이터로 시각화',
  },
  {
    icon: <BuildIcon />,
    tag: 'STEP 3',
    title: '의사결정',
    desc: '확장 우선순위 점수로 다음 주차장을 어디에 만들지 결정합니다.',
    metric: '근거 있는 확장',
  },
]

export default function HowItWorks() {
  const ref = useRef<HTMLElement>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setInView(true)
          io.disconnect()
        }
      },
      { threshold: 0.25 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <section className={`vision ${inView ? 'in' : ''}`} ref={ref}>
      <div className="vision-head">
        <span className="vision-eyebrow">OUR VISION</span>
        <h3>데이터가 주차장이 되기까지</h3>
        <p>시민의 신고 한 건이 캠퍼스 인프라 결정으로 이어집니다</p>
      </div>

      <div className="vision-flow">
        {STAGES.map((s) => (
          <div className="vision-stage" key={s.tag}>
            <div className="vstage-icon">{s.icon}</div>
            <span className="vstage-tag">{s.tag}</span>
            <strong>{s.title}</strong>
            <p>{s.desc}</p>
            <span className="vstage-metric">{s.metric}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
