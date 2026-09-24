'use client'

import { Col, Form, Input, InputNumber, Row, Select, Switch, Tag, Typography } from 'antd'
import { useTranslations } from 'next-intl'

import type { CmsStyleOption } from '@/shared/cms'
import { useAdminCollection } from '../../hooks/use-admin-data'
import { newAdminId } from '../../services/admin.service'
import { sameName } from '../../services/catalog.service'
import { ImageUrlField } from '../common/field-kit'
import { ResourceManager } from '../common/resource-manager'

const { Text } = Typography

/**
 * PHONG CÁCH KIẾN TRÚC / PHONG CÁCH NỘI THẤT (spec admin #1: hai danh mục CRUD).
 *
 * Người dùng chọn phong cách từ danh mục cấu hình sẵn ở form hồ sơ dự án
 * (STORY-004), danh mục hiển thị đổi theo loại công trình. Hai danh mục chung
 * một bảng, phân biệt bằng `kind` — mỗi danh mục là một mục menu riêng.
 */
export function StyleManager({ kind }: { kind: CmsStyleOption['kind'] }) {
  const t = useTranslations('admin')
  const { data: buildingTypes = [] } = useAdminCollection('buildingTypes')
  const { data: styles = [] } = useAdminCollection('styleOptions')
  const ofKind = styles.filter((style) => style.kind === kind)
  const typeLabel = (id: string) => buildingTypes.find((type) => type.id === id)?.label ?? id

  return (
    <ResourceManager
      collection='styleOptions'
      title={t(kind === 'architecture' ? 'nav.architectureStyles' : 'nav.interiorStyles')}
      description={t(kind === 'architecture' ? 'styles.architectureDescription' : 'styles.interiorDescription')}
      drawerWidth={520}
      filterItems={(item) => item.kind === kind}
      searchText={(item) => item.label}
      createItem={(): CmsStyleOption => ({
        id: newAdminId('style'),
        kind,
        label: '',
        imageUrl: '',
        buildingTypeIds: [],
        enabled: true,
        order: ofKind.length + 1
      })}
      fromFormValues={(values, current) => ({ ...current, ...values, label: String(values.label ?? '').trim() })}
      validate={(next) =>
        ofKind.some((style) => style.id !== next.id && sameName(style.label, next.label))
          ? t('styles.duplicateName')
          : null
      }
      columns={[
        { title: t('styles.order'), dataIndex: 'order', width: 90, sorter: (a, b) => a.order - b.order },
        {
          title: t('styles.name'),
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
          title: t('styles.appliesTo'),
          dataIndex: 'buildingTypeIds',
          render: (ids: string[]) => (
            <span>
              {ids.map((id) => (
                <Tag key={id}>{typeLabel(id)}</Tag>
              ))}
            </span>
          )
        },
        {
          title: t('styles.status'),
          dataIndex: 'enabled',
          width: 130,
          render: (enabled: boolean) => (
            <Tag color={enabled ? 'green' : 'default'}>{enabled ? t('styles.shown') : t('styles.hidden')}</Tag>
          )
        }
      ]}
      renderForm={(form) => (
        <>
          <Form.Item
            name='label'
            label={t('styles.name')}
            rules={[
              { required: true, whitespace: true, message: t('fields.requiredMessage') },
              { max: 100, message: t('fields.maxLength', { max: 100 }) }
            ]}
          >
            <Input maxLength={100} />
          </Form.Item>
          <ImageUrlField form={form} name='imageUrl' label={t('styles.image')} />
          <Form.Item name='buildingTypeIds' label={t('styles.appliesTo')} tooltip={t('styles.appliesToHint')}>
            <Select
              mode='multiple'
              options={buildingTypes
                .filter((type) => type.status === 'active')
                .map((type) => ({ label: type.label, value: type.id }))}
            />
          </Form.Item>
          <Row gutter={16}>
            <Col xs={12}>
              <Form.Item name='order' label={t('styles.order')}>
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={12}>
              <Form.Item name='enabled' label={t('styles.status')} valuePropName='checked'>
                <Switch />
              </Form.Item>
            </Col>
          </Row>
        </>
      )}
    />
  )
}
