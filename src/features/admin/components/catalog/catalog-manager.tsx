'use client'

import { Alert, Col, Form, Input, InputNumber, Row, Segmented, Select, Switch, Tag, Typography } from 'antd'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

import type { CmsBuildingTypeOption, CmsStyleOption } from '@/shared/cms'
import { useAdminCollection } from '../../hooks/use-admin-data'
import { newAdminId } from '../../services/admin.service'
import { ImageUrlField } from '../common/field-kit'
import { ResourceManager } from '../common/resource-manager'

const { Text } = Typography

/**
 * Danh mục Bước 1 (mục X, #6): loại công trình và kiểu kiến trúc & phong cách.
 *
 * Bước 1 đọc thẳng bảng này (`features/design` → `design-catalog.service`): bật /
 * tắt, đổi thứ tự và đổi nhãn có hiệu lực ngay. Riêng MÃ vẫn phải trùng union đã
 * khai trong `features/design/constants` — mã còn kéo theo trường điều kiện, ảnh
 * minh họa và khóa dịch, nên mã lạ bị bỏ qua thay vì làm vỡ luồng.
 */
export function CatalogManager() {
  const t = useTranslations('admin')
  const [tab, setTab] = useState<'styles' | 'buildingTypes'>('styles')
  const { data: buildingTypes } = useAdminCollection('buildingTypes')

  const switcher = (
    <Segmented
      value={tab}
      onChange={(value) => setTab(value as 'styles' | 'buildingTypes')}
      options={[
        { label: t('catalog.styles'), value: 'styles' },
        { label: t('catalog.buildingTypes'), value: 'buildingTypes' }
      ]}
    />
  )

  const notice = <Alert type='info' showIcon title={t('catalog.liveNote')} />

  if (tab === 'buildingTypes') {
    return (
      <ResourceManager
        collection='buildingTypes'
        title={t('nav.catalog')}
        description={t('catalog.buildingTypesDescription')}
        extraActions={switcher}
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

  return (
    <ResourceManager
      collection='styleOptions'
      title={t('nav.catalog')}
      description={t('catalog.stylesDescription')}
      extraActions={switcher}
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
