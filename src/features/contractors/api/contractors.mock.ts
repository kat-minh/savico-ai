import { mockDelay } from '@/shared/lib/mock'
import { MAX_INVITATIONS, SURVEY_SLOTS } from '../constants/contractors.constants'
import { emptyBrief } from '../services/brief.service'
import type {
  Contractor,
  Invitation,
  InvitationStatus,
  ProjectBrief,
  SurveyBooking,
  SurveyRequest,
  SurveySlot
} from '../types/contractor.types'
import type { SaveBriefPayload, SurveyRequestDetail } from './contractors.api'
import { CONTRACTORS_SEED } from './contractors.seed'

/**
 * Mock trong trình duyệt của luồng Tìm nhà thầu (S09–S18), bật bằng
 * `NEXT_PUBLIC_USE_MOCK_API=true`.
 *
 * Giống mock của luồng thiết kế, dữ liệu nằm ở `localStorage` chứ không phải bộ
 * nhớ tab: hồ sơ dự án là việc kéo dài nhiều phiên (lưu nháp rồi quay lại — S10),
 * còn lời mời thì phải sống đủ lâu để thấy ô đếm "Đã mời x/3" (R1) hoạt động.
 */
const STORE_KEY = 'savico.mock-contractors'

interface MockStore {
  sequence: number
  invitationSequence: number
  requestSequence: number
  briefs: Record<string, ProjectBrief>
  invitations: Record<string, Invitation[]>
  requests: Record<string, SurveyRequest>
}

const emptyStore = (): MockStore => ({
  sequence: 0,
  invitationSequence: 141,
  requestSequence: 141,
  briefs: {},
  invitations: {},
  requests: {}
})

function loadStore(): MockStore {
  if (typeof window === 'undefined') return emptyStore()
  try {
    const raw = window.localStorage.getItem(STORE_KEY)
    return raw ? { ...emptyStore(), ...(JSON.parse(raw) as MockStore) } : emptyStore()
  } catch {
    return emptyStore()
  }
}

function saveStore(store: MockStore): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORE_KEY, JSON.stringify(store))
}

/** Mã dự án `SVC-YYYY-NNNN` — cùng quy ước với luồng thiết kế. */
function nextProjectId(store: MockStore): string {
  store.sequence += 1
  return `SVC-${new Date().getFullYear()}-${String(store.sequence).padStart(4, '0')}`
}

/** Mã lời mời `INV-YYYY-NNNN` hiện trên mỗi thẻ ở S18. */
function nextInvitationId(store: MockStore): string {
  store.invitationSequence += 1
  return `INV-${new Date().getFullYear()}-${String(store.invitationSequence).padStart(4, '0')}`
}

/** Mã yêu cầu khảo sát `KS-YYYY-NNNN` hiện ở S17. */
function nextRequestId(store: MockStore): string {
  store.requestSequence += 1
  return `KS-${new Date().getFullYear()}-${String(store.requestSequence).padStart(4, '0')}`
}

function notFound(what: string): never {
  throw new Error(`Mock: không tìm thấy ${what}`)
}

/**
 * Lời mời vừa gửi luôn ở nấc đầu tiên. Ba nấc sau do đội hỗ trợ SAVICO cập nhật
 * trong khu quản trị (R4) nên mock KHÔNG tự đẩy trạng thái theo thời gian — làm
 * vậy sẽ dựng ra một luồng tự động không tồn tại trong sản phẩm thật.
 */
function initialSteps(sentAt: string): Invitation['steps'] {
  return [{ status: 'sent' as InvitationStatus, at: sentAt }]
}

export const mockContractorsApi = {
  listContractors: async (_projectId: string): Promise<Contractor[]> => {
    await mockDelay(250)
    return [...CONTRACTORS_SEED]
  },

  getContractor: async (contractorId: string): Promise<Contractor> => {
    await mockDelay(200)
    return CONTRACTORS_SEED.find((c) => c.id === contractorId) ?? notFound(`nhà thầu ${contractorId}`)
  },

  createBrief: async (): Promise<ProjectBrief> => {
    await mockDelay(200)
    const store = loadStore()
    const now = new Date().toISOString()
    const brief: ProjectBrief = {
      ...emptyBrief(),
      id: nextProjectId(store),
      status: 'draft',
      createdAt: now,
      updatedAt: now
    }
    store.briefs[brief.id] = brief
    saveStore(store)
    return brief
  },

  getBrief: async (projectId: string): Promise<ProjectBrief> => {
    await mockDelay(150)
    return loadStore().briefs[projectId] ?? notFound(`hồ sơ dự án ${projectId}`)
  },

  saveBrief: async (projectId: string, payload: SaveBriefPayload): Promise<ProjectBrief> => {
    await mockDelay(250)
    const store = loadStore()
    const current = store.briefs[projectId] ?? notFound(`hồ sơ dự án ${projectId}`)
    const updated: ProjectBrief = { ...current, ...payload, updatedAt: new Date().toISOString() }
    store.briefs[projectId] = updated
    saveStore(store)
    return updated
  },

  completeBrief: async (projectId: string): Promise<ProjectBrief> => {
    await mockDelay(250)
    const store = loadStore()
    const current = store.briefs[projectId] ?? notFound(`hồ sơ dự án ${projectId}`)
    const updated: ProjectBrief = { ...current, status: 'ready', updatedAt: new Date().toISOString() }
    store.briefs[projectId] = updated
    saveStore(store)
    return updated
  },

  listSlots: async (contractorId: string, date: string): Promise<SurveySlot[]> => {
    await mockDelay(150)
    // Vài khung bận cố định theo cặp (nhà thầu, ngày) để lịch trông thật mà vẫn
    // ổn định giữa các lần render — random sẽ nhảy mỗi lần refetch.
    const seed = [...`${contractorId}${date}`].reduce((sum, char) => sum + char.charCodeAt(0), 0)
    return SURVEY_SLOTS.map((label, index) => ({
      id: `slot-${index}`,
      label,
      available: (seed + index * 7) % 5 !== 0
    }))
  },

  listInvitations: async (projectId: string): Promise<Invitation[]> => {
    await mockDelay(200)
    return loadStore().invitations[projectId] ?? []
  },

  createInvitations: async (projectId: string, bookings: SurveyBooking[]): Promise<SurveyRequestDetail> => {
    await mockDelay(400)
    const store = loadStore()
    const existing = store.invitations[projectId] ?? []

    // R1 — chặn ở lớp dữ liệu chứ không chỉ ở nút bấm: mở hai tab rồi mời song
    // song vẫn không vượt được 3 lời mời.
    const room = MAX_INVITATIONS - existing.length
    if (room <= 0) throw new Error('Mock: dự án đã đủ 3 lời mời')

    const sentAt = new Date().toISOString()
    const created = bookings.slice(0, room).map<Invitation>((booking) => ({
      id: nextInvitationId(store),
      projectId,
      contractorId: booking.contractorId,
      sentAt,
      status: 'sent',
      updatedAt: sentAt,
      steps: initialSteps(sentAt),
      dossierVersion: 'v1',
      fileCount: store.briefs[projectId]?.documents.length ?? 0,
      survey: booking
    }))

    const request: SurveyRequest = {
      id: nextRequestId(store),
      projectId,
      createdAt: sentAt,
      invitationIds: created.map((invitation) => invitation.id)
    }

    store.invitations[projectId] = [...existing, ...created]
    store.requests[request.id] = request
    const brief = store.briefs[projectId]
    if (brief) store.briefs[projectId] = { ...brief, status: 'inviting' }
    saveStore(store)

    return { request, invitations: created }
  },

  getSurveyRequest: async (requestId: string): Promise<SurveyRequestDetail> => {
    await mockDelay(200)
    const store = loadStore()
    const request = store.requests[requestId] ?? notFound(`yêu cầu khảo sát ${requestId}`)
    const all = store.invitations[request.projectId] ?? []
    return { request, invitations: all.filter((invitation) => request.invitationIds.includes(invitation.id)) }
  }
}
