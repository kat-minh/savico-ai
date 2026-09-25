'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'

import {
  DesignStepLayout,
  EstimateResultView,
  GenerationWaiting,
  StepProgress,
  useDesignStore,
  useEstimate,
  useFloorCountLabel,
  useProject
} from '@/features/design'
import { ProactiveChatStream } from '@/features/chatbot'
import { PersonalizedPanel, useHandbookPanelStore, type HandbookFilter } from '@/features/handbook'
import { useRouter } from '@/i18n/navigation'
import { useAuth } from '@/shared/auth'
import { designDossierRoute, ROUTES } from '@/shared/constants/routes'
import { useProjectChatContext } from '../use-project-chat-context'

/**
 * Bước 2 (mục IV.4 + IV.5).
 *
 * Màn chờ theo Hình 07: cẩm nang cá nhân hóa chiếm cột trái rộng, cột tiến độ
 * AI hẹp bên phải. Khi render xong, màn kết quả chỉ còn nội dung dự toán; cẩm
 * nang không còn thuộc trạng thái này và được unmount hoàn toàn.
 * Lớp app dựng `HandbookFilter` từ draft vì hai feature không import lẫn nhau.
 */
export function StepEstimateView({ projectId }: { projectId: string }) {
  const t = useTranslations('design.estimate')
  const tWaiting = useTranslations('design.progress.estimate')
  const tInput = useTranslations('design.input')
  const floorLabel = useFloorCountLabel()
  const tPanel = useTranslations('handbook.panel')
  const tEntry = useTranslations('design.entry')
  const router = useRouter()
  const { user } = useAuth()
  const draft = useDesignStore((s) => s.drafts[projectId])
  const { data: project } = useProject(projectId)
  const { data: result, isSuccess } = useEstimate(projectId, {
    readOnly: Boolean(project && project.currentStep >= 2),
    enabled: Boolean(project)
  })
  const [resultVisible, setResultVisible] = useState(() => Boolean(result))
  const panelMinimized = useHandbookPanelStore((s) => s.minimized)
  const setPanelMinimized = useHandbookPanelStore((s) => s.setMinimized)
  const openedPanelForRenderRef = useRef(false)

  const filter = useMemo<HandbookFilter>(
    () => ({
      buildingType: draft?.buildingType ?? undefined,
      floorCount: draft?.floorCount ?? undefined,
      hasAttic: draft?.hasAttic ?? undefined,
      architectureStyle: draft?.style ?? undefined,
      interiorStyle: draft?.style ?? undefined
    }),
    [draft]
  )

  // Dòng ghi rõ căn cứ lọc trên panel (Phần 1.1). Nhãn nằm ở namespace của Bước 1
  // nên phải dịch tại đây rồi truyền xuống — `features/handbook` không đọc được.
  const filterLabel = useMemo(() => {
    if (!draft?.buildingType) return undefined
    return tPanel('filterLabel2d', {
      building: tInput(`buildingType.options.${draft.buildingType}`),
      scale: draft.floorCount ? floorLabel(draft.floorCount) : ''
    })
  }, [draft, tInput, tPanel, floorLabel])

  // Đầu màn kết quả (góp ý BuildX): tiêu đề kèm tên + mã dự án, dòng phụ ghi
  // địa chỉ · loại nhà · quy mô, và đường quay lại danh sách dự án.
  const resultSubtitle = useMemo(() => {
    const scale = [
      draft?.floorCount ? floorLabel(draft.floorCount) : '',
      result ? `${result.estimatedFloorArea} m²` : ''
    ]
      .filter(Boolean)
      .join(', ')
    return [draft?.address, draft?.buildingType ? tInput(`buildingType.options.${draft.buildingType}`) : '', scale]
      .filter(Boolean)
      .join(' · ')
  }, [draft, result, tInput, floorLabel])

  // Chatbox AI nói theo dữ liệu thật của dự án; tự trò chuyện trong lúc chờ.
  useProjectChatContext(project?.name ?? '', draft, result ? null : 'estimate')

  // Màn render có vòng phần trăm luôn bắt đầu với Cẩm nang đang mở. Chỉ ép mở
  // đúng một lần cho phiên render này; nếu người dùng tự thu nhỏ sau đó thì tôn
  // trọng lựa chọn của họ, không bật lại ở mỗi render.
  useEffect(() => {
    if (resultVisible || openedPanelForRenderRef.current) return
    openedPanelForRenderRef.current = true
    setPanelMinimized(false)
  }, [resultVisible, setPanelMinimized])

  // Khi AI sinh xong: toast "Dự toán đã sẵn sàng" (mục IV.4).
  useEffect(() => {
    if (!result || resultVisible) return
    const timer = window.setTimeout(() => setResultVisible(true), 720)
    return () => window.clearTimeout(timer)
  }, [result, resultVisible])

  useEffect(() => {
    if (isSuccess && resultVisible) toast.success(t('readyToast'))
  }, [isSuccess, resultVisible, t])

  return (
    <>
      <StepProgress
        current={2}
        currentDone={Boolean(result) && resultVisible}
        currentDoneAt={result?.completedAt}
        title={
          result && resultVisible
            ? project
              ? t('pageTitleWithProject', { name: project.name, id: project.id })
              : t('pageTitle')
            : tWaiting('pageTitle')
        }
        subtitle={result && resultVisible ? resultSubtitle || undefined : undefined}
        back={result && resultVisible ? { href: ROUTES.DESIGN, label: tEntry('backToList') } : undefined}
        entranceKey={`design.${projectId}.step2`}
      />
      <DesignStepLayout
        sidePanel={
          resultVisible ? undefined : (
            <PersonalizedPanel filter={filter} kind='2d' topic='architecture' filterLabel={filterLabel} />
          )
        }
        sidePanelCollapsed={!resultVisible && panelMinimized}
        waiting={!resultVisible}
        entranceKey={`design.${projectId}.${result && resultVisible ? 'estimate-result' : 'estimate-waiting'}`}
      >
        {result && resultVisible ? (
          <EstimateResultView
            result={result}
            customerName={user?.name ?? ''}
            projectName={project?.name ?? ''}
            input={draft}
            // Đánh dấu đúng ý định điều hướng: từ màn kết quả dự toán phải bắt
            // đầu lại ở M07, kể cả project từng có dossier `ready` từ lần render
            // trước. Mở trực tiếp dossier từ danh sách dự án vẫn vào M09.
            onContinue={() => router.push(`${designDossierRoute(projectId)}?entry=estimate`)}
          />
        ) : (
          <GenerationWaiting
            flow='estimate'
            complete={Boolean(result)}
            expectedMs={9_000}
            province={draft?.addressDetail.provinceName}
            chatStream={<ProactiveChatStream />}
          />
        )}
      </DesignStepLayout>
    </>
  )
}
