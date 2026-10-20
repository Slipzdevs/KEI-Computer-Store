import { useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import { imageDisplayState } from '../utils/catalogIntegrity'

interface ImageWithFallbackProps {
  src: string
  alt: string
  className: string
  fallbackIcon: LucideIcon
  loading?: 'eager' | 'lazy'
}

export function ImageWithFallback({ src, alt, className, fallbackIcon: FallbackIcon, loading = 'lazy' }: ImageWithFallbackProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null)

  if (imageDisplayState(src, failedSrc) === 'fallback') {
    return <div className={`${className} image-fallback`} role="img" aria-label={alt}><FallbackIcon size={42} strokeWidth={1.35} aria-hidden="true" /></div>
  }

  return <img className={className} src={src} alt={alt} loading={loading} decoding="async" onError={() => setFailedSrc(src)} />
}
