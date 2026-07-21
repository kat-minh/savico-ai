import { mockDelay } from '@/shared/lib/mock'
import { emptyDesignInput } from '../services/design-input.service'
import { grandTotal, rollUpSections, subItemAmount, type DraftSection } from '../services/estimate.service'
import type {
  DesignInput,
  Dossier,
  EstimateResult,
  EstimateSection,
  Project,
  SharedDossier
} from '../types/design.types'
import type { CreateProjectPayload } from './design.api'

/**
 * In-browser mock of the design-flow API, enabled by
 * `NEXT_PUBLIC_USE_MOCK_API=true`. Numbers are illustrative placeholders — the
 * real hạng mục and đơn giá come from Phụ lục 02.
 */

/**
 * Màn hình chờ là một phần của trải nghiệm, không phải thời gian chết: người
 * dùng đọc cẩm nang cá nhân hóa trong lúc AI chạy (mục III.3a). Mock phải đủ
 * lâu để nhìn thấy vòng tiến độ đi qua cả 4 giai đoạn và panel dùng được.
 */
const ESTIMATE_DELAY_MS = 9_000
const RENDER_DELAY_MS = 11_000

/**
 * Dữ liệu mock nằm ở localStorage chứ không phải bộ nhớ tab: luồng 3 bước kéo
 * dài qua nhiều lần tải trang (thoát ra vào lại vẫn còn nháp — mục III.2), nên
 * Map thuần sẽ làm mất dự án ngay khi F5. Backend thật thay hẳn chỗ này.
 */
const STORE_KEY = 'savico.mock-design'

interface MockStore {
  sequence: number
  projects: Record<string, Project>
  inputs: Record<string, DesignInput>
  dossiers: Record<string, Dossier>
}

const emptyStore = (): MockStore => ({ sequence: 0, projects: {}, inputs: {}, dossiers: {} })

function loadStore(): MockStore {
  if (typeof window === 'undefined') return emptyStore()
  try {
    const raw = window.localStorage.getItem(STORE_KEY)
    return raw ? { ...emptyStore(), ...(JSON.parse(raw) as MockStore) } : emptyStore()
  } catch {
    return emptyStore()
  }
}

function saveStore(store: MockStore): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORE_KEY, JSON.stringify(store))
  } catch {
    // hết quota — phiên hiện tại vẫn chạy, chỉ không sống qua lần tải sau
  }
}

/** Đọc–sửa–ghi trong một nhịp để hai lời gọi song song không đè lên nhau. */
function updateStore<T>(mutate: (store: MockStore) => T): T {
  const store = loadStore()
  const result = mutate(store)
  saveStore(store)
  return result
}

const nextId = (store: MockStore) => `SVC-${String(++store.sequence).padStart(4, '0')}`

/** Rút gọn khai báo hạng mục con: `[id, nhãn, đơn vị, khối lượng, đơn giá]`. */
type SubItemSeed = readonly [string, string, string, number, number]

function sub(...seeds: SubItemSeed[]) {
  return seeds.map(([id, label, unit, quantity, unitPrice]) => ({
    id,
    label,
    unit,
    quantity,
    unitPrice,
    amount: subItemAmount({ id, label, unit, quantity, unitPrice })
  }))
}

/**
 * Hạng mục lớn + hạng mục con của một căn nhà phố mẫu. Thành tiền hạng mục lớn
 * và tổng từng phần được cộng dồn từ đây, nên bảng trên màn hình luôn khớp file
 * Excel. Danh mục và đơn giá thật lấy theo Phụ lục 02.
 */
const SECTION_SEEDS: DraftSection[] = [
  {
    section: 'structure',
    items: [
      {
        id: 'foundation',
        label: 'Móng, cọc',
        children: sub(
          ['pile', 'Ép cọc bê tông ly tâm D300', 'm', 240, 550_000],
          ['excavation', 'Đào đất hố móng, phá đầu cọc', 'm³', 60, 350_000],
          ['footing', 'Bê tông, cốt thép đài và giằng móng', 'm³', 42, 2_800_000],
          ['formwork', 'Cốp pha, nhân công phần móng', 'm²', 130, 380_000]
        )
      },
      {
        id: 'frame',
        label: 'Khung, sàn, mái',
        children: sub(
          ['column', 'Cột, dầm bê tông cốt thép', 'm³', 78, 3_200_000],
          ['slab', 'Sàn bê tông cốt thép', 'm²', 240, 1_150_000],
          ['stair', 'Cầu thang, mái bê tông', 'm²', 46, 1_400_000],
          ['scaffold', 'Giàn giáo, cốp pha phần thân', 'm²', 250, 200_000]
        )
      },
      {
        id: 'masonry',
        label: 'Xây tô, chống thấm',
        children: sub(
          ['wall', 'Xây tường gạch ống', 'm²', 420, 285_000],
          ['plaster', 'Tô trát tường trong và ngoài', 'm²', 840, 105_000],
          ['waterproof', 'Chống thấm vệ sinh, ban công, mái', 'm²', 96, 220_000],
          ['screed', 'Cán nền, tạo dốc', 'm²', 216, 50_000]
        )
      }
    ]
  },
  {
    section: 'finishing',
    items: [
      {
        id: 'floor',
        label: 'Lát nền, ốp tường, sơn nước',
        children: sub(
          ['tile-floor', 'Gạch lát nền 800×800', 'm²', 240, 620_000],
          ['tile-wall', 'Ốp tường khu vệ sinh và bếp', 'm²', 86, 540_000],
          ['stone', 'Đá granite bậc tam cấp, cầu thang', 'm', 38, 1_250_000],
          ['paint', 'Sơn nước trong và ngoài nhà', 'm²', 840, 95_000]
        )
      },
      {
        id: 'door-window',
        label: 'Cửa, lan can, trần',
        children: sub(
          ['main-door', 'Cửa chính gỗ tự nhiên', 'bộ', 1, 28_000_000],
          ['room-door', 'Cửa phòng, cửa vệ sinh', 'bộ', 8, 6_500_000],
          ['glass', 'Cửa nhôm kính, vách kính', 'm²', 46, 3_200_000],
          ['railing', 'Lan can, tay vịn cầu thang', 'm', 24, 2_400_000],
          ['ceiling', 'Trần thạch cao khung chìm', 'm²', 210, 320_000]
        )
      },
      {
        id: 'mep',
        label: 'Điện, nước, thiết bị vệ sinh',
        children: sub(
          ['electric', 'Hệ thống điện và chiếu sáng', 'hệ', 1, 96_000_000],
          ['plumbing', 'Hệ thống cấp thoát nước', 'hệ', 1, 62_000_000],
          ['sanitary', 'Thiết bị vệ sinh', 'bộ', 4, 18_500_000],
          ['hvac', 'Máy lạnh, quạt thông gió', 'bộ', 5, 14_000_000]
        )
      }
    ]
  },
  {
    section: 'interior',
    items: [
      {
        id: 'built-in',
        label: 'Nội thất gỗ cố định',
        children: sub(
          ['kitchen', 'Tủ bếp trên và dưới', 'm', 6, 9_500_000],
          ['wardrobe', 'Tủ quần áo âm tường', 'm²', 24, 4_200_000],
          ['tv-wall', 'Kệ tivi, tủ trang trí phòng khách', 'bộ', 1, 42_000_000],
          ['shoe', 'Tủ giày, vách trang trí sảnh', 'bộ', 1, 26_000_000]
        )
      },
      {
        id: 'loose',
        label: 'Nội thất rời',
        children: sub(
          ['sofa', 'Sofa, bàn trà phòng khách', 'bộ', 1, 38_000_000],
          ['dining', 'Bàn ăn 6 ghế', 'bộ', 1, 24_000_000],
          ['bed', 'Giường, nệm, tab đầu giường', 'bộ', 3, 22_000_000],
          ['desk', 'Bàn làm việc, ghế', 'bộ', 2, 9_500_000]
        )
      },
      {
        id: 'lighting',
        label: 'Chiếu sáng, rèm, trang trí',
        children: sub(
          ['lamp', 'Đèn trang trí, đèn hắt', 'bộ', 1, 46_000_000],
          ['curtain', 'Rèm cửa', 'm²', 62, 850_000],
          ['decor', 'Tranh, cây xanh, phụ kiện trang trí', 'bộ', 1, 18_000_000]
        )
      }
    ]
  }
]

const SAMPLE_SECTIONS: EstimateSection[] = rollUpSections(SECTION_SEEDS)

/**
 * Hồ sơ đã chia sẻ, lưu ở localStorage thay vì bộ nhớ tab: link chia sẻ phải mở
 * được ở tab / cửa sổ khác thì mới thử được luồng "gửi cho người khác xem"
 * (mục III.4c). Backend thật sẽ thay hẳn chỗ này.
 */
const SHARE_STORAGE_KEY = 'savico.mock-shared-dossiers'

function readShared(): Record<string, SharedDossier> {
  if (typeof window === 'undefined') return {}
  try {
    return JSON.parse(window.localStorage.getItem(SHARE_STORAGE_KEY) ?? '{}') as Record<string, SharedDossier>
  } catch {
    return {}
  }
}

function persistShared(store: MockStore, projectId: string): void {
  if (typeof window === 'undefined') return
  const project = store.projects[projectId]
  if (!project) return

  const entry: SharedDossier = {
    projectName: project.name,
    address: store.inputs[projectId]?.address ?? '',
    createdAt: project.createdAt,
    sections: SAMPLE_SECTIONS,
    grandTotal: grandTotal(SAMPLE_SECTIONS),
    estimatedFloorArea: 240
  }
  try {
    const all = { ...readShared(), [`share-${projectId.toLowerCase()}`]: entry }
    window.localStorage.setItem(SHARE_STORAGE_KEY, JSON.stringify(all))
  } catch {
    // hết quota / chặn storage — link chia sẻ chỉ mở được trong tab hiện tại
  }
}

export const mockDesignApi = {
  listProjects: async (): Promise<Project[]> => {
    await mockDelay(200)
    const store = loadStore()
    // Ảnh bìa lấy từ ảnh lô đất của Bước 1 — backend thật sẽ trả ảnh render.
    return Object.values(store.projects).map((project) => ({
      ...project,
      coverUrl: store.inputs[project.id]?.landPhotoUrl ?? null
    }))
  },

  createProject: async (payload: CreateProjectPayload): Promise<Project> => {
    await mockDelay()
    return updateStore((store) => {
      const project: Project = {
        id: nextId(store),
        name: payload.name,
        description: payload.description,
        createdAt: new Date().toISOString(),
        currentStep: 1
      }
      store.projects[project.id] = project
      store.inputs[project.id] = emptyDesignInput()
      return project
    })
  },

  getProject: async (projectId: string): Promise<Project> => {
    await mockDelay(150)
    const project = loadStore().projects[projectId]
    if (!project) throw new Error(`Unknown project: ${projectId}`)
    return project
  },

  getInput: async (projectId: string): Promise<DesignInput> => {
    await mockDelay(150)
    return loadStore().inputs[projectId] ?? emptyDesignInput()
  },

  saveInput: async (projectId: string, input: DesignInput): Promise<DesignInput> => {
    await mockDelay(200)
    return updateStore((store) => {
      store.inputs[projectId] = input
      return input
    })
  },

  generateEstimate: async (projectId: string): Promise<EstimateResult> => {
    await mockDelay(ESTIMATE_DELAY_MS)
    updateStore((store) => {
      const project = store.projects[projectId]
      if (project) project.currentStep = 2
    })
    return {
      projectId,
      sections: SAMPLE_SECTIONS,
      grandTotal: grandTotal(SAMPLE_SECTIONS),
      advisory: '',
      estimatedFloorArea: 240,
      xlsxUrl: '#'
    }
  },

  getEstimate: async (projectId: string): Promise<EstimateResult> => mockDesignApi.generateEstimate(projectId),

  renderDossier: async (projectId: string): Promise<Dossier> => {
    await mockDelay(RENDER_DELAY_MS)
    return updateStore((store) => {
      const project = store.projects[projectId]
      if (project) project.currentStep = 3

      const dossier: Dossier = {
        projectId,
        status: 'ready',
        pdfUrl: '#',
        // Mock không có file thật nên không bịa dung lượng — hồ sơ được dựng
        // ngay trong trình duyệt lúc bấm tải, biết cỡ sau khi dựng xong.
        pdfSize: null,
        shareToken: `share-${projectId.toLowerCase()}`
      }
      store.dossiers[projectId] = dossier
      persistShared(store, projectId)
      return dossier
    })
  },

  getDossier: async (projectId: string): Promise<Dossier> => {
    await mockDelay(150)
    return (
      loadStore().dossiers[projectId] ?? { projectId, status: 'idle', pdfUrl: null, pdfSize: null, shareToken: null }
    )
  },

  createShareLink: async (projectId: string): Promise<{ token: string }> => {
    await mockDelay(300)
    updateStore((store) => persistShared(store, projectId))
    return { token: `share-${projectId.toLowerCase()}` }
  },

  sendDossierEmail: async (): Promise<void> => {
    await mockDelay(400)
  },

  /** Xem hồ sơ qua link chia sẻ (mục III.4c) — đọc từ localStorage. */
  getSharedDossier: async (token: string): Promise<SharedDossier | null> => {
    await mockDelay(400)
    return readShared()[token] ?? null
  }
}
