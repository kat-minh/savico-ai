import { STAGE_COUNT } from '../constants/supervision.constants'
import type { StageStatus, SupervisionProject, SupervisionStage } from '../types/supervision.types'

/**
 * Logic thuần của bảng điều khiển giám sát — không React, không HTTP.
 *
 * Mọi con số hiện trên màn (%, "còn X ngày", "sớm hơn kế hoạch", lượt kiểm tra)
 * tính ở đây để banner đầu trang, thẻ dự án, sợi chỉ tiến độ và thẻ ở trang Tài
 * khoản không bao giờ nói ba con số khác nhau về cùng một dự án.
 */

/** Số ngày còn lại tới `date`; số âm là đã quá hạn. */
export function daysUntil(date: string): number {
  const target = new Date(date)
  target.setHours(0, 0, 0, 0)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.round((target.getTime() - today.getTime()) / 86_400_000)
}

/** Giai đoạn đã xác nhận = đã xong. Đang thực hiện chưa tính là xong. */
export function confirmedCount(project: SupervisionProject): number {
  return project.stages.filter((stage) => stage.status === 'confirmed').length
}

/** % tiến độ theo số giai đoạn đã xác nhận trên 6. */
export function progressPercent(project: SupervisionProject): number {
  return Math.round((confirmedCount(project) / STAGE_COUNT) * 100)
}

/**
 * % thời gian đã trôi giữa ngày kích hoạt và ngày bàn giao dự kiến — vạch cam
 * trên thanh tiến độ. Đặt cạnh % công việc để thấy ngay đang sớm hay muộn.
 */
export function elapsedPercent(project: SupervisionProject): number {
  const start = new Date(project.activatedAt).getTime()
  const end = new Date(project.handoverDate).getTime()
  if (end <= start) return 100
  const ratio = (Date.now() - start) / (end - start)
  return Math.min(100, Math.max(0, Math.round(ratio * 100)))
}

/** Giai đoạn đang thực hiện; hết rồi thì lấy giai đoạn cuối. */
export function currentStage(project: SupervisionProject): SupervisionStage {
  const running = project.stages.find((stage) => stage.status === 'inProgress')
  if (running) return running
  const upcoming = project.stages.find((stage) => stage.status === 'upcoming')
  return running ?? upcoming ?? (project.stages[project.stages.length - 1] as SupervisionStage)
}

/** Giai đoạn đang có yêu cầu sửa đổi chờ chính khách duyệt (S22). */
export function stageAwaitingCustomer(project: SupervisionProject): SupervisionStage | undefined {
  return project.stages.find((stage) =>
    stage.changeRequests.some((request) => request.status === 'pending' && request.by === 'GS')
  )
}

/** Giai đoạn này có gì đang chờ chính khách duyệt không — tag "Cần bạn duyệt". */
export function needsCustomerApproval(stage: SupervisionStage): boolean {
  return stage.changeRequests.some((request) => request.status === 'pending' && request.by === 'GS')
}

/** Hồ sơ giai đoạn đã khóa chưa (đã có xác nhận của Giám sát — R5). */
export function isLocked(stage: SupervisionStage): boolean {
  return stage.status === 'confirmed'
}

/** Khách được tải hồ sơ ở giai đoạn nào: chỉ giai đoạn đang thực hiện (R9). */
export function canUpload(stage: SupervisionStage): boolean {
  return stage.status === 'inProgress'
}

/** Bàn giao đang sớm hay chậm so với kế hoạch ban đầu. */
export function handoverDrift(project: SupervisionProject): { days: number; early: boolean } {
  const planned = new Date(project.plannedHandoverDate).getTime()
  const expected = new Date(project.handoverDate).getTime()
  const days = Math.round((planned - expected) / 86_400_000)
  return { days: Math.abs(days), early: days >= 0 }
}

/** Nhãn trạng thái dùng chung cho bảng lịch trình và danh sách giai đoạn. */
export function stageStatusOf(stage: SupervisionStage): StageStatus {
  return stage.status
}
