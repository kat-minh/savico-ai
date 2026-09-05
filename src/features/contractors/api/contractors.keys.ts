/** Query-key factory cho feature `contractors` (S09–S18). */
export const contractorKeys = {
  all: ['contractors'] as const,

  /** Danh sách nhà thầu đề xuất cho một dự án (S12). */
  list: (projectId: string) => [...contractorKeys.all, 'list', projectId] as const,
  /** Hồ sơ một nhà thầu (S13, S14). */
  detail: (contractorId: string) => [...contractorKeys.all, 'detail', contractorId] as const,

  briefs: () => [...contractorKeys.all, 'brief'] as const,
  /** Hồ sơ dự án đang dựng / đã lưu (S10, S11). */
  brief: (projectId: string) => [...contractorKeys.briefs(), projectId] as const,

  invitations: () => [...contractorKeys.all, 'invitations'] as const,
  /** Lời mời báo giá đã gửi của một dự án (S18). */
  invitationList: (projectId: string) => [...contractorKeys.invitations(), projectId] as const,
  /** Đánh giá nhà thầu của một dự án — mở form ở S18 sau khi lời mời hoàn tất. */
  reviewList: (projectId: string) => [...contractorKeys.all, 'reviews', projectId] as const,
  /** Một yêu cầu khảo sát vừa gửi (S17). */
  surveyRequest: (requestId: string) => [...contractorKeys.all, 'survey-request', requestId] as const,
  /** Khung giờ còn trống của một nhà thầu trong một ngày (S16). */
  slots: (contractorId: string, date: string) => [...contractorKeys.all, 'slots', contractorId, date] as const
} as const
