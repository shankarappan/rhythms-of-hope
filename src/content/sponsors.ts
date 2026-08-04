export type SponsorTier = 'silver' | 'bronze' | 'catering' | 'production'

export type Sponsor = {
  name: string
  tier: SponsorTier
  image: string
  tone: 'light' | 'dark'
}

export const sponsors: Sponsor[] = [
  {
    name: 'Team Jack — Lugtons',
    tier: 'silver',
    image: '/sponsor-team-jack-lugtons.png',
    tone: 'dark',
  },
  {
    name: 'Sehion Tours & Travels',
    tier: 'bronze',
    image: '/sponsor-sehion-travels.png',
    tone: 'light',
  },
  {
    name: 'FG Group — General, Life & Finance',
    tier: 'bronze',
    image: '/sponsor-fg-insurance.png',
    tone: 'light',
  },
  {
    name: 'Great Flavours of India — Horsham Downs, Hamilton',
    tier: 'bronze',
    image: '/sponsor-great-flavours-india.jpg',
    tone: 'light',
  },
  {
    name: 'Pappadomz',
    tier: 'catering',
    image: '/sponsor-pappadomz.png',
    tone: 'dark',
  },
  {
    name: 'Shelz Media',
    tier: 'production',
    image: '/sponsor-shelz-media.webp',
    tone: 'dark',
  },
]
