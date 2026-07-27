export type Experience = {
  number: string
  title: string
  eyebrow: string
  description: string
  accent: 'ember' | 'gold' | 'teal' | 'green'
}

export type DonationProgram = {
  id: 'moksha-base' | 'blood-cancer-nz'
  number: string
  eyebrow: string
  title: string
  description: string
  recipient: string
  provider: string
  url: string
  linkLabel: string
  details: string[]
  accent: 'gold' | 'green'
}

export const event = {
  name: 'Rhythms of Hope',
  maoriName: 'Te Hīkoi o te Tūmanako',
  tagline: 'A Journey of Resilience',
  organiser: 'Moksha Base',
  planningWindow: 'Proposed for October 2026',
  locationStatus: 'Venue and city to be confirmed',
  contactName: 'Abhishek Raj',
  contactRole: 'Band Manager — Moksha Base',
  contactEmail: 'info@mokshabase.com',
}

export const donationPrograms: DonationProgram[] = [
  {
    id: 'moksha-base',
    number: '01',
    eyebrow: 'Community programme',
    title: 'Strengthen local cancer support',
    description: 'Help Moksha Base create Rhythms of Hope, community events and meetups for people affected by cancer, and respond to immediate practical needs.',
    recipient: 'Moksha Base',
    provider: 'Stripe',
    url: 'https://donate.stripe.com/00w6oH2Ff7Pz9hd65rfjG04',
    linkLabel: 'Donate to Moksha Base',
    details: [
      'Choose any amount from NZ$10',
      'Named or anonymous acknowledgement',
    ],
    accent: 'green',
  },
  {
    id: 'blood-cancer-nz',
    number: '02',
    eyebrow: 'Blood cancer programme',
    title: 'Support Blood Cancer New Zealand',
    description: 'Give through the Hope community fundraising page supporting Blood Cancer New Zealand and its work for people and families affected by blood cancer.',
    recipient: 'Blood Cancer New Zealand',
    provider: 'Raisely',
    url: 'https://lbc-community-fundraising.raiselysite.com/hope',
    linkLabel: 'Donate to Blood Cancer NZ',
    details: [
      'Donation options shown on the campaign page',
      'Receipts and donor details handled there',
    ],
    accent: 'gold',
  },
]

export const experiences: Experience[] = [
  {
    number: '01',
    eyebrow: 'Words that carry hope',
    title: 'Book launch',
    description: 'Siva shares reflections from the book he is writing about treatment, hope, family, friendship, faith and resilience.',
    accent: 'ember',
  },
  {
    number: '02',
    eyebrow: 'Knowledge through connection',
    title: 'Awareness & conversation',
    description: 'A proposed session bringing healthcare voices, lived experience, caregivers and community perspectives into one thoughtful space.',
    accent: 'gold',
  },
  {
    number: '03',
    eyebrow: 'A place to meet',
    title: 'Shared meal',
    description: 'Time to connect, listen and build supportive relationships across patients, families, caregivers and the wider community.',
    accent: 'teal',
  },
  {
    number: '04',
    eyebrow: 'The stage comes alive',
    title: 'Live concert',
    description: 'Moksha Base brings music and storytelling together in a celebration of courage, community and the people who walk beside us.',
    accent: 'green',
  },
]

export const values = [
  ['Awareness', 'Encouraging informed conversations and recognising the value of early diagnosis.'],
  ['Connection', 'Creating room for patients, families, caregivers and professionals to meet.'],
  ['Wellbeing', 'Using music and storytelling to support reflection, belonging and healing.'],
  ['Community', 'Honouring the networks of friendship, faith, care and practical support around every person.'],
]

export const futureFeatures = {
  tickets: { enabled: false, label: 'Tickets' },
  donations: { enabled: true, label: 'Donations' },
  merchandise: { enabled: false, label: 'Merchandise' },
}
