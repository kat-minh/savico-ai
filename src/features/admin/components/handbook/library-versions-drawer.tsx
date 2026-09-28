'use client'

import { CloudUploadOutlined, CopyOutlined, DeleteOutlined, EditOutlined, PictureOutlined } from '@ant-design/icons'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Alert,
  App,
  Button,
  Descriptions,
  Drawer,
  Form,
  Grid,
  Popconfirm,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography
} from 'antd'
import { useFormatter, useTranslations } from 'next-intl'
import { useState } from 'react'

import { isApiError } from '@/shared/lib/api'
import { adminKeys } from '../../api/admin.keys'
import {
  createTemplateDraft,
  deleteTemplateDraft,
  getTemplateVersions,
  publishTemplateVersion,
  saveTemplateVersion,
  type AdminVersionItem
} from '../../api/bmt/library.api'
import { useEstimateCatalog } from '../../hooks/use-estimate-catalog'
import { LibraryAssetsPanel } from './library-assets-panel'
import { LibraryContentFields, toContentFormValues, toTemplateContent } from './library-content-fields'

const { Text } = Typography

export const libraryVersionsKey = (templateId: string) => adminKeys.bmt('library', templateId, 'versions')

/**
 * PHIÊN BẢN của một mẫu (STORY-LIB-001): sửa tại chỗ bản hiện hành hoặc nháp
 * (không cấp phiên bản mới), tạo nháp từ bản hiện hành, công bố nháp thành
 * phiên bản mới, xóa nháp. Bản đã bị thay thế chỉ xem.
 */
export function LibraryVersionsDrawer({
  templateId,
  title,
  onClose,
  onChanged
}: {
  templateId: string | null
  title: string
  onClose: () => void
  onChanged: () => Promise<unknown>
}) {
  const l = useTranslations('admin.library')
  const t = useTranslations('admin')
  const format = useFormatter()
  const { message } = App.useApp()
  const screens = Grid.useBreakpoint()
  const queryClient = useQueryClient()
  const { data: catalog } = useEstimateCatalog()
  const [form] = Form.useForm()
  const [editing, setEditing] = useState<AdminVersionItem | null>(null)
  const [assetsOf, setAssetsOf] = useState<AdminVersionItem | null>(null)
  const [busy, setBusy] = useState(false)

  const key = libraryVersionsKey(templateId ?? '')
  const { data, isPending, isError, error } = useQuery({
    queryKey: key,
    queryFn: () => getTemplateVersions(templateId ?? ''),
    enabled: Boolean(templateId)
  })

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: key })
    await onChanged()
  }

  async function run(action: () => Promise<unknown>, success: string) {
    setBusy(true)
    try {
      await action()
      message.success(success)
      return true
    } catch (err) {
      message.error(isApiError(err) ? err.message : t('feedback.apiError'))
      return false
    } finally {
      await refresh()
      setBusy(false)
    }
  }

  const versionLabel = (version: AdminVersionItem) =>
    version.state === 'Published' ? l('versionN', { number: version.number ?? 0 }) : l('draft')

  const when = (iso?: string | null) =>
    iso ? format.dateTime(new Date(iso), { dateStyle: 'short', timeStyle: 'short' }) : '-'

  async function saveEdit() {
    if (!templateId || !editing) return
    const values = (await form.validateFields().catch(() => null)) as Record<string, unknown> | null
    if (!values) return
    const ok = await run(
      () => saveTemplateVersion(templateId, editing.versionId, editing.editVersion, toTemplateContent(values, catalog)),
      t('feedback.saved')
    )
    if (ok) setEditing(null)
  }

  const current = data?.versions.find((version) => version.isCurrent)

  return (
    <Drawer
      open={templateId !== null}
      onClose={onClose}
      size={screens.md ? 880 : '100%'}
      destroyOnHidden
      title={title}
      extra={
        current && data ? (
          <Popconfirm
            title={l('newDraftConfirm')}
            description={l('newDraftNote')}
            okText={t('actions.confirm')}
            cancelText={t('actions.cancel')}
            onConfirm={() =>
              run(
                () => createTemplateDraft(data.templateId, data.templateVersion, current.versionId),
                l('draftCreated')
              )
            }
          >
            <Button icon={<CopyOutlined />} loading={busy}>
              {l('newDraft')}
            </Button>
          </Popconfirm>
        ) : null
      }
    >
      <Space orientation='vertical' size={16} style={{ width: '100%' }}>
        {isError ? (
          <Alert type='error' showIcon title={isApiError(error) ? error.message : t('feedback.apiError')} />
        ) : null}
        {data ? (
          <Descriptions
            size='small'
            column={1}
            bordered
            items={[
              {
                key: 'visibility',
                label: l('visibility'),
                children: data.isHidden ? <Tag>{l('hidden')}</Tag> : <Tag color='green'>{l('shown')}</Tag>
              },
              {
                key: 'current',
                label: l('currentVersion'),
                children: current ? versionLabel(current) : l('notPublished')
              }
            ]}
          />
        ) : null}

        <Table<AdminVersionItem>
          rowKey='versionId'
          size='small'
          loading={isPending || busy}
          dataSource={data?.versions ?? []}
          pagination={false}
          scroll={{ x: 'max-content' }}
          columns={[
            {
              title: l('version'),
              key: 'version',
              render: (_, record) => (
                <Space size={4} wrap>
                  <Text strong>{versionLabel(record)}</Text>
                  {record.isCurrent ? <Tag color='green'>{l('current')}</Tag> : null}
                  {record.isReadOnly ? <Tag>{l('readOnly')}</Tag> : null}
                </Space>
              )
            },
            {
              title: l('name'),
              key: 'name',
              render: (_, record) => record.name || <Text type='secondary'>{l('untitled')}</Text>
            },
            {
              title: l('assets'),
              dataIndex: 'assetCount',
              width: 90
            },
            {
              title: l('modifiedAt'),
              key: 'modified',
              render: (_, record) => when(record.publishedAtUtc ?? record.modifiedAtUtc)
            },
            {
              title: t('table.actions'),
              key: 'actions',
              fixed: 'right',
              render: (_, record) => (
                <Space size={0}>
                  <Tooltip title={l('manageAssets')}>
                    <Button
                      type='text'
                      size='small'
                      icon={<PictureOutlined />}
                      aria-label={l('manageAssets')}
                      onClick={() => setAssetsOf(record)}
                    />
                  </Tooltip>
                  {!record.isReadOnly ? (
                    <Tooltip title={t('actions.edit')}>
                      <Button
                        type='text'
                        size='small'
                        icon={<EditOutlined />}
                        aria-label={t('actions.edit')}
                        onClick={() => {
                          setEditing(record)
                          form.resetFields()
                          form.setFieldsValue(toContentFormValues(record))
                        }}
                      />
                    </Tooltip>
                  ) : null}
                  {record.state === 'Draft' && data ? (
                    <Popconfirm
                      title={l('publishConfirm')}
                      description={l('publishNote')}
                      okText={t('actions.confirm')}
                      cancelText={t('actions.cancel')}
                      onConfirm={() =>
                        run(
                          () =>
                            publishTemplateVersion(data.templateId, record.versionId, {
                              expectedTemplateVersion: data.templateVersion,
                              expectedEditVersion: record.editVersion,
                              expectedCurrentVersionId: data.currentVersionId
                            }),
                          l('published')
                        )
                      }
                    >
                      <Tooltip title={l('publish')}>
                        <Button type='text' size='small' icon={<CloudUploadOutlined />} aria-label={l('publish')} />
                      </Tooltip>
                    </Popconfirm>
                  ) : null}
                  {record.state === 'Draft' && data ? (
                    <Popconfirm
                      title={l('deleteDraftConfirm')}
                      okText={t('actions.delete')}
                      okButtonProps={{ danger: true }}
                      cancelText={t('actions.cancel')}
                      onConfirm={() =>
                        run(
                          () => deleteTemplateDraft(data.templateId, record.versionId, record.editVersion),
                          t('feedback.deleted')
                        )
                      }
                    >
                      <Button
                        type='text'
                        size='small'
                        danger
                        icon={<DeleteOutlined />}
                        aria-label={t('actions.delete')}
                      />
                    </Popconfirm>
                  ) : null}
                </Space>
              )
            }
          ]}
        />
        <Text type='secondary' style={{ fontSize: 12 }}>
          {l('versionsHint')}
        </Text>
      </Space>

      <Drawer
        open={editing !== null}
        onClose={() => setEditing(null)}
        size={screens.md ? 640 : '100%'}
        destroyOnHidden
        title={editing ? `${t('actions.edit')} · ${versionLabel(editing)}` : ''}
        extra={
          <Space>
            <Button onClick={() => setEditing(null)}>{t('actions.cancel')}</Button>
            <Button type='primary' loading={busy} onClick={() => void saveEdit()}>
              {t('actions.save')}
            </Button>
          </Space>
        }
      >
        {editing?.isCurrent ? (
          <Alert type='info' showIcon style={{ marginBottom: 16 }} title={l('editCurrentNote')} />
        ) : null}
        <Form form={form} layout='vertical'>
          <LibraryContentFields form={form} />
        </Form>
      </Drawer>

      <Drawer
        open={assetsOf !== null}
        onClose={() => setAssetsOf(null)}
        size={screens.md ? 720 : '100%'}
        destroyOnHidden
        title={assetsOf ? `${l('manageAssets')} · ${versionLabel(assetsOf)}` : ''}
      >
        {assetsOf && templateId ? (
          <LibraryAssetsPanel
            templateId={templateId}
            versionId={assetsOf.versionId}
            readOnly={assetsOf.isReadOnly}
            onChanged={refresh}
          />
        ) : null}
      </Drawer>
    </Drawer>
  )
}
