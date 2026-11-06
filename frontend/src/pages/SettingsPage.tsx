import { Link } from 'react-router-dom'
import { Check, Moon, Sun, Monitor, Sliders } from 'lucide-react'
import { Shell } from '../components/layout/Shell'
import { useAppState } from '../state/AppState'

export function SettingsPage() {
  const { state, dispatch } = useAppState()

  return (
    <Shell>
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <Link to="/" className="text-link mb-6 inline-flex">
          ← Back to repository index
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight text-ink">
            Interface Preferences
          </h1>
          <p className="mt-2 text-sm text-muted max-w-xl leading-relaxed">
            Configure reading themes and typography contrast for extended code analysis and architectural reviews.
          </p>
        </div>

        <section className="panel border border-line-strong p-6 sm:p-8 bg-surface space-y-6">
          <div className="flex items-start justify-between pb-4 border-b border-line">
            <div>
              <h2 className="text-lg font-semibold text-ink">Reading Contrast Mode</h2>
              <p className="text-xs text-muted mt-1">
                Preference is saved in browser localStorage for this device.
              </p>
            </div>
            <div className="p-2 border border-line bg-surface-raised text-muted rounded-[2px]">
              <Sliders size={16} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <ThemeOption
              active={state.theme === 'dark'}
              icon={<Moon size={16} />}
              label="Carbon Dark"
              description="Low eye fatigue, high syntax contrast"
              onClick={() => dispatch({ type: 'set-theme', theme: 'dark' })}
            />
            <ThemeOption
              active={state.theme === 'light'}
              icon={<Sun size={16} />}
              label="Paper Light"
              description="High daylight legibility, clean monochrome borders"
              onClick={() => dispatch({ type: 'set-theme', theme: 'light' })}
            />
          </div>

          <div className="pt-4 border-t border-line text-xs font-mono text-muted flex items-center justify-between">
            <span>Font Rendering: Inter &amp; JetBrains Mono</span>
            <span className="text-emerald-400">STATUS: OPTIMAL</span>
          </div>
        </section>
      </div>
    </Shell>
  )
}

function ThemeOption({
  active,
  icon,
  label,
  description,
  onClick,
}: {
  active: boolean
  icon: React.ReactNode
  label: string
  description: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`p-4 border text-left rounded-[2px] transition-colors flex items-start justify-between ${
        active
          ? 'border-emerald-500 bg-surface-raised'
          : 'border-line bg-surface hover:border-line-strong hover:bg-surface-raised'
      }`}
    >
      <div className="flex items-start gap-3">
        <span className={`p-2 border rounded-[2px] ${active ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10' : 'border-line text-muted bg-surface'}`}>
          {icon}
        </span>
        <div>
          <strong className="block text-sm font-semibold text-ink">{label}</strong>
          <small className="block text-xs text-muted mt-1 leading-relaxed">{description}</small>
        </div>
      </div>
      {active && <Check className="text-emerald-400 mt-1" size={16} />}
    </button>
  )
}
