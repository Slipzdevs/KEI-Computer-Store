import {
  Box,
  Cable,
  Cpu,
  Headphones,
  Keyboard,
  Laptop,
  Monitor,
  PanelsTopLeft,
  type LucideIcon,
} from 'lucide-react'
import type { ProductCategory } from '../types/product'

export interface ShopCategory {
  slug: ProductCategory
  title: string
  description: string
  icon: LucideIcon
}

export const categories: ShopCategory[] = [
  { slug: 'laptops', title: 'Laptops', description: 'Portable work and play', icon: Laptop },
  { slug: 'desktop-computers', title: 'Desktop computers', description: 'Flexible setups for your desk', icon: PanelsTopLeft },
  { slug: 'pc-components', title: 'PC components', description: 'Parts for your next upgrade', icon: Cpu },
  { slug: 'monitors', title: 'Monitors', description: 'Find the right view', icon: Monitor },
  { slug: 'peripherals', title: 'Peripherals', description: 'Keyboards, mice, and more', icon: Keyboard },
  { slug: 'accessories', title: 'Accessories', description: 'Useful additions to your setup', icon: Cable },
  { slug: 'custom-pc-builds', title: 'Custom PC builds', description: 'Explore example build ideas', icon: Box },
]

export interface AudienceCard {
  audience: string
  title: string
  description: string
  category: ProductCategory
  imageUrl: string
  imageAlt: string
  imageCreditUrl: string
  icon: LucideIcon
}

const unsplash = 'https://images.unsplash.com'

export const audienceCards: AudienceCard[] = [
  {
    audience: 'For students',
    title: 'Ready for the next class.',
    description: 'Explore portable options for notes, research, and everyday study.',
    category: 'laptops',
    imageUrl: `${unsplash}/photo-1661006670127-b560e732ce28?auto=format&fit=crop&w=1000&q=85`,
    imageAlt: 'Open laptop on a clean desk',
    imageCreditUrl: 'https://unsplash.com/id/s/foto/macbook-air-m2',
    icon: Laptop,
  },
  {
    audience: 'For professionals',
    title: 'Make space for good work.',
    description: 'Build a comfortable workspace around the way you get things done.',
    category: 'monitors',
    imageUrl: `${unsplash}/photo-1636488363148-818c08eec89e?auto=format&fit=crop&w=1000&q=85`,
    imageAlt: 'Desktop workspace with a large display',
    imageCreditUrl: 'https://unsplash.com/photos/a-computer-desk-with-a-keyboard-mouse-and-monitor-98h_fVYjG-E',
    icon: Monitor,
  },
  {
    audience: 'For gamers',
    title: 'Build around your play.',
    description: 'Explore example systems, graphics, and accessories for a gaming setup.',
    category: 'custom-pc-builds',
    imageUrl: `${unsplash}/photo-1783783197323-31f5291db6f7?auto=format&fit=crop&w=1000&q=85`,
    imageAlt: 'Gaming desktop setup with a monitor and tower',
    imageCreditUrl: 'https://unsplash.com/photos/gaming-pc-setup-with-monitor-game-and-colorful-rgb-lighting-kb64bPss0do',
    icon: Headphones,
  },
]
