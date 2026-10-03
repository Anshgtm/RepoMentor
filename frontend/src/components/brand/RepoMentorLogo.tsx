export function RepoMentorLogo({ compact = false }: { compact?: boolean }) {
  return <span className={`repomentor-logo ${compact ? 'is-compact' : ''}`} aria-label="RepoMentor" role="img">
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <rect x="1" y="1" width="46" height="46" rx="11" className="logo-frame" />
      <path d="M13 14h13.5a7.5 7.5 0 0 1 0 15H13V14Zm0 15 11 10" className="logo-path" />
      <path d="M30 17h5m-5 8h5m-5 8h5" className="logo-lines" />
      <circle cx="35" cy="17" r="2" className="logo-dot" />
    </svg>
    {!compact && <span className="repomentor-wordmark">RepoMentor</span>}
  </span>
}
