'use client'

import {
  BoldOutlined,
  ItalicOutlined,
  LinkOutlined,
  OrderedListOutlined,
  PictureOutlined,
  UnderlineOutlined,
  UnorderedListOutlined
} from '@ant-design/icons'
import { Button, Input, Segmented, Space, Tooltip, Typography } from 'antd'
import type { TextAreaRef } from 'antd/es/input/TextArea'
import { useTranslations } from 'next-intl'
import { useRef, useState, type ReactNode } from 'react'

const { Text } = Typography

/** Thẻ bọc quanh đoạn đang chọn — đúng allowlist backend giữ lại (TDD-NEWS-001). */
type ToolKey =
  | 'bold'
  | 'italic'
  | 'underline'
  | 'heading2'
  | 'heading3'
  | 'paragraph'
  | 'bulletList'
  | 'numberList'
  | 'quote'
  | 'link'
  | 'image'

const WRAPS: { key: ToolKey; open: string; close: string; icon: ReactNode }[] = [
  { key: 'bold', open: '<strong>', close: '</strong>', icon: <BoldOutlined /> },
  { key: 'italic', open: '<em>', close: '</em>', icon: <ItalicOutlined /> },
  { key: 'underline', open: '<u>', close: '</u>', icon: <UnderlineOutlined /> },
  { key: 'heading2', open: '<h2>', close: '</h2>', icon: 'H2' },
  { key: 'heading3', open: '<h3>', close: '</h3>', icon: 'H3' },
  { key: 'paragraph', open: '<p>', close: '</p>', icon: 'P' },
  { key: 'bulletList', open: '<ul>\n  <li>', close: '</li>\n</ul>', icon: <UnorderedListOutlined /> },
  { key: 'numberList', open: '<ol>\n  <li>', close: '</li>\n</ol>', icon: <OrderedListOutlined /> },
  { key: 'quote', open: '<blockquote>', close: '</blockquote>', icon: '“ ”' },
  { key: 'link', open: '<a href="https://">', close: '</a>', icon: <LinkOutlined /> },
  { key: 'image', open: '<img src="https://', close: '" alt="" />', icon: <PictureOutlined /> }
]

const PREVIEW_STYLE =
  'body{font:15px/1.6 system-ui,sans-serif;color:#1f1f1f;margin:16px}img{max-width:100%;height:auto;border-radius:6px}blockquote{border-left:3px solid #ccc;margin:0;padding-left:12px;color:#555}'

/**
 * Ô nội dung bài viết dạng HTML (`contentHtml`). API không có upload nên ảnh
 * trong bài là URL https có sẵn trên kho ảnh — chèn bằng nút ảnh rồi dán link.
 * Backend làm sạch HTML theo allowlist khi lưu; bản xem trước chạy trong iframe
 * `sandbox` rỗng nên script của bản nháp không chạy được.
 *
 * Dùng như control của `Form.Item` (nhận `value` / `onChange`).
 */
export function HtmlContentEditor({
  value,
  onChange,
  maxLength
}: {
  value?: string
  onChange?: (value: string) => void
  maxLength: number
}) {
  const t = useTranslations('admin.newsArticles.editor')
  const ref = useRef<TextAreaRef>(null)
  const [mode, setMode] = useState<'edit' | 'preview'>('edit')
  const html = value ?? ''

  function wrap(open: string, close: string) {
    const area = ref.current?.resizableTextArea?.textArea
    const start = area?.selectionStart ?? html.length
    const end = area?.selectionEnd ?? html.length
    const next = `${html.slice(0, start)}${open}${html.slice(start, end)}${close}${html.slice(end)}`
    onChange?.(next)
    requestAnimationFrame(() => {
      area?.focus()
      area?.setSelectionRange(start + open.length, end + open.length)
    })
  }

  return (
    <Space orientation='vertical' size={8} style={{ width: '100%' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 4 }}>
        <Segmented
          size='small'
          value={mode}
          onChange={setMode}
          options={[
            { value: 'edit', label: t('edit') },
            { value: 'preview', label: t('preview') }
          ]}
        />
        {mode === 'edit'
          ? WRAPS.map((item) => (
              <Tooltip key={item.key} title={t(`tools.${item.key}`)}>
                <Button size='small' aria-label={t(`tools.${item.key}`)} onClick={() => wrap(item.open, item.close)}>
                  {item.icon}
                </Button>
              </Tooltip>
            ))
          : null}
      </div>
      {mode === 'edit' ? (
        <Input.TextArea
          ref={ref}
          value={html}
          onChange={(event) => onChange?.(event.target.value)}
          autoSize={{ minRows: 12, maxRows: 28 }}
          style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 13 }}
          placeholder='<p>…</p>'
        />
      ) : (
        <HtmlPreview html={html} title={t('preview')} />
      )}
      <Text type={html.length > maxLength ? 'danger' : 'secondary'} style={{ fontSize: 12 }}>
        {t('count', { count: html.length.toLocaleString(), max: maxLength.toLocaleString() })} · {t('hint')}
      </Text>
    </Space>
  )
}

/** Xem trước HTML trong iframe `sandbox` rỗng — không chạy script, không đọc cookie. */
export function HtmlPreview({ html, title, height = 420 }: { html: string; title: string; height?: number }) {
  return (
    <iframe
      title={title}
      sandbox=''
      srcDoc={`<!doctype html><html><head><meta charset="utf-8"><style>${PREVIEW_STYLE}</style></head><body>${html}</body></html>`}
      style={{ width: '100%', height, border: '1px solid var(--admin-border)', borderRadius: 8 }}
    />
  )
}
