'use client'

import { useTranslations } from 'next-intl'

import { cmsText, useCmsDocument } from '@/shared/cms'

/** A section of a legal document as stored in translation messages. */
interface LegalSection {
  title: string
  body: string
}

/**
 * Renders a legal document (Terms / Privacy).
 *
 * Nội dung ưu tiên bản admin soạn trong kho `shared/cms` — Bên A gửi bản chính
 * thức trước go-live (Q&A §8.2) nên trang này phải sửa được không cần deploy.
 * Kho rỗng thì rơi về `messages/*.json` như trước, nên bản tiếng Anh vẫn nguyên.
 */
export function LegalPage({ namespace }: { namespace: 'terms' | 'privacy' }) {
  const t = useTranslations(`legal.${namespace}`)
  const fallbackSections = t.raw('sections') as LegalSection[]
  const page = useCmsDocument(namespace === 'terms' ? 'termsPage' : 'privacyPage')

  const sections = page.sections.length
    ? page.sections.map((section) => ({ title: section.heading, body: section.body }))
    : fallbackSections

  return (
    <article className='mx-auto w-full max-w-3xl px-4 py-16 lg:px-8 lg:py-24'>
      <h1 className='text-3xl font-bold tracking-tight'>{cmsText(page.title, t('title'))}</h1>
      <p className='text-muted-foreground mt-2 text-sm'>{cmsText(page.updatedNote, t('updated'))}</p>
      <p className='text-muted-foreground mt-6 leading-relaxed'>{cmsText(page.intro, t('intro'))}</p>

      <div className='mt-10 space-y-8'>
        {sections.map((section, i) => (
          <section key={i}>
            <h2 className='text-lg font-semibold'>{section.title}</h2>
            <p className='text-muted-foreground mt-2 leading-relaxed'>{section.body}</p>
          </section>
        ))}
      </div>
    </article>
  )
}
