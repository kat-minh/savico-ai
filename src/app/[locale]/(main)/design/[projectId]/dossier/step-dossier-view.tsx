'use client'

import { useEffect, useMemo } from 'react'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'

import {
  DesignStepLayout,
  DossierOverview,
  DossierReady,
  GenerationWaiting,
  StepProgress,
  useAdvisory,
  useCreateShareLink,
  useDesignStore,
  useDossier,
  useEstimate,
  useProject,
  useRenderDossier,
  useSendDossierEmail,
  type DossierProjectInfo
} from '@/features/design'
import { ProactiveChatStream } from '@/features/chatbot'
import { PersonalizedPanel, useHandbookPanelStore, type HandbookFilter } from '@/features/handbook'
import { useAuth } from '@/shared/auth'
import { useProjectChatContext } from '../use-project-chat-context'

/**
 * Bước 3 (mục III.4). Màn chờ render dùng lại đúng bố cục của Bước 2 nhưng
 * panel cẩm nang đổi sang nội dung NỘI THẤT (ưu tiên tag phong cách nội thất).
 */
export function StepDossierView({ projectId }: { projectId: string }) {
  const t = useTranslations('design.dossier')
  const tInput = useTranslations('design.input')
  const { user } = useAuth()

  const draft = useDesignStore((s) => s.drafts[projectId])
  const { data: project } = useProject(projectId)
  const { data: estimate } = useEstimate(projectId)
  const { data: dossier } = useDossier(projectId)
  const render = useRenderDossier(projectId)
  const createShareLink = useCreateShareLink(projectId)
  const sendEmail = useSendDossierEmail(projectId)
  const advisory = useAdvisory(estimate, user?.name ?? '', draft)
  const panelMinimized = useHandbookPanelStore((s) => s.minimized)

  const filter = useMemo<HandbookFilter>(
    () => ({
      interiorStyle: draft?.interiorStyle ?? undefined,
      buildingType: draft?.buildingType ?? undefined,
      floorCount: draft?.floorCount ?? undefined
    }),
    [draft]
  )

  // Chatbox AI chuyển sang kịch bản render hồ sơ trong lúc chờ (mục III.4b).
  useProjectChatContext(project?.name ?? '', draft, render.isPending ? 'dossier' : null)

  useEffect(() => {
    if (render.isSuccess) toast.success(t('readyToast'))
  }, [render.isSuccess, t])

  const info: DossierProjectInfo = {
    customerName: user?.name ?? '',
    projectName: project?.name ?? '',
    projectId,
    phone: user?.phone ?? '',
    address: draft?.address ?? '',
    createdAt: project?.createdAt ?? new Date().toISOString(),
    buildingTypeLabel: draft?.buildingType ? tInput(`buildingType.options.${draft.buildingType}`) : '',
    scaleLabel: draft?.floorCount
      ? `${tInput(`floorCount.options.${draft.floorCount}`)} · ${tInput(draft.hasAttic ? 'attic.options.yes' : 'attic.options.no')}`
      : '',
    floorArea: estimate?.estimatedFloorArea ?? 0,
    packageLabel: draft ? tInput(`packageTier.options.${draft.packageTier}`) : '',
    architectureLabel: draft?.architectureStyle ? tInput(`architectureStyle.options.${draft.architectureStyle}`) : '',
    interiorLabel: draft?.interiorStyle ? tInput(`interiorStyle.options.${draft.interiorStyle}`) : ''
  }

  return (
    <>
      <StepProgress current={3} />

      {render.isPending ? (
        // Chỉ màn CHỜ render mới có panel cẩm nang (mục III.4b); màn trước và
        // sau đó là bố cục riêng của Bước 3.
        <DesignStepLayout
          sidePanel={<PersonalizedPanel filter={filter} kind='interior' topic='interior' />}
          sidePanelCollapsed={panelMinimized}
        >
          <GenerationWaiting flow='dossier' complete={false} expectedMs={11_000} chatStream={<ProactiveChatStream />} />
        </DesignStepLayout>
      ) : dossier?.status === 'ready' ? (
        <DossierReady
          dossier={dossier}
          result={estimate}
          info={info}
          advisory={advisory}
          onRequestShareLink={() => createShareLink.mutate()}
          onSendEmail={async (email) => {
            await sendEmail.mutateAsync(email)
            toast.success(t('share.email.sent', { email }))
          }}
        />
      ) : (
        <DossierOverview
          info={info}
          result={estimate}
          onRender={() => render.mutate()}
          isRendering={render.isPending}
        />
      )}
    </>
  )
}
