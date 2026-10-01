'use client'

import { useTranslations } from 'next-intl'

import { isApiEstimateId, StepInputApiForm, StepInputForm, StepProgress } from '@/features/design'
import { useRouter } from '@/i18n/navigation'
import { designEstimateRoute } from '@/shared/constants/routes'

/** Bước 1 — tiêu đề + stepper + form nhập liệu; submit chuyển sang Bước 2. */
export function StepInputView({ projectId }: { projectId: string }) {
  const router = useRouter()
  const t = useTranslations('design.input')

  return (
    <>
      <StepProgress current={1} title={t('pageTitle')} entranceKey={`design.${projectId}.step1`} />
      {/* Dự toán THẬT (id UUID) nhập theo đúng trường của BE; dự án mock (SVC-…) giữ form cũ. */}
      {isApiEstimateId(projectId) ? (
        <StepInputApiForm projectId={projectId} onSubmit={() => router.push(designEstimateRoute(projectId))} />
      ) : (
        <StepInputForm projectId={projectId} onSubmit={() => router.push(designEstimateRoute(projectId))} />
      )}
    </>
  )
}
