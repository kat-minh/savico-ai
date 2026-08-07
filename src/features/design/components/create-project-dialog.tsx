'use client'

import { useMemo } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'

import { Button } from '@/shared/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/shared/components/ui/form'
import { Input } from '@/shared/components/ui/input'
import { Textarea } from '@/shared/components/ui/textarea'
import { useCreateProject } from '../hooks/use-projects'
import {
  createProjectSchema,
  PROJECT_DESCRIPTION_MAX_LENGTH,
  PROJECT_NAME_MAX_LENGTH,
  type CreateProjectFormValues
} from '../schemas/create-project.schema'
import { useDesignStore } from '../store/design.store'
import { FieldLabel } from './field-label'

/**
 * Cửa sổ Tạo dự án (mục III.1) — hiện trước Bước 1.
 *
 * Mở từ nút "Tạo dự án mới" trên thanh công cụ / trang chủ, hoặc khi vào mục
 * Thiết kế & Dự toán mà chưa có dự án nào đang mở. Tạo xong → sinh Project ID
 * và mở ngay màn hình Bước 1.
 */
export function CreateProjectDialog() {
  const t = useTranslations('design.createProject')
  const tv = useTranslations('validation')
  const tCommon = useTranslations('common')

  const open = useDesignStore((s) => s.isCreateDialogOpen)
  const close = useDesignStore((s) => s.closeCreateDialog)
  const createProject = useCreateProject()

  const schema = useMemo(
    () =>
      createProjectSchema({
        required: tv('required'),
        maxLength: tv('maxLength', { max: PROJECT_NAME_MAX_LENGTH })
      }),
    [tv]
  )

  const form = useForm<CreateProjectFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', description: '' }
  })

  function onSubmit(values: CreateProjectFormValues) {
    createProject.mutate({ name: values.name, description: values.description || undefined })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          close()
          form.reset()
        }
      }}
    >
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{t('subtitle')}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            <FormField
              control={form.control}
              name='name'
              render={({ field }) => (
                <FormItem>
                  <FieldLabel htmlFor='project-name' hint={t('nameHint')} required>
                    {t('nameLabel')}
                  </FieldLabel>
                  <FormControl>
                    <Input
                      id='project-name'
                      placeholder={t('namePlaceholder')}
                      maxLength={PROJECT_NAME_MAX_LENGTH}
                      // Nếu không chỉ định, Radix focus phần tử focusable đầu
                      // tiên là nút (i) và tooltip bật sẵn đè lên tiêu đề.
                      autoFocus
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='description'
              render={({ field }) => (
                <FormItem>
                  <FieldLabel htmlFor='project-description' hint={t('descriptionHint')}>
                    {t('descriptionLabel')}
                  </FieldLabel>
                  <FormControl>
                    <Textarea
                      id='project-description'
                      rows={3}
                      placeholder={t('descriptionPlaceholder')}
                      maxLength={PROJECT_DESCRIPTION_MAX_LENGTH}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Hình 03: hai nút bằng nhau, chia đôi bề ngang — "Tạo dự án" là
                nút chính bên trái, "Hủy" viền nhạt bên phải. */}
            <div className='grid grid-cols-2 gap-3 pt-1'>
              <Button type='submit' size='lg' disabled={createProject.isPending}>
                {createProject.isPending ? <Loader2 className='size-4 animate-spin' /> : null}
                {t('submit')}
              </Button>
              <Button type='button' size='lg' variant='outline' onClick={close}>
                {tCommon('cancel')}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
