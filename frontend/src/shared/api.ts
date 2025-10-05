import { BACKEND_URL } from '@/shared/config'

export type CreateReportReq = { project_name: string }
export type CreateReportResp = { run_id: string }

export type RunRecord = {
  id: string
  project: string
  status: 'queued' | 'running' | 'done' | 'error'
  progress: number
  started_at: number
  finished_at?: number
  markdown?: string
  facts?: any
  error?: string
}

export async function createReport(projectName: string): Promise<CreateReportResp> {
  const res = await fetch(`${BACKEND_URL}/report`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ project_name: projectName } satisfies CreateReportReq),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function getReport(id: string): Promise<RunRecord> {
  const res = await fetch(`${BACKEND_URL}/report/${id}`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

