export function RepoMentorLogo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5 font-mono text-sm tracking-tight select-none">
      <span className="w-6 h-6 rounded-[3px] bg-white text-zinc-950 font-bold flex items-center justify-center text-xs shadow-sm font-mono tracking-tighter">
        RM
      </span>
      {!compact && (
        <span className="font-heading font-semibold text-white tracking-tight text-sm">
          RepoMentor
        </span>
      )}
    </span>
  )
}
