import { mockDelay } from '@/shared/lib/mock'
import { BUILDING_IMAGE, INTERIOR_IMAGE, STYLE_IMAGE, TOPIC_IMAGE } from '@/shared/lib/imagery'
import type { HandbookArticle, HandbookTemplate } from '../types/handbook.types'

/**
 * Seed catalogue for the in-browser mock. The real data is static content the
 * admin authors in the CMS, tagged per mục VI. Each photo is picked to match
 * what the item actually shows (see `shared/lib/imagery.ts`).
 */
const TEMPLATES: HandbookTemplate[] = [
  {
    id: 'tpl-01',
    name: 'Nhà phố 3 tầng mặt tiền 5m',
    imageUrl: TOPIC_IMAGE.livingRoom,
    styleLabel: 'Hiện đại',
    description:
      'Mặt tiền 5m, chiều sâu 18m với giếng trời giữa nhà nên tầng nào cũng có ánh sáng tự nhiên. Trệt bố trí khách – bếp – ăn liên thông, hai lầu trên chia 3 phòng ngủ đều có cửa sổ thoáng.',
    kind: 'layout',
    tags: {
      buildingType: 'townhouse',
      floorCount: 'ground+2',
      hasAttic: false,
      architectureStyle: 'modern',
      interiorStyle: 'modern'
    }
  },
  {
    id: 'tpl-02',
    name: 'Nhà mái Thái 1 trệt 1 lầu',
    imageUrl: TOPIC_IMAGE.warmLiving,
    styleLabel: 'Tối giản',
    description:
      'Mẫu nhà mái Thái có gác lửng làm phòng thờ và kho, phù hợp lô đất vuông vắn ở ngoại thành. Đường nét đơn giản, ít phào chỉ nên chi phí hoàn thiện dễ kiểm soát.',
    kind: 'layout',
    tags: {
      buildingType: 'garden',
      floorCount: 'ground+1',
      hasAttic: true,
      architectureStyle: 'thai-roof',
      interiorStyle: 'minimal'
    }
  },
  {
    id: 'tpl-03',
    name: 'Căn hộ 2 phòng ngủ 68m²',
    imageUrl: BUILDING_IMAGE.apartment,
    styleLabel: 'Indochine',
    description:
      'Căn hộ 68m² được nới cảm giác rộng bằng cách bỏ vách ngăn bếp và dùng tủ âm tường kịch trần. Điểm nhấn Indochine nằm ở gạch bông, gỗ tự nhiên và quạt trần cánh gỗ.',
    kind: 'layout',
    tags: { buildingType: 'apartment', interiorStyle: 'indochine' }
  },
  {
    id: 'tpl-04',
    name: 'Phòng khách tân cổ điển',
    imageUrl: INTERIOR_IMAGE.neoclassical,
    styleLabel: 'Tân cổ điển',
    description:
      'Phòng khách dùng phào chỉ mảnh, tường sơn màu kem và sofa nỉ tông trung tính. Tân cổ điển ở mức tiết chế nên vẫn hợp với căn nhà phố trần cao 3,2m.',
    kind: 'interior',
    tags: { interiorStyle: 'neoclassical' }
  },
  {
    id: 'tpl-05',
    name: 'Bếp mở liên thông phòng ăn',
    imageUrl: TOPIC_IMAGE.kitchen,
    styleLabel: 'Hiện đại',
    description:
      'Bếp chữ L kèm đảo kiêm bàn ăn nhanh, giữ tam giác bếp – chậu rửa – tủ lạnh trong tầm với. Mặt đá sáng màu và tủ trên kịch trần giúp khu bếp gọn và dễ lau chùi.',
    kind: 'interior',
    tags: { interiorStyle: 'modern' }
  },
  {
    id: 'tpl-06',
    name: 'Phòng khách tối giản gam ấm',
    imageUrl: INTERIOR_IMAGE.minimal,
    styleLabel: 'Tối giản',
    description:
      'Bảng màu chỉ ba tông: trắng ngà, gỗ sồi và xám nhạt, đồ đạc để ít nhưng chọn kỹ. Ánh sáng gián tiếp hắt trần làm không gian ấm hơn mà không cần thêm chi tiết trang trí.',
    kind: 'interior',
    tags: { interiorStyle: 'minimal' }
  },
  {
    id: 'tpl-07',
    name: 'Không gian Indochine nhiều cây xanh',
    imageUrl: INTERIOR_IMAGE.indochine,
    styleLabel: 'Indochine',
    description:
      'Gỗ tối màu kết hợp mảng xanh đặt sát cửa kính tạo chiều sâu cho phòng khách. Chọn cây chịu bóng như trầu bà, lưỡi hổ để không phải thay cây theo mùa.',
    kind: 'interior',
    tags: { interiorStyle: 'indochine' }
  },
  {
    id: 'tpl-08',
    name: 'Biệt thự hiện đại 2 tầng có hồ bơi',
    imageUrl: BUILDING_IMAGE.garden,
    styleLabel: 'Hiện đại',
    description:
      'Khối nhà vuông vức, mảng kính lớn hướng ra hồ bơi và sân sau. Cần lô đất tối thiểu 200m² và ngân sách hoàn thiện cao hơn mặt bằng chung do diện tích kính và sân vườn.',
    kind: 'layout',
    tags: {
      buildingType: 'garden',
      floorCount: 'ground+1',
      hasAttic: false,
      architectureStyle: 'modern',
      interiorStyle: 'modern'
    }
  },
  {
    id: 'tpl-09',
    name: 'Nhà mái ngói truyền thống sân vườn',
    imageUrl: STYLE_IMAGE['thai-roof'],
    styleLabel: 'Tân cổ điển',
    description:
      'Nhà một tầng mái ngói, hiên rộng chạy dọc mặt trước để che nắng xiên và mưa tạt. Bố cục trải ngang nên phù hợp đất vườn, gia đình có người lớn tuổi ngại cầu thang.',
    kind: 'layout',
    tags: {
      buildingType: 'garden',
      floorCount: 'ground',
      hasAttic: false,
      architectureStyle: 'thai-roof',
      interiorStyle: 'neoclassical'
    }
  }
]

const ARTICLES: HandbookArticle[] = [
  {
    id: 'art-01',
    title: 'Chọn kiểu mái phù hợp khí hậu miền Nam',
    excerpt: 'So sánh mái Thái, mái Nhật và mái bằng về chi phí, khả năng thoát nước và tuổi thọ.',
    body: [
      'Miền Nam mưa lớn dồn vào vài tháng, nên độ dốc mái quan trọng hơn kiểu dáng. Mái Thái dốc 30–45° thoát nước nhanh, ít đọng rêu, nhưng tốn vật tư và nhân công hơn mái bằng khoảng 15–20% cho cùng diện tích.',
      'Mái Nhật dốc thấp hơn, phần đua ra rộng nên che nắng xiên tốt cho tường và cửa sổ. Đổi lại, chi tiết giao mái nhiều hơn — đây là chỗ hay thấm nếu thi công ẩu, cần đặc biệt chú ý lớp chống thấm ở máng và khe tiếp giáp.',
      'Mái bằng rẻ nhất và tận dụng được sân thượng, nhưng bắt buộc chống thấm kỹ và nên có lớp cách nhiệt. Không có lớp này thì tầng áp mái nóng hầm vào buổi chiều, chi phí điện lạnh bù lại phần tiết kiệm ban đầu.',
      'Kinh nghiệm chọn nhanh: nhà phố chen giữa hai nhà liền kề thì mái bằng hoặc mái Nhật là hợp lý; nhà có sân vườn, muốn dáng truyền thống thì mái Thái hoặc mái ngói dốc.'
    ],
    imageUrl: STYLE_IMAGE['thai-roof'],
    topic: 'architecture',
    tags: { architectureStyle: 'thai-roof' }
  },
  {
    id: 'art-02',
    title: 'Nhà phố mặt tiền hẹp: lấy sáng và thông gió',
    excerpt: 'Giếng trời, ô thông tầng và cách bố trí cầu thang để căn nhà không bí.',
    body: [
      'Nhà phố mặt tiền 3,5–5m chỉ lấy sáng được hai đầu, nên khoảng giữa nhà luôn là chỗ tối và bí nhất. Giải pháp phổ biến nhất vẫn là giếng trời đặt ở giữa hoặc cuối nhà, diện tích khoảng 4–6% diện tích sàn.',
      'Giếng trời nên có mái che lấy sáng kèm khe thoáng bên hông, không đóng kín hoàn toàn. Kín quá thì chỉ còn tác dụng lấy sáng, mất hẳn phần đối lưu — thứ thực sự làm nhà bớt hầm.',
      'Cầu thang đặt lệch về một bên và làm bậc hở sẽ cho gió và sáng đi xuyên tầng thay vì bị chặn lại. Nếu nhà có trẻ nhỏ, bậc hở cần lan can dày thanh hoặc kính để an toàn.',
      'Cuối cùng, chừa ô thông tầng phía sau bếp giúp mùi thoát lên thay vì luẩn quẩn trong phòng khách. Đây là chi tiết nhỏ nhưng ảnh hưởng rõ tới cảm giác ở hằng ngày.'
    ],
    imageUrl: STYLE_IMAGE.modern,
    topic: 'architecture',
    tags: { buildingType: 'townhouse' }
  },
  {
    id: 'art-03',
    title: 'Ngân sách nội thất nên chia thế nào',
    excerpt: 'Tỷ lệ hợp lý giữa nội thất gỗ cố định, đồ rời và chiếu sáng trang trí.',
    body: [
      'Một cách chia ngân sách nội thất thường dùng: 50% cho phần gỗ cố định (tủ bếp, tủ áo, kệ tivi), 30% cho đồ rời (sofa, bàn ghế, giường, nệm), 20% cho chiếu sáng, rèm và trang trí.',
      'Phần gỗ cố định nên làm chuẩn ngay từ đầu vì sửa sau rất tốn kém. Đồ rời thì ngược lại — có thể mua dần, nâng cấp sau vài năm mà không đụng tới kết cấu.',
      'Đừng cắt phần chiếu sáng để dồn cho đồ đạc. Cùng một căn phòng, ánh sáng bố trí đúng lớp (đèn nền, đèn chức năng, đèn điểm) tạo khác biệt lớn hơn nhiều so với việc đổi sofa đắt hơn.',
      'Nên chừa thêm 10% dự phòng cho phát sinh. Thực tế thi công gần như luôn có hạng mục đội lên: ổ điện thiếu, kích thước lệch so với bản vẽ, hoặc đổi vật liệu vì hết hàng.'
    ],
    imageUrl: TOPIC_IMAGE.gallery,
    topic: 'interior',
    tags: {}
  },
  {
    id: 'art-04',
    title: 'Tân cổ điển: giữ nét sang mà không rườm rà',
    excerpt: 'Phào chỉ, màu sơn và đồ gỗ — ba thứ quyết định căn phòng tân cổ điển đạt hay hỏng.',
    body: [
      'Tân cổ điển hỏng thường vì thừa chứ hiếm khi vì thiếu. Phào chỉ chỉ nên xuất hiện ở vài vị trí chủ đạo: trần, chân tường và mảng tường sau sofa hoặc đầu giường.',
      'Chiều cao trần quyết định độ dày phào. Trần dưới 3m nên dùng phào mảnh 5–8cm; dùng phào to như biệt thự trần 3,5m sẽ làm phòng thấp hẳn xuống.',
      'Màu sơn nên ở tông kem, ghi sáng hoặc trắng ngà thay vì trắng tinh — trắng tinh làm phào chỉ nổi gắt và lộ mọi khuyết điểm bề mặt.',
      'Đồ gỗ chọn một tông chủ đạo cho cả phòng, tránh trộn ba bốn màu veneer khác nhau. Kim loại mạ (tay nắm, chân bàn, đèn) cũng nên thống nhất vàng đồng hoặc mạ crôm, không lẫn lộn.'
    ],
    imageUrl: INTERIOR_IMAGE.neoclassical,
    topic: 'interior',
    tags: { interiorStyle: 'neoclassical' }
  }
]

export const mockHandbookApi = {
  listTemplates: async (): Promise<HandbookTemplate[]> => {
    await mockDelay(250)
    return TEMPLATES
  },

  listArticles: async (topic?: string): Promise<HandbookArticle[]> => {
    await mockDelay(250)
    return topic ? ARTICLES.filter((article) => article.topic === topic) : ARTICLES
  }
}
