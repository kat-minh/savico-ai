'use client'

import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  DeleteOutlined,
  FileOutlined,
  PlusOutlined,
  StarOutlined
} from '@ant-design/icons'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Alert,
  App,
  Button,
  Checkbox,
  Form,
  Image,
  Input,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography
} from 'antd'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

import { isApiError } from '@/shared/lib/api'
import { adminKeys } from '../../api/admin.keys'
import {
  attachTemplateAsset,
  createTemplateAsset,
  detachTemplateAsset,
  getVersionAssets,
  reorderTemplateAssets,
  type AdminVersionAssetItem,
  type LibraryAssetKind
} from '../../api/bmt/library.api'
import { useHttpsUrlRule } from '../common/https-image-field'
import { fileNameOf, resolveMediaType } from './library-assets.helpers'

const { Text } = Typography

export const libraryAssetsKey = (templateId: string, versionId: string) =>
  adminKeys.bmt('library', templateId, 'assets', versionId)

/**
 * Tài nguyên của MỘT phiên bản: ảnh (JPG/PNG/WebP) và tệp đính kèm
 * (PDF/DWG/DXF), thứ tự hiển thị và ảnh đại diện.
 *
 * API không nhận tệp — chỉ nhận URL https đã upload sẵn lên kho presign — nên
 * màn nhập URL. Thêm = tạo tài nguyên của mẫu rồi gắn vào cuối phiên bản. Mỗi
 * thao tác gửi `editVersion` đang thấy; bị sửa ở nơi khác thì BE trả 409 và bảng
 * tải lại.
 */
export function LibraryAssetsPanel({
  templateId,
  versionId,
  readOnly,
  onChanged
}: {
  templateId: string
  versionId: string
  readOnly: boolean
  onChanged: () => Promise<unknown>
}) {
  const l = useTranslations('admin.library')
  const t = useTranslations('admin')
  const { message } = App.useApp()
  const queryClient = useQueryClient()
  const [form] = Form.useForm()
  const httpsRule = useHttpsUrlRule()
  const [busy, setBusy] = useState(false)
  const kind = (Form.useWatch('kind', form) as LibraryAssetKind | undefined) ?? 'Image'

  const key = libraryAssetsKey(templateId, versionId)
  const { data, isPending, isError, error } = useQuery({
    queryKey: key,
    queryFn: () => getVersionAssets(templateId, versionId)
  })
  const assets = data?.assets ?? []
  const editable = !readOnly && !data?.isReadOnly

  /** Chạy một thao tác ghi: báo lỗi của BE, luôn tải lại bảng (kể cả khi 409). */
  async function run(action: () => Promise<unknown>, success = t('feedback.saved')) {
    setBusy(true)
    try {
      await action()
      message.success(success)
      return true
    } catch (err) {
      message.error(isApiError(err) ? err.message : t('feedback.apiError'))
      return false
    } finally {
      await queryClient.invalidateQueries({ queryKey: key })
      await onChanged()
      setBusy(false)
    }
  }

  const editVersion = () => data?.editVersion ?? 0

  const move = (asset: AdminVersionAssetItem, direction: -1 | 1) => {
    const index = assets.indexOf(asset)
    const other = assets[index + direction]
    if (!other) return
    void run(() =>
      reorderTemplateAssets(templateId, versionId, editVersion(), [
        { assetId: asset.assetId, position: other.position },
        { assetId: other.assetId, position: asset.position }
      ])
    )
  }

  async function add() {
    const values = (await form.validateFields().catch(() => null)) as {
      kind: LibraryAssetKind
      url: string
      originalName?: string
      setAsCover?: boolean
    } | null
    if (!values) return
    const url = values.url.trim()
    const originalName = values.originalName?.trim() || fileNameOf(url)
    const mediaType = resolveMediaType(values.kind, url, originalName)
    if (!mediaType) {
      form.setFields([{ name: 'url', errors: [l(values.kind === 'Image' ? 'imageFormat' : 'attachmentFormat')] }])
      return
    }
    const position = assets.reduce((max, asset) => Math.max(max, asset.position), 0) + 1
    const ok = await run(async () => {
      const { assetId } = await createTemplateAsset(templateId, { kind: values.kind, url, originalName, mediaType })
      await attachTemplateAsset(templateId, versionId, assetId, {
        expectedEditVersion: editVersion(),
        position,
        setAsCover: values.kind === 'Image' && Boolean(values.setAsCover)
      })
    }, l('assetAdded'))
    if (ok) form.resetFields(['url', 'originalName', 'setAsCover'])
  }

  return (
    <Space orientation='vertical' size={16} style={{ width: '100%' }}>
      {isError ? (
        <Alert type='error' showIcon title={isApiError(error) ? error.message : t('feedback.apiError')} />
      ) : null}
      {!editable ? <Alert type='info' showIcon title={l('readOnlyVersion')} /> : null}

      <Table<AdminVersionAssetItem>
        rowKey='assetId'
        size='small'
        loading={isPending || busy}
        dataSource={assets}
        pagination={false}
        scroll={{ x: 'max-content' }}
        locale={{ emptyText: l('noAssets') }}
        columns={[
          { title: '#', dataIndex: 'position', width: 50 },
          {
            title: l('asset'),
            key: 'asset',
            render: (_, record) => (
              <Space size={10}>
                {record.kind === 'Image' ? (
                  <Image
                    src={record.url}
                    alt=''
                    width={64}
                    height={46}
                    style={{ objectFit: 'cover', borderRadius: 6 }}
                  />
                ) : (
                  <FileOutlined style={{ fontSize: 24 }} />
                )}
                <Space orientation='vertical' size={0}>
                  <a href={record.url} target='_blank' rel='noreferrer'>
                    {record.originalName || fileNameOf(record.url)}
                  </a>
                  <Space size={4}>
                    <Tag>{l(record.kind === 'Image' ? 'kindImage' : 'kindAttachment')}</Tag>
                    {record.isCover ? <Tag color='gold'>{l('cover')}</Tag> : null}
                  </Space>
                </Space>
              </Space>
            )
          },
          ...(editable
            ? [
                {
                  title: t('table.actions'),
                  key: 'actions',
                  render: (_: unknown, record: AdminVersionAssetItem) => {
                    const index = assets.indexOf(record)
                    return (
                      <Space size={0}>
                        <Button
                          type='text'
                          size='small'
                          icon={<ArrowUpOutlined />}
                          aria-label={l('moveUp')}
                          disabled={index === 0}
                          onClick={() => move(record, -1)}
                        />
                        <Button
                          type='text'
                          size='small'
                          icon={<ArrowDownOutlined />}
                          aria-label={l('moveDown')}
                          disabled={index === assets.length - 1}
                          onClick={() => move(record, 1)}
                        />
                        {record.kind === 'Image' && !record.isCover ? (
                          <Tooltip title={l('setCover')}>
                            <Button
                              type='text'
                              size='small'
                              icon={<StarOutlined />}
                              aria-label={l('setCover')}
                              onClick={() =>
                                void run(() =>
                                  attachTemplateAsset(templateId, versionId, record.assetId, {
                                    expectedEditVersion: editVersion(),
                                    position: record.position,
                                    setAsCover: true
                                  })
                                )
                              }
                            />
                          </Tooltip>
                        ) : null}
                        <Popconfirm
                          title={l('detachConfirm')}
                          description={l('detachNote')}
                          okText={t('actions.confirm')}
                          cancelText={t('actions.cancel')}
                          onConfirm={() =>
                            run(() => detachTemplateAsset(templateId, versionId, record.assetId, editVersion()))
                          }
                        >
                          <Button type='text' size='small' danger icon={<DeleteOutlined />} aria-label={l('detach')} />
                        </Popconfirm>
                      </Space>
                    )
                  }
                }
              ]
            : [])
        ]}
      />

      {editable ? (
        <Form form={form} layout='vertical' initialValues={{ kind: 'Image', setAsCover: false }}>
          <Text strong style={{ display: 'block', marginBottom: 8 }}>
            {l('addAsset')}
          </Text>
          <Alert type='warning' showIcon style={{ marginBottom: 12 }} title={l('uploadMissing')} />
          <Form.Item name='kind' label={l('assetKind')}>
            <Select
              options={[
                { value: 'Image', label: l('kindImage') },
                { value: 'Attachment', label: l('kindAttachment') }
              ]}
            />
          </Form.Item>
          <Form.Item
            name='url'
            label={l('assetUrl')}
            extra={l(kind === 'Image' ? 'imageFormat' : 'attachmentFormat')}
            rules={[{ required: true, whitespace: true, message: t('fields.requiredMessage') }, httpsRule]}
          >
            <Input placeholder='https://…' />
          </Form.Item>
          <Form.Item name='originalName' label={l('originalName')} extra={l('originalNameHint')}>
            <Input />
          </Form.Item>
          {kind === 'Image' ? (
            <Form.Item name='setAsCover' valuePropName='checked'>
              <Checkbox>{l('setCover')}</Checkbox>
            </Form.Item>
          ) : null}
          <Button type='primary' icon={<PlusOutlined />} loading={busy} onClick={() => void add()}>
            {l('addAsset')}
          </Button>
        </Form>
      ) : null}
    </Space>
  )
}
