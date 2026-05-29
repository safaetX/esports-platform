import clsx from 'clsx'

export function Spinner({ size = 'md' }) {
  const s = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-10 h-10' : 'w-6 h-6'
  return (
    <div className={clsx('border-2 border-slate-600 border-t-neon-cyan rounded-full animate-spin', s)} />
  )
}

export function LoadingState({ label = 'Loading…' }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <Spinner size="lg" />
      <p className="text-slate-500 font-display text-sm">{label}</p>
    </div>
  )
}

export function EmptyState({ icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon && <div className="text-5xl mb-4">{icon}</div>}
      <h3 className="font-display font-700 text-slate-900 dark:text-white text-lg mb-1">{title}</h3>
      {description && <p className="text-slate-500 text-sm mb-4 max-w-xs">{description}</p>}
      {action}
    </div>
  )
}

export function Modal({ open, onClose, title, children }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative card-glow w-full max-w-md animate-slide-up">
        <div className="flex items-center justify-between p-5 border-b border-slate-700/50">
          <h2 className="font-display font-700 text-slate-900 dark:text-white text-lg">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl leading-none">×</button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

export function StatusBadge({ status }) {
  if (status === 'upcoming')    return <span className="badge-cyan">⏳ Upcoming</span>
  if (status === 'completed')   return <span className="badge-green">✅ Completed</span>
  if (status === 'pending')     return <span className="badge-slate">⏸ Pending</span>
  if (status === 'registered')  return <span className="badge-cyan">📝 Registered</span>
  if (status === 'confirmed')   return <span className="badge-green">✅ Confirmed</span>
  if (status === 'withdrawn')   return <span className="badge-pink">↩ Withdrawn</span>
  if (status === 'accepted')    return <span className="badge-green">✅ Accepted</span>
  if (status === 'rejected')    return <span className="badge-pink">❌ Rejected</span>
  return <span className="badge-slate">{status}</span>
}

export function GameBadge({ game }) {
  if (!game) return null
  return (
    <span className="badge-purple">
      {game.icon || '🎮'} {game.name}
    </span>
  )
}

export function Alert({ type = 'error', message }) {
  if (!message) return null
  const cls = type === 'error'
    ? 'bg-neon-pink/10 border-neon-pink/30 text-neon-pink'
    : 'bg-neon-green/10 border-neon-green/30 text-neon-green'
  return <div className={clsx('border rounded-lg px-4 py-3 text-sm font-display', cls)}>{message}</div>
}

export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="section-title">{title}</h1>
        {subtitle && <p className="text-slate-400 text-sm mt-1">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

export function Skeleton({ className }) {
  return (
    <div className={clsx('animate-pulse rounded-lg bg-slate-700/50 dark:bg-slate-700/50 bg-slate-200', className)} />
  )
}

export function SkeletonCard() {
  return (
    <div className="card p-5 space-y-3">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-8 w-1/2" />
      <Skeleton className="h-3 w-full" />
    </div>
  )
}

export function StatCard({ label, value, icon, color = 'cyan' }) {
  const colors = {
    cyan:   'from-neon-cyan/20 to-transparent border-neon-cyan/20 text-neon-cyan',
    green:  'from-neon-green/20 to-transparent border-neon-green/20 text-neon-green',
    purple: 'from-neon-purple/20 to-transparent border-neon-purple/20 text-neon-purple',
    pink:   'from-neon-pink/20 to-transparent border-neon-pink/20 text-neon-pink',
  }
  return (
    <div className={clsx('card p-5 bg-gradient-to-br', colors[color])}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-slate-400 text-sm font-display">{label}</span>
        <span className="text-2xl">{icon}</span>
      </div>
      <div className={clsx('text-3xl font-display font-800', colors[color].split(' ').pop())}>{value}</div>
    </div>
  )
}