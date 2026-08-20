'use client'

import { CheckOutlined, CloseOutlined } from '@ant-design/icons'
import { App, Button, Popconfirm, Rate, Space, Tag, Typography } from 'antd'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

import type { CmsPackageReview, CmsReviewStatus } from '@/shared/cms'
import { useSaveAdminItem } from '../../hooks/use-admin-data'
import { ResourceManager } from '../common/resource-manager'
import { Select } from 'antd'

const { Text, Paragraph } = Typography

const STATUS_TAG: Record<CmsReviewStatus, string> = {
  pending: 'gold',
  approved: 'green',
  rejected: 'red'
}

/**
 * Review của khách về gói tư vấn — DUYỆT XONG MỚI HIỆN công khai.
 *
 * Việc hằng ngày là quét hàng chờ: đọc nội dung, duyệt cái thật, từ chối cái
 * quảng cáo / xúc phạm. Mặc định lọc sẵn "Chờ duyệt" — vào màn là thấy đúng đống
 * việc, không phải tự lọc. Không xóa review: cái bị từ chối giữ lại làm bằng
 * chứng khi khách khiếu nại.
 */
export function ReviewManager() {
  const t = useTranslations('admin')
  const { message } = App.useApp()
  const save = useSaveAdminItem('packageReviews')
  const [status, setStatus] = useState<CmsReviewStatus | 'all'>('pending')

  const decide = async (review: CmsPackageReview, next: CmsReviewStatus) => {
    await save.mutateAsync({ ...review, status: next })
    message.success(next === 'approved' ? t('reviews.approvedToast') : t('reviews.rejectedToast'))
  }

  return (
    <ResourceManager
      collection='packageReviews'
      title={t('nav.reviews')}
      description={t('reviews.description')}
      allowDelete={false}
      allowEdit={false}
      searchText={(item) => `${item.packageName} ${item.customerName} ${item.content}`}
      extraActions={
        <Select
          value={status}
          onChange={setStatus}
          style={{ minWidth: 170 }}
          options={[
            { value: 'pending', label: t('reviews.onlyPending') },
            { value: 'approved', label: t('reviewStatus.approved') },
            { value: 'rejected', label: t('reviewStatus.rejected') },
            { value: 'all', label: t('transactions.allStatuses') }
          ]}
        />
      }
      filterItems={(item) => status === 'all' || item.status === status}
      columns={[
        {
          title: t('reviews.review'),
          dataIndex: 'content',
          render: (_, record) => (
            <div style={{ minWidth: 0, maxWidth: 520 }}>
              <Space size={8}>
                <Text strong>{record.customerName}</Text>
                <Rate disabled value={record.rating} style={{ fontSize: 13 }} />
              </Space>
              <Paragraph style={{ margin: '2px 0 0' }} ellipsis={{ rows: 2, tooltip: record.content }}>
                {record.content}
              </Paragraph>
            </div>
          )
        },
        {
          title: t('reviews.package'),
          dataIndex: 'packageName',
          width: 180,
          render: (name: string) => <Tag>{name}</Tag>
        },
        { title: t('transactions.createdAt'), dataIndex: 'createdAt', width: 120 },
        {
          title: t('bookings.status'),
          dataIndex: 'status',
          width: 120,
          render: (value: CmsReviewStatus) => <Tag color={STATUS_TAG[value]}>{t(`reviewStatus.${value}`)}</Tag>
        },
        {
          title: t('table.actions'),
          key: 'decision',
          width: 180,
          render: (_, record) =>
            record.status === 'pending' ? (
              <Space size={8}>
                <Button size='small' type='primary' icon={<CheckOutlined />} onClick={() => decide(record, 'approved')}>
                  {t('reviews.approve')}
                </Button>
                <Popconfirm
                  title={t('reviews.rejectConfirmTitle')}
                  okText={t('reviews.reject')}
                  okButtonProps={{ danger: true }}
                  cancelText={t('actions.cancel')}
                  onConfirm={() => decide(record, 'rejected')}
                >
                  <Button size='small' danger icon={<CloseOutlined />}>
                    {t('reviews.reject')}
                  </Button>
                </Popconfirm>
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
