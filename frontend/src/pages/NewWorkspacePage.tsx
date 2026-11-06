import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { ArrowRight, GitBranch, LockKeyhole, Terminal } from 'lucide-react'
import { api } from '../lib/api'
import { Shell } from '../components/layout/Shell'
import { useAppState } from '../state/AppState'

export function NewWorkspacePage() {
  const { state } = useAppState()
  const navigate = useNavigate()
  const location = useLocation()
  const client = useQueryClient()
  const initialUrl = (location.state as { initialUrl?: string })?.initialUrl || ''

  const [name, setName] = useState('')
  const [url, setUrl] = useState(initialUrl)

  useEffect(() => {
    if (initialUrl && !name) {
      const parts = initialUrl.split('/')
      const inferred = parts[parts.length - 1] || parts[parts.length - 2]
      if (inferred) setName(inferred.replace(/\.git$/, ''))
    }
  }, [initialUrl, name])

  const mutation = useMutation({
    mutationFn: () =>
      api.post('/repository-workspaces', {
        repository_name: name.trim(),
        github_repository_url: url.trim() || null,
      }),
    onSuccess: async ({ data }) => {
      await client.invalidateQueries({ queryKey: ['workspaces'] })
      navigate(`/workspace/${data.id}`)
    },
  })

  const errorMessage =
    mutation.error && 'response' in mutation.error
      ? ((mutation.error.response as { data?: { detail?: string } })?.data?.detail ||
          'The workspace request was rejected.')
      : 'The backend service could not be reached. Ensure the API server is active on port 8000.'

  return (
    <Shell>
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <Link to="/" className="inline-flex items-center gap-2 text-xs font-mono text-zinc-400 hover:text-white transition-colors mb-8">
          ← Return to repository index
        </Link>

        {state.authEmail ? (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            {/* Left Column: Context */}
            <div className="md:col-span-5 space-y-4">
              <h1 className="font-heading text-3xl font-bold tracking-tight text-white">
                Initialize Repository Analysis
              </h1>
              <p className="text-zinc-400 text-sm leading-relaxed font-sans">
                Provide repository details to generate AST dependency traces, map entry points, and compile contributor guides.
              </p>

              <div className="v-feature-card p-4 space-y-2 mt-4 text-xs font-mono">
                <div className="text-zinc-200 font-semibold flex items-center gap-2">
                  <Terminal size={14} className="text-emerald-400" />
                  <span>Automated Analysis Heuristics</span>
                </div>
                <div className="text-zinc-400 text-[11px] leading-relaxed font-sans">
                  01. Traverses file trees & detects root entrypoints<br />
                  02. Traces request-to-database execution sequences<br />
                  03. Identifies frameworks and ORM models
                </div>
              </div>
            </div>

            {/* Right Column: Form with Vengeance Glow Card */}
            <div className="md:col-span-7">
              <div className="v-card-glow-wrap">
                <form
                  className="v-card-glow-inner p-6 sm:p-8 space-y-5"
                  onSubmit={(e) => {
                    e.preventDefault()
                    mutation.mutate()
                  }}
                >
                  <div className="space-y-1.5">
                    <label className="text-xs font-mono font-medium text-zinc-300 flex items-center justify-between">
                      <span>REPOSITORY IDENTIFIER</span>
                      <span className="text-[10px] text-zinc-500 uppercase">Required</span>
                    </label>
                    <div className="rounded-[4px] border border-white/10 bg-[#090a0d] focus-within:border-emerald-500 transition-colors">
                      <input
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. repomentor-core or express-backend"
                        className="w-full bg-transparent px-3.5 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none font-sans"
                      />
                    </div>
                    <span className="text-[11px] text-zinc-500 block font-sans">
                      A descriptive title to reference this analysis workspace.
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-mono font-medium text-zinc-300 flex items-center justify-between">
                      <span>GITHUB REPOSITORY URL</span>
                      <span className="text-[10px] text-zinc-500 uppercase">Optional for Local</span>
                    </label>
                    <div className="rounded-[4px] border border-white/10 bg-[#090a0d] focus-within:border-emerald-500 transition-colors">
                      <input
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://github.com/organization/repository"
                        className="w-full bg-transparent px-3.5 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none font-sans"
                      />
                    </div>
                    <span className="text-[11px] text-zinc-500 block font-sans">
                      Leave empty if you intend to paste or upload local source files directly.
                    </span>
                  </div>

                  {mutation.isError && (
                    <div className="p-3 rounded-[3px] border border-red-500/30 bg-red-500/10 text-red-300 text-xs font-mono" role="alert">
                      {errorMessage}
                    </div>
                  )}

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="v-btn-primary w-full py-2.5 px-4 rounded-[3px] text-xs font-semibold flex items-center justify-center gap-2 group cursor-pointer"
                      disabled={mutation.isPending}
                    >
                      <span>{mutation.isPending ? 'Provisioning Workspace...' : 'Create Analysis Workspace'}</span>
                      <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        ) : (
          <AuthRequiredNotice />
        )}
      </div>
    </Shell>
  )
}

function AuthRequiredNotice() {
  return (
    <div className="v-card-glow-wrap max-w-md mx-auto">
      <div className="v-card-glow-inner p-8 text-center space-y-4">
        <div className="w-10 h-10 rounded-[4px] bg-zinc-900 border border-zinc-700 mx-auto flex items-center justify-center text-emerald-400">
          <LockKeyhole size={18} />
        </div>
        <div className="v-pill-badge text-[11px]">
          <span>[PROTECTED AREA]</span>
        </div>
        <h2 className="font-heading text-xl font-bold text-white">
          Sign in to initialize workspaces
        </h2>
        <p className="text-xs text-zinc-400 leading-relaxed font-sans max-w-xs mx-auto">
          Repository guides and call graphs are saved securely to your account.
        </p>
        <div className="flex justify-center gap-3 pt-2">
          <Link className="v-btn-primary text-xs py-2 px-4 rounded-[3px]" to="/login" state={{ from: '/new' }}>
            Sign In
          </Link>
          <Link className="v-btn-secondary text-xs py-2 px-4 rounded-[3px]" to="/signup" state={{ from: '/new' }}>
            Register
          </Link>
        </div>
      </div>
    </div>
  )
}
