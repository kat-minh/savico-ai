'use client'

import { DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import { Avatar, Button, Col, Form, Input, InputNumber, Rate, Row, Space, Tag, Typography } from 'antd'
import { useTranslations } from 'next-intl'

import type { Consultant } from '@/shared/cms'
import { newAdminId } from '../../services/admin.service'
import { ImageUrlField, StringListField } from '../common/field-kit'
import { ResourceManager } from '../common/resource-manager'

const { Text } = Typography

/**
 * Hồ sơ kiến trúc sư của trang Tư vấn 1:1 (mục VIII.1, Hình 14–15).
 *
 * Spec giao cho admin quản lý hồ sơ KTS, danh mục chuyên môn và công trình tiêu
 * biểu (mục X, #5). Thẻ lưới chỉ đọc hai chip chuyên môn đầu tiên và trang chi
 * tiết hiện 4 ảnh công trình — form nhắc đúng hai con số đó.
 */
export function ConsultantManager() {
  const t = useTranslations('admin')

  return (
    <ResourceManager
      collection='consultants'
      title={t('nav.consultants')}
      description={t('consultants.description')}
      drawerWidth={680}
      searchText={(item) => `${item.name} ${item.title} ${item.headline}`}
      createItem={(): Consultant => ({
        id: newAdminId('kts'),
        name: '',
        title: '',
        avatarUrl: '',
        specialties: [{ id: '', label: '' }],
        yearsExperience: 5,
        projectCount: 10,
        headline: '',
        bio: [''],
        rating: 5,
        reviewCount: 0,
        works: []
      })}
      columns={[
        {
          title: t('consultants.name'),
          dataIndex: 'name',
          render: (_, record) => (
            <Space size={10}>
              <Avatar src={record.avatarUrl} size={36}>
                {record.name.slice(0, 1)}
              </Avatar>
              <div style={{ minWidth: 0 }}>
                <Text strong style={{ display: 'block' }}>
                  {record.name}
                </Text>
                <Text type='secondary' style={{ fontSize: 12 }}>
                  {record.title}
                </Text>
              </div>
            </Space>
          )
        },
        {
          title: t('consultants.specialties'),
          key: 'specialties',
          width: 200,
          render: (_, record) => (
            <Space size={4} wrap>
              {record.specialties.map((specialty) => (
                <Tag key={specialty.id}>{specialty.label}</Tag>
              ))}
            </Space>
          )
        },
        {
          title: t('consultants.experience'),
          dataIndex: 'yearsExperience',
          width: 110,
          sorter: (a, b) => a.yearsExperience - b.yearsExperience,
          render: (years: number) => t('consultants.years', { years })
        },
        {
          title: t('consultants.projectCount'),
          dataIndex: 'projectCount',
          width: 110,
          sorter: (a, b) => a.projectCount - b.projectCount
        },
        {
          title: t('consultants.rating'),
          dataIndex: 'rating',
          width: 140,
          sorter: (a, b) => a.rating - b.rating,
          render: (rating: number, record) => (
            <Space size={6}>
              <Text strong>{rating.toFixed(1)}</Text>
              <Text type='secondary' style={{ fontSize: 12 }}>
                ({record.reviewCount})
              </Text>
            </Space>
          )
        }
      ]}
      renderForm={(form) => (
        <>
          <Row gutter={16}>
            <Col xs={24} md={14}>
              <Form.Item
                name='name'
                label={t('consultants.name')}
                rules={[{ required: true, message: t('fields.requiredMessage') }]}
              >
                <Input placeholder='KTS. Nguyễn Văn A' />
              </Form.Item>
            </Col>
            <Col xs={24} md={10}>
              <Form.Item name='title' label={t('consultants.title')}>
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <ImageUrlField form={form} name='avatarUrl' label={t('consultants.avatar')} />

          <Form.Item name='headline' label={t('consultants.headline')} tooltip={t('consultants.headlineHint')}>
            <Input.TextArea autoSize={{ minRows: 2, maxRows: 3 }} />
          </Form.Item>

          <StringListField name='bio' label={t('consultants.bio')} textarea />

          <Row gutter={16}>
            <Col xs={12} md={6}>
              <Form.Item name='yearsExperience' label={t('consultants.experience')}>
                <InputNumber min={0} max={60} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={12} md={6}>
              <Form.Item name='projectCount' label={t('consultants.projectCount')}>
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={12} md={6}>
              <Form.Item name='reviewCount' label={t('consultants.reviewCount')}>
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={12} md={6}>
              <Form.Item name='rating' label={t('consultants.rating')}>
                <InputNumber min={0} max={5} step={0.1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label={t('consultants.specialties')} tooltip={t('consultants.specialtiesHint')}>
            <Form.List name='specialties'>
              {(fields, { add, remove }) => (
                <Space orientation='vertical' size={8} style={{ width: '100%' }}>
                  {fields.map((field) => (
                    <Row key={field.key} gutter={8}>
                      <Col xs={10}>
                        <Form.Item name={[field.name, 'id']} noStyle>
                          <Input placeholder='id' />
                        </Form.Item>
                      </Col>
                      <Col xs={12}>
                        <Form.Item name={[field.name, 'label']} noStyle>
                          <Input placeholder={t('consultants.specialtyLabel')} />
                        </Form.Item>
                      </Col>
                      <Col xs={2}>
                        <Button
                          type='text'
                          danger
                          icon={<DeleteOutlined />}
                          aria-label={t('actions.removeRow')}
                          onClick={() => remove(field.name)}
                        />
                      </Col>
                    </Row>
                  ))}
                  <Button type='dashed' block icon={<PlusOutlined />} onClick={() => add({ id: '', label: '' })}>
                    {t('actions.addRow')}
                  </Button>
                </Space>
              )}
            </Form.List>
          </Form.Item>

          <Form.Item label={t('consultants.works')} tooltip={t('consultants.worksHint')}>
            <Form.List name='works'>
              {(fields, { add, remove }) => (
                <Space orientation='vertical' size={8} style={{ width: '100%' }}>
                  {fields.map((field) => (
                    <Row key={field.key} gutter={8}>
                      <Col xs={13}>
                        <Form.Item name={[field.name, 'imageUrl']} noStyle>
                          <Input placeholder='https://…' />
                        </Form.Item>
                      </Col>
                      <Col xs={9}>
                        <Form.Item name={[field.name, 'label']} noStyle>
                          <Input placeholder={t('consultants.workLabel')} />
                        </Form.Item>
                      </Col>
                      <Col xs={2}>
                        <Button
                          type='text'
                          danger
                          icon={<DeleteOutlined />}
                          aria-label={t('actions.removeRow')}
                          onClick={() => remove(field.name)}
                        />
                      </Col>
                    </Row>
                  ))}
                  <Button type='dashed' block icon={<PlusOutlined />} onClick={() => add({ imageUrl: '', label: '' })}>
                    {t('actions.addRow')}
                  </Button>
                </Space>
              )}
            </Form.List>
          </Form.Item>

          {/* Chỉ để xem lại nhanh mức sao đang đặt — không phải ô nhập. */}
          <Form.Item label={t('consultants.ratingPreview')} shouldUpdate>
            {() => <Rate allowHalf disabled value={(form.getFieldValue('rating') as number) ?? 0} />}
          </Form.Item>
        </>
      )}
    />
  )
}
