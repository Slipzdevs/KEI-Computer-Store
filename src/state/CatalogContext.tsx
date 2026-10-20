import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { catalogService, CatalogServiceError } from '../services/catalog'
import type { Category, Product } from '../types/product'
import { getCatalogMode } from '../services/catalog'

interface CatalogState {
  mode: 'demo' | 'supabase'
  products: Product[]
  categories: Category[]
  loading: boolean
  error: string
  refresh: () => Promise<void>
}

const CatalogContext = createContext<CatalogState | null>(null)

export function CatalogProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [nextProducts, nextCategories] = await Promise.all([catalogService.listPublicProducts(), catalogService.listCategories()])
      setProducts(nextProducts)
      setCategories(nextCategories)
    } catch (cause) {
      setProducts([])
      setCategories([])
      setError(cause instanceof CatalogServiceError ? cause.message : 'The catalog could not be loaded. Check your connection and try again.')
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { void refresh() }, [refresh])
  return <CatalogContext.Provider value={{ mode: getCatalogMode(), products, categories, loading, error, refresh }}>{children}</CatalogContext.Provider>
}

export function useCatalog() {
  const value = useContext(CatalogContext)
  if (!value) throw new Error('useCatalog must be used inside CatalogProvider')
  return value
}
