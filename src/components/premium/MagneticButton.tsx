import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import { useMagnetic } from '../../hooks/useMagnetic'

interface Props {
  children: ReactNode
  onClick?: () => void
  variant?: 'solid' | 'ghost'
  className?: string
}

/** 스프링 기반 마그네틱 버튼 (커서를 향해 부드럽게 끌림 + tap 스케일) */
export default function MagneticButton({ children, onClick, variant = 'solid', className = '' }: Props) {
  const { ref, x, y, onMouseMove, onMouseLeave } = useMagnetic(0.4)

  const base =
    'relative inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-[15px] font-bold tracking-tight select-none cursor-pointer transition-colors'
  const styles =
    variant === 'solid'
      ? 'bg-white text-brand-dark hover:bg-[#eaf2fb] shadow-[0_8px_24px_rgba(0,0,0,0.18)]'
      : 'bg-white/10 text-white border border-white/40 hover:bg-white/20 backdrop-blur'

  return (
    <motion.div
      ref={ref}
      style={{ x, y }}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      whileTap={{ scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className="inline-block"
    >
      <button className={`${base} ${styles} ${className}`} onClick={onClick}>
        {children}
      </button>
    </motion.div>
  )
}
