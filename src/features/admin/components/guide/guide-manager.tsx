'use client'

import { ExclamationCircleOutlined, LoadingOutlined, ReloadOutlined } from '@ant-design/icons'
import { Alert, App, Button, Descriptions, Form, Image, Input, Select, Space, Tag, Typography } from 'antd'
import type { FormInstance } from 'antd'
import dayjs from 'dayjs'
import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useRef, useState } from 'react'

import type { GuideVideo } from '@/shared/cms'
import { fetchYouTubeMeta, youTubeEmbedUrl, type YouTubeMetaError } from '../../api/youtube.api'
import { useAdminCollection, useSaveAdminItem } from '../../hooks/use-admin-data'
import { newAdminId } from '../../services/admin.service'
import { guideStepNumbers, parseYouTubeId } from '../../services/guide.service'
import { StatusSwitch } from '../common/field-kit'
import { ResourceManager } from '../common/resource-manager'

const { Text } = Typography

type FormValues = GuideVideo & { youtubeUrl?: string; metaFor?: string; metaError?: YouTubeMetaError }

function duration(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  return `${minutes}:${String(seconds % 60).padStart(2, '0')}`
}

function watchUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`
}

/**
 * CÁC BƯỚC HƯỚNG DẪN (epic GuideStepManagement).
 *
 * Mỗi bước là một video YouTube: admin nhập tiêu đề, link, mô tả, trạng thái;
 * thumbnail và thời lượng hệ thống tự lấy từ YouTube; số bước tự đánh theo thời
 * gian tạo tăng dần (xóa là tự đánh lại). Không lấy được thông tin video thì
 * không lưu. Chỉ bước Hiển thị và video còn phát nhúng được mới lên trang Hướng dẫn.
 */
export function GuideVideoManager() {
  const t = useTranslations('admin')
  const { message } = App.useApp()
  const { data: videos = [] } = useAdminCollection('guideVideos')
  const save = useSaveAdminItem('guideVideos')
  const steps = useMemo(() => guideStepNumbers(videos), [videos])

  /** Chuyển sang Hiển thị: kiểm tra lại video còn tồn tại và phát nhúng được (§5). */
  const switchStatus = async (item: GuideVideo) => {
    const next = item.status === 'hidden' ? 'visible' : 'hidden'
    if (next === 'visible' && item.youtubeId) {
      const problem = await fetchYouTubeMeta(item.youtubeId).then(
        () => null,
        (error: YouTubeMetaError) => error
      )
      if (problem) {
        if (problem !== 'failed') await save.mutateAsync({ ...item, unavailable: true })
        message.error(t(`guideSteps.metaErrors.${problem}`))
        return
      }
    }
    await save.mutateAsync({ ...item, status: next, unavailable: false })
  }

  return (
    <ResourceManager
      collection='guideVideos'
      title={t('nav.guideVideos')}
      description={t('guideSteps.description')}
      drawerWidth={720}
      searchText={(item) => item.title}
      createItem={(): GuideVideo => ({
        id: newAdminId('vid'),
        // Chủ đề là trường cũ của trang Hướng dẫn — không còn quản lý ở đây.
        topic: 'input',
        title: '',
        description: '',
        thumbnailUrl: '',
        videoUrl: '',
        durationSeconds: 0,
        status: 'hidden',
        createdAt: new Date().toISOString()
      })}
      toFormValues={(item) => ({
        ...item,
        youtubeUrl: item.youtubeId ? watchUrl(item.youtubeId) : '',
        metaFor: item.youtubeId
      })}
      fromFormValues={(values, current): GuideVideo => {
        const { youtubeUrl: _url, metaFor: _for, metaError: _error, ...rest } = values as unknown as FormValues
        return {
          ...current,
          ...rest,
          title: rest.title.trim(),
          description: rest.description.trim(),
          // Video vừa lấy được thông tin là video phát nhúng được.
          unavailable: rest.youtubeId !== current.youtubeId ? false : current.unavailable
        }
      }}
      validate={(next) => {
        if (!next.youtubeId || !next.durationSeconds) return t('guideSteps.metaRequired')
        const clash = videos.find((item) => item.id !== next.id && item.youtubeId === next.youtubeId)
        return clash ? t('guideSteps.duplicate', { step: steps.get(clash.id) ?? '?', title: clash.title }) : null
      }}
      deleteConfirm={(item) => (
        <Text>{t('guideSteps.deleteConfirm', { step: steps.get(item.id) ?? '?', title: item.title })}</Text>
      )}
      rowActions={(item) => (
        <StatusSwitch
          name={item.title}
          current={t(`guideSteps.status.${item.status ?? 'visible'}`)}
          next={t(`guideSteps.status.${item.status === 'hidden' ? 'visible' : 'hidden'}`)}
          onConfirm={() => switchStatus(item)}
        />
      )}
      renderView={(item) => <StepView video={item} step={steps.get(item.id) ?? 0} />}
      columns={[
        {
          title: t('guideSteps.step'),
          key: 'step',
          width: 80,
          defaultSortOrder: 'ascend',
          sorter: (a, b) => (steps.get(a.id) ?? 0) - (steps.get(b.id) ?? 0),
          render: (_, record) => <Text strong>{steps.get(record.id)}</Text>
        },
        {
          title: t('guideSteps.thumbnail'),
          dataIndex: 'thumbnailUrl',
          width: 120,
          render: (url: string) =>
            url ? (
              <Image src={url} alt='' width={96} height={54} style={{ objectFit: 'cover', borderRadius: 6 }} />
            ) : (
              <Text type='secondary'>—</Text>
            )
        },
        {
          title: t('guideSteps.title'),
          dataIndex: 'title',
          render: (_, record) => (
            <div style={{ minWidth: 0 }}>
              <Text strong style={{ display: 'block' }}>
                {record.title}
              </Text>
              <Text type='secondary' style={{ fontSize: 12 }} ellipsis={{ tooltip: record.description }}>
                {record.description}
              </Text>
            </div>
          )
        },
        {
          title: t('guideSteps.duration'),
          dataIndex: 'durationSeconds',
          width: 100,
          render: (seconds: number) => (seconds ? duration(seconds) : '—')
        },
        {
          title: t('guideSteps.statusLabel'),
          key: 'status',
          width: 170,
          render: (_, record) => (
            <Space size={4} wrap>
              <Tag color={record.status === 'hidden' ? 'default' : 'green'}>
                {t(`guideSteps.status.${record.status ?? 'visible'}`)}
              </Tag>
              {record.unavailable ? (
                <Tag color='red' icon={<ExclamationCircleOutlined />}>
                  {t('guideSteps.unavailable')}
                </Tag>
              ) : null}
            </Space>
          )
        },
        {
          title: t('guideSteps.createdAt'),
          dataIndex: 'createdAt',
          width: 150,
          render: (value?: string) => (value ? dayjs(value).format('DD/MM/YYYY HH:mm') : '—')
        }
      ]}
      renderForm={(form) => <StepFields form={form} />}
    />
  )
}

/** Trường của form Thêm / Cập nhật (§3, §4) — link đổi là lấy lại thông tin video. */
function StepFields({ form }: { form: FormInstance }) {
  const t = useTranslations('admin')
  const url = Form.useWatch('youtubeUrl', form) as string | undefined
  const metaFor = Form.useWatch('metaFor', form) as string | undefined
  const metaError = Form.useWatch('metaError', form) as YouTubeMetaError | undefined
  const thumbnail = Form.useWatch('thumbnailUrl', form) as string | undefined
  const seconds = Form.useWatch('durationSeconds', form) as number | undefined
  const [loadingFor, setLoadingFor] = useState<string | null>(null)
  const videoId = url ? parseYouTubeId(url) : null

  const load = (id: string) => {
    setLoadingFor(id)
    fetchYouTubeMeta(id)
      .then((meta) => {
        // Chỉ nhận kết quả nếu link vẫn là video này.
        if (parseYouTubeId(form.getFieldValue('youtubeUrl') ?? '') !== id) return
        form.setFieldsValue({ youtubeId: id, metaFor: id, metaError: undefined, ...meta })
      })
      .catch((error: YouTubeMetaError) => {
        if (parseYouTubeId(form.getFieldValue('youtubeUrl') ?? '') !== id) return
        // Lấy thất bại: giữ nguyên video cũ đã lưu, chỉ báo lỗi (§4).
        form.setFieldsValue({ metaError: error })
      })
      .finally(() => setLoadingFor((current) => (current === id ? null : current)))
  }

  // Gõ / dán link xong một nhịp là tự lấy thông tin video mới.
  const debounce = useRef<ReturnType<typeof setTimeout>>(undefined)
  useEffect(() => () => clearTimeout(debounce.current), [])
  const onUrlChange = (value: string) => {
    form.setFieldValue('metaError', undefined)
    clearTimeout(debounce.current)
    const id = parseYouTubeId(value)
    if (!id || id === form.getFieldValue('metaFor')) return
    debounce.current = setTimeout(() => load(id), 500)
  }

  const pendingNew = videoId !== null && videoId !== metaFor

  return (
    <>
      <Form.Item
        name='title'
        label={t('guideSteps.title')}
        rules={[
          { required: true, whitespace: true, message: t('fields.requiredMessage') },
          { max: 100, message: t('fields.maxLength', { max: 100 }) }
        ]}
      >
        <Input maxLength={100} showCount />
      </Form.Item>
      <Form.Item
        name='youtubeUrl'
        label={t('guideSteps.youtubeUrl')}
        extra={t('guideSteps.youtubeHint')}
        rules={[
          { required: true, whitespace: true, message: t('fields.requiredMessage') },
          {
            validator: (_, value?: string) =>
              !value || parseYouTubeId(value)
                ? Promise.resolve()
                : Promise.reject(new Error(t('guideSteps.invalidUrl')))
          }
        ]}
      >
        <Input placeholder='https://www.youtube.com/watch?v=…' onChange={(event) => onUrlChange(event.target.value)} />
      </Form.Item>

      <div style={{ marginBottom: 16 }}>
        {loadingFor && loadingFor === videoId ? (
          <Text type='secondary'>
            <LoadingOutlined /> {t('guideSteps.loadingMeta')}
          </Text>
        ) : metaError && pendingNew ? (
          <Alert
            type='error'
            showIcon
            title={t(`guideSteps.metaErrors.${metaError}`)}
            action={
              videoId ? (
                <Button size='small' icon={<ReloadOutlined />} onClick={() => load(videoId)}>
                  {t('guideSteps.retry')}
                </Button>
              ) : null
            }
          />
        ) : thumbnail && !pendingNew ? (
          <Space align='start'>
            <Image src={thumbnail} alt='' width={160} height={90} style={{ objectFit: 'cover', borderRadius: 6 }} />
            <Text type='secondary'>{t('guideSteps.metaLine', { duration: duration(seconds ?? 0) })}</Text>
          </Space>
        ) : null}
      </div>

      <Form.Item
        name='description'
        label={t('guideSteps.descriptionLabel')}
        rules={[
          { required: true, whitespace: true, message: t('fields.requiredMessage') },
          { max: 1000, message: t('fields.maxLength', { max: 1000 }) }
        ]}
      >
        <Input.TextArea rows={4} maxLength={1000} showCount />
      </Form.Item>
      <Form.Item name='status' label={t('guideSteps.statusLabel')}>
        <Select
          style={{ maxWidth: 220 }}
          options={(['visible', 'hidden'] as const).map((value) => ({
            value,
            label: t(`guideSteps.status.${value}`)
          }))}
        />
      </Form.Item>
      {/* Hệ thống điền — admin không nhập (§3). */}
      {(['youtubeId', 'thumbnailUrl', 'durationSeconds', 'metaFor', 'metaError'] as const).map((name) => (
        <Form.Item key={name} name={name} hidden>
          <Input />
        </Form.Item>
      ))}
    </>
  )
}

/** Chi tiết bước (§2) — mở ra là kiểm tra lại video còn phát nhúng được không. */
function StepView({ video, step }: { video: GuideVideo; step: number }) {
  const t = useTranslations('admin')
  const save = useSaveAdminItem('guideVideos')
  const [problem, setProblem] = useState<YouTubeMetaError | null>(null)

  useEffect(() => {
    if (!video.youtubeId) return
    let alive = true
    fetchYouTubeMeta(video.youtubeId).then(
      () => {
        if (alive && video.unavailable) save.mutate({ ...video, unavailable: false })
      },
      (error: YouTubeMetaError) => {
        if (!alive) return
        setProblem(error)
        // Video bị gỡ / chặn nhúng: ngừng hiện công khai và cảnh báo admin (§8).
        if (error !== 'failed' && !video.unavailable) save.mutate({ ...video, unavailable: true })
      }
    )
    return () => {
      alive = false
    }
    // Kiểm tra một lần mỗi khi mở chi tiết một video.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [video.id, video.youtubeId])

  return (
    <Space orientation='vertical' size={16} style={{ width: '100%' }}>
      {video.youtubeId && !problem ? (
        <div style={{ position: 'relative', paddingTop: '56.25%', borderRadius: 8, overflow: 'hidden' }}>
          <iframe
            src={youTubeEmbedUrl(video.youtubeId)}
            title={video.title}
            allow='accelerometer; encrypted-media; gyroscope; picture-in-picture'
            allowFullScreen
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
          />
        </div>
      ) : (
        <Alert
          type='warning'
          showIcon
          title={t(`guideSteps.metaErrors.${problem ?? 'unavailable'}`)}
          description={t('guideSteps.cannotPlay')}
        />
      )}
      <Descriptions
        size='small'
        column={1}
        bordered
        items={[
          { key: 'step', label: t('guideSteps.step'), children: step },
          { key: 'title', label: t('guideSteps.title'), children: video.title },
          { key: 'description', label: t('guideSteps.descriptionLabel'), children: video.description },
          {
            key: 'url',
            label: t('guideSteps.youtubeUrl'),
            children: video.youtubeId ? (
              <a href={watchUrl(video.youtubeId)} target='_blank' rel='noreferrer'>
                {watchUrl(video.youtubeId)}
              </a>
            ) : (
              '—'
            )
          },
          {
            key: 'thumb',
            label: t('guideSteps.thumbnail'),
            children: video.thumbnailUrl ? <Image src={video.thumbnailUrl} alt='' width={160} /> : '—'
          },
          {
            key: 'duration',
            label: t('guideSteps.duration'),
            children: video.durationSeconds ? duration(video.durationSeconds) : '—'
          },
          {
            key: 'status',
            label: t('guideSteps.statusLabel'),
            children: t(`guideSteps.status.${video.status ?? 'visible'}`)
          },
          {
            key: 'created',
            label: t('guideSteps.createdAt'),
            children: video.createdAt ? dayjs(video.createdAt).format('DD/MM/YYYY HH:mm') : '—'
          }
        ]}
      />
    </Space>
  )
}
