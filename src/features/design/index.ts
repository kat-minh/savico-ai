/**
 * Public API of the `design` feature — luồng Thiết kế & Dự toán 3 bước (mục III).
 * Other layers import ONLY from this barrel.
 */

// Components
export { CreateProjectDialog } from './components/create-project-dialog'
export { StepProgress } from './components/step-progress'
export { HelpLink } from './components/help-link'
export { StepInputForm } from './components/step-input-form'
export { GenerationWaiting } from './components/generation-waiting'
export { DesignStepLayout } from './components/design-step-layout'
export { EstimateResultView } from './components/estimate-result-view'
export { EstimateTable } from './components/estimate-table'
export { AdvisoryNote } from './components/advisory-note'
export { CostDonut } from './components/cost-donut'
export { DossierOverview, type DossierProjectInfo } from './components/dossier-overview'
export { DossierReady } from './components/dossier-ready'
export { DossierShareDialog, type ShareMode } from './components/dossier-share-dialog'
export { SharedDossierView } from './components/shared-dossier-view'
export { MyProjects } from './components/my-projects'

// Hooks
export { useProjects, useProject, useCreateProject } from './hooks/use-projects'
export { useEstimate } from './hooks/use-estimate'
export { useDownloadEstimate } from './hooks/use-download-estimate'
export { useDossier, useRenderDossier, useCreateShareLink, useSendDossierEmail } from './hooks/use-dossier'
export { useDownloadDossier } from './hooks/use-download-dossier'
export { useAdvisory } from './hooks/use-advisory'
export { useSaveInput } from './hooks/use-save-input'
export { useGenerationProgress } from './hooks/use-generation-progress'

// Store
export { useDesignStore } from './store/design.store'

// Services (pure — unit-test target)
export {
  EMPTY_DESIGN_INPUT,
  emptyDesignInput,
  composeAddress,
  visibleFields,
  applyBuildingTypeChange,
  missingRequiredFields,
  canSubmitDesignInput,
  type RequiredInputField
} from './services/design-input.service'
export {
  costShares,
  grandTotal,
  rollUpSections,
  sectionTotal,
  subItemAmount,
  unitCostPerSqm,
  type CostShare,
  type DraftLineItem,
  type DraftSection
} from './services/estimate.service'
export { advisoryFacts, type AdvisoryFacts } from './services/advisory.service'
export {
  buildEstimateSheet,
  ESTIMATE_XLSX_COLUMNS,
  type EstimateXlsxContext,
  type EstimateXlsxLabels
} from './services/estimate-xlsx.service'

// Schemas
export {
  createProjectSchema,
  PROJECT_NAME_MAX_LENGTH,
  PROJECT_DESCRIPTION_MAX_LENGTH,
  type CreateProjectFormValues
} from './schemas/create-project.schema'
export { createDesignInputSchema, type DesignInputFormValues } from './schemas/design-input.schema'

// Constants & types
export {
  ARCHITECTURE_STYLES,
  BUILDING_TYPES,
  COST_SECTIONS,
  DEFAULT_PACKAGE_TIER,
  DESIGN_STEPS,
  STEP_HELP_TOPIC,
  FIELDS_BY_BUILDING_TYPE,
  FLOOR_COUNTS,
  INTERIOR_STYLES,
  LAND_PHOTO_ACCEPT,
  LAND_PHOTO_MAX_BYTES,
  PACKAGE_TIERS,
  WISHES_MAX_LENGTH
} from './constants/design.constants'
export type {
  AddressDetail,
  ArchitectureStyle,
  BuildingType,
  CostSection,
  DesignInput,
  DesignStep,
  Dossier,
  DossierStatus,
  EstimateLineItem,
  EstimateResult,
  EstimateSection,
  EstimateSubItem,
  FloorCount,
  GenerationProgress,
  InteriorStyle,
  PackageTier,
  Project,
  SharedDossier
} from './types/design.types'
