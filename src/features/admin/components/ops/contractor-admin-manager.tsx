'use client'

import { DeleteOutlined, EyeInvisibleOutlined, EyeOutlined } from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import { App, Col, Divider, Form, Input, InputNumber, Row, Select, Switch, Typography } from 'antd'
import { useTranslations } from 'next-intl'
import { useRef } from 'react'

import { http, isApiError } from '@/shared/lib/api'
import {
  contractorsAdminApi,
  type AdminContractorDetail,
  type AdminContractorItem
} from '../../api/bmt/contractors.admin.api'
import { constructionScopesApi } from '../../api/bmt/construction-scopes.api'
import { ApiResourceManager } from '../common/api-resource-manager'
import { ContractorProjectsSection } from './contractor-projects-section'
import type { RowAction } from '../common/row-actions-menu'
import { StatusTag } from '../common/status-tag'

const { Text } = Typography

const num = (v: unknown): number | null => (v === '' || v == null ? null : Number(v))
const str = (v: unknown): string | null => {
  const s = typeof v === 'string' ? v.trim() : ''
  return s === '' ? null : s
}

interface FilterOptions {
  buildingTypes: { id: string; name: string }[]
  scopes: { id: string; name: string }[]
}

/**
 * QUẢN LÝ NHÀ THẦU (STORY-CTR-001, BR-CTR-002/004) — CRUD gọn: danh sách → form
 * tạo/sửa hồ sơ (gộp một chỗ) → ẩn/hiện → xoá. BE tách API granular nhưng màn
 * này gộp lại theo ý người dùng.
 *
 * Hồ sơ mới lưu ẨN; muốn HIỆN cần đủ trường bắt buộc (name + address + toạ độ +
 * ≥1 loại công trình + ≥1 phạm vi) — BE chặn 422 nếu thiếu. Ảnh/giấy phép/hợp
 * tác chưa quản lý ở bản CRUD này nên giữ nguyên khi lưu (không gửi rỗng để khỏi
 * xoá mất).
 */
export function ContractorAdminManager() {
  const t = useTranslations('admin')
  const c = useTranslations('admin.contractorsAdmin')
  const { modal, message } = App.useApp()
  // Giữ bản chi tiết đã tải để lưu lại ảnh/giấy phép/hợp tác chưa quản lý ở form
  // CRUD này (tránh gửi rỗng làm BE xoá mất).
  const detailRef = useRef(new Map<string, AdminContractorDetail>())

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

  const buildingTypeOptions = (options.data?.buildingTypes ?? []).map((b) => ({ label: b.name, value: b.id }))
  const scopeOptions = (options.data?.scopes ?? []).map((s) => ({ label: s.name, value: s.id }))

  return (
    <ApiResourceManager<AdminContractorItem>
      title={t('nav.contractors')}
      description={c('description')}
      queryKey={['admin', 'contractors']}
      searchable
      fetchPage={({ pageIndex, pageSize }) => contractorsAdminApi.list({ pageIndex, pageSize })}
      rowKey={(item) => item.id}
      drawerWidth={720}
      createValues={() => ({ name: '' })}
      onCreate={async (values) => {
        await contractorsAdminApi.create(String(values.name ?? '').trim())
      }}
      toFormValues={async (item) => {
        const d = await contractorsAdminApi.get(item.id)
        detailRef.current.set(item.id, d)
        const p = d.profile
        return {
          expectedVersion: d.version,
          name: p.name ?? '',
          shortDescription: p.shortDescription ?? '',
          introduction: p.introduction ?? '',
          contractorType: p.contractorType ?? '',
          address: p.address ?? '',
          latitude: p.latitude ?? null,
          longitude: p.longitude ?? null,
          foundedYear: p.foundedYear ?? null,
          architectCount: p.architectCount ?? null,
          engineerCount: p.engineerCount ?? null,
          serviceAreaText: p.serviceAreaText ?? '',
          surveyHours: p.surveyHours ?? null,
          warrantyMonths: p.warrantyMonths ?? null,
          acceptingProjects: p.acceptingProjects ?? false,
          rating: p.rating ?? null,
          ratingCount: p.ratingCount ?? null,
          contactPerson: p.contactPerson ?? '',
          contactPhone: p.contactPhone ?? '',
          contactEmail: p.contactEmail ?? '',
          buildingTypeIds: d.buildingTypeIds ?? [],
          scopeIds: d.scopeIds ?? [],
          legalName: d.legal?.legalName ?? '',
          taxCode: d.legal?.taxCode ?? '',
          representative: d.legal?.representative ?? '',
          registeredAddress: d.legal?.registeredAddress ?? '',
          industry: d.legal?.industry ?? ''
        }
      }}
      onUpdate={async (values, item) => {
        const prev = detailRef.current.get(item.id)
        await contractorsAdminApi.update(item.id, {
          expectedVersion: Number(values.expectedVersion),
          profile: {
            name: String(values.name ?? '').trim(),
            shortDescription: str(values.shortDescription),
            introduction: str(values.introduction),
            contractorType: str(values.contractorType),
            address: str(values.address),
            latitude: num(values.latitude),
            longitude: num(values.longitude),
            foundedYear: num(values.foundedYear),
            architectCount: num(values.architectCount),
            engineerCount: num(values.engineerCount),
            serviceAreaText: str(values.serviceAreaText),
            surveyHours: num(values.surveyHours),
            warrantyMonths: num(values.warrantyMonths),
            acceptingProjects: Boolean(values.acceptingProjects),
            rating: num(values.rating),
            ratingCount: num(values.ratingCount),
            contactPerson: str(values.contactPerson),
            contactPhone: str(values.contactPhone),
            contactEmail: str(values.contactEmail)
          },
          buildingTypeIds: (values.buildingTypeIds as string[] | undefined) ?? [],
          scopeIds: (values.scopeIds as string[] | undefined) ?? [],
          // PUT thay TOÀN BỘ section legal → merge với bản cũ để không xoá các
          // trường form này chưa quản lý (establishedDate, workforceSize…).
          legal: {
            ...(prev?.legal ?? {}),
            legalName: str(values.legalName),
            taxCode: str(values.taxCode),
            representative: str(values.representative),
            registeredAddress: str(values.registeredAddress),
            industry: str(values.industry)
          },
          licenses: prev?.licenses ?? [],
          partnership: prev?.partnership ?? {},
          images: prev?.images ?? []
        })
      }}
      rowActions={(item, ctx): RowAction[] => {
        const visible = item.status === 'Visible'
        return [
          {
            key: 'visibility',
            label: visible ? c('hide') : c('show'),
            icon: visible ? <EyeInvisibleOutlined /> : <EyeOutlined />,
            onClick: async () => {
              try {
                await contractorsAdminApi.setVisibility(item.id, item.version, !visible)
                message.success(t('feedback.saved'))
                await ctx.refresh()
              } catch (err) {
                message.error(isApiError(err) ? err.message : t('feedback.apiError'))
              }
            }
          },
          {
            key: 'delete',
            label: t('actions.delete'),
            icon: <DeleteOutlined />,
            danger: true,
            onClick: () =>
              modal.confirm({
                title: c('deleteConfirmTitle', { name: item.name }),
                content: c('deleteConfirmBody'),
                okText: t('actions.delete'),
                okButtonProps: { danger: true },
                cancelText: t('actions.cancel'),
                onOk: async () => {
                  try {
                    await contractorsAdminApi.remove(item.id, item.version)
                    message.success(t('feedback.deleted'))
                    await ctx.refresh()
                  } catch (err) {
                    message.error(isApiError(err) ? err.message : t('feedback.apiError'))
                  }
                }
              })
          }
        ]
      }}
      columns={[
        { title: c('name'), dataIndex: 'name', render: (_, r) => <Text strong>{r.name}</Text> },
        {
          title: c('address'),
          dataIndex: 'address',
          render: (_, r) => <Text type='secondary'>{r.address || '—'}</Text>
        },
        {
          title: c('statusLabel'),
          key: 'status',
          width: 130,
          render: (_, r) => (
            <StatusTag tone={r.status === 'Visible' ? 'success' : 'off'}>
              {c(r.status === 'Visible' ? 'visible' : 'hidden')}
            </StatusTag>
          )
        }
      ]}
      renderForm={(form, ctx) => {
        if (ctx.isNew) {
          return (
            <>
              <Form.Item
                name='name'
                label={c('name')}
                rules={[{ required: true, whitespace: true, message: t('fields.requiredMessage') }]}
              >
                <Input />
              </Form.Item>
              <Text type='secondary'>{c('createHint')}</Text>
            </>
          )
        }
        return (
          <>
            <Form.Item name='expectedVersion' hidden>
              <Input />
            </Form.Item>
            <Divider titlePlacement='start'>{c('sections.general')}</Divider>
            <Form.Item
              name='name'
              label={c('name')}
              rules={[{ required: true, whitespace: true, message: t('fields.requiredMessage') }]}
            >
              <Input />
            </Form.Item>
            <Form.Item name='contractorType' label={c('contractorType')}>
              <Input />
            </Form.Item>
            <Form.Item name='shortDescription' label={c('shortDescription')}>
              <Input.TextArea rows={2} maxLength={300} showCount />
            </Form.Item>
            <Form.Item name='introduction' label={c('introduction')}>
              <Input.TextArea rows={4} />
            </Form.Item>

            <Divider titlePlacement='start'>{c('sections.location')}</Divider>
            <Form.Item name='address' label={c('address')}>
              <Input />
            </Form.Item>
            <Row gutter={12}>
              <Col span={12}>
                <Form.Item name='latitude' label={c('latitude')}>
                  <InputNumber style={{ width: '100%' }} step={0.000001} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name='longitude' label={c('longitude')}>
                  <InputNumber style={{ width: '100%' }} step={0.000001} />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item name='serviceAreaText' label={c('serviceAreaText')}>
              <Input />
            </Form.Item>

            <Divider titlePlacement='start'>{c('sections.capability')}</Divider>
            <Form.Item name='buildingTypeIds' label={c('buildingTypes')} extra={c('requiredForVisible')}>
              <Select
                mode='multiple'
                allowClear
                loading={options.isPending}
                options={buildingTypeOptions}
                optionFilterProp='label'
              />
            </Form.Item>
            <Form.Item name='scopeIds' label={c('scopes')} extra={c('requiredForVisible')}>
              <Select
                mode='multiple'
                allowClear
                loading={options.isPending}
                options={scopeOptions}
                optionFilterProp='label'
              />
            </Form.Item>
            <Row gutter={12}>
              <Col span={8}>
                <Form.Item name='foundedYear' label={c('foundedYear')}>
                  <InputNumber style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name='architectCount' label={c('architectCount')}>
                  <InputNumber style={{ width: '100%' }} min={0} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name='engineerCount' label={c('engineerCount')}>
                  <InputNumber style={{ width: '100%' }} min={0} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={12}>
              <Col span={8}>
                <Form.Item name='surveyHours' label={c('surveyHours')}>
                  <InputNumber style={{ width: '100%' }} min={0} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name='warrantyMonths' label={c('warrantyMonths')}>
                  <InputNumber style={{ width: '100%' }} min={0} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name='acceptingProjects' label={c('acceptingProjects')} valuePropName='checked'>
                  <Switch />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={12}>
              <Col span={12}>
                <Form.Item name='rating' label={c('rating')} extra={c('ratingHint')}>
                  <InputNumber style={{ width: '100%' }} min={0} max={5} step={0.1} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name='ratingCount' label={c('ratingCount')}>
                  <InputNumber style={{ width: '100%' }} min={0} />
                </Form.Item>
              </Col>
            </Row>

            <Divider titlePlacement='start'>{c('sections.contact')}</Divider>
            <Text type='secondary'>{c('contactNote')}</Text>
            <Row gutter={12} style={{ marginTop: 8 }}>
              <Col span={8}>
                <Form.Item name='contactPerson' label={c('contactPerson')}>
                  <Input />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name='contactPhone' label={c('contactPhone')}>
                  <Input />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name='contactEmail' label={c('contactEmail')}>
                  <Input />
                </Form.Item>
              </Col>
            </Row>

            <Divider titlePlacement='start'>{c('sections.legal')}</Divider>
            <Form.Item name='legalName' label={c('legalName')}>
              <Input />
            </Form.Item>
            <Row gutter={12}>
              <Col span={12}>
                <Form.Item name='taxCode' label={c('taxCode')}>
                  <Input />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name='representative' label={c('representative')}>
                  <Input />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item name='registeredAddress' label={c('registeredAddress')}>
              <Input />
            </Form.Item>
            <Form.Item name='industry' label={c('industry')}>
              <Input />
            </Form.Item>

            {ctx.item ? <ContractorProjectsSection form={form} contractorId={ctx.item.id} /> : null}
          </>
        )
      }}
    />
  )
}
