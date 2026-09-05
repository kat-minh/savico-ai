'use client'

import { ArrowRightOutlined } from '@ant-design/icons'
import { App, Button, Popconfirm, Space, Tag, Tooltip, Typography } from 'antd'
import { useTranslations } from 'next-intl'

import type { CmsContractorInvitation, CmsInvitationStatus } from '@/shared/cms'
import { useSaveAdminItem } from '../../hooks/use-admin-data'
import { ResourceManager } from '../common/resource-manager'

const { Text } = Typography

/** Bốn nấc của thanh trạng thái ở S18, đúng thứ tự đi tới. */
const STATUS_ORDER = ['sent', 'received', 'accepted', 'done'] as const

const STATUS_TAG: Record<CmsInvitationStatus, string> = {
  sent: 'default',
  received: 'blue',
  accepted: 'gold',
  done: 'green'
}

/** Nấc kế tiếp, hoặc `null` khi lời mời đã ở nấc cuối. */
function nextStatus(status: CmsInvitationStatus): CmsInvitationStatus | null {
  const index = STATUS_ORDER.indexOf(status)
  return STATUS_ORDER[index + 1] ?? null
}

/**
 * LỜI MỜI BÁO GIÁ — màn của đội vận hành (R4).
 *
 * R4 nói khách CHỈ XEM thanh 4 nấc ở S18, đội hỗ trợ SAVICO mới là bên cập nhật.
 * Không có màn này thì lời mời đứng mãi ở nấc "Đã gửi": không chỉ thiếu một màn
 * quản trị, mà cả luồng đánh giá nhà thầu (chỉ mở ở nấc "Hoàn tất") cũng không
 * bao giờ chạm tới được.
 *
 * Trạng thái chỉ ĐI TỚI từng nấc một, không nhảy cóc và không lùi: mỗi lần bấm
 * ghi thêm một mốc vào `steps`, và dòng thời gian trên thẻ của khách là bản ghi
 * chứ không phải suy ra từ trạng thái hiện tại. Nhấn nhầm thì gọi backend sửa,
 * chứ một nút "lùi nấc" sẽ tạo ra lịch sử không có thật.
 *
 * R2/R3 — màn này KHÔNG có trường tiền và không có "báo giá đã nhận": sau khi
 * nhà thầu nhận lời mời, hai bên làm việc trực tiếp ngoài web.
 */
export function InvitationManager() {
  const t = useTranslations('admin')
  const { message } = App.useApp()
  const save = useSaveAdminItem('contractorInvitations')

  const advance = async (invitation: CmsContractorInvitation) => {
    const next = nextStatus(invitation.status)
    if (!next) return

    const at = new Date().toISOString()
    await save.mutateAsync({
      ...invitation,
      status: next,
      updatedAt: at,
      steps: [...invitation.steps, { status: next, at }]
    })
    message.success(t('invitations.advancedToast', { code: invitation.id, status: t(`invitationStatus.${next}`) }))
  }

  return (
    <ResourceManager
      collection='contractorInvitations'
      title={t('nav.invitations')}
      description={t('invitations.description')}
      allowDelete={false}
      allowEdit={false}
      searchText={(item) => `${item.id} ${item.projectId} ${item.projectName} ${item.contractorName}`}
      columns={[
        {
          title: t('invitations.code'),
          dataIndex: 'id',
          width: 150,
          render: (id: string, record) => (
            <div style={{ minWidth: 0 }}>
              <Text code>{id}</Text>
              <Text type='secondary' style={{ display: 'block', fontSize: 12 }}>
                {t('invitations.dossier', { version: record.dossierVersion, count: record.fileCount })}
              </Text>
            </div>
          )
        },
        {
          title: t('invitations.project'),
          dataIndex: 'projectName',
          render: (_, record) => (
            <div style={{ minWidth: 0 }}>
              <Text strong style={{ display: 'block' }}>
                {record.projectName}
              </Text>
              <Text type='secondary' style={{ fontSize: 12 }}>
                {record.projectId}
              </Text>
            </div>
          )
        },
        {
          title: t('invitations.contractor'),
          dataIndex: 'contractorName',
          render: (name: string) => <Text>{name}</Text>
        },
        {
          title: t('invitations.survey'),
          key: 'survey',
          width: 200,
          render: (_, record) => (
            <div style={{ minWidth: 0 }}>
              <Text style={{ display: 'block' }}>{record.survey.date}</Text>
              {/* Số điện thoại khách để lại khi đặt lịch — thứ Ops cần nhất khi
                  gọi xác nhận, nên đứng ngay cạnh ngày khảo sát. */}
              <Text type='secondary' style={{ fontSize: 12 }}>
                {record.survey.phone}
              </Text>
            </div>
          )
        },
        {
          title: t('invitations.status'),
          dataIndex: 'status',
          width: 150,
          filters: STATUS_ORDER.map((status) => ({ text: t(`invitationStatus.${status}`), value: status })),
          onFilter: (value, record) => record.status === value,
          render: (status: CmsInvitationStatus, record) => (
            <Tooltip title={t('invitations.updatedAt', { time: record.updatedAt })}>
              <Tag color={STATUS_TAG[status]}>{t(`invitationStatus.${status}`)}</Tag>
            </Tooltip>
          )
        },
        {
          title: t('table.actions'),
          key: 'advance',
          width: 210,
          render: (_, record) => {
            const next = nextStatus(record.status)
            if (!next) return <Text type='secondary'>{t('invitations.finished')}</Text>

            return (
              <Space size={8}>
                <Popconfirm
                  title={t('invitations.advanceConfirmTitle', { status: t(`invitationStatus.${next}`) })}
                  description={t('invitations.advanceConfirmBody')}
                  okText={t('invitations.advance')}
                  cancelText={t('actions.cancel')}
                  onConfirm={() => advance(record)}
                >
                  <Button size='small' type='primary' icon={<ArrowRightOutlined />}>
                    {t(`invitationStatus.${next}`)}
                  </Button>
                </Popconfirm>
              </Space>
            )
          }
        }
      ]}
      renderForm={() => null}
    />
  )
}
