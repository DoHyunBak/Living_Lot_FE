import { useRef } from 'react'
import { useSpring } from 'framer-motion'

const SPRING = { stiffness: 150, damping: 20, mass: 0.6 }

/**
 * 마그네틱 호버: 커서가 요소 위에 있을 때 부드럽게 끌려오는 효과.
 * 반환된 ref / x / y / 핸들러를 motion 요소에 연결한다.
 */
export function useMagnetic(strength = 0.35) {
  const ref = useRef<HTMLDivElement>(null)
  const x = useSpring(0, SPRING)
  const y = useSpring(0, SPRING)

  const onMouseMove = (e: React.MouseEvent) => {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    x.set((e.clientX - (r.left + r.width / 2)) * strength)
    y.set((e.clientY - (r.top + r.height / 2)) * strength)
  }
  const onMouseLeave = () => {
    x.set(0)
    y.set(0)
  }

  return { ref, x, y, onMouseMove, onMouseLeave }
}
