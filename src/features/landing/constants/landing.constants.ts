/** 4 tab của khung minh họa sản phẩm ở hero (mục II.2). */
export const SHOWCASE_TABS = ['floorPlan', 'render3d', 'dossier', 'estimate'] as const

export type ShowcaseTab = (typeof SHOWCASE_TABS)[number]

/** Dải 3 điểm cam kết dưới nút CTA của hero (mục II.2). */
export const HERO_PROMISES = ['fast', 'accurate', 'secure'] as const

export type HeroPromise = (typeof HERO_PROMISES)[number]

/** Dải giới thiệu 3 bước dưới hero, nối bằng mũi tên (mục II.2). */
export const HOME_STEPS = ['input', 'estimate', 'dossier'] as const

export type HomeStep = (typeof HOME_STEPS)[number]
