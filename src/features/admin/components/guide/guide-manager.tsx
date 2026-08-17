'use client'

import { Col, Form, Input, InputNumber, Row, Segmented, Select, Switch, Tag, Typography } from 'antd'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

import type { GuideArticle, GuideVideo } from '@/shared/cms'
import { newAdminId } from '../../services/admin.service'
import { ImageUrlField } from '../common/field-kit'
import { ResourceManager } from '../common/resource-manager'

const { Text } = Typography

const TOPICS = ['land-photo', 'input', 'read-estimate', 'dossier', 'share'] as const

/**
 * Trang Hướng dẫn (mục VI) — hai bảng dùng chung một màn: video ngắn 20–60s và
 * bài hướng dẫn dạng chữ.
 *
 * Chỉ MỘT video được đánh dấu nổi bật (mục X, #3). Giao diện trang Hướng dẫn lấy
 * video `featured` đầu tiên nên bật cờ cho video thứ hai không làm vỡ gì, nhưng
 * form vẫn nhắc để admin biết.
 */
export function GuideManager() {
  const t = useTranslations('admin')
  const [tab, setTab] = useState<'videos' | 'articles'>('videos')

  const topicOptions = TOPICS.map((value) => ({ label: t(`guide.topics.${value}`), value }))

  const switcher = (
    <Segmented
      value={tab}
      onChange={(value) => setTab(value as 'videos' | 'articles')}
      options={[
        { label: t('guide.videos'), value: 'videos' },
        { label: t('guide.articles'), value: 'articles' }
      ]}
    />
  )

  if (tab === 'articles') {
    return (
      <ResourceManager
        collection='guideArticles'
        title={t('nav.guide')}
        description={t('guide.articlesDescription')}
        extraActions={switcher}
        searchText={(item) => `${item.title} ${item.excerpt}`}
        createItem={(): GuideArticle => ({
          id: newAdminId('gart'),
          topic: 'land-photo',
          title: '',
          excerpt: '',
          imageUrl: ''
        })}
        columns={[
          { title: t('guide.title'), dataIndex: 'title' },
          {
            title: t('guide.topic'),
            dataIndex: 'topic',
            width: 170,
            render: (topic: GuideArticle['topic']) => <Tag>{t(`guide.topics.${topic}`)}</Tag>
          },
          { title: t('guide.excerpt'), dataIndex: 'excerpt', ellipsis: true }
        ]}
        renderForm={(form) => (
          <>
            <Form.Item
              name='title'
              label={t('guide.title')}
              rules={[{ required: true, message: t('fields.requiredMessage') }]}
            >
              <Input />
            </Form.Item>
            <Form.Item name='topic' label={t('guide.topic')}>
              <Select options={topicOptions} />
            </Form.Item>
            <Form.Item name='excerpt' label={t('guide.excerpt')}>
              <Input.TextArea autoSize={{ minRows: 2, maxRows: 4 }} />
            </Form.Item>
            <ImageUrlField form={form} name='imageUrl' label={t('guide.cover')} />
          </>
        )}
      />
    )
  }

  return (
    <ResourceManager
      collection='guideVideos'
      title={t('nav.guide')}
      description={t('guide.videosDescription')}
      extraActions={switcher}
      searchText={(item) => `${item.title} ${item.description}`}
      createItem={(): GuideVideo => ({
        id: newAdminId('vid'),
        topic: 'land-photo',
        title: '',
        description: '',
        thumbnailUrl: '',
        videoUrl: '',
        durationSeconds: 45
      })}
      columns={[
        {
          title: t('guide.title'),
          dataIndex: 'title',
          render: (_, record) => (
            <div style={{ minWidth: 0 }}>
              <Text strong ellipsis style={{ display: 'block' }}>
                {record.title}
              </Text>
              <Text type='secondary' style={{ fontSize: 12 }}>
                {record.description}
              </Text>
            </div>
          )
        },
        {
          title: t('guide.topic'),
          dataIndex: 'topic',
          width: 170,
          filters: topicOptions.map((option) => ({ text: option.label, value: option.value })),
          onFilter: (value, record) => record.topic === value,
          render: (topic: GuideVideo['topic']) => <Tag>{t(`guide.topics.${topic}`)}</Tag>
        },
        {
          title: t('guide.duration'),
          dataIndex: 'durationSeconds',
          width: 110,
          sorter: (a, b) => a.durationSeconds - b.durationSeconds,
          render: (seconds: number) => t('guide.durationValue', { seconds })
        },
        {
          title: t('guide.featured'),
          dataIndex: 'featured',
          width: 110,
          render: (featured?: boolean) =>
            featured ? <Tag color='gold'>{t('guide.featuredYes')}</Tag> : <Text type='secondary'>—</Text>
        }
      ]}
      renderForm={(form) => (
        <>
          <Form.Item
            name='title'
            label={t('guide.title')}
            rules={[{ required: true, message: t('fields.requiredMessage') }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name='description' label={t('guide.videoDescription')}>
            <Input.TextArea autoSize={{ minRows: 2, maxRows: 4 }} />
          </Form.Item>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item name='topic' label={t('guide.topic')}>
                <Select options={topicOptions} />
              </Form.Item>
            </Col>
            <Col xs={12} md={6}>
              <Form.Item name='durationSeconds' label={t('guide.duration')}>
                <InputNumber min={5} max={600} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={12} md={6}>
              <Form.Item
                name='featured'
                label={t('guide.featured')}
                valuePropName='checked'
                tooltip={t('guide.featuredHint')}
              >
                <Switch />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name='videoUrl' label={t('guide.videoUrl')} tooltip={t('guide.videoUrlHint')}>
            <Input placeholder='https://…' />
          </Form.Item>
          <ImageUrlField form={form} name='thumbnailUrl' label={t('guide.thumbnail')} />
        </>
      )}
    />
  )
}
