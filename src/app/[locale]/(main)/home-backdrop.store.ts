'use client'

import { create } from 'zustand'

interface HomeBackdropStore {
  /** `true`: nền trơn phẳng như bản client; `false`: quầng nền động (AmbientAura). */
  plain: boolean
  toggle: () => void
}

/**
 * Chọn kiểu nền trang chủ để đối chiếu với bản client — nút switch nằm ở header
 * (cạnh "Tạo dự án mới"). Store ở lớp app vì nó nối phần nền (render trong
 * `page.tsx`) với nút bấm trên header (nối qua `main-chrome`): hai chỗ ở hai
 * nhánh cây khác nhau nên cần state dùng chung. Không persist để tránh lệch
 * SSR/hydrate và để mỗi lần vào lại mặc định là nền động.
 */
export const useHomeBackdropStore = create<HomeBackdropStore>()((set) => ({
  plain: false,
  toggle: () => set((s) => ({ plain: !s.plain }))
}))
