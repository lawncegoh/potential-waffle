"use client"
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createReportToken } from '@/shared/api'

export default function HomePage() {
  const [addr, setAddr] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    // Basic validation: EVM 0x...40 hex or Base58 (Solana-like) 32-44 chars
    const isEvm = /^0x[a-fA-F0-9]{40}$/.test(addr.trim())
    const isBase58 = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(addr.trim())
    if (!isEvm && !isBase58) {
      setError('Enter a valid token address (0x… or base58)')
      return
    }
    setLoading(true)
    try {
      const { run_id } = await createReportToken(addr.trim())
      router.push(`/dd/${run_id}`)
    } finally {
      setLoading(false)
    }
  }
  return (
    <div className="container">
      <div className="card" style={{ marginTop: 24 }}>
        <div className="title" style={{ marginBottom: 8 }}>ChainSleuth</div>
        <p className="muted">Enter a token contract address to generate a 60-second due diligence report.</p>
        <form onSubmit={onSubmit} className="row" style={{ marginTop: 12 }}>
          <input aria-label="Token address" placeholder="0x… or base58" value={addr} onChange={(e) => setAddr(e.target.value)} className="" style={{ flex: 1, padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: 8 }} />
          <button type="submit" disabled={loading} style={{ padding: '8px 14px', borderRadius: 8, background: '#111827', color: 'white', border: 0 }}>{loading ? 'Starting…' : 'Run'}</button>
        </form>
        {error ? <div className="muted" style={{ color: '#b91c1c', marginTop: 8 }}>{error}</div> : null}
      </div>
    </div>
  )
}
