export interface StoreConfig {
  name: string
  monogram: string
  currency: string
  locale: string
  announcement: string
  supportEmail: string
  supportPhone: string
  address: string
  openingHours: string
  directionsUrl: string
  policies: { shipping: string; returns: string; faq: string; warranty: string }
  socialLinks: {
    telegram: string
    facebook: string
    whatsapp: string
  }
}

export const store: StoreConfig = {
  name: 'KEI Computer Store',
  monogram: 'K',
  currency: 'USD',
  locale: 'en-US',
  announcement: 'Browse computers, components, and accessories for your next setup.',
  supportEmail: '',
  supportPhone: '',
  address: '',
  openingHours: '',
  directionsUrl: '',
  policies: { shipping: '', returns: '', faq: '', warranty: '' },
  socialLinks: {
    telegram: '',
    facebook: '',
    whatsapp: '',
  },
}
