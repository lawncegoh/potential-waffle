"use client"
import { getReport, type RunRecord } from '@/shared/api'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useMemo } from 'react'
import ReactMarkdown from 'react-markdown'

export default function ReportPage({ params }: { params: { id: string } }) {
  const id = params.id
  const q = useQuery<RunRecord>({
    queryKey: ['report', id],
    queryFn: () => getReport(id),
    refetchInterval: (data) => (data && (data as any).status === 'done' || data && (data as any).status === 'error' ? false : 500),
  })
  const rec = q.data
  const pct = rec?.progress ?? 0
  return (
    <div className="container">
      <div className="row" style={{ justifyContent: 'space-between', marginTop: 12 }}>
        <div className="title">Report</div>
        <div className="muted">Run ID: {id}</div>
      </div>
      <div className="card" style={{ marginTop: 12 }}>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <div>Status: {rec?.status ?? 'loading'}</div>
          <div>{pct}%</div>
        </div>
        <div style={{ height: 8, background: '#e5e7eb', borderRadius: 8, overflow: 'hidden', marginTop: 6 }}>
          <div style={{ width: `${pct}%`, height: '100%', background: '#111827' }} />
        </div>
      </div>
      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', marginTop: 12 }}>
        <div className="card">
          <div className="title" style={{ fontSize: '1.125rem' }}>Report Markdown</div>
          <div style={{ marginTop: 8 }}>
            {rec?.markdown ? <ReactMarkdown>{rec.markdown}</ReactMarkdown> : <div className="muted">Awaiting completion…</div>}
          </div>
        </div>
        <div className="card">
          <div className="title" style={{ fontSize: '1.125rem' }}>Facts</div>
          <pre style={{ fontSize: 12, background: '#f9fafb', padding: 12, borderRadius: 8, overflow: 'auto' }}>
            {JSON.stringify(rec?.facts ?? {}, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  )
}
