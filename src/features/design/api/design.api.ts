import { env } from '@/shared/config/env'
import { http } from '@/shared/lib/api'
import type { DesignInput, Dossier, EstimateResult, Project, SharedDossier } from '../types/design.types'
import { mockDesignApi } from './design.mock'

export interface CreateProjectPayload {
  name: string
  description?: string
}

/**
 * Design-flow API surface. Thin functions over the shared HTTP client.
 * Endpoint paths are placeholders until the .NET controllers are published.
 *
 * Set `NEXT_PUBLIC_USE_MOCK_API=true` to route these through an in-browser mock.
 */
const DesignApi = {
  listProjects: () => http.get<Project[]>('/projects'),

  createProject: (payload: CreateProjectPayload) => http.post<Project>('/projects', payload),

  getProject: (projectId: string) => http.get<Project>(`/projects/${projectId}`),

  getInput: (projectId: string) => http.get<DesignInput>(`/projects/${projectId}/input`),

  saveInput: (projectId: string, input: DesignInput) => http.put<DesignInput>(`/projects/${projectId}/input`, input),

  /** Kicks off Bước 2 — AI phân tích và lập dự toán. */
  generateEstimate: (projectId: string) => http.post<EstimateResult>(`/projects/${projectId}/estimate`),

  getEstimate: (projectId: string) => http.get<EstimateResult>(`/projects/${projectId}/estimate`),

  /** Kicks off Bước 3 — render bộ hồ sơ thi công. */
  renderDossier: (projectId: string) => http.post<Dossier>(`/projects/${projectId}/dossier`),

  getDossier: (projectId: string) => http.get<Dossier>(`/projects/${projectId}/dossier`),

  /** Tạo link chia sẻ xem online không cần đăng nhập (mục III.4c). */
  createShareLink: (projectId: string) => http.post<{ token: string }>(`/projects/${projectId}/dossier/share`),

  sendDossierEmail: (projectId: string, email: string) =>
    http.post<void>(`/projects/${projectId}/dossier/email`, { email }),

  /** Xem hồ sơ qua link chia sẻ — không cần đăng nhập (mục III.4c). */
  getSharedDossier: (token: string) => http.get<SharedDossier | null>(`/share/${token}`)
}

export const designApi = env.NEXT_PUBLIC_USE_MOCK_API ? mockDesignApi : DesignApi
