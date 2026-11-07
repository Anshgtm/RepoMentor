import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { createPortal } from 'react-dom'
import {
  LogOut,
  Menu,
  ShieldAlert,
  X,
  Moon,
  Sun,
  ChevronDown,
  Compass,
  FolderTree,
  Layers,
  Sliders,
  Shield,
  FileText,
  LogIn,
  UserPlus
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
  const menuRef = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const { state, dispatch } = useAppState()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [logoutOpen, setLogoutOpen] = useState(false)

  // GSAP Menu Reveal and Stagger Animation
  useEffect(() => {
    if (menuOpen && dropdownRef.current) {
      if (buttonRef.current) {
        gsap.fromTo(
          buttonRef.current,
          { scale: 0.85, rotate: -20 },
          { scale: 1, rotate: 0, duration: 0.28, ease: 'back.out(2.2)' }
        )
      }

      gsap.fromTo(
        dropdownRef.current,
        { opacity: 0, scale: 0.92, y: -10, transformOrigin: 'top right' },
        { opacity: 1, scale: 1, y: 0, duration: 0.28, ease: 'power3.out' }
      )

      const items = dropdownRef.current.querySelectorAll('.menu-route-item')
      gsap.fromTo(
        items,
        { opacity: 0, x: -10 },
        { opacity: 1, x: 0, duration: 0.2, stagger: 0.025, ease: 'power2.out', delay: 0.04 }
      )
    }
  }, [menuOpen])

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

  useEffect(() => {
    const closeMenu = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', closeMenu)
    return () => document.removeEventListener('mousedown', closeMenu)
  }, [])

  const requestLogout = () => {
    setMenuOpen(false)
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

  return (
    <div className="min-h-screen flex flex-col bg-[#08090b] text-[#f8fafc]">
      {/* Vercel / Linear Style Header */}
      <header className="rm-header">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-2.5 sm:px-6 lg:px-8">
          <div className="flex items-center gap-5">
            <Link to="/" className="inline-flex items-center gap-2 text-white no-underline">
              <RepoMentorLogo />
            </Link>
          </div>

          <nav className="flex items-center gap-3 sm:gap-4">
            <div className="hidden sm:flex items-center gap-4 text-xs font-medium">
              <Link to="/new" className="text-zinc-400 hover:text-white transition-colors">
                Analyze
              </Link>
              {state.authEmail && (
                <Link to="/my-workspace" className="text-zinc-400 hover:text-white transition-colors">
                  Workspaces
                </Link>
              )}
            </div>

            {/* Menu Bar Trigger (Desktop & Mobile) - Icon Only with Micro Animation */}
            <div ref={menuRef} className="relative">
              <button
                ref={buttonRef}
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                className="w-7 h-7 rounded-[3px] border border-white/10 bg-zinc-900 hover:bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
                aria-expanded={menuOpen}
                aria-label="Navigation Menu"
              >
                {menuOpen ? (
                  <X size={14} className="transition-transform duration-200 rotate-90" />
                ) : (
                  <Menu size={14} className="transition-transform duration-200" />
                )}
              </button>

              {menuOpen && (
                <div
                  ref={dropdownRef}
                  className="absolute right-0 top-full mt-2 w-64 rounded-[6px] border border-white/[0.1] bg-[#0c0d12] p-3 shadow-[0_20px_45px_rgba(0,0,0,0.85),inset_0_1px_0_0_rgba(255,255,255,0.08)] z-50 select-none"
                  role="menu"
                >
                  {/* Category: Primary Application */}
                  <div className="pb-2">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-semibold px-2 block mb-1">
                      Application
                    </span>
                    <div className="space-y-0.5">
                      <Link
                        to="/"
                        onClick={() => setMenuOpen(false)}
                        className="menu-route-item flex items-center gap-2.5 px-2.5 py-2 rounded-[3px] text-xs text-zinc-300 hover:text-white hover:bg-zinc-800/80 hover:translate-x-0.5 transition-all group"
                      >
                        <Compass size={14} className="text-zinc-400 group-hover:text-emerald-400 transition-colors" />
                        <span>Home</span>
                      </Link>

                      <Link
                        to="/new"
                        onClick={() => setMenuOpen(false)}
                        className="menu-route-item flex items-center gap-2.5 px-2.5 py-2 rounded-[3px] text-xs text-zinc-300 hover:text-white hover:bg-zinc-800/80 hover:translate-x-0.5 transition-all group"
                      >
                        <FolderTree size={14} className="text-zinc-400 group-hover:text-emerald-400 transition-colors" />
                        <span>Analyze Repository</span>
                      </Link>

                      <Link
                        to="/my-workspace"
                        onClick={() => setMenuOpen(false)}
                        className="menu-route-item flex items-center gap-2.5 px-2.5 py-2 rounded-[3px] text-xs text-zinc-300 hover:text-white hover:bg-zinc-800/80 hover:translate-x-0.5 transition-all group"
                      >
                        <Layers size={14} className="text-zinc-400 group-hover:text-emerald-400 transition-colors" />
                        <span>Workspaces</span>
                      </Link>
                    </div>
                  </div>

                  {/* Category: Preferences & Platform */}
                  <div className="pt-2 pb-2 border-t border-white/[0.06]">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-semibold px-2 block mb-1">
                      Preferences &amp; Legal
                    </span>
                    <div className="space-y-0.5">
                      <Link
                        to="/settings"
                        onClick={() => setMenuOpen(false)}
                        className="menu-route-item flex items-center gap-2.5 px-2.5 py-2 rounded-[3px] text-xs text-zinc-300 hover:text-white hover:bg-zinc-800/80 hover:translate-x-0.5 transition-all group"
                      >
                        <Sliders size={14} className="text-zinc-400 group-hover:text-emerald-400 transition-colors" />
                        <span>Interface Preferences</span>
                      </Link>

                      <Link
                        to="/privacy"
                        onClick={() => setMenuOpen(false)}
                        className="menu-route-item flex items-center gap-2.5 px-2.5 py-2 rounded-[3px] text-xs text-zinc-300 hover:text-white hover:bg-zinc-800/80 hover:translate-x-0.5 transition-all group"
                      >
                        <Shield size={14} className="text-zinc-400 group-hover:text-emerald-400 transition-colors" />
                        <span>Privacy Policy</span>
                      </Link>

                      <Link
                        to="/terms"
                        onClick={() => setMenuOpen(false)}
                        className="menu-route-item flex items-center gap-2.5 px-2.5 py-2 rounded-[3px] text-xs text-zinc-300 hover:text-white hover:bg-zinc-800/80 hover:translate-x-0.5 transition-all group"
                      >
                        <FileText size={14} className="text-zinc-400 group-hover:text-emerald-400 transition-colors" />
                        <span>Terms of Service</span>
                      </Link>
                    </div>
                  </div>

                  {/* Category: Account & Session */}
                  <div className="pt-2 border-t border-white/[0.06]">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-semibold px-2 block mb-1">
                      Account Access
                    </span>
                    {state.authEmail ? (
                      <div className="space-y-1.5 pt-1">
                        <div className="px-2.5 py-1 text-[11px] font-mono text-zinc-400 truncate bg-zinc-900/60 rounded-[3px] border border-white/[0.04]">
                          {state.authEmail}
                        </div>
                        <button
                          type="button"
                          onClick={requestLogout}
                          className="menu-route-item w-full flex items-center gap-2.5 px-2.5 py-2 rounded-[3px] text-xs text-red-400 hover:bg-red-500/10 transition-colors text-left cursor-pointer"
                        >
                          <LogOut size={14} />
                          <span>Sign out</span>
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-0.5">
                        <Link
                          to="/login"
                          onClick={() => setMenuOpen(false)}
                          className="menu-route-item flex items-center gap-2.5 px-2.5 py-2 rounded-[3px] text-xs text-zinc-300 hover:text-white hover:bg-zinc-800/80 hover:translate-x-0.5 transition-all group"
                        >
                          <LogIn size={14} className="text-zinc-400 group-hover:text-emerald-400 transition-colors" />
                          <span>Sign in</span>
                        </Link>

                        <Link
                          to="/signup"
                          onClick={() => setMenuOpen(false)}
                          className="menu-route-item flex items-center gap-2.5 px-2.5 py-2 rounded-[3px] text-xs text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 hover:translate-x-0.5 transition-all group"
                        >
                          <UserPlus size={14} className="text-emerald-400" />
                          <span>Create account</span>
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2.5 pl-2 border-l border-white/[0.08]">
              <button
                type="button"
                onClick={toggleTheme}
                className="w-7 h-7 rounded-[3px] border border-white/10 bg-zinc-900 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
                title={`Switch to ${state.theme === 'dark' ? 'Light' : 'Dark'} mode`}
                aria-label="Toggle theme"
              >
                {state.theme === 'dark' ? <Sun size={13} /> : <Moon size={13} />}
              </button>

              {state.authEmail ? (
                <div className="hidden sm:flex items-center gap-2">
                  <span className="hidden md:inline-block text-xs font-mono text-zinc-400 bg-zinc-900 px-2 py-1 rounded-[3px] border border-white/[0.06]">
                    {state.authEmail}
                  </span>
                  <button
                    type="button"
                    className="rm-btn-secondary text-xs py-1 px-2.5 rounded-[3px]"
                    onClick={requestLogout}
                  >
                    Sign out
                  </button>
                </div>
              ) : (
                <div className="hidden sm:flex items-center gap-2">
                  <Link className="text-xs text-zinc-400 hover:text-white px-2 py-1 transition-colors" to="/login">
                    Sign in
                  </Link>
                  <Link className="rm-btn-primary text-xs py-1 px-3 rounded-[3px]" to="/signup">
                    Get Started
                  </Link>
                </div>
              )}
            </div>
          </nav>
        </div>
      </header>

      {/* Main Viewport */}
      <main className="flex-1">{children}</main>

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
      <div className="rounded-[4px] border border-white/10 bg-[#121318] max-w-sm w-full p-6 space-y-4 shadow-2xl" role="dialog">
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
