'use client'

import { AppstoreOutlined } from '@ant-design/icons'
import { Alert, App, Button, Segmented, Space, Tag, Tooltip, Typography } from 'antd'
import { useFormatter, useTranslations } from 'next-intl'
import { useState } from 'react'

import { isApiError } from '@/shared/lib/api'
import { adminKeys } from '../../api/admin.keys'
import {
  attachTemplateAsset,
  createLibraryTemplate,
  createTemplateAsset,
  getTemplateVersions,
  listAllLibraryTemplates,
  setTemplateVisibility,
  type AdminTemplateItem,
  type AdminVersionItem,
  type DrawingKind,
  type VersionCreated
} from '../../api/bmt/library.api'
import { useEstimateCatalog } from '../../hooks/use-estimate-catalog'
import { matchesKeyword, pageLocally } from '../../services/local-page.service'
import { ApiResourceManager, type ApiRowContext } from '../common/api-resource-manager'
import { StatusSwitch } from '../common/field-kit'
import { StatusTag } from '../common/status-tag'
import { useFloorLabel } from '../catalog/use-floor-label'
import { fileNameOf, resolveMediaType } from './library-assets.helpers'
import { LibraryContentFields, toTemplateContent } from './library-content-fields'
import { LibraryCreateImages } from './library-create-images'
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
 * Sau khi tạo mẫu (đã có `versionId`), gắn các ảnh nhập ở form tạo vào phiên bản
 * đầu: mỗi ảnh = `createTemplateAsset` (lưu URL) → `attachTemplateAsset` (gắn vào
 * cuối, đặt ảnh bìa nếu được chọn). Ảnh đã được form validate (https + đúng định
 * dạng) nên lỗi ở đây chỉ do BE; làm best-effort và ĐẾM số ảnh lỗi thay vì ném để
 * không tạo lại mẫu (mẫu đã tồn tại). Trả về số ảnh gắn hụt.
 */
async function attachCreateImages(created: VersionCreated, values: Record<string, unknown>): Promise<number> {
  const rows = (values.images as Array<{ url?: string } | undefined> | undefined) ?? []
  const items = rows
    .map((row, index) => ({ index, url: (row?.url ?? '').trim() }))
    .filter((item) => item.url.length > 0)
  if (items.length === 0) return 0

  const rawCover = typeof values.coverIndex === 'number' ? values.coverIndex : items[0]!.index
  const coverIndex = items.some((item) => item.index === rawCover) ? rawCover : items[0]!.index

  let editVersion = created.editVersion
  let position = 1
  let failed = 0
  for (const { index, url } of items) {
    try {
      const originalName = fileNameOf(url)
      const mediaType = resolveMediaType('Image', url, originalName)
      if (!mediaType) {
        failed++
        continue
      }
      const { assetId } = await createTemplateAsset(created.templateId, {
        kind: 'Image',
        url,
        originalName,
        mediaType
      })
      const edited = await attachTemplateAsset(created.templateId, created.versionId, assetId, {
        expectedEditVersion: editVersion,
        position: position++,
        setAsCover: index === coverIndex
      })
      editVersion = edited.editVersion
    } catch {
      failed++
    }
  }
  return failed
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
  const { message } = App.useApp()
  const floorLabel = useFloorLabel()
  const { data: catalog } = useEstimateCatalog()
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
        createValues={() => ({ drawingKind: activeKind === 'all' ? undefined : activeKind, coverIndex: 0 })}
        onCreate={async (values) => {
          const created = await createLibraryTemplate(toTemplateContent(values, catalog))
          const failed = await attachCreateImages(created, values)
          if (failed > 0) message.warning(l('createImagesPartial', { count: failed }))
          return created
        }}
        renderForm={(form) => (
          <>
            <Alert type='info' showIcon style={{ marginBottom: 16 }} title={l('createNote')} />
            <LibraryContentFields form={form} />
            <LibraryCreateImages form={form} />
          </>
        )}
        rowActions={(row, ctx) => (
          <>
            <Tooltip title={l('manageVersions')}>
              <Button
                type='text'
                size='small'
                icon={<AppstoreOutlined />}
                aria-label={l('manageVersions')}
                onClick={() => setManaging({ row, ctx })}
              />
            </Tooltip>
            <StatusSwitch
              name={row.name ?? l('untitled')}
              current={row.template.isHidden ? l('hidden') : l('shown')}
              next={row.template.isHidden ? l('shown') : l('hidden')}
              warning={<Text type='secondary'>{l('visibilityNote')}</Text>}
              onConfirm={async () => {
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
              }}
            />
          </>
        )}
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
