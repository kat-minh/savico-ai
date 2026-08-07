/**
 * Public API of the `account` feature — Cửa sổ cá nhân (mục IV).
 * "Dự án của tôi" lives in `features/design` because it reads project state;
 * the account page composes both.
 */
export { AccountInfo } from './components/account-info'
export { FavoriteGrid } from './components/favorite-grid'
export { PlanCard } from './components/plan-card'
export { useAccountPlan } from './hooks/use-account-plan'
export type { AccountPlan, PlanAllowance } from './types/account.types'
