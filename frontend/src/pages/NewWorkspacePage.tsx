import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { api } from '../lib/api'
import { Shell } from '../components/layout/Shell'
import { useAppState } from '../state/AppState'
import { LockKeyhole, UserPlus } from 'lucide-react'

export function NewWorkspacePage() {
  const { state } = useAppState()
  const navigate = useNavigate(); const client = useQueryClient(); const [name, setName] = useState(''); const [url, setUrl] = useState('')
  const mutation = useMutation({ mutationFn: () => api.post('/repository-workspaces', { repository_name: name.trim(), github_repository_url: url.trim() || null }), onSuccess: async ({ data }) => { await client.invalidateQueries({ queryKey: ['workspaces'] }); navigate(`/workspace/${data.id}`) } })
  const errorMessage = mutation.error && 'response' in mutation.error ? ((mutation.error.response as { data?: { detail?: string } })?.data?.detail || 'The workspace request was rejected.') : 'The backend could not be reached. Check that the API is running.'
  return <Shell><div className="mx-auto max-w-7xl px-6 py-12 lg:px-10 lg:py-16"><Link to="/" className="text-link">← Back to workspaces</Link>{state.authEmail ? <div className="form-layout"><div><p className="eyebrow">New workspace / 01</p><h1 className="hero-title form-title">Name the<br/><em>unknown.</em></h1><p className="hero-lede">Give this repository a place to become legible. You can add source material in the next step.</p></div><form className="panel form-panel" onSubmit={event => { event.preventDefault(); mutation.mutate() }}><div className="form-step"><span>01</span><span>Repository identity</span></div><label>Repository name<input required value={name} onChange={event => setName(event.target.value)} placeholder="atlas-web"/></label><label>GitHub URL <span className="text-xs normal-case tracking-normal text-ink/35">optional</span><input value={url} onChange={event => setUrl(event.target.value)} placeholder="https://github.com/org/repository"/></label>{mutation.isError && <p className="text-sm text-red-400" role="alert">{errorMessage}</p>}<button className="button-primary button-large mt-3 w-full" disabled={mutation.isPending}>{mutation.isPending ? 'Creating workspace...' : 'Create workspace'} <ArrowRight size={17}/></button></form></div> : <AuthRequiredNotice/>}</div></Shell>
}

function AuthRequiredNotice() {
  return <div className="auth-required"><div className="auth-required-icon"><LockKeyhole size={22}/></div><p className="eyebrow">Workspace access</p><h1>Sign in before<br/><em>you begin.</em></h1><p>Creating a workspace saves your repository orientation and keeps it available when you return.</p><div className="auth-required-actions"><Link className="button-primary" to="/login" state={{ from: '/new' }}>Log in <ArrowRight size={16}/></Link><Link className="button-secondary" to="/signup" state={{ from: '/new' }}><UserPlus size={16}/> Create account</Link></div></div>
}
