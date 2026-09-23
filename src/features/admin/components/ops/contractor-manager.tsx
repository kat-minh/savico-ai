'use client'

import { SafetyCertificateFilled } from '@ant-design/icons'
import {
  Avatar,
  Col,
  Divider,
  Form,
  Input,
  InputNumber,
  Row,
  Segmented,
  Select,
  Space,
  Switch,
  Tag,
  Typography
} from 'antd'
import { useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'

import type { CmsContractor, CmsServiceRegion } from '@/shared/cms'
import { useAdminCollection, useSaveAdminItem } from '../../hooks/use-admin-data'
import { newAdminId } from '../../services/admin.service'
import { ImageUrlField, StringListField } from '../common/field-kit'
import { ResourceManager } from '../common/resource-manager'

const { Text } = Typography

const REGIONS: CmsServiceRegion[] = ['north', 'central', 'south']

type View = 'all' | 'unverified' | 'hidden'

function blankContractor(): CmsContractor {
  return {
    id: newAdminId('ctr'),
    name: '',
    kind: 'Nhà thầu xây dựng',
    verified: false,
    rating: 0,
    reviewCount: 0,
    similarProjects: 0,
    completedProjects: 0,
    distanceKm: 0,
    serviceAreas: [],
    region: 'central',
    surveyWithinHours: 48,
    acceptingProjects: true,
    intro: '',
    strengths: [],
    photos: [],
    foundedYear: new Date().getFullYear(),
    teamSize: '',
    officeAddress: '',
    warrantyMonths: 12,
    legalChecks: [],
    featuredProjects: [],
    verifiedProjects: 0,
    partnership: { verified: false, since: '', contractCode: '', signedAt: '', pageCount: 0 },
    contact: { person: '', phone: '', email: '' },
    // Nhà thầu mới nhập chưa xác minh thì chưa lên danh sách đề xuất.
    hidden: true
  }
}

/**
 * DANH BẠ NHÀ THẦU — vận hành nhập, xác minh và bật/tắt nhận dự án (S12–S15).
 *
 * Luồng Tìm nhà thầu đọc thẳng bảng này: sửa ở đây là thẻ nhà thầu, bảng so
 * sánh và hồ sơ S13/S14 đổi theo. Ba công tắc có hệ quả khác nhau nên tách rõ:
 *
 * - **Đã xác minh** — badge xanh trên thẻ và hồ sơ (S13).
 * - **Đang nhận dự án** — dòng "Đang nhận dự án" trên thẻ (S12); tắt khi nhà
 *   thầu báo kín lịch. Bật/tắt ngay trên bảng vì đây là việc làm hằng tuần.
 * - **Ẩn khỏi đề xuất** — gỡ khỏi mọi danh sách mà KHÔNG xóa: lời mời cũ vẫn
 *   trỏ tới nhà thầu này. Vì thế bảng không có nút xóa.
 *
 * Đầu mối liên hệ chỉ vận hành thấy — trang công khai không trả ra (S13).
 * Không trường nào liên quan tới giá (R2).
 */
export function ContractorManager() {
  const t = useTranslations('admin')
  const [view, setView] = useState<View>('all')

  const { data: contractors = [] } = useAdminCollection('contractors')
  const { data: invitations = [] } = useAdminCollection('contractorInvitations')
  const save = useSaveAdminItem('contractors')

  /** Lời mời chưa ở nấc "Hoàn tất" — nhà thầu đang có bao nhiêu việc với SAVICO. */
  const openInvitations = useMemo(() => {
    const map = new Map<string, number>()
    for (const invitation of invitations) {
      if (invitation.status !== 'done') map.set(invitation.contractorId, (map.get(invitation.contractorId) ?? 0) + 1)
    }
    return map
  }, [invitations])

  const counts = {
    all: contractors.length,
    unverified: contractors.filter((item) => !item.verified).length,
    hidden: contractors.filter((item) => item.hidden).length
  }

  const inView = (item: CmsContractor) => {
    if (view === 'unverified') return !item.verified
    if (view === 'hidden') return Boolean(item.hidden)
    return true
  }

  return (
    <ResourceManager
      collection='contractors'
      title={t('nav.contractors')}
      description={t('contractors.description')}
      allowDelete={false}
      drawerWidth={760}
      createItem={blankContractor}
      searchText={(item) =>
        `${item.name} ${item.kind} ${item.serviceAreas.join(' ')} ${item.contact?.person ?? ''} ${item.contact?.phone ?? ''}`
      }
      filterItems={inView}
      banner={
        <Segmented<View>
          value={view}
          onChange={setView}
          options={(['all', 'unverified', 'hidden'] as const).map((value) => ({
            value,
            label: `${t(`contractors.views.${value}`)} (${counts[value]})`
          }))}
        />
      }
      columns={[
        {
          title: t('contractors.name'),
          dataIndex: 'name',
          render: (_, record) => (
            <Space size={10}>
              <Avatar shape='square' src={record.logoUrl} size={36}>
                {record.name.slice(0, 1)}
              </Avatar>
              <div style={{ minWidth: 0 }}>
                <Text strong style={{ display: 'block' }}>
                  {record.name || t('contractors.unnamed')}{' '}
                  {record.verified ? <SafetyCertificateFilled style={{ color: '#16a34a' }} /> : null}
                </Text>
                <Text type='secondary' style={{ fontSize: 12 }}>
                  {t('contractors.ratingLine', {
                    kind: record.kind,
                    rating: record.rating.toFixed(1),
                    count: record.reviewCount
                  })}
                </Text>
              </div>
            </Space>
          )
        },
        {
          title: t('contractors.region'),
          key: 'region',
          width: 220,
          filters: REGIONS.map((region) => ({ text: t(`contractors.regions.${region}`), value: region })),
          onFilter: (value, record) => record.region === value,
          render: (_, record) => (
            <div style={{ minWidth: 0 }}>
              <Text style={{ display: 'block' }}>{t(`contractors.regions.${record.region}`)}</Text>
              <Text type='secondary' style={{ fontSize: 12 }} ellipsis={{ tooltip: record.serviceAreas.join(', ') }}>
                {record.serviceAreas.join(', ')}
              </Text>
            </div>
          )
        },
        {
          title: t('contractors.contact'),
          key: 'contact',
          width: 200,
          render: (_, record) =>
            record.contact?.phone ? (
              <div style={{ minWidth: 0 }}>
                <Text style={{ display: 'block' }}>{record.contact.person}</Text>
                <Text copyable type='secondary' style={{ fontSize: 12 }}>
                  {record.contact.phone}
                </Text>
              </div>
            ) : (
              <Text type='warning'>{t('contractors.noContact')}</Text>
            )
        },
        {
          title: t('contractors.state'),
          key: 'state',
          width: 190,
          render: (_, record) => (
            <Space size={4} wrap>
              <Tag color={record.verified ? 'green' : 'gold'}>
                {record.verified ? t('contractors.verified') : t('contractors.unverified')}
              </Tag>
              {record.hidden ? <Tag>{t('contractors.hiddenTag')}</Tag> : null}
              {openInvitations.get(record.id) ? (
                <Tag color='blue'>
                  {t('contractors.openInvitations', { count: openInvitations.get(record.id) ?? 0 })}
                </Tag>
              ) : null}
            </Space>
          )
        },
        {
          title: t('contractors.accepting'),
          dataIndex: 'acceptingProjects',
          width: 130,
          render: (accepting: boolean, record) => (
            <Switch
              size='small'
              checked={accepting}
              loading={save.isPending && save.variables?.id === record.id}
              onChange={(checked) => save.mutate({ ...record, acceptingProjects: checked })}
            />
          )
        }
      ]}
      renderForm={(form) => (
        <>
          <Divider titlePlacement='start' plain>
            {t('contractors.sections.status')}
          </Divider>
          <Row gutter={16}>
            <Col xs={24} sm={8}>
              <Form.Item name='verified' label={t('contractors.verified')} valuePropName='checked'>
                <Switch />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item name='acceptingProjects' label={t('contractors.accepting')} valuePropName='checked'>
                <Switch />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item
                name='hidden'
                label={t('contractors.hidden')}
                valuePropName='checked'
                tooltip={t('contractors.hiddenHint')}
              >
                <Switch />
              </Form.Item>
            </Col>
          </Row>

          <Divider titlePlacement='start' plain>
            {t('contractors.sections.profile')}
          </Divider>
          <Row gutter={16}>
            <Col xs={24} sm={14}>
              <Form.Item
                name='name'
                label={t('contractors.name')}
                rules={[{ required: true, message: t('fields.requiredMessage') }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} sm={10}>
              <Form.Item name='kind' label={t('contractors.kind')}>
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <ImageUrlField form={form} name='logoUrl' label={t('contractors.logo')} />
          <Form.Item name='intro' label={t('contractors.intro')}>
            <Input.TextArea rows={4} />
          </Form.Item>
          <Form.Item name='strengths' label={t('contractors.strengths')}>
            <Select mode='tags' tokenSeparators={[',']} />
          </Form.Item>
          <Row gutter={16}>
            <Col xs={12} sm={6}>
              <Form.Item name='foundedYear' label={t('contractors.foundedYear')}>
                <InputNumber min={1950} max={2100} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={12} sm={6}>
              <Form.Item name='teamSize' label={t('contractors.teamSize')}>
                <Input />
              </Form.Item>
            </Col>
            <Col xs={12} sm={6}>
              <Form.Item name='warrantyMonths' label={t('contractors.warranty')}>
                <InputNumber min={0} max={240} addonAfter={t('contractors.months')} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={12} sm={6}>
              <Form.Item name='surveyWithinHours' label={t('contractors.surveyWithin')}>
                <Select options={[24, 48, 72].map((hours) => ({ value: hours, label: `${hours}h` }))} />
              </Form.Item>
            </Col>
          </Row>

          <Divider titlePlacement='start' plain>
            {t('contractors.sections.coverage')}
          </Divider>
          <Row gutter={16}>
            <Col xs={24} sm={8}>
              <Form.Item name='region' label={t('contractors.region')}>
                <Select
                  options={REGIONS.map((region) => ({ value: region, label: t(`contractors.regions.${region}`) }))}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={16}>
              <Form.Item name='officeAddress' label={t('contractors.office')}>
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name='serviceAreas' label={t('contractors.serviceAreas')}>
            <Select mode='tags' tokenSeparators={[',']} />
          </Form.Item>
          <Form.Item name='distanceKm' label={t('contractors.distance')} extra={t('contractors.distanceHint')}>
            <InputNumber min={0} step={0.1} addonAfter='km' />
          </Form.Item>

          <Divider titlePlacement='start' plain>
            {t('contractors.sections.stats')}
          </Divider>
          <Row gutter={16}>
            <Col xs={12} sm={6}>
              <Form.Item name='rating' label={t('contractors.rating')}>
                <InputNumber min={0} max={5} step={0.1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={12} sm={6}>
              <Form.Item name='reviewCount' label={t('contractors.reviewCount')}>
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={12} sm={6}>
              <Form.Item name='completedProjects' label={t('contractors.completedProjects')}>
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={12} sm={6}>
              <Form.Item name='similarProjects' label={t('contractors.similarProjects')}>
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Divider titlePlacement='start' plain>
            {t('contractors.sections.legal')}
          </Divider>
          <StringListField name='legalChecks' label={t('contractors.legalChecks')} />
          <Row gutter={16}>
            <Col xs={24} sm={8}>
              <Form.Item
                name={['partnership', 'verified']}
                label={t('contractors.partnerVerified')}
                valuePropName='checked'
              >
                <Switch />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item name={['partnership', 'contractCode']} label={t('contractors.contractCode')}>
                <Input placeholder='SVC-HT-2026-001' />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item name={['partnership', 'since']} label={t('contractors.partnerSince')}>
                <Input placeholder='08/2026' />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item name={['partnership', 'signedAt']} label={t('contractors.signedAt')}>
                <Input placeholder='2026-08-15' />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item name={['partnership', 'pageCount']} label={t('contractors.pageCount')}>
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item name={['partnership', 'scanUrl']} label={t('contractors.scanUrl')}>
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Divider titlePlacement='start' plain>
            {t('contractors.sections.contact')}
          </Divider>
          <Row gutter={16}>
            <Col xs={24} sm={8}>
              <Form.Item name={['contact', 'person']} label={t('contractors.person')}>
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item name={['contact', 'phone']} label={t('contractors.phone')}>
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item
                name={['contact', 'email']}
                label='Email'
                rules={[{ type: 'email', message: t('fields.emailMessage') }]}
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name='opsNote' label={t('contractors.opsNote')}>
            <Input.TextArea rows={2} />
          </Form.Item>
        </>
      )}
    />
  )
}
