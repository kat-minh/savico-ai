'use client'

import { App, Form, Input, InputNumber, Tag } from 'antd'
import { useTranslations } from 'next-intl'

import type { CmsArticleLabel } from '@/shared/cms'
import { useAdminCollection, useSaveAdminItem } from '../../hooks/use-admin-data'
import { newAdminId } from '../../services/admin.service'
import { sameName } from '../../services/catalog.service'
import { StatusSwitch } from '../common/field-kit'
import { ResourceManager } from '../common/resource-manager'

/**
 * NHÃN BÀI VIẾT (BR-136) — sửa tên, thứ tự trong bộ lọc phía khách hàng, chuyển
 * Inactive. Không xóa cứng. Nhãn còn bài Active dùng thì không chuyển Inactive
 * được — phải đổi nhãn hoặc tắt các bài đó trước.
 */
export function ArticleLabelManager() {
  const t = useTranslations('admin')
  const { message } = App.useApp()
  const { data: labels = [] } = useAdminCollection('articleLabels')
  const { data: articles = [] } = useAdminCollection('handbookArticles')
  const save = useSaveAdminItem('articleLabels')
  const activeUse = (label: CmsArticleLabel) =>
    articles.filter((article) => article.category === label.id && (article.status ?? 'active') === 'active').length
  const totalUse = (label: CmsArticleLabel) => articles.filter((article) => article.category === label.id).length

  return (
    <ResourceManager
      collection='articleLabels'
      title={t('nav.articleLabels')}
      description={t('articleLabels.description')}
      allowDelete={false}
      searchText={(item) => item.name}
      createItem={(): CmsArticleLabel => ({
        id: newAdminId('lbl'),
        name: '',
        status: 'active',
        order: labels.reduce((max, label) => Math.max(max, label.order), 0) + 1
      })}
      fromFormValues={(values, current) => ({
        ...current,
        ...values,
        name: String(values.name ?? current.name).trim()
      })}
      validate={(next) =>
        labels.some((label) => label.id !== next.id && sameName(label.name, next.name))
          ? t('articleLabels.duplicate')
          : null
      }
      rowActions={(item) => {
        const active = item.status === 'active'
        const used = activeUse(item)
        return (
          <StatusSwitch
            name={item.name}
            current={active ? 'Active' : 'Inactive'}
            next={active ? 'Inactive' : 'Active'}
            blockedReason={active && used ? t('articleLabels.inUse', { count: used }) : null}
            onConfirm={async () => {
              await save.mutateAsync({ ...item, status: active ? 'inactive' : 'active' })
              message.success(t('feedback.saved'))
            }}
          />
        )
      }}
      columns={[
        {
          title: t('articleLabels.order'),
          dataIndex: 'order',
          width: 90,
          defaultSortOrder: 'ascend',
          sorter: (a, b) => a.order - b.order
        },
        { title: t('articleLabels.name'), dataIndex: 'name' },
        {
          title: t('articleLabels.articles'),
          key: 'articles',
          width: 140,
          render: (_, record) => totalUse(record)
        },
        {
          title: t('articles.status'),
          dataIndex: 'status',
          width: 120,
          render: (status: CmsArticleLabel['status']) => (
            <Tag color={status === 'active' ? 'green' : 'default'}>{status === 'active' ? 'Active' : 'Inactive'}</Tag>
          )
        }
      ]}
      renderForm={() => (
        <>
          <Form.Item
            name='name'
            label={t('articleLabels.name')}
            rules={[
              { required: true, whitespace: true, message: t('fields.requiredMessage') },
              { max: 60, message: t('fields.maxLength', { max: 60 }) }
            ]}
          >
            <Input maxLength={60} />
          </Form.Item>
          <Form.Item
            name='order'
            label={t('articleLabels.order')}
            extra={t('articleLabels.orderHint')}
            rules={[{ required: true, type: 'integer', min: 1, message: t('articleLabels.orderRule') }]}
          >
            <InputNumber min={1} precision={0} style={{ width: 160 }} />
          </Form.Item>
        </>
      )}
    />
  )
}
