import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import {
  ArrowRight,
  GitBranch,
  LockKeyhole,
  Terminal,
  FolderGit2,
  Sparkles,
  ShieldCheck,
  Code2,
  LoaderCircle,
  ArrowLeft,
} from 'lucide-react'
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
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8 space-y-8">
        <div>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-mono text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={13} />
            <span>Return to Workspaces</span>
          </Link>
        </div>

        {state.authEmail ? (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            {/* Left Column: Context & Overview */}
            <div className="md:col-span-5 space-y-6">
              <div className="space-y-2">
                <span className="font-mono text-[10px] uppercase tracking-wider text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-[2px] inline-block">
                  New Workspace
                </span>
                <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-white">
                  Start Repository Analysis
                </h1>
                <p className="text-zinc-300 text-xs sm:text-sm leading-relaxed font-sans">
                  RepoMentor reads any repository without running code and creates an interactive, visual architectural map.
                </p>
              </div>

              {/* 3 Step Guide */}
              <div className="space-y-3 pt-2">
                <div className="rounded-lg border border-white/10 bg-[#0f1118] p-3.5 flex items-start gap-3">
                  <div className="w-7 h-7 rounded-[4px] bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0 mt-0.5">
                    <FolderGit2 size={15} />
                  </div>
                  <div className="space-y-0.5">
                    <h3 className="text-xs font-semibold text-white">1. Link or Upload</h3>
                    <p className="text-[11px] text-zinc-400 leading-relaxed font-sans">
                      Paste a public GitHub repo URL or create a local workspace to upload source files.
                    </p>
                  </div>
                </div>

                <div className="rounded-lg border border-white/10 bg-[#0f1118] p-3.5 flex items-start gap-3">
                  <div className="w-7 h-7 rounded-[4px] bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 flex-shrink-0 mt-0.5">
                    <ShieldCheck size={15} />
                  </div>
                  <div className="space-y-0.5">
                    <h3 className="text-xs font-semibold text-white">2. Static Inspection</h3>
                    <p className="text-[11px] text-zinc-400 leading-relaxed font-sans">
                      Files are parsed safely without running external software or unsafe sandboxes.
                    </p>
                  </div>
                </div>

                <div className="rounded-lg border border-white/10 bg-[#0f1118] p-3.5 flex items-start gap-3">
                  <div className="w-7 h-7 rounded-[4px] bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 flex-shrink-0 mt-0.5">
                    <Sparkles size={15} />
                  </div>
                  <div className="space-y-0.5">
                    <h3 className="text-xs font-semibold text-white">3. Visual Guide & Pathways</h3>
                    <p className="text-[11px] text-zinc-400 leading-relaxed font-sans">
                      Get a beginner-friendly project guide, route maps, and a file browser instantly.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Form */}
            <div className="md:col-span-7">
              <div className="rounded-xl border border-white/10 bg-[#0f1118] p-6 sm:p-8 shadow-sm">
                <form
                  className="space-y-5"
                  onSubmit={(e) => {
                    e.preventDefault()
                    mutation.mutate()
                  }}
                >
                  <div className="space-y-1.5">
                    <label className="text-xs font-mono font-medium text-zinc-200 flex items-center justify-between">
                      <span>PROJECT NAME</span>
                      <span className="text-[10px] text-emerald-400 font-mono">Required</span>
                    </label>
                    <input
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. task-manager or express-backend"
                      className="w-full bg-[#131520] border border-white/10 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 rounded-[4px] px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 font-sans focus:outline-none transition-all"
                    />
                    <span className="text-[11px] text-zinc-400 block font-sans">
                      A clear name to identify this project inside your workspace.
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-mono font-medium text-zinc-200 flex items-center justify-between">
                      <span>GITHUB REPOSITORY URL</span>
                      <span className="text-[10px] text-zinc-500 font-mono">Optional for Local</span>
                    </label>
                    <input
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://github.com/organization/repository"
                      className="w-full bg-[#131520] border border-white/10 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 rounded-[4px] px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 font-sans focus:outline-none transition-all"
                    />
                    <span className="text-[11px] text-zinc-400 block font-sans">
                      Leave empty if you want to paste code snippets or upload files manually.
                    </span>
                  </div>

                  {mutation.isError && (
                    <div
                      className="p-3.5 rounded-md border border-red-500/30 bg-red-500/10 text-red-300 text-xs font-mono"
                      role="alert"
                    >
                      {errorMessage}
                    </div>
                  )}

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="w-full py-2.5 px-4 rounded-[4px] bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                      disabled={mutation.isPending}
                    >
                      {mutation.isPending ? (
                        <>
                          <LoaderCircle size={14} className="animate-spin" />
                          <span>Initializing Workspace...</span>
                        </>
                      ) : (
                        <>
                          <span>Create Workspace & Start Analysis</span>
                          <ArrowRight size={14} />
                        </>
                      )}
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
    <div className="max-w-md mx-auto rounded-xl border border-white/10 bg-[#0f1118] p-8 text-center space-y-4 shadow-sm">
      <div className="w-11 h-11 rounded-lg bg-emerald-500/10 border border-emerald-500/20 mx-auto flex items-center justify-center text-emerald-400">
        <LockKeyhole size={20} />
      </div>
      <div className="space-y-1">
        <h2 className="font-heading text-lg font-bold text-white">
          Sign In to Create Workspaces
        </h2>
        <p className="text-xs text-zinc-400 leading-relaxed font-sans max-w-xs mx-auto">
          Your analyzed repositories and contributor guides are securely saved to your account.
        </p>
      </div>
      <div className="flex justify-center gap-3 pt-2">
        <Link
          className="px-4 py-2 rounded-[4px] bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors"
          to="/login"
          state={{ from: '/new' }}
        >
          Sign In
        </Link>
        <Link
          className="px-4 py-2 rounded-[4px] bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-white text-xs font-medium transition-colors"
          to="/signup"
          state={{ from: '/new' }}
        >
          Register
        </Link>
      </div>
    </div>
  )
}
