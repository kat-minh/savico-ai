'use client'

import { Alert, Descriptions, Form, Select, Tag, Typography } from 'antd'
import { useLocale, useTranslations } from 'next-intl'

import type { Locale } from '@/i18n/routing'
import type { CmsDesignProject, CmsProjectStatus } from '@/shared/cms'
import { formatCurrency } from '@/shared/utils'
import { ResourceManager } from '../common/resource-manager'

const { Text } = Typography

const STATUSES: CmsProjectStatus[] = ['input', 'designing', 'review', 'completed']

const STATUS_COLOR: Record<CmsProjectStatus, string> = {
  input: 'default',
  designing: 'blue',
  review: 'gold',
  completed: 'green'
}

/**
 * Dự án khách hàng — theo dõi luồng 3 bước (mục III) từ phía vận hành.
 *
 * ĐÂY LÀ DỮ LIỆU CỦA KHÁCH, không phải nội dung site. Tên dự án, địa chỉ, loại
 * công trình, phong cách là do khách tự nhập ở Bước 1; bước hiện tại và tổng dự
 * toán là do hệ thống tính. Admin sửa được những thứ đó nghĩa là đổi số của
 * người khác mà họ không hay biết — nên toàn bộ nằm ở khối CHỈ ĐỌC.
 *
 * Việc của vận hành ở màn này đúng một thứ: đổi trạng thái duyệt (ví dụ duyệt
 * xong hồ sơ thì chuyển "Hoàn tất"). Không tạo dự án hộ khách, không xóa.
 */
export function ProjectManager() {
  const t = useTranslations('admin')
  const locale = useLocale() as Locale

  /** Dữ liệu khách nhập / hệ thống tính — bày ra để đối chiếu, không cho sửa. */
  const detailItems = (project: CmsDesignProject) => [
    { key: 'id', label: t('projects.code'), children: <Text code>{project.id}</Text> },
    { key: 'name', label: t('projects.name'), children: project.name },
    { key: 'customer', label: t('projects.customer'), children: `${project.customerName} · ${project.customerEmail}` },
    { key: 'address', label: t('projects.address'), children: project.address },
    { key: 'buildingType', label: t('projects.buildingType'), children: project.buildingTypeLabel },
    { key: 'style', label: t('projects.style'), children: project.styleLabel },
    { key: 'step', label: t('projects.step'), children: t('projects.stepValue', { step: project.currentStep }) },
    {
      key: 'total',
      label: t('projects.estimateTotal'),
      children: project.estimateTotal === null ? '—' : formatCurrency(project.estimateTotal, locale)
    },
    { key: 'updatedAt', label: t('projects.updatedAt'), children: project.updatedAt }
  ]

  return (
    <ResourceManager
      collection='designProjects'
      title={t('nav.projects')}
      description={t('projects.description')}
      allowDelete={false}
      searchText={(item) => `${item.id} ${item.name} ${item.customerName} ${item.address}`}
      columns={[
        {
          title: t('projects.code'),
          dataIndex: 'id',
          width: 140,
          render: (id: string) => <Text code>{id}</Text>
        },
        {
          title: t('projects.name'),
          dataIndex: 'name',
          render: (_, record) => (
            <div style={{ minWidth: 0 }}>
              <Text strong ellipsis style={{ display: 'block' }}>
                {record.name}
              </Text>
              <Text type='secondary' style={{ fontSize: 12 }}>
                {record.address}
              </Text>
            </div>
          )
        },
        {
          title: t('projects.customer'),
          dataIndex: 'customerName',
          width: 180,
          render: (_, record) => (
            <div style={{ minWidth: 0 }}>
              <Text style={{ display: 'block' }}>{record.customerName}</Text>
              <Text type='secondary' style={{ fontSize: 12 }}>
                {record.customerEmail}
              </Text>
            </div>
          )
        },
        {
          title: t('projects.step'),
          dataIndex: 'currentStep',
          width: 90,
          sorter: (a, b) => a.currentStep - b.currentStep,
          render: (step: number) => t('projects.stepValue', { step })
        },
        {
          title: t('projects.status'),
          dataIndex: 'status',
          width: 130,
          filters: STATUSES.map((value) => ({ text: t(`projectStatus.${value}`), value })),
          onFilter: (value, record) => record.status === value,
          render: (status: CmsProjectStatus) => <Tag color={STATUS_COLOR[status]}>{t(`projectStatus.${status}`)}</Tag>
        },
        {
          title: t('projects.estimateTotal'),
          dataIndex: 'estimateTotal',
          width: 160,
          sorter: (a, b) => (a.estimateTotal ?? 0) - (b.estimateTotal ?? 0),
          render: (total: number | null) =>
            total === null ? <Text type='secondary'>—</Text> : <Text strong>{formatCurrency(total, locale)}</Text>
        },
        { title: t('projects.updatedAt'), dataIndex: 'updatedAt', width: 120 }
      ]}
      renderDetail={(project) => (
        <>
          <Alert type='info' showIcon message={t('projects.readOnlyNote')} style={{ marginBottom: 16 }} />
          <Descriptions size='small' column={1} bordered items={detailItems(project)} />
        </>
      )}
      renderForm={() => (
        <Form.Item name='status' label={t('projects.status')} tooltip={t('projects.statusHint')}>
          <Select options={STATUSES.map((value) => ({ label: t(`projectStatus.${value}`), value }))} />
        </Form.Item>
      )}
    />
  )
}
