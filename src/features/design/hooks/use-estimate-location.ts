'use client'

import { useCallback, useEffect, useState } from 'react'

export interface EstimateLocation {
  latitude: number
  longitude: number
}

const storageKey = (projectId: string) => `bmt.estimate-location.${projectId}`

function read(projectId: string): EstimateLocation | null {
  try {
    const raw = window.localStorage.getItem(storageKey(projectId))
    if (!raw) return null
    const value = JSON.parse(raw) as Partial<EstimateLocation>
    return typeof value.latitude === 'number' && typeof value.longitude === 'number'
      ? { latitude: value.latitude, longitude: value.longitude }
      : null
  } catch {
    return null
  }
}

/**
 * Vị trí (vĩ độ/kinh độ) của công trình ở Bước 1.
 *
 * TẠM giữ ở trình duyệt theo từng dự toán: API đầu vào dự toán của BE CHƯA có trường toạ độ (đã báo BE bổ sung). Khi
 * có, đưa `latitude`/`longitude` vào bản nháp đầu vào và gửi cùng `PUT /estimates/{id}/input`, rồi bỏ hook này.
 */
export function useEstimateLocation(projectId: string) {
  const [location, setLocationState] = useState<EstimateLocation | null>(null)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- đọc localStorage, chỉ có ở client
    setLocationState(read(projectId))
  }, [projectId])

  const setLocation = useCallback(
    (next: EstimateLocation | null) => {
      setLocationState(next)
      try {
        if (next) window.localStorage.setItem(storageKey(projectId), JSON.stringify(next))
        else window.localStorage.removeItem(storageKey(projectId))
      } catch {
        // Trình duyệt chặn lưu trữ: vẫn dùng được trong phiên này.
      }
    },
    [projectId]
  )

  return { location, setLocation }
}
