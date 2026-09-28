'use client'

import { DeleteOutlined, EyeInvisibleOutlined, SendOutlined } from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import {
  App,
  Button,
  Descriptions,
  Form,
  Image,
  Input,
  Popconfirm,
  Segmented,
  Space,
  Spin,
  Tag,
  Tooltip,
  TreeSelect,
  Typography
} from 'antd'
import type { FormInstance } from 'antd'
import { useLocale, useTranslations } from 'next-intl'
import { useState } from 'react'

import type { Locale } from '@/i18n/routing'
import { isApiError } from '@/shared/lib/api'
import { formatDisplayDate } from '@/shared/utils'
import { adminKeys } from '../../api/admin.keys'
import {
  NEWS_LIMITS,
  newsAdminApi,
  type BmtAdminArticleItem,
  type BmtArticleWrite,
  type NewsArticleState
} from '../../api/bmt/news.api'
import { buildCategoryTree, categoryPath } from '../../services/news-category.service'
import { ApiResourceManager, type ApiRowContext } from '../common/api-resource-manager'
import { ImageUrlField } from '../common/field-kit'
import { HtmlContentEditor, HtmlPreview } from './html-content-editor'

const { Text, Paragraph } = Typography

type StateFilter = 'all' | NewsArticleState

const STATE_COLOR: Record<NewsArticleState, string> = {
  Draft: 'default',
  Published: 'green',
  Hidden: 'orange'
}

const RESOURCE = 'news-articles'
const CATEGORIES_KEY = adminKeys.bmt('news-categories', 'all')

interface ArticleFormValues {
  expectedVersion?: number
  title?: string
  summary?: string
  coverImageUrl?: string
  contentHtml?: string
  categoryIds?: string[]
}

/** Chuỗi rỗng / toàn khoảng trắng → `null` (API hiểu là "chưa nhập"). */
const textOrNull = (value?: string | null) => {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

function toWrite(values: ArticleFormValues): BmtArticleWrite {
  return {
    title: textOrNull(values.title),
    summary: textOrNull(values.summary),
    coverImageUrl: textOrNull(values.coverImageUrl),
    contentHtml: textOrNull(values.contentHtml),
    categoryIds: values.categoryIds ?? []
  }
}

/** Các thành phần còn thiếu để công bố mà danh sách đã biết (nội dung chỉ backend kiểm). */
function missingForPublish(item: BmtAdminArticleItem): ('title' | 'summary' | 'cover' | 'category')[] {
  const missing: ('title' | 'summary' | 'cover' | 'category')[] = []
  if (!item.title?.trim()) missing.push('title')
  if (!item.summary?.trim()) missing.push('summary')
  if (!item.coverImageUrl) missing.push('cover')
  if (!item.categoryIds.length) missing.push('category')
  return missing
}

/**
 * BÀI VIẾT TIN TỨC (STORY-NEWS-001, BR-NEWS-001) — dữ liệu trên BMT API.
 *
 * Vòng đời Nháp → Công bố ⇄ Ẩn; xóa được ở mọi trạng thái (không khôi phục).
 * Bài mới luôn là Nháp và được thiếu mọi trường; chỉ công bố khi đủ năm thành
 * phần: tiêu đề, ảnh đại diện, mô tả ngắn, nội dung, ít nhất một danh mục. Sửa
 * bài đang công bố cũng phải giữ đủ năm thành phần. Mỗi thao tác ghi gửi kèm
 * `version` đã đọc; bản cũ thì backend trả lỗi xung đột và màn hiện nguyên thông báo.
 */
export function ArticleManager() {
  const t = useTranslations('admin')
  const tn = useTranslations('admin.newsArticles')
  const locale = useLocale() as Locale
  const [state, setState] = useState<StateFilter>('all')
  const { data: categories = [] } = useQuery({
    queryKey: CATEGORIES_KEY,
    queryFn: newsAdminApi.listAllCategories
  })

  const stateLabel = (value: NewsArticleState) => tn(`states.${value}`)
  const date = (value?: string | null) => (value ? formatDisplayDate(value, locale) : '-')

  return (
    <ApiResourceManager<BmtAdminArticleItem>
      title={t('nav.articles')}
      description={tn('description')}
      queryKey={adminKeys.bmt(RESOURCE, state)}
      fetchPage={(params) => newsAdminApi.listArticles({ ...params, state: state === 'all' ? undefined : state })}
      rowKey={(item) => item.id}
      searchable
      drawerWidth={820}
      banner={
        <Segmented<StateFilter>
          value={state}
          onChange={setState}
          options={(['all', 'Draft', 'Published', 'Hidden'] as const).map((value) => ({
            value,
            label: value === 'all' ? tn('states.all') : stateLabel(value)
          }))}
        />
      }
      columns={[
        {
          title: tn('title'),
          key: 'title',
          render: (_, record) => (
            <Space size={10}>
              {record.coverImageUrl ? (
                <Image
                  src={record.coverImageUrl}
                  alt=''
                  width={56}
                  height={40}
                  style={{ objectFit: 'cover', borderRadius: 6 }}
                />
              ) : (
                <span className='inline-block h-10 w-14 rounded-md bg-[var(--admin-placeholder)]' />
              )}
              <div style={{ minWidth: 0, maxWidth: 420 }}>
                <Text strong style={{ display: 'block' }}>
                  {record.title || <Text type='secondary'>{tn('untitled')}</Text>}
                </Text>
                {record.summary ? (
                  <Text type='secondary' style={{ fontSize: 12 }} ellipsis={{ tooltip: record.summary }}>
                    {record.summary}
                  </Text>
                ) : null}
              </div>
            </Space>
          )
        },
        {
          title: tn('categories'),
          key: 'categories',
          width: 240,
          render: (_, record) =>
            record.categoryIds.length ? (
              <Space size={4} wrap>
                {record.categoryIds.map((id) => (
                  <Tag key={id}>{categoryPath(categories, id)}</Tag>
                ))}
              </Space>
            ) : (
              <Text type='secondary'>-</Text>
            )
        },
        {
          title: tn('state'),
          dataIndex: 'state',
          width: 130,
          render: (value: NewsArticleState) => <Tag color={STATE_COLOR[value]}>{stateLabel(value)}</Tag>
        },
        {
          title: tn('firstPublishedAt'),
          dataIndex: 'firstPublishedAtUtc',
          width: 140,
          render: (value?: string | null) => date(value)
        },
        {
          title: tn('modifiedAt'),
          dataIndex: 'modifiedAtUtc',
          width: 140,
          render: (value: string) => date(value)
        }
      ]}
      createValues={() => ({ title: '', summary: '', coverImageUrl: '', contentHtml: '', categoryIds: [] })}
      onCreate={(values) => newsAdminApi.createArticle(toWrite(values as ArticleFormValues))}
      toFormValues={async (item) => {
        const detail = await newsAdminApi.getArticle(item.id)
        return {
          expectedVersion: detail.version,
          title: detail.title ?? '',
          summary: detail.summary ?? '',
          coverImageUrl: detail.coverImageUrl ?? '',
          contentHtml: detail.contentHtml ?? '',
          categoryIds: detail.categoryIds
        }
      }}
      onUpdate={(values, item) => {
        const form = values as ArticleFormValues
        return newsAdminApi.updateArticle(item.id, {
          ...toWrite(form),
          expectedVersion: form.expectedVersion ?? item.version
        })
      }}
      renderForm={(form, { item }) => (
        <ArticleFields form={form} categories={categories} published={item?.state === 'Published'} />
      )}
      rowActions={(item, ctx) => <ArticleActions item={item} ctx={ctx} />}
      renderView={(item) => <ArticleView id={item.id} categories={categories} />}
    />
  )
}

function ArticleFields({
  form,
  categories,
  published
}: {
  form: FormInstance
  categories: Awaited<ReturnType<typeof newsAdminApi.listAllCategories>>
  published: boolean
}) {
  const t = useTranslations('admin')
  const tn = useTranslations('admin.newsArticles')
  // Bài đang công bố: bản sửa vẫn phải đủ năm thành phần (BR-NEWS-001 khoản 5).
  const required = published ? [{ required: true, whitespace: true, message: t('fields.requiredMessage') }] : []

  return (
    <>
      <Form.Item name='expectedVersion' hidden>
        <Input />
      </Form.Item>
      {published ? (
        <Paragraph type='warning' style={{ marginTop: 0 }}>
          {tn('publishedEditHint')}
        </Paragraph>
      ) : (
        <Paragraph type='secondary' style={{ marginTop: 0 }}>
          {tn('draftHint')}
        </Paragraph>
      )}
      <ImageUrlField form={form} name='coverImageUrl' label={tn('cover')} required={published} />
      <Form.Item
        name='title'
        label={tn('title')}
        rules={[...required, { max: NEWS_LIMITS.title, message: t('fields.maxLength', { max: NEWS_LIMITS.title }) }]}
      >
        <Input maxLength={NEWS_LIMITS.title} showCount />
      </Form.Item>
      <Form.Item
        name='summary'
        label={tn('summary')}
        rules={[
          ...required,
          { max: NEWS_LIMITS.summary, message: t('fields.maxLength', { max: NEWS_LIMITS.summary }) }
        ]}
      >
        <Input.TextArea autoSize={{ minRows: 2, maxRows: 5 }} maxLength={NEWS_LIMITS.summary} showCount />
      </Form.Item>
      <Form.Item
        name='categoryIds'
        label={tn('categories')}
        extra={tn('categoriesHint')}
        rules={published ? [{ required: true, type: 'array', min: 1, message: tn('categoryRequired') }] : []}
      >
        <TreeSelect
          multiple
          allowClear
          treeDefaultExpandAll
          showSearch={{ treeNodeFilterProp: 'title' }}
          treeData={buildCategoryTree(categories)}
          placeholder={tn('pickCategories')}
        />
      </Form.Item>
      <Form.Item
        name='contentHtml'
        label={tn('content')}
        rules={[
          ...required,
          {
            max: NEWS_LIMITS.contentHtml,
            message: t('fields.maxLength', { max: NEWS_LIMITS.contentHtml.toLocaleString() })
          }
        ]}
      >
        <HtmlContentEditor maxLength={NEWS_LIMITS.contentHtml} />
      </Form.Item>
    </>
  )
}

/** Công bố / Ẩn / Xóa — mỗi nút gửi `version` đang có của dòng. */
function ArticleActions({ item, ctx }: { item: BmtAdminArticleItem; ctx: ApiRowContext }) {
  const t = useTranslations('admin')
  const tn = useTranslations('admin.newsArticles')
  const { message } = App.useApp()
  const name = item.title || tn('untitled')

  const run = async (action: () => Promise<unknown>, done: string) => {
    try {
      await action()
      await ctx.refresh()
      message.success(done)
    } catch (err) {
      message.error(isApiError(err) ? err.message : t('feedback.apiError'))
    }
  }

  const missing = missingForPublish(item)

  return (
    <>
      {item.state === 'Published' ? (
        <Popconfirm
          title={tn('hideTitle', { name })}
          description={<div style={{ maxWidth: 300 }}>{tn('hideBody')}</div>}
          okText={tn('hide')}
          cancelText={t('actions.cancel')}
          onConfirm={() => run(() => newsAdminApi.hideArticle(item.id, item.version), tn('hidden'))}
        >
          <Tooltip title={tn('hide')}>
            <Button type='text' size='small' icon={<EyeInvisibleOutlined />} aria-label={tn('hide')} />
          </Tooltip>
        </Popconfirm>
      ) : missing.length ? (
        <Tooltip title={tn('missing', { fields: missing.map((key) => tn(`parts.${key}`)).join(', ') })}>
          <Button type='text' size='small' disabled icon={<SendOutlined />} aria-label={tn('publish')} />
        </Tooltip>
      ) : (
        <Popconfirm
          title={tn('publishTitle', { name })}
          description={<div style={{ maxWidth: 300 }}>{tn('publishBody')}</div>}
          okText={tn('publish')}
          cancelText={t('actions.cancel')}
          onConfirm={() => run(() => newsAdminApi.publishArticle(item.id, item.version), tn('published'))}
        >
          <Tooltip title={tn('publish')}>
            <Button type='text' size='small' icon={<SendOutlined />} aria-label={tn('publish')} />
          </Tooltip>
        </Popconfirm>
      )}
      <Popconfirm
        title={tn('deleteTitle', { name })}
        description={<div style={{ maxWidth: 300 }}>{tn('deleteBody')}</div>}
        okText={t('actions.delete')}
        okButtonProps={{ danger: true }}
        cancelText={t('actions.cancel')}
        onConfirm={() => run(() => newsAdminApi.deleteArticle(item.id, item.version), t('feedback.deleted'))}
      >
        <Tooltip title={t('actions.delete')}>
          <Button type='text' size='small' danger icon={<DeleteOutlined />} aria-label={t('actions.delete')} />
        </Tooltip>
      </Popconfirm>
    </>
  )
}

/** Ngăn kéo xem: đọc bản chi tiết (danh sách không kèm nội dung). */
function ArticleView({
  id,
  categories
}: {
  id: string
  categories: Awaited<ReturnType<typeof newsAdminApi.listAllCategories>>
}) {
  const t = useTranslations('admin')
  const tn = useTranslations('admin.newsArticles')
  const locale = useLocale() as Locale
  const { data, isPending, error } = useQuery({
    queryKey: adminKeys.bmt(RESOURCE, 'detail', id),
    queryFn: () => newsAdminApi.getArticle(id),
    staleTime: 0
  })

  if (isPending) return <Spin />
  if (!data) return <Text type='danger'>{isApiError(error) ? error.message : t('feedback.apiError')}</Text>

  const date = (value?: string | null) => (value ? formatDisplayDate(value, locale, { time: true }) : '-')

  return (
    <Space orientation='vertical' size={16} style={{ width: '100%' }}>
      {data.coverImageUrl ? <Image src={data.coverImageUrl} alt='' style={{ borderRadius: 8 }} /> : null}
      <Descriptions
        size='small'
        column={1}
        bordered
        items={[
          { key: 'title', label: tn('title'), children: data.title || '-' },
          { key: 'summary', label: tn('summary'), children: data.summary || '-' },
          {
            key: 'categories',
            label: tn('categories'),
            children: data.categoryIds.length
              ? data.categoryIds.map((categoryId) => <Tag key={categoryId}>{categoryPath(categories, categoryId)}</Tag>)
              : '-'
          },
          {
            key: 'state',
            label: tn('state'),
            children: <Tag color={STATE_COLOR[data.state]}>{tn(`states.${data.state}`)}</Tag>
          },
          { key: 'firstPublished', label: tn('firstPublishedAt'), children: date(data.firstPublishedAtUtc) },
          { key: 'created', label: tn('createdAt'), children: date(data.createdAtUtc) },
          { key: 'modified', label: tn('modifiedAt'), children: date(data.modifiedAtUtc) }
        ]}
      />
      {data.contentHtml ? (
        <HtmlPreview html={data.contentHtml} title={tn('content')} height={520} />
      ) : (
        <Text type='secondary'>{tn('noContent')}</Text>
      )}
    </Space>
  )
}
