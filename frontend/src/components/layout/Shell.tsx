import { useEffect, useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { createPortal } from 'react-dom'
import {
  Moon,
  Sun,
  ShieldAlert,
} from 'lucide-react'
import Lenis from 'lenis'
import 'lenis/dist/lenis.css'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useAppState } from '../../state/AppState'
import { queryClient } from '../../lib/queryClient'
import { RepoMentorLogo } from '../brand/RepoMentorLogo'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

export function Shell({ children }: { children: React.ReactNode }) {
  const { state, dispatch } = useAppState()
  const navigate = useNavigate()
  const location = useLocation()
  const [logoutOpen, setLogoutOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  // Track window scroll to enhance fixed navbar elevation
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 15)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Lenis + GSAP ScrollTrigger Integration for Buttery Inertia Scrolling
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    })

    const onScroll = () => {
      ScrollTrigger.update()
    }
    lenis.on('scroll', onScroll)

    const updateRaf = (time: number) => {
      lenis.raf(time * 1000)
    }
    gsap.ticker.add(updateRaf)
    gsap.ticker.lagSmoothing(0)

    return () => {
      lenis.destroy()
      gsap.ticker.remove(updateRaf)
    }
  }, [])

  const requestLogout = () => {
    setLogoutOpen(true)
  }

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

  const toggleTheme = () => {
    dispatch({ type: 'set-theme', theme: state.theme === 'dark' ? 'light' : 'dark' })
  }

  // Smooth scroll to problem / Why RepoMentor section if navigated with hash
  useEffect(() => {
    if (location.pathname === '/' && location.hash === '#why-repomentor') {
      const scrollTimer = setTimeout(() => {
        const el = document.getElementById('why-repomentor')
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' })
        }
      }, 120)
      return () => clearTimeout(scrollTimer)
    }
  }, [location.pathname, location.hash])

  const handleWhyClick = (e: React.MouseEvent) => {
    e.preventDefault()
    if (location.pathname === '/') {
      const el = document.getElementById('why-repomentor')
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' })
        window.history.pushState(null, '', '/#why-repomentor')
      }
    } else {
      navigate('/#why-repomentor')
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#08090b] text-[#f8fafc]">
      {/* Fixed Floating Navbar with 30px Border Radius */}
      <header className="fixed top-0 left-0 right-0 z-50 flex justify-center px-3 sm:px-6 pt-3 sm:pt-4 pointer-events-none transition-all duration-300">
        <div
          className={`pointer-events-auto mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-2 sm:px-6 transition-all duration-300 border ${
            scrolled
              ? 'border-white/[0.16] bg-[#141416]/95 backdrop-blur-xl shadow-[0_16px_36px_rgba(0,0,0,0.7),inset_0_1px_0_0_rgba(255,255,255,0.1)]'
              : 'border-white/[0.1] bg-[#141416]/85 backdrop-blur-md shadow-[0_8px_24px_rgba(0,0,0,0.4),inset_0_1px_0_0_rgba(255,255,255,0.06)]'
          }`}
          style={{ borderRadius: '30px' }}
        >
          {/* Left: Brand Logo */}
          <div className="flex items-center flex-1 justify-start">
            <Link to="/" className="inline-flex items-center gap-2 text-white no-underline shrink-0 group">
              <RepoMentorLogo />
            </Link>
          </div>

          {/* Center: Evenly Distributed Navigation Links */}
          <nav className="flex items-center justify-center flex-auto gap-1 sm:gap-2 md:gap-4 lg:gap-6 px-1 sm:px-2 text-xs font-medium">
            <Link
              to="/"
              className={`px-3 py-1.5 rounded-full transition-all ${
                location.pathname === '/'
                  ? 'text-white bg-white/[0.1] font-semibold shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.05]'
              }`}
            >
              Home
            </Link>

            <Link
              to="/new"
              className={`px-3 py-1.5 rounded-full transition-all ${
                location.pathname === '/new'
                  ? 'text-white bg-white/[0.1] font-semibold shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.05]'
              }`}
            >
              Analyze
            </Link>

            <a
              href="/#why-repomentor"
              onClick={handleWhyClick}
              className={`px-3 py-1.5 rounded-full transition-all cursor-pointer ${
                location.pathname === '/' && location.hash === '#why-repomentor'
                  ? 'text-white bg-white/[0.1] font-semibold shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.05]'
              }`}
            >
              Why RepoMentor?
            </a>

            <Link
              to="/terms"
              className={`px-3 py-1.5 rounded-full transition-all ${
                location.pathname === '/terms' || location.pathname === '/privacy'
                  ? 'text-white bg-white/[0.1] font-semibold shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.05]'
              }`}
            >
              Site Policy
            </Link>
          </nav>

          {/* Right: Theme & CTA Button */}
          <div className="flex items-center flex-1 justify-end gap-2 sm:gap-2.5">
            <button
              type="button"
              onClick={toggleTheme}
              className="w-8 h-8 rounded-full border border-white/10 bg-zinc-900/90 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
              title={`Switch to ${state.theme === 'dark' ? 'Light' : 'Dark'} mode`}
              aria-label="Toggle theme"
            >
              {state.theme === 'dark' ? <Sun size={13} /> : <Moon size={13} />}
            </button>

            {state.authEmail ? (
              <div className="flex items-center gap-2">
                <span className="hidden md:inline-block text-xs font-mono text-zinc-400 bg-zinc-900 px-2.5 py-1 rounded-full border border-white/[0.06]">
                  {state.authEmail}
                </span>
                <button
                  type="button"
                  className="rm-btn-secondary text-xs py-1 px-3 rounded-full"
                  onClick={requestLogout}
                >
                  Sign out
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link className="rm-btn-primary text-xs py-1.5 px-3.5 rounded-full" to="/signup">
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Viewport */}
      <main className="flex-1 pt-20 sm:pt-24">{children}</main>

      {/* Proper Arc / Linear Inspired Footer */}
      <footer className="border-t border-white/[0.08] bg-[#07080b] pt-16 pb-12 mt-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          {/* Main Multi-Column Layout */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-white/[0.06]">
            {/* Column 1: Brand & Operational Status (5 columns) */}
            <div className="md:col-span-5 space-y-4">
              <Link to="/" className="inline-flex items-center gap-2 text-white no-underline">
                <RepoMentorLogo />
              </Link>
              <p className="text-xs text-zinc-400 font-sans leading-relaxed max-w-sm">
                Turns complex GitHub repositories into clear, visual guides so anyone can understand how the code works in plain English.
              </p>
              <div className="pt-2 flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[3px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-mono">
                  <span className="w-1.5 h-1.5 rounded-[1px] bg-emerald-400"></span>
                  <span>Operational Engine</span>
                </span>
                <span className="text-[11px] font-mono text-zinc-500">
                  Zero Sandbox Runtime
                </span>
              </div>
            </div>

            {/* Column 2: Product Navigation (2 columns) */}
            <div className="md:col-span-2 space-y-3">
              <h4 className="text-xs font-mono font-semibold text-zinc-300 uppercase tracking-wider">
                Product
              </h4>
              <ul className="space-y-2 text-xs font-sans text-zinc-400">
                <li>
                  <Link to="/new" className="hover:text-white transition-colors">
                    Analyze Repository
                  </Link>
                </li>
                <li>
                  <Link to="/" className="hover:text-white transition-colors">
                    Spatial Workbench
                  </Link>
                </li>
                {state.authEmail && (
                  <li>
                    <Link to="/my-workspace" className="hover:text-white transition-colors">
                      Workspaces
                    </Link>
                  </li>
                )}
                <li>
                  <Link to="/settings" className="hover:text-white transition-colors">
                    Interface Theme
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3: Architecture Capabilities (3 columns) */}
            <div className="md:col-span-3 space-y-3">
              <h4 className="text-xs font-mono font-semibold text-zinc-300 uppercase tracking-wider">
                Architecture
              </h4>
              <ul className="space-y-2 text-xs font-sans text-zinc-400">
                <li>
                  <span className="text-zinc-400">AST Traversal Parser</span>
                </li>
                <li>
                  <span className="text-zinc-400">Topological Call Order</span>
                </li>
                <li>
                  <span className="text-zinc-400">Request-to-Model Tracing</span>
                </li>
                <li>
                  <span className="text-zinc-400">Contributor Reading Guides</span>
                </li>
              </ul>
            </div>

            {/* Column 4: Security & Legal (2 columns) */}
            <div className="md:col-span-2 space-y-3">
              <h4 className="text-xs font-mono font-semibold text-zinc-300 uppercase tracking-wider">
                Security &amp; Legal
              </h4>
              <ul className="space-y-2 text-xs font-sans text-zinc-400">
                <li>
                  <Link to="/privacy" className="hover:text-white transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link to="/terms" className="hover:text-white transition-colors">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <span className="text-zinc-500 font-mono text-[11px]">
                    Local Storage Only
                  </span>
                </li>
                <li>
                  <span className="text-zinc-500 font-mono text-[11px]">
                    No Model Training
                  </span>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar: Copyright & Navigation */}
          <div className="pt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs font-mono text-zinc-500">
            <div>
              <span>© {new Date().getFullYear()} RepoMentor. Built for codebase comprehension.</span>
            </div>
            <div className="flex items-center gap-4 text-zinc-400">
              <Link to="/privacy" className="hover:text-zinc-200 transition-colors">
                Privacy
              </Link>
              <span className="text-zinc-700">/</span>
              <Link to="/terms" className="hover:text-zinc-200 transition-colors">
                Terms
              </Link>
              <span className="text-zinc-700">/</span>
              <Link to="/settings" className="hover:text-zinc-200 transition-colors">
                Theme
              </Link>
              <span className="text-zinc-700">/</span>
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                className="hover:text-zinc-200 transition-colors"
              >
                GitHub
              </a>
            </div>
          </div>
        </div>
      </footer>

      {logoutOpen && (
        <LogoutDialog onCancel={() => setLogoutOpen(false)} onConfirm={logout} />
      )}
    </div>
  )
}

function LogoutDialog({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: () => void }) {
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancel()
      }}
    >
      <div className="rounded-[4px] border border-white/10 bg-[#141416] max-w-sm w-full p-6 space-y-4 shadow-2xl" role="dialog">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-[3px] bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
            <ShieldAlert size={16} />
          </div>
          <h2 className="text-base font-semibold text-white font-heading">Sign out of session?</h2>
        </div>
        <p className="text-xs text-zinc-400 leading-relaxed font-sans">
          Your active session token will be cleared. Workspaces saved to your account will remain preserved.
        </p>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="rm-btn-secondary text-xs py-1.5 px-3 rounded-[3px]" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="rm-btn-primary text-xs py-1.5 px-3 rounded-[3px]" onClick={onConfirm}>
            Sign Out
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
