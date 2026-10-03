import { useEffect, useRef } from 'react'
import { FileCode2, Network, Route } from 'lucide-react'
import { gsap, reducedMotion } from '../motion/motion'

export function OrbitalField() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!ref.current || reducedMotion()) return
    const context = gsap.context(() => {
      gsap.to('.orbital-ring', { rotation: 360, duration: 34, repeat: -1, ease: 'none' })
      gsap.to('.orbital-node', { y: -7, duration: 2.8, repeat: -1, yoyo: true, stagger: .35, ease: 'sine.inOut' })
    }, ref)
    return () => context.revert()
  }, [])
  const move = (event: React.MouseEvent<HTMLDivElement>) => { if (!ref.current || reducedMotion()) return; const box = ref.current.getBoundingClientRect(); const x = (event.clientX - box.left) / box.width - .5; const y = (event.clientY - box.top) / box.height - .5; gsap.to(ref.current, { rotateY: x * 5, rotateX: y * -5, duration: .7, overwrite: true }) }
  return <div ref={ref} className="orbital-field" onMouseMove={move} onMouseLeave={() => gsap.to(ref.current, { rotateY: 0, rotateX: 0, duration: .8 })}><div className="orbital-ring ring-main"/><div className="orbital-ring ring-small"/><div className="orbital-center"><Network size={22}/><span>source<br/>guide</span></div><div className="orbital-node orbital-node-file"><FileCode2 size={14}/> files</div><div className="orbital-node orbital-node-route"><Route size={14}/> routes</div><span className="orbital-caption">live repository signal</span></div>
}
