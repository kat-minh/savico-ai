'use client'

import { DeleteOutlined, EditOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons'
import {
  App,
  Button,
  Card,
  Drawer,
  Form,
  Input,
  Popconfirm,
  Space,
  Table,
  type FormInstance,
  type TableProps
} from 'antd'
import { useTranslations } from 'next-intl'
import { useMemo, useState, type ReactNode } from 'react'

import { isLocalizedCollection, type CmsCollection, type CmsCollectionMap } from '@/shared/cms'
import { useAdminCollection, useDeleteAdminItem, useSaveAdminItem } from '../../hooks/use-admin-data'
import { AdminPage } from './admin-page'
import { ContentLocaleBanner } from './content-locale-banner'

/** Mọi bản ghi trong kho đều có `id` — engine dựa vào đó để sửa / xóa. */
type WithId = { id: string }

export interface ResourceManagerProps<K extends CmsCollection> {
  collection: K
  title: string
  description?: string
  columns: NonNullable<TableProps<CmsCollectionMap[K]>['columns']>
  /** Các trường trong Drawer sửa. Nhận `form` để bật/tắt trường theo giá trị khác. */
  renderForm: (form: FormInstance) => ReactNode
  /** Bản ghi trống khi bấm "Thêm mới". `null` = màn chỉ sửa, không thêm. */
  createItem?: () => CmsCollectionMap[K]
  /** Bản ghi → giá trị form. Mặc định dùng thẳng bản ghi. */
  toFormValues?: (item: CmsCollectionMap[K]) => Record<string, unknown>
  /** Giá trị form → bản ghi. Mặc định trộn đè lên bản ghi đang sửa. */
  fromFormValues?: (values: Record<string, unknown>, current: CmsCollectionMap[K]) => CmsCollectionMap[K]
  /** Chuỗi để lọc theo ô tìm kiếm. */
  searchText?: (item: CmsCollectionMap[K]) => string
  /** Cho phép xóa. Bảng vận hành (dự án, người dùng) thường không cho. */
  allowDelete?: boolean
  drawerWidth?: number
  /** Nút phụ cạnh nút "Thêm mới". */
  extraActions?: ReactNode
  /** Khối hiện phía trên bảng (thẻ số liệu, bộ lọc riêng…). */
  banner?: ReactNode
}

/**
 * Engine CRUD dùng chung cho mọi bảng của khu quản trị.
 *
 * Mười màn quản lý đều cùng một hình dạng — bảng + ô tìm + Drawer sửa + xác nhận
 * xóa — nên chúng khai báo cột và các trường của form, phần còn lại chạy ở đây.
 * Cách này giữ mọi màn hành xử giống nhau và sửa một chỗ là cả khu đổi theo.
 */
export function ResourceManager<K extends CmsCollection>({
  collection,
  title,
  description,
  columns,
  renderForm,
  createItem,
  toFormValues,
  fromFormValues,
  searchText,
  allowDelete = true,
  drawerWidth = 560,
  extraActions,
  banner
}: ResourceManagerProps<K>) {
  type Item = CmsCollectionMap[K]

  const t = useTranslations('admin')
  const { message } = App.useApp()
  const [form] = Form.useForm()

  const { data, isPending } = useAdminCollection(collection)
  const save = useSaveAdminItem(collection)
  const remove = useDeleteAdminItem(collection)

  const [editing, setEditing] = useState<Item | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [query, setQuery] = useState('')

  const items = useMemo(() => {
    const all = (data ?? []) as Item[]
    const needle = query.trim().toLowerCase()
    if (!needle || !searchText) return all
    return all.filter((item) => searchText(item).toLowerCase().includes(needle))
  }, [data, query, searchText])

  function openEditor(item: Item, fresh: boolean) {
    setEditing(item)
    setIsNew(fresh)
    form.setFieldsValue(toFormValues ? toFormValues(item) : (item as unknown as Record<string, unknown>))
  }

  function closeEditor() {
    setEditing(null)
    form.resetFields()
  }

  async function submit() {
    if (!editing) return
    const values = (await form.validateFields()) as Record<string, unknown>
    const next = fromFormValues ? fromFormValues(values, editing) : ({ ...editing, ...values } as Item)
    await save.mutateAsync(next)
    message.success(isNew ? t('feedback.created') : t('feedback.saved'))
    closeEditor()
  }

  const actionColumn: NonNullable<TableProps<Item>['columns']>[number] = {
    title: t('table.actions'),
    key: 'actions',
    fixed: 'right',
    width: allowDelete ? 108 : 72,
    render: (_, record) => (
      <Space size={0}>
        <Button
          type='text'
          size='small'
          icon={<EditOutlined />}
          aria-label={t('actions.edit')}
          onClick={() => openEditor(record, false)}
        />
        {allowDelete ? (
          <Popconfirm
            title={t('actions.deleteConfirmTitle')}
            description={t('actions.deleteConfirmBody')}
            okText={t('actions.delete')}
            okButtonProps={{ danger: true }}
            cancelText={t('actions.cancel')}
            onConfirm={async () => {
              await remove.mutateAsync((record as WithId).id)
              message.success(t('feedback.deleted'))
            }}
          >
            <Button type='text' size='small' danger icon={<DeleteOutlined />} aria-label={t('actions.delete')} />
          </Popconfirm>
        ) : null}
      </Space>
    )
  }

  return (
    <AdminPage
      title={title}
      description={description}
      actions={
        <>
          {extraActions}
          {createItem ? (
            <Button type='primary' icon={<PlusOutlined />} onClick={() => openEditor(createItem(), true)}>
              {t('actions.create')}
            </Button>
          ) : null}
        </>
      }
    >
      {isLocalizedCollection(collection) ? <ContentLocaleBanner /> : null}
      {banner}

      <Card
        styles={{ body: { padding: 0 } }}
        title={
          searchText ? (
            <Input
              allowClear
              prefix={<SearchOutlined />}
              placeholder={t('table.searchPlaceholder')}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              style={{ maxWidth: 320 }}
            />
          ) : undefined
        }
      >
        <Table<Item>
          rowKey={(record) => (record as WithId).id}
          loading={isPending}
          dataSource={items}
          columns={[...columns, actionColumn]}
          scroll={{ x: 'max-content' }}
          pagination={{ pageSize: 10, showSizeChanger: true, hideOnSinglePage: false }}
          size='middle'
        />
      </Card>

      <Drawer
        open={editing !== null}
        onClose={closeEditor}
        size={drawerWidth}
        destroyOnHidden
        title={isNew ? t('actions.create') : t('actions.edit')}
        extra={
          <Space>
            <Button onClick={closeEditor}>{t('actions.cancel')}</Button>
            <Button type='primary' loading={save.isPending} onClick={submit}>
              {t('actions.save')}
            </Button>
          </Space>
        }
      >
        {/* Gần như trường nào cũng không bắt buộc, nên `requiredMark='optional'`
            dán "(Tùy chọn)" lên hầu hết nhãn — nhiễu và làm nhãn xuống dòng.
            Để mặc định: chỉ trường bắt buộc mới có dấu sao. */}
        <Form form={form} layout='vertical'>
          {renderForm(form)}
        </Form>
      </Drawer>
    </AdminPage>
  )
}
