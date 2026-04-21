/** Default seed data — aligned with wedding planner spec */

export const STORAGE_KEY = 'aifora-wedding-planner-v1';

/** Six studio palettes — swatches left→right for picker cards */
export const THEMES = [
  {
    id: 'ivory_silk',
    nl: 'Ivory Silk',
    en: 'Ivory Silk',
    fr: 'Ivory Silk',
    nlSub: 'ivoor, champagne & beige',
    enSub: 'ivory, champagne & beige',
    frSub: 'ivoire, champagne & beige',
    swatches: ['#908578', '#E8DFD4', '#FDFBF7'],
  },
  {
    id: 'white_linen',
    nl: 'White Linen',
    en: 'White Linen',
    fr: 'White Linen',
    nlSub: 'wit, crème & goud',
    enSub: 'white, cream & gold',
    frSub: 'blanc, crème & or',
    swatches: ['#C4A050', '#F5F0E8', '#FFFFFF'],
  },
  {
    id: 'sky_silk',
    nl: 'Sky Silk',
    en: 'Sky Silk',
    fr: 'Sky Silk',
    nlSub: 'lichtblauw, wit & zilver',
    enSub: 'soft blue, white & silver',
    frSub: 'bleu clair, blanc & argent',
    swatches: ['#8FA9BC', '#E8EEF5', '#FFFFFF'],
  },
  {
    id: 'linen_ledger',
    nl: 'Linen Ledger',
    en: 'Linen Ledger',
    fr: 'Linen Ledger',
    nlSub: 'minimalistisch taupe',
    enSub: 'minimal taupe',
    frSub: 'taupe minimaliste',
    swatches: ['#6B5E52', '#C9C4BC', '#FFFFFF'],
  },
  {
    id: 'rose_veil',
    nl: 'Rose Veil',
    en: 'Rose Veil',
    fr: 'Rose Veil',
    nlSub: 'taupe, crème & zacht roze',
    enSub: 'taupe, cream & soft rose',
    frSub: 'taupe, crème & rose doux',
    swatches: ['#C9A9A6', '#F0E4E2', '#FFFFFF'],
  },
  {
    id: 'woodland_sage',
    nl: 'Woodland Sage',
    en: 'Woodland Sage',
    fr: 'Woodland Sage',
    nlSub: 'saliegroen, wit & hout',
    enSub: 'sage green, white & wood',
    frSub: 'vert sauge, blanc & bois',
    swatches: ['#9BA897', '#E4EDE5', '#FFFFFF'],
  },
];

export const LEGACY_THEME_MAP = {
  sesame: 'ivory_silk',
  blush: 'rose_veil',
  meadow: 'woodland_sage',
  linen: 'linen_ledger',
};

export const DEFAULT_CATEGORIES = [
  'Venue & Catering',
  'Photo & Video',
  'Design & Florals',
  'Entertainment',
  'Attire',
  'Stationery',
  'Transport',
  'Cake & Desserts',
  'Favors & Gifts',
  'Beauty',
  'Honeymoon',
  'Misc/Buffer',
];

export const PAYMENT_TYPES = ['cash', 'card', 'transfer', 'other', 'unpaid'];

export const RSVP_OPTS = ['pending', 'yes', 'no'];

export const TABLE_TYPES = ['sweetheart', 'family', 'friends', 'kids'];

export const PARTY_ROLES = [
  'Bridesmaid',
  'Groomsman',
  'Maid of Honor',
  'Best Man',
  'Flower Girl',
  'Ring Bearer',
  'Other',
];

export const DEFAULT_DAY_FLOW = [
  { time: '09:00', event: 'Hair and makeup arrival', location: '', who: '', notes: '', eventDate: '' },
  { time: '10:30', event: 'Partner & prep portraits', location: '', who: '', notes: '', eventDate: '' },
  { time: '11:30', event: 'First look reveal', location: '', who: '', notes: '', eventDate: '' },
  { time: '12:30', event: 'Depart for venue', location: '', who: '', notes: '', eventDate: '' },
  { time: '14:00', event: 'Ceremony', location: '', who: '', notes: '', eventDate: '' },
  { time: '15:00', event: 'Cocktail hour', location: '', who: '', notes: '', eventDate: '' },
  { time: '17:00', event: 'Dinner service', location: '', who: '', notes: '', eventDate: '' },
  { time: '20:00', event: 'First dance', location: '', who: '', notes: '', eventDate: '' },
  { time: '22:00', event: 'Party starts', location: '', who: '', notes: '', eventDate: '' },
  { time: '00:00', event: 'Sparkler send-off', location: '', who: '', notes: '', eventDate: '' },
];

export const DEFAULT_SONG_SLOTS = [
  'Ceremony Processional',
  'Ceremony Recessional',
  'Cocktail Mix',
  'First Dance',
  'Parent Dances',
  'Cake Cutting',
  'Last Dance',
];

export function uid(prefix = 'id') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Photo checklist seed — collapsible sections per spec */
export function createDefaultPhotoSections() {
  const item = (description, priority = 'must') => ({
    id: uid('phi'),
    done: false,
    description,
    priority,
    notes: '',
  });

  return [
    {
      id: uid('phsec'),
      titleKey: 'photoSecGettingReady',
      customTitle: '',
      items: [
        item('Rings, invitation & shoes flat lay'),
        item('Dress / suit hanging — detail shot'),
        item('Hair styling — progress'),
        item('Makeup — detail & lashes'),
        item('Stepping into dress / final tailoring'),
        item('Bridal party helping + champagne toast'),
        item('Letter or gift exchange (optional)'),
        item('Bridal portrait — natural light'),
        item('Partner prep — attire & accessories'),
      ],
    },
    {
      id: uid('phsec'),
      titleKey: 'photoSecCeremony',
      customTitle: '',
      items: [
        item('Venue wide — empty space'),
        item('Processional — full aisle'),
        item('Ceremony overview — guests & altar'),
        item('Vows & ring exchange'),
        item('First kiss'),
        item('Signing / unity ritual (if any)'),
        item('Recessional — joy & confetti'),
        item('Receiving line or exit hugs'),
      ],
    },
    {
      id: uid('phsec'),
      titleKey: 'photoSecFamily',
      customTitle: '',
      items: [
        item('Couple + bride parents'),
        item('Couple + groom parents'),
        item('Both families together'),
        item('Siblings & grandparents combo'),
      ],
    },
    {
      id: uid('phsec'),
      titleKey: 'photoSecBridalParty',
      customTitle: '',
      items: [
        item('Full bridal party — formal'),
        item('Bridal party — candid laugh'),
        item('Partner side — groomsmen'),
        item('Bride side — bridesmaids'),
      ],
    },
    {
      id: uid('phsec'),
      titleKey: 'photoSecCouple',
      customTitle: '',
      items: [
        item('Golden hour portraits'),
        item('Walking together — venue grounds'),
        item('Close embrace — editorial'),
        item('Veil / movement shot'),
      ],
    },
    {
      id: uid('phsec'),
      titleKey: 'photoSecReception',
      customTitle: '',
      items: [
        item('Room wide — tables & florals'),
        item('Place settings & stationery'),
        item('Cake & dessert table'),
        item('Speeches — emotion shots'),
      ],
    },
    {
      id: uid('phsec'),
      titleKey: 'photoSecCandid',
      customTitle: '',
      items: [
        item('Dance floor energy'),
        item('Kids & funny moments'),
        item('Older guests chatting'),
        item('Send-off / sparklers'),
      ],
    },
  ];
}

export function emptyWeekendPack() {
  return {
    rehearsal: [],
    welcome: [],
    brunch: [],
    activities: [],
  };
}

export function migrateWeekendEventsToPack(weekendEvents) {
  const pack = emptyWeekendPack();
  if (!Array.isArray(weekendEvents) || !weekendEvents.length) return pack;
  pack.rehearsal = weekendEvents.map((ev) => ({
    id: ev.id || uid('we'),
    title: ev.title || '',
    location: '',
    time: '',
    guestList: '',
    menu: '',
    notes: typeof ev.details === 'string' ? ev.details : '',
  }));
  return pack;
}

export function newWeekendEvent() {
  return {
    id: uid('we'),
    title: '',
    location: '',
    time: '',
    guestList: '',
    menu: '',
    notes: '',
  };
}

/** Keeps default shot lists when upgrading old saves; preserves extra custom sections */
export function mergePhotoSectionsFromPersist(p) {
  const d = createDefaultPhotoSections();
  if (!Array.isArray(p.photoSections) || !p.photoSections.length) return d;
  const merged = d.map((defSec, i) => {
    const saved = p.photoSections[i];
    if (!saved) return defSec;
    return {
      ...defSec,
      ...saved,
      titleKey: saved.titleKey || defSec.titleKey,
      customTitle: typeof saved.customTitle === 'string' ? saved.customTitle : '',
      items:
        Array.isArray(saved.items) && saved.items.length ? saved.items : defSec.items,
    };
  });
  return [...merged, ...p.photoSections.slice(d.length)];
}

export const DEFAULT_MILESTONES = [
  {
    phase: '12+ months',
    tasks: ['Book venue', 'Set date', 'Draft guest list'],
  },
  {
    phase: '9 months',
    tasks: ['Photographer', 'Catering tastings', 'Dress shopping'],
  },
  {
    phase: '6 months',
    tasks: ['Invitations', 'Florist', 'Music'],
  },
  {
    phase: '3 months',
    tasks: ['Final menu', 'Rings', 'Hair / makeup trial'],
  },
  {
    phase: '1 month',
    tasks: ['Seating', 'Vendor confirmations', 'Honeymoon'],
  },
  {
    phase: '1 week',
    tasks: ['Emergency kit', 'Tips envelopes', 'Rest'],
  },
].map((phase) => ({
  id: uid('ms'),
  label: phase.phase,
  tasks: phase.tasks.map((label) => ({ id: uid('mst'), label, done: false })),
}));

export function createInitialState() {
  return {
    lang: 'nl',
    textDir: 'ltr',
    coupleNames: '',
    weddingDate: '',
    rsvpDeadline: '',
    rsvpFormIntro: '',
    rsvpContactEmail: '',
    rsvpShareUrl: '',
    totalBudget: 0,
    guestCount: '',
    currency: 'EUR',
    themeId: 'ivory_silk',
    categories: DEFAULT_CATEGORIES.map((name) => ({
      id: uid('cat'),
      name,
      budgeted: 0,
      paid: '',
      vendor: '',
      dueDate: '',
      status: 'on_track',
      notes: '',
    })),
    payments: [],
    vendors: [],
    decisionGroups: [],
    guests: [],
    tables: [],
    partyMembers: [],
    dayFlow: DEFAULT_DAY_FLOW.map((row) => ({ ...row, id: uid('df') })),
    gifts: [],
    songs: DEFAULT_SONG_SLOTS.map((moment) => ({
      id: uid('sg'),
      moment,
      title: '',
      artist: '',
      notes: '',
    })),
    photoSections: createDefaultPhotoSections(),
    weekendPack: emptyWeekendPack(),
    weekendEvents: [],
    milestonePhases: DEFAULT_MILESTONES.map((p) => ({
      ...p,
      tasks: p.tasks.map((x) => ({ ...x })),
    })),
    planningTone: 'casual',
    vendorAnswers: {},
  };
}
