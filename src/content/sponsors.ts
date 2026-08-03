export type SponsorTier = 'silver' | 'bronze' | 'catering'

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
    name: 'Flavours of India',
    tier: 'bronze',
    image: '/sponsor-flavours-india.jpg',
    tone: 'dark',
  },
  {
    name: 'Pappadomz',
    tier: 'catering',
    image: '/sponsor-pappadomz.png',
    tone: 'dark',
  },
]
