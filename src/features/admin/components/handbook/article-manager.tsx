'use client'

import { Button, Col, Form, Input, InputNumber, Row, Select, Tag, Typography, type FormInstance } from 'antd'
import { useTranslations } from 'next-intl'

import type { HandbookArticle } from '@/shared/cms'
import { useAdminCollection } from '../../hooks/use-admin-data'
import { newAdminId, slugify, todayKey } from '../../services/admin.service'
import { ImageUrlField, SectionListField } from '../common/field-kit'
import { ResourceManager } from '../common/resource-manager'

const { Text } = Typography

const CATEGORIES = ['experience', 'material', 'interior', 'legal'] as const
const STAGES = ['structure', 'finishing', 'interior'] as const

/**
 * Kho bài viết Cẩm nang (mục VI, Phần 3 + Bản tin).
 *
 * `slug` là đường dẫn `/handbook/bai-viet/{slug}` nên có nút sinh từ tiêu đề —
 * gõ tay dễ ra link vỡ hoặc trùng. `featuredRank` quyết định vị trí trong Bản
 * tin: 1 là bài lớn, 2–4 là ba bài phụ (Hình 11).
 */
export function ArticleManager() {
  const t = useTranslations('admin')
  // Danh sách chủ đề lấy từ chính các giai đoạn đang có, để không gõ sai id.
  const { data: stages } = useAdminCollection('handbookStages')

  const topicOptions = (stages ?? []).flatMap((stage) =>
    stage.topics.map((topic) => ({ label: `${stage.title} › ${topic.title}`, value: topic.id }))
  )

  function fillSlug(form: FormInstance) {
    const title = form.getFieldValue('title') as string | undefined
    if (title) form.setFieldValue('slug', slugify(title))
  }

  return (
    <ResourceManager
      collection='handbookArticles'
      title={t('nav.articles')}
      description={t('articles.description')}
      drawerWidth={720}
      searchText={(item) => `${item.title} ${item.slug} ${item.excerpt}`}
      createItem={(): HandbookArticle => ({
        id: newAdminId('art'),
        slug: '',
        title: '',
        excerpt: '',
        imageUrl: '',
        category: 'experience',
        publishedAt: todayKey(),
        readingMinutes: 5,
        body: [{ heading: '', paragraphs: [''] }],
        tags: {}
      })}
      columns={[
        {
          title: t('articles.title'),
          dataIndex: 'title',
          render: (_, record) => (
            <div style={{ minWidth: 0 }}>
              <Text strong ellipsis style={{ display: 'block' }}>
                {record.title}
              </Text>
              <Text type='secondary' style={{ fontSize: 12 }}>
                /{record.slug}
              </Text>
            </div>
          )
        },
        {
          title: t('articles.category'),
          dataIndex: 'category',
          width: 130,
          filters: CATEGORIES.map((value) => ({ text: t(`articles.categories.${value}`), value })),
          onFilter: (value, record) => record.category === value,
          render: (category: HandbookArticle['category']) => <Tag>{t(`articles.categories.${category}`)}</Tag>
        },
        {
          title: t('articles.stage'),
          dataIndex: 'stage',
          width: 130,
          render: (stage?: HandbookArticle['stage']) =>
            stage ? <Tag color='green'>{t(`articles.stages.${stage}`)}</Tag> : <Text type='secondary'>—</Text>
        },
        {
          title: t('articles.featuredRank'),
          dataIndex: 'featuredRank',
          width: 110,
          sorter: (a, b) => (a.featuredRank ?? 99) - (b.featuredRank ?? 99),
          render: (rank?: number) => (rank ? <Tag color='gold'>#{rank}</Tag> : <Text type='secondary'>—</Text>)
        },
        { title: t('articles.publishedAt'), dataIndex: 'publishedAt', width: 120 }
      ]}
      renderForm={(form) => (
        <>
          <Form.Item
            name='title'
            label={t('articles.title')}
            rules={[{ required: true, message: t('fields.requiredMessage') }]}
          >
            <Input />
          </Form.Item>

          <Form.Item label={t('articles.slug')} tooltip={t('articles.slugHint')}>
            <Row gutter={8}>
              <Col flex='auto'>
                <Form.Item name='slug' noStyle rules={[{ required: true, message: t('fields.requiredMessage') }]}>
                  <Input />
                </Form.Item>
              </Col>
              <Col>
                <Button onClick={() => fillSlug(form)}>{t('articles.generateSlug')}</Button>
              </Col>
            </Row>
          </Form.Item>

          <Form.Item name='excerpt' label={t('articles.excerpt')}>
            <Input.TextArea autoSize={{ minRows: 2, maxRows: 4 }} />
          </Form.Item>

          <ImageUrlField form={form} name='imageUrl' label={t('articles.cover')} />

          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item name='category' label={t('articles.category')}>
                <Select options={CATEGORIES.map((value) => ({ label: t(`articles.categories.${value}`), value }))} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name='stage' label={t('articles.stage')}>
                <Select allowClear options={STAGES.map((value) => ({ label: t(`articles.stages.${value}`), value }))} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name='topicId' label={t('articles.topic')}>
                <Select allowClear showSearch optionFilterProp='label' options={topicOptions} />
              </Form.Item>
            </Col>
            <Col xs={12} md={8}>
              <Form.Item name='publishedAt' label={t('articles.publishedAt')}>
                <Input placeholder='2026-08-17' />
              </Form.Item>
            </Col>
            <Col xs={12} md={8}>
              <Form.Item name='readingMinutes' label={t('articles.readingMinutes')}>
                <InputNumber min={1} max={60} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={12} md={8}>
              <Form.Item
                name='featuredRank'
                label={t('articles.featuredRank')}
                tooltip={t('articles.featuredRankHint')}
              >
                <InputNumber min={1} max={4} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name='panelTopic' label={t('articles.panelTopic')} tooltip={t('articles.panelTopicHint')}>
                <Select
                  allowClear
                  options={[
                    { label: t('articles.panelArchitecture'), value: 'architecture' },
                    { label: t('articles.panelInterior'), value: 'interior' }
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>

          <SectionListField
            name='body'
            label={t('articles.body')}
            headingLabel={t('articles.sectionHeading')}
            bodyLabel={t('articles.sectionParagraphs')}
            bodyAsList
          />
        </>
      )}
    />
  )
}
