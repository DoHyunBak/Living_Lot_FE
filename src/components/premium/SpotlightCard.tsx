import { motion, useMotionTemplate, useMotionValue, useSpring } from 'framer-motion'
import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
  className?: string
  tilt?: number // 최대 기울기(도)
}

const SPRING = { stiffness: 150, damping: 20, mass: 0.5 }

/**
 * Bento 카드: 마우스 추적 3D 틸트 + 커서를 따라다니는 글래스모피즘 스포트라이트 글레어.
 * 스프링 물리로 유기적으로 복원된다.
 */
export default function SpotlightCard({ children, className = '', tilt = 6 }: Props) {
  const rotateX = useSpring(0, SPRING)
  const rotateY = useSpring(0, SPRING)
  // 글레어 위치 (%)
  const gx = useMotionValue(50)
  const gy = useMotionValue(50)
  const glareOpacity = useSpring(0, SPRING)

  const onMouseMove = (e: React.MouseEvent) => {
    const r = e.currentTarget.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width
    const py = (e.clientY - r.top) / r.height
    rotateY.set((px - 0.5) * tilt * 2)
    rotateX.set(-(py - 0.5) * tilt * 2)
    gx.set(px * 100)
    gy.set(py * 100)
    glareOpacity.set(1)
  }
  const onMouseLeave = () => {
    rotateX.set(0)
    rotateY.set(0)
    glareOpacity.set(0)
  }

  const glare = useMotionTemplate`radial-gradient(420px circle at ${gx}% ${gy}%, rgba(255,255,255,0.55), transparent 42%)`

  return (
    <motion.div
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      style={{ rotateX, rotateY, transformPerspective: 900, transformStyle: 'preserve-3d' }}
      className={`group relative overflow-hidden rounded-3xl border border-black/[0.06] bg-white shadow-premium ${className}`}
    >
      {/* 스포트라이트 글레어 */}
      <motion.div
        aria-hidden
        style={{ background: glare, opacity: glareOpacity }}
        className="pointer-events-none absolute inset-0 z-10 mix-blend-overlay"
      />
      {/* 미세 보더 하이라이트 */}
      <div className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-inset ring-white/40" />
      <div className="relative z-0 h-full" style={{ transform: 'translateZ(40px)' }}>
        {children}
      </div>
    </motion.div>
  )
}
