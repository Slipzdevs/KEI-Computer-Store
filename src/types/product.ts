export type ProductCategory =
  | 'laptops'
  | 'desktop-computers'
  | 'pc-components'
  | 'monitors'
  | 'peripherals'
  | 'accessories'
  | 'custom-pc-builds'

export type ProductCondition = 'new_sealed' | 'new_open_box' | 'used' | 'refurbished'
export type AvailabilityStatus = 'in_stock' | 'out_of_stock' | 'check_at_store'
export type PublicationStatus = 'draft' | 'published' | 'archived'
export type FeaturedCollection = 'new-arrivals' | 'best-sellers' | 'deals'

export interface ProductSpecification { label: string; value: string }
export interface ProductImage {
  id: string
  productId: string
  storagePath: string
  altText: string
  sortOrder: number
  publicUrl: string
}

export interface Product {
  id: string
  slug: string
  name: string
  sku: string
  brand: string
  brandId?: string
  model: string
  category: string
  categoryId: string | null
  price: number | null
  currency: string
  description: string
  imageUrl: string
  imageAlt: string
  imageCredit?: string
  imageCreditUrl?: string
  images: ProductImage[]
  condition: ProductCondition | null
  availabilityStatus: AvailabilityStatus | null
  publicationStatus: PublicationStatus
  specifications: string[]
  technicalSpecifications: ProductSpecification[]
  includedAccessories: string[]
  warrantyDetails: string
  conditionNotes: string
  knownDefects: string
  updatedAt: string | null
  isFeatured: boolean
  originalPrice?: number
  cpu?: string
  gpu?: string
  ramGb?: number
  storageGb?: number
  newest?: boolean
  popularity?: number
  featuredIn: FeaturedCollection[]
}

export interface Category {
  id: string
  slug: string
  name: string
  description: string
  isActive: boolean
  updatedAt: string | null
}

export interface ProductDraft {
  name: string
  slug: string
  sku: string
  brand: string
  model: string
  categoryId: string | null
  condition: ProductCondition | null
  description: string
  price: number | null
  currency: string
  availabilityStatus: AvailabilityStatus | null
  specifications: ProductSpecification[]
  includedAccessories: string[]
  warrantyDetails: string
  conditionNotes: string
  knownDefects: string
  publicationStatus: PublicationStatus
  isFeatured: boolean
}

export interface ProductFilters {
  search: string
  categoryId: string
  condition: string
  availability: string
  publicationStatus: string
}
