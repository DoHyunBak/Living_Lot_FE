import { useEffect, useRef, useState } from 'react'

export default function CountUp({ to, duration = 1100 }: { to: number; duration?: number }) {
  const [val, setVal] = useState(0)
  const raf = useRef<number>(0)

  useEffect(() => {
    const start = performance.now()
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration)
      // easeOutCubic
      const eased = 1 - Math.pow(1 - p, 3)
      setVal(Math.round(to * eased))
      if (p < 1) raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [to, duration])

  return <>{val.toLocaleString('ko-KR')}</>
}
