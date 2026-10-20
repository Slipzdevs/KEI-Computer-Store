import { store } from '../config/store'

export const formatMoney = (amount: number, currency = store.currency) => {
  return new Intl.NumberFormat(store.locale, { style: 'currency', currency, maximumFractionDigits: 2 }).format(amount)
}
