'use client'

import { SearchOutlined, UndoOutlined } from '@ant-design/icons'
import { App, Badge, Button, Card, Collapse, Empty, Image, Input, Popconfirm, Space, Switch, Typography } from 'antd'
import { useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'

import { useAdminDocument, useSaveAdminDocument } from '../../hooks/use-admin-data'
import { useUnsavedGuard } from '../../hooks/use-unsaved-guard'
import { AdminPage } from '../common/admin-page'
import { ContentLocaleBanner } from '../common/content-locale-banner'

const { Text, Paragraph } = Typography

/** Một ô biên tập: khóa trong kho + nhãn dễ đọc + giá trị gốc để đối chiếu. */
export interface OverrideRow {
  /** Khóa lưu trong tài liệu ghi đè (khóa dịch, hoặc khóa trong sổ ảnh). */
  key: string
  /**
   * Ô chữ hay ô ảnh. Chữ và ảnh nằm CHUNG một khối theo đúng vị trí trên trang
   * — người vận hành không phải biết chúng lưu ở hai kho khác nhau; lúc Lưu màn
   * tự tách theo `kind`.
   */
  kind?: 'text' | 'image'
  /** Nhãn hiện cho người vận hành. Bỏ trống thì hiện luôn khóa. */
  label?: string
  /** Giá trị mặc định khi chưa ghi đè — chữ trong `messages/`, hoặc ảnh seed. */
  defaultValue: string
  /** Nhiều dòng (mô tả, đoạn giới thiệu) thay vì một dòng. */
  multiline?: boolean
}

/** Một khối trong màn — tương ứng một trang của site, hoặc một nhóm ảnh. */
export interface OverrideGroup {
  key: string
  title: string
  description?: string
  rows: readonly OverrideRow[]
}

/**
 * Màn biên tập cho các tài liệu dạng "khóa → giá trị ghi đè" (`uiStrings`,
 * `uiAssets`).
 *
 * Ba màn dùng chung một khung này — Chữ trên trang, Chuỗi giao diện, Hình ảnh
 * site — vì chúng chỉ khác nhau ở NGUỒN DÒNG và cách hiển thị một ô. Gộp lại thì
 * hành vi lưu / hoàn nguyên / đánh dấu "đã sửa" giống hệt nhau ở cả ba.
 *
 * Kho chỉ giữ khóa ĐÃ sửa: xóa trắng một ô là bỏ ghi đè, chữ quay về bản dịch
 * gốc. Nhờ vậy thêm chuỗi mới trong code vẫn hiện ngay mà không cần đụng kho.
 */
export function OverrideEditor({
  title,
  description,
  groups,
  searchable,
  advancedGroups = []
}: {
  title: string
  description?: string
  groups: readonly OverrideGroup[]
  searchable?: boolean
  /**
   * Chữ lặt vặt của trang (nhãn bộ lọc, thông báo phụ…) — gấp vào một mục
   * "Nâng cao" đóng sẵn ở cuối, để màn mặc định chỉ còn trường đáng sửa.
   */
  advancedGroups?: readonly OverrideGroup[]
}) {
  const t = useTranslations('admin')
  const { message } = App.useApp()

  /**
   * Chữ nằm ở kho `uiStrings`, ảnh ở kho `uiAssets`. Màn đọc GỘP cả hai vào một
   * bản nháp (khóa hai bên không bao giờ đụng nhau: khóa dịch ≠ khóa sổ ảnh) và
   * khi Lưu thì tách lại theo `kind` của từng ô — một nút Lưu cho cả chữ lẫn ảnh.
   */
  const strings = useAdminDocument('uiStrings')
  const assets = useAdminDocument('uiAssets')
  const saveStrings = useSaveAdminDocument('uiStrings')
  const saveAssets = useSaveAdminDocument('uiAssets')

  const data = useMemo(
    () =>
      strings.data === undefined && assets.data === undefined
        ? undefined
        : { ...(strings.data ?? {}), ...(assets.data ?? {}) },
    [strings.data, assets.data]
  )
  const isPending = strings.isPending || assets.isPending

  /** Tra `kind` của một khóa lúc Lưu. */
  const kindByKey = useMemo(() => {
    const map = new Map<string, 'text' | 'image'>()
    for (const group of [...groups, ...advancedGroups]) {
      for (const row of group.rows) map.set(row.key, row.kind ?? 'text')
    }
    return map
  }, [groups, advancedGroups])

  const [draft, setDraft] = useState<Record<string, string>>({})
  const [dirty, setDirty] = useState(false)
  const [query, setQuery] = useState('')
  const [onlyEdited, setOnlyEdited] = useState(false)

  // Nạp lại khi dữ liệu tới, và khi đổi ngôn ngữ nội dung trên thanh trên.
  // Chỉnh ngay trong lúc render thay vì trong effect: đây thuần là state của
  // React, nhét vào effect chỉ khiến React render thừa một lượt mỗi lần dữ liệu
  // tới (xem quy tắc `react-hooks/set-state-in-effect`).
  const [syncedData, setSyncedData] = useState(data)
  if (data !== syncedData) {
    setSyncedData(data)
    setDraft(data ?? {})
    setDirty(false)
  }

  useUnsavedGuard(dirty)

  function setValue(key: string, value: string) {
    setDraft((current) => ({ ...current, [key]: value }))
    setDirty(true)
  }

  /** Bỏ ghi đè một khóa — về đúng bản gốc. */
  function clearValue(key: string) {
    setDraft((current) => {
      const next = { ...current }
      delete next[key]
      return next
    })
    setDirty(true)
  }

  /**
   * Khóa THUỘC màn này.
   *
   * Kho `uiStrings` là MỘT tài liệu dùng chung cho mọi trang, nên nếu đếm thẳng
   * trên `draft` thì đứng ở trang Gói đăng ký vẫn thấy "đã sửa 1 ô" của trang
   * khác — và tệ hơn, nút "Bỏ hết ghi đè" sẽ xóa sạch ghi đè của cả site chứ
   * không riêng trang đang mở.
   */
  const scopedKeys = useMemo(
    () => new Set([...groups, ...advancedGroups].flatMap((group) => group.rows.map((row) => row.key))),
    [groups, advancedGroups]
  )

  const editedCount = useMemo(
    () => Object.entries(draft).filter(([key, value]) => scopedKeys.has(key) && value.trim()).length,
    [draft, scopedKeys]
  )

  /** Bỏ ghi đè của riêng màn này; ghi đè của các trang khác giữ nguyên. */
  function clearScope() {
    setDraft((current) => Object.fromEntries(Object.entries(current).filter(([key]) => !scopedKeys.has(key))))
    setDirty(true)
  }

  const filterGroups = (source: readonly OverrideGroup[], needle: string) =>
    source
      .map((group) => ({
        ...group,
        rows: group.rows.filter((row) => {
          if (onlyEdited && !draft[row.key]?.trim()) return false
          if (!needle) return true
          return (
            row.key.toLowerCase().includes(needle) ||
            row.label?.toLowerCase().includes(needle) ||
            row.defaultValue.toLowerCase().includes(needle) ||
            draft[row.key]?.toLowerCase().includes(needle)
          )
        })
      }))
      .filter((group) => group.rows.length > 0)

  const visibleGroups = useMemo(
    () => filterGroups(groups, query.trim().toLowerCase()),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- filterGroups chỉ đọc draft/onlyEdited.
    [groups, draft, query, onlyEdited]
  )
  const visibleAdvanced = useMemo(
    () => filterGroups(advancedGroups, query.trim().toLowerCase()),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- như trên.
    [advancedGroups, draft, query, onlyEdited]
  )

  async function submit() {
    // Chỉ lưu khóa còn giá trị: ô xóa trắng = bỏ ghi đè, không phải ghi chuỗi rỗng.
    const cleaned = Object.entries(draft)
      .map(([key, value]) => [key, value.trim()] as const)
      .filter(([, value]) => value)

    const textEntries = cleaned.filter(([key]) => (kindByKey.get(key) ?? 'text') === 'text')
    const imageEntries = cleaned.filter(([key]) => kindByKey.get(key) === 'image')

    await Promise.all([
      saveStrings.mutateAsync(Object.fromEntries(textEntries)),
      saveAssets.mutateAsync(Object.fromEntries(imageEntries))
    ])
    setDirty(false)
    message.success(t('feedback.saved'))
  }

  function renderRows(group: OverrideGroup) {
    return (
      <>
        {group.description ? (
          <Paragraph type='secondary' style={{ marginTop: -4 }}>
            {group.description}
          </Paragraph>
        ) : null}
        <div className='flex flex-col gap-4'>
          {group.rows.map((row) => (
            <OverrideField
              key={row.key}
              row={row}
              value={draft[row.key] ?? ''}
              onChange={(value) => setValue(row.key, value)}
              onClear={() => clearValue(row.key)}
            />
          ))}
        </div>
      </>
    )
  }

  return (
    <AdminPage
      title={title}
      description={description}
      sticky
      actions={
        <Space>
          <Text type='secondary' style={{ whiteSpace: 'nowrap' }}>
            {t('override.editedCount', { count: editedCount })}
          </Text>
          <Popconfirm
            title={t('override.resetAllTitle')}
            description={t('override.resetAllBody')}
            okText={t('actions.confirm')}
            okButtonProps={{ danger: true }}
            cancelText={t('actions.cancel')}
            disabled={editedCount === 0}
            onConfirm={clearScope}
          >
            <Button danger disabled={editedCount === 0}>
              {t('override.resetAll')}
            </Button>
          </Popconfirm>
          <Badge dot={dirty} offset={[-2, 4]}>
            <Button
              type='primary'
              loading={saveStrings.isPending || saveAssets.isPending}
              disabled={isPending}
              onClick={submit}
            >
              {dirty ? t('actions.saveDirty') : t('actions.save')}
            </Button>
          </Badge>
        </Space>
      }
    >
      <ContentLocaleBanner />

      {searchable ? (
        <Card size='small'>
          <Space wrap>
            <Input
              allowClear
              prefix={<SearchOutlined />}
              placeholder={t('override.searchPlaceholder')}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              style={{ width: 320 }}
            />
            <Space size={6}>
              <Switch size='small' checked={onlyEdited} onChange={setOnlyEdited} />
              <Text type='secondary'>{t('override.onlyEdited')}</Text>
            </Space>
          </Space>
        </Card>
      ) : null}

      {visibleGroups.length === 0 && visibleAdvanced.length === 0 ? (
        <Card>
          <Empty description={t('override.noMatch')} />
        </Card>
      ) : visibleGroups.length === 1 ? (
        // Một nhóm duy nhất thì thanh accordion chỉ là thêm một lớp phải bấm mở,
        // mà nhãn của nó lại lặp đúng tên tab bên trên. Hiện thẳng các ô.
        <Card>{renderRows(visibleGroups[0]!)}</Card>
      ) : visibleGroups.length > 0 ? (
        <Collapse
          // Các trường chọn lọc đều đáng thấy ngay — MỞ HẾT. Chỉ mục "Nâng cao"
          // bên dưới mới đóng sẵn.
          defaultActiveKey={visibleGroups.map((group) => group.key)}
          items={visibleGroups.map((group) => ({
            key: group.key,
            label: (
              <Space size={8}>
                <Text strong>{group.title}</Text>
                <Text type='secondary'>{t('override.rowCount', { count: group.rows.length })}</Text>
              </Space>
            ),
            children: renderRows(group)
          }))}
        />
      ) : null}

      {visibleAdvanced.length > 0 ? (
        <Collapse
          defaultActiveKey={[]}
          items={[
            {
              key: 'advanced',
              label: (
                <Space size={8}>
                  <Text type='secondary'>{t('workspace.advanced')}</Text>
                  <Text type='secondary'>
                    {t('override.rowCount', {
                      count: visibleAdvanced.reduce((total, group) => total + group.rows.length, 0)
                    })}
                  </Text>
                </Space>
              ),
              children: (
                <Collapse
                  ghost
                  items={visibleAdvanced.map((group) => ({
                    key: group.key,
                    label: (
                      <Space size={8}>
                        <Text strong>{group.title}</Text>
                        <Text type='secondary'>{t('override.rowCount', { count: group.rows.length })}</Text>
                      </Space>
                    ),
                    children: renderRows(group)
                  }))}
                />
              )
            }
          ]}
        />
      ) : null}
    </AdminPage>
  )
}

/**
 * Một ô biên tập — SỬA TRỰC TIẾP.
 *
 * Ô hiện sẵn chữ ĐANG chạy trên site (bản sửa nếu có, không thì bản gốc); gõ đè
 * lên là xong, như mọi CMS. Bản trước để ô TRỐNG với placeholder "để trống = giữ
 * nguyên" — cả trăm ô trống nhìn như chưa có dữ liệu, dev còn không hiểu.
 *
 * Nhãn là TÊN TRƯỜNG viết tay ("Nút Bắt đầu xem cẩm nang") lấy từ
 * `admin.fieldNames`; trường lặt vặt chưa đặt tên thì rơi về chữ gốc. Khóa dịch
 * vẫn để cạnh, cỡ nhỏ, cho ai cần đối chiếu code.
 */
function OverrideField({
  row,
  value,
  onChange,
  onClear
}: {
  row: OverrideRow
  value: string
  onChange: (value: string) => void
  onClear: () => void
}) {
  const t = useTranslations('admin')
  const variant = row.kind ?? 'text'
  const edited = Boolean(value.trim()) && value !== row.defaultValue
  const effective = value.trim() ? value : row.defaultValue

  const nameKey = `fieldNames.${row.key.replace(/[.-]/g, '_')}` as Parameters<typeof t.has>[0]
  const label = row.label ?? (t.has(nameKey) ? t(nameKey) : variant === 'image' ? row.key : row.defaultValue)
  const showKey = label !== row.key

  /** Gõ về đúng chữ gốc = bỏ ghi đè, không lưu một bản sao thừa. */
  const handleChange = (next: string) => {
    if (next === row.defaultValue) onClear()
    else onChange(next)
  }

  return (
    <div className='grid gap-1.5'>
      <div className='flex flex-wrap items-baseline gap-2'>
        <Text strong ellipsis={{ tooltip: label }} style={{ maxWidth: '48rem' }}>
          {label}
        </Text>
        {showKey ? (
          <Text type='secondary' style={{ fontSize: 12, fontFamily: 'var(--font-geist-mono), monospace' }}>
            {row.key}
          </Text>
        ) : null}
        {edited ? (
          <Button type='link' size='small' icon={<UndoOutlined />} onClick={onClear}>
            {t('override.revertField')}
          </Button>
        ) : null}
      </div>

      {variant === 'image' ? (
        <div className='flex items-center gap-3'>
          <Image
            src={effective}
            alt=''
            width={96}
            height={64}
            style={{ objectFit: 'cover', borderRadius: 8, background: 'var(--admin-placeholder)' }}
          />
          <Input
            value={value}
            placeholder={row.defaultValue}
            onChange={(event) => handleChange(event.target.value)}
            style={{ flex: 1 }}
          />
        </div>
      ) : row.multiline ? (
        <Input.TextArea
          value={effective}
          autoSize={{ minRows: 2, maxRows: 6 }}
          onChange={(event) => handleChange(event.target.value)}
        />
      ) : (
        <Input value={effective} onChange={(event) => handleChange(event.target.value)} />
      )}
    </div>
  )
}
