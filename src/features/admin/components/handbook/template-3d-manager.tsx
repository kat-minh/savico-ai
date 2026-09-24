'use client'

import { DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import { App, Button, Col, Descriptions, Form, Image, Input, Row, Select, Space, Tag, Typography } from 'antd'
import type { FormInstance } from 'antd'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

import type { HandbookTemplate } from '@/shared/cms'
import { useAdminCollection, useSaveAdminItem } from '../../hooks/use-admin-data'
import { newAdminId } from '../../services/admin.service'
import { templateProblem } from '../../services/template.service'
import { ImageUrlField, StatusSwitch } from '../common/field-kit'
import { ResourceManager } from '../common/resource-manager'

const { Text, Paragraph } = Typography

interface Filters {
  style?: string
  status?: 'active' | 'inactive'
}

/**
 * MẪU NỘI THẤT / KHÔNG GIAN 3D (spec admin #2) — một mẫu là MỘT phòng với nhiều
 * ảnh. Cùng vòng đời với mẫu 2D: mặc định Inactive, chỉ Active khi có phong cách
 * nội thất và ít nhất một ảnh; chỉ mẫu Active hiện ở thư viện phía người dùng.
 */
export function Template3DManager() {
  const t = useTranslations('admin')
  const { message } = App.useApp()
  const [filters, setFilters] = useState<Filters>({})
  const { data: styles = [] } = useAdminCollection('styleOptions')
  const { data: buildingTypes = [] } = useAdminCollection('buildingTypes')
  const save = useSaveAdminItem('handbookTemplates')
  const interiorStyles = styles.filter((style) => style.kind === 'interior')
  const styleLabel = (id?: string) => interiorStyles.find((style) => style.id === id)?.label ?? id ?? '-'
  const typeLabel = (id?: string) => buildingTypes.find((type) => type.id === id)?.label ?? ''
  const statusOf = (item: HandbookTemplate) => item.status ?? 'active'

  const matches = (item: HandbookTemplate) =>
    item.kind === '3d' &&
    (!filters.style || item.interiorStyleId === filters.style) &&
    (!filters.status || statusOf(item) === filters.status)

  return (
    <ResourceManager
      collection='handbookTemplates'
      title={t('nav.templates3d')}
      description={t('templates3d.description')}
      drawerWidth={720}
      filterItems={matches}
      filterKey={JSON.stringify(filters)}
      searchText={(item) => item.name}
      banner={
        <Space wrap size={8}>
          <Select
            allowClear
            placeholder={t('templates3d.style')}
            value={filters.style}
            onChange={(style?: string) => setFilters((prev) => ({ ...prev, style }))}
            options={interiorStyles.map((style) => ({ value: style.id, label: style.label }))}
            style={{ minWidth: 200 }}
          />
          <Select
            allowClear
            placeholder={t('templates2d.status')}
            value={filters.status}
            onChange={(status?: Filters['status']) => setFilters((prev) => ({ ...prev, status }))}
            options={[
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' }
            ]}
            style={{ minWidth: 150 }}
          />
        </Space>
      }
      createItem={(): HandbookTemplate => ({
        id: newAdminId('tpl'),
        name: '',
        kind: '3d',
        styleLabel: '',
        specs: { buildingTypeLabel: '', floorLabel: '' },
        description: [],
        floors: [{ id: newAdminId('view'), label: '' }],
        tags: {},
        status: 'inactive'
      })}
      toFormValues={(item) => ({ ...item, descriptionText: item.description.join('\n\n') })}
      fromFormValues={(values, current): HandbookTemplate => {
        const next = { ...current, ...values } as HandbookTemplate & { descriptionText?: string }
        const { descriptionText, ...rest } = next
        const floors = (next.floors ?? [])
          .filter((floor) => floor.imageUrl?.trim())
          .map((floor, index) => ({
            id: floor.id || newAdminId('view'),
            label: floor.label?.trim() || t('templates3d.imageN', { index: index + 1 }),
            imageUrl: floor.imageUrl?.trim()
          }))
        const style = interiorStyles.find((item) => item.id === next.interiorStyleId)
        return {
          ...rest,
          name: next.name.trim(),
          room: next.room?.trim() || undefined,
          floors,
          imageUrl: floors[0]?.imageUrl,
          styleLabel: style?.label ?? '',
          specs: {
            ...next.specs,
            buildingTypeLabel: typeLabel(next.buildingTypeId),
            floorLabel: next.room?.trim() ?? '',
            imageCount: floors.length
          },
          description: (descriptionText ?? '')
            .split(/\n{2,}/)
            .map((item) => item.trim())
            .filter(Boolean),
          tags: {
            ...next.tags,
            buildingType: next.buildingTypeId,
            // Tag phong cách của panel cá nhân hóa dùng mã ngắn (`modern`, `minimal`…).
            interiorStyle: next.interiorStyleId?.replace(/^in-/, '').replace('minimalism', 'minimal')
          }
        }
      }}
      validate={(next) => (next.floors.length ? null : t('templates3d.imagesRequired'))}
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
              { key: 'room', label: t('templates3d.room'), children: item.room || '-' },
              { key: 'style', label: t('templates3d.style'), children: styleLabel(item.interiorStyleId) },
              { key: 'type', label: t('templates2d.buildingType'), children: typeLabel(item.buildingTypeId) || '-' },
              {
                key: 'status',
                label: t('templates2d.status'),
                children: statusOf(item) === 'active' ? 'Active' : 'Inactive'
              }
            ]}
          />
          <Image.PreviewGroup>
            <div className='grid grid-cols-2 gap-3'>
              {item.floors.map((floor) =>
                floor.imageUrl ? (
                  <div key={floor.id}>
                    <Image src={floor.imageUrl} alt='' style={{ borderRadius: 8 }} />
                    <Text type='secondary' style={{ fontSize: 12 }}>
                      {floor.label}
                    </Text>
                  </div>
                ) : null
              )}
            </div>
          </Image.PreviewGroup>
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
              <div>
                <Text strong style={{ display: 'block' }}>
                  {record.name}
                </Text>
                {record.room ? (
                  <Text type='secondary' style={{ fontSize: 12 }}>
                    {record.room}
                  </Text>
                ) : null}
              </div>
            </Space>
          )
        },
        {
          title: t('templates3d.style'),
          key: 'style',
          width: 200,
          render: (_, record) => <Tag>{styleLabel(record.interiorStyleId)}</Tag>
        },
        {
          title: t('templates3d.images'),
          key: 'images',
          width: 90,
          render: (_, record) => record.floors.filter((floor) => floor.imageUrl).length
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
      renderForm={(form) => (
        <Template3DFields
          form={form}
          styleOptions={interiorStyles.map((style) => ({ value: style.id, label: style.label }))}
          typeOptions={buildingTypes.map((type) => ({ value: type.id, label: type.label }))}
        />
      )}
    />
  )
}

function Template3DFields({
  form,
  styleOptions,
  typeOptions
}: {
  form: FormInstance
  styleOptions: { value: string; label: string }[]
  typeOptions: { value: string; label: string }[]
}) {
  const t = useTranslations('admin')
  const required = { required: true, whitespace: true, message: t('fields.requiredMessage') }

  return (
    <>
      <Form.Item
        name='name'
        label={t('templates2d.name')}
        rules={[required, { max: 100, message: t('fields.maxLength', { max: 100 }) }]}
      >
        <Input maxLength={100} showCount />
      </Form.Item>
      <Row gutter={16}>
        <Col xs={24} md={8}>
          <Form.Item
            name='room'
            label={t('templates3d.room')}
            rules={[required, { max: 60, message: t('fields.maxLength', { max: 60 }) }]}
          >
            <Input maxLength={60} placeholder={t('templates3d.roomPlaceholder')} />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item
            name='interiorStyleId'
            label={t('templates3d.style')}
            rules={[{ required: true, message: t('fields.requiredMessage') }]}
          >
            <Select options={styleOptions} />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item name='buildingTypeId' label={t('templates2d.buildingType')}>
            <Select allowClear options={typeOptions} />
          </Form.Item>
        </Col>
      </Row>

      <Text strong style={{ display: 'block', marginBottom: 8 }}>
        {t('templates3d.images')}
      </Text>
      <Form.List name='floors'>
        {(fields, { add, remove }) => (
          <Space orientation='vertical' size={8} style={{ width: '100%', marginBottom: 16 }}>
            {fields.map((field, index) => (
              <div key={field.key} className='flex items-start gap-2'>
                <div className='min-w-0 flex-1'>
                  <ImageUrlField
                    form={form}
                    name={['floors', field.name, 'imageUrl']}
                    label={t('templates3d.imageN', { index: index + 1 })}
                    required
                  />
                </div>
                <Button
                  type='text'
                  danger
                  icon={<DeleteOutlined />}
                  aria-label={t('actions.removeRow')}
                  disabled={fields.length === 1}
                  onClick={() => remove(field.name)}
                  style={{ marginTop: 30 }}
                />
              </div>
            ))}
            <Button
              type='dashed'
              block
              icon={<PlusOutlined />}
              onClick={() => add({ id: newAdminId('view'), label: '' })}
            >
              {t('templates3d.addImage')}
            </Button>
          </Space>
        )}
      </Form.List>

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
