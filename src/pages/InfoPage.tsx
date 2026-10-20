import { ArrowLeft, CircleHelp } from 'lucide-react'
import { Link } from 'react-router-dom'

export interface InfoPageContent {
  title: string
  description: string
  isConfigured?: boolean
}

export function InfoPage({ title, description, isConfigured = false }: InfoPageContent) {
  return (
    <main className="page-wrap info-placeholder-page">
      <span className="info-placeholder-icon"><CircleHelp size={23} /></span>
      <p className="eyebrow">Information page</p>
      <h1>{title}</h1>
      <p>{description}</p>
      {!isConfigured && <div className="info-placeholder-note">This page needs content approved by KEI Computer Store before it can provide store-specific guidance.</div>}
      <Link className="button button-primary" to="/"><ArrowLeft size={16} /> Back to home</Link>
    </main>
  )
}
