'use client'

import { useEffect, useMemo } from 'react'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'

import {
  DesignStepLayout,
  EstimateResultView,
  GenerationWaiting,
  StepProgress,
  useDesignStore,
  useEstimate,
  useProject
} from '@/features/design'
import { ProactiveChatStream } from '@/features/chatbot'
import { PersonalizedPanel, useHandbookPanelStore, type HandbookFilter } from '@/features/handbook'
import { useRouter } from '@/i18n/navigation'
import { useAuth } from '@/shared/auth'
import { designDossierRoute } from '@/shared/constants/routes'
import { useProjectChatContext } from '../use-project-chat-context'

/**
 * Bước 2 (mục IV.4 + IV.5).
 *
 * Màn chờ theo Hình 07: cẩm nang cá nhân hóa chiếm cột trái rộng, cột tiến độ
 * AI hẹp bên phải. Màn kết quả theo Hình 08: nội dung dự toán chiếm cột chính,
 * cẩm nang lùi sang bên — người dùng tự thu nhỏ nó chứ nó không tự biến mất.
 * Lớp app dựng `HandbookFilter` từ draft vì hai feature không import lẫn nhau.
 */
export function StepEstimateView({ projectId }: { projectId: string }) {
  const t = useTranslations('design.estimate')
  const tWaiting = useTranslations('design.progress.estimate')
  const tInput = useTranslations('design.input')
  const tPanel = useTranslations('handbook.panel')
  const router = useRouter()
  const { user } = useAuth()
  const draft = useDesignStore((s) => s.drafts[projectId])
  const { data: project } = useProject(projectId)
  const { data: result, isSuccess } = useEstimate(projectId)
  const panelMinimized = useHandbookPanelStore((s) => s.minimized)
  const setPanelMinimized = useHandbookPanelStore((s) => s.setMinimized)

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
      scale: draft.floorCount ? tInput(`floorCount.options.${draft.floorCount}`) : ''
    })
  }, [draft, tInput, tPanel])

  // Chatbox AI nói theo dữ liệu thật của dự án; tự trò chuyện trong lúc chờ.
  useProjectChatContext(project?.name ?? '', draft, result ? null : 'estimate')

  // Khi AI sinh xong: toast "Dự toán đã sẵn sàng" (mục IV.4).
  useEffect(() => {
    if (isSuccess) toast.success(t('readyToast'))
  }, [isSuccess, t])

  // Sang màn kết quả thì bảng dự toán là thứ cần đọc, nên panel cẩm nang lùi về
  // nút nổi đúng như Hình 08. Chỉ thu MỘT lần khi kết quả vừa có — người dùng
  // mở lại thì tôn trọng lựa chọn đó.
  useEffect(() => {
    if (isSuccess) setPanelMinimized(true)
  }, [isSuccess, setPanelMinimized])

  return (
    <>
      <StepProgress current={2} currentDone={Boolean(result)} title={result ? t('pageTitle') : tWaiting('pageTitle')} />
      <DesignStepLayout
        sidePanel={<PersonalizedPanel filter={filter} kind='2d' topic='architecture' filterLabel={filterLabel} />}
        sidePanelCollapsed={panelMinimized}
        waiting={!result}
      >
        {result ? (
          <EstimateResultView
            result={result}
            customerName={user?.name ?? ''}
            projectName={project?.name ?? ''}
            input={draft}
            onContinue={() => router.push(designDossierRoute(projectId))}
          />
        ) : (
          <GenerationWaiting
            flow='estimate'
            complete={isSuccess}
            expectedMs={9_000}
            province={draft?.addressDetail.provinceName}
            chatStream={<ProactiveChatStream />}
          />
        )}
      </DesignStepLayout>
    </>
  )
}
