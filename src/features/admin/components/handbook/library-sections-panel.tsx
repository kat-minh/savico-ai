'use client'

import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
  DeleteOutlined,
  EditOutlined,
  FileOutlined,
  LoadingOutlined,
  StarOutlined,
  UploadOutlined
} from '@ant-design/icons'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Alert,
  App,
  Button,
  Checkbox,
  Collapse,
  Image,
  Input,
  Modal,
  Popconfirm,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
  Upload
} from 'antd'
import { useTranslations } from 'next-intl'
import { useEffect, useRef, useState } from 'react'

import { isApiError } from '@/shared/lib/api'
import { adminKeys } from '../../api/admin.keys'
import { detachTemplateAsset } from '../../api/bmt/library.api'
import {
  createSection,
  listSectionAssets,
  listSections,
  renameSection,
  reorderSectionAssets,
  reorderSections,
  setVersionCover,
  type SectionAssetItem,
  type SectionItem
} from '../../api/bmt/library-sections.api'
import {
  LIBRARY_ACCEPT,
  buildAssetReorder,
  buildSectionReorder,
  chainEditVersion,
  formatFileSize,
  isVersionConflict,
  nextPosition,
  resolveFileType
} from '../../api/bmt/library-sections.logic'
import { uploadFileToSection, type UploadPhase } from '../../api/bmt/library-upload'
import { useLibraryErrorMessage } from './library-error-message'

const { Text } = Typography

export const librarySectionsKey = (templateId: string, versionId: string) =>
  adminKeys.bmt('library', templateId, 'sections', versionId)

const sectionFilesKey = (templateId: string, versionId: string, sectionId: string) =>
  [...librarySectionsKey(templateId, versionId), 'files', sectionId] as const

type RowPhase = 'waiting' | UploadPhase | 'done' | 'error'

/** Một dòng trong hàng đợi tải lên của phiên làm việc hiện tại. */
interface UploadRow {
  id: string
  sectionId: string
  name: string
  phase: RowPhase
  error?: string
}

/** Kết quả của một thao tác ghi: BE trả `editVersion` mới để thao tác kế tiếp dùng. */
type Mutation = (editVersion: number) => Promise<{ editVersion?: unknown }>

interface PanelProps {
  templateId: string
  versionId: string
  readOnly: boolean
  onChanged: () => Promise<unknown>
}

/**
 * SECTION và TỆP của MỘT phiên bản mẫu (BR-LIB-001 khoản 17/20).
 *
 * Mọi ảnh và tệp PDF/DWG/DXF thuộc một section do người quản lý tự đặt tên; BE không còn nhận URL rời.
 * Tải lên đi thẳng lên kho (PUT trình duyệt → BizFly), BE xác minh bytes rồi mới gắn vào section; section
 * chưa có tệp là "đang chuẩn bị" và khách chưa thấy. Mỗi lần ghi tăng `editVersion`, nên các tệp được tải
 * TUẦN TỰ và tệp sau dùng số mới của tệp trước; có người sửa cùng lúc thì BE trả 409 và màn tải lại.
 */
export function LibrarySectionsPanel({ templateId, versionId, readOnly, onChanged }: PanelProps) {
  const l = useTranslations('admin.library')
  const s = useTranslations('admin.library.sections')
  const t = useTranslations('admin')
  const { message } = App.useApp()
  const queryClient = useQueryClient()
  const errorMessage = useLibraryErrorMessage()

  const key = librarySectionsKey(templateId, versionId)
  const { data, isPending, isError, error } = useQuery({
    queryKey: [...key, 'list'],
    queryFn: () => listSections(templateId, versionId)
  })
  const sections = data?.sections ?? []
  const editable = !readOnly && !data?.isReadOnly

  /** `editVersion` mới nhất: nạp từ lần đọc, rồi nối tiếp theo phản hồi của từng lần ghi. */
  const editVersionRef = useRef(0)
  useEffect(() => {
    if (data) editVersionRef.current = data.editVersion
  }, [data])

  const [busy, setBusy] = useState(false)
  const [newName, setNewName] = useState('')
  const [renaming, setRenaming] = useState<{ sectionId: string; name: string } | null>(null)
  const [coverFirst, setCoverFirst] = useState(true)
  const [uploads, setUploads] = useState<UploadRow[]>([])
  const [uploadingNow, setUploadingNow] = useState(false)
  const uploadLock = useRef(false)

  // Mở sẵn section đầu tiên khi dữ liệu về lần đầu.
  const [open, setOpen] = useState<string[]>([])
  const opened = useRef(false)
  useEffect(() => {
    if (data && !opened.current) {
      opened.current = true
      setOpen(data.sections.slice(0, 1).map((section) => section.sectionId))
    }
  }, [data])

  const refreshAll = async () => {
    await queryClient.invalidateQueries({ queryKey: key })
    await onChanged()
  }

  /** Chạy một thao tác ghi: báo lỗi, luôn tải lại (kể cả khi 409) và nối tiếp `editVersion`. */
  async function run(action: Mutation, success: string): Promise<boolean> {
    setBusy(true)
    try {
      const result = await action(editVersionRef.current)
      editVersionRef.current = chainEditVersion(editVersionRef.current, result)
      message.success(success)
      return true
    } catch (err) {
      message.error(errorMessage(err))
      if (isApiError(err) && isVersionConflict(err.messageCode)) message.warning(s('reloaded'))
      return false
    } finally {
      await refreshAll()
      setBusy(false)
    }
  }

  async function addSection() {
    const name = newName.trim()
    if (!name) {
      message.warning(s('nameRequired'))
      return
    }
    const ok = await run((ev) => createSection(templateId, versionId, ev, name), s('added'))
    if (ok) setNewName('')
  }

  async function saveRename() {
    if (!renaming) return
    const name = renaming.name.trim()
    if (!name) {
      message.warning(s('nameRequired'))
      return
    }
    const target = renaming.sectionId
    const ok = await run((ev) => renameSection(templateId, versionId, target, ev, name), s('renamed'))
    if (ok) setRenaming(null)
  }

  function moveSection(index: number, direction: -1 | 1) {
    const payload = buildSectionReorder(sections, index, direction)
    if (!payload) return
    void run((ev) => reorderSections(templateId, versionId, ev, payload.items), s('reordered'))
  }

  /**
   * Tải một loạt tệp vào một section, TUẦN TỰ. Trước khi bắt đầu đọc lại `editVersion` và vị trí cuối của
   * section; mỗi tệp dùng số mới của tệp trước. Lỗi xung đột phiên bản hoặc kho không sẵn sàng thì dừng cả
   * loạt (tiếp tục cũng vô ích), các lỗi riêng từng tệp (sai định dạng, bị từ chối) thì bỏ qua tệp đó.
   */
  async function uploadBatch(sectionId: string, files: File[]) {
    if (uploadLock.current || files.length === 0) return
    uploadLock.current = true
    setUploadingNow(true)

    const rows: UploadRow[] = files.map((file) => ({
      id: crypto.randomUUID(),
      sectionId,
      name: file.name,
      phase: 'waiting'
    }))
    setUploads(rows)
    const patch = (id: string, change: Partial<UploadRow>) =>
      setUploads((previous) => previous.map((row) => (row.id === id ? { ...row, ...change } : row)))

    try {
      const latest = await listSectionAssets(templateId, versionId, sectionId)
      let editVersion = latest.editVersion
      let position = nextPosition(latest.assets.map((asset) => asset.position))
      let coverPending = coverFirst && !latest.coverAssetId

      let stopped = false
      for (const [index, file] of files.entries()) {
        const row = rows[index]
        if (!row || stopped) break
        const isImage = resolveFileType(file.name)?.kind === 'Image'
        try {
          const result = await uploadFileToSection({
            templateId,
            versionId,
            sectionId,
            file,
            editVersion,
            position,
            setAsCover: coverPending && isImage,
            onPhase: (phase) => patch(row.id, { phase })
          })
          editVersion = result.editVersion
          position += 1
          if (coverPending && isImage) coverPending = false
          patch(row.id, { phase: 'done' })
        } catch (err) {
          patch(row.id, { phase: 'error', error: errorMessage(err) })
          // `LibraryStorageUnavailable` chỉ chặn tệp đính kèm (PDF/DWG/DXF) khi kho chưa cấu hình, ảnh vẫn tải được
          // nên lỗi này tính theo từng tệp và loạt tải vẫn đi tiếp.
          if (
            isApiError(err) &&
            (isVersionConflict(err.messageCode) ||
              err.messageCode === 'MediaStorageUnavailable' ||
              err.messageCode === 'LibraryVersionReadOnly')
          ) {
            stopped = true
            if (isVersionConflict(err.messageCode)) message.warning(s('reloaded'))
          }
        }
      }
      // Tệp chưa kịp tải vì cả loạt bị dừng.
      setUploads((previous) =>
        previous.map((row) => (row.phase === 'waiting' ? { ...row, phase: 'error', error: s('uploadSkipped') } : row))
      )
    } catch (err) {
      message.error(errorMessage(err))
      setUploads([])
    } finally {
      uploadLock.current = false
      setUploadingNow(false)
      await refreshAll()
    }
  }

  const disabled = busy || uploadingNow

  return (
    <Space orientation='vertical' size={16} style={{ width: '100%' }}>
      {isError ? <Alert type='error' showIcon title={errorMessage(error)} /> : null}
      {!editable ? <Alert type='info' showIcon title={l('readOnlyVersion')} /> : null}
      <Alert type='info' showIcon title={s('intro')} />

      {editable ? (
        <Space orientation='vertical' size={8} style={{ width: '100%' }}>
          <Input.Search
            value={newName}
            onChange={(event) => setNewName(event.target.value)}
            onSearch={() => void addSection()}
            placeholder={s('addPlaceholder')}
            enterButton={s('add')}
            maxLength={200}
            disabled={disabled}
          />
          <Checkbox checked={coverFirst} onChange={(event) => setCoverFirst(event.target.checked)}>
            {s('setFirstAsCover')}
          </Checkbox>
        </Space>
      ) : null}

      {isPending ? (
        <Text type='secondary'>
          <LoadingOutlined /> {s('loading')}
        </Text>
      ) : sections.length === 0 ? (
        <Text type='secondary'>{s('empty')}</Text>
      ) : (
        <Collapse
          activeKey={open}
          onChange={(keys) => setOpen(Array.isArray(keys) ? keys : [keys])}
          destroyOnHidden
          items={sections.map((section, index) => ({
            key: section.sectionId,
            label: (
              <Space size={8} wrap>
                <Text strong>{section.name ?? s('untitled')}</Text>
                {section.isPreparing ? <Tag color='orange'>{s('preparing')}</Tag> : null}
                <Tag>{s('fileCount', { count: section.assetCount })}</Tag>
              </Space>
            ),
            extra: editable ? (
              // Các nút ở đầu thẻ không được làm đóng/mở thẻ.
              <span onClick={(event) => event.stopPropagation()}>
                <Tooltip title={l('moveUp')}>
                  <Button
                    type='text'
                    size='small'
                    icon={<ArrowUpOutlined />}
                    aria-label={l('moveUp')}
                    disabled={disabled || index === 0}
                    onClick={() => moveSection(index, -1)}
                  />
                </Tooltip>
                <Tooltip title={l('moveDown')}>
                  <Button
                    type='text'
                    size='small'
                    icon={<ArrowDownOutlined />}
                    aria-label={l('moveDown')}
                    disabled={disabled || index === sections.length - 1}
                    onClick={() => moveSection(index, 1)}
                  />
                </Tooltip>
                <Tooltip title={s('rename')}>
                  <Button
                    type='text'
                    size='small'
                    icon={<EditOutlined />}
                    aria-label={s('rename')}
                    disabled={disabled}
                    onClick={() => setRenaming({ sectionId: section.sectionId, name: section.name ?? '' })}
                  />
                </Tooltip>
              </span>
            ) : null,
            children: (
              <SectionFiles
                templateId={templateId}
                versionId={versionId}
                section={section}
                editable={editable}
                disabled={disabled}
                uploads={uploads.filter((row) => row.sectionId === section.sectionId)}
                onUpload={(files) => void uploadBatch(section.sectionId, files)}
                run={run}
              />
            )
          }))}
        />
      )}

      <Modal
        open={renaming !== null}
        title={s('renameTitle')}
        okText={s('rename')}
        cancelText={t('actions.cancel')}
        confirmLoading={busy}
        onOk={() => void saveRename()}
        onCancel={() => setRenaming(null)}
        destroyOnHidden
      >
        <Input
          value={renaming?.name ?? ''}
          onChange={(event) => setRenaming((current) => (current ? { ...current, name: event.target.value } : current))}
          onPressEnter={() => void saveRename()}
          maxLength={200}
          autoFocus
        />
      </Modal>
    </Space>
  )
}

interface SectionFilesProps {
  templateId: string
  versionId: string
  section: SectionItem
  editable: boolean
  disabled: boolean
  uploads: UploadRow[]
  onUpload: (files: File[]) => void
  run: (action: Mutation, success: string) => Promise<boolean>
}

/** Danh sách tệp của một section + nút tải lên + tiến trình các tệp đang tải. */
function SectionFiles({
  templateId,
  versionId,
  section,
  editable,
  disabled,
  uploads,
  onUpload,
  run
}: SectionFilesProps) {
  const l = useTranslations('admin.library')
  const s = useTranslations('admin.library.sections')
  const t = useTranslations('admin')

  const { data, isPending } = useQuery({
    queryKey: sectionFilesKey(templateId, versionId, section.sectionId),
    queryFn: () => listSectionAssets(templateId, versionId, section.sectionId)
  })
  const assets = data?.assets ?? []

  function moveFile(index: number, direction: -1 | 1) {
    const payload = buildAssetReorder(assets, index, direction, section.sectionId)
    if (!payload) return
    void run((ev) => reorderSectionAssets(templateId, versionId, ev, payload), s('reordered'))
  }

  return (
    <Space orientation='vertical' size={12} style={{ width: '100%' }}>
      <Table<SectionAssetItem>
        rowKey='assetId'
        size='small'
        loading={isPending}
        dataSource={assets}
        pagination={false}
        scroll={{ x: 'max-content' }}
        locale={{ emptyText: s('noFiles') }}
        columns={[
          { title: '#', dataIndex: 'position', width: 50 },
          {
            title: s('file'),
            key: 'file',
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
                    {record.originalName || record.assetId}
                  </a>
                  <Space size={4} wrap>
                    <Tag>{l(record.kind === 'Image' ? 'kindImage' : 'kindAttachment')}</Tag>
                    {record.isCover ? <Tag color='gold'>{l('cover')}</Tag> : null}
                    {record.sizeBytes ? (
                      <Text type='secondary' style={{ fontSize: 12 }}>
                        {formatFileSize(record.sizeBytes)}
                      </Text>
                    ) : null}
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
                  render: (_: unknown, record: SectionAssetItem) => {
                    const index = assets.indexOf(record)
                    return (
                      <Space size={0}>
                        <Button
                          type='text'
                          size='small'
                          icon={<ArrowUpOutlined />}
                          aria-label={l('moveUp')}
                          disabled={disabled || index === 0}
                          onClick={() => moveFile(index, -1)}
                        />
                        <Button
                          type='text'
                          size='small'
                          icon={<ArrowDownOutlined />}
                          aria-label={l('moveDown')}
                          disabled={disabled || index === assets.length - 1}
                          onClick={() => moveFile(index, 1)}
                        />
                        {record.kind === 'Image' && !record.isCover ? (
                          <Tooltip title={l('setCover')}>
                            <Button
                              type='text'
                              size='small'
                              icon={<StarOutlined />}
                              aria-label={l('setCover')}
                              disabled={disabled}
                              onClick={() =>
                                void run(
                                  (ev) => setVersionCover(templateId, versionId, ev, record.assetId),
                                  s('coverSet')
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
                            run((ev) => detachTemplateAsset(templateId, versionId, record.assetId, ev), s('detached'))
                          }
                        >
                          <Button
                            type='text'
                            size='small'
                            danger
                            icon={<DeleteOutlined />}
                            aria-label={l('detach')}
                            disabled={disabled}
                          />
                        </Popconfirm>
                      </Space>
                    )
                  }
                }
              ]
            : [])
        ]}
      />

      {uploads.length > 0 ? (
        <Space orientation='vertical' size={4} style={{ width: '100%' }}>
          {uploads.map((row) => (
            <Space key={row.id} size={8} wrap>
              {row.phase === 'done' ? (
                <CheckCircleFilled style={{ color: 'var(--ant-color-success)' }} />
              ) : row.phase === 'error' ? (
                <CloseCircleFilled style={{ color: 'var(--ant-color-error)' }} />
              ) : (
                <LoadingOutlined />
              )}
              <Text>{row.name}</Text>
              <Text type={row.phase === 'error' ? 'danger' : 'secondary'} style={{ fontSize: 12 }}>
                {row.phase === 'error' && row.error ? row.error : s(`phase.${row.phase}`)}
              </Text>
            </Space>
          ))}
        </Space>
      ) : null}

      {editable ? (
        <div>
          <Upload
            multiple
            accept={LIBRARY_ACCEPT}
            showUploadList={false}
            disabled={disabled}
            // Gom cả loạt tệp đã chọn thành MỘT lần xử lý (hàm được gọi cho từng tệp, chỉ tệp đầu mới kích hoạt)
            // và chặn antd tự POST tệp đi đâu đó — mọi bước do `uploadFileToSection` điều khiển.
            beforeUpload={(file, fileList) => {
              if (file === fileList[0]) onUpload(fileList as File[])
              return Upload.LIST_IGNORE
            }}
          >
            <Button icon={<UploadOutlined />} disabled={disabled}>
              {s('upload')}
            </Button>
          </Upload>
          <Text type='secondary' style={{ display: 'block', marginTop: 4, fontSize: 12 }}>
            {s('uploadHint')}
          </Text>
        </div>
      ) : null}
    </Space>
  )
}
