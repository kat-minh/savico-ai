import { Loader2 } from 'lucide-react'

/** Minimal centered loader shown while an auth guard resolves the session. */
export function AuthGuardFallback() {
  return (
    <div className='flex min-h-[50vh] w-full items-center justify-center' role='status' aria-live='polite'>
      <Loader2 className='text-muted-foreground size-6 animate-spin' />
      <span className='sr-only'>Loading</span>
    </div>
  )
}
