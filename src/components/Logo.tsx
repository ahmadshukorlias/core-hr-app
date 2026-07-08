import Image from 'next/image'

export function Logo({ variant = 'full' }: { variant?: 'full' | 'icon' }) {
  if (variant === 'icon') {
    return <Image src="/logo-icon.png" alt="Synergy Solutions" width={36} height={36} priority />
  }
  return <Image src="/logo-full.png" alt="Synergy Solutions" width={180} height={122} priority />
}