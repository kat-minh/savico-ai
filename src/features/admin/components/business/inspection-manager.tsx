'use client'

import { SafetyCertificateOutlined } from '@ant-design/icons'
import { App, Alert, Button, Form, Input, Modal, Switch, Tag, Typography } from 'antd'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

import type { CmsStageEvent, CmsSupervisionProject, CmsSupervisionStage } from '@/shared/cms'
import { useSaveAdminItem } from '../../hooks/use-admin-data'
import { ResourceManager } from '../common/resource-manager'

const { Text } = Typography

interface InspectionFormValues {
  engineer: string
  onSite: boolean
  note: string
}

/** Giai đoạn đang chờ Giám sát xác nhận — mỗi dự án chỉ có tối đa một. */
function activeStage(project: CmsSupervisionProject): CmsSupervisionStage | null {
  return project.stages.find((stage) => stage.status === 'inProgress') ?? null
}

function event(actor: CmsStageEvent['actor'], text: string, at: string, milestone = true): CmsStageEvent {
  return { id: `${Date.now()}-${actor}-${text.length}`, at, actor, text, milestone }
}

/**
 * GIÁM SÁT THI CÔNG — màn của kỹ sư Giám sát SAVICO (R5).
 *
 * R5 nói giai đoạn chỉ KHÓA khi Giám sát xác nhận, và sau khi khóa mọi thay đổi
 * phải đi qua Yêu cầu sửa đổi. Bảng điều khiển của khách (S20–S23) dựng sẵn cả
 * hai nhánh đó, nhưng phía Giám sát thì chưa có chỗ bấm — nên trong bản demo
 * giai đoạn "Đang thực hiện" đứng nguyên mãi và không giai đoạn nào sang được
 * giai đoạn kế.
 *
 * Xác nhận một giai đoạn làm ba việc cùng lúc, vì trong thực tế chúng là một:
 * ghi kết quả kiểm tra và khóa giai đoạn, mở giai đoạn kế tiếp, và ghi mốc vào
 * lịch sử. Tách ra thành ba nút thì sớm muộn cũng có dự án khóa giai đoạn 3 mà
 * giai đoạn 4 vẫn "Sắp tới".
 *
 * `inspectionsUsed` chỉ tăng khi kỹ sư CÓ tới công trình: con số trên thẻ dự án
 * là "lượt kiểm tra hiện trường" của gói, xét hồ sơ từ xa không tiêu lượt nào.
 */
export function InspectionManager() {
  const t = useTranslations('admin')
  const tStage = useTranslations('supervision.stages')
  const tTier = useTranslations('supervision.tierAlias')
  const { message } = App.useApp()
  const save = useSaveAdminItem('supervisionProjects')

  const [form] = Form.useForm<InspectionFormValues>()
  const [target, setTarget] = useState<CmsSupervisionProject | null>(null)

  const stage = target ? activeStage(target) : null

  function open(project: CmsSupervisionProject) {
    const current = activeStage(project)
    if (!current) return
    setTarget(project)
    form.setFieldsValue({ engineer: project.engineer, onSite: true, note: '' })
  }

  async function confirm() {
    if (!target || !stage) return
    const values = await form.validateFields()
    const at = new Date().toISOString()

    const stages = target.stages.map<CmsSupervisionStage>((item) => {
      if (item.key === stage.key) {
        return {
          ...item,
          status: 'confirmed',
          // Khách chưa bấm hoàn thành thì lấy luôn thời điểm xác nhận làm ngày
          // kết thúc thực tế — giai đoạn đã khóa mà không có ngày kết thúc sẽ
          // hiện "đang chạy" trên dòng thời gian của S20.
          actualEnd: item.actualEnd ?? at,
          inspection: { confirmedAt: at, engineer: values.engineer, onSite: values.onSite, note: values.note },
          history: [
            ...item.history,
            event('GS', `Giám sát xác nhận giai đoạn ${item.index} – hồ sơ khóa ở ${item.version}`, at)
          ]
        }
      }

      // Giai đoạn kế tiếp mở ra ngay: xác nhận xong mà còn phải vào sửa tay thì
      // trước sau cũng có dự án đứng im giữa hai giai đoạn.
      if (item.index === stage.index + 1 && item.status === 'upcoming') {
        return {
          ...item,
          status: 'inProgress',
          actualStart: item.actualStart ?? at,
          history: [...item.history, event('SYS', `Bắt đầu giai đoạn ${item.index}`, at)]
        }
      }

      return item
    })

    await save.mutateAsync({
      ...target,
      stages,
      inspectionsUsed: values.onSite
        ? Math.min(target.inspectionsUsed + 1, target.inspectionsTotal)
        : target.inspectionsUsed
    })

    message.success(t('inspections.confirmedToast', { stage: tStage(stage.key) }))
    setTarget(null)
  }

  return (
    <>
      <ResourceManager
        collection='supervisionProjects'
        title={t('nav.inspections')}
        description={t('inspections.description')}
        allowDelete={false}
        allowEdit={false}
        searchText={(item) => `${item.id} ${item.projectName} ${item.engineer} ${item.packageCode}`}
        columns={[
          {
            title: t('inspections.project'),
            dataIndex: 'projectName',
            render: (_, record) => (
              <div style={{ minWidth: 0 }}>
                <Text strong style={{ display: 'block' }}>
                  {record.projectName}
                </Text>
                <Text type='secondary' style={{ fontSize: 12 }}>
                  {record.id} · {record.packageCode}
                </Text>
              </div>
            )
          },
          {
            title: t('inspections.package'),
            dataIndex: 'packageTier',
            width: 140,
            render: (tier: CmsSupervisionProject['packageTier']) => <Tag color='blue'>{tTier(tier)}</Tag>
          },
          {
            title: t('inspections.engineer'),
            dataIndex: 'engineer',
            width: 190
          },
          {
            title: t('inspections.currentStage'),
            key: 'stage',
            width: 260,
            render: (_, record) => {
              const current = activeStage(record)
              if (!current) return <Tag color='green'>{t('inspections.allConfirmed')}</Tag>
              return (
                <div style={{ minWidth: 0 }}>
                  <Text style={{ display: 'block' }}>{tStage(current.key)}</Text>
                  <Text type='secondary' style={{ fontSize: 12 }}>
                    {t('inspections.stageOf', { index: current.index, total: record.stages.length })} ·{' '}
                    {current.actualEnd ? t('inspections.readyToConfirm') : t('inspections.pendingUpload')}
                  </Text>
                </div>
              )
            }
          },
          {
            title: t('inspections.visits'),
            key: 'visits',
            width: 110,
            render: (_, record) => (
              <Text>
                {record.inspectionsUsed}/{record.inspectionsTotal}
              </Text>
            )
          },
          {
            title: t('table.actions'),
            key: 'confirm',
            width: 200,
            render: (_, record) =>
              activeStage(record) ? (
                <Button size='small' type='primary' icon={<SafetyCertificateOutlined />} onClick={() => open(record)}>
                  {t('inspections.confirm')}
                </Button>
              ) : (
                <Text type='secondary'>—</Text>
              )
          }
        ]}
        renderForm={() => null}
      />

      <Modal
        open={Boolean(target)}
        title={stage ? t('inspections.confirmTitle', { stage: tStage(stage.key) }) : ''}
        okText={t('inspections.confirm')}
        cancelText={t('actions.cancel')}
        confirmLoading={save.isPending}
        onOk={confirm}
        onCancel={() => setTarget(null)}
        destroyOnHidden
      >
        {stage && !stage.actualEnd ? (
          <Alert
            type='warning'
            showIcon
            style={{ marginBottom: 16 }}
            message={t('inspections.pendingUpload')}
            description={t('inspections.pendingUploadBody')}
          />
        ) : null}

        <Form form={form} layout='vertical' requiredMark={false}>
          <Form.Item
            name='engineer'
            label={t('inspections.engineerLabel')}
            rules={[{ required: true, message: t('inspections.engineerRequired') }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name='onSite'
            label={t('inspections.onSiteLabel')}
            valuePropName='checked'
            extra={t('inspections.onSiteHint')}
          >
            <Switch />
          </Form.Item>

          <Form.Item
            name='note'
            label={t('inspections.noteLabel')}
            rules={[{ required: true, message: t('inspections.noteRequired') }]}
          >
            <Input.TextArea rows={3} maxLength={500} placeholder={t('inspections.notePlaceholder')} />
          </Form.Item>
        </Form>

        <Text type='secondary' style={{ fontSize: 12 }}>
          {t('inspections.lockNote')}
        </Text>
      </Modal>
    </>
  )
}
