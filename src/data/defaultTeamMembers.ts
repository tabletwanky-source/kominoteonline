import { TeamMember } from '../types/database';

export const DEFAULT_FOUNDER_MEMBER: TeamMember = {
  id: 'dr-wanky-massenat',
  name: 'Dr Wanky Massenat',
  professional_title: 'Medikal • Espesyalis nan Teknoloji • Webmaster • Antreprenè',
  role: 'Fondatè Kominote Online',
  organizations: [
    'Massenat Consulting Group',
    'Wanky Academy'
  ],
  photo: 'https://i.postimg.cc/vH7SzM7b/6.png',
  bio: 'Dr Wanky Massenat se yon pwofesyonèl nan domèn medikal ak teknoloji, yon webmaster ak antreprenè. Li se fondatè Kominote Online, Massenat Consulting Group ak Wanky Academy. Atravè teknoloji ak edikasyon, li travay pou rann konesans ak konpetans pratik pi aksesib epi kreye plis opòtinite pou moun aprann, devlope ak avanse.',
  social_links: {
    linkedin: '',
    twitter: '',
    facebook: '',
  },
  display_order: 1,
  is_active: true,
  created_at: '2024-01-01T00:00:00.000Z',
};

export const DEFAULT_TEAM_MEMBERS: TeamMember[] = [
  DEFAULT_FOUNDER_MEMBER,
];
