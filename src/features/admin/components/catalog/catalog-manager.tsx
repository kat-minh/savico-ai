'use client'

import { Alert, Col, Form, Input, InputNumber, Row, Select, Switch, Tabs, Tag, Typography } from 'antd'
import { useTranslations } from 'next-intl'

import type { CmsBuildingTypeOption, CmsStyleOption } from '@/shared/cms'
import { useAdminCollection } from '../../hooks/use-admin-data'
import { newAdminId } from '../../services/admin.service'
import { ImageUrlField } from '../common/field-kit'
import { AdminPanelScope } from '../common/admin-page'
import { ResourceManager } from '../common/resource-manager'

const { Paragraph, Text, Title } = Typography

/**
 * Danh mục Bước 1 (mục X, #6): loại công trình và kiểu kiến trúc & phong cách.
 *
 * Bước 1 đọc thẳng bảng này (`features/design` → `design-catalog.service`): bật /
 * tắt, đổi thứ tự và đổi nhãn có hiệu lực ngay. Riêng MÃ vẫn phải trùng union đã
 * khai trong `features/design/constants` — mã còn kéo theo trường điều kiện, ảnh
 * minh họa và khóa dịch, nên mã lạ bị bỏ qua thay vì làm vỡ luồng.
 */
/**
 * Hai bảng của Danh mục Bước 1 là hai TAB, không phải một `Segmented` nhét cạnh
 * nút "Thêm mới" — bộ chọn dữ liệu mà đứng chung hàng với nút hành động thì
 * trông y như một cái nút nữa.
 */
export function CatalogManager() {
  const t = useTranslations('admin')

  return (
    <div className='flex flex-col gap-2'>
      <div>
        <Title level={4} style={{ margin: 0 }}>
          {t('nav.catalog')}
        </Title>
        <Paragraph type='secondary' style={{ margin: '4px 0 0', maxWidth: 780 }}>
          {t('catalog.description')}
        </Paragraph>
      </div>
      <Tabs
        items={[
          {
            key: 'styles',
            label: t('catalog.styles'),
            // `AdminPanelScope` bảo `AdminPage` bên trong bỏ tiêu đề đi, nếu không
            // nhãn tab và tiêu đề bảng sẽ nói đúng một câu hai lần.
            children: (
              <AdminPanelScope>
                <StyleOptionTable />
              </AdminPanelScope>
            )
          },
          {
            key: 'buildingTypes',
            label: t('catalog.buildingTypes'),
            children: (
              <AdminPanelScope>
                <BuildingTypeTable />
              </AdminPanelScope>
            )
          }
        ]}
      />
    </div>
  )
}

function BuildingTypeTable() {
  const t = useTranslations('admin')
  const notice = <Alert type='info' showIcon title={t('catalog.liveNote')} />

  return (
    <ResourceManager
      collection='buildingTypes'
      title={t('catalog.buildingTypes')}
      description={t('catalog.buildingTypesDescription')}
      banner={notice}
      drawerWidth={480}
      searchText={(item) => `${item.id} ${item.label}`}
      createItem={(): CmsBuildingTypeOption => ({
        id: newAdminId('bt'),
        label: '',
        enabled: true,
        order: 99
      })}
      columns={[
        { title: t('catalog.order'), dataIndex: 'order', width: 90, sorter: (a, b) => a.order - b.order },
        { title: t('catalog.label'), dataIndex: 'label' },
        {
          title: t('catalog.id'),
          dataIndex: 'id',
          width: 160,
          render: (id: string) => <Text code>{id}</Text>
        },
        {
          title: t('catalog.enabled'),
          dataIndex: 'enabled',
          width: 110,
          render: (enabled: boolean) => (
            <Tag color={enabled ? 'green' : 'default'}>
              {enabled ? t('catalog.enabledYes') : t('catalog.enabledNo')}
            </Tag>
          )
        }
      ]}
      renderForm={() => (
        <>
          <Form.Item name='id' label={t('catalog.id')} tooltip={t('catalog.idHint')}>
            <Input />
          </Form.Item>
          <Form.Item
            name='label'
            label={t('catalog.label')}
            rules={[{ required: true, message: t('fields.requiredMessage') }]}
          >
            <Input />
          </Form.Item>
          <Row gutter={16}>
            <Col xs={12}>
              <Form.Item name='order' label={t('catalog.order')}>
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={12}>
              <Form.Item name='enabled' label={t('catalog.enabled')} valuePropName='checked'>
                <Switch />
              </Form.Item>
            </Col>
          </Row>
        </>
      )}
    />
  )
}

function StyleOptionTable() {
  const t = useTranslations('admin')
  const { data: buildingTypes } = useAdminCollection('buildingTypes')
  const notice = <Alert type='info' showIcon title={t('catalog.liveNote')} />

  return (
    <ResourceManager
      collection='styleOptions'
      title={t('catalog.styles')}
      description={t('catalog.stylesDescription')}
      banner={notice}
      drawerWidth={520}
      searchText={(item) => `${item.id} ${item.label}`}
      createItem={(): CmsStyleOption => ({
        id: newAdminId('style'),
        label: '',
        imageUrl: '',
        buildingTypeIds: [],
        enabled: true,
        order: 99
      })}
      columns={[
        { title: t('catalog.order'), dataIndex: 'order', width: 90, sorter: (a, b) => a.order - b.order },
        {
          title: t('catalog.label'),
          dataIndex: 'label',
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
              ) : null}
              <Text strong>{record.label}</Text>
            </div>
          )
        },
        {
          title: t('catalog.appliesTo'),
          dataIndex: 'buildingTypeIds',
          render: (ids: string[]) => (
            <span>
              {ids.map((id) => (
                <Tag key={id}>{(buildingTypes ?? []).find((type) => type.id === id)?.label ?? id}</Tag>
              ))}
            </span>
          )
        },
        {
          title: t('catalog.enabled'),
          dataIndex: 'enabled',
          width: 110,
          render: (enabled: boolean) => (
            <Tag color={enabled ? 'green' : 'default'}>
              {enabled ? t('catalog.enabledYes') : t('catalog.enabledNo')}
            </Tag>
          )
        }
      ]}
      renderForm={(form) => (
        <>
          <Form.Item name='id' label={t('catalog.id')} tooltip={t('catalog.idHint')}>
            <Input />
          </Form.Item>
          <Form.Item
            name='label'
            label={t('catalog.label')}
            rules={[{ required: true, message: t('fields.requiredMessage') }]}
          >
            <Input />
          </Form.Item>
          <ImageUrlField form={form} name='imageUrl' label={t('catalog.image')} />
          <Form.Item name='buildingTypeIds' label={t('catalog.appliesTo')} tooltip={t('catalog.appliesToHint')}>
            <Select
              mode='multiple'
              options={(buildingTypes ?? []).map((type) => ({ label: type.label, value: type.id }))}
            />
          </Form.Item>
          <Row gutter={16}>
            <Col xs={12}>
              <Form.Item name='order' label={t('catalog.order')}>
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={12}>
              <Form.Item name='enabled' label={t('catalog.enabled')} valuePropName='checked'>
                <Switch />
              </Form.Item>
            </Col>
          </Row>
        </>
      )}
    />
  )
}
