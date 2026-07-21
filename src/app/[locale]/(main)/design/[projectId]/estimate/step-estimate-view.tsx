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
 * Bước 2 (mục III.3). Panel cẩm nang cá nhân hóa nằm ở cột phải trong CẢ màn
 * chờ lẫn màn kết quả — spec cho người dùng tự thu nhỏ nó để đọc dự toán, chứ
 * không tự biến mất. Lớp app dựng `HandbookFilter` từ draft vì hai feature
 * không được import lẫn nhau.
 */
export function StepEstimateView({ projectId }: { projectId: string }) {
  const t = useTranslations('design.estimate')
  const router = useRouter()
  const { user } = useAuth()
  const draft = useDesignStore((s) => s.drafts[projectId])
  const { data: project } = useProject(projectId)
  const { data: result, isSuccess } = useEstimate(projectId)
  const panelMinimized = useHandbookPanelStore((s) => s.minimized)

  const filter = useMemo<HandbookFilter>(
    () => ({
      buildingType: draft?.buildingType ?? undefined,
      floorCount: draft?.floorCount ?? undefined,
      hasAttic: draft?.hasAttic ?? undefined,
      architectureStyle: draft?.architectureStyle ?? undefined,
      interiorStyle: draft?.interiorStyle ?? undefined
    }),
    [draft]
  )

  // Chatbox AI nói theo dữ liệu thật của dự án; tự trò chuyện trong lúc chờ.
  useProjectChatContext(project?.name ?? '', draft, result ? null : 'estimate')

  // Khi AI sinh xong: toast "Dự toán đã sẵn sàng" (mục III.3a).
  useEffect(() => {
    if (isSuccess) toast.success(t('readyToast'))
  }, [isSuccess, t])

  return (
    <>
      <StepProgress current={2} />
      <DesignStepLayout
        sidePanel={<PersonalizedPanel filter={filter} kind='layout' topic='architecture' />}
        sidePanelCollapsed={panelMinimized}
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
            chatStream={<ProactiveChatStream />}
          />
        )}
      </DesignStepLayout>
    </>
  )
}
