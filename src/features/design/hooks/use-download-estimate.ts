'use client'

import { useCallback, useState } from 'react'
import { useTranslations } from 'next-intl'

import { COST_SECTIONS } from '../constants/design.constants'
import {
  buildEstimateSheet,
  ESTIMATE_XLSX_COLUMNS,
  type EstimateXlsxContext,
  type EstimateXlsxLabels
} from '../services/estimate-xlsx.service'
import type { CostSection, EstimateResult } from '../types/design.types'

/**
 * Tải "Bảng dự toán chi tiết" (.xlsx) đầy đủ hạng mục con — dùng chung cho nút
 * "XEM CHI TIẾT" và liên kết "Tải bảng dự toán Excel" (mục III.3b, khối 1).
 *
 * Khi backend đã phát hành file thật, `result.xlsxUrl` là một URL tải được và
 * hook trả về đúng URL đó; ở chế độ mock (`xlsxUrl` rỗng hoặc `#`) file được
 * dựng ngay trong trình duyệt từ chính dữ liệu đang hiển thị.
 */
export function useDownloadEstimate(result: EstimateResult | undefined, context: EstimateXlsxContext) {
  const t = useTranslations('design.estimate')
  const [isPending, setPending] = useState(false)

  const remoteUrl = result?.xlsxUrl && result.xlsxUrl !== '#' ? result.xlsxUrl : null

  const download = useCallback(async () => {
    if (!result || isPending) return

    const fileName = t('xlsx.fileName', { project: context.projectName || t('xlsx.untitledProject') })

    if (remoteUrl) {
      const anchor = document.createElement('a')
      anchor.href = remoteUrl
      anchor.download = fileName
      anchor.click()
      return
    }

    setPending(true)
    try {
      const labels: EstimateXlsxLabels = {
        title: t('xlsx.title'),
        sheet: t('xlsx.sheet'),
        project: t('xlsx.project'),
        address: t('xlsx.address'),
        floorArea: t('xlsx.floorArea'),
        columns: {
          no: t('xlsx.columns.no'),
          item: t('xlsx.columns.item'),
          unit: t('xlsx.columns.unit'),
          quantity: t('xlsx.columns.quantity'),
          unitPrice: t('xlsx.columns.unitPrice'),
          amount: t('xlsx.columns.amount')
        },
        sections: Object.fromEntries(COST_SECTIONS.map((s) => [s, t(`sections.${s}`)])) as Record<CostSection, string>,
        sectionTotal: t('sectionTotal'),
        grandTotal: t('grandTotal'),
        note: t('xlsx.note')
      }

      // Lazy — bộ ghi .xlsx chỉ tải về khi người dùng thật sự bấm tải.
      const { default: writeXlsxFile } = await import('write-excel-file/browser')
      await writeXlsxFile(buildEstimateSheet(result, context, labels), {
        sheet: labels.sheet,
        columns: ESTIMATE_XLSX_COLUMNS
      }).toFile(fileName)
    } finally {
      setPending(false)
    }
  }, [result, context, isPending, remoteUrl, t])

  return { download, isPending }
}
