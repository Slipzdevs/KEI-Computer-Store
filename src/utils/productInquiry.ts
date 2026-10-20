import type { Product } from '../types/product'

export interface InquiryLink { label: string; href: string }

export function createInquiryMessage(product: Product, origin: string) {
  return [
    `Hello, I would like to ask about the in-store availability of ${product.name}.`,
    `SKU: ${product.sku}`,
    `Product: ${origin.replace(/\/$/, '')}/products/${product.slug}`,
    'Please confirm current availability and price. This message does not reserve the product.',
  ].join('\n')
}

export function configuredInquiryLinks(message: string, contacts: { email: string; telegram: string; whatsapp: string; facebook?: string }): InquiryLink[] {
  const links: InquiryLink[] = []
  const email = contacts.email.trim()
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    const subject = encodeURIComponent('Product question')
    links.push({ label: 'Email inquiry', href: `mailto:${email}?subject=${subject}&body=${encodeURIComponent(message)}` })
  }
  const telegram = safeContactUrl(contacts.telegram, 't.me', /^\/[A-Za-z0-9_]{5,}$/)
  if (telegram) {
    telegram.searchParams.set('text', message)
    links.push({ label: 'Open Telegram', href: telegram.toString() })
  }
  const whatsapp = safeContactUrl(contacts.whatsapp, 'wa.me', /^\/[1-9]\d{6,14}$/)
  if (whatsapp) {
    whatsapp.searchParams.set('text', message)
    links.push({ label: 'Open WhatsApp', href: whatsapp.toString() })
  }
  const facebook = safeFacebookUrl(contacts.facebook ?? '')
  if (facebook) links.push({ label: 'Open Facebook', href: facebook.toString() })
  return links
}

export function validDirectionsUrl(raw: string, address: string): string | null {
  if (!address.trim()) return null
  try {
    const url = new URL(raw.trim())
    return url.protocol === 'https:' ? url.toString() : null
  } catch { return null }
}

export function validPhoneHref(phone: string): string | null {
  const normalized = phone.trim().replace(/[\s().-]/g, '')
  return /^\+?\d{7,15}$/.test(normalized) ? `tel:${normalized}` : null
}

function safeContactUrl(raw: string, hostname: string, validPath: RegExp): URL | null {
  try {
    const url = new URL(raw.trim())
    return url.protocol === 'https:' && url.hostname === hostname && validPath.test(url.pathname) ? url : null
  } catch {
    return null
  }
}

function safeFacebookUrl(raw: string): URL | null {
  try {
    const url = new URL(raw.trim())
    const validHost = url.hostname === 'facebook.com' || url.hostname === 'www.facebook.com'
    return url.protocol === 'https:' && validHost && /^\/[A-Za-z0-9._-]+\/?$/.test(url.pathname) ? url : null
  } catch { return null }
}
