'use client'

import { App, Button, Space, Tag, Typography } from 'antd'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

import type { CmsReport, CmsReportStatus } from '@/shared/cms'
import { useSaveAdminItem } from '../../hooks/use-admin-data'
import { ResourceManager } from '../common/resource-manager'
import { Select } from 'antd'

const { Text } = Typography

const STATUS_TAG: Record<CmsReportStatus, string> = {
  open: 'red',
  resolved: 'green',
  dismissed: 'default'
}

/**
 * Báo cáo vi phạm do người dùng gửi — review bẩn, KTS không gọi lại, nội dung
 * sai lệch.
 *
 * Đây là hộp thư khiếu nại: việc của vận hành là xử lý ngoài đời (gỡ review, gọi
 * lại khách…) rồi quay vào đóng hồ sơ bằng "Đã xử lý" hoặc "Bỏ qua". Mặc định
 * lọc "Đang mở" — vào màn là thấy việc còn tồn.
 */
export function ReportManager() {
  const t = useTranslations('admin')
  const { message } = App.useApp()
  const save = useSaveAdminItem('reports')
  const [status, setStatus] = useState<CmsReportStatus | 'all'>('open')

  const close = async (report: CmsReport, next: CmsReportStatus) => {
    await save.mutateAsync({ ...report, status: next })
    message.success(t('reports.closedToast'))
  }

  return (
    <ResourceManager
      collection='reports'
      title={t('nav.reports')}
      description={t('reports.description')}
      allowDelete={false}
      allowEdit={false}
      searchText={(item) => `${item.id} ${item.reporterName} ${item.targetLabel} ${item.reason}`}
      extraActions={
        <Select
          value={status}
          onChange={setStatus}
          style={{ minWidth: 170 }}
          options={[
            { value: 'open', label: t('reports.onlyOpen') },
            { value: 'resolved', label: t('reportStatus.resolved') },
            { value: 'dismissed', label: t('reportStatus.dismissed') },
            { value: 'all', label: t('transactions.allStatuses') }
          ]}
        />
      }
      filterItems={(item) => status === 'all' || item.status === status}
      columns={[
        { title: t('reports.code'), dataIndex: 'id', width: 110, render: (id: string) => <Text code>{id}</Text> },
        {
          title: t('reports.target'),
          dataIndex: 'targetLabel',
          render: (_, record) => (
            <div style={{ minWidth: 0, maxWidth: 420 }}>
              <Space size={6}>
                <Tag>{t(`reportTarget.${record.targetType}`)}</Tag>
                <Text strong ellipsis={{ tooltip: record.targetLabel }}>
                  {record.targetLabel}
                </Text>
              </Space>
              <Text type='secondary' style={{ display: 'block', fontSize: 12 }} ellipsis={{ tooltip: record.reason }}>
                {record.reason}
              </Text>
            </div>
          )
        },
        {
          title: t('reports.reporter'),
          dataIndex: 'reporterName',
          width: 170
        },
        { title: t('transactions.createdAt'), dataIndex: 'createdAt', width: 120 },
        {
          title: t('bookings.status'),
          dataIndex: 'status',
          width: 120,
          render: (value: CmsReportStatus) => <Tag color={STATUS_TAG[value]}>{t(`reportStatus.${value}`)}</Tag>
        },
        {
          title: t('table.actions'),
          key: 'decision',
          width: 190,
          render: (_, record) =>
            record.status === 'open' ? (
              <Space size={8}>
                <Button size='small' type='primary' onClick={() => close(record, 'resolved')}>
                  {t('reports.resolve')}
                </Button>
                <Button size='small' onClick={() => close(record, 'dismissed')}>
                  {t('reports.dismiss')}
                </Button>
              </Space>
            ) : (
              <Text type='secondary'>—</Text>
            )
        }
      ]}
      renderForm={() => null}
    />
  )
}
