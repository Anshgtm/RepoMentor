import type { ReactNode } from 'react'

export function EvidenceSection({
  tag,
  title,
  description,
  bullets,
  visual,
  reverse = false,
}: {
  tag: string
  title: string
  description: string
  bullets?: string[]
  visual: ReactNode
  reverse?: boolean
}) {
  return (
    <section className="py-12 border-t border-line">
      <div className={`grid grid-cols-1 lg:grid-cols-12 gap-8 items-center ${reverse ? 'lg:flex-row-reverse' : ''}`}>
        {/* Copy side */}
        <div className={`lg:col-span-5 ${reverse ? 'lg:order-2' : ''}`}>
          <div className="status-pill status-neutral mb-3">{tag}</div>
          <h3 className="text-2xl sm:text-3xl font-semibold tracking-tight text-ink mb-3">
            {title}
          </h3>
          <p className="text-muted text-sm leading-relaxed mb-4">
            {description}
          </p>
          {bullets && bullets.length > 0 && (
            <ul className="space-y-2 font-mono text-xs text-zinc-400">
              {bullets.map((b, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold select-none">→</span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Visual / Workbench side */}
        <div className={`lg:col-span-7 ${reverse ? 'lg:order-1' : ''}`}>
          <div className="panel border border-line-strong overflow-hidden bg-[#0c0f11]">
            {visual}
          </div>
        </div>
      </div>
    </section>
  )
}
