import { mockDelay } from '@/shared/lib/mock'
import { BUILDING_IMAGE, INTERIOR_IMAGE, TOPIC_IMAGE } from '@/shared/lib/imagery'
import type { GuideArticle, GuideVideo } from '../types/guide.types'

const VIDEOS: GuideVideo[] = [
  {
    id: 'vid-01',
    topic: 'land-photo',
    title: 'Hướng dẫn nhập liệu dự án',
    description: 'Chụp ảnh, nhập thông tin và lựa chọn phong cách.',
    thumbnailUrl: TOPIC_IMAGE.site,
    videoUrl: '',
    durationSeconds: 168
  },
  {
    id: 'vid-02',
    topic: 'input',
    title: 'AI tạo bản vẽ & phối cảnh 3D',
    description: 'Tạo mặt bằng, phối cảnh và chỉnh sửa theo nhu cầu.',
    thumbnailUrl: BUILDING_IMAGE.townhouse,
    videoUrl: '',
    durationSeconds: 195
  },
  {
    id: 'vid-03',
    topic: 'read-estimate',
    title: 'Xem dự toán & hồ sơ thi công',
    description: 'Kiểm tra dự toán chi tiết và xuất hồ sơ đầy đủ.',
    thumbnailUrl: INTERIOR_IMAGE.modern,
    videoUrl: '',
    durationSeconds: 182
  },
  {
    id: 'vid-04',
    topic: 'dossier',
    title: 'Bộ hồ sơ gồm những gì',
    description: 'Trang bìa, mặt bằng 2D, phối cảnh và bảng dự toán chi tiết.',
    thumbnailUrl: BUILDING_IMAGE.house,
    videoUrl: '',
    durationSeconds: 40
  },
  {
    id: 'vid-05',
    topic: 'share',
    title: 'Chia sẻ hồ sơ cho nhà thầu',
    description: 'Tạo link, gửi email hoặc quét QR để xem online.',
    thumbnailUrl: BUILDING_IMAGE.townhouse,
    videoUrl: '',
    durationSeconds: 35
  }
]

const ARTICLES: GuideArticle[] = [
  {
    id: 'gart-01',
    topic: 'land-photo',
    title: 'Checklist ảnh lô đất đạt chuẩn',
    excerpt: 'Đủ sáng, thấy rõ ranh giới, tránh ngược sáng và vật che khuất.',
    imageUrl: TOPIC_IMAGE.site
  },
  {
    id: 'gart-02',
    topic: 'read-estimate',
    title: 'Dự toán khác báo giá thi công thế nào',
    excerpt: 'Phạm vi, độ chi tiết và những khoản thường phát sinh ngoài dự toán.',
    imageUrl: TOPIC_IMAGE.blueprint
  }
]

export const mockGuideApi = {
  listVideos: async (): Promise<GuideVideo[]> => {
    await mockDelay(250)
    return VIDEOS
  },
  listArticles: async (): Promise<GuideArticle[]> => {
    await mockDelay(250)
    return ARTICLES
  }
}
