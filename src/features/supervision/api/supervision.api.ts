import { env } from '@/shared/config/env'
import { http } from '@/shared/lib/api'
import type { StageKey, StageUploadPayload, SupervisionProject } from '../types/supervision.types'
import { mockSupervisionApi } from './supervision.mock'

/**
 * Supervision API surface (S20–S23). Endpoint là placeholder tới khi controller
 * .NET có thật.
 *
 * Không có hàm nào cho phép SỬA hồ sơ đã xác nhận: mọi thay đổi sau khi khóa đi
 * qua `createChangeRequest` / `decideChangeRequest` (R5).
 */
const SupervisionApi = {
  getProject: (projectId: string) => http.get<SupervisionProject>(`/projects/${projectId}/supervision`),
  uploadStage: (projectId: string, payload: StageUploadPayload) =>
    http.post<SupervisionProject>(`/projects/${projectId}/supervision/stages/${payload.stageKey}/files`, payload),
  addComment: (projectId: string, stageKey: StageKey, text: string) =>
    http.post<SupervisionProject>(`/projects/${projectId}/supervision/stages/${stageKey}/comments`, { text }),
  decideChangeRequest: (projectId: string, stageKey: StageKey, changeRequestId: string, approve: boolean) =>
    http.post<SupervisionProject>(
      `/projects/${projectId}/supervision/stages/${stageKey}/change-requests/${changeRequestId}`,
      { approve }
    ),
  createChangeRequest: (projectId: string, stageKey: StageKey, reason: string) =>
    http.post<SupervisionProject>(`/projects/${projectId}/supervision/stages/${stageKey}/change-requests`, { reason })
}

export const supervisionApi = env.NEXT_PUBLIC_USE_MOCK_API ? mockSupervisionApi : SupervisionApi
