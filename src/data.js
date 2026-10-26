export const landmarks = [
  {
    id: 'ancestral',
    number: '01',
    name: '鲁迅祖居',
    subtitle: '周家老台门 · 世居旧影',
    short: '祖居',
    position: [-31, 5.8, -10],
    focus: [-31, 2.5, -9],
    camera: [-42, 15, 13],
    map: [51, 60],
    description: '周家老台门是鲁迅祖辈世居之地。台门院落层层展开，白墙、黛瓦与木门留存着绍兴士大夫家族的生活秩序。',
    quote: '一座老台门，收藏着周氏家族数代人的日常。',
    action: '前往鲁迅祖居'
  },
  {
    id: 'sanwei',
    number: '02',
    name: '三味书屋',
    subtitle: '寿家台门 · 清末私塾',
    short: '三味书屋',
    position: [-7, 6.7, 11],
    focus: [-7, 2.6, 11],
    camera: [-18, 11, 32],
    map: [98, 103],
    description: '三味书屋是清末绍兴城内的私塾，鲁迅少年时在此读书。黑油竹丝门、临河石阶与屋内的旧课桌，共同留存着那段求学时光。',
    quote: '“从一扇黑油的竹门进去，第三间是书房。”',
    action: '进入三味书屋',
    interior: true
  },
  {
    id: 'former',
    number: '03',
    name: '鲁迅故居',
    subtitle: '周家新台门 · 出生与生活',
    short: '故居',
    position: [11, 6, -10],
    focus: [11, 2.5, -10],
    camera: [0, 14, 14],
    map: [128, 60],
    description: '鲁迅于 1881 年出生在这里，并度过了童年与少年时期。新台门的天井、厅堂和居室，让人得以走近文字之外的真实生活。',
    quote: '故里的门窗与天井，是理解鲁迅童年的一把钥匙。',
    action: '前往鲁迅故居'
  },
  {
    id: 'garden',
    number: '04',
    name: '百草园',
    subtitle: '故居后园 · 童年的乐园',
    short: '百草园',
    position: [13, 3.8, -31],
    focus: [13, 1.5, -31],
    camera: [11, 18, -15],
    map: [139, 26],
    description: '百草园是故居屋后的菜园。菜畦、石井栏、皂荚树与矮泥墙，把课文里的趣味还原成可以驻足观看的日常风景。',
    quote: '“不必说碧绿的菜畦，光滑的石井栏，高大的皂荚树……”',
    action: '前往百草园'
  },
  {
    id: 'memorial',
    number: '05',
    name: '鲁迅纪念馆',
    subtitle: '生平陈列 · 民族魂',
    short: '纪念馆',
    position: [39, 6.2, -9],
    focus: [39, 2.8, -9],
    camera: [29, 14, 16],
    map: [200, 62],
    description: '纪念馆以文物、手稿与生平陈列，呈现鲁迅从绍兴走向世界的生命轨迹，也为故里之行补上更深的一层阅读。',
    quote: '从少年周树人到文学家鲁迅，故里是故事的起点。',
    action: '前往鲁迅纪念馆'
  }
];

export const archives = [
  {
    src: '/images/sanwei-study.webp',
    title: '三味书屋 · 内部陈设',
    caption: '匾额、松鹿图与整齐排列的课桌椅，是本次室内重构的主要依据。',
    alt: '三味书屋内部实景，可见匾额、松鹿图、讲台与课桌椅'
  },
  {
    src: '/images/sanwei-river.jpg',
    title: '三味书屋 · 临河入口',
    caption: '临河廊道、黑柱白墙、红灯笼与乌篷船，构成书屋独特的水乡入口。',
    alt: '三味书屋临河入口实景，有红灯笼和乌篷船'
  },
  {
    src: '/images/narrow-corridor.jpg',
    title: '故里巷弄 · 木格窗廊道',
    caption: '斑驳白墙、连续木格窗与深色石板路，被转译为景区内可漫游的窄巷。',
    alt: '鲁迅故里狭窄廊道实景，一侧为木格窗，一侧为白墙'
  }
];

export const interiorStories = {
  overview: {
    number: '室内 · 01',
    title: '三味书屋',
    subtitle: '一方书桌，一段求学岁月',
    description: '书屋正中悬挂“三味书屋”匾额与松鹿图，下方设先生讲桌，两侧排列学生课桌。深色木梁与旧砖地面延续着清末私塾的朴素气息。',
    quote: '点击“鲁迅书桌”，走近少年鲁迅的座位。',
    action: '返回景区'
  },
  desk: {
    number: '室内 · 02',
    title: '书桌上的“早”',
    subtitle: '鲁迅书桌 · 自我鞭策',
    description: '相传鲁迅因照料父亲、买药而迟到，便在课桌一角刻下“早”字，以此提醒自己时时早、事事早。模型将刻字放在桌面右前角，可缩放近看。',
    quote: '一个“早”字，是少年对自我的郑重约定。',
    action: '返回景区'
  },
  painting: {
    number: '室内 · 03',
    title: '匾额与松鹿图',
    subtitle: '书屋正中 · 旧时讲堂',
    description: '按照实景照片，书屋正中依次布置匾额、松鹿图与寿镜吾先生像。画中的古松与鹿取传统吉祥寓意，也构成来访者最鲜明的空间记忆。',
    quote: '“三味书屋”四字之下，是清末私塾最日常的一幕。',
    action: '返回景区'
  }
};
