import { env } from '@/shared/config/env'
import { http } from '@/shared/lib/api'
import type {
  Contractor,
  ContractorReview,
  Invitation,
  ProjectBrief,
  SurveyBooking,
  SurveyRequest,
  SurveySlot
} from '../types/contractor.types'
import { mockContractorsApi } from './contractors.mock'

/** Dữ liệu ghi xuống khi lưu Bước 1 (S10). */
export type SaveBriefPayload = Omit<ProjectBrief, 'id' | 'createdAt' | 'updatedAt' | 'status'>

/** Kết quả màn "Đã gửi lời mời" (S17) — một yêu cầu, tối đa 3 lời mời (R1). */
export interface SurveyRequestDetail {
  request: SurveyRequest
  invitations: Invitation[]
}

/**
 * Contractors API surface (S09–S18). Endpoint paths là placeholder cho tới khi
 * controller .NET tương ứng có thật.
 */
const ContractorsApi = {
  listContractors: (projectId: string) => http.get<Contractor[]>(`/projects/${projectId}/contractors`),
  getContractor: (contractorId: string) => http.get<Contractor>(`/contractors/${contractorId}`),

  createBrief: () => http.post<ProjectBrief>('/project-briefs', {}),
  getBrief: (projectId: string) => http.get<ProjectBrief>(`/project-briefs/${projectId}`),
  saveBrief: (projectId: string, payload: SaveBriefPayload) =>
    http.put<ProjectBrief>(`/project-briefs/${projectId}`, payload),
  completeBrief: (projectId: string) => http.post<ProjectBrief>(`/project-briefs/${projectId}/complete`, {}),

  listSlots: (contractorId: string, date: string) =>
    http.get<SurveySlot[]>(`/contractors/${contractorId}/slots`, { params: { date } }),

  listInvitations: (projectId: string) => http.get<Invitation[]>(`/projects/${projectId}/invitations`),

  listReviews: (projectId: string) => http.get<ContractorReview[]>(`/projects/${projectId}/contractor-reviews`),
  submitReview: (invitationId: string, rating: number, comment: string) =>
    http.post<ContractorReview>(`/invitations/${invitationId}/review`, { rating, comment }),
  createInvitations: (projectId: string, bookings: SurveyBooking[]) =>
    http.post<SurveyRequestDetail>(`/projects/${projectId}/invitations`, { bookings }),
  getSurveyRequest: (requestId: string) => http.get<SurveyRequestDetail>(`/survey-requests/${requestId}`)
}

export const contractorsApi = env.NEXT_PUBLIC_USE_MOCK_API ? mockContractorsApi : ContractorsApi
