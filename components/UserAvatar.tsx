'use client'

import { useState } from 'react'

interface UserAvatarProps {
  avatarUrl: string | null
  fullName: string | null
  email: string | null
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export default function UserAvatar({ 
  avatarUrl, 
  fullName, 
  email, 
  size = 'md',
  className = '' 
}: UserAvatarProps) {
  const [imageError, setImageError] = useState(false)

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-16 w-16 text-lg',
    lg: 'h-24 w-24 text-2xl'
  }

  return (
    <div className={`rounded-full overflow-hidden bg-white/20 border-4 border-white/30 ${sizeClasses[size]} ${className}`}>
      {avatarUrl && !imageError ? (
        <img
          src={avatarUrl}
          alt={fullName || 'Profile'}
          className="h-full w-full object-cover"
          onError={() => setImageError(true)}
          onLoad={() => console.log('Profile avatar loaded successfully for:', fullName)}
        />
      ) : (
        <div className="h-full w-full bg-white/30 flex items-center justify-center text-white font-bold">
          {fullName ? 
            getInitials(fullName) : 
            email?.[0]?.toUpperCase() || 'U'
          }
        </div>
      )}
    </div>
  )
}
