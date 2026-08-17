'use client'

import { DeleteOutlined, PictureOutlined, PlusOutlined } from '@ant-design/icons'
import { Button, Col, Form, Image, Input, InputNumber, Row, Select, Space, Switch, Tag, Typography } from 'antd'
import type { FormInstance, FormListFieldData } from 'antd/es/form'
import { useTranslations } from 'next-intl'

import type { HandbookTemplate } from '@/shared/cms'
import { ImageUrlField, StringListField } from '../common/field-kit'
import { ResourceManager } from '../common/resource-manager'
import { newAdminId } from '../../services/admin.service'

const { Text } = Typography

/** Preset bản vẽ SVG dùng khi tầng chưa có ảnh thật (`PlanDrawing`). */
const PLAN_VARIANTS = ['default', 'ground', 'upper', 'attic', 'roof'] as const

/**
 * Một dòng tầng. Tách thành component riêng vì ô xem trước phải `useWatch` theo
 * đường dẫn tuyệt đối `['floors', i, 'imageUrl']` — trong khi `Form.Item` nằm
 * trong `Form.List` lại dùng đường dẫn tương đối.
 */
function FloorRow({
  form,
  field,
  index,
  onRemove
}: {
  form: FormInstance
  field: FormListFieldData
  index: number
  onRemove: () => void
}) {
  const t = useTranslations('admin')
  const imageUrl = Form.useWatch(['floors', field.name, 'imageUrl'], form) as string | undefined

  return (
    <div style={{ border: '1px solid var(--admin-border)', borderRadius: 10, padding: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
        <Text strong style={{ flex: 1 }}>
          {t('templates.floorIndex', { index: index + 1 })}
        </Text>
        <Button
          type='text'
          danger
          size='small'
          icon={<DeleteOutlined />}
          aria-label={t('actions.removeRow')}
          onClick={onRemove}
        />
      </div>

      <Row gutter={12}>
        <Col xs={24} md={12}>
          <Form.Item name={[field.name, 'label']} label={t('templates.floorLabel')} style={{ marginBottom: 10 }}>
            <Input placeholder={t('templates.floorLabelPlaceholder')} />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item
            name={[field.name, 'planVariant']}
            label={t('templates.floorPlanVariant')}
            tooltip={t('templates.floorPlanVariantHint')}
            style={{ marginBottom: 10 }}
          >
            <Select
              allowClear
              options={PLAN_VARIANTS.map((variant) => ({
                label: t(`templates.planVariants.${variant}`),
                value: variant
              }))}
            />
          </Form.Item>
        </Col>
      </Row>

      <Form.Item label={t('templates.floorImage')} tooltip={t('fields.imageUrlHint')} style={{ marginBottom: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div
            style={{
              width: 84,
              height: 60,
              flexShrink: 0,
              borderRadius: 8,
              overflow: 'hidden',
              background: 'var(--admin-placeholder)',
              display: 'grid',
              placeItems: 'center'
            }}
          >
            {imageUrl ? (
              <Image src={imageUrl} alt='' width={84} height={60} style={{ objectFit: 'cover' }} />
            ) : (
              <Text type='secondary' style={{ fontSize: 11 }}>
                {t('templates.floorDrawn')}
              </Text>
            )}
          </div>
          <Form.Item name={[field.name, 'imageUrl']} noStyle>
            <Input placeholder='https://…' style={{ flex: 1 }} />
          </Form.Item>
        </div>
      </Form.Item>
    </div>
  )
}

/**
 * Các tầng của một mẫu — mỗi tầng là một nút chuyển ở trang chi tiết mẫu.
 *
 * Đây là chỗ thay ảnh render thật: điền `imageUrl` cho tầng nào thì tầng đó
 * hiện ảnh, bỏ trống thì `PlanDrawing` vẽ bản vẽ SVG theo preset đã chọn.
 */
function TemplateFloorsField({ form }: { form: FormInstance }) {
  const t = useTranslations('admin')

  return (
    <Form.Item label={t('templates.floorsGroup')} tooltip={t('templates.floorsHint')} style={{ marginBottom: 16 }}>
      <Form.List name='floors'>
        {(fields, { add, remove }) => (
          <Space orientation='vertical' size={12} style={{ width: '100%' }}>
            {fields.map((field, index) => (
              <FloorRow key={field.key} form={form} field={field} index={index} onRemove={() => remove(field.name)} />
            ))}
            <Button
              type='dashed'
              block
              icon={<PlusOutlined />}
              onClick={() => add({ id: newAdminId('floor'), label: '', imageUrl: '', planVariant: 'default' })}
            >
              {t('templates.addFloor')}
            </Button>
          </Space>
        )}
      </Form.List>
    </Form.Item>
  )
}

/**
 * Thư viện mẫu của Cẩm nang (mục VI, Phần 2): mẫu bản vẽ 2D và mẫu nội thất 3D.
 *
 * Tag (loại công trình, số tầng, tum, kiểu kiến trúc, phong cách nội thất) là
 * thứ quyết định mẫu nào hiện ở panel "Cẩm nang cá nhân hóa" của màn chờ Bước 2
 * và Bước 3 — nên form đặt riêng một khối cho chúng.
 */
export function TemplateManager() {
  const t = useTranslations('admin')

  return (
    <ResourceManager
      collection='handbookTemplates'
      title={t('nav.templates')}
      description={t('templates.description')}
      drawerWidth={640}
      searchText={(item) => `${item.name} ${item.styleLabel} ${item.specs.buildingTypeLabel}`}
      createItem={(): HandbookTemplate => ({
        id: newAdminId('tpl'),
        name: '',
        kind: '3d',
        imageUrl: '',
        styleLabel: '',
        specs: { buildingTypeLabel: '', floorLabel: '' },
        description: [''],
        floors: [],
        tags: {}
      })}
      columns={[
        {
          title: t('templates.name'),
          dataIndex: 'name',
          render: (_, record) => (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {record.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={record.imageUrl}
                  alt=''
                  width={44}
                  height={32}
                  style={{ objectFit: 'cover', borderRadius: 6, flexShrink: 0 }}
                />
              ) : (
                // Mẫu 2D chưa có ảnh render — trang chi tiết tự vẽ bản vẽ SVG,
                // nên ô này để trống sẽ khiến người vận hành tưởng ảnh hỏng.
                <span
                  style={{
                    width: 44,
                    height: 32,
                    borderRadius: 6,
                    background: 'var(--admin-placeholder)',
                    flexShrink: 0,
                    display: 'grid',
                    placeItems: 'center',
                    color: 'var(--admin-muted)'
                  }}
                >
                  <PictureOutlined />
                </span>
              )}
              <div style={{ minWidth: 0 }}>
                <Text strong ellipsis style={{ display: 'block' }}>
                  {record.name}
                </Text>
                <Text type='secondary' style={{ fontSize: 12 }}>
                  {record.specs.buildingTypeLabel}
                </Text>
              </div>
            </div>
          )
        },
        {
          title: t('templates.kind'),
          dataIndex: 'kind',
          width: 90,
          filters: [
            { text: t('templates.kind2d'), value: '2d' },
            { text: t('templates.kind3d'), value: '3d' }
          ],
          onFilter: (value, record) => record.kind === value,
          render: (kind: HandbookTemplate['kind']) => (
            <Tag color={kind === '2d' ? 'blue' : 'green'}>
              {kind === '2d' ? t('templates.kind2d') : t('templates.kind3d')}
            </Tag>
          )
        },
        { title: t('templates.style'), dataIndex: 'styleLabel', width: 180 },
        {
          title: t('templates.scale'),
          key: 'scale',
          width: 150,
          render: (_, record) => record.specs.floorLabel
        },
        {
          title: t('templates.floors'),
          key: 'floors',
          width: 90,
          render: (_, record) => record.floors.length
        }
      ]}
      renderForm={(form) => (
        <>
          <Row gutter={16}>
            <Col xs={24} md={16}>
              <Form.Item
                name='name'
                label={t('templates.name')}
                rules={[{ required: true, message: t('fields.requiredMessage') }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name='kind' label={t('templates.kind')}>
                <Select
                  options={[
                    { label: t('templates.kind2d'), value: '2d' },
                    { label: t('templates.kind3d'), value: '3d' }
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>

          <ImageUrlField form={form} name='imageUrl' label={t('templates.cover')} />

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item name='styleLabel' label={t('templates.style')}>
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name={['specs', 'buildingTypeLabel']} label={t('templates.buildingType')}>
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name={['specs', 'floorLabel']} label={t('templates.scale')}>
                <Input placeholder={t('templates.scalePlaceholder')} />
              </Form.Item>
            </Col>
            <Col xs={12} md={6}>
              <Form.Item name={['specs', 'lotSize']} label={t('templates.lotSize')}>
                <Input placeholder='5 × 20 m' />
              </Form.Item>
            </Col>
            <Col xs={12} md={6}>
              <Form.Item name={['specs', 'floorArea']} label={t('templates.floorArea')}>
                <Input placeholder='100 m²' />
              </Form.Item>
            </Col>
          </Row>

          <StringListField
            name='description'
            label={t('templates.descriptionField')}
            placeholder={t('templates.descriptionPlaceholder')}
            textarea
          />

          <TemplateFloorsField form={form} />

          <Text strong>{t('templates.tagsGroup')}</Text>
          <Text type='secondary' style={{ display: 'block', marginBottom: 12 }}>
            {t('templates.tagsHint')}
          </Text>
          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item name={['tags', 'buildingType']} label={t('templates.tagBuildingType')}>
                <Input placeholder='townhouse' />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name={['tags', 'floorCount']} label={t('templates.tagFloorCount')}>
                <Input placeholder='ground+1' />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name={['tags', 'hasAttic']} label={t('templates.tagHasAttic')} valuePropName='checked'>
                <Switch />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name={['tags', 'architectureStyle']} label={t('templates.tagArchitecture')}>
                <Input placeholder='modern' />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name={['tags', 'interiorStyle']} label={t('templates.tagInterior')}>
                <Input placeholder='minimal' />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name={['specs', 'imageCount']} label={t('templates.imageCount')}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
        </>
      )}
    />
  )
}
