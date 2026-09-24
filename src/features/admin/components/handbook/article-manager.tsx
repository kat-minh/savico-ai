'use client'

import {
  App,
  Button,
  Card,
  Col,
  Descriptions,
  Form,
  Image,
  Input,
  InputNumber,
  Row,
  Select,
  Space,
  Tag,
  Typography
} from 'antd'
import type { FormInstance } from 'antd'
import dayjs from 'dayjs'
import { useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'

import type { HandbookArticle, HandbookStageId } from '@/shared/cms'
import { useAdminCollection, useSaveAdminItem } from '../../hooks/use-admin-data'
import { newAdminId, slugify, todayKey } from '../../services/admin.service'
import {
  articleContentLength,
  articleProblem,
  FEATURED_SLOTS,
  MAX_ARTICLE_CONTENT
} from '../../services/article.service'
import { ImageUrlField, SectionListField, StatusSwitch } from '../common/field-kit'
import { ResourceManager } from '../common/resource-manager'

const { Text, Paragraph } = Typography

interface Filters {
  label?: string
  status?: 'active' | 'inactive'
}

const statusOf = (article: HandbookArticle) => article.status ?? 'active'

/**
 * BÀI VIẾT (epic ArticleManagement, BR-134 → BR-137).
 *
 * Bài mới mặc định Inactive; chỉ Active khi đủ dữ liệu bắt buộc. Bước và Nhóm
 * cẩm nang chọn phụ thuộc nhau, tag "Bước · Nhóm" hệ thống tự tạo. Thời gian tạo
 * hệ thống ghi. Bốn vị trí nổi bật cấu hình ở khối phía trên bảng; bài chuyển
 * Inactive hoặc bị xóa tự rời khỏi danh sách nổi bật.
 */
export function ArticleManager() {
  const t = useTranslations('admin')
  const { message } = App.useApp()
  const [filters, setFilters] = useState<Filters>({})
  const { data: articles = [] } = useAdminCollection('handbookArticles')
  const { data: stages = [] } = useAdminCollection('handbookStages')
  const { data: labels = [] } = useAdminCollection('articleLabels')
  const save = useSaveAdminItem('handbookArticles')

  const labelName = (id: string) => labels.find((label) => label.id === id)?.name ?? id
  const activeLabelIds = labels.filter((label) => label.status === 'active').map((label) => label.id)
  const stageOf = (id?: HandbookStageId) => stages.find((stage) => stage.id === id)
  const handbookTag = (article: HandbookArticle) => {
    const stage = stageOf(article.stage)
    const topic = stage?.topics.find((item) => item.id === article.topicId)
    return stage && topic ? t('articles.handbookTag', { step: stage.order, group: topic.title }) : null
  }

  const matches = (article: HandbookArticle) =>
    (!filters.label || article.category === filters.label) && (!filters.status || statusOf(article) === filters.status)

  return (
    <ResourceManager
      collection='handbookArticles'
      title={t('nav.articles')}
      description={t('articles.description')}
      drawerWidth={760}
      filterItems={matches}
      filterKey={JSON.stringify(filters)}
      searchText={(item) => item.title}
      banner={
        <Space orientation='vertical' size={12} style={{ width: '100%' }}>
          <FeaturedSlots />
          <Space wrap size={8}>
            <Select
              allowClear
              placeholder={t('articles.label')}
              value={filters.label}
              onChange={(label?: string) => setFilters((prev) => ({ ...prev, label }))}
              options={labels.map((label) => ({ value: label.id, label: label.name }))}
              style={{ minWidth: 200 }}
            />
            <Select
              allowClear
              placeholder={t('articles.status')}
              value={filters.status}
              onChange={(status?: Filters['status']) => setFilters((prev) => ({ ...prev, status }))}
              options={[
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' }
              ]}
              style={{ minWidth: 150 }}
            />
          </Space>
        </Space>
      }
      createItem={(): HandbookArticle => ({
        id: newAdminId('art'),
        slug: '',
        title: '',
        excerpt: '',
        imageUrl: '',
        category: activeLabelIds[0] ?? '',
        publishedAt: todayKey(),
        readingMinutes: 5,
        body: [{ heading: '', paragraphs: [''] }],
        tags: {},
        status: 'inactive',
        createdAt: new Date().toISOString()
      })}
      fromFormValues={(values, current): HandbookArticle => {
        const next = { ...current, ...values } as HandbookArticle
        const title = next.title.trim()
        const body = next.body
          .map((section) => ({
            ...section,
            heading: section.heading?.trim() || undefined,
            paragraphs: section.paragraphs.map((item) => item.trim()).filter(Boolean)
          }))
          .filter((section) => section.heading || section.paragraphs.length)
        // Đường dẫn giữ nguyên khi sửa; bài mới tự sinh từ tiêu đề, trùng thì thêm hậu tố.
        let slug = current.slug || slugify(title)
        if (!current.slug) {
          const taken = new Set(articles.filter((item) => item.id !== current.id).map((item) => item.slug))
          for (let index = 2; taken.has(slug); index += 1) slug = `${slugify(title)}-${index}`
        }
        const first = body.flatMap((section) => section.paragraphs)[0] ?? ''
        return {
          ...next,
          title,
          slug,
          body,
          excerpt: first.length > 200 ? `${first.slice(0, 197)}…` : first,
          stage: next.stage || undefined,
          topicId: next.stage ? next.topicId || undefined : undefined,
          publishedAt: todayKey()
        }
      }}
      validate={(next) => {
        if ((next.stage && !next.topicId) || (!next.stage && next.topicId)) return t('articles.handbookPair')
        if (articleContentLength(next) > MAX_ARTICLE_CONTENT)
          return t('articles.contentTooLong', { max: MAX_ARTICLE_CONTENT })
        return null
      }}
      deleteConfirm={(item) => <Text>{t('articles.deleteConfirm', { title: item.title })}</Text>}
      rowActions={(item) => {
        const active = statusOf(item) === 'active'
        const problem = articleProblem(item, activeLabelIds)
        return (
          <StatusSwitch
            name={item.title}
            current={active ? 'Active' : 'Inactive'}
            next={active ? 'Inactive' : 'Active'}
            blockedReason={!active && problem ? t(`articles.problems.${problem}`) : null}
            warning={active && item.featuredRank ? t('articles.leavesFeatured') : null}
            onConfirm={async () => {
              // Chuyển Inactive thì tự rời danh sách nổi bật (§5).
              await save.mutateAsync({
                ...item,
                status: active ? 'inactive' : 'active',
                featuredRank: active ? undefined : item.featuredRank
              })
              message.success(t('feedback.saved'))
            }}
          />
        )
      }}
      renderView={(item) => (
        <Space orientation='vertical' size={16} style={{ width: '100%' }}>
          {item.imageUrl ? <Image src={item.imageUrl} alt='' style={{ borderRadius: 8 }} /> : null}
          <Descriptions
            size='small'
            column={1}
            bordered
            items={[
              { key: 'title', label: t('articles.title'), children: item.title },
              {
                key: 'created',
                label: t('articles.createdAt'),
                children: item.createdAt ? dayjs(item.createdAt).format('DD/MM/YYYY') : '-'
              },
              { key: 'label', label: t('articles.label'), children: labelName(item.category) },
              {
                key: 'step',
                label: t('articles.step'),
                children: stageOf(item.stage)
                  ? t('articles.stepValue', {
                      step: stageOf(item.stage)?.order ?? '',
                      name: stageOf(item.stage)?.title ?? ''
                    })
                  : '-'
              },
              {
                key: 'group',
                label: t('articles.group'),
                children: stageOf(item.stage)?.topics.find((topic) => topic.id === item.topicId)?.title ?? '-'
              },
              {
                key: 'reading',
                label: t('articles.readingMinutes'),
                children: t('articles.minutes', { count: item.readingMinutes })
              },
              {
                key: 'status',
                label: t('articles.status'),
                children: statusOf(item) === 'active' ? 'Active' : 'Inactive'
              }
            ]}
          />
          {item.body.map((section, index) => (
            <div key={index}>
              {section.heading ? <Text strong>{section.heading}</Text> : null}
              {section.paragraphs.map((paragraph) => (
                <Paragraph key={paragraph} style={{ margin: '4px 0 0' }}>
                  {paragraph}
                </Paragraph>
              ))}
            </div>
          ))}
        </Space>
      )}
      columns={[
        {
          title: t('articles.title'),
          dataIndex: 'title',
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
              <div style={{ minWidth: 0 }}>
                <Text strong style={{ display: 'block' }}>
                  {record.title}
                </Text>
                {handbookTag(record) ? <Tag color='green'>{handbookTag(record)}</Tag> : null}
              </div>
            </Space>
          )
        },
        {
          title: t('articles.createdAt'),
          dataIndex: 'createdAt',
          width: 120,
          sorter: (a, b) => (a.createdAt ?? '').localeCompare(b.createdAt ?? ''),
          render: (value?: string) => (value ? dayjs(value).format('DD/MM/YYYY') : '-')
        },
        {
          title: t('articles.label'),
          dataIndex: 'category',
          width: 170,
          render: (category: string) => <Tag>{labelName(category)}</Tag>
        },
        {
          title: t('articles.status'),
          key: 'status',
          width: 150,
          render: (_, record) => (
            <Space size={4} wrap>
              <Tag color={statusOf(record) === 'active' ? 'green' : 'default'}>
                {statusOf(record) === 'active' ? 'Active' : 'Inactive'}
              </Tag>
              {record.featuredRank ? <Tag color='gold'>#{String(record.featuredRank).padStart(2, '0')}</Tag> : null}
            </Space>
          )
        }
      ]}
      renderForm={(form) => <ArticleFields form={form} />}
    />
  )
}

function ArticleFields({ form }: { form: FormInstance }) {
  const t = useTranslations('admin')
  const { data: stages = [] } = useAdminCollection('handbookStages')
  const { data: labels = [] } = useAdminCollection('articleLabels')
  const stageId = Form.useWatch('stage', form) as HandbookStageId | undefined
  const current = form.getFieldsValue(true) as HandbookArticle
  const stage = stages.find((item) => item.id === stageId)

  return (
    <>
      <ImageUrlField form={form} name='imageUrl' label={t('articles.cover')} required />
      <Form.Item
        name='title'
        label={t('articles.title')}
        rules={[
          { required: true, whitespace: true, message: t('fields.requiredMessage') },
          { max: 1000, message: t('fields.maxLength', { max: 1000 }) }
        ]}
      >
        <Input.TextArea autoSize={{ minRows: 1, maxRows: 3 }} maxLength={1000} />
      </Form.Item>
      <Row gutter={16}>
        <Col xs={24} md={8}>
          <Form.Item
            name='category'
            label={t('articles.label')}
            rules={[{ required: true, message: t('fields.requiredMessage') }]}
          >
            {/* Nhãn Inactive không dùng cho bài mới; nhãn cũ của bài vẫn hiện để giữ nguyên (BR-136). */}
            <Select
              options={labels
                .filter((label) => label.status === 'active' || label.id === current.category)
                .sort((a, b) => a.order - b.order)
                .map((label) => ({ value: label.id, label: label.name, disabled: label.status !== 'active' }))}
            />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item name='stage' label={t('articles.step')}>
            <Select
              allowClear
              onChange={() => form.setFieldValue('topicId', undefined)}
              options={[...stages]
                .sort((a, b) => a.order - b.order)
                .map((item) => ({
                  value: item.id,
                  label: t('articles.stepValue', { step: item.order, name: item.title })
                }))}
            />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item
            name='topicId'
            label={t('articles.group')}
            rules={stageId ? [{ required: true, message: t('articles.groupRequired') }] : []}
          >
            <Select
              allowClear
              disabled={!stage}
              placeholder={stage ? undefined : t('articles.pickStepFirst')}
              options={(stage?.topics ?? []).map((topic) => ({ value: topic.id, label: topic.title }))}
            />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item
            name='readingMinutes'
            label={t('articles.readingMinutes')}
            rules={[{ required: true, type: 'integer', min: 1, message: t('articles.readingRule') }]}
          >
            <InputNumber min={1} precision={0} suffix={t('articles.minuteUnit')} style={{ width: '100%' }} />
          </Form.Item>
        </Col>
      </Row>
      <SectionListField
        name='body'
        label={t('articles.content')}
        headingLabel={t('articles.sectionHeading')}
        bodyLabel={t('articles.sectionParagraphs')}
        bodyAsList
      />
    </>
  )
}

/**
 * Bốn vị trí bài viết nổi bật (ArticleManagement §7, BR-137): đúng 4 bài Active,
 * không trùng; 01 là bài chính, 02–04 là bài phụ.
 */
function FeaturedSlots() {
  const t = useTranslations('admin')
  const { message } = App.useApp()
  const { data: articles = [] } = useAdminCollection('handbookArticles')
  const save = useSaveAdminItem('handbookArticles')
  const saved = useMemo(
    () => FEATURED_SLOTS.map((rank) => articles.find((article) => article.featuredRank === rank)?.id),
    [articles]
  )
  const [draft, setDraft] = useState<(string | undefined)[] | null>(null)
  const slots = draft ?? saved
  const active = articles.filter((article) => statusOf(article) === 'active')
  const filled = saved.filter(Boolean).length
  const chosen = slots.filter(Boolean)
  const error =
    chosen.length < FEATURED_SLOTS.length
      ? t('articles.featured.missing')
      : new Set(chosen).size !== chosen.length
        ? t('articles.featured.duplicate')
        : chosen.some((id) => !active.some((article) => article.id === id))
          ? t('articles.featured.inactive')
          : null

  const submit = async () => {
    if (error) return
    const changed = articles.filter((article) => {
      const rank = slots.indexOf(article.id)
      const next = rank >= 0 ? rank + 1 : undefined
      return article.featuredRank !== next
    })
    for (const article of changed) {
      const rank = slots.indexOf(article.id)
      await save.mutateAsync({ ...article, featuredRank: rank >= 0 ? rank + 1 : undefined })
    }
    setDraft(null)
    message.success(t('feedback.saved'))
  }

  return (
    <Card
      size='small'
      title={t('articles.featured.title', { count: filled })}
      extra={
        <Space>
          <Button disabled={!draft} onClick={() => setDraft(null)}>
            {t('actions.cancel')}
          </Button>
          <Button type='primary' disabled={!draft || Boolean(error)} loading={save.isPending} onClick={submit}>
            {t('actions.save')}
          </Button>
        </Space>
      }
    >
      <div className='grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4'>
        {FEATURED_SLOTS.map((rank, index) => {
          const article = articles.find((item) => item.id === slots[index])
          return (
            <div key={rank} className='flex flex-col gap-2 rounded-lg border border-[var(--admin-border)] p-2'>
              <Text strong>
                {String(rank).padStart(2, '0')} ·{' '}
                {rank === 1 ? t('articles.featured.lead') : t('articles.featured.side')}
              </Text>
              {article?.imageUrl ? (
                <Image
                  src={article.imageUrl}
                  alt=''
                  height={80}
                  style={{ objectFit: 'cover', borderRadius: 6, width: '100%' }}
                />
              ) : null}
              <Select
                allowClear
                showSearch={{ optionFilterProp: 'label' }}
                value={slots[index]}
                placeholder={t('articles.featured.pick')}
                onChange={(id?: string) => setDraft(slots.map((value, position) => (position === index ? id : value)))}
                options={active.map((item) => ({ value: item.id, label: item.title }))}
              />
              {article ? (
                <Text type='secondary' style={{ fontSize: 12 }}>
                  {t('articles.minutes', { count: article.readingMinutes })}
                </Text>
              ) : null}
            </div>
          )
        })}
      </div>
      {draft && error ? (
        <Text type='danger' style={{ display: 'block', marginTop: 8 }}>
          {error}
        </Text>
      ) : null}
    </Card>
  )
}
