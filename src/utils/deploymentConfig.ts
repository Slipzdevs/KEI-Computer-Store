export type CatalogMode = 'demo' | 'supabase'

export function resolveCatalogMode(value: string | undefined): CatalogMode {
  return value?.trim() === 'demo' ? 'demo' : 'supabase'
}

export function isValidSupabaseProjectUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return (url.protocol === 'https:' || url.protocol === 'http:')
      && Boolean(url.hostname)
      && !url.username
      && !url.password
      && !url.search
      && !url.hash
  } catch {
    return false
  }
}

export function isValidSupabasePublishableKey(value: string): boolean {
  if (/^sb_publishable_[A-Za-z0-9_-]+$/.test(value)) return true
  if (!/^eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(value)) return false

  try {
    const payload = JSON.parse(atob(value.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
    return payload.role === 'anon'
  } catch {
    return false
  }
}

export function getSupabaseConfigurationMessage(mode: string | undefined, url: string, key: string): string {
  if (mode?.trim() === 'demo') return ''
  if (mode?.trim() !== 'supabase') {
    return 'VITE_CATALOG_MODE is missing or invalid. Set it to supabase for the shared catalog, or explicitly set demo for a local demo.'
  }
  if (!url) return 'Supabase mode is selected, but VITE_SUPABASE_URL is missing.'
  if (!isValidSupabaseProjectUrl(url)) return 'VITE_SUPABASE_URL must be a valid HTTP or HTTPS project URL.'
  if (!key) return 'Supabase mode is selected, but VITE_SUPABASE_PUBLISHABLE_KEY is missing.'
  if (!isValidSupabasePublishableKey(key)) return 'VITE_SUPABASE_PUBLISHABLE_KEY is not a recognized publishable key.'
  return ''
}
