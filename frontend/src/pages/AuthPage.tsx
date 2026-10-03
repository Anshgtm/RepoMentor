import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ArrowRight, LockKeyhole, Mail } from 'lucide-react'
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
  const mutation = useMutation({
    mutationFn: async () => (await api.post<{ token: string; user: { email: string } }>(`/auth/${isSignup ? 'register' : 'login'}`, { email: email.trim(), password })).data,
    onSuccess: data => {
      if (isSignup) { navigate('/login', { state: { message: 'Account created. Log in to continue.', email: data.user.email } }); return }
      localStorage.setItem('repository-guide-token', data.token)
      dispatch({ type: 'set-auth', email: data.user.email })
      navigate(location.state?.from || '/')
    },
  })
  const error = mutation.error && 'response' in mutation.error ? ((mutation.error.response as { data?: { detail?: string } })?.data?.detail || 'Authentication request failed.') : 'The API could not be reached.'
  return <Shell><div className="auth-layout"><div className="auth-intro"><p className="eyebrow">RepoMentor / access</p><h1>{isSignup ? <><span>Keep your</span><br/><em>place.</em></> : <><span>Welcome</span><br/><em>back.</em></>}</h1><p>Save your repository workspaces and return to the exact point where your thinking stopped.</p></div><form className="panel auth-panel" onSubmit={event => { event.preventDefault(); mutation.mutate() }}><p className="eyebrow">{isSignup ? 'Create an account' : 'Sign in'}</p><h2>{isSignup ? 'Begin a clear record.' : 'Continue your work.'}</h2>{!isSignup && location.state?.message && <p className="auth-success" role="status">{location.state.message}</p>}<label><Mail size={13}/> Email<input type="email" required value={email || location.state?.email || ''} onChange={event => setEmail(event.target.value)} placeholder="you@example.com"/></label><label><LockKeyhole size={13}/> Password<input type="password" required minLength={8} value={password} onChange={event => setPassword(event.target.value)} placeholder="At least 8 characters"/></label>{mutation.isError && <p className="auth-error" role="alert">{error}</p>}<button className="button-primary button-large w-full" disabled={mutation.isPending}>{mutation.isPending ? 'Working...' : isSignup ? 'Create account' : 'Sign in'} <ArrowRight size={16}/></button><p className="auth-switch">{isSignup ? 'Already have an account?' : 'New to RepoMentor?'} <Link to={isSignup ? '/login' : '/signup'}>{isSignup ? 'Log in' : 'Sign up'}</Link></p></form></div></Shell>
}
