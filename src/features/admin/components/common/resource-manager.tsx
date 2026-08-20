'use client'

import { DeleteOutlined, EditOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons'
import {
  App,
  Button,
  Card,
  Drawer,
  Empty,
  Form,
  Grid,
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
import { useUnsavedGuard } from '../../hooks/use-unsaved-guard'
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
  /** Bộ lọc ngoài (ví dụ ô chọn trạng thái ở đầu màn) — chạy trước ô tìm kiếm. */
  filterItems?: (item: CmsCollectionMap[K]) => boolean
  /** Cho phép xóa. Bảng vận hành (dự án, người dùng) thường không cho. */
  allowDelete?: boolean
  /**
   * Cho phép mở ngăn kéo sửa. Tắt ở bảng CHỈ ĐỌC / chỉ thao tác bằng nút riêng
   * (giao dịch, subscription) — cây bút mà bấm ra một form trống thì gây hiểu
   * lầm là màn bị lỗi.
   */
  allowEdit?: boolean
  /**
   * Khối CHỈ ĐỌC hiện đầu ngăn kéo sửa — dữ liệu do khách nhập hoặc do hệ thống
   * sinh ra.
   *
   * Có mặt để `renderForm` chỉ còn đúng những trường mà VẬN HÀNH được phép đổi.
   * Bảng dự án / người dùng / lịch hẹn không phải nội dung site: sửa tên dự án,
   * địa chỉ hay tổng dự toán của khách là sửa dữ liệu của người khác — nhìn thì
   * được, đổi thì không.
   */
  renderDetail?: (item: CmsCollectionMap[K]) => ReactNode
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
  filterItems,
  allowDelete = true,
  allowEdit = true,
  renderDetail,
  drawerWidth = 560,
  extraActions,
  banner
}: ResourceManagerProps<K>) {
  type Item = CmsCollectionMap[K]

  const t = useTranslations('admin')
  const { message, modal } = App.useApp()
  const [form] = Form.useForm()
  const screens = Grid.useBreakpoint()

  const { data, isPending } = useAdminCollection(collection)
  const save = useSaveAdminItem(collection)
  const remove = useDeleteAdminItem(collection)

  const [editing, setEditing] = useState<Item | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [query, setQuery] = useState('')

  useUnsavedGuard(dirty)

  const all = useMemo(() => (data ?? []) as Item[], [data])

  const items = useMemo(() => {
    const filtered = filterItems ? all.filter(filterItems) : all
    const needle = query.trim().toLowerCase()
    if (!needle || !searchText) return filtered
    return filtered.filter((item) => searchText(item).toLowerCase().includes(needle))
  }, [all, query, searchText, filterItems])

  function openEditor(item: Item, fresh: boolean) {
    setEditing(item)
    setIsNew(fresh)
    setDirty(false)
    form.setFieldsValue(toFormValues ? toFormValues(item) : (item as unknown as Record<string, unknown>))
  }

  function closeEditor() {
    setEditing(null)
    setDirty(false)
    form.resetFields()
  }

  /** Đóng ngăn kéo — còn thay đổi chưa lưu thì hỏi lại trước khi bỏ. */
  function requestClose() {
    if (!dirty) {
      closeEditor()
      return
    }
    modal.confirm({
      title: t('actions.discardConfirmTitle'),
      content: t('actions.discardConfirmBody'),
      okText: t('actions.discard'),
      okButtonProps: { danger: true },
      cancelText: t('actions.keepEditing'),
      onOk: closeEditor
    })
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
    width: allowDelete && allowEdit ? 108 : 72,
    render: (_, record) => (
      <Space size={0}>
        {allowEdit ? (
          <Button
            type='text'
            size='small'
            icon={<EditOutlined />}
            aria-label={t('actions.edit')}
            onClick={() => openEditor(record, false)}
          />
        ) : null}
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

  /**
   * "Chưa có bản ghi nào" và "lọc không ra kết quả" là hai tình huống khác nhau:
   * cái đầu cần nút Thêm mới, cái sau cần nút xóa từ khóa. Bảng trống mà cứ hiện
   * "chưa có dữ liệu" thì người vận hành tưởng bản ghi bị mất.
   */
  const emptyState =
    query.trim() && all.length > 0 ? (
      <Empty description={t('table.noSearchResult', { query: query.trim() })}>
        <Button onClick={() => setQuery('')}>{t('table.clearSearch')}</Button>
      </Empty>
    ) : (
      <Empty description={t('table.empty')}>
        {createItem ? (
          <Button type='primary' icon={<PlusOutlined />} onClick={() => openEditor(createItem(), true)}>
            {t('actions.create')}
          </Button>
        ) : null}
      </Empty>
    )

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
        // Bảng chạy hết bề ngang thẻ; lề của ô đầu / ô cuối do `.admin-table-card`
        // trong `admin.css` trả lại, vì đó là DOM bên trong của antd.
        className='admin-table-card'
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
          // Không sửa, không xóa thì đừng bày cột Thao tác trống.
          columns={allowEdit || allowDelete ? [...columns, actionColumn] : [...columns]}
          locale={{ emptyText: isPending ? ' ' : emptyState }}
          scroll={{ x: 'max-content' }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            hideOnSinglePage: false,
            // Đếm luôn tổng để biết bộ lọc đang giấu bớt bao nhiêu bản ghi.
            showTotal: (total) => t('table.total', { total }),
            responsive: true
          }}
          size='middle'
        />
      </Card>

      <Drawer
        open={editing !== null}
        onClose={requestClose}
        // Màn hẹp: ngăn kéo 560px sẽ tràn ra ngoài, để nó phủ hết bề ngang.
        size={screens.md ? drawerWidth : '100%'}
        destroyOnHidden
        title={isNew ? t('actions.create') : t('actions.edit')}
        extra={
          <Space>
            <Button onClick={requestClose}>{t('actions.cancel')}</Button>
            <Button type='primary' loading={save.isPending} onClick={submit}>
              {t('actions.save')}
            </Button>
          </Space>
        }
      >
        {editing && renderDetail ? <div className='mb-5'>{renderDetail(editing)}</div> : null}

        {/* Gần như trường nào cũng không bắt buộc, nên `requiredMark='optional'`
            dán "(Tùy chọn)" lên hầu hết nhãn — nhiễu và làm nhãn xuống dòng.
            Để mặc định: chỉ trường bắt buộc mới có dấu sao. */}
        <Form form={form} layout='vertical' onValuesChange={() => setDirty(true)}>
          {renderForm(form)}
        </Form>
      </Drawer>
    </AdminPage>
  )
}
