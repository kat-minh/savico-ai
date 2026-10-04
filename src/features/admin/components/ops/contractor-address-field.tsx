'use client'

import { useQuery } from '@tanstack/react-query'
import { Alert, Button, Form, Input, Select, Space, Typography, type FormInstance } from 'antd'
import { useTranslations } from 'next-intl'
import { useEffect, useRef, useState } from 'react'
import { locationApi, type LocationSuggestion } from '@/shared/locations'

const text = (v: unknown) => (typeof v === 'string' ? v.normalize('NFC').trim() : '')
export function contractorAddressKey(values: Record<string, unknown>): string {
  return JSON.stringify([
    text(values.provinceCode),
    text(values.wardCode),
    text(values.locationDatasetVersion),
    text(values.addressDetail)
  ])
}

export function ContractorAddressField({ form, visible }: { form: FormInstance; visible: boolean }) {
  const t = useTranslations('admin.contractorsAdmin.addressParts')
  const active = Form.useWatch('_structuredAddress', form) === true
  const province = Form.useWatch('provinceCode', form) as string | null | undefined
  const ward = Form.useWatch('wardCode', form) as string | null | undefined
  const detail = Form.useWatch('addressDetail', form) as string | undefined
  const dataset = Form.useWatch('locationDatasetVersion', form) as string | null | undefined
  const coordinateKey = Form.useWatch('_addressCoordinateKey', form) as string | undefined
  const latitude = Form.useWatch('latitude', form) as number | null | undefined
  const longitude = Form.useWatch('longitude', form) as number | null | undefined
  const key = contractorAddressKey({
    provinceCode: province,
    wardCode: ward,
    addressDetail: detail,
    locationDatasetVersion: dataset
  })
  const provinces = useQuery({
    queryKey: ['locations', 'provinces'],
    queryFn: ({ signal }) => locationApi.provinces(signal),
    retry: false
  })
  const wards = useQuery({
    queryKey: ['locations', 'wards', province, dataset],
    queryFn: ({ signal }) => locationApi.wards(province!, dataset!, signal),
    enabled: active && Boolean(province && dataset),
    retry: false
  })
  const controller = useRef<AbortController | null>(null)
  const [suggestions, setSuggestions] = useState<{ key: string; items: LocationSuggestion[] } | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  useEffect(
    () => () => {
      controller.current?.abort()
    },
    [key]
  )

  const storedProvince =
    form.getFieldValue('_originalProvinceCode') === province &&
    form.getFieldValue('_originalDatasetVersion') === dataset
  const storedWard = storedProvince && form.getFieldValue('_originalWardCode') === ward
  const provinceName =
    (storedProvince ? text(form.getFieldValue('_provinceName')) : '') ||
    provinces.data?.provinces.find((p) => p.code === province)?.name ||
    ''
  const wardName =
    (storedWard ? text(form.getFieldValue('_wardName')) : '') ||
    wards.data?.wards.find((w) => w.code === ward)?.name ||
    ''
  const provinceOptions = provinces.data?.provinces.map((p) => ({ value: p.code, label: p.name })) ?? []
  const wardOptions = wards.data?.wards.map((w) => ({ value: w.code, label: w.name })) ?? []
  if (province && provinceName && !provinceOptions.some((p) => p.value === province))
    provinceOptions.push({ value: province, label: provinceName })
  if (ward && wardName && !wardOptions.some((w) => w.value === ward)) wardOptions.push({ value: ward, label: wardName })
  const address = [text(detail), wardName, provinceName].filter(Boolean).join(', ')
  const complete = Boolean(province && ward && dataset && text(detail) && provinceName && wardName)
  const needsCoordinates = complete && coordinateKey !== key
  const validCoordinates =
    typeof latitude === 'number' &&
    Number.isFinite(latitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    typeof longitude === 'number' &&
    Number.isFinite(longitude) &&
    longitude >= -180 &&
    longitude <= 180

  async function locate(refId?: string) {
    const requestKey = key
    controller.current?.abort()
    const next = new AbortController()
    controller.current = next
    setBusy(true)
    setError('')
    try {
      if (refId) {
        const result = await locationApi.place(refId, next.signal)
        if (next.signal.aborted || contractorAddressKey(form.getFieldsValue(true)) !== requestKey) return
        form.setFieldsValue({
          latitude: result.latitude,
          longitude: result.longitude,
          _addressCoordinateKey: requestKey
        })
        void form.validateFields(['addressDetail']).catch(() => {})
      } else {
        const result = await locationApi.search(address, next.signal)
        if (next.signal.aborted || contractorAddressKey(form.getFieldsValue(true)) !== requestKey) return
        setSuggestions({ key: requestKey, items: result })
        if (!result.length) setError(t('noResult'))
      }
    } catch {
      if (!next.signal.aborted) setError(t('mapError'))
    } finally {
      // The finally of an older request must not clear the loading flag of its replacement.
      if (controller.current === next) setBusy(false)
    }
  }
  function invalidate() {
    form.setFieldsValue({ latitude: null, longitude: null, _addressCoordinateKey: '' })
    controller.current?.abort()
  }
  function activate() {
    const stored = form.getFieldValue('locationDatasetVersion')
    form.setFieldsValue({
      _structuredAddress: true,
      locationDatasetVersion: stored ?? provinces.data?.datasetVersion ?? null
    })
  }
  return (
    <Space orientation='vertical' style={{ width: '100%' }}>
      {!active ? (
        <>
          <Alert type='info' title={t('legacy')} description={text(form.getFieldValue('address')) || t('noAddress')} />
          <Button onClick={activate} disabled={provinces.isPending || provinces.isError}>
            {t('add')}
          </Button>
        </>
      ) : (
        <>
          <Form.Item name='provinceCode' label={t('province')}>
            <Select
              allowClear
              showSearch
              optionFilterProp='label'
              loading={provinces.isPending}
              disabled={provinces.isError}
              options={provinceOptions}
              onChange={() => {
                invalidate()
                form.setFieldsValue({ wardCode: null, locationDatasetVersion: provinces.data?.datasetVersion ?? null })
              }}
            />
          </Form.Item>
          <Form.Item name='wardCode' label={t('ward')}>
            <Select
              allowClear
              showSearch
              optionFilterProp='label'
              loading={wards.isPending}
              disabled={!province || wards.isError}
              options={wardOptions}
              onChange={invalidate}
            />
          </Form.Item>
          <Form.Item
            name='addressDetail'
            label={t('street')}
            dependencies={['provinceCode', 'wardCode', '_addressCoordinateKey', 'latitude', 'longitude']}
            rules={[
              {
                validator: async () => {
                  const v = form.getFieldsValue(true)
                  if (!v._structuredAddress) return
                  const entered = [v.provinceCode, v.wardCode, v.addressDetail].some((x) => Boolean(text(x)))
                  if (!entered) {
                    if (visible) throw new Error(t('required'))
                    return
                  }
                  if (
                    ![v.provinceCode, v.wardCode, v.locationDatasetVersion, v.addressDetail].every((x) =>
                      Boolean(text(x))
                    )
                  )
                    throw new Error(t('required'))
                  if (text(v.addressDetail).length > 500) throw new Error(t('tooLong'))
                  if (v._addressCoordinateKey !== contractorAddressKey(v) || v.latitude == null || v.longitude == null)
                    throw new Error(t('coordinatesRequired'))
                }
              }
            ]}
          >
            <Input.TextArea rows={2} onChange={invalidate} />
          </Form.Item>
          <Typography.Text>
            {t('fullAddress')}: {address || t('noAddress')}
          </Typography.Text>
          <Button onClick={() => void locate()} disabled={!complete} loading={busy}>
            {t('locate')}
          </Button>
          {suggestions?.key === key && suggestions.items.length > 0 ? (
            <Select
              style={{ width: '100%' }}
              placeholder={t('selectLocation')}
              options={suggestions.items.map((s) => ({ value: s.refId, label: s.display }))}
              onChange={(ref) => void locate(ref)}
              loading={busy}
            />
          ) : null}
          {needsCoordinates ? <Typography.Text type='warning'>{t('coordinatesRequired')}</Typography.Text> : null}
          {needsCoordinates ? (
            <Button
              disabled={!validCoordinates}
              onClick={() => {
                controller.current?.abort()
                form.setFieldsValue({ _addressCoordinateKey: key })
                void form.validateFields(['addressDetail']).catch(() => {})
              }}
            >
              {t('confirmCoordinates')}
            </Button>
          ) : null}
          {error ? <Alert type='error' title={error} /> : null}
          {!visible ? (
            <Button
              onClick={() => {
                invalidate()
                form.setFieldsValue({
                  provinceCode: null,
                  wardCode: null,
                  locationDatasetVersion: null,
                  addressDetail: null,
                  address: null
                })
              }}
            >
              {t('clear')}
            </Button>
          ) : null}
        </>
      )}
      {provinces.isError || wards.isError ? (
        <Alert
          type='error'
          title={t('catalogError')}
          action={
            <Button
              onClick={() => {
                void provinces.refetch()
                if (province && dataset) void wards.refetch()
              }}
            >
              {t('reload')}
            </Button>
          }
        />
      ) : null}
      {wards.isError ? (
        <Button
          onClick={() => {
            invalidate()
            form.setFieldsValue({ locationDatasetVersion: provinces.data?.datasetVersion ?? null, wardCode: null })
          }}
        >
          {t('selectAgain')}
        </Button>
      ) : null}
      <Form.Item name='locationDatasetVersion' hidden>
        <Input />
      </Form.Item>
      <Form.Item name='address' hidden>
        <Input />
      </Form.Item>
      {!active ? (
        <Form.Item name='provinceCode' hidden>
          <Input />
        </Form.Item>
      ) : null}
      <Form.Item name='_structuredAddress' hidden>
        <Input />
      </Form.Item>
      <Form.Item name='_addressCoordinateKey' hidden>
        <Input />
      </Form.Item>
    </Space>
  )
}
