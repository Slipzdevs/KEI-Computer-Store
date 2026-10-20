import { categories } from '../data/homepage'
import type { Product, ProductCategory } from '../types/product'

export const categoryLabel = (category: string) => categories.find((item) => item.slug === category)?.title ?? category.split('-').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(' ')
export const brandKey = (product: Product) => product.brandId ?? product.brand.toLowerCase().replace(/[^a-z0-9]+/g, '-')

export function filterAndSortProducts(products: Product[], params: URLSearchParams, categoryIds: string[] = categories.map(({ slug }) => slug)): Product[] {
  const allowedCategories = new Set(categoryIds)
  const category = params.get('category') as ProductCategory | null
  const query = params.get('search')?.trim().toLocaleLowerCase() ?? ''
  const brand = params.get('brand') ?? ''
  const min = parsePrice(params.get('min'))
  const max = parsePrice(params.get('max'))
  const stock = params.get('availability')
  const cpu = params.get('cpu')?.toLocaleLowerCase() ?? ''
  const gpu = params.get('gpu')?.toLocaleLowerCase() ?? ''
  const ram = parsePrice(params.get('ram'))
  const storage = parsePrice(params.get('storage'))
  const sort = params.get('sort')

  const filtered = products.filter((product) => {
    const text = [product.name, product.brand, product.category, product.sku, product.description, product.cpu, product.gpu, ...product.specifications, ...(product.technicalSpecifications ?? []).flatMap(({ label, value }) => [label, value])].join(' ').toLocaleLowerCase()
    if (category && allowedCategories.has(category) && product.category !== category) return false
    if (query && !text.includes(query)) return false
    if (brand && brandKey(product) !== brand) return false
    if (min !== undefined && (product.price == null || product.price < min)) return false
    if (max !== undefined && (product.price == null || product.price > max)) return false
    if (stock && product.availabilityStatus !== stock) return false
    if (cpu && !(product.cpu ?? '').toLocaleLowerCase().includes(cpu)) return false
    if (gpu && !(product.gpu ?? '').toLocaleLowerCase().includes(gpu)) return false
    if (ram !== undefined && (product.ramGb ?? 0) < ram) return false
    if (storage !== undefined && (product.storageGb ?? 0) < storage) return false
    return true
  })

  if (sort === 'price-asc') return filtered.sort((a, b) => (a.price ?? Number.MAX_VALUE) - (b.price ?? Number.MAX_VALUE))
  if (sort === 'price-desc') return filtered.sort((a, b) => (b.price ?? -1) - (a.price ?? -1))
  if (sort === 'newest') return filtered.sort((a, b) => Number(Boolean(b.newest)) - Number(Boolean(a.newest)) || b.id.localeCompare(a.id))
  if (sort === 'deals') return filtered.sort((a, b) => Number(Boolean(b.originalPrice)) - Number(Boolean(a.originalPrice)) || (a.price ?? Number.MAX_VALUE) - (b.price ?? Number.MAX_VALUE))
  return filtered.sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0) || a.name.localeCompare(b.name))
}

function parsePrice(value: string | null): number | undefined {
  if (!value || !/^\d+(\.\d{1,2})?$/.test(value)) return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}
