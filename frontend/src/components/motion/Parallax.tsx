import { useEffect, useRef } from 'react'
import { gsap, ScrollTrigger, reducedMotion } from './motion'

export function Parallax({ children, className = '', amount = 28 }: { children: React.ReactNode; className?: string; amount?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!ref.current || reducedMotion()) return
    const context = gsap.context(() => {
      gsap.to(ref.current, { y: amount, ease: 'none', scrollTrigger: { trigger: ref.current, start: 'top bottom', end: 'bottom top', scrub: 1.2 } })
    }, ref)
    return () => context.revert()
  }, [amount])
  return <div ref={ref} className={className}>{children}</div>
}
