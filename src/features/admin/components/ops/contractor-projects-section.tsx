'use client'

import { DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import { App, Button, Divider, Empty, Form, Image, Input, InputNumber, Modal, Select, Space, Typography } from 'antd'
import type { FormInstance } from 'antd'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

import { http } from '@/shared/lib/api'
import { constructionScopesApi } from '../../api/bmt/construction-scopes.api'
import {
  contractorsAdminApi,
  type ContractorProjectDetail,
  type ContractorProjectInput
} from '../../api/bmt/contractors.admin.api'
import { useContractorErrorMessage } from './contractor-errors'
import { ImageStrip } from './contractor-files'
import {
  MAX_IMAGES_PER_SET,
  addProjectImage,
  moveProjectImage,
  projectImagesFromDetail,
  projectImagesToRequest,
  removeProjectImage,
  type ProjectImageDraft
} from './contractor-form.logic'

const { Text } = Typography

interface FilterOptions {
  buildingTypes: { id: string; name: string }[]
  scopes: { id: string; name: string }[]
}

const num = (v: unknown): number | null => (v === '' || v == null ? null : Number(v))
const str = (v: unknown): string | null => {
  const s = typeof v === 'string' ? v.trim() : ''
  return s === '' ? null : s
}

/**
 * DỰ ÁN TIÊU BIỂU của nhà thầu (STORY-CTR-002, BR-CTR-003) — CRUD gọn ngay trong
 * ngăn kéo sửa hồ sơ. Mỗi dự án cần đúng một loại công trình + một phạm vi + ≥1
 * ảnh. Ảnh được chọn và tải lên qua MEDIA presign (`ContractorImage`, JPG/PNG/WebP ≤ 10 MiB) rồi
 * gửi URL cố định kèm dự án (`images: [{url, position}]`). Ảnh CŨ của dự án (chỉ có `assetId`)
 * vẫn đọc và gửi lại được; không bao giờ gửi cả hai cho một ảnh.
 *
 * Tải ảnh KHÔNG đụng version nhà thầu, nhưng tạo/sửa/xoá dự án thì có: sau mỗi lần ghi cập nhật
 * lại `expectedVersion` của form hồ sơ cha để lưu hồ sơ sau đó không bị 409.
 */
export function ContractorProjectsSection({ form, contractorId }: { form: FormInstance; contractorId: string }) {
  const t = useTranslations('admin')
  const c = useTranslations('admin.contractorsAdmin.projects')
  const { modal, message } = App.useApp()
  const describeError = useContractorErrorMessage()
  const [editing, setEditing] = useState<ContractorProjectDetail | 'new' | null>(null)
  const [projectForm] = Form.useForm()
  const [images, setImages] = useState<ProjectImageDraft[]>([])
  const [saving, setSaving] = useState(false)

  const projects = useQuery({
    queryKey: ['admin', 'contractor-projects', contractorId],
    queryFn: () => contractorsAdminApi.listProjects(contractorId)
  })

  const options = useQuery<FilterOptions>({
    queryKey: ['admin', 'contractor-form-options'],
    queryFn: async () => {
      const [filter, scopes] = await Promise.all([
        http.get<FilterOptions>('/contractors/filter-options'),
        constructionScopesApi.list()
      ])
      return {
        buildingTypes: filter.buildingTypes ?? [],
        scopes: scopes.filter((s) => s.isActive).map((s) => ({ id: s.id, name: s.name }))
      }
    }
  })

  const typeOptions = (options.data?.buildingTypes ?? []).map((b) => ({ label: b.name, value: b.id }))
  const scopeOptions = (options.data?.scopes ?? []).map((s) => ({ label: s.name, value: s.id }))
  const nameOf = (list: { id: string; name: string }[] | undefined, id: string) =>
    list?.find((x) => x.id === id)?.name ?? id

  /** Đồng bộ version mới của contractor vào form hồ sơ cha + tải lại danh sách. */
  const syncVersion = async (contractorVersion: number) => {
    form.setFieldValue('expectedVersion', contractorVersion)
    await projects.refetch()
  }

  function openNew() {
    setEditing('new')
    setImages([])
    projectForm.resetFields()
  }

  function openEdit(p: ContractorProjectDetail) {
    setEditing(p)
    setImages(projectImagesFromDetail(p.images, contractorId))
    projectForm.setFieldsValue({
      name: p.name,
      buildingTypeId: p.buildingTypeId,
      scopeId: p.scopeId,
      areaM2: p.areaM2 ?? null,
      floorCount: p.floorCount ?? null,
      locationText: p.locationText ?? '',
      completedYear: p.completedYear ?? null,
      roleText: p.roleText ?? '',
      mainWork: p.mainWork ?? ''
    })
  }

  async function submitProject() {
    const values = await projectForm.validateFields().catch(() => null)
    if (!values) return
    if (images.length === 0) {
      message.error(c('needImage'))
      return
    }
    setSaving(true)
    try {
      const body: ContractorProjectInput = {
        expectedVersion: Number(form.getFieldValue('expectedVersion')),
        name: String(values.name).trim(),
        buildingTypeId: values.buildingTypeId,
        scopeId: values.scopeId,
        images: projectImagesToRequest(images),
        areaM2: num(values.areaM2),
        floorCount: num(values.floorCount),
        locationText: str(values.locationText),
        completedYear: num(values.completedYear),
        roleText: str(values.roleText),
        mainWork: str(values.mainWork)
      }
      const saved =
        editing === 'new'
          ? await contractorsAdminApi.createProject(contractorId, body)
          : await contractorsAdminApi.updateProject(contractorId, (editing as ContractorProjectDetail).id, body)
      await syncVersion(saved.contractorVersion)
      message.success(t('feedback.saved'))
      setEditing(null)
    } catch (err) {
      message.error(describeError(err))
    } finally {
      setSaving(false)
    }
  }

  function confirmDelete(p: ContractorProjectDetail) {
    modal.confirm({
      title: c('deleteConfirmTitle', { name: p.name }),
      okText: t('actions.delete'),
      okButtonProps: { danger: true },
      cancelText: t('actions.cancel'),
      onOk: async () => {
        try {
          await contractorsAdminApi.deleteProject(contractorId, p.id, Number(form.getFieldValue('expectedVersion')))
          message.success(t('feedback.deleted'))
          // deleteProject trả 204, version đã tăng ở BE → tải lại để lấy version mới.
          await projects.refetch()
        } catch (err) {
          message.error(describeError(err))
        }
      }
    })
  }

  return (
    <>
      <Divider titlePlacement='start'>{c('title')}</Divider>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <Text type='secondary' style={{ fontSize: 12 }}>
          {c('hint')}
        </Text>
        <Button size='small' icon={<PlusOutlined />} onClick={openNew}>
          {c('add')}
        </Button>
      </div>

      {projects.data?.items.length ? (
        <Space orientation='vertical' size={8} style={{ width: '100%' }}>
          {projects.data.items.map((p) => (
            <div
              key={p.id}
              style={{
                display: 'flex',
                gap: 12,
                alignItems: 'center',
                padding: 8,
                border: '1px solid var(--admin-border)',
                borderRadius: 8
              }}
            >
              {projectImagesFromDetail(p.images, contractorId)[0]?.previewUrl ? (
                <Image
                  src={projectImagesFromDetail(p.images, contractorId)[0]?.previewUrl}
                  alt=''
                  width={56}
                  height={40}
                  style={{ objectFit: 'cover', borderRadius: 6 }}
                  preview={false}
                />
              ) : (
                <div style={{ width: 56, height: 40, borderRadius: 6, background: 'var(--admin-placeholder)' }} />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <Text strong>{p.name}</Text>
                <div>
                  <Text type='secondary' style={{ fontSize: 12 }}>
                    {nameOf(options.data?.buildingTypes, p.buildingTypeId)} · {nameOf(options.data?.scopes, p.scopeId)}
                    {p.completedYear ? ` · ${p.completedYear}` : ''}
                  </Text>
                </div>
              </div>
              <Button size='small' type='text' onClick={() => openEdit(p)}>
                {t('actions.edit')}
              </Button>
              <Button
                size='small'
                type='text'
                danger
                icon={<DeleteOutlined />}
                aria-label={t('actions.delete')}
                onClick={() => confirmDelete(p)}
              />
            </div>
          ))}
        </Space>
      ) : (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={c('empty')} />
      )}

      <Modal
        open={editing !== null}
        title={editing === 'new' ? c('add') : c('editTitle')}
        onCancel={() => setEditing(null)}
        onOk={submitProject}
        okButtonProps={{ loading: saving }}
        okText={t('actions.save')}
        cancelText={t('actions.cancel')}
        destroyOnHidden
      >
        <Form form={projectForm} layout='vertical'>
          <Form.Item
            name='name'
            label={c('name')}
            rules={[{ required: true, whitespace: true, message: t('fields.requiredMessage') }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name='buildingTypeId'
            label={c('buildingType')}
            rules={[{ required: true, message: t('fields.requiredMessage') }]}
          >
            <Select options={typeOptions} loading={options.isPending} optionFilterProp='label' showSearch />
          </Form.Item>
          <Form.Item
            name='scopeId'
            label={c('scope')}
            rules={[{ required: true, message: t('fields.requiredMessage') }]}
          >
            <Select options={scopeOptions} loading={options.isPending} optionFilterProp='label' showSearch />
          </Form.Item>
          <Form.Item label={c('images')} required extra={c('imagesHint')}>
            <ImageStrip
              items={images.map((image) => ({ key: image.key, src: image.previewUrl ?? '' }))}
              max={MAX_IMAGES_PER_SET}
              onUploaded={(url) => setImages((current) => addProjectImage(current, url))}
              onRemove={(key) => setImages((current) => removeProjectImage(current, key))}
              onMove={(key, delta) => setImages((current) => moveProjectImage(current, key, delta))}
            />
          </Form.Item>
          <Space size={8} style={{ width: '100%' }}>
            <Form.Item name='areaM2' label={c('areaM2')} style={{ flex: 1 }}>
              <InputNumber style={{ width: '100%' }} min={0} />
            </Form.Item>
            <Form.Item name='floorCount' label={c('floorCount')} style={{ flex: 1 }}>
              <InputNumber style={{ width: '100%' }} min={0} />
            </Form.Item>
            <Form.Item name='completedYear' label={c('completedYear')} style={{ flex: 1 }}>
              <InputNumber style={{ width: '100%' }} />
            </Form.Item>
          </Space>
          <Form.Item name='locationText' label={c('locationText')}>
            <Input />
          </Form.Item>
          <Form.Item name='roleText' label={c('roleText')}>
            <Input />
          </Form.Item>
          <Form.Item name='mainWork' label={c('mainWork')}>
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}
