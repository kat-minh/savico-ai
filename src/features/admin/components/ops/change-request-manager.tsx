'use client'

import { CheckOutlined, CloseOutlined } from '@ant-design/icons'
import { Alert, App, Button, Card, Empty, Form, Input, Modal, Space, Table, Tag, Typography } from 'antd'
import { useLocale, useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'

import type { Locale } from '@/i18n/routing'
import { useAdminCollection, useSaveAdminItem } from '../../hooks/use-admin-data'
import {
  decideChangeRequest,
  nextVersion,
  pendingChangeRequests,
  relativeTime,
  type PendingChangeRequest
} from '../../services/ops.service'
import { AdminPage } from '../common/admin-page'

const { Text, Paragraph } = Typography

/**
 * YÊU CẦU SỬA ĐỔI — CR khách gửi trên hồ sơ giai đoạn ĐÃ KHÓA (S23, R5).
 *
 * R5: sau khi Giám sát xác nhận, hồ sơ giai đoạn khóa và chỉ đổi được qua một
 * yêu cầu sửa đổi bên kia duyệt. CR do khách gửi thì phía SAVICO duyệt — trước
 * đây bảng điều khiển của khách gửi được CR nhưng không có chỗ nào để duyệt, nên
 * CR đứng "Chờ duyệt" mãi.
 *
 * CR nằm lồng trong từng giai đoạn của từng dự án giám sát, nên màn này DỰNG
 * hàng đợi từ bảng dự án chứ không có kho CR riêng: duyệt xong là ghi lại cả dự
 * án, bảng điều khiển của khách thấy ngay phiên bản mới.
 *
 * CR do Giám sát đề xuất (`by: 'GS'`) không có ở đây — cái đó khách duyệt (S22).
 */
export function ChangeRequestManager() {
  const t = useTranslations('admin')
  const tStage = useTranslations('supervision.stages')
  const locale = useLocale() as Locale
  const { message } = App.useApp()
  const [form] = Form.useForm<{ response: string }>()

  const { data: projects = [], isPending } = useAdminCollection('supervisionProjects')
  const save = useSaveAdminItem('supervisionProjects')
  const [target, setTarget] = useState<{ request: PendingChangeRequest; approve: boolean } | null>(null)

  const rows = useMemo(
    () => pendingChangeRequests(projects).sort((a, b) => a.proposedAt.localeCompare(b.proposedAt)),
    [projects]
  )

  function open(request: PendingChangeRequest, approve: boolean) {
    form.setFieldsValue({ response: '' })
    setTarget({ request, approve })
  }

  async function submit() {
    if (!target) return
    const { response } = await form.validateFields()
    const project = projects.find((item) => item.id === target.request.projectId)
    if (!project) return

    await save.mutateAsync(
      decideChangeRequest(
        project,
        { stageKey: target.request.stageKey, changeRequestId: target.request.changeRequestId },
        { approve: target.approve, response }
      )
    )
    message.success(
      t(target.approve ? 'changeRequests.approvedToast' : 'changeRequests.rejectedToast', {
        code: target.request.changeRequestId,
        project: target.request.projectName
      })
    )
    setTarget(null)
  }

  return (
    <AdminPage title={t('nav.changeRequests')} description={t('changeRequests.description')}>
      <Card className='admin-table-card' styles={{ body: { padding: 0 } }}>
        <Table<PendingChangeRequest>
          rowKey={(row) => `${row.projectId}:${row.stageKey}:${row.changeRequestId}`}
          loading={isPending}
          dataSource={rows}
          scroll={{ x: 'max-content' }}
          pagination={{ pageSize: 10, hideOnSinglePage: true }}
          locale={{ emptyText: isPending ? ' ' : <Empty description={t('changeRequests.empty')} /> }}
          columns={[
            {
              title: t('changeRequests.code'),
              dataIndex: 'changeRequestId',
              width: 110,
              render: (id: string, row) => (
                <div>
                  <Text code>{id}</Text>
                  <Text type='secondary' style={{ display: 'block', fontSize: 12 }}>
                    {relativeTime(row.proposedAt, locale)}
                  </Text>
                </div>
              )
            },
            {
              title: t('changeRequests.project'),
              key: 'project',
              render: (_, row) => (
                <div style={{ minWidth: 0 }}>
                  <Text strong style={{ display: 'block' }}>
                    {row.projectName}
                  </Text>
                  <Text type='secondary' style={{ fontSize: 12 }}>
                    {row.projectId} · {t('changeRequests.engineer', { name: row.engineer })}
                  </Text>
                </div>
              )
            },
            {
              title: t('changeRequests.stage'),
              key: 'stage',
              width: 230,
              render: (_, row) => (
                <Space orientation='vertical' size={2}>
                  <Text>{t('changeRequests.stageLabel', { index: row.stageIndex, name: tStage(row.stageKey) })}</Text>
                  <Tag>
                    {t('changeRequests.version', { from: row.stageVersion, to: nextVersion(row.stageVersion) })}
                  </Tag>
                </Space>
              )
            },
            {
              title: t('changeRequests.reason'),
              dataIndex: 'reason',
              render: (reason: string) => (
                <Paragraph style={{ margin: 0, maxWidth: 360 }} ellipsis={{ rows: 3, tooltip: reason }}>
                  {reason}
                </Paragraph>
              )
            },
            {
              title: t('changeRequests.due'),
              dataIndex: 'dueAt',
              width: 120,
              render: (dueAt?: string) => (dueAt ? <Text>{dueAt.slice(0, 10)}</Text> : <Text type='secondary'>—</Text>)
            },
            {
              title: t('table.actions'),
              key: 'decide',
              width: 210,
              render: (_, row) => (
                <Space size={6}>
                  <Button size='small' type='primary' icon={<CheckOutlined />} onClick={() => open(row, true)}>
                    {t('changeRequests.approve')}
                  </Button>
                  <Button size='small' danger icon={<CloseOutlined />} onClick={() => open(row, false)}>
                    {t('changeRequests.reject')}
                  </Button>
                </Space>
              )
            }
          ]}
        />
      </Card>

      <Modal
        open={target !== null}
        onCancel={() => setTarget(null)}
        onOk={submit}
        confirmLoading={save.isPending}
        okText={target?.approve ? t('changeRequests.approve') : t('changeRequests.reject')}
        okButtonProps={{ danger: target?.approve === false }}
        cancelText={t('actions.cancel')}
        title={target ? t('changeRequests.modalTitle', { code: target.request.changeRequestId }) : ''}
        destroyOnHidden
      >
        {target ? (
          <Form form={form} layout='vertical'>
            <Alert
              type={target.approve ? 'info' : 'warning'}
              showIcon
              style={{ marginBottom: 16 }}
              title={
                target.approve
                  ? t('changeRequests.approveHint', { version: nextVersion(target.request.stageVersion) })
                  : t('changeRequests.rejectHint', { version: target.request.stageVersion })
              }
              description={target.request.reason}
            />
            <Form.Item
              name='response'
              label={t('changeRequests.response')}
              rules={target.approve ? [] : [{ required: true, message: t('changeRequests.responseRequired') }]}
            >
              <Input.TextArea rows={3} />
            </Form.Item>
          </Form>
        ) : null}
      </Modal>
    </AdminPage>
  )
}
