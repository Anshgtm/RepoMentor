import type { ReactNode } from 'react'

export function EvidenceSection({ number, title, description, visual, reverse = false }: { number: string; title: string; description: string; visual: ReactNode; reverse?: boolean }) {
  return <section className={`evidence-section ${reverse ? 'is-reverse' : ''}`}><div className="evidence-copy"><p className="eyebrow">{title}</p><h2>{title}</h2><p>{description}</p></div><div className="evidence-visual">{visual}</div></section>
}
