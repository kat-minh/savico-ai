'use client'

import { useTranslations } from 'next-intl'

import { OrderConfirm, isApiOrderId, type OfferKey, type OrderKind } from '@/features/checkout'
import { usePlans } from '@/features/plans'
import { useSupervisionPackageList } from '@/features/supervision'
import { LoadingSpinner } from '@/shared/components/common'

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
 * Gói ĐẾN TỪ API (planId là UUID) không nằm trong kho CMS mà `OrderConfirm` đọc, nên ở
 * đây — tầng được phép chạm cả `features/plans`, `features/supervision` lẫn
 * `features/checkout` — tra gói rồi truyền bản chụp xuống. Gói mock (id không phải
 * UUID) bỏ qua nhánh này, `OrderConfirm` tự đọc CMS như cũ.
 *
 * `kind` KHÔNG suy từ `?project=`: mua gói giám sát không cần công trình (BR-PAY-001
 * khoản 4), nên khách vào từ tab Bảng giá sẽ không có tham số đó mà vẫn mua giám sát.
 * Loại đơn lấy từ chính gói: có trong danh sách gói giám sát thì là giám sát.
 */
export function ConfirmView({ productId, kind, projectId, offer }: ConfirmViewProps) {
  const t = useTranslations('checkout.confirm')
  const { data: plans, isPending: plansPending } = usePlans()
  const { packages, isPending: packagesPending } = useSupervisionPackageList()

  const isApi = isApiOrderId(productId)
  const pkg = packages.find((item) => item.id === productId)
  const resolvedKind: OrderKind = pkg ? 'supervision' : isApi ? 'design' : kind

  const apiPackage = isApi ? pkg : undefined
  const apiPlan = isApi && !pkg ? plans?.find((plan) => plan.id === productId) : undefined

  // Chờ danh sách gói từ API về mới quyết định — nếu không, màn sẽ nháy "không tìm
  // thấy gói" trong lúc gói còn đang tải.
  if (isApi && !apiPackage && !apiPlan && (plansPending || packagesPending)) {
    return <LoadingSpinner className='py-24' label={t('loadingProduct')} />
  }

  const apiProduct = apiPackage
    ? {
        name: apiPackage.name,
        tierTag: null,
        popular: Boolean(apiPackage.recommended),
        price: apiPackage.price,
        benefits: apiPackage.benefits
      }
    : apiPlan
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
      kind={resolvedKind}
      projectId={projectId}
      offerKey={toOfferKey(offer)}
      apiProduct={apiProduct}
    />
  )
}
