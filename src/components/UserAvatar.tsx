// /components/UserAvatar.tsx
// Componente reutilizable para mostrar avatar con foto o iniciales como fallback

import Image from 'next/image'

function getInitials(email: string): string {
  const name = email.split('@')[0]
  const parts = name.split(/[.\-_]/)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

type UserAvatarProps = {
  email: string
  avatarUrl?: string | null
  size?: 'xs' | 'sm' | 'md' | 'lg'
  className?: string
}

const SIZE_MAP = {
  xs: { container: 'w-6 h-6 text-[10px]', img: 24 },
  sm: { container: 'w-8 h-8 text-[11px]', img: 32 },
  md: { container: 'w-10 h-10 text-sm',   img: 40 },
  lg: { container: 'w-12 h-12 text-base',  img: 48 },
}

export function UserAvatar({ email, avatarUrl, size = 'sm', className = '' }: UserAvatarProps) {
  const { container, img } = SIZE_MAP[size]

  if (avatarUrl) {
    return (
      <div className={`${container} rounded-full overflow-hidden border border-zinc-600 shrink-0 ${className}`}>
        <Image
          src={avatarUrl}
          alt={email}
          width={img}
          height={img}
          className="w-full h-full object-cover"
          unoptimized
        />
      </div>
    )
  }

  return (
    <div className={`${container} rounded-full bg-zinc-700 border border-zinc-600 flex items-center justify-center font-semibold text-white select-none shrink-0 ${className}`}>
      {getInitials(email)}
    </div>
  )
}
