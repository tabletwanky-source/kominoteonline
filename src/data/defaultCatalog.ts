import { Category, Course, Profile, CourseModule, Lesson, ProductCategory, DigitalProduct } from '../types/database';

export const DEFAULT_INSTRUCTORS: Profile[] = [
  {
    id: 'inst-wanky',
    email: 'wanky7713@gmail.com',
    full_name: 'Wanky',
    role: 'admin',
    headline: 'Fondatè Kominote Online & Enjenyè Lojisyèl',
    bio: 'Pasyonen pa transmisyon konesans teknolojik an Kreyòl Ayisyen. Plis pase 8 lane eksperyans nan devlopman web, entèlijans atifisyèl ak kreyasyon biznis dijital.',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    created_at: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'inst-jean-baptiste',
    email: 'jean.baptiste@kominote.online',
    full_name: 'Jean-Baptiste Dorval',
    role: 'instructor',
    headline: 'Ekspè Maketing Dijital & E-commerce',
    bio: 'Spesyalis nan estrateji piblisite Facebook, TikTok Ads ak optimize lavant an liy pou biznis entènasyonal.',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    created_at: '2024-01-01T00:00:00.000Z',
  }
];

export const DEFAULT_CATEGORIES: Category[] = [
  {
    id: 'cat-web',
    name: 'Devlopman Web & Pwogramasyon',
    slug: 'devlopman-web',
    description: 'Aprann kreye sit entènèt ak aplikasyon modèn soti nan fondasyon rive nan deplwaman.',
    icon: 'Code',
    course_count: 3,
  },
  {
    id: 'cat-ai',
    name: 'Entèlijans Atifisyèl & Otomatizasyon',
    slug: 'ai-otomatizasyon',
    description: 'Metrize zouti IA modèn yo tankou ChatGPT, Midjourney, ak otomatizasyon travay pou ogmante pwodiktivite w.',
    icon: 'Sparkles',
    course_count: 2,
  },
  {
    id: 'cat-marketing',
    name: 'Maketing Dijital & Komès An Liy',
    slug: 'maketing-dijital',
    description: 'Estrateji konkrè pou atire kliyan, metrize piblisite Facebook/TikTok, ak ogmante lavant.',
    icon: 'TrendingUp',
    course_count: 2,
  },
  {
    id: 'cat-design',
    name: 'Konsepsyon Grafik & UI/UX',
    slug: 'konsepsyon-grafik',
    description: 'Konsepsyon vizyèl pwofesyonèl ak Figma, Canva Pro, ak prensip UI/UX pou kaptive kliyan yo.',
    icon: 'Palette',
    course_count: 1,
  },
  {
    id: 'cat-media',
    name: 'Kreyasyon Kontni & Video Editing',
    slug: 'kreyasyon-kontni',
    description: 'Teknik montaj videyo rapid ak pwofesyonèl pou kreye videyo viral sou YouTube, TikTok ak Reels.',
    icon: 'Video',
    course_count: 1,
  },
];

export const DEFAULT_COURSES: Course[] = [
  {
    id: 'course-web-dev-pro',
    title: 'Mèt nan Devlopman Web Modèn (HTML, CSS, JavaScript & React)',
    slug: 'devlopman-web-moden-html-css-js-react',
    short_description: 'Fòmasyon konplè an Kreyòl Ayisyen pou vin yon Devlopè Web pwofesyonèl depi nan zewo rive jwenn premye kliyan w.',
    description: `Nan fòmasyon sa a, w ap aprann tout etap ki nesesè pou bati sit entènèt ak aplikasyon entèaktif depi nan baz rive nan nivo pwofesyonèl. Nou pa rete sèlman nan teyori: chak modil genyen pwojè reyèl ke w ap kode ak de men w pou konstwi yon pòtfèy ki fè konfyans.

W ap metrize HTML5 semantik, CSS3 ak Tailwind CSS pou stil modèn, JavaScript ES6+ pou lojik entèaktif, epi React pou devlope aplikasyon konplèks ak rapid.`,
    thumbnail: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&auto=format&fit=crop&q=80',
    category_id: 'cat-web',
    category: DEFAULT_CATEGORIES[0],
    instructor_id: 'inst-wanky',
    instructor: DEFAULT_INSTRUCTORS[0],
    price: 49.99,
    sale_price: 29.99,
    currency: 'USD',
    level: 'Tout Nivo',
    duration_hours: 18.5,
    status: 'published',
    featured: true,
    rating: 4.9,
    students_count: 142,
    total_lessons: 12,
    created_at: '2024-02-15T12:00:00.000Z',
    learning_outcomes: [
      'Metrize HTML5, CSS3, ak Tailwind CSS pou kreye entèfas rapid ak responsive',
      'Konprann JavaScript nan nivo pwofon: DOM, Fonksyon, Asynchrone, API Fetch',
      'Bati aplikasyon konplèks ak React, State Management, ak Hooks',
      'Deplwaye pwojè w yo sou entènèt gratis sou Vercel oswa Netlify',
      'Prepare yon pòtfèy pwofesyonèl pou kòmanse jwenn kliyan oswa travay a distans'
    ],
    requirements: [
      'Yon òdinatè (Windows, Mac oswa Linux) ak koneksyon entènèt',
      'Pa gen konesans anvan nan kòd ki nesesè: nou kòmanse depi nan zewo absoli'
    ],
    modules: [
      {
        id: 'mod-web-1',
        course_id: 'course-web-dev-pro',
        title: 'Modil 1: Fondasyon Web ak HTML5 & CSS3',
        position: 1,
        lessons: [
          {
            id: 'les-web-1',
            course_id: 'course-web-dev-pro',
            module_id: 'mod-web-1',
            title: 'Kijan entènèt la mache ak enstalasyon VS Code',
            position: 1,
            duration_minutes: 18,
            content_type: 'youtube',
            video_url: 'https://www.youtube.com/watch?v=kUMe1FH4CHE',
            is_preview: true,
            preview_enabled: true,
            content_text: 'Byenvini nan premye leson an! Isit la nou eksplike baz rezo, navigatè ak enstalasyon anviwònman travay la.'
          },
          {
            id: 'les-web-2',
            course_id: 'course-web-dev-pro',
            module_id: 'mod-web-1',
            title: 'Tout Baliz HTML5 ki pi enpòtan yo',
            position: 2,
            duration_minutes: 25,
            content_type: 'youtube',
            video_url: 'https://www.youtube.com/watch?v=kUMe1FH4CHE',
            is_preview: false,
            content_text: 'Eksplorasyon baliz semantik: header, nav, main, article, section, footer ak fòmilè.'
          },
          {
            id: 'les-web-3',
            course_id: 'course-web-dev-pro',
            module_id: 'mod-web-1',
            title: 'Prensip CSS3: Flexbox ak Grid Layout',
            position: 3,
            duration_minutes: 32,
            content_type: 'youtube',
            video_url: 'https://www.youtube.com/watch?v=kUMe1FH4CHE',
            is_preview: false,
            content_text: 'Mete paj ou an fòm ak layout responsive pou tout kalite ekran (smartphone, tablèt, òdinatè).'
          }
        ]
      },
      {
        id: 'mod-web-2',
        course_id: 'course-web-dev-pro',
        title: 'Modil 2: JavaScript Modèn (ES6+)',
        position: 2,
        lessons: [
          {
            id: 'les-web-4',
            course_id: 'course-web-dev-pro',
            module_id: 'mod-web-2',
            title: 'Varyab, Kalite Donnen ak Operatè',
            position: 1,
            duration_minutes: 22,
            content_type: 'youtube',
            video_url: 'https://www.youtube.com/watch?v=kUMe1FH4CHE',
            is_preview: false,
            content_text: 'Konprann let, const, kalite primitif ak referans nan JavaScript.'
          },
          {
            id: 'les-web-5',
            course_id: 'course-web-dev-pro',
            module_id: 'mod-web-2',
            title: 'Manipilasyon DOM ak Jesyon Evènman',
            position: 2,
            duration_minutes: 28,
            content_type: 'youtube',
            video_url: 'https://www.youtube.com/watch?v=kUMe1FH4CHE',
            is_preview: false,
            content_text: 'Konekte kòd JavaScript ak eleman paj la pou fè sit la vin entèaktif sou klike itilizatè a.'
          },
          {
            id: 'les-web-6',
            course_id: 'course-web-dev-pro',
            module_id: 'mod-web-2',
            title: 'Konekte API ak Fetch ak Async / Await',
            position: 3,
            duration_minutes: 35,
            content_type: 'youtube',
            video_url: 'https://www.youtube.com/watch?v=kUMe1FH4CHE',
            is_preview: false,
            content_text: 'Chèche donnen an dirèk sou sèvè aleka epi afiche yo dinamikman.'
          }
        ]
      },
      {
        id: 'mod-web-3',
        course_id: 'course-web-dev-pro',
        title: 'Modil 3: Bati Aplikasyon ak React & Tailwind',
        position: 3,
        lessons: [
          {
            id: 'les-web-7',
            course_id: 'course-web-dev-pro',
            module_id: 'mod-web-3',
            title: 'Entwodiksyon React ak Vite',
            position: 1,
            duration_minutes: 20,
            content_type: 'youtube',
            video_url: 'https://www.youtube.com/watch?v=kUMe1FH4CHE',
            is_preview: false,
            content_text: 'Kreye premye pwojè React ou a epi konprann konsèp Konpozan ak Props.'
          },
          {
            id: 'les-web-8',
            course_id: 'course-web-dev-pro',
            module_id: 'mod-web-3',
            title: 'Hooks: useState ak useEffect',
            position: 2,
            duration_minutes: 30,
            content_type: 'youtube',
            video_url: 'https://www.youtube.com/watch?v=kUMe1FH4CHE',
            is_preview: false,
            content_text: 'Jere eta entèn aplikasyon an ak efè segondè yo kòrèkteman.'
          },
          {
            id: 'les-web-9',
            course_id: 'course-web-dev-pro',
            module_id: 'mod-web-3',
            title: 'Pwojè Pratik: Kreyasyon yon aplikasyon konplè',
            position: 3,
            duration_minutes: 45,
            content_type: 'youtube',
            video_url: 'https://www.youtube.com/watch?v=kUMe1FH4CHE',
            is_preview: false,
            content_text: 'Mete tout sa w te aprann ansanm pou bati yon aplikasyon rezo modèn.'
          }
        ]
      },
      {
        id: 'mod-web-4',
        course_id: 'course-web-dev-pro',
        title: 'Modil 4: Deplwaman ak Jwenn Premye Kliyan',
        position: 4,
        lessons: [
          {
            id: 'les-web-10',
            course_id: 'course-web-dev-pro',
            module_id: 'mod-web-4',
            title: 'Mete pwojè a sou GitHub ak Deplwaye sou Vercel',
            position: 1,
            duration_minutes: 20,
            content_type: 'youtube',
            video_url: 'https://www.youtube.com/watch?v=kUMe1FH4CHE',
            is_preview: false,
            content_text: 'Kijan pou pataje lyen aplikasyon w lan ak mond lan.'
          },
          {
            id: 'les-web-11',
            course_id: 'course-web-dev-pro',
            module_id: 'mod-web-4',
            title: 'Konstwi yon CV ak Pòtfèy ki Atire Kliyan',
            position: 2,
            duration_minutes: 25,
            content_type: 'youtube',
            video_url: 'https://www.youtube.com/watch?v=kUMe1FH4CHE',
            is_preview: false,
            content_text: 'Estrateji pou prezante pwojè w yo kòm yon devlopè kredib.'
          },
          {
            id: 'les-web-12',
            course_id: 'course-web-dev-pro',
            module_id: 'mod-web-4',
            title: 'Kijan pou negosye pri ak jwenn kontra Freelance',
            position: 3,
            duration_minutes: 30,
            content_type: 'youtube',
            video_url: 'https://www.youtube.com/watch?v=kUMe1FH4CHE',
            is_preview: false,
            content_text: 'Gid pratik pou jwenn premye kliyan peyan w depi nan peyi w oswa a distans.'
          }
        ]
      }
    ]
  },
  {
    id: 'course-ai-automation',
    title: 'Otomatizasyon Biznis ak Entèlijans Atifisyèl (Make, Zapier & OpenAI)',
    slug: 'otomatizasyon-biznis-ia-make-zapier',
    short_description: 'Aprann kijan pou konekte aplikasyon yo ansanm epi otomatize travay konplèks ak zouti IA san ekri kòd.',
    description: `Dekouvri kijan pou w ekonomize tan epi ofri sèvis otomatizasyon pou antrepriz yo. Fòmasyon sa a montre w kijan pou itilize Make.com ak OpenAI pou kreye sistèm otomatik k ap jere mesaj kliyan, analize imèl, ak pibliye kontni otomatikman.`,
    thumbnail: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&auto=format&fit=crop&q=80',
    category_id: 'cat-ai',
    category: DEFAULT_CATEGORIES[1],
    instructor_id: 'inst-wanky',
    instructor: DEFAULT_INSTRUCTORS[0],
    price: 39.99,
    sale_price: 19.99,
    currency: 'USD',
    level: 'Tout Nivo',
    duration_hours: 12.0,
    status: 'published',
    featured: true,
    rating: 5.0,
    students_count: 98,
    total_lessons: 8,
    created_at: '2024-02-20T10:00:00.000Z',
    learning_outcomes: [
      'Metrize platfòm Make.com pou kreye senaryo otomatizasyon avanse',
      'Konekte ChatGPT API pou reponn kliyan otomatikman sou WhatsApp ak imèl',
      'Kreye sistèm jesyon plon (leads) ki transfere otomatikman nan Google Sheets ak CRM',
      'Vann sèvis otomatizasyon bay antrepriz lokal ak entènasyonal'
    ],
    requirements: [
      'Òdinatè ak koneksyon entènèt',
      'Kont gratis sou Make.com ak OpenAI'
    ],
    modules: [
      {
        id: 'mod-ai-1',
        course_id: 'course-ai-automation',
        title: 'Modil 1: Prensip Otomatizasyon ak Make.com',
        position: 1,
        lessons: [
          {
            id: 'les-ai-1',
            course_id: 'course-ai-automation',
            module_id: 'mod-ai-1',
            title: 'Kijan Otomatizasyon ak Webhooks fonksyone',
            position: 1,
            duration_minutes: 20,
            content_type: 'youtube',
            video_url: 'https://www.youtube.com/watch?v=kUMe1FH4CHE',
            is_preview: true,
            preview_enabled: true,
            content_text: 'Konprann modil, deklanchè (triggers), ak aksyon sou Make.com.'
          },
          {
            id: 'les-ai-2',
            course_id: 'course-ai-automation',
            module_id: 'mod-ai-1',
            title: 'Konekte Google Sheets, Gmail ak Telegram',
            position: 2,
            duration_minutes: 25,
            content_type: 'youtube',
            video_url: 'https://www.youtube.com/watch?v=kUMe1FH4CHE',
            is_preview: false,
            content_text: 'Bati yon premye senaryo k ap transfere enfòmasyon otomatikman.'
          }
        ]
      },
      {
        id: 'mod-ai-2',
        course_id: 'course-ai-automation',
        title: 'Modil 2: Entegre Entèlijans Atifisyèl ak Zouti Biznis',
        position: 2,
        lessons: [
          {
            id: 'les-ai-3',
            course_id: 'course-ai-automation',
            module_id: 'mod-ai-2',
            title: 'Kreye yon Asistan AI pou sèvis kliyan',
            position: 1,
            duration_minutes: 30,
            content_type: 'youtube',
            video_url: 'https://www.youtube.com/watch?v=kUMe1FH4CHE',
            is_preview: false,
            content_text: 'Kijan pou fòme yon modèl sou pwodwi w yo pou l reponn kliyan.'
          },
          {
            id: 'les-ai-4',
            course_id: 'course-ai-automation',
            module_id: 'mod-ai-2',
            title: 'Kijan pou vann sèvis sa a bay antrepriz',
            position: 2,
            duration_minutes: 25,
            content_type: 'youtube',
            video_url: 'https://www.youtube.com/watch?v=kUMe1FH4CHE',
            is_preview: false,
            content_text: 'Pake sèvis, pri, ak teknik negosyasyon ak antrepriz.'
          }
        ]
      }
    ]
  },
  {
    id: 'course-marketing-ecommerce',
    title: 'E-commerce & Dropshipping pou Mache Ayisyen ak Entènasyonal',
    slug: 'ecommerce-dropshipping-ayisyen',
    short_description: 'Estrateji konplè pou bati yon boutik an liy k ap jenere lavant chak jou grasa piblisite Facebook & TikTok.',
    description: `Aprann kijan pou kòmanse yon biznis komès an liy san w pa bezwen gwo kapital okòmansman. N ap montre w kijan pou chwazi bon pwodwi, kreye yon sit Shopify atiran, epi kondwi trafik kalifye ak Facebook Ads ak TikTok.`,
    thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=80',
    category_id: 'cat-marketing',
    category: DEFAULT_CATEGORIES[2],
    instructor_id: 'inst-jean-baptiste',
    instructor: DEFAULT_INSTRUCTORS[1],
    price: 45.00,
    sale_price: 24.99,
    currency: 'USD',
    level: 'Kòmansan',
    duration_hours: 10.0,
    status: 'published',
    featured: true,
    rating: 4.8,
    students_count: 85,
    total_lessons: 7,
    created_at: '2024-03-01T08:00:00.000Z',
    learning_outcomes: [
      'Chwazi pwodwi genyen (winning products) ki gen gwo maj benefis',
      'Kreye yon boutik Shopify ki konvèti vizitè an achtè',
      'Metrize Facebook Ads Manager depi nan kanpay debaz rive nan retargeting',
      'Jere peman, lojistik ak relasyon kliyan'
    ],
    requirements: [
      'Òdinatè ak entènèt',
      'Yon ti bidjè pou tès piblisite (opsyonèl pou kòmanse)'
    ]
  },
  {
    id: 'course-graphic-design',
    title: 'Masterclass Konsepsyon Grafik ak Figma & Canva Pro',
    slug: 'masterclass-figma-canva-grafik',
    short_description: 'Kreye vizyèl pwofesyonèl, flayè, logo, ak entèfas aplikasyon ki fè kliyan peye w pou kreyativite w.',
    description: `Fòmasyon pratik sa a fèt espesyalman pou moun ki vle kreye vizyèl ki kaptive atansyon sou rezo sosyal oswa pou enprime. W ap aprann teyori koulè, tipografi, kreyasyon idantite vizyèl, ak konsepsyon UI pou sit entènèt ak aplikasyon mobil.`,
    thumbnail: 'https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?w=800&auto=format&fit=crop&q=80',
    category_id: 'cat-design',
    category: DEFAULT_CATEGORIES[3],
    instructor_id: 'inst-wanky',
    instructor: DEFAULT_INSTRUCTORS[0],
    price: 35.00,
    sale_price: 19.99,
    currency: 'USD',
    level: 'Tout Nivo',
    duration_hours: 8.5,
    status: 'published',
    featured: false,
    rating: 4.9,
    students_count: 67,
    total_lessons: 6,
    created_at: '2024-03-10T14:00:00.000Z',
    learning_outcomes: [
      'Prensip de baz grafik: kontras, aliyman, yerachi ak espas blan',
      'Metrize Canva Pro pou kreye afich, bannè, ak kouvèti liv rapid',
      'Metrize Figma pou kreye makèt sit entènèt ak logo vektoryèl',
      'Ekspòte fichye kalite siperyè pou enpresyon ak entènèt'
    ],
    requirements: [
      'Òdinatè oswa tablèt',
      'Kont gratis Canva ak Figma'
    ]
  },
  {
    id: 'course-content-creation',
    title: 'Kreyasyon Kontni Viral & Montaj Videyo ak CapCut',
    slug: 'kreyasyon-kontni-viral-videyo',
    short_description: 'Aprann fè montaj videyo dinamik pou TikTok, Reels, ak YouTube Shorts pou elaji odyans ou ak lavant ou.',
    description: `Videyo kout (Short-form video) se fòma ki gen plis enpak sou entènèt jodi a. Nan fòmasyon sa a, w ap aprann tout teknik montaj, tranzisyon, sousekri dinamik, ak efè son ki kenbe atansyon moun depi nan 3 premye segonn yo.`,
    thumbnail: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=800&auto=format&fit=crop&q=80',
    category_id: 'cat-media',
    category: DEFAULT_CATEGORIES[4],
    instructor_id: 'inst-wanky',
    instructor: DEFAULT_INSTRUCTORS[0],
    price: 29.99,
    sale_price: 14.99,
    currency: 'USD',
    level: 'Kòmansan',
    duration_hours: 6.0,
    status: 'published',
    featured: false,
    rating: 4.8,
    students_count: 53,
    total_lessons: 5,
    created_at: '2024-03-15T16:00:00.000Z',
    learning_outcomes: [
      'Prensip "Hook" pou kenbe atansyon telespektatè a nan 3 premye segonn',
      'Metrize CapCut sou telefòn ak sou PC',
      'Ajoute sousekri otomatik, efè animasyon, ak tranzisyon dinamik',
      'Chwazi mizik ak efè son ki matche ak emosyon videyo a'
    ],
    requirements: [
      'Yon smartphone oswa òdinatè',
      'Aplikasyon CapCut gratis enstale'
    ]
  }
];

export const DEFAULT_PRODUCT_CATEGORIES: ProductCategory[] = [
  {
    id: 'pcat-ebooks',
    name: 'Liv & Gid Elektwonik',
    slug: 'liv-ak-gid',
    description: 'Liv elektwonik, manyèl pratik ak gid detaye pou devlope konesans ou.',
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'pcat-templates',
    name: 'Modèl & Fòmilè (Templates)',
    slug: 'model-ak-fomile',
    description: 'Modèl pwofesyonèl pare pou itilize pou biznis, jesyon ak kreyasyon kontni.',
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'pcat-toolkits',
    name: 'Bwat Zouti & Resous AI',
    slug: 'bwat-zouti-ai',
    description: 'Pake prompts, zouti otomatizasyon ak gid estratejik pou entèlijans atifisyèl.',
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'pcat-code',
    name: 'Kòd Sous & Pwojè Web',
    slug: 'kod-sous-web',
    description: 'Pwojè konplè pare pou deplwaye, konpozan UI ak script otomatizasyon.',
    createdAt: '2024-01-01T00:00:00.000Z',
  },
];

export const DEFAULT_DIGITAL_PRODUCTS: DigitalProduct[] = [
  {
    id: 'prod-gid-biznis-ayiti',
    title: 'Gid Konplè Pou Lanse Biznis Sou Entènèt an Ayiti',
    slug: 'gid-lanse-biznis-sou-entenet-ayiti',
    shortDescription: 'Etap pa etap pou w kòmanse yon biznis dijital rentab depi lakay ou, jwenn kliyan epi resevwa peman fasil.',
    description: `Liv elektwonik sa a fèt espesyalman pou antreprenè, etidyan, ak pwofesyonèl ayisyen ki vle kòmanse yon aktivite sou entènèt. Li eksplike tout reyalite peyi a: kòman pou w resevwa peman entènasyonal ak lokal (MonCash, Natcash, transfè bankè), kòman pou w jwenn premye kliyan w yo, ak ki modèl biznis ki pi rentab nan moman an.`,
    imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80',
    coverImage: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80',
    categoryId: 'pcat-ebooks',
    categoryName: 'Liv & Gid Elektwonik',
    category: 'Liv & Gid Elektwonik',
    price: 19.99,
    salePrice: 9.99,
    currency: 'USD',
    productType: 'ebook',
    status: 'published',
    featured: true,
    downloadable: true,
    downloadFileUrl: 'https://raw.githubusercontent.com/kominote/assets/main/gid-biznis-ayiti.pdf',
    requirements: [
      'Aparèy pou li fichye PDF (Telefòn, Tablèt, oswa Òdinatè)',
      'Aplikasyon lekti gratis tankou Adobe Acrobat oswa lektè PDF estanda'
    ],
    includedFiles: [
      'Liv prensipal an fòma PDF (120 paj)',
      'Fichye fòma EPUB pou lektè elektwonik',
      'Fèy wout (Roadmap) pou 30 premye jou ou'
    ],
    purchaseInstructions: 'Apre konfimasyon peman ou a, w ap jwenn aksè imedyat pou telechaje tout fichye yo nan espas elèv ou a.',
    createdAt: '2024-02-01T10:00:00.000Z',
    updatedAt: '2024-02-01T10:00:00.000Z',
  },
  {
    id: 'prod-prompts-ai-kominote',
    title: 'Bwat Zouti Prompts ChatGPT & Claude Pou Otomatizasyon',
    slug: 'bwat-zouti-prompts-ai-otomatizasyon',
    shortDescription: 'Plis pase 300 prompts pwofesyonèl teste an Kreyòl ak Angle pou redaksyon, maketing ak kòd.',
    description: `Ogmante pwodiktivite w pa 10x gras a koleksyon prompts optimize pou biznis ak devlopman. Bwat zouti sa a genyen fòmil egzak pou kreye tèks lavant pèswazif, optimize kòd pwogramasyon, reponn imèl kliyan, epi otomatize travay repetitif yo.`,
    imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80',
    coverImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80',
    categoryId: 'pcat-toolkits',
    categoryName: 'Bwat Zouti & Resous AI',
    category: 'Bwat Zouti & Resous AI',
    price: 24.99,
    salePrice: 14.99,
    currency: 'USD',
    productType: 'template',
    status: 'published',
    featured: true,
    downloadable: true,
    downloadFileUrl: 'https://raw.githubusercontent.com/kominote/assets/main/prompts-ai-kominote.zip',
    requirements: [
      'Kont gratis oswa peye sou ChatGPT, Claude oswa Gemini',
      'Lojisyèl pou dekonprese fichye ZIP'
    ],
    includedFiles: [
      'Dokiman PDF gid itilizasyon (50 paj)',
      'Fichye tèks pare pou kopye/kole',
      'Koleksyon tablo Notion entegre'
    ],
    purchaseInstructions: 'Telechajman an disponib nan kont ou touswit aprè peman an verifye.',
    createdAt: '2024-02-10T12:00:00.000Z',
    updatedAt: '2024-02-10T12:00:00.000Z',
  },
  {
    id: 'prod-model-kontra-freelance',
    title: 'Pake Modèl Kontra & Fakti Pwofesyonèl pou Freelancers',
    slug: 'pake-model-kontra-fakti-freelance',
    shortDescription: 'Modèl kontra legal, deviz ak fakti estanda an Kreyòl ak Franse pou pwoteje travay ou ak peman w.',
    description: `Pa janm travay san yon kontra ankò! Pake sa a genyen tout modèl dokiman administratif ou bezwen kòm prestabilè sèvis, devlopè, designer oswa kreyatè kontni: kontra sèvis, kloz konfidansyalite, deviz detaye ak fòma fakti pwofesyonèl.`,
    imageUrl: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=600&auto=format&fit=crop&q=80',
    coverImage: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=600&auto=format&fit=crop&q=80',
    categoryId: 'pcat-templates',
    categoryName: 'Modèl & Fòmilè (Templates)',
    category: 'Modèl & Fòmilè (Templates)',
    price: 14.99,
    salePrice: 7.99,
    currency: 'USD',
    productType: 'pdf',
    status: 'published',
    featured: false,
    downloadable: true,
    downloadFileUrl: 'https://raw.githubusercontent.com/kominote/assets/main/kontra-freelance.zip',
    requirements: [
      'Microsoft Word, Google Docs oswa lektè PDF'
    ],
    includedFiles: [
      '3 Modèl kontra fòma DOCX ak PDF',
      '2 Modèl fakti fòma Excel ak Google Sheets',
      'Gid negosyasyon ak kliyan'
    ],
    purchaseInstructions: 'Ou resevwa lyen telechajman an nan espas pèsonèl ou sou sit la.',
    createdAt: '2024-02-20T15:00:00.000Z',
    updatedAt: '2024-02-20T15:00:00.000Z',
  }
];
