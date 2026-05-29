import clsx from 'clsx'

const DEFAULT_AVATAR = (name) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'Player')}&background=00f5ff&color=0a0f1e&bold=true&size=128`

export function getAvatarUrl(user) {
  if (user?.avatar_url) return user.avatar_url
  return DEFAULT_AVATAR(user?.full_name || user?.username || 'P')
}

export default function Avatar({ user, size = 'lg', className }) {
  const sizes = {
    sm: 'w-10 h-10 text-sm',
    md: 'w-16 h-16 text-lg',
    lg: 'w-24 h-24 text-2xl',
    xl: 'w-28 h-28 text-3xl',
  }
  const src = getAvatarUrl(user)
  const label = user?.full_name || user?.username || '?'

  return (
    <img
      src={src}
      alt={label}
      className={clsx(
        'rounded-2xl object-cover border-2 border-neon-cyan/30 bg-slate-800',
        sizes[size],
        className,
      )}
      onError={(e) => {
        e.currentTarget.src = DEFAULT_AVATAR(label)
      }}
    />
  )
}
