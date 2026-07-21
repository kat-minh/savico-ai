import { LoadingSpinner } from '@/shared/components/common'

/** Route-level fallback shown during navigation/data loading. */
export default function Loading() {
  return (
    <div className='flex min-h-svh items-center justify-center'>
      <LoadingSpinner />
    </div>
  )
}
