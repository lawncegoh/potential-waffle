"use client"
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createReport } from '@/shared/api'

export default function HomePage() {
  const [q, setQ] = useState('Uniswap')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const { run_id } = await createReport(q)
      router.push(`/dd/${run_id}`)
    } finally {
      setLoading(false)
    }
  }
  return (
    <div className="container">
      <div className="card" style={{ marginTop: 24 }}>
        <div className="title" style={{ marginBottom: 8 }}>ChainSleuth</div>
        <p className="muted">Enter a crypto project name to generate a 60-second due diligence report.</p>
        <form onSubmit={onSubmit} className="row" style={{ marginTop: 12 }}>
          <input aria-label="Project name" value={q} onChange={(e) => setQ(e.target.value)} className="" style={{ flex: 1, padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: 8 }} />
          <button type="submit" disabled={loading} style={{ padding: '8px 14px', borderRadius: 8, background: '#111827', color: 'white', border: 0 }}>{loading ? 'Starting…' : 'Run'}</button>
        </form>
      </div>
    </div>
  )
}

