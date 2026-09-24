'use client'

import { App, Col, Descriptions, Form, Image, Input, InputNumber, Row, Select, Space, Tag, Typography } from 'antd'
import type { FormInstance } from 'antd'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

import type { HandbookTemplate } from '@/shared/cms'
import { useAdminCollection, useSaveAdminItem } from '../../hooks/use-admin-data'
import { newAdminId } from '../../services/admin.service'
import { floorCountTag, formatMeters, templateProblem } from '../../services/template.service'
import { ImageUrlField, StatusSwitch } from '../common/field-kit'
import { ResourceManager } from '../common/resource-manager'

const { Text, Paragraph } = Typography

/** Loại công trình của mẫu 2D theo epic: Nhà phố / Nhà vườn — mã trong danh mục dùng chung. */
const TYPE_IDS = ['townhouse', 'garden'] as const
const FLOOR_COUNTS = [1, 2, 3] as const

interface Filters {
  type?: string
  floors?: number
  status?: 'active' | 'inactive'
}

/**
 * MẪU BẢN VẼ 2D (epic 2DTemplateManagement).
 *
 * Mỗi tầng đúng một ảnh, số ảnh khớp đúng quy mô 1–3 tầng; mẫu mới mặc định
 * Inactive và chỉ chuyển Active khi đủ dữ liệu hợp lệ. Nhãn, thông số và tag
 * trang công khai đang đọc được suy ra khi lưu — admin không gõ tay.
 */
export function Template2DManager() {
  const t = useTranslations('admin')
  const { message } = App.useApp()
  const [filters, setFilters] = useState<Filters>({})
  const { data: buildingTypes = [] } = useAdminCollection('buildingTypes')
  const save = useSaveAdminItem('handbookTemplates')
  const typeLabel = (id?: string) => buildingTypes.find((type) => type.id === id)?.label ?? id ?? '-'
  const statusOf = (item: HandbookTemplate) => item.status ?? 'active'

  const matches = (item: HandbookTemplate) =>
    item.kind === '2d' &&
    (!filters.type || item.buildingTypeId === filters.type) &&
    (!filters.floors || item.floorCount === filters.floors) &&
    (!filters.status || statusOf(item) === filters.status)

  /** Chuẩn hóa form → bản ghi, kèm các trường hiển thị công khai. */
  const toRecord = (values: Record<string, unknown>, current: HandbookTemplate): HandbookTemplate => {
    const next = { ...current, ...values } as HandbookTemplate & { descriptionText?: string }
    const count = next.floorCount ?? 1
    const floors = (next.floors ?? []).slice(0, count).map((floor, index) => ({
      ...floor,
      id: floor.id || newAdminId('floor'),
      label: t('templates2d.floorN', { index: index + 1 }),
      imageUrl: floor.imageUrl?.trim() || undefined
    }))
    const label = typeLabel(next.buildingTypeId)
    const width = next.lotWidth ?? 0
    const length = next.lotLength ?? 0
    const { descriptionText, ...rest } = next
    return {
      ...rest,
      name: next.name.trim(),
      floors,
      imageUrl: floors[0]?.imageUrl,
      styleLabel: label,
      specs: {
        ...next.specs,
        buildingTypeLabel: label,
        floorLabel: t('templates2d.floorsValue', { count }),
        lotSize: `${formatMeters(width)} × ${formatMeters(length)} m`,
        floorArea: `${formatMeters(next.area ?? 0)} m²`
      },
      description: (descriptionText ?? '')
        .split(/\n{2,}/)
        .map((item) => item.trim())
        .filter(Boolean),
      tags: { ...next.tags, buildingType: next.buildingTypeId, floorCount: floorCountTag(count) }
    }
  }

  const select = <K extends keyof Filters>(
    key: K,
    placeholder: string,
    options: { value: Filters[K]; label: string }[]
  ) => (
    <Select
      allowClear
      placeholder={placeholder}
      value={filters[key]}
      onChange={(value: Filters[K]) => setFilters((prev) => ({ ...prev, [key]: value }))}
      options={options}
      style={{ minWidth: 170 }}
    />
  )

  return (
    <ResourceManager
      collection='handbookTemplates'
      title={t('nav.templates')}
      description={t('templates2d.description')}
      drawerWidth={720}
      filterItems={matches}
      filterKey={JSON.stringify(filters)}
      searchText={(item) => item.name}
      banner={
        <Space wrap size={8}>
          {select(
            'type',
            t('templates2d.buildingType'),
            TYPE_IDS.map((id) => ({ value: id, label: typeLabel(id) }))
          )}
          {select(
            'floors',
            t('templates2d.floors'),
            FLOOR_COUNTS.map((count) => ({ value: count, label: t('templates2d.floorsValue', { count }) }))
          )}
          {select('status', t('templates2d.status'), [
            { value: 'active', label: 'Active' },
            { value: 'inactive', label: 'Inactive' }
          ])}
        </Space>
      }
      createItem={(): HandbookTemplate => ({
        id: newAdminId('tpl'),
        name: '',
        kind: '2d',
        styleLabel: '',
        specs: { buildingTypeLabel: '', floorLabel: '' },
        description: [],
        floors: [{ id: newAdminId('floor'), label: '' }],
        tags: {},
        status: 'inactive',
        floorCount: 1
      })}
      toFormValues={(item) => {
        const count = Math.min(3, Math.max(1, item.floorCount ?? item.floors.length))
        return {
          ...item,
          floorCount: count,
          floors: Array.from(
            { length: count },
            (_, index) => item.floors[index] ?? { id: newAdminId('floor'), label: '' }
          ),
          descriptionText: item.description.join('\n\n')
        }
      }}
      fromFormValues={toRecord}
      deleteConfirm={(item) => <Text>{t('templates2d.deleteConfirm', { name: item.name })}</Text>}
      rowActions={(item) => {
        const problem = templateProblem(item)
        const active = statusOf(item) === 'active'
        return (
          <StatusSwitch
            name={item.name}
            current={active ? 'Active' : 'Inactive'}
            next={active ? 'Inactive' : 'Active'}
            blockedReason={!active && problem ? t(`templates2d.problems.${problem}`) : null}
            onConfirm={async () => {
              await save.mutateAsync({ ...item, status: active ? 'inactive' : 'active' })
              message.success(t('feedback.saved'))
            }}
          />
        )
      }}
      renderView={(item) => (
        <Space orientation='vertical' size={16} style={{ width: '100%' }}>
          <Descriptions
            size='small'
            column={1}
            bordered
            items={[
              { key: 'name', label: t('templates2d.name'), children: item.name },
              { key: 'type', label: t('templates2d.buildingType'), children: typeLabel(item.buildingTypeId) },
              {
                key: 'floors',
                label: t('templates2d.floors'),
                children: t('templates2d.floorsValue', { count: item.floorCount ?? item.floors.length })
              },
              {
                key: 'lot',
                label: t('templates2d.lot'),
                children: `${formatMeters(item.lotWidth ?? 0)} × ${formatMeters(item.lotLength ?? 0)} m`
              },
              { key: 'area', label: t('templates2d.area'), children: `${formatMeters(item.area ?? 0)} m²` },
              {
                key: 'status',
                label: t('templates2d.status'),
                children: statusOf(item) === 'active' ? 'Active' : 'Inactive'
              }
            ]}
          />
          <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
            {item.floors.slice(0, item.floorCount ?? item.floors.length).map((floor, index) => (
              <div key={floor.id}>
                <Text strong>{t('templates2d.floorN', { index: index + 1 })}</Text>
                {floor.imageUrl ? (
                  <Image src={floor.imageUrl} alt='' style={{ borderRadius: 8, marginTop: 6 }} />
                ) : (
                  <Text type='danger' style={{ display: 'block', marginTop: 6 }}>
                    {t('templates2d.missingImage')}
                  </Text>
                )}
              </div>
            ))}
          </div>
          {item.description.map((paragraph) => (
            <Paragraph key={paragraph} style={{ margin: 0 }}>
              {paragraph}
            </Paragraph>
          ))}
        </Space>
      )}
      columns={[
        {
          title: t('templates2d.name'),
          dataIndex: 'name',
          render: (_, record) => (
            <Space size={10}>
              {record.imageUrl ? (
                <Image
                  src={record.imageUrl}
                  alt=''
                  width={56}
                  height={40}
                  style={{ objectFit: 'cover', borderRadius: 6 }}
                />
              ) : (
                <span className='inline-block h-10 w-14 rounded-md bg-[var(--admin-placeholder)]' />
              )}
              <Text strong>{record.name}</Text>
            </Space>
          )
        },
        {
          title: t('templates2d.buildingType'),
          key: 'type',
          width: 160,
          render: (_, record) => <Tag>{typeLabel(record.buildingTypeId)}</Tag>
        },
        {
          title: t('templates2d.floors'),
          key: 'floors',
          width: 110,
          render: (_, record) => (
            <Tag>{t('templates2d.floorsValue', { count: record.floorCount ?? record.floors.length })}</Tag>
          )
        },
        {
          title: t('templates2d.status'),
          key: 'status',
          width: 110,
          render: (_, record) => (
            <Tag color={statusOf(record) === 'active' ? 'green' : 'default'}>
              {statusOf(record) === 'active' ? 'Active' : 'Inactive'}
            </Tag>
          )
        }
      ]}
      renderForm={(form) => <Template2DFields form={form} typeLabel={typeLabel} />}
    />
  )
}

function Template2DFields({ form, typeLabel }: { form: FormInstance; typeLabel: (id?: string) => string }) {
  const t = useTranslations('admin')
  const { modal } = App.useApp()
  const count = (Form.useWatch('floorCount', form) as number | undefined) ?? 1
  const positive = (label: string) => [
    { required: true, message: t('fields.requiredMessage') },
    { type: 'number' as const, min: 0.01, message: t('templates2d.positive', { field: label }) }
  ]

  /** Đổi quy mô: tăng thì thêm ô ảnh trống bắt buộc; giảm phải xác nhận bỏ ảnh tầng thừa (§4). */
  const changeFloors = (next: number) => {
    const previous = (form.getFieldValue('floorCount') as number | undefined) ?? 1
    const floors = (form.getFieldValue('floors') as HandbookTemplate['floors'] | undefined) ?? []
    const apply = () =>
      form.setFieldsValue({
        floorCount: next,
        floors: Array.from({ length: next }, (_, index) => floors[index] ?? { id: newAdminId('floor'), label: '' })
      })
    if (next < previous && floors.slice(next).some((floor) => floor.imageUrl)) {
      modal.confirm({
        title: t('templates2d.reduceTitle'),
        content: t('templates2d.reduceBody', { from: previous, to: next }),
        okText: t('actions.confirm'),
        cancelText: t('actions.cancel'),
        onOk: apply
      })
      return
    }
    apply()
  }

  return (
    <>
      <Form.Item
        name='name'
        label={t('templates2d.name')}
        rules={[
          { required: true, whitespace: true, message: t('fields.requiredMessage') },
          { max: 100, message: t('fields.maxLength', { max: 100 }) }
        ]}
      >
        <Input maxLength={100} showCount />
      </Form.Item>
      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Form.Item
            name='buildingTypeId'
            label={t('templates2d.buildingType')}
            rules={[{ required: true, message: t('fields.requiredMessage') }]}
          >
            <Select options={TYPE_IDS.map((id) => ({ value: id, label: typeLabel(id) }))} />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          {/* Giá trị do `changeFloors` ghi — Select tự quản lý để còn hỏi xác nhận khi giảm tầng. */}
          <Form.Item label={t('templates2d.floors')} required>
            <Select
              value={count}
              onChange={changeFloors}
              options={FLOOR_COUNTS.map((value) => ({ value, label: t('templates2d.floorsValue', { count: value }) }))}
            />
          </Form.Item>
          <Form.Item name='floorCount' hidden>
            <InputNumber />
          </Form.Item>
        </Col>
        <Col xs={8}>
          <Form.Item name='lotWidth' label={t('templates2d.lotWidth')} rules={positive(t('templates2d.lotWidth'))}>
            <InputNumber min={0} step={0.1} suffix='m' style={{ width: '100%' }} />
          </Form.Item>
        </Col>
        <Col xs={8}>
          <Form.Item name='lotLength' label={t('templates2d.lotLength')} rules={positive(t('templates2d.lotLength'))}>
            <InputNumber min={0} step={0.1} suffix='m' style={{ width: '100%' }} />
          </Form.Item>
        </Col>
        <Col xs={8}>
          <Form.Item name='area' label={t('templates2d.area')} rules={positive(t('templates2d.area'))}>
            <InputNumber min={0} step={0.1} suffix='m²' style={{ width: '100%' }} />
          </Form.Item>
        </Col>
      </Row>

      <Text strong style={{ display: 'block', marginBottom: 8 }}>
        {t('templates2d.floorImages')}
      </Text>
      <Text type='secondary' style={{ display: 'block', marginBottom: 12, fontSize: 12 }}>
        {t('templates2d.floorImagesHint')}
      </Text>
      {Array.from({ length: count }, (_, index) => (
        <ImageUrlField
          key={index}
          form={form}
          name={['floors', index, 'imageUrl']}
          label={t('templates2d.floorN', { index: index + 1 })}
          required
        />
      ))}

      <Form.Item
        name='descriptionText'
        label={t('templates2d.descriptionLabel')}
        rules={[{ max: 1000, message: t('fields.maxLength', { max: 1000 }) }]}
      >
        <Input.TextArea rows={4} maxLength={1000} showCount />
      </Form.Item>
    </>
  )
}
