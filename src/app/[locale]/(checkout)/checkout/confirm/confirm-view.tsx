'use client'

import { OrderConfirm, isApiOrderId, type OfferKey, type OrderKind } from '@/features/checkout'
import { usePlans } from '@/features/plans'

interface ConfirmViewProps {
  productId: string
  kind: OrderKind
  projectId?: string
  offer?: string
}

const OFFER_KEYS: readonly OfferKey[] = ['Month', 'Year', 'ConstructionSite']

function toOfferKey(offer?: string): OfferKey | undefined {
  return OFFER_KEYS.find((key) => key === offer)
}

/**
 * Cầu nối tầng app cho màn Xác nhận đơn (S03).
 *
 * Gói ĐẾN TỪ API (planId là UUID) không nằm trong kho CMS mà `OrderConfirm` đọc,
 * nên ở đây — tầng được phép chạm cả `features/plans` lẫn `features/checkout` —
 * tra gói từ `usePlans()` rồi truyền bản chụp xuống. Gói mock (id không phải
 * UUID) bỏ qua nhánh này, `OrderConfirm` tự đọc CMS như cũ.
 */
export function ConfirmView({ productId, kind, projectId, offer }: ConfirmViewProps) {
  const { data: plans } = usePlans()

  const isApi = isApiOrderId(productId)
  const apiPlan = isApi && kind === 'design' ? plans?.find((plan) => plan.id === productId) : undefined
  const apiProduct = apiPlan
    ? {
        name: apiPlan.name,
        tierTag: null,
        popular: Boolean(apiPlan.popular),
        price: apiPlan.price,
        benefits: [
          `${apiPlan.designCredits} phương án thiết kế`,
          `${apiPlan.designCredits} lượt chỉnh sửa phương án`,
          `${apiPlan.libraryCredits} lượt tra cứu thư viện mẫu`
        ]
      }
    : undefined

  return (
    <OrderConfirm
      productId={productId}
      kind={kind}
      projectId={projectId}
      offerKey={toOfferKey(offer)}
      apiProduct={apiProduct}
    />
  )
}
