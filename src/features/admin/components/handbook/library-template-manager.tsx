'use client'

import { AppstoreOutlined, SwapOutlined } from '@ant-design/icons'
import { Alert, App, Segmented, Space, Tag, Typography } from 'antd'
import { useFormatter, useTranslations } from 'next-intl'
import { useState } from 'react'

import { isApiError } from '@/shared/lib/api'
import { adminKeys } from '../../api/admin.keys'
import {
  createLibraryTemplate,
  getTemplateVersions,
  listAllLibraryTemplates,
  setTemplateVisibility,
  type AdminTemplateItem,
  type AdminVersionItem,
  type DrawingKind
} from '../../api/bmt/library.api'
import { matchesKeyword, pageLocally } from '../../services/local-page.service'
import { ApiResourceManager, type ApiRowContext } from '../common/api-resource-manager'
import type { RowAction } from '../common/row-actions-menu'
import { StatusTag } from '../common/status-tag'
import { useFloorLabel } from '../catalog/use-floor-label'
import { LibraryContentFields, toTemplateContent } from './library-content-fields'
import { useLibraryClassification } from './use-library-classification'
import { LibraryVersionsDrawer } from './library-versions-drawer'

const { Text } = Typography

/** Số request đọc phiên bản chạy song song khi dựng danh sách. */
const CONCURRENCY = 6

/** Một dòng bảng: mẫu + phiên bản đại diện (bản hiện hành, chưa có thì nháp mới nhất). */
interface LibraryRow {
  template: AdminTemplateItem
  shown: AdminVersionItem | undefined
  name: string | null
  kind: string | null
}

async function mapLimited<T, R>(items: readonly T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array<R>(items.length)
  let next = 0
  const worker = async () => {
    while (next < items.length) {
      const index = next++
      out[index] = await fn(items[index] as T)
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker))
  return out
}

/**
 * Danh sách quản trị của BE không có loại bản vẽ / tên nháp và không lọc hay tìm
 * được, nên màn đọc toàn bộ mẫu kèm phiên bản rồi lọc 2D/3D và tìm theo tên tại
 * chỗ (đã ghi vào danh sách thiếu gửi BE).
 */
async function loadRows(): Promise<LibraryRow[]> {
  const templates = await listAllLibraryTemplates()
  return mapLimited(templates, CONCURRENCY, async (template) => {
    const detail = await getTemplateVersions(template.templateId)
    const shown =
      detail.versions.find((version) => version.isCurrent) ??
      detail.versions.find((version) => version.state === 'Draft')
    return {
      template: { ...template, templateVersion: detail.templateVersion, isHidden: detail.isHidden },
      shown,
      name: shown?.name ?? template.currentName ?? null,
      kind: shown?.drawingKind ?? null
    }
  })
}

/**
 * THƯ VIỆN MẪU BẢN VẼ (STORY-LIB-001, BR-LIB-001) trên BMT API — MỘT màn cho cả
 * mẫu 2D và 3D (chung endpoint `/admin/library/templates`, chỉ khác `drawingKind`).
 * Lọc 2D / 3D bằng Segmented ngay trên bảng thay vì tách hai mục menu. Mỗi mẫu có
 * phiên bản: tạo mẫu là tạo nháp đầu tiên, công bố nháp để khách thấy; ẩn / hiện
 * lại không tạo phiên bản. Mẫu chưa chọn loại bản vẽ hiện ở mọi tab để không lạc.
 */
export function LibraryTemplateManager() {
  const t = useTranslations('admin')
  const l = useTranslations('admin.library')
  const format = useFormatter()
  const { message, modal } = App.useApp()
  const floorLabel = useFloorLabel()
  const { data: classificationOptions } = useLibraryClassification()
  const [managing, setManaging] = useState<{ row: LibraryRow; ctx: ApiRowContext } | null>(null)
  const [activeKind, setActiveKind] = useState<'all' | DrawingKind>('all')

  const listKey = adminKeys.bmt('library', 'templates', activeKind)

  const classification = (version: AdminVersionItem | undefined) => {
    if (!version?.buildingTypeId) return <Text type='secondary'>-</Text>
    return (
      <Space size={4} wrap>
        <Tag>{version.buildingTypeName ?? version.buildingTypeId}</Tag>
        {version.floorCount ? <Tag>{floorLabel(version.floorCount)}</Tag> : null}
        {version.hasTum === true ? <Tag>{l('tumYes')}</Tag> : null}
        {version.hasTum === false ? <Tag>{l('tumNo')}</Tag> : null}
      </Space>
    )
  }

  const dimensions = (version: AdminVersionItem | undefined) =>
    version && (version.widthM || version.lengthM || version.areaM2)
      ? `${version.widthM ?? '?'} × ${version.lengthM ?? '?'} m · ${version.areaM2 ?? '?'} m²`
      : '-'

  return (
    <>
      <ApiResourceManager<LibraryRow>
        title={l('libraryTitle')}
        description={l('libraryDescription')}
        queryKey={listKey}
        searchable
        banner={
          <>
            <Segmented
              value={activeKind}
              onChange={(value) => setActiveKind(value as 'all' | DrawingKind)}
              options={[
                { value: 'all', label: l('kindAll') },
                { value: '2D', label: l('kind2d') },
                { value: '3D', label: l('kind3d') }
              ]}
              style={{ marginBottom: 16 }}
            />
            <Alert type='info' showIcon style={{ marginBottom: 16 }} title={l('publishFlowNote')} />
          </>
        }
        fetchPage={async ({ pageIndex, pageSize, keyword }) => {
          const rows = await loadRows()
          const matching = rows.filter(
            (row) =>
              (activeKind === 'all' || row.kind === activeKind || row.kind === null) &&
              matchesKeyword(row.name, keyword)
          )
          return pageLocally(matching, pageIndex, pageSize)
        }}
        rowKey={(row) => row.template.templateId}
        drawerWidth={640}
        createValues={() => ({ drawingKind: activeKind === 'all' ? undefined : activeKind })}
        // Ảnh và tệp KHÔNG nhập lúc tạo: chúng thuộc section của phiên bản nên chỉ thêm được sau khi mẫu (và nháp
        // đầu) đã có — mở "Quản lý phiên bản" để tạo section rồi tải tệp lên.
        onCreate={(values) => createLibraryTemplate(toTemplateContent(values, classificationOptions))}
        renderForm={(form) => (
          <>
            <Alert type='info' showIcon style={{ marginBottom: 16 }} title={l('createNote')} />
            <LibraryContentFields form={form} />
          </>
        )}
        rowActions={(row, ctx): RowAction[] => [
          {
            key: 'versions',
            label: l('manageVersions'),
            icon: <AppstoreOutlined />,
            onClick: () => setManaging({ row, ctx })
          },
          {
            key: 'status',
            label: t('actions.switchStatus'),
            icon: <SwapOutlined />,
            onClick: () =>
              modal.confirm({
                title: t('actions.switchStatusTitle', { name: row.name ?? l('untitled') }),
                content: (
                  <div>
                    <div>
                      {t('actions.switchStatusBody', {
                        current: row.template.isHidden ? l('hidden') : l('shown'),
                        next: row.template.isHidden ? l('shown') : l('hidden')
                      })}
                    </div>
                    <Text type='secondary' style={{ display: 'block', marginTop: 8 }}>
                      {l('visibilityNote')}
                    </Text>
                  </div>
                ),
                okText: t('actions.confirm'),
                cancelText: t('actions.cancel'),
                onOk: async () => {
                  try {
                    await setTemplateVisibility(
                      row.template.templateId,
                      row.template.templateVersion,
                      !row.template.isHidden
                    )
                    message.success(t('feedback.saved'))
                  } catch (err) {
                    message.error(isApiError(err) ? err.message : t('feedback.apiError'))
                  } finally {
                    await ctx.refresh()
                  }
                }
              })
          }
        ]}
        columns={[
          {
            title: l('name'),
            key: 'name',
            render: (_, row) => (
              <Space orientation='vertical' size={2}>
                {row.name ? <Text strong>{row.name}</Text> : <Text type='secondary'>{l('untitled')}</Text>}
                {row.kind === null ? <StatusTag tone='warning'>{l('noDrawingKind')}</StatusTag> : null}
              </Space>
            )
          },
          { title: l('classification'), key: 'classification', render: (_, row) => classification(row.shown) },
          { title: l('dimensions'), key: 'dimensions', render: (_, row) => dimensions(row.shown) },
          {
            title: l('currentVersion'),
            key: 'current',
            render: (_, row) =>
              row.template.currentVersionId ? (
                <Space orientation='vertical' size={0}>
                  <StatusTag tone='success'>{l('versionN', { number: row.template.currentNumber ?? 0 })}</StatusTag>
                  {row.template.currentPublishedAtUtc ? (
                    <Text type='secondary' style={{ fontSize: 12 }}>
                      {format.dateTime(new Date(row.template.currentPublishedAtUtc), { dateStyle: 'short' })}
                    </Text>
                  ) : null}
                </Space>
              ) : (
                <StatusTag tone='off'>{l('notPublished')}</StatusTag>
              )
          },
          {
            title: l('drafts'),
            key: 'drafts',
            width: 90,
            align: 'right',
            render: (_, row) => row.template.draftCount
          },
          {
            title: l('visibility'),
            key: 'visibility',
            width: 120,
            render: (_, row) =>
              row.template.isHidden ? (
                <StatusTag tone='off'>{l('hidden')}</StatusTag>
              ) : (
                <StatusTag tone='success'>{l('shown')}</StatusTag>
              )
          }
        ]}
      />

      <LibraryVersionsDrawer
        templateId={managing?.row.template.templateId ?? null}
        title={managing ? (managing.row.name ?? l('untitled')) : ''}
        onClose={() => setManaging(null)}
        onChanged={() => managing?.ctx.refresh() ?? Promise.resolve()}
      />
    </>
  )
}
