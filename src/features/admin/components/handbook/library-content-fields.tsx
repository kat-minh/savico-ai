'use client'

import { Alert, Col, Form, Input, Row, Select, type FormInstance } from 'antd'
import { useTranslations } from 'next-intl'

import type { AdminCatalog, CatalogBuildingTypeDto } from '../../api/bmt/catalog.api'
import type { AdminVersionItem, DrawingKind, TemplateContent } from '../../api/bmt/library.api'
import { useEstimateCatalog } from '../../hooks/use-estimate-catalog'
import { useFloorLabel } from '../catalog/use-floor-label'

/** Chuỗi thập phân > 0, tối đa hai chữ số lẻ — đúng định dạng BE nhận cho kích thước. */
const DECIMAL = /^\d+(\.\d{1,2})?$/

const DRAWING_KINDS: DrawingKind[] = ['2D', '3D']

const blankToNull = (value: unknown) => {
  const text = typeof value === 'string' ? value.trim() : value
  return text === '' || text === undefined ? null : (text as string)
}

/** Form → metadata gửi BE. Trường tắt theo loại công trình để trống (Không áp dụng), không gửi 0 / Không tum. */
export function toTemplateContent(values: Record<string, unknown>, catalog: AdminCatalog | undefined): TemplateContent {
  const buildingTypeId = blankToNull(values.buildingTypeId)
  const type = catalog?.buildingTypes.find((item) => item.buildingTypeId === buildingTypeId)
  const floorCount = typeof values.floorCount === 'number' ? values.floorCount : null
  const hasTum = typeof values.hasTum === 'boolean' ? values.hasTum : null
  return {
    name: blankToNull(values.name),
    description: blankToNull(values.description),
    drawingKind: (blankToNull(values.drawingKind) as DrawingKind | null) ?? null,
    widthM: blankToNull(values.widthM),
    lengthM: blankToNull(values.lengthM),
    areaM2: blankToNull(values.areaM2),
    buildingTypeId,
    // Loại đã ghim nhưng không còn trong danh mục hiện hành: giữ nguyên giá trị đã lưu.
    floorCount: type && !type.floorsEnabled ? null : floorCount,
    hasTum: type && !type.tumEnabled ? null : hasTum
  }
}

/** Phiên bản → giá trị form. */
export function toContentFormValues(version: AdminVersionItem): Record<string, unknown> {
  return {
    name: version.name ?? '',
    description: version.description ?? '',
    drawingKind: version.drawingKind ?? undefined,
    widthM: version.widthM ?? '',
    lengthM: version.lengthM ?? '',
    areaM2: version.areaM2 ?? '',
    buildingTypeId: version.buildingTypeId ?? undefined,
    floorCount: version.floorCount ?? undefined,
    hasTum: version.hasTum ?? undefined,
    // Tên loại đã ghim — để hiện đúng khi loại không còn trong danh mục hiện hành.
    pinnedTypeName: version.buildingTypeName ?? undefined
  }
}

/**
 * Các trường metadata của một phiên bản mẫu (BR-LIB-001). Lưu nháp được phép
 * thiếu mọi trường; đủ hay chưa do BE kiểm lúc công bố. Loại công trình, số
 * tầng và tum lấy từ danh mục dự toán hiện hành (BR-PROJ-004).
 */
export function LibraryContentFields({ form }: { form: FormInstance }) {
  const l = useTranslations('admin.library')
  const floorLabel = useFloorLabel()
  const { data: catalog, isError } = useEstimateCatalog()

  const typeId = Form.useWatch('buildingTypeId', form) as string | undefined
  const floorCount = Form.useWatch('floorCount', form) as number | undefined
  const pinnedName = Form.useWatch('pinnedTypeName', form) as string | undefined
  const hasTum = Form.useWatch('hasTum', form) as boolean | undefined
  const types = catalog?.buildingTypes ?? []
  const type: CatalogBuildingTypeDto | undefined = types.find((item) => item.buildingTypeId === typeId)
  const unknownType = Boolean(typeId) && !type

  const typeOptions = [
    ...types.map((item) => ({ value: item.buildingTypeId, label: item.name })),
    ...(unknownType && typeId ? [{ value: typeId, label: pinnedName ?? typeId }] : [])
  ]
  const floorOptions = [...new Set([...(type?.floorCounts ?? []), ...(floorCount ? [floorCount] : [])])]
    .sort((a, b) => a - b)
    .map((value) => ({ value, label: floorLabel(value) }))

  const decimalRule = (label: string) => ({
    validator: (_: unknown, value: unknown) => {
      const text = String(value ?? '').trim()
      if (!text) return Promise.resolve()
      return DECIMAL.test(text) && Number(text) > 0
        ? Promise.resolve()
        : Promise.reject(new Error(l('decimal', { field: label })))
    }
  })

  /** Đổi loại: bỏ số tầng / tum không còn hợp lệ với loại mới. */
  const changeType = (next: string | undefined) => {
    const nextType = types.find((item) => item.buildingTypeId === next)
    const current = form.getFieldValue('floorCount') as number | undefined
    form.setFieldsValue({
      buildingTypeId: next,
      floorCount:
        nextType?.floorsEnabled && current !== undefined && nextType.floorCounts.includes(current)
          ? current
          : undefined,
      hasTum: nextType?.tumEnabled ? form.getFieldValue('hasTum') : undefined
    })
  }

  const showFloors = unknownType ? floorCount !== undefined : Boolean(type?.floorsEnabled)
  const showTum = unknownType ? hasTum !== undefined : Boolean(type?.tumEnabled)

  return (
    <>
      <Form.Item name='pinnedTypeName' hidden>
        <Input />
      </Form.Item>
      <Form.Item name='name' label={l('name')} extra={l('draftHint')}>
        <Input />
      </Form.Item>
      <Form.Item name='drawingKind' label={l('drawingKind')}>
        <Select allowClear options={DRAWING_KINDS.map((value) => ({ value, label: value }))} />
      </Form.Item>
      <Row gutter={16}>
        <Col xs={24} md={8}>
          <Form.Item name='widthM' label={l('widthM')} rules={[decimalRule(l('widthM'))]}>
            <Input suffix='m' inputMode='decimal' />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item name='lengthM' label={l('lengthM')} rules={[decimalRule(l('lengthM'))]}>
            <Input suffix='m' inputMode='decimal' />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item name='areaM2' label={l('areaM2')} rules={[decimalRule(l('areaM2'))]} extra={l('areaHint')}>
            <Input suffix='m²' inputMode='decimal' />
          </Form.Item>
        </Col>
      </Row>

      {isError ? <Alert type='warning' showIcon style={{ marginBottom: 16 }} title={l('catalogUnavailable')} /> : null}
      <Form.Item name='buildingTypeId' label={l('buildingType')}>
        <Select allowClear options={typeOptions} onChange={changeType} optionFilterProp='label' showSearch />
      </Form.Item>
      {unknownType ? <Alert type='info' showIcon style={{ marginBottom: 16 }} title={l('pinnedTypeNote')} /> : null}
      <Row gutter={16}>
        <Col xs={24} md={12}>
          {showFloors ? (
            <Form.Item name='floorCount' label={l('floorCount')}>
              <Select allowClear options={floorOptions} />
            </Form.Item>
          ) : (
            <Form.Item label={l('floorCount')}>
              <Input disabled value={typeId ? l('notApplies') : ''} />
            </Form.Item>
          )}
        </Col>
        <Col xs={24} md={12}>
          {showTum ? (
            <Form.Item name='hasTum' label={l('tum')}>
              <Select
                allowClear
                options={[
                  { value: true, label: l('tumYes') },
                  { value: false, label: l('tumNo') }
                ]}
              />
            </Form.Item>
          ) : (
            <Form.Item label={l('tum')}>
              <Input disabled value={typeId ? l('notApplies') : ''} />
            </Form.Item>
          )}
        </Col>
      </Row>

      <Form.Item name='description' label={l('description')}>
        <Input.TextArea rows={4} />
      </Form.Item>
    </>
  )
}
