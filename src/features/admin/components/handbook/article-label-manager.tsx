'use client'

import { ArrowDownOutlined, ArrowUpOutlined, DeleteOutlined, FolderOpenOutlined } from '@ant-design/icons'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { App, Breadcrumb, Button, Form, Input, Popconfirm, Tag, Tooltip, TreeSelect, Typography } from 'antd'
import { useTranslations } from 'next-intl'
import { useRef, useState } from 'react'

import { isApiError } from '@/shared/lib/api'
import { adminKeys } from '../../api/admin.keys'
import { NEWS_LIMITS, newsAdminApi, type BmtNewsCategory } from '../../api/bmt/news.api'
import { buildCategoryTree, selfAndDescendants } from '../../services/news-category.service'
import { ApiResourceManager, type ApiRowContext } from '../common/api-resource-manager'

const { Text } = Typography

/** Gốc key chung của mọi truy vấn danh mục — ghi xong vô hiệu cả cây lẫn từng tầng. */
const CATEGORY_ROOT_KEY = adminKeys.bmt('news-categories')
const CATEGORIES_ALL_KEY = adminKeys.bmt('news-categories', 'all')

interface Crumb {
  id: string
  name: string
}

interface CategoryFormValues {
  name?: string
  parentId?: string | null
  expectedVersion?: number
}

/**
 * DANH MỤC TIN TỨC (STORY-NEWS-002, BR-NEWS-002) — cây nhiều cấp trên BMT API.
 *
 * API trả từng tầng (con trực tiếp của một cha), nên màn duyệt cây theo tầng:
 * bấm tên danh mục để vào tầng con, đường dẫn phía trên để quay lại. Tên bắt buộc,
 * tối đa 200 ký tự, không trùng trong cùng cha (không phân biệt hoa/thường — kiểm ở
 * backend). Đổi cha không được chọn chính nó hoặc nhánh con. Chỉ xóa được khi không
 * còn danh mục con và không còn bài nào gắn, kể cả bài nháp hoặc đã ẩn.
 */
export function ArticleLabelManager() {
  const t = useTranslations('admin')
  const tc = useTranslations('admin.newsCategories')
  const queryClient = useQueryClient()
  const [path, setPath] = useState<Crumb[]>([])
  const parentId = path.at(-1)?.id ?? null
  /** Các danh mục cùng tầng đang hiển thị — để tính vị trí khi đổi thứ tự. */
  const siblingsRef = useRef<BmtNewsCategory[]>([])

  const { data: all = [] } = useQuery({ queryKey: CATEGORIES_ALL_KEY, queryFn: newsAdminApi.listAllCategories })

  const refreshTree = () => queryClient.invalidateQueries({ queryKey: CATEGORY_ROOT_KEY })

  return (
    <ApiResourceManager<BmtNewsCategory>
      title={t('nav.articleLabels')}
      description={tc('description')}
      queryKey={[...CATEGORY_ROOT_KEY, 'children', parentId]}
      pageSize={100}
      fetchPage={async (params) => {
        const page = await newsAdminApi.listCategories({ ...params, parentId })
        siblingsRef.current = page.items
        return page
      }}
      rowKey={(item) => item.id}
      banner={
        <Breadcrumb
          items={[
            {
              title: path.length ? <a onClick={() => setPath([])}>{tc('root')}</a> : <Text strong>{tc('root')}</Text>
            },
            ...path.map((crumb, index) => ({
              title:
                index === path.length - 1 ? (
                  <Text strong>{crumb.name}</Text>
                ) : (
                  <a onClick={() => setPath(path.slice(0, index + 1))}>{crumb.name}</a>
                )
            }))
          ]}
        />
      }
      columns={[
        {
          title: tc('order'),
          key: 'order',
          width: 90,
          render: (_, record) => siblingsRef.current.findIndex((item) => item.id === record.id) + 1
        },
        {
          title: tc('name'),
          dataIndex: 'name',
          render: (name: string, record) => (
            <a onClick={() => setPath([...path, { id: record.id, name }])}>
              <Text strong>{name}</Text>
            </a>
          )
        },
        {
          title: tc('children'),
          dataIndex: 'hasChildren',
          width: 160,
          render: (hasChildren: boolean) =>
            hasChildren ? <Tag color='blue'>{tc('hasChildren')}</Tag> : <Text type='secondary'>-</Text>
        }
      ]}
      createValues={() => ({ name: '', parentId })}
      onCreate={async (values) => {
        const form = values as CategoryFormValues
        await newsAdminApi.createCategory({ name: (form.name ?? '').trim(), parentId: form.parentId ?? null })
        await refreshTree()
      }}
      toFormValues={(item) => ({ name: item.name, parentId: item.parentId ?? null, expectedVersion: item.version })}
      onUpdate={async (values, item) => {
        const form = values as CategoryFormValues
        await newsAdminApi.updateCategory(item.id, {
          name: (form.name ?? '').trim(),
          parentId: form.parentId ?? null,
          expectedVersion: form.expectedVersion ?? item.version
        })
        await refreshTree()
      }}
      renderForm={(_, { item }) => {
        const blocked = item ? selfAndDescendants(all, item.id) : new Set<string>()
        return (
          <>
            <Form.Item name='expectedVersion' hidden>
              <Input />
            </Form.Item>
            <Form.Item
              name='name'
              label={tc('name')}
              extra={tc('nameHint')}
              rules={[
                { required: true, whitespace: true, message: t('fields.requiredMessage') },
                {
                  validator: (_rule, value?: string) =>
                    (value ?? '').trim().length > NEWS_LIMITS.categoryName
                      ? Promise.reject(new Error(t('fields.maxLength', { max: NEWS_LIMITS.categoryName })))
                      : Promise.resolve()
                }
              ]}
            >
              <Input showCount />
            </Form.Item>
            <Form.Item name='parentId' label={tc('parent')} extra={tc('parentHint')}>
              <TreeSelect
                allowClear
                treeDefaultExpandAll
                showSearch={{ treeNodeFilterProp: 'title' }}
                placeholder={tc('root')}
                treeData={buildCategoryTree(all, blocked)}
              />
            </Form.Item>
          </>
        )
      }}
      rowActions={(item, ctx) => (
        <CategoryActions
          item={item}
          ctx={ctx}
          parentId={parentId}
          siblings={siblingsRef.current}
          onOpen={() => setPath([...path, { id: item.id, name: item.name }])}
          onChanged={refreshTree}
        />
      )}
    />
  )
}

function CategoryActions({
  item,
  ctx,
  parentId,
  siblings,
  onOpen,
  onChanged
}: {
  item: BmtNewsCategory
  ctx: ApiRowContext
  parentId: string | null
  siblings: BmtNewsCategory[]
  onOpen: () => void
  onChanged: () => Promise<unknown>
}) {
  const t = useTranslations('admin')
  const tc = useTranslations('admin.newsCategories')
  const { message } = App.useApp()
  const [busy, setBusy] = useState(false)
  const index = siblings.findIndex((sibling) => sibling.id === item.id)

  const run = async (action: () => Promise<unknown>, done: string) => {
    setBusy(true)
    try {
      await action()
      await Promise.all([ctx.refresh(), onChanged()])
      message.success(done)
    } catch (err) {
      message.error(isApiError(err) ? err.message : t('feedback.apiError'))
    } finally {
      setBusy(false)
    }
  }

  /** Đặt ngay trước `before`; không có `before` = xuống cuối nhóm. */
  const moveBefore = (before?: BmtNewsCategory) =>
    run(
      () =>
        newsAdminApi.moveCategory(item.id, {
          expectedVersion: item.version,
          expectedParentId: parentId,
          beforeCategoryId: before?.id,
          expectedBeforeVersion: before?.version
        }),
      t('feedback.saved')
    )

  const previous = index > 0 ? siblings[index - 1] : undefined
  const isLast = index < 0 || index >= siblings.length - 1

  return (
    <>
      <Tooltip title={tc('open')}>
        <Button type='text' size='small' icon={<FolderOpenOutlined />} aria-label={tc('open')} onClick={onOpen} />
      </Tooltip>
      <Tooltip title={tc('moveUp')}>
        <Button
          type='text'
          size='small'
          icon={<ArrowUpOutlined />}
          aria-label={tc('moveUp')}
          disabled={!previous || busy}
          onClick={() => void moveBefore(previous)}
        />
      </Tooltip>
      <Tooltip title={tc('moveDown')}>
        <Button
          type='text'
          size='small'
          icon={<ArrowDownOutlined />}
          aria-label={tc('moveDown')}
          disabled={isLast || busy}
          // Xuống một bậc = đứng trước danh mục cách hai bậc (hoặc về cuối nhóm).
          onClick={() => void moveBefore(siblings[index + 2])}
        />
      </Tooltip>
      {item.hasChildren ? (
        <Tooltip title={tc('deleteHasChildren')}>
          <Button type='text' size='small' danger disabled icon={<DeleteOutlined />} aria-label={t('actions.delete')} />
        </Tooltip>
      ) : (
        <Popconfirm
          title={tc('deleteTitle', { name: item.name })}
          description={<div style={{ maxWidth: 300 }}>{tc('deleteBody')}</div>}
          okText={t('actions.delete')}
          okButtonProps={{ danger: true }}
          cancelText={t('actions.cancel')}
          onConfirm={() => run(() => newsAdminApi.deleteCategory(item.id, item.version), t('feedback.deleted'))}
        >
          <Tooltip title={t('actions.delete')}>
            <Button type='text' size='small' danger icon={<DeleteOutlined />} aria-label={t('actions.delete')} />
          </Tooltip>
        </Popconfirm>
      )}
    </>
  )
}
