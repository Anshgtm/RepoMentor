import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { createPortal } from 'react-dom'
import { ArrowRight, ArrowUpRight, LogOut, Menu, Radio, ShieldAlert, X } from 'lucide-react'
import { gsap, reducedMotion } from '../motion/motion'
import { useAppState } from '../../state/AppState'
import { queryClient } from '../../lib/queryClient'
import { RepoMentorLogo } from '../brand/RepoMentorLogo'

export function Shell({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const { state, dispatch } = useAppState()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [logoutOpen, setLogoutOpen] = useState(false)

  useEffect(() => {
    if (ref.current && !reducedMotion()) gsap.fromTo(ref.current, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: .65, ease: 'power3.out' })
  }, [])

  useEffect(() => {
    const root = ref.current
    if (!root) return
    const move = (event: MouseEvent) => {
      root.style.setProperty('--pointer-x', `${event.clientX}px`)
      root.style.setProperty('--pointer-y', `${event.clientY}px`)
    }
    window.addEventListener('mousemove', move)
    return () => window.removeEventListener('mousemove', move)
  }, [])

  useEffect(() => {
    const closeMenu = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', closeMenu)
    return () => document.removeEventListener('mousedown', closeMenu)
  }, [])

  const requestLogout = () => { setMenuOpen(false); setLogoutOpen(true) }
  const logout = () => {
    localStorage.removeItem('repository-guide-token')
    dispatch({ type: 'clear-auth' })
    queryClient.removeQueries({ queryKey: ['workspaces'] })
    queryClient.removeQueries({ queryKey: ['workspace'] })
    queryClient.removeQueries({ queryKey: ['guide'] })
    queryClient.removeQueries({ queryKey: ['github-summary'] })
    setLogoutOpen(false)
    navigate('/')
  }

  return <div ref={ref} className="site-shell min-h-screen bg-paper text-ink">
    <header className="site-header">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-10">
        <Link to="/" className="brand-link"><RepoMentorLogo /></Link>
        <nav className="navbar-nav">
          <span className="hidden items-center gap-2 font-mono text-[10px] uppercase tracking-[.18em] text-moss lg:flex"><Radio size={13}/> local workspace</span>
          <div className="navbar-direct-links">{state.authEmail ? <><span className="auth-user">{state.authEmail}</span><button type="button" className="auth-logout" onClick={requestLogout}>Log out</button></> : <><Link className="auth-login" to="/login">Log in</Link><Link className="auth-signup" to="/signup">Sign up</Link></>}</div>
          <span className="theme-dot" data-theme={state.theme}/>
          <div ref={menuRef} className="menu-wrap">
            <button type="button" className="menu-button" aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'} aria-expanded={menuOpen} onClick={() => setMenuOpen(value => !value)}>{menuOpen ? <X size={21}/> : <Menu size={21}/>}</button>
            {menuOpen && <div className="nav-menu"><p className="eyebrow">Navigate</p>{state.authEmail && <MenuLink to="/my-workspace" label="My Workspace" detail="Your personal repository dashboard" onClick={() => setMenuOpen(false)}/>}<MenuLink to="/new" label="Workspace" detail="Create a repository guide" onClick={() => setMenuOpen(false)}/><MenuLink to="/settings" label="Appearance" detail="Theme and reading preferences" onClick={() => setMenuOpen(false)}/><div className="nav-menu-divider"/><p className="eyebrow">Account</p>{state.authEmail ? <><span className="nav-menu-user">{state.authEmail}</span><button type="button" className="nav-menu-logout" onClick={requestLogout}><LogOut size={15}/> Log out</button></> : <><MenuLink to="/login" label="Log in" detail="Continue your work" onClick={() => setMenuOpen(false)}/><MenuLink to="/signup" label="Sign up" detail="Save your workspaces" onClick={() => setMenuOpen(false)}/></>}</div>}
          </div>
        </nav>
      </div>
    </header>
    <main className="relative z-10">{children}</main><Footer />
    {logoutOpen && <LogoutDialog onCancel={() => setLogoutOpen(false)} onConfirm={logout}/>}</div>
}

function Footer() {
  return <footer className="site-footer"><div className="mx-auto max-w-7xl px-6 py-10 lg:px-10"><div className="footer-main"><div className="footer-brand"><RepoMentorLogo compact /><div><strong>RepoMentor</strong><p>Make unfamiliar code feel navigable.</p></div></div><div className="footer-links"><div><p className="footer-label">Explore</p><Link to="/">Workspaces</Link><Link to="/new">New workspace</Link></div><div><p className="footer-label">Account</p><Link to="/settings">Appearance</Link><Link to="/login">Log in <ArrowUpRight size={12}/></Link></div><div><p className="footer-label">Legal</p><Link to="/privacy">Privacy</Link><Link to="/terms">Terms</Link></div></div></div><div className="footer-bottom"><span>© {new Date().getFullYear()} RepoMentor</span></div></div></footer>
}

function LogoutDialog({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: () => void }) {
  return createPortal(<div className="logout-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) onCancel() }}><section className="logout-dialog" role="dialog" aria-modal="true" aria-labelledby="logout-title"><span className="logout-icon"><ShieldAlert size={21}/></span><p className="eyebrow">End session</p><h2 id="logout-title">Are you sure you want to log out?</h2><p>Your current workspace view will be cleared from this session. You can sign back in anytime.</p><div className="logout-actions"><button type="button" className="button-secondary" onClick={onCancel}>Cancel</button><button type="button" className="button-primary" onClick={onConfirm}>Yes, log out <LogOut size={15}/></button></div></section></div>, document.body)
}

function MenuLink({ to, label, detail, onClick }: { to: string; label: string; detail: string; onClick: () => void }) {
  return <Link to={to} className="nav-menu-link" onClick={onClick}><span><strong>{label}</strong><small>{detail}</small></span><ArrowRight size={15}/></Link>
}
