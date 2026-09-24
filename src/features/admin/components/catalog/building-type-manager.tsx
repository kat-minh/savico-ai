'use client'

import {
  Alert,
  App,
  Col,
  Descriptions,
  Form,
  Input,
  InputNumber,
  Radio,
  Row,
  Segmented,
  Select,
  Space,
  Switch,
  Tag,
  Typography,
  type FormInstance
} from 'antd'
import { useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'

import type { CmsAtticMode, CmsBuildingTypeOption, CmsCatalogStatus, CmsFloorOption } from '@/shared/cms'
import { useAdminCollection, useSaveAdminItem } from '../../hooks/use-admin-data'
import { newAdminId } from '../../services/admin.service'
import {
  buildingTypeProblem,
  buildingTypeUsage,
  floorOptionUsage,
  sameName,
  type CatalogUsageSources
} from '../../services/catalog.service'
import { StatusSwitch } from '../common/field-kit'
import { ResourceManager } from '../common/resource-manager'

const { Text } = Typography

const ATTIC_MODES: CmsAtticMode[] = ['none', 'choice', 'fixed-yes', 'fixed-no']

type Filter = 'all' | 'yes' | 'no'

/** Nguồn dữ liệu để đếm "đã được sử dụng" — chặn xóa cứng loại công trình / phương án. */
function useUsageSources(): CatalogUsageSources {
  const { data: projects = [] } = useAdminCollection('designProjects')
  const { data: contractors = [] } = useAdminCollection('contractors')
  const { data: templates = [] } = useAdminCollection('handbookTemplates')
  return useMemo(() => ({ projects, contractors, templates }), [projects, contractors, templates])
}

/**
 * LOẠI CÔNG TRÌNH & CẤU HÌNH QUY MÔ (epic ConstructionTypeManagement).
 *
 * Một danh mục dùng chung cho form hồ sơ dự án (thiết kế và tìm nhà thầu), năng
 * lực / dự án nhà thầu và mẫu 2D. Cấu hình Số tầng và Tum của từng loại quyết
 * định form người dùng hiện trường nào, phương án nào, bắt buộc hay không.
 *
 * Loại mới mặc định Ngừng hoạt động để hoàn thiện cấu hình trước; chỉ kích hoạt
 * được khi cấu hình hợp lệ. Loại đã được dùng không xóa cứng, chỉ Ngừng hoạt
 * động — hồ sơ cũ vẫn giữ nguyên loại đã chọn.
 */
export function BuildingTypeManager() {
  const t = useTranslations('admin')
  const { message } = App.useApp()
  const sources = useUsageSources()
  const { data: types = [] } = useAdminCollection('buildingTypes')
  const { data: floorOptions = [] } = useAdminCollection('floorOptions')
  const save = useSaveAdminItem('buildingTypes')

  const [status, setStatus] = useState<'all' | CmsCatalogStatus>('all')
  const [floorFilter, setFloorFilter] = useState<Filter>('all')
  const [atticFilter, setAtticFilter] = useState<Filter>('all')

  const floorLabel = (id: string) => floorOptions.find((option) => option.id === id)?.label ?? id
  const problemText = (type: Pick<CmsBuildingTypeOption, 'floors'>) => {
    const problem = buildingTypeProblem(type, floorOptions)
    return problem ? t(`buildingTypes.problems.${problem}`) : null
  }
  const statusLabel = (value: CmsCatalogStatus) => t(`catalogStatus.${value}`)

  const matches = (type: CmsBuildingTypeOption) =>
    (status === 'all' || type.status === status) &&
    (floorFilter === 'all' || type.floors.applies === (floorFilter === 'yes')) &&
    (atticFilter === 'all' || (type.attic.mode !== 'none') === (atticFilter === 'yes'))

  const filterSelect = (value: Filter, onChange: (next: Filter) => void, label: string) => (
    <Select<Filter>
      value={value}
      onChange={onChange}
      style={{ minWidth: 170 }}
      options={(['all', 'yes', 'no'] as const).map((item) => ({
        value: item,
        label: `${label}: ${t(`buildingTypes.applyFilter.${item}`)}`
      }))}
    />
  )

  const configSummary = (type: CmsBuildingTypeOption) => (
    <Descriptions
      size='small'
      column={1}
      bordered
      items={[
        { key: 'name', label: t('buildingTypes.name'), children: type.label },
        { key: 'description', label: t('buildingTypes.descriptionField'), children: type.description || '-' },
        {
          key: 'status',
          label: t('buildingTypes.status'),
          children: <Tag color={type.status === 'active' ? 'green' : 'default'}>{statusLabel(type.status)}</Tag>
        },
        {
          key: 'floors',
          label: t('buildingTypes.floors'),
          children: type.floors.applies ? (
            <Space orientation='vertical' size={4}>
              <Text>
                {t('buildingTypes.applies')} ·{' '}
                {type.floors.required ? t('buildingTypes.required') : t('buildingTypes.optional')}
              </Text>
              <Space size={4} wrap>
                {type.floors.optionIds.map((id) => (
                  <Tag key={id} color={id === type.floors.defaultOptionId ? 'blue' : undefined}>
                    {floorLabel(id)}
                  </Tag>
                ))}
              </Space>
            </Space>
          ) : (
            t('buildingTypes.notApplies')
          )
        },
        {
          key: 'attic',
          label: t('buildingTypes.attic'),
          children:
            t(`buildingTypes.atticModes.${type.attic.mode}`) +
            (type.attic.mode === 'choice'
              ? ` · ${type.attic.required ? t('buildingTypes.required') : t('buildingTypes.optional')}`
              : '')
        },
        { key: 'usage', label: t('buildingTypes.usage'), children: buildingTypeUsage(type, sources) }
      ]}
    />
  )

  return (
    <div className='flex flex-col gap-8'>
      <ResourceManager
        collection='buildingTypes'
        title={t('nav.buildingTypes')}
        description={t('buildingTypes.description')}
        drawerWidth={620}
        searchText={(item) => item.label}
        filterItems={matches}
        filterKey={`${status}|${floorFilter}|${atticFilter}`}
        banner={
          <Space wrap>
            <Segmented<'all' | CmsCatalogStatus>
              value={status}
              onChange={setStatus}
              options={(['all', 'active', 'inactive'] as const).map((value) => ({
                value,
                label: value === 'all' ? t('buildingTypes.allStatuses') : statusLabel(value)
              }))}
            />
            {filterSelect(floorFilter, setFloorFilter, t('buildingTypes.floors'))}
            {filterSelect(atticFilter, setAtticFilter, t('buildingTypes.attic'))}
          </Space>
        }
        createItem={(): CmsBuildingTypeOption => ({
          id: newAdminId('bt'),
          label: '',
          description: '',
          // Loại mới luôn Ngừng hoạt động để hoàn thiện cấu hình trước (§2).
          status: 'inactive',
          order: types.length + 1,
          floors: { applies: false, required: false, optionIds: [] },
          attic: { mode: 'none', required: false }
        })}
        fromFormValues={(values, current) => {
          const next = { ...current, ...values } as CmsBuildingTypeOption
          const floors = next.floors
          return {
            ...next,
            label: next.label.trim(),
            description: next.description?.trim() || undefined,
            // Không áp dụng thì không lưu phương án / cờ bắt buộc (§3).
            floors: floors.applies
              ? {
                  ...floors,
                  defaultOptionId:
                    floors.defaultOptionId && floors.optionIds.includes(floors.defaultOptionId)
                      ? floors.defaultOptionId
                      : undefined
                }
              : { applies: false, required: false, optionIds: [] },
            attic: { mode: next.attic.mode, required: next.attic.mode === 'choice' && next.attic.required }
          }
        }}
        validate={(next) => {
          if (types.some((type) => type.id !== next.id && sameName(type.label, next.label))) {
            return t('buildingTypes.duplicateName')
          }
          if (next.status === 'active') return problemText(next)
          return null
        }}
        deleteBlockedReason={(item) => (buildingTypeUsage(item, sources) > 0 ? t('buildingTypes.deleteBlocked') : null)}
        deleteConfirm={(item) => t('buildingTypes.deleteConfirm', { name: item.label })}
        rowActions={(item) => {
          const next: CmsCatalogStatus = item.status === 'active' ? 'inactive' : 'active'
          return (
            <StatusSwitch
              name={item.label}
              current={statusLabel(item.status)}
              next={statusLabel(next)}
              blockedReason={next === 'active' ? problemText(item) : null}
              warning={next === 'inactive' ? <Text type='secondary'>{t('buildingTypes.deactivateNote')}</Text> : null}
              onConfirm={async () => {
                await save.mutateAsync({ ...item, status: next })
                message.success(t('feedback.saved'))
              }}
            />
          )
        }}
        renderView={configSummary}
        columns={[
          {
            title: t('buildingTypes.name'),
            dataIndex: 'label',
            render: (_, record) => (
              <div style={{ minWidth: 0, maxWidth: 360 }}>
                <Text strong style={{ display: 'block' }}>
                  {record.label}
                </Text>
                {record.description ? (
                  <Text type='secondary' style={{ fontSize: 12 }} ellipsis={{ tooltip: record.description }}>
                    {record.description}
                  </Text>
                ) : null}
              </div>
            )
          },
          {
            title: t('buildingTypes.floors'),
            key: 'floors',
            width: 150,
            render: (_, record) =>
              record.floors.applies ? (
                <Tag color='blue'>{t('buildingTypes.applies')}</Tag>
              ) : (
                <Tag>{t('buildingTypes.notApplies')}</Tag>
              )
          },
          {
            title: t('buildingTypes.attic'),
            key: 'attic',
            width: 150,
            render: (_, record) =>
              record.attic.mode === 'none' ? (
                <Tag>{t('buildingTypes.notApplies')}</Tag>
              ) : (
                <Tag color='blue'>{t('buildingTypes.applies')}</Tag>
              )
          },
          {
            title: t('buildingTypes.status'),
            dataIndex: 'status',
            width: 150,
            render: (value: CmsCatalogStatus) => (
              <Tag color={value === 'active' ? 'green' : 'default'}>{statusLabel(value)}</Tag>
            )
          }
        ]}
        renderForm={(form) => <BuildingTypeFields form={form} floorOptions={floorOptions} />}
      />

      <FloorOptionTable types={types} sources={sources} />
    </div>
  )
}

function BuildingTypeFields({ form, floorOptions }: { form: FormInstance; floorOptions: readonly CmsFloorOption[] }) {
  const t = useTranslations('admin')
  const floorsApply = Form.useWatch(['floors', 'applies'], form) as boolean | undefined
  const optionIds = (Form.useWatch(['floors', 'optionIds'], form) as string[] | undefined) ?? []
  const atticMode = Form.useWatch(['attic', 'mode'], form) as CmsAtticMode | undefined
  const initial = form.getFieldValue('floors') as CmsBuildingTypeOption['floors'] | undefined
  const initialAttic = form.getFieldValue('attic') as CmsBuildingTypeOption['attic'] | undefined

  // Phương án Ngừng hoạt động không được chọn cho cấu hình mới — nhưng phương án
  // đã lưu từ trước vẫn hiện để admin thấy và bỏ đi.
  const selectable = floorOptions
    .filter((option) => option.status === 'active' || optionIds.includes(option.id))
    .sort((a, b) => a.order - b.order)
    .map((option) => ({
      value: option.id,
      label: option.status === 'active' ? option.label : `${option.label} (${t('catalogStatus.inactive')})`,
      disabled: option.status !== 'active'
    }))

  return (
    <>
      <Form.Item
        name='label'
        label={t('buildingTypes.name')}
        rules={[
          { required: true, whitespace: true, message: t('fields.requiredMessage') },
          { max: 100, message: t('fields.maxLength', { max: 100 }) }
        ]}
      >
        <Input maxLength={100} showCount />
      </Form.Item>
      <Form.Item
        name='description'
        label={t('buildingTypes.descriptionField')}
        rules={[{ max: 500, message: t('fields.maxLength', { max: 500 }) }]}
      >
        <Input.TextArea rows={2} maxLength={500} showCount />
      </Form.Item>
      <Row gutter={16}>
        <Col xs={12}>
          <Form.Item name='status' label={t('buildingTypes.status')} extra={t('buildingTypes.statusHint')}>
            <Select
              options={(['active', 'inactive'] as const).map((value) => ({
                value,
                label: t(`catalogStatus.${value}`)
              }))}
            />
          </Form.Item>
        </Col>
        <Col xs={12}>
          <Form.Item name='order' label={t('buildingTypes.order')}>
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
        </Col>
      </Row>

      <Text strong style={{ display: 'block', margin: '8px 0 12px' }}>
        {t('buildingTypes.floors')}
      </Text>
      <Form.Item name={['floors', 'applies']} valuePropName='checked' label={t('buildingTypes.floorsApply')}>
        <Switch />
      </Form.Item>
      {initial?.applies && floorsApply === false ? (
        <Alert type='warning' showIcon style={{ marginBottom: 16 }} title={t('buildingTypes.disableWarning')} />
      ) : null}
      {floorsApply ? (
        <>
          <Form.Item name={['floors', 'required']} valuePropName='checked' label={t('buildingTypes.floorsRequired')}>
            <Switch />
          </Form.Item>
          <Form.Item
            name={['floors', 'optionIds']}
            label={t('buildingTypes.floorOptions')}
            extra={t('buildingTypes.floorOptionsHint')}
            rules={[{ required: true, type: 'array', min: 1, message: t('buildingTypes.problems.floorsEmpty') }]}
          >
            <Select mode='multiple' options={selectable} />
          </Form.Item>
          <Form.Item name={['floors', 'defaultOptionId']} label={t('buildingTypes.floorDefault')}>
            <Select
              allowClear
              placeholder={t('buildingTypes.noDefault')}
              options={selectable.filter((option) => optionIds.includes(option.value) && !option.disabled)}
            />
          </Form.Item>
        </>
      ) : null}

      <Text strong style={{ display: 'block', margin: '8px 0 12px' }}>
        {t('buildingTypes.attic')}
      </Text>
      <Form.Item name={['attic', 'mode']} label={t('buildingTypes.atticMode')}>
        <Radio.Group
          optionType='button'
          options={ATTIC_MODES.map((value) => ({ value, label: t(`buildingTypes.atticModes.${value}`) }))}
        />
      </Form.Item>
      {initialAttic && initialAttic.mode !== 'none' && atticMode === 'none' ? (
        <Alert type='warning' showIcon style={{ marginBottom: 16 }} title={t('buildingTypes.disableWarning')} />
      ) : null}
      {atticMode === 'choice' ? (
        <Form.Item name={['attic', 'required']} valuePropName='checked' label={t('buildingTypes.atticRequired')}>
          <Switch />
        </Form.Item>
      ) : null}
      <Text type='secondary' style={{ fontSize: 12 }}>
        {t('buildingTypes.historyNote')}
      </Text>
    </>
  )
}

/**
 * PHƯƠNG ÁN SỐ TẦNG (§3) — danh sách dùng chung. Thêm, đổi tên, bật / tắt;
 * phương án đã được dùng không xóa cứng, chỉ Ngừng hoạt động.
 */
function FloorOptionTable({
  types,
  sources
}: {
  types: readonly CmsBuildingTypeOption[]
  sources: CatalogUsageSources
}) {
  const t = useTranslations('admin')
  const { message } = App.useApp()
  const { data: options = [] } = useAdminCollection('floorOptions')
  const save = useSaveAdminItem('floorOptions')
  const statusLabel = (value: CmsCatalogStatus) => t(`catalogStatus.${value}`)
  const usage = (option: CmsFloorOption) => floorOptionUsage(option, { ...sources, buildingTypes: types })

  return (
    <ResourceManager
      collection='floorOptions'
      title={t('floorOptions.title')}
      description={t('floorOptions.description')}
      drawerWidth={440}
      searchText={(item) => item.label}
      createItem={(): CmsFloorOption => ({
        id: newAdminId('floor'),
        label: '',
        status: 'active',
        order: options.length + 1
      })}
      fromFormValues={(values, current) => ({ ...current, ...values, label: String(values.label ?? '').trim() })}
      validate={(next) =>
        options.some((option) => option.id !== next.id && sameName(option.label, next.label))
          ? t('floorOptions.duplicateName')
          : null
      }
      deleteBlockedReason={(item) => (usage(item) > 0 ? t('floorOptions.deleteBlocked') : null)}
      rowActions={(item) => {
        const next: CmsCatalogStatus = item.status === 'active' ? 'inactive' : 'active'
        const affected = types.filter((type) => type.floors.optionIds.includes(item.id)).length
        return (
          <StatusSwitch
            name={item.label}
            current={statusLabel(item.status)}
            next={statusLabel(next)}
            warning={
              next === 'inactive' && affected > 0 ? (
                <Text type='warning'>{t('floorOptions.affectedTypes', { count: affected })}</Text>
              ) : null
            }
            onConfirm={async () => {
              await save.mutateAsync({ ...item, status: next })
              message.success(t('feedback.saved'))
            }}
          />
        )
      }}
      columns={[
        { title: t('floorOptions.label'), dataIndex: 'label' },
        {
          title: t('floorOptions.usedBy'),
          key: 'usage',
          width: 140,
          render: (_, record) => usage(record)
        },
        {
          title: t('buildingTypes.status'),
          dataIndex: 'status',
          width: 150,
          render: (value: CmsCatalogStatus) => (
            <Tag color={value === 'active' ? 'green' : 'default'}>{statusLabel(value)}</Tag>
          )
        }
      ]}
      renderForm={() => (
        <>
          <Form.Item
            name='label'
            label={t('floorOptions.label')}
            rules={[
              { required: true, whitespace: true, message: t('fields.requiredMessage') },
              { max: 100, message: t('fields.maxLength', { max: 100 }) }
            ]}
          >
            <Input maxLength={100} />
          </Form.Item>
          <Form.Item name='order' label={t('buildingTypes.order')}>
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          <Text type='secondary' style={{ fontSize: 12 }}>
            {t('floorOptions.historyNote')}
          </Text>
        </>
      )}
    />
  )
}
