export const primaryControlShadowClasses =
  'shadow-[0_1px_--theme(--color-white/0.07)_inset,0_1px_3px_--theme(--color-gray-900/0.2)]'

export const lightControlShadowClasses =
  'shadow-[0_1px_--theme(--color-white/0.6)_inset,0_1px_2px_--theme(--color-gray-900/0.04)]'

export const primaryOverlayBeforeClasses =
  'before:pointer-events-none before:absolute before:inset-0 before:-z-10 before:rounded-[inherit] before:bg-linear-to-b before:from-white/20 before:transition-opacity before:duration-300 before:ease-[cubic-bezier(0.4,0.36,0,1)]'

export const primaryOverlayAfterClasses =
  'after:pointer-events-none after:absolute after:inset-0 after:-z-10 after:rounded-[inherit] after:bg-linear-to-b after:from-white/15 after:from-44% after:via-transparent after:via-50% after:to-black/12 after:to-56% after:mix-blend-overlay'

export const primaryControlEffectClasses = [
  // Nút chính là dải chuyển xanh lá theo bộ nhận diện khách duyệt: sáng ở trên,
  // đậm dần xuống dưới.
  'relative isolate overflow-hidden bg-primary bg-linear-to-b from-primary to-primary-strong',
  primaryControlShadowClasses,
  primaryOverlayBeforeClasses,
  'before:opacity-50',
  primaryOverlayAfterClasses
].join(' ')

export const primaryButtonEffectClasses = [
  'group text-primary-foreground transition duration-300 ease-[cubic-bezier(0.4,0.36,0,1)] hover:before:opacity-100',
  primaryControlEffectClasses
].join(' ')

export const activePrimaryControlClasses = [
  'group relative isolate overflow-hidden !bg-primary !text-primary-foreground hover:!bg-primary hover:!text-primary-foreground transition duration-300 ease-[cubic-bezier(0.4,0.36,0,1)]',
  primaryControlShadowClasses,
  primaryOverlayBeforeClasses,
  'before:opacity-100',
  primaryOverlayAfterClasses
].join(' ')

export const secondaryControlEffectClasses =
  'group relative isolate overflow-hidden bg-linear-to-b from-background to-muted/50 text-secondary-foreground ring-1 ring-border/20 shadow-[0_1px_--theme(--color-white/0.6)_inset,0_1px_2px_--theme(--color-gray-900/0.04)] transition duration-300 ease-[cubic-bezier(0.4,0.36,0,1)] before:pointer-events-none before:absolute before:inset-0 before:-z-10 before:rounded-[inherit] before:bg-linear-to-b before:from-background before:to-muted-foreground before:opacity-0 before:transition-opacity before:duration-300 before:ease-[cubic-bezier(0.4,0.36,0,1)] after:pointer-events-none after:absolute after:inset-0 after:-z-10 after:rounded-[inherit] after:bg-linear-to-b after:from-white/15 after:from-44% after:via-transparent after:via-50% after:to-black/5 after:to-56% after:mix-blend-overlay hover:before:opacity-5'

export const softInsetSurfaceClasses = 'shadow-[inset_0_0_2px_rgba(0,0,0,0.15)] rounded-2xl'
