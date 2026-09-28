'use client'

import { Alert, Descriptions, Form, Image, Input, Space, Tag, Typography } from 'antd'
import { useTranslations } from 'next-intl'

import {
  createCatalogStyle,
  updateCatalogStyle,
  type AdminCatalog,
  type CatalogStyleDto,
  type CatalogStyleGroup
} from '../../api/bmt/catalog.api'
import { ESTIMATE_CATALOG_KEY, useEstimateCatalog, useFreshCatalog } from '../../hooks/use-estimate-catalog'
import { matchesKeyword, pageLocally } from '../../services/local-page.service'
import { ApiResourceManager } from '../common/api-resource-manager'
import { HttpsImageField } from '../common/https-image-field'

const { Text } = Typography

const NAME_MAX = 200

const trimmed = (value: unknown) => (typeof value === 'string' ? value.trim() : value)

/** Loại công trình đang gán phong cách này, kèm cờ nhóm có đang bật không. */
function assignedTypes(catalog: AdminCatalog | undefined, kind: 'architecture' | 'interior', styleId: string) {
  return (catalog?.buildingTypes ?? [])
    .filter((type) => (kind === 'architecture' ? type.architectureStyleIds : type.interiorStyleIds).includes(styleId))
    .map((type) => ({
      id: type.buildingTypeId,
      name: type.name,
      enabled: kind === 'architecture' ? type.architectureEnabled : type.interiorEnabled
    }))
}

/**
 * PHONG CÁCH KIẾN TRÚC / PHONG CÁCH NỘI THẤT (STORY-PROJ-005, BR-PROJ-004) —
 * hai danh mục riêng trên BMT API, mỗi danh mục một mục menu.
 *
 * Phong cách chỉ có tên và một ảnh minh họa (URL https thuộc kho presign). Việc
 * gán phong cách cho loại công trình làm ở màn Loại công trình; màn này chỉ
 * hiện lại để đối chiếu. API không có xóa, ẩn hay sắp xếp phong cách.
 */
export function StyleManager({ kind }: { kind: 'architecture' | 'interior' }) {
  const t = useTranslations('admin')
  const c = useTranslations('admin.estimateCatalog')
  const { data: catalog } = useEstimateCatalog()
  const { fetchFresh, invalidate } = useFreshCatalog()
  const group: CatalogStyleGroup = kind === 'architecture' ? 'Architecture' : 'Interior'
  const pick = (source: AdminCatalog) => (kind === 'architecture' ? source.architectureStyles : source.interiorStyles)

  const typeTags = (styleId: string) => (
    <Space size={4} wrap style={{ maxWidth: 360 }}>
      {assignedTypes(catalog, kind, styleId).map((type) => (
        <Tag key={type.id} color={type.enabled ? 'blue' : undefined}>
          {type.enabled ? type.name : c('typeGroupOff', { name: type.name })}
        </Tag>
      ))}
    </Space>
  )

  return (
    <ApiResourceManager<CatalogStyleDto>
      title={t(kind === 'architecture' ? 'nav.architectureStyles' : 'nav.interiorStyles')}
      description={c(kind === 'architecture' ? 'architectureDescription' : 'interiorDescription')}
      queryKey={[...ESTIMATE_CATALOG_KEY, 'styles', group]}
      searchable
      fetchPage={async ({ pageIndex, pageSize, keyword }) => {
        const fresh = await fetchFresh()
        return pageLocally(
          pick(fresh).filter((style) => matchesKeyword(style.name, keyword)),
          pageIndex,
          pageSize
        )
      }}
      rowKey={(item) => item.styleId}
      drawerWidth={560}
      createValues={() => ({ expectedCatalogVersion: catalog?.catalogVersion ?? 0, name: '', imageUrl: '' })}
      onCreate={async (values) => {
        await createCatalogStyle(Number(values.expectedCatalogVersion), group, {
          name: String(values.name ?? '').trim(),
          imageUrl: String(values.imageUrl ?? '').trim()
        })
        await invalidate()
      }}
      toFormValues={async (item) => {
        const fresh = await fetchFresh()
        const latest = pick(fresh).find((style) => style.styleId === item.styleId) ?? item
        return { ...latest, expectedCatalogVersion: fresh.catalogVersion }
      }}
      onUpdate={async (values, item) => {
        await updateCatalogStyle(item.styleId, Number(values.expectedCatalogVersion), {
          name: String(values.name ?? '').trim(),
          imageUrl: String(values.imageUrl ?? '').trim()
        })
        await invalidate()
      }}
      columns={[
        {
          title: c('styleName'),
          dataIndex: 'name',
          render: (_, record) => (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {record.imageUrl ? (
                <Image
                  src={record.imageUrl}
                  alt=''
                  width={44}
                  height={32}
                  style={{ objectFit: 'cover', borderRadius: 6 }}
                />
              ) : null}
              <Text strong>{record.name}</Text>
            </div>
          )
        },
        {
          title: c('assignedTypes'),
          key: 'types',
          render: (_, record) => typeTags(record.styleId)
        }
      ]}
      renderView={(item) => (
        <Space orientation='vertical' size={16} style={{ width: '100%' }}>
          {item.imageUrl ? <Image src={item.imageUrl} alt='' style={{ borderRadius: 8 }} /> : null}
          <Descriptions
            size='small'
            column={1}
            bordered
            items={[
              { key: 'name', label: c('styleName'), children: item.name },
              { key: 'types', label: c('assignedTypes'), children: typeTags(item.styleId) }
            ]}
          />
        </Space>
      )}
      renderForm={(form) => (
        <>
          <Form.Item name='expectedCatalogVersion' hidden>
            <Input />
          </Form.Item>
          <Form.Item
            name='name'
            label={c('styleName')}
            rules={[
              { required: true, whitespace: true, message: t('fields.requiredMessage') },
              { max: NAME_MAX, transform: trimmed, message: t('fields.maxLength', { max: NAME_MAX }) }
            ]}
          >
            <Input showCount maxLength={NAME_MAX + 20} />
          </Form.Item>
          <HttpsImageField form={form} name='imageUrl' label={c('styleImage')} />
          <Alert type='info' showIcon title={c('styleImageNote')} style={{ marginBottom: 12 }} />
          <Text type='secondary' style={{ fontSize: 12 }}>
            {c('styleAssignHint')}
          </Text>
        </>
      )}
    />
  )
}
