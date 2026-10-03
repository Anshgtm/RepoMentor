import { useEffect, useRef } from 'react'
import { gsap, ScrollTrigger, reducedMotion } from './motion'

export function Reveal({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!ref.current) return
    if (reducedMotion()) { gsap.set(ref.current, { clearProps: 'all' }); return }
    const context = gsap.context(() => {
      gsap.fromTo(ref.current, { opacity: 0, y: 28 }, { opacity: 1, y: 0, duration: .85, delay, ease: 'power3.out', scrollTrigger: { trigger: ref.current, start: 'top 88%', once: true } })
    }, ref)
    return () => context.revert()
  }, [delay])
  return <div ref={ref} className={className}>{children}</div>
}
