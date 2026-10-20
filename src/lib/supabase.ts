import { createClient } from '@supabase/supabase-js'
import { getSupabaseConfigurationMessage, isValidSupabasePublishableKey, isValidSupabaseProjectUrl, resolveCatalogMode } from '../utils/deploymentConfig'

const env = import.meta.env
export const catalogMode = resolveCatalogMode(env.VITE_CATALOG_MODE)
export const supabaseUrl = env.VITE_SUPABASE_URL?.trim() ?? ''
export const supabasePublishableKey = env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() ?? ''
const configurationMessage = getSupabaseConfigurationMessage(env.VITE_CATALOG_MODE, supabaseUrl, supabasePublishableKey)
const canInitializeSupabase = env.VITE_CATALOG_MODE?.trim() === 'supabase'
  && isValidSupabaseProjectUrl(supabaseUrl)
  && isValidSupabasePublishableKey(supabasePublishableKey)

let client: ReturnType<typeof createClient<any>> | null = null
if (canInitializeSupabase) {
  try {
    client = createClient(supabaseUrl, supabasePublishableKey, {
      auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true },
    })
  } catch {
    client = null
  }
}

export const supabase = client
export const supabaseConfigured = Boolean(supabase)
export const supabaseConfigurationMessage = configurationMessage || (canInitializeSupabase && !supabase
  ? 'Supabase could not be initialized. Check the configured project URL and publishable key.'
  : '')
