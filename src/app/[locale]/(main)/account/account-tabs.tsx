'use client'

import { Heart, LayoutGrid } from 'lucide-react'
import type { ReactNode } from 'react'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs'

interface AccountTabsProps {
  projects: { label: string; description: string; content: ReactNode }
  favorites: { label: string; description: string; content: ReactNode }
}

/**
 * "Dự án của tôi" và "Dự án yêu thích" là hai tab của cùng một khu vực (mục IV,
 * khu vực 2 và 3).
 *
 * Xếp chồng dọc thì phần yêu thích nằm hẳn dưới đáy trang, ít ai cuộn tới; hai
 * danh sách này lại cùng bản chất "những gì tôi đã lưu" nên đặt cạnh nhau.
 * Server component không dùng được state nên phần tab nằm ở client component
 * này, nội dung hai tab vẫn do lớp page dựng và truyền vào.
 */
export function AccountTabs({ projects, favorites }: AccountTabsProps) {
  return (
    <Tabs defaultValue='projects'>
      <TabsList>
        <TabsTrigger value='projects'>
          <LayoutGrid className='size-4' />
          {projects.label}
        </TabsTrigger>
        <TabsTrigger value='favorites'>
          <Heart className='size-4' />
          {favorites.label}
        </TabsTrigger>
      </TabsList>

      <TabsContent value='projects' className='mt-5 space-y-4'>
        <p className='text-muted-foreground text-sm text-pretty'>{projects.description}</p>
        {projects.content}
      </TabsContent>

      <TabsContent value='favorites' className='mt-5 space-y-4'>
        <p className='text-muted-foreground text-sm text-pretty'>{favorites.description}</p>
        {favorites.content}
      </TabsContent>
    </Tabs>
  )
}
