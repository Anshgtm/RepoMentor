import { useState, useMemo } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Check,
  CheckCircle2,
  LockKeyhole,
  Mail,
  KeyRound,
  Eye,
  EyeOff
} from 'lucide-react'
import { Shell } from '../components/layout/Shell'
import { api } from '../lib/api'
import { useAppState } from '../state/AppState'

export function AuthPage({ mode }: { mode: 'login' | 'signup' }) {
  const isSignup = mode === 'signup'
  const navigate = useNavigate()
  const location = useLocation()
  const { dispatch } = useAppState()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [capsLock, setCapsLock] = useState(false)
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(true)
  const [rememberDevice, setRememberDevice] = useState(true)

  // Arc-style password strength heuristic metrics
  const passwordStrength = useMemo(() => {
    let score = 0
    if (password.length >= 8) score++
    if (password.length >= 12) score++
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++
    if (/[0-9]/.test(password) || /[^A-Za-z0-9]/.test(password)) score++
    return score
  }, [password])

  const strengthLabel = useMemo(() => {
    if (!password) return 'Minimum 8 characters'
    if (password.length < 8) return `Needs ${8 - password.length} more chars`
    if (passwordStrength <= 2) return 'Basic encryption'
    if (passwordStrength === 3) return 'Balanced'
    return 'High entropy'
  }, [password, passwordStrength])

  const mutation = useMutation({
    mutationFn: async () =>
      (
        await api.post<{ token: string; user: { email: string } }>(
          `/auth/${isSignup ? 'register' : 'login'}`,
          { email: email.trim(), password }
        )
      ).data,
    onSuccess: (data) => {
      if (isSignup) {
        navigate('/login', {
          state: {
            message: 'Account created successfully. You can now sign in.',
            email: data.user.email,
          },
        })
        return
      }
      localStorage.setItem('repository-guide-token', data.token)
      dispatch({ type: 'set-auth', email: data.user.email })
      navigate(location.state?.from || '/')
    },
  })

  const error =
    mutation.error && 'response' in mutation.error
      ? ((mutation.error.response as { data?: { detail?: string } })?.data?.detail ||
          'Authentication failed. Please verify your credentials.')
      : 'The authentication server could not be reached. Ensure the API is running.'

  return (
    <Shell>
      <div className="min-h-[82vh] flex items-center justify-center px-4 py-12 sm:px-6" style={{ fontFamily: "'Inter', sans-serif" }}>
        {/* Main Card: Arc UI Specular Container */}
        <div className="w-full max-w-[440px] rounded-[6px] border border-white/[0.1] bg-[#0d0e13] p-7 sm:p-8 shadow-[0_24px_50px_rgba(0,0,0,0.8),inset_0_1px_0_0_rgba(255,255,255,0.08)]" style={{ fontFamily: "'Inter', sans-serif" }}>
          {/* Header */}
          <div className="text-center pb-6">
            <h1 className="text-[16px] font-semibold tracking-tight text-white font-sans">
              {isSignup ? 'Create your RepoMentor account' : 'Sign in to RepoMentor'}
            </h1>
            <p className="text-[12px] text-zinc-400 mt-1 font-sans opacity-70">
              {isSignup
                ? 'Begin indexing repositories and generating architecture guides.'
                : 'Access your analyzed repositories and architectural guides.'}
            </p>
          </div>

          {/* Success Banner */}
          {!isSignup && location.state?.message && (
            <div className="mb-5 p-3 rounded-[3px] border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-[12px] font-sans flex items-center gap-2" role="status">
              <CheckCircle2 size={15} className="text-emerald-400 flex-shrink-0" />
              <span>{location.state.message}</span>
            </div>
          )}

          {/* Form */}
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault()
              if (isSignup && !agreedToPrivacy) return
              mutation.mutate()
            }}
          >
            {/* Email Field with Arc Slot Styling */}
            <div className="space-y-1.5">
              <label className="text-[12px] font-sans font-medium text-zinc-300 flex items-center justify-between">
                <span>Email address</span>
                <span className="text-[12px] text-zinc-500 font-sans">Identity</span>
              </label>
              <div className="relative rounded-[4px] border border-white/10 bg-[#08090d] focus-within:border-emerald-500/80 focus-within:ring-1 focus-within:ring-emerald-500/30 transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.4)]">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                  <Mail size={14} />
                </div>
                <input
                  type="email"
                  required
                  value={email || location.state?.email || ''}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="developer@company.com"
                  className="w-full bg-transparent pl-9 pr-3.5 py-2.5 text-[12px] text-zinc-100 placeholder:text-zinc-600 focus:outline-none font-sans"
                />
              </div>
            </div>

            {/* Arc-Style Password Input Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[12px] font-sans font-medium text-zinc-300">
                <span className="flex items-center gap-1.5">
                  <span>Password</span>
                  {capsLock && (
                    <span className="text-[12px] bg-amber-500/10 text-amber-400 border border-amber-500/25 px-1.5 py-0.5 rounded-[2px] font-sans">
                      Caps on
                    </span>
                  )}
                </span>
                <span className="text-[12px] text-zinc-500 font-sans">
                  {strengthLabel}
                </span>
              </div>

              {/* Arc Password Slot */}
              <div className="relative rounded-[4px] border border-white/10 bg-[#08090d] focus-within:border-emerald-500/80 focus-within:ring-1 focus-within:ring-emerald-500/30 transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.4)]">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                  <KeyRound size={14} />
                </div>

                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyUp={(e) => setCapsLock(e.getModifierState('CapsLock'))}
                  onKeyDown={(e) => setCapsLock(e.getModifierState('CapsLock'))}
                  placeholder="••••••••••••"
                  className="w-full bg-transparent pl-9 pr-14 py-2.5 text-[12px] text-zinc-100 placeholder:text-zinc-600 focus:outline-none font-sans"
                />

                {/* Arc Reveal Action Button */}
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 pr-2.5 flex items-center"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  <span className="px-2 py-0.5 rounded-[2px] bg-white/[0.04] border border-white/10 hover:border-white/20 text-zinc-400 hover:text-zinc-200 text-[12px] font-sans transition-colors flex items-center gap-1">
                    {showPassword ? <EyeOff size={12} /> : <Eye size={12} />}
                    <span>{showPassword ? 'Hide' : 'Show'}</span>
                  </span>
                </button>
              </div>

              {/* Arc Segmented Strength Telemetry Bar */}
              {isSignup && password.length > 0 && (
                <div className="pt-1 space-y-1">
                  <div className="grid grid-cols-4 gap-1.5">
                    {[1, 2, 3, 4].map((step) => {
                      const isActive = passwordStrength >= step
                      return (
                        <div
                          key={step}
                          className={`h-1 rounded-[1px] transition-colors ${
                            isActive
                              ? passwordStrength <= 2
                                ? 'bg-amber-400'
                                : 'bg-emerald-400'
                              : 'bg-white/10'
                          }`}
                        />
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Checkboxes matching the design structure */}
            <div className="pt-2 space-y-3">
              {/* Privacy Policy Checkbox */}
              <label className="flex items-start gap-2.5 text-[12px] text-zinc-300 font-sans cursor-pointer select-none">
                <button
                  type="button"
                  onClick={() => setAgreedToPrivacy((v) => !v)}
                  className={`mt-0.5 w-4 h-4 rounded-[3px] border flex items-center justify-center flex-shrink-0 transition-colors ${
                    agreedToPrivacy
                      ? 'bg-emerald-500 border-emerald-400 text-zinc-950'
                      : 'bg-[#08090d] border-zinc-700 text-transparent'
                  }`}
                  aria-checked={agreedToPrivacy}
                  role="checkbox"
                >
                  <Check size={12} strokeWidth={3} />
                </button>
                <span className="leading-relaxed">
                  I have read and agree to the{' '}
                  <Link to="/privacy" className="text-white underline underline-offset-2 hover:text-emerald-400">
                    Privacy Policy
                  </Link>{' '}
                  and{' '}
                  <Link to="/terms" className="text-white underline underline-offset-2 hover:text-emerald-400">
                    Terms
                  </Link>
                </span>
              </label>

              {/* Remember Device Checkbox */}
              <label className="flex items-start gap-2.5 text-[12px] text-zinc-300 font-sans cursor-pointer select-none">
                <button
                  type="button"
                  onClick={() => setRememberDevice((v) => !v)}
                  className={`mt-0.5 w-4 h-4 rounded-[3px] border flex items-center justify-center flex-shrink-0 transition-colors ${
                    rememberDevice
                      ? 'bg-emerald-500 border-emerald-400 text-zinc-950'
                      : 'bg-[#08090d] border-zinc-700 text-transparent'
                  }`}
                  aria-checked={rememberDevice}
                  role="checkbox"
                >
                  <Check size={12} strokeWidth={3} />
                </button>
                <div className="leading-tight">
                  <span className="text-zinc-200">Remember this device (Optional)</span>
                  <p className="text-[12px] text-zinc-500 mt-0.5 leading-normal">
                    Retains your encrypted workspace session token locally.
                  </p>
                </div>
              </label>
            </div>

            {/* Error Message */}
            {mutation.isError && (
              <div className="p-3 rounded-[3px] border border-red-500/30 bg-red-500/10 text-red-300 text-[12px] font-sans" role="alert">
                {error}
              </div>
            )}

            {/* Main Action Button */}
            <div className="pt-2">
              <button
                type="submit"
                className="arc-btn-primary w-full py-2.5 px-4 rounded-[3px] text-[12px] font-medium flex items-center justify-center gap-2 group cursor-pointer shadow-md font-sans"
                disabled={mutation.isPending}
              >
                <span>
                  {mutation.isPending
                    ? 'Authenticating...'
                    : isSignup
                    ? 'Create Account'
                    : 'Sign in to RepoMentor'}
                </span>
                <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </form>

          {/* Switch Mode (Login / Signup) */}
          <div className="pt-5 mt-5 border-t border-white/[0.08] text-center text-[12px] text-zinc-400 font-sans">
            {isSignup ? (
              <span>
                Already registered?{' '}
                <Link to="/login" className="text-white font-medium hover:text-emerald-400 underline underline-offset-4">
                  Sign in
                </Link>
              </span>
            ) : (
              <span>
                Don&apos;t have an account?{' '}
                <Link to="/signup" className="text-white font-medium hover:text-emerald-400 underline underline-offset-4">
                  Create an account
                </Link>
              </span>
            )}
          </div>

          {/* Footer Disclaimer */}
          <div className="mt-5 text-center text-[12px] font-sans text-zinc-500 leading-relaxed">
            Your credentials and workspace session tokens are encrypted locally. No repository code is shared with third parties.
          </div>
        </div>
      </div>
    </Shell>
  )
}
