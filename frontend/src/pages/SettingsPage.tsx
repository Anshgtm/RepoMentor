import { Link } from 'react-router-dom'
import { Check, Moon, Sun } from 'lucide-react'
import { Shell } from '../components/layout/Shell'
import { useAppState } from '../state/AppState'

export function SettingsPage() {
  const { state, dispatch } = useAppState()
  return <Shell><div className="mx-auto max-w-3xl px-6 py-16"><Link to="/" className="eyebrow">← Back to workspaces</Link><div className="mt-10"><p className="eyebrow">Workspace preferences</p><h1 className="mt-3 text-5xl font-semibold tracking-[-.055em]">Appearance.</h1><p className="mt-4 max-w-xl text-lg leading-8 text-ink/55">Tune the reading environment for long architecture sessions and careful code review.</p></div><section className="panel mt-12 p-7 md:p-9"><div className="flex items-start justify-between gap-5"><div><p className="eyebrow">Theme</p><h2 className="mt-2 text-2xl font-medium">Choose your atmosphere</h2><p className="mt-2 text-sm leading-6 text-ink/55">Dark mode is the default. Your preference is saved on this device.</p></div><div className="hidden rounded-full border border-ink/10 p-3 text-gold sm:block"><Moon size={19}/></div></div><div className="mt-8 grid gap-3 sm:grid-cols-2"><ThemeOption active={state.theme === 'dark'} icon={<Moon size={18}/>} label="Midnight" description="Low glare, deep focus" onClick={() => dispatch({ type: 'set-theme', theme: 'dark' })}/><ThemeOption active={state.theme === 'light'} icon={<Sun size={18}/>} label="Daylight" description="Warm paper, clear contrast" onClick={() => dispatch({ type: 'set-theme', theme: 'light' })}/></div></section></div></Shell>
}

function ThemeOption({ active, icon, label, description, onClick }: { active: boolean; icon: React.ReactNode; label: string; description: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} className={`theme-option ${active ? 'is-active' : ''}`}><span className="theme-icon">{icon}</span><span className="text-left"><strong>{label}</strong><small>{description}</small></span>{active && <Check className="ml-auto text-gold" size={17}/>}</button>
}
