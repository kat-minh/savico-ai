import { useTranslations } from 'next-intl'

/** A section of a legal document. */
interface LegalSection {
  title: string
  body: string
}

/**
 * Renders a legal document (Terms / Privacy) from translation messages.
 * `namespace` points at a `legal.*` block: `{ title, updated, intro, sections[] }`.
 * Final copy is provided by SAVICO before go-live (stakeholder Q&A §8.2).
 */
export function LegalPage({ namespace }: { namespace: 'terms' | 'privacy' }) {
  const t = useTranslations(`legal.${namespace}`)
  const sections = t.raw('sections') as LegalSection[]

  return (
    <article className='mx-auto w-full max-w-3xl px-4 py-16 lg:px-8 lg:py-24'>
      <h1 className='text-3xl font-bold tracking-tight'>{t('title')}</h1>
      <p className='text-muted-foreground mt-2 text-sm'>{t('updated')}</p>
      <p className='text-muted-foreground mt-6 leading-relaxed'>{t('intro')}</p>

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
