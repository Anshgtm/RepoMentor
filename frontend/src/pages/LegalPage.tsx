import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ChevronDown,
  Copy,
  Check,
  Link as LinkIcon,
  Printer,
  Shield,
  FileText,
  Lock,
  GitBranch,
  Cpu,
  Server,
  AlertTriangle,
  Menu,
  X,
} from 'lucide-react'
import { Shell } from '../components/layout/Shell'

type LegalType = 'privacy' | 'terms'

interface TocItem {
  id: string
  label: string
}

const TERMS_TOC: TocItem[] = [
  { id: 'summary', label: 'Summary' },
  { id: 'terms-agreement', label: 'The RepoMentor Terms' },
  { id: 'definitions', label: 'A. Definitions' },
  { id: 'account-terms', label: 'B. Account Terms & Access' },
  { id: 'acceptable-use', label: 'C. Acceptable Use' },
  { id: 'code-ownership', label: 'D. Code Ownership & IP' },
  { id: 'ai-features', label: 'E. AI Features & No Training' },
  { id: 'github-api', label: 'F. GitHub API Terms & Limits' },
  { id: 'liability', label: 'G. Limitation of Liability' },
  { id: 'changes', label: 'H. Changes & Termination' },
  { id: 'contact', label: 'I. Contact Information' },
]

const PRIVACY_TOC: TocItem[] = [
  { id: 'summary', label: 'Summary' },
  { id: 'privacy-statement', label: 'The Privacy Statement' },
  { id: 'overview', label: 'A. Overview & Philosophy' },
  { id: 'data-collected', label: 'B. Information We Collect' },
  { id: 'github-access', label: 'C. GitHub API & Scope' },
  { id: 'zero-training', label: 'D. Zero AI Model Training' },
  { id: 'local-storage', label: 'E. Local Storage & Client State' },
  { id: 'security', label: 'F. Encryption & Security' },
  { id: 'self-hosted', label: 'G. Self-Hosted Instances' },
  { id: 'user-rights', label: 'H. Your Rights & Deletion' },
  { id: 'contact', label: 'I. Inquiries & Updates' },
]

export function PrivacyPage() {
  return <LegalPageLayout activeType="privacy" />
}

export function TermsPage() {
  return <LegalPageLayout activeType="terms" />
}

function LegalPageLayout({ activeType }: { activeType: LegalType }) {
  const navigate = useNavigate()
  const [copied, setCopied] = useState(false)
  const [activeTocId, setActiveTocId] = useState<string>('summary')
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  const isPrivacy = activeType === 'privacy'
  const tocItems = isPrivacy ? PRIVACY_TOC : TERMS_TOC

  // Track active section on scroll
  useEffect(() => {
    const handleScroll = () => {
      const scrollPos = window.scrollY + 120
      for (let i = tocItems.length - 1; i >= 0; i--) {
        const item = tocItems[i]
        const el = document.getElementById(item.id)
        if (el && el.offsetTop <= scrollPos) {
          setActiveTocId(item.id)
          return
        }
      }
      setActiveTocId(tocItems[0]?.id || '')
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [tocItems, activeType])

  const scrollTo = (id: string) => {
    const el = document.getElementById(id)
    if (el) {
      const offset = 96
      const bodyRect = document.body.getBoundingClientRect().top
      const elementRect = el.getBoundingClientRect().top
      const elementPosition = elementRect - bodyRect
      const offsetPosition = elementPosition - offset

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      })
      setActiveTocId(id)
      setMobileNavOpen(false)
    }
  }

  const handleCopyMarkdown = () => {
    const contentEl = document.getElementById('legal-article-content')
    if (contentEl) {
      const text = contentEl.innerText
      navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2200)
    }
  }

  return (
    <Shell>
      <div className="min-h-screen bg-[#0d1117] text-[#e6edf3] font-sans antialiased selection:bg-[#1f6feb]/30 selection:text-white">
        {/* GitHub Green Top Accent Line */}
        <div className="h-[2px] bg-gradient-to-r from-emerald-500 via-[#238636] to-emerald-500 w-full" />

        {/* 3-Column Documentation Container */}
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 py-8">
          {/* Mobile Policy Nav Button */}
          <div className="lg:hidden mb-6">
            <button
              type="button"
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-[6px] border border-[#30363d] bg-[#141416] text-xs font-mono text-[#e6edf3] shadow-sm hover:bg-[#1c2128] transition-colors"
              aria-label="Toggle navigation"
            >
              <div className="flex items-center gap-2">
                {mobileNavOpen ? <X size={14} className="text-emerald-400" /> : <Menu size={14} className="text-[#8b949e]" />}
                <span>{mobileNavOpen ? 'Close Site Policy' : 'Site Policy Navigation'}</span>
              </div>
              <ChevronDown size={14} className={`text-[#8b949e] transition-transform ${mobileNavOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* -------------------------------------------------------- */}
            {/* LEFT SIDEBAR: Site Policy Navigation (3 cols)            */}
            {/* -------------------------------------------------------- */}
            <aside
              className={`lg:col-span-3 ${
                mobileNavOpen ? 'block' : 'hidden'
              } lg:block lg:sticky lg:top-[96px]`}
            >
              <div className="bg-[#141416] lg:bg-[#141416]/50 lg:backdrop-blur-sm border border-[#30363d] rounded-[8px] p-4 lg:p-3.5 space-y-6">
                <div>
                  <h2 className="text-lg font-semibold tracking-tight text-[#e6edf3] mb-4">
                    Site policy
                  </h2>

                  {/* Section 1: RepoMentor Terms Group */}
                  <div className="space-y-1 mb-6">
                    <div className="flex items-center justify-between text-xs font-semibold text-[#e6edf3] px-2 py-1.5">
                      <span>RepoMentor Terms</span>
                      <ChevronDown size={14} className="text-[#8b949e]" />
                    </div>

                    <div className="space-y-0.5 pl-1">
                      <Link
                        to="/terms"
                        className={`group flex items-center text-xs py-1.5 px-2.5 rounded-[4px] transition-colors ${
                          !isPrivacy
                            ? 'text-white font-medium bg-[#161b22] border-l-2 border-[#238636] pl-2'
                            : 'text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#161b22]/60'
                        }`}
                      >
                        RepoMentor Terms of Service
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          if (isPrivacy) navigate('/terms')
                          else scrollTo('acceptable-use')
                        }}
                        className="w-full text-left text-xs py-1.5 px-2.5 rounded-[4px] text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#161b22]/60 transition-colors"
                      >
                        Acceptable Use Policy
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (isPrivacy) navigate('/terms')
                          else scrollTo('code-ownership')
                        }}
                        className="w-full text-left text-xs py-1.5 px-2.5 rounded-[4px] text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#161b22]/60 transition-colors"
                      >
                        Code Ownership &amp; IP
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (isPrivacy) navigate('/terms')
                          else scrollTo('ai-features')
                        }}
                        className="w-full text-left text-xs py-1.5 px-2.5 rounded-[4px] text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#161b22]/60 transition-colors"
                      >
                        AI Explanations &amp; Guidance
                      </button>
                    </div>
                  </div>

                  {/* Section 2: Privacy & Data Protection Group */}
                  <div className="space-y-1 mb-6">
                    <div className="flex items-center justify-between text-xs font-semibold text-[#e6edf3] px-2 py-1.5">
                      <span>Privacy &amp; Data Governance</span>
                      <ChevronDown size={14} className="text-[#8b949e]" />
                    </div>

                    <div className="space-y-0.5 pl-1">
                      <Link
                        to="/privacy"
                        className={`group flex items-center text-xs py-1.5 px-2.5 rounded-[4px] transition-colors ${
                          isPrivacy
                            ? 'text-white font-medium bg-[#161b22] border-l-2 border-[#238636] pl-2'
                            : 'text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#161b22]/60'
                        }`}
                      >
                        Privacy Policy
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          if (!isPrivacy) navigate('/privacy')
                          else scrollTo('zero-training')
                        }}
                        className="w-full text-left text-xs py-1.5 px-2.5 rounded-[4px] text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#161b22]/60 transition-colors"
                      >
                        Zero AI Model Training Policy
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (!isPrivacy) navigate('/privacy')
                          else scrollTo('github-access')
                        }}
                        className="w-full text-left text-xs py-1.5 px-2.5 rounded-[4px] text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#161b22]/60 transition-colors"
                      >
                        GitHub API &amp; Token Handling
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (!isPrivacy) navigate('/privacy')
                          else scrollTo('security')
                        }}
                        className="w-full text-left text-xs py-1.5 px-2.5 rounded-[4px] text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#161b22]/60 transition-colors"
                      >
                        Encryption &amp; Safeguards
                      </button>
                    </div>
                  </div>

                  {/* Section 3: Architecture & Security */}
                  <div className="space-y-1">
                    <div className="text-xs font-semibold text-[#e6edf3] px-2 py-1.5">
                      Additional Policies
                    </div>
                    <div className="space-y-0.5 pl-1 text-xs text-[#8b949e]">
                      <a
                        href="https://github.com"
                        target="_blank"
                        rel="noreferrer"
                        className="block py-1.5 px-2.5 hover:text-[#58a6ff] transition-colors"
                      >
                        GitHub Terms of Service ↗
                      </a>
                      <a
                        href="mailto:security@repomentor.dev"
                        className="block py-1.5 px-2.5 hover:text-[#58a6ff] transition-colors"
                      >
                        Vulnerability Disclosure
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </aside>

            {/* -------------------------------------------------------- */}
            {/* CENTER ARTICLE: GitHub Docs Style Main Content (6/7 cols)*/}
            {/* -------------------------------------------------------- */}
            <article
              id="legal-article-content"
              className="lg:col-span-6 xl:col-span-7 space-y-8 pr-0 lg:pr-4"
            >
              {/* Document Header */}
              <div className="space-y-4 pb-6 border-b border-[#30363d]">
                <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-white font-sans">
                  {isPrivacy ? 'RepoMentor Privacy Policy' : 'RepoMentor Terms of Service'}
                </h1>

                {/* Actions Bar (Copy Markdown & Print) */}
                <div className="flex items-center gap-3 pt-1 flex-wrap">
                  <button
                    type="button"
                    onClick={handleCopyMarkdown}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-[6px] border border-[#30363d] bg-[#21262d] hover:bg-[#30363d] text-xs font-semibold text-[#c9d1d9] hover:text-white transition-colors cursor-pointer shadow-sm"
                  >
                    {copied ? <Check size={13} className="text-[#3fb950]" /> : <Copy size={13} />}
                    <span>{copied ? 'Copied markdown!' : 'Copy markdown'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] border border-[#30363d] bg-[#161b22] hover:bg-[#21262d] text-[#c9d1d9] hover:text-white text-xs font-semibold transition-colors shrink-0 shadow-sm"
                    title="Print document"
                  >
                    <Printer size={13} />
                    <span>Print</span>
                  </button>

                  <span className="text-xs text-[#7d8590] font-mono">
                    Version 2.4.0 · Effective Nov 2026
                  </span>
                </div>

                {/* Friendly Intro Text */}
                <p className="text-sm sm:text-[15px] leading-relaxed text-[#c9d1d9] pt-2">
                  {isPrivacy ? (
                    <>
                      Thank you for using RepoMentor! We’re happy you’re here. Please read this Privacy Policy carefully before using RepoMentor. Because protecting your source code, architectural insights, and personal information is critical, we have made these policies as transparent as possible. For your convenience, we have presented these practices in a short <strong>non-binding summary</strong> followed by the <strong>full legal terms</strong>.
                    </>
                  ) : (
                    <>
                      Thank you for using RepoMentor! We’re happy you’re here. Please read this Terms of Service agreement carefully before accessing or using RepoMentor. Because it is such an important contract between us and our users, we have tried to make it as clear as possible. For your convenience, we have presented these terms in a short <strong>non-binding summary</strong> followed by the <strong>full legal terms</strong>.
                    </>
                  )}
                </p>
              </div>

              {/* ---------------------------------------------------- */}
              {/* SUMMARY TABLE SECTION (Exact GitHub Docs Style)     */}
              {/* ---------------------------------------------------- */}
              <section id="summary" className="scroll-mt-20 space-y-4">
                <div className="flex items-center gap-2 group">
                  <h2 className="text-2xl font-semibold text-white tracking-tight">
                    Summary
                  </h2>
                  <button
                    type="button"
                    onClick={() => scrollTo('summary')}
                    className="text-[#8b949e] opacity-0 group-hover:opacity-100 hover:text-[#58a6ff] transition-opacity"
                    aria-label="Link to Summary"
                  >
                    <LinkIcon size={16} />
                  </button>
                </div>

                <div className="overflow-x-auto rounded-[8px] border border-[#30363d] bg-[#141416] shadow-sm">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-[#1a1d24] text-[#8b949e] border-b border-[#30363d] text-xs font-semibold">
                      <tr>
                        <th className="py-2.5 px-4 w-[35%]">Section</th>
                        <th className="py-2.5 px-4 w-[65%]">What can you find there?</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#30363d] text-[#c9d1d9] text-xs sm:text-[13px]">
                      {isPrivacy ? (
                        <>
                          <tr className="hover:bg-[#161b22]/40 transition-colors">
                            <td className="py-3 px-4 font-medium">
                              <button
                                type="button"
                                onClick={() => scrollTo('overview')}
                                className="text-[#58a6ff] hover:underline text-left"
                              >
                                A. Overview &amp; Philosophy
                              </button>
                            </td>
                            <td className="py-3 px-4 text-[#8b949e]">
                              Our core commitment to developer privacy, codebase confidentiality, and data minimization.
                            </td>
                          </tr>
                          <tr className="hover:bg-[#161b22]/40 transition-colors">
                            <td className="py-3 px-4 font-medium">
                              <button
                                type="button"
                                onClick={() => scrollTo('data-collected')}
                                className="text-[#58a6ff] hover:underline text-left"
                              >
                                B. Information We Collect
                              </button>
                            </td>
                            <td className="py-3 px-4 text-[#8b949e]">
                              The specific types of data RepoMentor handles, including accounts, repository URLs, and snapshots.
                            </td>
                          </tr>
                          <tr className="hover:bg-[#161b22]/40 transition-colors">
                            <td className="py-3 px-4 font-medium">
                              <button
                                type="button"
                                onClick={() => scrollTo('github-access')}
                                className="text-[#58a6ff] hover:underline text-left"
                              >
                                C. GitHub API &amp; Scope
                              </button>
                            </td>
                            <td className="py-3 px-4 text-[#8b949e]">
                              How we use GitHub's API strictly in read-only mode to extract AST and repository structures.
                            </td>
                          </tr>
                          <tr className="hover:bg-[#161b22]/40 transition-colors">
                            <td className="py-3 px-4 font-medium">
                              <button
                                type="button"
                                onClick={() => scrollTo('zero-training')}
                                className="text-[#58a6ff] hover:underline text-left"
                              >
                                D. Zero AI Model Training
                              </button>
                            </td>
                            <td className="py-3 px-4 text-[#8b949e]">
                              Guarantees that your proprietary source code is never used to train or fine-tune AI foundation models.
                            </td>
                          </tr>
                          <tr className="hover:bg-[#161b22]/40 transition-colors">
                            <td className="py-3 px-4 font-medium">
                              <button
                                type="button"
                                onClick={() => scrollTo('local-storage')}
                                className="text-[#58a6ff] hover:underline text-left"
                              >
                                E. Local Storage &amp; Client State
                              </button>
                            </td>
                            <td className="py-3 px-4 text-[#8b949e]">
                              How your browser stores contrast themes, tokens, and workspace preferences locally.
                            </td>
                          </tr>
                          <tr className="hover:bg-[#161b22]/40 transition-colors">
                            <td className="py-3 px-4 font-medium">
                              <button
                                type="button"
                                onClick={() => scrollTo('security')}
                                className="text-[#58a6ff] hover:underline text-left"
                              >
                                F. Encryption &amp; Security
                              </button>
                            </td>
                            <td className="py-3 px-4 text-[#8b949e]">
                              Technical safeguards: TLS 1.3 encryption, salted bcrypt hashes, and memory isolation.
                            </td>
                          </tr>
                          <tr className="hover:bg-[#161b22]/40 transition-colors">
                            <td className="py-3 px-4 font-medium">
                              <button
                                type="button"
                                onClick={() => scrollTo('self-hosted')}
                                className="text-[#58a6ff] hover:underline text-left"
                              >
                                G. Self-Hosted Instances
                              </button>
                            </td>
                            <td className="py-3 px-4 text-[#8b949e]">
                              Information for organizations deploying RepoMentor on their own VPC without external telemetry.
                            </td>
                          </tr>
                          <tr className="hover:bg-[#161b22]/40 transition-colors">
                            <td className="py-3 px-4 font-medium">
                              <button
                                type="button"
                                onClick={() => scrollTo('user-rights')}
                                className="text-[#58a6ff] hover:underline text-left"
                              >
                                H. Your Rights &amp; Deletion
                              </button>
                            </td>
                            <td className="py-3 px-4 text-[#8b949e]">
                              How you can export your guides or purge your workspaces and account records at any time.
                            </td>
                          </tr>
                          <tr className="hover:bg-[#161b22]/40 transition-colors">
                            <td className="py-3 px-4 font-medium">
                              <button
                                type="button"
                                onClick={() => scrollTo('contact')}
                                className="text-[#58a6ff] hover:underline text-left"
                              >
                                I. Inquiries &amp; Updates
                              </button>
                            </td>
                            <td className="py-3 px-4 text-[#8b949e]">
                              How to contact our data governance team with questions or privacy requests.
                            </td>
                          </tr>
                        </>
                      ) : (
                        <>
                          <tr className="hover:bg-[#161b22]/40 transition-colors">
                            <td className="py-3 px-4 font-medium">
                              <button
                                type="button"
                                onClick={() => scrollTo('definitions')}
                                className="text-[#58a6ff] hover:underline text-left"
                              >
                                A. Definitions
                              </button>
                            </td>
                            <td className="py-3 px-4 text-[#8b949e]">
                              Basic terms and phrases defined to help clarify this agreement and avoid ambiguity.
                            </td>
                          </tr>
                          <tr className="hover:bg-[#161b22]/40 transition-colors">
                            <td className="py-3 px-4 font-medium">
                              <button
                                type="button"
                                onClick={() => scrollTo('account-terms')}
                                className="text-[#58a6ff] hover:underline text-left"
                              >
                                B. Account Terms &amp; Access
                              </button>
                            </td>
                            <td className="py-3 px-4 text-[#8b949e]">
                              Basic requirements and developer responsibilities for maintaining an account on RepoMentor.
                            </td>
                          </tr>
                          <tr className="hover:bg-[#161b22]/40 transition-colors">
                            <td className="py-3 px-4 font-medium">
                              <button
                                type="button"
                                onClick={() => scrollTo('acceptable-use')}
                                className="text-[#58a6ff] hover:underline text-left"
                              >
                                C. Acceptable Use
                              </button>
                            </td>
                            <td className="py-3 px-4 text-[#8b949e]">
                              Rules regarding authorized repositories, prohibition of malware, and non-abuse policies.
                            </td>
                          </tr>
                          <tr className="hover:bg-[#161b22]/40 transition-colors">
                            <td className="py-3 px-4 font-medium">
                              <button
                                type="button"
                                onClick={() => scrollTo('code-ownership')}
                                className="text-[#58a6ff] hover:underline text-left"
                              >
                                D. Code Ownership &amp; IP
                              </button>
                            </td>
                            <td className="py-3 px-4 text-[#8b949e]">
                              You retain 100% intellectual property ownership of your repositories, code, and guides.
                            </td>
                          </tr>
                          <tr className="hover:bg-[#161b22]/40 transition-colors">
                            <td className="py-3 px-4 font-medium">
                              <button
                                type="button"
                                onClick={() => scrollTo('ai-features')}
                                className="text-[#58a6ff] hover:underline text-left"
                              >
                                E. AI Features &amp; No Training
                              </button>
                            </td>
                            <td className="py-3 px-4 text-[#8b949e]">
                              Explanation that generated guides are advisory assistance and your code is never trained on.
                            </td>
                          </tr>
                          <tr className="hover:bg-[#161b22]/40 transition-colors">
                            <td className="py-3 px-4 font-medium">
                              <button
                                type="button"
                                onClick={() => scrollTo('github-api')}
                                className="text-[#58a6ff] hover:underline text-left"
                              >
                                F. GitHub API Terms &amp; Limits
                              </button>
                            </td>
                            <td className="py-3 px-4 text-[#8b949e]">
                              Dependencies on GitHub API quotas, token rate limits, and third-party upstream availability.
                            </td>
                          </tr>
                          <tr className="hover:bg-[#161b22]/40 transition-colors">
                            <td className="py-3 px-4 font-medium">
                              <button
                                type="button"
                                onClick={() => scrollTo('liability')}
                                className="text-[#58a6ff] hover:underline text-left"
                              >
                                G. Limitation of Liability
                              </button>
                            </td>
                            <td className="py-3 px-4 text-[#8b949e]">
                              Standard developer disclaimers stating software is provided "as is" without warranty.
                            </td>
                          </tr>
                          <tr className="hover:bg-[#161b22]/40 transition-colors">
                            <td className="py-3 px-4 font-medium">
                              <button
                                type="button"
                                onClick={() => scrollTo('changes')}
                                className="text-[#58a6ff] hover:underline text-left"
                              >
                                H. Changes &amp; Termination
                              </button>
                            </td>
                            <td className="py-3 px-4 text-[#8b949e]">
                              How terms may be updated as RepoMentor adds new capabilities and how accounts are closed.
                            </td>
                          </tr>
                          <tr className="hover:bg-[#161b22]/40 transition-colors">
                            <td className="py-3 px-4 font-medium">
                              <button
                                type="button"
                                onClick={() => scrollTo('contact')}
                                className="text-[#58a6ff] hover:underline text-left"
                              >
                                I. Contact Information
                              </button>
                            </td>
                            <td className="py-3 px-4 text-[#8b949e]">
                              How to contact the RepoMentor legal and engineering maintainers.
                            </td>
                          </tr>
                        </>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* ---------------------------------------------------- */}
              {/* FULL LEGAL TEXT SECTIONS                             */}
              {/* ---------------------------------------------------- */}
              {isPrivacy ? <PrivacyFullSections scrollTo={scrollTo} /> : <TermsFullSections scrollTo={scrollTo} />}
            </article>

            {/* -------------------------------------------------------- */}
            {/* RIGHT SIDEBAR: "IN THIS ARTICLE" (Visible on desktop)   */}
            {/* -------------------------------------------------------- */}
            <aside className="hidden lg:block lg:col-span-3 xl:col-span-2 sticky top-[96px] self-start">
              <div className="space-y-3 pt-2">
                <h3 className="text-[11px] font-mono font-semibold uppercase tracking-wider text-[#7d8590]">
                  In this article
                </h3>

                <nav className="space-y-1 border-l border-[#30363d] pl-3">
                  {tocItems.map((item) => {
                    const isActive = activeTocId === item.id
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => scrollTo(item.id)}
                        className={`block w-full text-left text-xs py-1 transition-colors truncate ${
                          isActive
                            ? 'text-[#58a6ff] font-medium -ml-[13px] pl-3 border-l-2 border-[#58a6ff]'
                            : 'text-[#8b949e] hover:text-[#c9d1d9]'
                        }`}
                      >
                        {item.label}
                      </button>
                    )
                  })}
                </nav>

                <div className="pt-6 border-t border-[#30363d]/60 space-y-2 text-xs text-[#7d8590]">
                  <p className="font-mono text-[11px] text-[#8b949e]">
                    RepoMentor Docs
                  </p>
                  <Link
                    to={isPrivacy ? '/terms' : '/privacy'}
                    className="block text-[#58a6ff] hover:underline"
                  >
                    Switch to {isPrivacy ? 'Terms of Service' : 'Privacy Policy'} →
                  </Link>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </Shell>
  )
}

/* -------------------------------------------------------------------------- */
/* PRIVACY POLICY FULL TEXT SECTIONS (Clean Docs Style)                       */
/* -------------------------------------------------------------------------- */
function PrivacyFullSections({ scrollTo }: { scrollTo: (id: string) => void }) {
  return (
    <div className="space-y-12 pt-6">
      <div id="privacy-statement" className="scroll-mt-20">
        <h2 className="text-2xl font-semibold text-white tracking-tight border-b border-[#30363d] pb-2">
          The RepoMentor Privacy Statement
        </h2>
        <p className="text-sm leading-relaxed text-[#c9d1d9] mt-3">
          This document represents the formal privacy terms under which RepoMentor is operated. We take the privacy and confidentiality of developer source code with paramount seriousness.
        </p>
      </div>

      {/* A. Overview */}
      <section id="overview" className="scroll-mt-20 space-y-3">
        <div className="flex items-center gap-2 group">
          <h3 className="text-xl font-semibold text-white tracking-tight">
            A. Overview &amp; Philosophy
          </h3>
          <button
            type="button"
            onClick={() => scrollTo('overview')}
            className="text-[#8b949e] opacity-0 group-hover:opacity-100 hover:text-[#58a6ff] transition-opacity"
          >
            <LinkIcon size={15} />
          </button>
        </div>
        <p className="text-sm leading-relaxed text-[#c9d1d9]">
          RepoMentor is engineered to assist developers, engineering managers, and security auditors in quickly comprehending unfamiliar codebases. Our core design tenet is <strong>Zero Intrusion</strong>: we only inspect what you explicitly point us to, and we never retain permanent copies of proprietary repository source code.
        </p>
        <p className="text-sm leading-relaxed text-[#8b949e]">
          Whether you connect via an open-source public repository URL or provide a scoped personal access token, we treat all source code, comments, abstract syntax trees, and architecture maps as strictly confidential.
        </p>
      </section>

      {/* B. Information We Collect */}
      <section id="data-collected" className="scroll-mt-20 space-y-3">
        <div className="flex items-center gap-2 group">
          <h3 className="text-xl font-semibold text-white tracking-tight">
            B. Information We Collect
          </h3>
          <button
            type="button"
            onClick={() => scrollTo('data-collected')}
            className="text-[#8b949e] opacity-0 group-hover:opacity-100 hover:text-[#58a6ff] transition-opacity"
          >
            <LinkIcon size={15} />
          </button>
        </div>
        <p className="text-sm leading-relaxed text-[#c9d1d9]">
          We collect and process only the minimal data required to deliver repository browsing and architectural guides:
        </p>
        <ul className="list-disc list-inside space-y-2 text-sm text-[#c9d1d9] pl-2">
          <li>
            <strong>Account Credentials:</strong> Your email address and a cryptographically salted bcrypt hash of your password when creating an account.
          </li>
          <li>
            <strong>Workspace Metadata:</strong> Custom workspace names, repository targets (e.g. <code className="text-[#79c0ff] bg-[#161b22] px-1.5 py-0.5 rounded text-xs font-mono">owner/repo</code>), and saved developer notes.
          </li>
          <li>
            <strong>Ephemeral Code Snapshots:</strong> File directory trees, README contents, and selected code files requested through the interface during active sessions.
          </li>
          <li>
            <strong>Technical Logs:</strong> Server response status codes, latency timings, and anonymized diagnostic traces to prevent system outages.
          </li>
        </ul>
      </section>

      {/* C. GitHub API & Scope */}
      <section id="github-access" className="scroll-mt-20 space-y-3">
        <div className="flex items-center gap-2 group">
          <h3 className="text-xl font-semibold text-white tracking-tight">
            C. GitHub API &amp; Scope
          </h3>
          <button
            type="button"
            onClick={() => scrollTo('github-access')}
            className="text-[#8b949e] opacity-0 group-hover:opacity-100 hover:text-[#58a6ff] transition-opacity"
          >
            <LinkIcon size={15} />
          </button>
        </div>
        <p className="text-sm leading-relaxed text-[#c9d1d9]">
          RepoMentor interfaces with GitHub through standard Octokit REST and GraphQL endpoints.
        </p>
        <div className="p-3.5 rounded-[6px] border border-[#30363d] bg-[#161b22] text-xs text-[#c9d1d9] space-y-2">
          <div className="flex items-center gap-2 text-[#3fb950] font-mono font-semibold">
            <GitBranch size={14} />
            <span>READ-ONLY ENFORCEMENT</span>
          </div>
          <p>
            RepoMentor’s GitHub integration is strictly read-only. We do not request, possess, or execute write permissions, branch mutation, pull request creation, or repository deletion privileges. Configured <code className="text-[#79c0ff] font-mono">GITHUB_TOKEN</code> keys remain on your server and are never delivered to client browsers.
          </p>
        </div>
      </section>

      {/* D. Zero AI Model Training */}
      <section id="zero-training" className="scroll-mt-20 space-y-3">
        <div className="flex items-center gap-2 group">
          <h3 className="text-xl font-semibold text-white tracking-tight">
            D. Zero AI Model Training Guarantee
          </h3>
          <button
            type="button"
            onClick={() => scrollTo('zero-training')}
            className="text-[#8b949e] opacity-0 group-hover:opacity-100 hover:text-[#58a6ff] transition-opacity"
          >
            <LinkIcon size={15} />
          </button>
        </div>
        <div className="p-4 rounded-[6px] border border-[#238636]/40 bg-[#238636]/10 text-[#e6edf3] space-y-2">
          <div className="flex items-center gap-2 text-[#3fb950] font-mono text-xs font-semibold">
            <Cpu size={14} />
            <span>NON-TRAINING COMMITMENT</span>
          </div>
          <p className="text-sm leading-relaxed">
            RepoMentor <strong>never</strong> uses, sells, or shares your private repository source code, AST graphs, or analysis guides to train, fine-tune, or reinforce artificial intelligence foundation models.
          </p>
        </div>
        <p className="text-sm leading-relaxed text-[#8b949e]">
          When natural-language summaries are synthesized, code contexts are executed in isolated, stateless sessions. No user code snippets are persisted into training datasets.
        </p>
      </section>

      {/* E. Local Storage */}
      <section id="local-storage" className="scroll-mt-20 space-y-3">
        <div className="flex items-center gap-2 group">
          <h3 className="text-xl font-semibold text-white tracking-tight">
            E. Local Storage &amp; Client State
          </h3>
          <button
            type="button"
            onClick={() => scrollTo('local-storage')}
            className="text-[#8b949e] opacity-0 group-hover:opacity-100 hover:text-[#58a6ff] transition-opacity"
          >
            <LinkIcon size={15} />
          </button>
        </div>
        <p className="text-sm leading-relaxed text-[#c9d1d9]">
          RepoMentor avoids third-party advertising cookies and tracker pixels. We rely solely on first-party <code className="text-[#79c0ff] bg-[#161b22] px-1 py-0.5 rounded text-xs font-mono">localStorage</code> items:
        </p>
        <ul className="list-disc list-inside space-y-1.5 text-sm text-[#8b949e] pl-2">
          <li><code className="text-[#c9d1d9] font-mono">repository-guide-token</code>: Stores your authenticated session JWT.</li>
          <li><code className="text-[#c9d1d9] font-mono">repository-guide-theme</code>: Remembers your selected reading contrast mode.</li>
        </ul>
        <p className="text-xs text-[#7d8590]">
          You can clear these values anytime through your browser storage controls.
        </p>
      </section>

      {/* F. Security */}
      <section id="security" className="scroll-mt-20 space-y-3">
        <div className="flex items-center gap-2 group">
          <h3 className="text-xl font-semibold text-white tracking-tight">
            F. Encryption &amp; Security Standards
          </h3>
          <button
            type="button"
            onClick={() => scrollTo('security')}
            className="text-[#8b949e] opacity-0 group-hover:opacity-100 hover:text-[#58a6ff] transition-opacity"
          >
            <LinkIcon size={15} />
          </button>
        </div>
        <p className="text-sm leading-relaxed text-[#c9d1d9]">
          All communication is encrypted using modern TLS 1.3 protocol suites in transit. At rest, passwords are hashed with high-cost factor bcrypt algorithms. We enforce strict JSON Web Token signature verification on all workspace endpoints.
        </p>
      </section>

      {/* G. Self-Hosted */}
      <section id="self-hosted" className="scroll-mt-20 space-y-3">
        <div className="flex items-center gap-2 group">
          <h3 className="text-xl font-semibold text-white tracking-tight">
            G. Self-Hosted Instances
          </h3>
          <button
            type="button"
            onClick={() => scrollTo('self-hosted')}
            className="text-[#8b949e] opacity-0 group-hover:opacity-100 hover:text-[#58a6ff] transition-opacity"
          >
            <LinkIcon size={15} />
          </button>
        </div>
        <p className="text-sm leading-relaxed text-[#c9d1d9]">
          If you run RepoMentor in your private cloud or on-premises Kubernetes cluster, 100% of your data remains inside your own infrastructure boundary. RepoMentor has zero external telemetry pings or callbacks to our servers.
        </p>
      </section>

      {/* H. User Rights */}
      <section id="user-rights" className="scroll-mt-20 space-y-3">
        <div className="flex items-center gap-2 group">
          <h3 className="text-xl font-semibold text-white tracking-tight">
            H. Your Rights &amp; Deletion
          </h3>
          <button
            type="button"
            onClick={() => scrollTo('user-rights')}
            className="text-[#8b949e] opacity-0 group-hover:opacity-100 hover:text-[#58a6ff] transition-opacity"
          >
            <LinkIcon size={15} />
          </button>
        </div>
        <p className="text-sm leading-relaxed text-[#c9d1d9]">
          You have full rights to inspect, export, or purge any saved workspace from your dashboard. Deleting a workspace irrevocably purges all associated guide caches and notes. You may also contact our maintainers to request complete deletion of your account.
        </p>
      </section>

      {/* I. Contact */}
      <section id="contact" className="scroll-mt-20 space-y-3 border-t border-[#30363d] pt-6">
        <div className="flex items-center gap-2 group">
          <h3 className="text-xl font-semibold text-white tracking-tight">
            I. Inquiries &amp; Updates
          </h3>
          <button
            type="button"
            onClick={() => scrollTo('contact')}
            className="text-[#8b949e] opacity-0 group-hover:opacity-100 hover:text-[#58a6ff] transition-opacity"
          >
            <LinkIcon size={15} />
          </button>
        </div>
        <p className="text-sm leading-relaxed text-[#c9d1d9]">
          For questions regarding data processing, security assessments, or compliance documentation:
        </p>
        <div className="text-sm font-mono text-[#58a6ff] space-y-1">
          <div>Email: <a href="mailto:privacy@repomentor.dev" className="hover:underline">privacy@repomentor.dev</a></div>
          <div className="text-xs text-[#8b949e]">RepoMentor Open Source Project</div>
        </div>
      </section>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* TERMS OF SERVICE FULL TEXT SECTIONS (Clean Docs Style)                     */
/* -------------------------------------------------------------------------- */
function TermsFullSections({ scrollTo }: { scrollTo: (id: string) => void }) {
  return (
    <div className="space-y-12 pt-6">
      <div id="terms-agreement" className="scroll-mt-20">
        <h2 className="text-2xl font-semibold text-white tracking-tight border-b border-[#30363d] pb-2">
          The RepoMentor Terms of Service
        </h2>
        <p className="text-sm leading-relaxed text-[#c9d1d9] mt-3">
          These Terms of Service ("Agreement") constitute a legally binding agreement between you ("User", "you") and RepoMentor regarding your access to and use of the RepoMentor application and services.
        </p>
      </div>

      {/* A. Definitions */}
      <section id="definitions" className="scroll-mt-20 space-y-3">
        <div className="flex items-center gap-2 group">
          <h3 className="text-xl font-semibold text-white tracking-tight">
            A. Definitions
          </h3>
          <button
            type="button"
            onClick={() => scrollTo('definitions')}
            className="text-[#8b949e] opacity-0 group-hover:opacity-100 hover:text-[#58a6ff] transition-opacity"
          >
            <LinkIcon size={15} />
          </button>
        </div>
        <ul className="list-disc list-inside space-y-2 text-sm text-[#c9d1d9] pl-2">
          <li>
            <strong>"Service"</strong> refers to the RepoMentor web application, backend APIs, AST parsing utilities, and documentation.
          </li>
          <li>
            <strong>"Repository"</strong> refers to any Git repository or source tree referenced by a GitHub URL or uploaded directly.
          </li>
          <li>
            <strong>"Workspace"</strong> refers to a persistent set of notes, guides, and architectural diagrams saved under your account.
          </li>
        </ul>
      </section>

      {/* B. Account Terms */}
      <section id="account-terms" className="scroll-mt-20 space-y-3">
        <div className="flex items-center gap-2 group">
          <h3 className="text-xl font-semibold text-white tracking-tight">
            B. Account Terms &amp; Access
          </h3>
          <button
            type="button"
            onClick={() => scrollTo('account-terms')}
            className="text-[#8b949e] opacity-0 group-hover:opacity-100 hover:text-[#58a6ff] transition-opacity"
          >
            <LinkIcon size={15} />
          </button>
        </div>
        <p className="text-sm leading-relaxed text-[#c9d1d9]">
          You must be a human to register. Accounts registered by bots or automated methods are not permitted. You are responsible for safeguarding your authentication credentials and for all activities that occur under your account.
        </p>
      </section>

      {/* C. Acceptable Use */}
      <section id="acceptable-use" className="scroll-mt-20 space-y-3">
        <div className="flex items-center gap-2 group">
          <h3 className="text-xl font-semibold text-white tracking-tight">
            C. Acceptable Use Policy
          </h3>
          <button
            type="button"
            onClick={() => scrollTo('acceptable-use')}
            className="text-[#8b949e] opacity-0 group-hover:opacity-100 hover:text-[#58a6ff] transition-opacity"
          >
            <LinkIcon size={15} />
          </button>
        </div>
        <p className="text-sm leading-relaxed text-[#c9d1d9]">
          Your use of RepoMentor must comply with all applicable local, national, and international laws. Specifically, you agree NOT to:
        </p>
        <div className="p-3.5 rounded-[6px] border border-[#f85149]/30 bg-[#f85149]/10 text-xs text-[#c9d1d9] space-y-2">
          <div className="flex items-center gap-2 text-[#f85149] font-mono font-semibold">
            <AlertTriangle size={14} />
            <span>PROHIBITED ACTIONS</span>
          </div>
          <ul className="list-disc list-inside space-y-1.5 text-xs text-[#c9d1d9] pl-1">
            <li>Analyze or clone repositories you do not own or lack legal permission to access.</li>
            <li>Submit malicious source code, trojans, or software designed to exploit system memory.</li>
            <li>Launch denial-of-service floods or scrape internal API endpoints without prior consent.</li>
            <li>Harvest secrets, private API keys, or personal credentials from public codebases.</li>
          </ul>
        </div>
      </section>

      {/* D. Code Ownership */}
      <section id="code-ownership" className="scroll-mt-20 space-y-3">
        <div className="flex items-center gap-2 group">
          <h3 className="text-xl font-semibold text-white tracking-tight">
            D. Code Ownership &amp; Intellectual Property
          </h3>
          <button
            type="button"
            onClick={() => scrollTo('code-ownership')}
            className="text-[#8b949e] opacity-0 group-hover:opacity-100 hover:text-[#58a6ff] transition-opacity"
          >
            <LinkIcon size={15} />
          </button>
        </div>
        <div className="p-4 rounded-[6px] border border-[#238636]/40 bg-[#238636]/10 text-[#e6edf3] space-y-2">
          <div className="flex items-center gap-2 text-[#3fb950] font-mono text-xs font-semibold">
            <span>FULL DEVELOPER INTELLECTUAL PROPERTY RETENTION</span>
          </div>
          <p className="text-sm leading-relaxed">
            You retain full, unencumbered ownership of all intellectual property, copyright, and source material analyzed through RepoMentor. RepoMentor claims <strong>zero</strong> intellectual property rights or ownership of your code.
          </p>
        </div>
      </section>

      {/* E. AI Features */}
      <section id="ai-features" className="scroll-mt-20 space-y-3">
        <div className="flex items-center gap-2 group">
          <h3 className="text-xl font-semibold text-white tracking-tight">
            E. AI Features &amp; Advisory Guidance
          </h3>
          <button
            type="button"
            onClick={() => scrollTo('ai-features')}
            className="text-[#8b949e] opacity-0 group-hover:opacity-100 hover:text-[#58a6ff] transition-opacity"
          >
            <LinkIcon size={15} />
          </button>
        </div>
        <p className="text-sm leading-relaxed text-[#c9d1d9]">
          RepoMentor produces automated architectural breakdowns and explanations to assist engineers. Generated descriptions are advisory engineering aids. You must independently verify all architecture recommendations, dependencies, and code patterns before production deployment.
        </p>
      </section>

      {/* F. GitHub API */}
      <section id="github-api" className="scroll-mt-20 space-y-3">
        <div className="flex items-center gap-2 group">
          <h3 className="text-xl font-semibold text-white tracking-tight">
            F. GitHub API Terms &amp; Rate Limits
          </h3>
          <button
            type="button"
            onClick={() => scrollTo('github-api')}
            className="text-[#8b949e] opacity-0 group-hover:opacity-100 hover:text-[#58a6ff] transition-opacity"
          >
            <LinkIcon size={15} />
          </button>
        </div>
        <p className="text-sm leading-relaxed text-[#c9d1d9]">
          RepoMentor relies on GitHub's public API to fetch repository trees and contents. Availability is subject to GitHub's uptime, rate limits, and service terms. RepoMentor is not liable for service interruptions caused by third-party API rate limiting or downtime.
        </p>
      </section>

      {/* G. Limitation of Liability */}
      <section id="liability" className="scroll-mt-20 space-y-3">
        <div className="flex items-center gap-2 group">
          <h3 className="text-xl font-semibold text-white tracking-tight">
            G. Limitation of Liability &amp; Disclaimers
          </h3>
          <button
            type="button"
            onClick={() => scrollTo('liability')}
            className="text-[#8b949e] opacity-0 group-hover:opacity-100 hover:text-[#58a6ff] transition-opacity"
          >
            <LinkIcon size={15} />
          </button>
        </div>
        <p className="text-xs uppercase font-mono text-[#8b949e] tracking-wider leading-relaxed">
          REPOMENTOR IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS WITHOUT WARRANTY OF ANY KIND. IN NO EVENT SHALL REPOMENTOR BE LIABLE FOR ANY CONSEQUENTIAL, INDIRECT, SPECIAL, OR INCIDENTAL DAMAGES ARISING FROM CODE INSPECTION OR WORKSPACE USAGE.
        </p>
      </section>

      {/* H. Changes & Termination */}
      <section id="changes" className="scroll-mt-20 space-y-3">
        <div className="flex items-center gap-2 group">
          <h3 className="text-xl font-semibold text-white tracking-tight">
            H. Changes &amp; Termination
          </h3>
          <button
            type="button"
            onClick={() => scrollTo('changes')}
            className="text-[#8b949e] opacity-0 group-hover:opacity-100 hover:text-[#58a6ff] transition-opacity"
          >
            <LinkIcon size={15} />
          </button>
        </div>
        <p className="text-sm leading-relaxed text-[#c9d1d9]">
          We reserve the right to amend these Terms of Service as our tools evolve. Continued use of RepoMentor after modifications constitutes acceptance. We may terminate or suspend access for violations of the Acceptable Use Policy.
        </p>
      </section>

      {/* I. Contact */}
      <section id="contact" className="scroll-mt-20 space-y-3 border-t border-[#30363d] pt-6">
        <div className="flex items-center gap-2 group">
          <h3 className="text-xl font-semibold text-white tracking-tight">
            I. Contact Information
          </h3>
          <button
            type="button"
            onClick={() => scrollTo('contact')}
            className="text-[#8b949e] opacity-0 group-hover:opacity-100 hover:text-[#58a6ff] transition-opacity"
          >
            <LinkIcon size={15} />
          </button>
        </div>
        <p className="text-sm leading-relaxed text-[#c9d1d9]">
          If you have questions or licensing inquiries regarding these terms:
        </p>
        <div className="text-sm font-mono text-[#58a6ff] space-y-1">
          <div>Email: <a href="mailto:legal@repomentor.dev" className="hover:underline">legal@repomentor.dev</a></div>
          <div className="text-xs text-[#8b949e]">RepoMentor Open Source Project</div>
        </div>
      </section>
    </div>
  )
}
