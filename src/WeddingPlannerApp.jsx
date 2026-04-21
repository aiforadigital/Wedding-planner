import React, { useEffect, useMemo, useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Heart,
  Plus,
  Trash2,
  Crown,
  Download,
  Upload,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Printer,
  Clock,
  Check,
  Copy,
  ExternalLink,
  Mail,
  X,
} from 'lucide-react';
import { TAB_ORDER, t } from './i18n.js';
import {
  STORAGE_KEY,
  THEMES,
  createInitialState,
  uid,
  PAYMENT_TYPES,
  RSVP_OPTS,
  TABLE_TYPES,
  PARTY_ROLES,
  mergePhotoSectionsFromPersist,
  newWeekendEvent,
  migrateWeekendEventsToPack,
  LEGACY_THEME_MAP,
} from './defaults.js';

function normalizeThemeId(raw) {
  const mapped = LEGACY_THEME_MAP[raw] || raw;
  return THEMES.some((t) => t.id === mapped) ? mapped : 'ivory_silk';
}

/** ISO yyyy-mm-dd → localized long date for RSVP lines */
function formatIsoDateLong(iso, lang) {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return '';
  const locale = lang === 'nl' ? 'nl-NL' : lang === 'fr' ? 'fr-FR' : 'en-US';
  const [y, mo, d] = iso.split('-').map((x) => parseInt(x, 10));
  return new Date(y, mo - 1, d).toLocaleDateString(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function htmlEsc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Los HTML-bestand voor gasten — mailto na invullen */
function buildRsvpStandaloneHtml(state, tr) {
  const couple = htmlEsc(state.coupleNames || tr('guestRsvpPlaceholderCouple'));
  const dateStr = state.weddingDate ? htmlEsc(formatIsoDateLong(state.weddingDate, state.lang)) : '—';
  const deadlineStr = state.rsvpDeadline ? htmlEsc(formatIsoDateLong(state.rsvpDeadline, state.lang)) : '—';
  const intro = htmlEsc(state.rsvpFormIntro || '').replace(/\n/g, '<br/>');
  const emailRaw = state.rsvpContactEmail ? String(state.rsvpContactEmail).trim() : '';

  const L = {
    title: htmlEsc(tr('guestRsvpTitle')),
    deadline: htmlEsc(tr('guestRsvpDeadlineLine')),
    ln: htmlEsc(tr('guestRsvpName')),
    la: htmlEsc(tr('guestRsvpAttendance')),
    ly: htmlEsc(tr('guestRsvpYes')),
    ln2: htmlEsc(tr('guestRsvpNo')),
    lm: htmlEsc(tr('guestRsvpMaybe')),
    lp: htmlEsc(tr('guestRsvpPartySize')),
    ld: htmlEsc(tr('guestRsvpDiet')),
    lo: htmlEsc(tr('guestRsvpNotes')),
    sub: htmlEsc(tr('guestRsvpSubmitMail')),
    wed: htmlEsc(tr('guestRsvpWeddingOn')),
    foot: htmlEsc(tr('guestRsvpFooterNote')),
    pick: htmlEsc(tr('guestRsvpPickOption')),
  };

  const scriptBody = emailRaw
    ? `var em=${JSON.stringify(emailRaw)};if(em){window.location.href='mailto:'+em+'?subject='+subj+'&body='+body;}`
    : `alert(${JSON.stringify(tr('guestRsvpNoEmailAlert'))});`;

  const script = `document.getElementById('rsvp-f').addEventListener('submit',function(e){
e.preventDefault();
var fd=new FormData(e.target);
var lines=[];
fd.forEach(function(v,k){lines.push(k+': '+v);});
var body=encodeURIComponent(lines.join('\\n'));
var subj=encodeURIComponent(${JSON.stringify(tr('guestRsvpMailSubject'))});
${scriptBody}});`;

  return `<!DOCTYPE html>
<html lang="${state.lang}">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${L.title}</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&family=Dancing+Script:wght@600&display=swap" rel="stylesheet" />
<style>
body{font-family:Inter,system-ui,sans-serif;background:#f9f7f2;color:#5c524a;margin:0;padding:2rem;line-height:1.5;}
.wrap{max-width:32rem;margin:0 auto;background:#fdfbf7;border:1px solid rgba(92,82,74,.2);border-radius:1rem;padding:2rem;box-shadow:0 8px 32px rgba(63,60,55,.08);}
h1{font-family:'Dancing Script',cursive;font-size:2rem;margin:0 0 .5rem;}
.meta{font-size:.9rem;opacity:.85;margin-bottom:1rem;}
label{display:block;font-size:.72rem;text-transform:uppercase;letter-spacing:.18em;margin-top:1rem;margin-bottom:.35rem;}
input,select,textarea{width:100%;box-sizing:border-box;padding:.65rem .75rem;border-radius:.5rem;border:1px solid rgba(92,82,74,.25);background:#f2ede4;font:inherit;}
textarea{min-height:5rem;}
button{margin-top:1.25rem;background:#5c524a;color:#fdfbf7;border:none;padding:.65rem 1.25rem;border-radius:999px;font-weight:600;cursor:pointer;width:100%;}
.intro{margin-bottom:1rem;font-size:.95rem;}
.note{font-size:.75rem;margin-top:1rem;opacity:.75;}
</style>
</head>
<body>
<div class="wrap">
<h1>${couple}</h1>
<p class="meta">${L.wed}: ${dateStr}<br/>${L.deadline}: ${deadlineStr}</p>
${intro ? `<div class="intro">${intro}</div>` : ''}
<form id="rsvp-f">
<label>${L.ln}</label><input name="guest_name" required autocomplete="name" />
<label>${L.la}</label>
<select name="attendance" required>
<option value="">${L.pick}</option>
<option value="yes">${L.ly}</option>
<option value="no">${L.ln2}</option>
<option value="maybe">${L.lm}</option>
</select>
<label>${L.lp}</label><input name="party_size" type="number" min="1" value="1" />
<label>${L.ld}</label><textarea name="dietary"></textarea>
<label>${L.lo}</label><textarea name="notes"></textarea>
<button type="submit">${L.sub}</button>
</form>
<p class="note">${L.foot}</p>
</div>
<script>${script}</script>
</body>
</html>`;
}

function pick(lang, { nl, fr, en }) {
  if (lang === 'nl') return nl;
  if (lang === 'fr') return fr ?? en;
  return en;
}

function themeLabel(th, lang) {
  return pick(lang, { nl: th.nl, fr: th.fr ?? th.en, en: th.en });
}

function themeSub(th, lang) {
  return pick(lang, { nl: th.nlSub, fr: th.frSub ?? th.enSub, en: th.enSub });
}

const TAB_I18N = {
  welcome: 'tabWelcome',
  snapshot: 'tabSnapshot',
  budget: 'tabBudget',
  payments: 'tabPayments',
  vendors: 'tabVendors',
  decisions: 'tabDecisions',
  guests: 'tabGuests',
  tables: 'tabTables',
  party: 'tabParty',
  dayflow: 'tabDayFlow',
  gifts: 'tabGifts',
  songs: 'tabSongs',
  photo: 'tabPhoto',
  weekend: 'tabWeekend',
  milestones: 'tabMilestones',
  questions: 'tabQuestions',
  guide: 'tabGuide',
  settings: 'tabSettings',
};

const COLORS = ['#A08B7A', '#D4A5A5', '#B5B8A8', '#7A6B5C', '#B8847E', '#8B5A5A'];

function loadRaw() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createInitialState();
    const p = JSON.parse(raw);
    return mergeWithDefaults(p);
  } catch {
    return createInitialState();
  }
}

function mergeWithDefaults(p) {
  const d = createInitialState();
  const hasWeekendPack =
    p.weekendPack &&
    typeof p.weekendPack === 'object' &&
    ['rehearsal', 'welcome', 'brunch', 'activities'].every((k) => k in p.weekendPack);

  const weekendPack = hasWeekendPack
    ? {
        rehearsal: Array.isArray(p.weekendPack.rehearsal) ? p.weekendPack.rehearsal : [],
        welcome: Array.isArray(p.weekendPack.welcome) ? p.weekendPack.welcome : [],
        brunch: Array.isArray(p.weekendPack.brunch) ? p.weekendPack.brunch : [],
        activities: Array.isArray(p.weekendPack.activities) ? p.weekendPack.activities : [],
      }
    : migrateWeekendEventsToPack(p.weekendEvents);

  return {
    ...d,
    ...p,
    lang: ['nl', 'en', 'fr'].includes(p.lang) ? p.lang : 'nl',
    themeId: normalizeThemeId(p.themeId),
    textDir: p.textDir === 'rtl' ? 'rtl' : 'ltr',
    planningTone: ['formal', 'casual', 'playful'].includes(p.planningTone) ? p.planningTone : 'casual',
    categories: Array.isArray(p.categories) && p.categories.length ? p.categories : d.categories,
    payments: Array.isArray(p.payments) ? p.payments : [],
    vendors: Array.isArray(p.vendors) ? p.vendors : [],
    decisionGroups: Array.isArray(p.decisionGroups) ? p.decisionGroups : [],
    guests: Array.isArray(p.guests) ? p.guests : [],
    tables: Array.isArray(p.tables) ? p.tables : [],
    partyMembers: Array.isArray(p.partyMembers) ? p.partyMembers : [],
    dayFlow:
      Array.isArray(p.dayFlow) && p.dayFlow.length
        ? p.dayFlow.map((row) => ({
            ...row,
            eventDate: row.eventDate !== undefined && row.eventDate !== null ? row.eventDate : '',
          }))
        : d.dayFlow,
    gifts: Array.isArray(p.gifts) ? p.gifts : [],
    songs: Array.isArray(p.songs) && p.songs.length ? p.songs : d.songs,
    photoSections: mergePhotoSectionsFromPersist(p),
    weekendPack,
    weekendEvents: Array.isArray(p.weekendEvents) ? p.weekendEvents : [],
    milestonePhases: Array.isArray(p.milestonePhases) && p.milestonePhases.length
      ? p.milestonePhases
      : d.milestonePhases,
    vendorAnswers: p.vendorAnswers && typeof p.vendorAnswers === 'object' ? p.vendorAnswers : {},
    rsvpDeadline: typeof p.rsvpDeadline === 'string' ? p.rsvpDeadline : d.rsvpDeadline,
    rsvpFormIntro: typeof p.rsvpFormIntro === 'string' ? p.rsvpFormIntro : d.rsvpFormIntro,
    rsvpContactEmail: typeof p.rsvpContactEmail === 'string' ? p.rsvpContactEmail : d.rsvpContactEmail,
    rsvpShareUrl: typeof p.rsvpShareUrl === 'string' ? p.rsvpShareUrl : d.rsvpShareUrl,
  };
}

function spentByCategory(categories, payments) {
  const map = {};
  payments.forEach((p) => {
    const k = p.categoryName || '';
    if (!k) return;
    map[k] = (map[k] || 0) + (Number(p.amount) || 0);
  });
  return categories.map((c) => ({
    name: c.name,
    budgeted: Number(c.budgeted) || 0,
    spent: map[c.name] || 0,
  }));
}

function totalSpent(payments) {
  return payments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
}

function GuestRsvpScreen({
  state,
  tr,
  cardStyle,
  welcomeInputStyle,
  onClose,
  formatIsoDateLong,
  btnPrimary,
}) {
  const [guestName, setGuestName] = useState('');
  const [attendance, setAttendance] = useState('');
  const [partySize, setPartySize] = useState(1);
  const [dietary, setDietary] = useState('');
  const [guestNotes, setGuestNotes] = useState('');

  const couple = state.coupleNames || tr('guestRsvpPlaceholderCouple');
  const wed = state.weddingDate ? formatIsoDateLong(state.weddingDate, state.lang) : '—';
  const rsvpUntil = state.rsvpDeadline ? formatIsoDateLong(state.rsvpDeadline, state.lang) : '—';

  function submitGuest(e) {
    e.preventDefault();
    const em = (state.rsvpContactEmail || '').trim();
    const lines = [
      `guest_name: ${guestName}`,
      `attendance: ${attendance}`,
      `party_size: ${partySize}`,
      `dietary: ${dietary}`,
      `notes: ${guestNotes}`,
    ];
    const body = encodeURIComponent(lines.join('\n'));
    const subj = encodeURIComponent(tr('guestRsvpMailSubject'));
    if (em) {
      window.location.href = `mailto:${em}?subject=${subj}&body=${body}`;
    } else {
      alert(tr('guestRsvpNoEmailAlert'));
    }
  }

  return (
    <div className="min-h-screen pb-16" style={{ background: 'var(--cream-bg)', color: 'var(--taupe-deep)' }}>
      <div className="mx-auto flex max-w-lg items-center justify-between px-4 pt-6">
        <p className="font-script text-xl font-semibold">{couple}</p>
        <button
          type="button"
          className="flex items-center gap-1 rounded-full border px-3 py-2 text-sm"
          style={{ borderColor: 'rgba(122,107,92,0.35)', background: 'var(--ivory-card)' }}
          onClick={onClose}
        >
          <X className="h-4 w-4" aria-hidden /> {tr('guestRsvpClose')}
        </button>
      </div>
      <main className="mx-auto max-w-lg px-4 pb-16 pt-8">
        <section className="rounded-3xl border p-8" style={{ ...cardStyle }}>
          <h1 className="font-script text-center text-4xl font-semibold leading-tight">{tr('guestRsvpTitle')}</h1>
          <p className="mt-4 text-center text-sm text-neutral-600">
            <span className="block">{tr('guestRsvpWeddingOn')}: {wed}</span>
            <span className="block">{tr('guestRsvpDeadlineLine')}: {rsvpUntil}</span>
          </p>
          {state.rsvpFormIntro ? (
            <p className="mt-6 whitespace-pre-wrap text-sm leading-relaxed text-neutral-700">{state.rsvpFormIntro}</p>
          ) : null}
          <form className="mt-8 space-y-4" onSubmit={submitGuest}>
            <label className="flex flex-col gap-2">
              <span className="label-cap">{tr('guestRsvpName')}</span>
              <input
                required
                className="rounded-xl px-4 py-3 text-neutral-800 outline-none ring-offset-2 focus:ring-2 focus:ring-opacity-40"
                style={welcomeInputStyle}
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="label-cap">{tr('guestRsvpAttendance')}</span>
              <select
                required
                className="rounded-xl px-4 py-3 text-neutral-800 outline-none ring-offset-2 focus:ring-2 focus:ring-opacity-40"
                style={welcomeInputStyle}
                value={attendance}
                onChange={(e) => setAttendance(e.target.value)}
              >
                <option value="">{tr('guestRsvpPickOption')}</option>
                <option value="yes">{tr('guestRsvpYes')}</option>
                <option value="no">{tr('guestRsvpNo')}</option>
                <option value="maybe">{tr('guestRsvpMaybe')}</option>
              </select>
            </label>
            <label className="flex flex-col gap-2">
              <span className="label-cap">{tr('guestRsvpPartySize')}</span>
              <input
                type="number"
                min={1}
                className="rounded-xl px-4 py-3 text-neutral-800 outline-none ring-offset-2 focus:ring-2 focus:ring-opacity-40"
                style={welcomeInputStyle}
                value={partySize}
                onChange={(e) => setPartySize(Number(e.target.value) || 1)}
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="label-cap">{tr('guestRsvpDiet')}</span>
              <textarea
                className="min-h-[5rem] rounded-xl px-4 py-3 text-neutral-800 outline-none ring-offset-2 focus:ring-2 focus:ring-opacity-40"
                style={welcomeInputStyle}
                value={dietary}
                onChange={(e) => setDietary(e.target.value)}
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="label-cap">{tr('guestRsvpNotes')}</span>
              <textarea
                className="min-h-[5rem] rounded-xl px-4 py-3 text-neutral-800 outline-none ring-offset-2 focus:ring-2 focus:ring-opacity-40"
                style={welcomeInputStyle}
                value={guestNotes}
                onChange={(e) => setGuestNotes(e.target.value)}
              />
            </label>
            <button type="submit" style={btnPrimary} className="mt-6 w-full">
              {tr('guestRsvpSubmitMail')}
            </button>
          </form>
          <p className="mt-6 text-xs leading-relaxed text-neutral-600">{tr('guestRsvpFooterNote')}</p>
        </section>
      </main>
    </div>
  );
}

export default function WeddingPlannerApp() {
  const [state, setState] = useState(loadRaw);
  const [tab, setTab] = useState('welcome');

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [state]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', state.themeId || 'ivory_silk');
    document.documentElement.lang = ['nl', 'en', 'fr'].includes(state.lang) ? state.lang : 'nl';
    document.documentElement.dir = state.textDir === 'rtl' ? 'rtl' : 'ltr';
  }, [state.themeId, state.lang, state.textDir]);

  const lang = state.lang;
  const tr = (k) => t(lang, k);

  const spendRows = useMemo(
    () => spentByCategory(state.categories, state.payments),
    [state.categories, state.payments]
  );

  const pieData = useMemo(
    () =>
      spendRows
        .filter((r) => r.spent > 0)
        .map((r) => ({ name: r.name, value: r.spent })),
    [spendRows]
  );

  const barData = useMemo(
    () =>
      spendRows.map((r) => ({
        name: r.name.length > 14 ? r.name.slice(0, 12) + '…' : r.name,
        budgeted: r.budgeted,
        spent: r.spent,
      })),
    [spendRows]
  );

  const guestsPendingRsvp = useMemo(
    () => state.guests.filter((g) => (g.rsvp || 'pending') === 'pending').length,
    [state.guests]
  );

  const total = Number(state.totalBudget) || 0;
  const spent = totalSpent(state.payments);
  const pct = total > 0 ? Math.round((spent / total) * 100) : 0;

  function exportJson() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'wedding-planner-backup.json';
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function importJson(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const p = JSON.parse(reader.result);
        setState(mergeWithDefaults(p));
      } catch {
        alert('Invalid JSON');
      }
    };
    reader.readAsText(file);
  }

  const cardStyle = {
    background: 'var(--ivory-card)',
    border: '1px solid rgba(122, 107, 92, 0.2)',
    borderRadius: '1rem',
    boxShadow: '0 2px 12px rgba(63, 60, 55, 0.06)',
  };

  const welcomeInputStyle = {
    background: '#f2ede4',
    border: '1px solid rgba(122, 107, 92, 0.12)',
  };

  const footerThemeMeta =
    THEMES.find((t) => t.id === normalizeThemeId(state.themeId)) || THEMES[0];

  const btnPrimary = {
    background: 'var(--dusty-rose)',
    color: '#fff',
    borderRadius: '999px',
    padding: '0.45rem 1rem',
    fontWeight: 600,
    fontSize: '0.875rem',
  };

  const tabBtn = (id, active) => ({
    borderRadius: '999px',
    padding: '0.42rem 0.95rem',
    fontWeight: active ? 600 : 500,
    fontSize: '0.8125rem',
    letterSpacing: active ? '0.02em' : '0',
    transition: 'background 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease',
    ...(active
      ? normalizeThemeId(state.themeId) === 'ivory_silk'
        ? {
            background: 'var(--taupe-deep)',
            color: '#fdfbf7',
            border: '1px solid rgba(52, 46, 42, 0.48)',
            boxShadow: '0 2px 12px rgba(42, 38, 34, 0.28)',
          }
        : {
            background: 'var(--muted-rose)',
            color: '#fff',
            border: '1px solid rgba(139, 90, 90, 0.38)',
            boxShadow: '0 2px 10px rgba(139, 90, 90, 0.22)',
          }
      : {
          background: 'rgba(253, 251, 247, 0.98)',
          color: 'var(--taupe-deep)',
          border: '1px solid rgba(122, 107, 92, 0.14)',
          boxShadow: '0 1px 2px rgba(63, 60, 55, 0.05)',
        }),
  });

  const [guestRsvpMode, setGuestRsvpMode] = useState(
    () => typeof window !== 'undefined' && window.location.hash === '#rsvp'
  );

  useEffect(() => {
    const sync = () => setGuestRsvpMode(window.location.hash === '#rsvp');
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, []);

  function downloadRsvpHtmlFile() {
    const html = buildRsvpStandaloneHtml(state, tr);
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'RSVP-formulier.html';
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function openGuestRsvp() {
    setGuestRsvpMode(true);
    window.location.hash = 'rsvp';
  }

  function copyRsvpInvite() {
    const dateI = state.weddingDate ? formatIsoDateLong(state.weddingDate, lang) : '—';
    const rsvpD = state.rsvpDeadline ? formatIsoDateLong(state.rsvpDeadline, lang) : '—';
    const base = `${window.location.origin}${window.location.pathname}`;
    const link = (state.rsvpShareUrl || '').trim() || `${base}#rsvp`;
    const text = [
      state.coupleNames || tr('guestRsvpPlaceholderCouple'),
      '',
      `${tr('rsvpInviteLine1')} ${dateI}`,
      `${tr('rsvpInviteLine2')} ${rsvpD}`,
      '',
      tr('rsvpInviteLine3'),
      link,
      '',
      tr('rsvpInviteLine4'),
    ].join('\n');
    navigator.clipboard.writeText(text).then(
      () => alert(tr('rsvpCopied')),
      () => alert(tr('rsvpCopyFailed'))
    );
  }

  if (guestRsvpMode) {
    return (
      <GuestRsvpScreen
        state={state}
        tr={tr}
        cardStyle={cardStyle}
        welcomeInputStyle={welcomeInputStyle}
        onClose={() => {
          window.history.replaceState(null, '', window.location.pathname + window.location.search);
          setGuestRsvpMode(false);
        }}
        formatIsoDateLong={formatIsoDateLong}
        btnPrimary={btnPrimary}
      />
    );
  }

  return (
    <div className="min-h-screen pb-16" style={{ background: 'var(--cream-bg)' }}>
      <header
        className="border-b border-black/10 no-print"
        style={{ borderColor: 'var(--taupe-deep)', borderOpacity: 0.15 }}
      >
        <div className="mx-auto flex max-w-6xl flex-wrap items-start justify-between gap-4 px-4 py-4">
            <div className="flex items-center gap-3">
            <Heart className="h-8 w-8 shrink-0" style={{ color: 'var(--taupe-primary)' }} aria-hidden />
            <div>
              <div
                className="font-script text-3xl font-semibold leading-tight sm:text-4xl"
                style={{ color: 'var(--taupe-deep)' }}
              >
                {tr('brand')}
              </div>
              <div className="label-cap mt-1">{tr('badgePremium')}</div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className="rounded-full px-3 py-1 text-xs" style={{ ...cardStyle, fontSize: '0.72rem' }}>
              {tr('badgePrivate')}
            </span>
            <div className="flex gap-1" role="group" aria-label={tr('langLabel')}>
              {['nl', 'en', 'fr'].map((l) => (
                <button
                  key={l}
                  type="button"
                  className="rounded-full px-3 py-1 text-sm font-medium transition"
                  style={tabBtn(l, state.lang === l)}
                  onClick={() => setState((s) => ({ ...s, lang: l }))}
                >
                  {l.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-6xl px-4 pb-5">
          <nav
            className="flex flex-wrap justify-center gap-x-2 gap-y-2 rounded-2xl border px-3 py-3 sm:px-4"
            style={{
              borderColor: 'rgba(122, 107, 92, 0.14)',
              background:
                'linear-gradient(180deg, rgba(253, 251, 247, 0.98), rgba(245, 239, 230, 0.42))',
              boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.75)',
            }}
            aria-label="Tabs"
          >
            {TAB_ORDER.map((id) => (
              <button
                key={id}
                type="button"
                className="transition hover:-translate-y-0.5"
                style={tabBtn(id, tab === id)}
                onClick={() => setTab(id)}
              >
                {tr(TAB_I18N[id])}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        {tab === 'welcome' && (
          <section
            className="mx-auto max-w-5xl rounded-3xl border p-8 transition-shadow duration-200 ease-in-out sm:p-10"
            style={{
              background: 'var(--ivory-card)',
              borderColor: 'rgba(122, 107, 92, 0.1)',
              boxShadow: '0 12px 48px rgba(63, 60, 55, 0.07)',
            }}
          >
            <h1
              className="font-script text-center text-4xl font-semibold leading-tight sm:text-5xl"
              style={{ color: 'var(--taupe-deep)' }}
            >
              {tr('welcomeHeadline')}
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-center font-sans text-sm italic leading-relaxed text-neutral-600 sm:text-base">
              {tr('welcomeSub')}
            </p>

            <div className="mt-8 grid gap-5 sm:grid-cols-2">
              <label className="flex flex-col gap-2">
                <span className="label-cap" style={{ color: 'var(--taupe-deep)' }}>
                  {tr('coupleLabel')}
                </span>
                <input
                  className="rounded-xl px-4 py-3 text-neutral-800 outline-none ring-offset-2 transition focus:ring-2 focus:ring-opacity-40"
                  style={welcomeInputStyle}
                  value={state.coupleNames}
                  onChange={(e) => setState((s) => ({ ...s, coupleNames: e.target.value }))}
                />
              </label>
              <label className="flex flex-col gap-2">
                <span className="label-cap" style={{ color: 'var(--taupe-deep)' }}>
                  {tr('dateLabel')}
                </span>
                <input
                  type="date"
                  className="rounded-xl px-4 py-3 text-neutral-800 outline-none ring-offset-2 transition focus:ring-2 focus:ring-opacity-40"
                  style={welcomeInputStyle}
                  value={state.weddingDate}
                  onChange={(e) => setState((s) => ({ ...s, weddingDate: e.target.value }))}
                />
              </label>
              <label className="flex flex-col gap-2">
                <span className="label-cap" style={{ color: 'var(--taupe-deep)' }}>
                  {tr('budgetLabel')}
                </span>
                <input
                  type="number"
                  min={0}
                  className="rounded-xl px-4 py-3 text-neutral-800 outline-none ring-offset-2 transition focus:ring-2 focus:ring-opacity-40"
                  style={welcomeInputStyle}
                  value={state.totalBudget || ''}
                  onChange={(e) =>
                    setState((s) => ({ ...s, totalBudget: Number(e.target.value) || 0 }))
                  }
                />
              </label>
              <label className="flex flex-col gap-2">
                <span className="label-cap" style={{ color: 'var(--taupe-deep)' }}>
                  {tr('guestsLabel')}
                </span>
                <input
                  className="rounded-xl px-4 py-3 text-neutral-800 outline-none ring-offset-2 transition focus:ring-2 focus:ring-opacity-40"
                  style={welcomeInputStyle}
                  value={state.guestCount}
                  onChange={(e) => setState((s) => ({ ...s, guestCount: e.target.value }))}
                />
              </label>
              <label className="flex flex-col gap-2">
                <span className="label-cap" style={{ color: 'var(--taupe-deep)' }}>
                  {tr('currencyLabel')}
                </span>
                <select
                  className="rounded-xl px-4 py-3 text-neutral-800 outline-none ring-offset-2 transition focus:ring-2 focus:ring-opacity-40"
                  style={welcomeInputStyle}
                  value={state.currency}
                  onChange={(e) => setState((s) => ({ ...s, currency: e.target.value }))}
                >
                  <option value="EUR">EUR</option>
                  <option value="USD">USD</option>
                  <option value="GBP">GBP</option>
                </select>
              </label>
              <label className="flex flex-col gap-2">
                <span className="label-cap" style={{ color: 'var(--taupe-deep)' }}>
                  {tr('langLabel')}
                </span>
                <select
                  className="rounded-xl px-4 py-3 text-neutral-800 outline-none ring-offset-2 transition focus:ring-2 focus:ring-opacity-40"
                  style={welcomeInputStyle}
                  value={state.lang}
                  onChange={(e) => setState((s) => ({ ...s, lang: e.target.value }))}
                >
                  <option value="nl">Nederlands</option>
                  <option value="en">English</option>
                  <option value="fr">Français</option>
                </select>
              </label>
            </div>

            <div className="mt-12">
              <p className="label-cap mb-4 text-center sm:text-left">{tr('themeLabel')}</p>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {THEMES.map((th) => {
                  const selected = state.themeId === th.id;
                  const sub = themeSub(th, lang);
                  const name = themeLabel(th, lang);
                  const neutralIvoryRing =
                    selected && th.id === 'ivory_silk' ? 'var(--taupe-deep)' : undefined;
                  const selRing = selected
                    ? neutralIvoryRing ?? 'var(--taupe-primary)'
                    : 'rgba(122, 107, 92, 0.16)';
                  const selCheck =
                    selected && th.id === 'ivory_silk'
                      ? 'var(--taupe-deep)'
                      : selected
                        ? 'var(--taupe-primary)'
                        : undefined;
                  return (
                    <button
                      key={th.id}
                      type="button"
                      aria-pressed={selected}
                      className="relative overflow-hidden rounded-2xl border text-left ring-1 ring-black/5 transition duration-200 ease-in-out hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                      style={{
                        borderColor: selRing,
                        borderWidth: selected ? '2px' : '1px',
                        background: 'var(--ivory-card)',
                        boxShadow: selected ? '0 10px 32px rgba(122, 107, 92, 0.14)' : '0 4px 16px rgba(63, 60, 55, 0.06)',
                      }}
                      onClick={() => setState((s) => ({ ...s, themeId: th.id }))}
                    >
                      {selected && (
                        <span
                          className="absolute right-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full shadow-md"
                          style={{
                            background: selCheck ?? 'var(--taupe-primary)',
                            color: th.id === 'ivory_silk' ? '#fdfbf7' : '#fff',
                          }}
                          aria-hidden
                        >
                          <Check className="h-4 w-4" strokeWidth={2.75} />
                        </span>
                      )}
                      <div
                        className="flex gap-2 border-b px-5 pb-4 pt-5"
                        style={{ borderColor: 'rgba(122, 107, 92, 0.1)' }}
                      >
                        {th.swatches.map((c, i) => (
                          <div
                            key={i}
                            className="min-h-[4.25rem] flex-1 rounded-xl shadow-inner ring-1 ring-black/5"
                            style={{ background: c }}
                          />
                        ))}
                      </div>
                      <div className="space-y-1 px-5 py-4">
                        <div className="font-script text-xl font-semibold leading-snug sm:text-2xl" style={{ color: 'var(--taupe-deep)' }}>
                          {name}
                        </div>
                        <p className="font-sans text-xs leading-relaxed text-neutral-500">{sub}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {tab === 'snapshot' && (
          <section className="space-y-6">
            <div>
              <h1 className="font-display text-3xl font-medium leading-tight tracking-tight sm:text-4xl" style={{ color: 'var(--taupe-deep)' }}>
                {tr('snapshotTitle')}
              </h1>
              <p className="mt-2 max-w-2xl text-base leading-relaxed text-neutral-600">{tr('snapshotIntro')}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {[
                ['snapTotal', total],
                ['snapSpent', spent],
                ['snapRemain', total - spent],
                ['snapPct', pct + '%'],
                ['snapBuffer', 0],
              ].map(([key, val]) => (
                <div key={key} style={cardStyle} className="p-4">
                  <div className="label-cap">{tr(key)}</div>
                  <div className="mt-2 text-2xl font-semibold" style={{ color: 'var(--taupe-deep)' }}>
                    {typeof val === 'number' && key !== 'snapPct'
                      ? `${state.currency === 'USD' ? '$' : state.currency === 'GBP' ? '£' : '€'} ${val.toLocaleString()}`
                      : val}
                  </div>
                </div>
              ))}
            </div>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              {[
                ['vendors', 'widgetVendors'],
                ['guests', 'widgetRsvp'],
                ['gifts', 'widgetGift'],
                ['tables', 'widgetTables'],
              ].map(([target, label]) =>
                target === 'guests' ? (
                  <button
                    key="guests"
                    type="button"
                    style={cardStyle}
                    className="flex flex-col items-start p-4 text-left transition hover:-translate-y-0.5"
                    onClick={() => setTab('guests')}
                  >
                    <span className="label-cap">{tr(label)}</span>
                    <span
                      className="mt-2 text-3xl font-semibold tabular-nums"
                      style={{ color: 'var(--taupe-deep)' }}
                    >
                      {guestsPendingRsvp}
                    </span>
                    <p className="mt-2 text-xs leading-snug text-neutral-600">
                      {state.rsvpDeadline
                        ? `${tr('snapRsvpUiterlijk')}: ${formatIsoDateLong(state.rsvpDeadline, lang)}`
                        : tr('snapRsvpNoDeadline')}
                    </p>
                    <span className="mt-3 text-sm font-medium text-[#7a6b5c]">{tr('snapGoTo')} →</span>
                  </button>
                ) : (
                  <button
                    key={target}
                    type="button"
                    style={cardStyle}
                    className="flex flex-col items-start p-4 text-left transition hover:-translate-y-0.5"
                    onClick={() => setTab(target)}
                  >
                    <span className="label-cap">{tr(label)}</span>
                    <span className="mt-2 text-sm font-medium text-[#7a6b5c]">{tr('snapGoTo')} →</span>
                  </button>
                )
              )}
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div style={cardStyle} className="p-4">
                <div className="label-cap mb-4">{tr('snapPieLegend')}</div>
                <div className="h-64">
                  {pieData.length ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90}>
                          {pieData.map((_, i) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="py-12 text-center text-sm opacity-60">{tr('empty')}</p>
                  )}
                </div>
              </div>
              <div style={cardStyle} className="p-4">
                <div className="label-cap mb-4">{tr('snapBarLegend')}</div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData}>
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="budgeted" fill="#B5B8A8" name="Budgeted" />
                      <Bar dataKey="spent" fill="#A08B7A" name="Spent" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div style={cardStyle} className="overflow-x-auto p-4">
              <div className="label-cap mb-3">{tr('snapTableTitle')}</div>
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b border-black/10 text-left">
                    <th className="py-2 pr-2">{tr('thCategory')}</th>
                    <th className="py-2 pr-2">{tr('thBudgeted')}</th>
                    <th className="py-2 pr-2">{tr('thSpent')}</th>
                    <th className="py-2">{tr('thRemain')}</th>
                  </tr>
                </thead>
                <tbody>
                  {spendRows.map((r) => (
                    <tr key={r.name} className="border-b border-black/5">
                      <td className="py-2 pr-2">{r.name}</td>
                      <td className="py-2 pr-2">{r.budgeted}</td>
                      <td className="py-2 pr-2">{r.spent}</td>
                      <td className="py-2">{r.budgeted - r.spent}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {tab === 'budget' && (
          <BudgetPanel state={state} setState={setState} tr={tr} lang={lang} cardStyle={cardStyle} btnPrimary={btnPrimary} />
        )}

        {tab === 'payments' && (
          <PaymentsPanel state={state} setState={setState} tr={tr} lang={lang} cardStyle={cardStyle} btnPrimary={btnPrimary} />
        )}

        {tab === 'vendors' && (
          <VendorsPanel state={state} setState={setState} tr={tr} cardStyle={cardStyle} btnPrimary={btnPrimary} />
        )}

        {tab === 'decisions' && (
          <DecisionsPanel state={state} setState={setState} tr={tr} cardStyle={cardStyle} btnPrimary={btnPrimary} />
        )}

        {tab === 'guests' && (
          <GuestsPanel
            state={state}
            setState={setState}
            tr={tr}
            cardStyle={cardStyle}
            btnPrimary={btnPrimary}
            welcomeInputStyle={welcomeInputStyle}
            openGuestRsvp={openGuestRsvp}
            downloadRsvpHtmlFile={downloadRsvpHtmlFile}
            copyRsvpInvite={copyRsvpInvite}
          />
        )}

        {tab === 'tables' && (
          <TablesPanel state={state} setState={setState} tr={tr} cardStyle={cardStyle} btnPrimary={btnPrimary} />
        )}

        {tab === 'party' && (
          <PartyPanel state={state} setState={setState} tr={tr} lang={lang} cardStyle={cardStyle} btnPrimary={btnPrimary} />
        )}

        {tab === 'dayflow' && (
          <DayFlowPanel state={state} setState={setState} tr={tr} lang={lang} cardStyle={cardStyle} btnPrimary={btnPrimary} />
        )}

        {tab === 'gifts' && (
          <GiftsPanel state={state} setState={setState} tr={tr} lang={lang} cardStyle={cardStyle} btnPrimary={btnPrimary} />
        )}

        {tab === 'songs' && (
          <SongsPanel state={state} setState={setState} tr={tr} lang={lang} cardStyle={cardStyle} btnPrimary={btnPrimary} />
        )}

        {tab === 'photo' && (
          <PhotoPanel state={state} setState={setState} tr={tr} lang={lang} cardStyle={cardStyle} btnPrimary={btnPrimary} />
        )}

        {tab === 'weekend' && (
          <WeekendPanel state={state} setState={setState} tr={tr} cardStyle={cardStyle} btnPrimary={btnPrimary} />
        )}

        {tab === 'milestones' && (
          <MilestonesPanel state={state} setState={setState} tr={tr} cardStyle={cardStyle} />
        )}

        {tab === 'questions' && <QuestionsPanel tr={tr} lang={lang} cardStyle={cardStyle} />}

        {tab === 'guide' && (
          <section style={cardStyle} className="p-6">
            <h1 className="font-display text-3xl font-medium leading-tight tracking-tight sm:text-4xl" style={{ color: 'var(--taupe-deep)' }}>{tr('guideTitle')}</h1>
            <p className="mt-4 text-sm leading-relaxed opacity-90">{tr('guideBody')}</p>
          </section>
        )}

        {tab === 'settings' && (
          <SettingsPanel
            state={state}
            setState={setState}
            tr={tr}
            lang={lang}
            cardStyle={cardStyle}
            btnPrimary={btnPrimary}
            exportJson={exportJson}
            importJson={importJson}
            createInitialState={createInitialState}
            setTab={setTab}
          />
        )}
      </main>

      <footer className="no-print mx-auto mt-8 max-w-6xl px-4 pb-8 text-center font-sans text-xs leading-relaxed text-neutral-600">
        <span style={{ color: 'var(--taupe-deep)' }}>{tr('brand')}</span>
        <span aria-hidden className="mx-1 opacity-60">
          {' '}
          •{' '}
        </span>
        <span>{themeSub(footerThemeMeta, lang)}</span>
        <span aria-hidden className="mx-1 opacity-60">
          {' '}
          -{' '}
        </span>
        <span>{tr('footerOneFile')}</span>
      </footer>
    </div>
  );
}

function BudgetPanel({ state, setState, tr, lang, cardStyle, btnPrimary }) {
  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-medium leading-tight tracking-tight sm:text-4xl" style={{ color: 'var(--taupe-deep)' }}>{tr('budgetTitle')}</h1>
          <p className="mt-2 max-w-xl text-sm italic opacity-80">{tr('budgetIntro')}</p>
        </div>
        <button
          type="button"
          style={btnPrimary}
          onClick={() =>
            setState((s) => ({
              ...s,
              categories: [
                ...s.categories,
                {
                  id: uid('cat'),
                  name: tr('newCategoryName'),
                  budgeted: 0,
                  paid: '',
                  vendor: '',
                  dueDate: '',
                  status: 'on_track',
                  notes: '',
                },
              ],
            }))
          }
        >
          {tr('addCategory')}
        </button>
      </div>
      <p className="rounded-xl border border-dashed p-3 text-sm" style={{ ...cardStyle, borderColor: 'var(--dusty-rose)' }}>
        {tr('spentNote')}
      </p>
      <div style={cardStyle} className="overflow-x-auto p-4">
        <table className="w-full min-w-[900px] text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="py-2">{tr('thCategory')}</th>
              <th className="py-2">{tr('thBudgeted')}</th>
              <th className="py-2">{tr('thSpent')}</th>
              <th className="py-2">{tr('budgetColPaid')}</th>
              <th className="py-2">{tr('budgetColVendor')}</th>
              <th className="py-2">{tr('budgetColDue')}</th>
              <th className="py-2">{tr('budgetColStatus')}</th>
              <th className="py-2">{tr('budgetColNotes')}</th>
              <th className="py-2" />
            </tr>
          </thead>
          <tbody>
            {state.categories.map((c, idx) => {
              const sp = state.payments
                .filter((p) => p.categoryName === c.name)
                .reduce((s, p) => s + (Number(p.amount) || 0), 0);
              return (
                <tr key={c.id} className="border-b border-black/5">
                  <td className="py-1 pr-2">
                    <input
                      className="w-full rounded border px-2 py-1"
                      value={c.name}
                      onChange={(e) => {
                        const v = e.target.value;
                        setState((s) => {
                          const cats = [...s.categories];
                          cats[idx] = { ...cats[idx], name: v };
                          return { ...s, categories: cats };
                        });
                      }}
                    />
                  </td>
                  <td className="py-1 pr-2">
                    <input
                      type="number"
                      className="w-24 rounded border px-2 py-1"
                      value={c.budgeted || ''}
                      onChange={(e) => {
                        const v = Number(e.target.value) || 0;
                        setState((s) => {
                          const cats = [...s.categories];
                          cats[idx] = { ...cats[idx], budgeted: v };
                          return { ...s, categories: cats };
                        });
                      }}
                    />
                  </td>
                  <td className="py-1 text-neutral-600">{sp}</td>
                  <td className="py-1 pr-2">
                    <input
                      className="w-20 rounded border px-2 py-1"
                      value={c.paid}
                      onChange={(e) => {
                        const v = e.target.value;
                        setState((s) => {
                          const cats = [...s.categories];
                          cats[idx] = { ...cats[idx], paid: v };
                          return { ...s, categories: cats };
                        });
                      }}
                    />
                  </td>
                  <td className="py-1 pr-2">
                    <input
                      className="w-28 rounded border px-2 py-1"
                      value={c.vendor}
                      onChange={(e) => {
                        const v = e.target.value;
                        setState((s) => {
                          const cats = [...s.categories];
                          cats[idx] = { ...cats[idx], vendor: v };
                          return { ...s, categories: cats };
                        });
                      }}
                    />
                  </td>
                  <td className="py-1 pr-2">
                    <input
                      type="date"
                      className="rounded border px-2 py-1"
                      value={c.dueDate}
                      onChange={(e) => {
                        const v = e.target.value;
                        setState((s) => {
                          const cats = [...s.categories];
                          cats[idx] = { ...cats[idx], dueDate: v };
                          return { ...s, categories: cats };
                        });
                      }}
                    />
                  </td>
                  <td className="py-1 pr-2">
                    <select
                      className="rounded border px-2 py-1"
                      value={c.status}
                      onChange={(e) => {
                        const v = e.target.value;
                        setState((s) => {
                          const cats = [...s.categories];
                          cats[idx] = { ...cats[idx], status: v };
                          return { ...s, categories: cats };
                        });
                      }}
                    >
                      <option value="on_track">On track</option>
                      <option value="at_risk">At risk</option>
                      <option value="over">Over</option>
                    </select>
                  </td>
                  <td className="py-1 pr-2">
                    <input
                      className="w-32 rounded border px-2 py-1"
                      value={c.notes}
                      onChange={(e) => {
                        const v = e.target.value;
                        setState((s) => {
                          const cats = [...s.categories];
                          cats[idx] = { ...cats[idx], notes: v };
                          return { ...s, categories: cats };
                        });
                      }}
                    />
                  </td>
                  <td className="py-1">
                    <button
                      type="button"
                      className="rounded p-2 text-red-700 hover:bg-red-50"
                      aria-label={tr('remove')}
                      onClick={() =>
                        setState((s) => ({
                          ...s,
                          categories: s.categories.filter((_, i) => i !== idx),
                        }))
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function PaymentsPanel({ state, setState, tr, lang, cardStyle, btnPrimary }) {
  const catNames = state.categories.map((c) => c.name);
  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-medium leading-tight tracking-tight sm:text-4xl" style={{ color: 'var(--taupe-deep)' }}>{tr('payTitle')}</h1>
          <p className="mt-2 max-w-xl text-sm italic opacity-80">{tr('payIntro')}</p>
        </div>
        <button
          type="button"
          style={btnPrimary}
          onClick={() =>
            setState((s) => ({
              ...s,
              payments: [
                ...s.payments,
                {
                  id: uid('pay'),
                  date: '',
                  vendor: '',
                  categoryName: catNames[0] || '',
                  amount: 0,
                  paymentType: 'transfer',
                  paidFor: '',
                  receipt: '',
                },
              ],
            }))
          }
        >
          {tr('addPayment')}
        </button>
      </div>
      <div style={cardStyle} className="overflow-x-auto p-4">
        <table className="w-full min-w-[960px] text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="py-2">Date</th>
              <th className="py-2">Vendor</th>
              <th className="py-2">Category</th>
              <th className="py-2">Amount</th>
              <th className="py-2">Type</th>
              <th className="py-2">Paid for</th>
              <th className="py-2">Receipt</th>
              <th className="py-2" />
            </tr>
          </thead>
          <tbody>
            {state.payments.map((p, idx) => (
              <tr key={p.id} className="border-b border-black/5">
                <td className="py-1 pr-2">
                  <input
                    type="date"
                    className="rounded border px-2 py-1"
                    value={p.date}
                    onChange={(e) => {
                      const v = e.target.value;
                      setState((s) => {
                        const pay = [...s.payments];
                        pay[idx] = { ...pay[idx], date: v };
                        return { ...s, payments: pay };
                      });
                    }}
                  />
                </td>
                <td className="py-1 pr-2">
                  <input
                    className="rounded border px-2 py-1"
                    value={p.vendor}
                    onChange={(e) => {
                      const v = e.target.value;
                      setState((s) => {
                        const pay = [...s.payments];
                        pay[idx] = { ...pay[idx], vendor: v };
                        return { ...s, payments: pay };
                      });
                    }}
                  />
                </td>
                <td className="py-1 pr-2">
                  <select
                    className="rounded border px-2 py-1"
                    value={p.categoryName}
                    onChange={(e) => {
                      const v = e.target.value;
                      setState((s) => {
                        const pay = [...s.payments];
                        pay[idx] = { ...pay[idx], categoryName: v };
                        return { ...s, payments: pay };
                      });
                    }}
                  >
                    {catNames.map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="py-1 pr-2">
                  <input
                    type="number"
                    className="w-24 rounded border px-2 py-1"
                    value={p.amount || ''}
                    onChange={(e) => {
                      const v = Number(e.target.value) || 0;
                      setState((s) => {
                        const pay = [...s.payments];
                        pay[idx] = { ...pay[idx], amount: v };
                        return { ...s, payments: pay };
                      });
                    }}
                  />
                </td>
                <td className="py-1 pr-2">
                  <select
                    className="rounded border px-2 py-1"
                    value={p.paymentType}
                    onChange={(e) => {
                      const v = e.target.value;
                      setState((s) => {
                        const pay = [...s.payments];
                        pay[idx] = { ...pay[idx], paymentType: v };
                        return { ...s, payments: pay };
                      });
                    }}
                  >
                    {PAYMENT_TYPES.map((x) => (
                      <option key={x} value={x}>
                        {x}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="py-1 pr-2">
                  <input
                    className="w-28 rounded border px-2 py-1"
                    value={p.paidFor}
                    onChange={(e) => {
                      const v = e.target.value;
                      setState((s) => {
                        const pay = [...s.payments];
                        pay[idx] = { ...pay[idx], paidFor: v };
                        return { ...s, payments: pay };
                      });
                    }}
                  />
                </td>
                <td className="py-1 pr-2">
                  <input
                    className="w-24 rounded border px-2 py-1"
                    value={p.receipt}
                    onChange={(e) => {
                      const v = e.target.value;
                      setState((s) => {
                        const pay = [...s.payments];
                        pay[idx] = { ...pay[idx], receipt: v };
                        return { ...s, payments: pay };
                      });
                    }}
                  />
                </td>
                <td className="py-1">
                  <button
                    type="button"
                    className="rounded p-2 text-red-700"
                    onClick={() =>
                      setState((s) => ({
                        ...s,
                        payments: s.payments.filter((_, i) => i !== idx),
                      }))
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!state.payments.length && <p className="py-8 text-center opacity-60">{tr('empty')}</p>}
      </div>
    </section>
  );
}

function VendorsPanel({ state, setState, tr, cardStyle, btnPrimary }) {
  return (
    <section className="space-y-4">
      <div className="flex justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-medium leading-tight tracking-tight sm:text-4xl" style={{ color: 'var(--taupe-deep)' }}>{tr('vendorsTitle')}</h1>
          <p className="mt-2 text-sm opacity-80">{tr('vendorsIntro')}</p>
        </div>
        <button
          type="button"
          style={btnPrimary}
          onClick={() =>
            setState((s) => ({
              ...s,
              vendors: [
                ...s.vendors,
                {
                  id: uid('ven'),
                  category: 'Venue',
                  name: '',
                  contact: '',
                  email: '',
                  phone: '',
                  booked: '',
                  deposit: 0,
                  balance: 0,
                  notes: '',
                },
              ],
            }))
          }
        >
          {tr('addVendor')}
        </button>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {state.vendors.map((v, idx) => (
          <div key={v.id} style={cardStyle} className="space-y-2 p-4">
            <input
              className="w-full rounded border px-2 py-1 font-medium"
              placeholder="Category"
              value={v.category}
              onChange={(e) => {
                const val = e.target.value;
                setState((s) => {
                  const vs = [...s.vendors];
                  vs[idx] = { ...vs[idx], category: val };
                  return { ...s, vendors: vs };
                });
              }}
            />
            <input
              className="w-full rounded border px-2 py-1"
              placeholder="Vendor name"
              value={v.name}
              onChange={(e) => {
                const val = e.target.value;
                setState((s) => {
                  const vs = [...s.vendors];
                  vs[idx] = { ...vs[idx], name: val };
                  return { ...s, vendors: vs };
                });
              }}
            />
            <textarea
              className="w-full rounded border px-2 py-1 text-sm"
              rows={3}
              placeholder="Notes"
              value={v.notes}
              onChange={(e) => {
                const val = e.target.value;
                setState((s) => {
                  const vs = [...s.vendors];
                  vs[idx] = { ...vs[idx], notes: val };
                  return { ...s, vendors: vs };
                });
              }}
            />
            <button
              type="button"
              className="text-sm text-red-700"
              onClick={() =>
                setState((s) => ({
                  ...s,
                  vendors: s.vendors.filter((_, i) => i !== idx),
                }))
              }
            >
              {tr('remove')}
            </button>
          </div>
        ))}
      </div>
      {!state.vendors.length && <p className="opacity-60">{tr('empty')}</p>}
    </section>
  );
}

function DecisionsPanel({ state, setState, tr, cardStyle, btnPrimary }) {
  return (
    <section className="space-y-4">
      <div className="flex justify-between">
        <div>
          <h1 className="font-display text-3xl font-medium leading-tight tracking-tight sm:text-4xl" style={{ color: 'var(--taupe-deep)' }}>{tr('decisionsTitle')}</h1>
          <p className="mt-2 text-sm opacity-80">{tr('decisionsIntro')}</p>
        </div>
        <button
          type="button"
          style={btnPrimary}
          onClick={() =>
            setState((s) => ({
              ...s,
              decisionGroups: [
                ...s.decisionGroups,
                {
                  id: uid('dg'),
                  category: '',
                  title: '',
                  options: [1, 2, 3].map(() => ({
                    id: uid('opt'),
                    name: '',
                    price: 0,
                    availability: 'available',
                    pros: '',
                    cons: '',
                    picked: false,
                  })),
                },
              ],
            }))
          }
        >
          + Group
        </button>
      </div>
      {state.decisionGroups.map((g, gi) => (
        <div key={g.id} style={cardStyle} className="space-y-4 p-4">
          <input
            className="w-full max-w-md rounded border px-2 py-1"
            placeholder="Category"
            value={g.category}
            onChange={(e) => {
              const val = e.target.value;
              setState((s) => {
                const dg = [...s.decisionGroups];
                dg[gi] = { ...dg[gi], category: val };
                return { ...s, decisionGroups: dg };
              });
            }}
          />
          <input
            className="w-full max-w-md rounded border px-2 py-1"
            placeholder="Decision name"
            value={g.title}
            onChange={(e) => {
              const val = e.target.value;
              setState((s) => {
                const dg = [...s.decisionGroups];
                dg[gi] = { ...dg[gi], title: val };
                return { ...s, decisionGroups: dg };
              });
            }}
          />
          <div className="grid gap-3 md:grid-cols-3">
            {g.options.map((o, oi) => (
              <div
                key={o.id}
                className="rounded-xl border p-3"
                style={{
                  borderColor: o.picked ? 'var(--dusty-rose)' : 'rgba(0,0,0,0.08)',
                  boxShadow: o.picked ? '0 0 0 2px var(--dusty-rose)' : 'none',
                }}
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-semibold">Option {oi + 1}</span>
                  {o.picked && <Crown className="h-4 w-4 text-amber-600" />}
                </div>
                <input
                  className="mb-2 w-full rounded border px-2 py-1 text-sm"
                  placeholder="Name"
                  value={o.name}
                  onChange={(e) => {
                    const val = e.target.value;
                    setState((s) => {
                      const dg = [...s.decisionGroups];
                      const opts = [...dg[gi].options];
                      opts[oi] = { ...opts[oi], name: val };
                      dg[gi] = { ...dg[gi], options: opts };
                      return { ...s, decisionGroups: dg };
                    });
                  }}
                />
                <input
                  type="number"
                  className="mb-2 w-full rounded border px-2 py-1 text-sm"
                  placeholder="Price"
                  value={o.price || ''}
                  onChange={(e) => {
                    const val = Number(e.target.value) || 0;
                    setState((s) => {
                      const dg = [...s.decisionGroups];
                      const opts = [...dg[gi].options];
                      opts[oi] = { ...opts[oi], price: val };
                      dg[gi] = { ...dg[gi], options: opts };
                      return { ...s, decisionGroups: dg };
                    });
                  }}
                />
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={o.picked}
                    onChange={() => {
                      setState((s) => {
                        const dg = [...s.decisionGroups];
                        const opts = dg[gi].options.map((opt, j) => ({
                          ...opt,
                          picked: j === oi,
                        }));
                        dg[gi] = { ...dg[gi], options: opts };
                        return { ...s, decisionGroups: dg };
                      });
                    }}
                  />
                  Final choice
                </label>
              </div>
            ))}
          </div>
          <button
            type="button"
            className="text-sm text-red-700"
            onClick={() =>
              setState((s) => ({
                ...s,
                decisionGroups: s.decisionGroups.filter((_, i) => i !== gi),
              }))
            }
          >
            {tr('remove')} group
          </button>
        </div>
      ))}
      {!state.decisionGroups.length && <p className="opacity-60">{tr('empty')}</p>}
    </section>
  );
}

function GuestsPanel({
  state,
  setState,
  tr,
  cardStyle,
  btnPrimary,
  welcomeInputStyle,
  openGuestRsvp,
  downloadRsvpHtmlFile,
  copyRsvpInvite,
}) {
  const fieldBase =
    'w-full rounded-xl px-4 py-3 text-neutral-800 outline-none ring-offset-2 transition focus:ring-2 focus:ring-opacity-40';

  return (
    <section className="space-y-8">
      <div className="flex justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-medium leading-tight tracking-tight sm:text-4xl" style={{ color: 'var(--taupe-deep)' }}>
            {tr('guestsTitle')}
          </h1>
          <p className="mt-2 text-sm opacity-80">{tr('guestsIntro')}</p>
        </div>
        <button
          type="button"
          style={btnPrimary}
          onClick={() =>
            setState((s) => ({
              ...s,
              guests: [
                ...s.guests,
                {
                  id: uid('gst'),
                  name: '',
                  side: 'bride',
                  relation: '',
                  rsvp: 'pending',
                  meal: '',
                  dietary: '',
                  plusOne: false,
                  tableNum: '',
                  notes: '',
                },
              ],
            }))
          }
        >
          <Plus className="mr-1 inline h-4 w-4" /> Guest
        </button>
      </div>
      <div style={cardStyle} className="overflow-x-auto p-4">
        <table className="w-full min-w-[900px] text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="py-2">Name</th>
              <th className="py-2">Side</th>
              <th className="py-2">RSVP</th>
              <th className="py-2">Meal</th>
              <th className="py-2">Table</th>
              <th className="py-2" />
            </tr>
          </thead>
          <tbody>
            {state.guests.map((g, idx) => (
              <tr key={g.id} className="border-b border-black/5">
                <td className="py-1 pr-2">
                  <input
                    className="rounded border px-2 py-1"
                    value={g.name}
                    onChange={(e) => {
                      const v = e.target.value;
                      setState((s) => {
                        const gs = [...s.guests];
                        gs[idx] = { ...gs[idx], name: v };
                        return { ...s, guests: gs };
                      });
                    }}
                  />
                </td>
                <td className="py-1 pr-2">
                  <select
                    className="rounded border px-2 py-1"
                    value={g.side}
                    onChange={(e) => {
                      const v = e.target.value;
                      setState((s) => {
                        const gs = [...s.guests];
                        gs[idx] = { ...gs[idx], side: v };
                        return { ...s, guests: gs };
                      });
                    }}
                  >
                    <option value="bride">Bride</option>
                    <option value="groom">Groom</option>
                  </select>
                </td>
                <td className="py-1 pr-2">
                  <select
                    className="rounded border px-2 py-1"
                    value={g.rsvp}
                    onChange={(e) => {
                      const v = e.target.value;
                      setState((s) => {
                        const gs = [...s.guests];
                        gs[idx] = { ...gs[idx], rsvp: v };
                        return { ...s, guests: gs };
                      });
                    }}
                  >
                    {RSVP_OPTS.map((x) => (
                      <option key={x} value={x}>
                        {x}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="py-1 pr-2">
                  <input
                    className="rounded border px-2 py-1"
                    value={g.meal}
                    onChange={(e) => {
                      const v = e.target.value;
                      setState((s) => {
                        const gs = [...s.guests];
                        gs[idx] = { ...gs[idx], meal: v };
                        return { ...s, guests: gs };
                      });
                    }}
                  />
                </td>
                <td className="py-1 pr-2">
                  <input
                    className="w-20 rounded border px-2 py-1"
                    value={g.tableNum}
                    onChange={(e) => {
                      const v = e.target.value;
                      setState((s) => {
                        const gs = [...s.guests];
                        gs[idx] = { ...gs[idx], tableNum: v };
                        return { ...s, guests: gs };
                      });
                    }}
                  />
                </td>
                <td className="py-1">
                  <button
                    type="button"
                    className="text-red-700"
                    onClick={() =>
                      setState((s) => ({
                        ...s,
                        guests: s.guests.filter((_, i) => i !== idx),
                      }))
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div
        className="relative overflow-hidden rounded-3xl"
        style={{
          background: 'linear-gradient(155deg, rgba(232,223,212,0.55) 0%, rgba(253,251,247,0.95) 42%, rgba(245,239,230,0.7) 100%)',
          boxShadow: '0 16px 48px rgba(63, 60, 55, 0.08)',
        }}
      >
        <div
          className="absolute -right-16 -top-16 h-48 w-48 rounded-full opacity-25"
          style={{ background: 'radial-gradient(circle, var(--taupe-primary) 0%, transparent 70%)' }}
          aria-hidden
        />
        <div className="relative rounded-3xl border border-black/5 p-6 sm:p-9" style={{ background: 'var(--ivory-card)' }}>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between lg:gap-8">
            <div className="flex min-w-0 flex-1 gap-4">
              <div
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl shadow-inner ring-1 ring-black/5"
                style={{ background: 'linear-gradient(180deg, rgba(253,251,247,1), rgba(232,223,212,0.35))' }}
              >
                <Mail className="h-7 w-7" style={{ color: 'var(--taupe-deep)' }} aria-hidden />
              </div>
              <div className="min-w-0 max-w-2xl">
                <p className="label-cap">{tr('guestsRsvpEyebrow')}</p>
                <h2 className="font-script mt-2 text-4xl font-semibold leading-tight sm:text-5xl" style={{ color: 'var(--taupe-deep)' }}>
                  {tr('guestsRsvpHero')}
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-neutral-600">{tr('guestsRsvpLead')}</p>
              </div>
            </div>
            <div className="flex w-full shrink-0 flex-col gap-2 sm:flex-row lg:max-w-md lg:flex-col xl:max-w-none xl:flex-row">
              <button
                type="button"
                className="flex flex-1 items-center justify-center gap-2 rounded-full border px-5 py-3 text-sm font-semibold shadow-sm transition hover:-translate-y-0.5"
                style={{ borderColor: 'var(--taupe-deep)', background: 'var(--taupe-deep)', color: '#fdfbf7' }}
                onClick={openGuestRsvp}
              >
                <ExternalLink className="h-4 w-4 shrink-0" aria-hidden /> {tr('rsvpOpenLive')}
              </button>
              <button
                type="button"
                className="flex flex-1 items-center justify-center gap-2 rounded-full border px-5 py-3 text-sm font-semibold transition hover:-translate-y-0.5"
                style={{ borderColor: 'rgba(122,107,92,0.22)', background: 'var(--ivory-card)', color: 'var(--taupe-deep)' }}
                onClick={downloadRsvpHtmlFile}
              >
                <Download className="h-4 w-4 shrink-0" aria-hidden /> {tr('rsvpDownloadHtml')}
              </button>
              <button
                type="button"
                className="flex flex-1 items-center justify-center gap-2 rounded-full border px-5 py-3 text-sm font-semibold transition hover:-translate-y-0.5"
                style={{ borderColor: 'var(--taupe-primary)', background: 'rgba(149,139,130,0.08)', color: 'var(--taupe-deep)' }}
                onClick={copyRsvpInvite}
              >
                <Copy className="h-4 w-4 shrink-0" aria-hidden /> {tr('rsvpCopyInvite')}
              </button>
            </div>
          </div>

          <div className="mt-8 grid min-w-0 gap-4 sm:grid-cols-2">
            <label
              className="flex min-w-0 flex-col gap-2 rounded-2xl border px-4 py-3 sm:min-w-[min(100%,280px)]"
              style={{ borderColor: 'rgba(122,107,92,0.14)', background: 'rgba(245,239,230,0.45)' }}
            >
              <span className="label-cap break-words">{tr('rsvpDeadlineLabel')}</span>
              <input
                type="date"
                className={`${fieldBase} min-h-[2.75rem] w-full min-w-0`}
                style={welcomeInputStyle}
                value={state.rsvpDeadline || ''}
                onChange={(e) => setState((s) => ({ ...s, rsvpDeadline: e.target.value }))}
              />
              <span className="text-xs leading-snug text-neutral-500">{tr('rsvpDeadlineHint')}</span>
            </label>
            <label
              className="flex min-w-0 flex-col gap-2 rounded-2xl border px-4 py-3 sm:min-w-[min(100%,280px)]"
              style={{ borderColor: 'rgba(122,107,92,0.14)', background: 'rgba(245,239,230,0.45)' }}
            >
              <span className="label-cap break-words">{tr('rsvpContactEmailLabel')}</span>
              <input
                type="email"
                className={`${fieldBase} min-h-[2.75rem] w-full min-w-0`}
                style={welcomeInputStyle}
                placeholder="naam@voorbeeld.nl"
                value={state.rsvpContactEmail || ''}
                onChange={(e) => setState((s) => ({ ...s, rsvpContactEmail: e.target.value }))}
              />
              <span className="text-xs leading-snug text-neutral-500">{tr('rsvpContactEmailHint')}</span>
            </label>
          </div>

          <div className="mt-8 grid gap-5 border-t pt-8 sm:grid-cols-2" style={{ borderColor: 'rgba(122,107,92,0.1)' }}>
            <label className="flex flex-col gap-2 sm:col-span-2">
              <span className="label-cap" style={{ color: 'var(--taupe-deep)' }}>
                {tr('rsvpShareUrlLabel')}
              </span>
              <input
                className={fieldBase}
                style={welcomeInputStyle}
                placeholder="https://…/planner.html#rsvp"
                value={state.rsvpShareUrl || ''}
                onChange={(e) => setState((s) => ({ ...s, rsvpShareUrl: e.target.value }))}
              />
              <span className="text-xs text-neutral-500">{tr('rsvpShareUrlHint')}</span>
            </label>
            <label className="flex flex-col gap-2 sm:col-span-2">
              <span className="label-cap" style={{ color: 'var(--taupe-deep)' }}>
                {tr('rsvpFormIntroLabel')}
              </span>
              <textarea
                rows={4}
                className={`${fieldBase} min-h-[7rem]`}
                style={welcomeInputStyle}
                placeholder={tr('rsvpFormIntroPlaceholder')}
                value={state.rsvpFormIntro || ''}
                onChange={(e) => setState((s) => ({ ...s, rsvpFormIntro: e.target.value }))}
              />
            </label>
          </div>
        </div>
      </div>
    </section>
  );
}

function TablesPanel({ state, setState, tr, cardStyle, btnPrimary }) {
  return (
    <section className="space-y-4">
      <div className="flex justify-between">
        <div>
          <h1 className="font-display text-3xl font-medium leading-tight tracking-tight sm:text-4xl" style={{ color: 'var(--taupe-deep)' }}>{tr('tablesTitle')}</h1>
          <p className="mt-2 text-sm opacity-80">{tr('tablesIntro')}</p>
        </div>
        <button
          type="button"
          style={btnPrimary}
          onClick={() =>
            setState((s) => ({
              ...s,
              tables: [
                ...s.tables,
                {
                  id: uid('tbl'),
                  name: `Table ${s.tables.length + 1}`,
                  type: 'family',
                  capacity: 8,
                  guestIds: [],
                },
              ],
            }))
          }
        >
          + Table
        </button>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {state.tables.map((tb, idx) => (
          <div key={tb.id} style={cardStyle} className="p-4">
            <input
              className="mb-2 w-full rounded border px-2 py-1 font-medium"
              value={tb.name}
              onChange={(e) => {
                const v = e.target.value;
                setState((s) => {
                  const ts = [...s.tables];
                  ts[idx] = { ...ts[idx], name: v };
                  return { ...s, tables: ts };
                });
              }}
            />
            <select
              className="mb-2 rounded border px-2 py-1"
              value={tb.type}
              onChange={(e) => {
                const v = e.target.value;
                setState((s) => {
                  const ts = [...s.tables];
                  ts[idx] = { ...ts[idx], type: v };
                  return { ...s, tables: ts };
                });
              }}
            >
              {TABLE_TYPES.map((x) => (
                <option key={x} value={x}>
                  {x}
                </option>
              ))}
            </select>
            <p className="text-xs opacity-70">
              Guest IDs (comma):{' '}
              <input
                className="mt-1 w-full rounded border px-2 py-1 text-sm"
                value={tb.guestIds.join(',')}
                onChange={(e) => {
                  const ids = e.target.value
                    .split(',')
                    .map((x) => x.trim())
                    .filter(Boolean);
                  setState((s) => {
                    const ts = [...s.tables];
                    ts[idx] = { ...ts[idx], guestIds: ids };
                    return { ...s, tables: ts };
                  });
                }}
              />
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function minutesFromMidnight(t) {
  const parts = String(t || '00:00').trim().split(':');
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  const hh = Number.isFinite(h) ? h : 0;
  const mm = Number.isFinite(m) ? m : 0;
  return hh * 60 + mm;
}

function durationUntilNext(dayFlow, idx) {
  if (!dayFlow[idx + 1]) return null;
  const cur = minutesFromMidnight(dayFlow[idx]?.time);
  const next = minutesFromMidnight(dayFlow[idx + 1]?.time);
  let diff = next - cur;
  if (diff <= 0) diff += 24 * 60;
  return diff;
}

function formatDurationShort(mins) {
  if (mins == null || mins <= 0) return '—';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h && m) return `${h}h ${m}m`;
  if (h) return `${h}h`;
  return `${m}m`;
}

function PartyPanel({ state, setState, tr, lang, cardStyle, btnPrimary }) {
  const zebra = (idx) => (idx % 2 === 1 ? { background: 'rgba(245, 239, 230, 0.65)' } : undefined);
  return (
    <section className="space-y-4 transition-opacity duration-150">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-medium leading-tight tracking-tight sm:text-4xl" style={{ color: 'var(--taupe-deep)' }}>
            {tr('partyTitle')}
          </h1>
          <p className="mt-2 max-w-2xl text-sm italic opacity-80">{tr('partyIntro')}</p>
        </div>
        <button
          type="button"
          style={btnPrimary}
          className="transition hover:-translate-y-0.5"
          onClick={() =>
            setState((s) => ({
              ...s,
              partyMembers: [
                ...s.partyMembers,
                {
                  id: uid('pm'),
                  name: '',
                  role: PARTY_ROLES[0],
                  phone: '',
                  email: '',
                  attire: '',
                  shoes: '',
                  measurements: '',
                },
              ],
            }))
          }
        >
          {tr('partyAddMember')}
        </button>
      </div>
      {!state.partyMembers.length ? (
        <div style={cardStyle} className="p-10 text-center text-sm opacity-70">
          {tr('empty')}
        </div>
      ) : (
        <div style={cardStyle} className="overflow-x-auto p-4">
          <table className="w-full min-w-[1040px] text-sm">
            <thead>
              <tr className="border-b border-black/10 text-left">
                <th className="py-2 pr-2">{tr('colName')}</th>
                <th className="py-2 pr-2">{tr('colRole')}</th>
                <th className="py-2 pr-2">{tr('colPhone')}</th>
                <th className="py-2 pr-2">{tr('colEmail')}</th>
                <th className="py-2 pr-2">{tr('partyColAttire')}</th>
                <th className="py-2 pr-2">{tr('partyColShoes')}</th>
                <th className="py-2 pr-2">{tr('partyColMeasurements')}</th>
                <th className="py-2 w-10" />
              </tr>
            </thead>
            <tbody>
              {state.partyMembers.map((m, idx) => (
                <tr key={m.id} className="border-b border-black/5 transition-colors hover:bg-black/[0.02]" style={zebra(idx)}>
                  <td className="py-1 pr-2 align-top">
                    <input
                      className="w-full min-w-[7rem] rounded border px-2 py-1"
                      style={{ borderColor: 'rgba(122,107,92,0.35)' }}
                      value={m.name}
                      onChange={(e) => {
                        const v = e.target.value;
                        setState((s) => {
                          const pm = [...s.partyMembers];
                          pm[idx] = { ...pm[idx], name: v };
                          return { ...s, partyMembers: pm };
                        });
                      }}
                    />
                  </td>
                  <td className="py-1 pr-2 align-top">
                    <select
                      className="rounded border px-2 py-1"
                      style={{ borderColor: 'rgba(122,107,92,0.35)' }}
                      value={m.role}
                      onChange={(e) => {
                        const v = e.target.value;
                        setState((s) => {
                          const pm = [...s.partyMembers];
                          pm[idx] = { ...pm[idx], role: v };
                          return { ...s, partyMembers: pm };
                        });
                      }}
                    >
                      {PARTY_ROLES.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-1 pr-2 align-top">
                    <input
                      className="w-full rounded border px-2 py-1"
                      style={{ borderColor: 'rgba(122,107,92,0.35)' }}
                      value={m.phone}
                      onChange={(e) => {
                        const v = e.target.value;
                        setState((s) => {
                          const pm = [...s.partyMembers];
                          pm[idx] = { ...pm[idx], phone: v };
                          return { ...s, partyMembers: pm };
                        });
                      }}
                    />
                  </td>
                  <td className="py-1 pr-2 align-top">
                    <input
                      className="w-full min-w-[8rem] rounded border px-2 py-1"
                      style={{ borderColor: 'rgba(122,107,92,0.35)' }}
                      value={m.email}
                      onChange={(e) => {
                        const v = e.target.value;
                        setState((s) => {
                          const pm = [...s.partyMembers];
                          pm[idx] = { ...pm[idx], email: v };
                          return { ...s, partyMembers: pm };
                        });
                      }}
                    />
                  </td>
                  <td className="py-1 pr-2 align-top">
                    <input
                      className="w-full min-w-[6rem] rounded border px-2 py-1"
                      style={{ borderColor: 'rgba(122,107,92,0.35)' }}
                      value={m.attire}
                      onChange={(e) => {
                        const v = e.target.value;
                        setState((s) => {
                          const pm = [...s.partyMembers];
                          pm[idx] = { ...pm[idx], attire: v };
                          return { ...s, partyMembers: pm };
                        });
                      }}
                    />
                  </td>
                  <td className="py-1 pr-2 align-top">
                    <input
                      className="w-full min-w-[5rem] rounded border px-2 py-1"
                      style={{ borderColor: 'rgba(122,107,92,0.35)' }}
                      value={m.shoes}
                      onChange={(e) => {
                        const v = e.target.value;
                        setState((s) => {
                          const pm = [...s.partyMembers];
                          pm[idx] = { ...pm[idx], shoes: v };
                          return { ...s, partyMembers: pm };
                        });
                      }}
                    />
                  </td>
                  <td className="py-1 pr-2 align-top">
                    <input
                      className="w-full min-w-[6rem] rounded border px-2 py-1"
                      style={{ borderColor: 'rgba(122,107,92,0.35)' }}
                      value={m.measurements}
                      onChange={(e) => {
                        const v = e.target.value;
                        setState((s) => {
                          const pm = [...s.partyMembers];
                          pm[idx] = { ...pm[idx], measurements: v };
                          return { ...s, partyMembers: pm };
                        });
                      }}
                    />
                  </td>
                  <td className="py-1 align-top">
                    <button
                      type="button"
                      className="rounded p-2 text-red-800 hover:bg-red-50"
                      aria-label={tr('remove')}
                      onClick={() =>
                        setState((s) => ({
                          ...s,
                          partyMembers: s.partyMembers.filter((_, i) => i !== idx),
                        }))
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function DayFlowPanel({ state, setState, tr, lang, cardStyle, btnPrimary }) {
  return (
    <section className="space-y-4 transition-opacity duration-150">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-medium leading-tight tracking-tight sm:text-4xl" style={{ color: 'var(--taupe-deep)' }}>
            {tr('dayflowTitle')}
          </h1>
          <p className="mt-2 max-w-2xl text-sm italic opacity-80">{tr('dayflowIntro')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-full border px-4 py-2 text-sm font-medium transition hover:-translate-y-0.5"
            style={{ borderColor: 'var(--taupe-primary)', color: 'var(--taupe-deep)' }}
            onClick={() =>
              setState((s) => ({
                ...s,
                dayFlow: s.dayFlow.map((row) => ({
                  ...row,
                  eventDate: row.eventDate || s.weddingDate || '',
                })),
              }))
            }
          >
            {tr('dayApplyWeddingDate')}
          </button>
          <button
            type="button"
            style={btnPrimary}
            className="transition hover:-translate-y-0.5"
            onClick={() =>
              setState((s) => ({
                ...s,
                dayFlow: [
                  ...s.dayFlow,
                  {
                    id: uid('df'),
                    eventDate: '',
                    time: '',
                    event: '',
                    location: '',
                    who: '',
                    notes: '',
                  },
                ],
              }))
            }
          >
            <Plus className="mr-1 inline h-4 w-4" /> {tr('btnAddDayBlock')}
          </button>
        </div>
      </div>

      <div style={cardStyle} className="no-print overflow-x-auto p-4">
        <div className="label-cap mb-3 flex items-center gap-2">
          <Clock className="h-4 w-4" style={{ color: 'var(--taupe-primary)' }} aria-hidden />
          {tr('dayTimeline')}
        </div>
        <div className="flex min-w-max gap-0 pb-2">
          {state.dayFlow.map((row, idx) => (
            <div key={row.id} className="flex items-stretch">
              <div className="flex flex-col items-center px-3">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold leading-tight text-white"
                  style={{ background: 'var(--muted-rose)' }}
                >
                  {row.time || '—'}
                </div>
                <p className="mt-2 max-w-[120px] text-center text-xs opacity-80">{row.event}</p>
              </div>
              {idx < state.dayFlow.length - 1 && (
                <div className="flex min-w-[24px] flex-1 items-center self-start pt-5">
                  <div className="h-px w-full bg-neutral-300" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div style={cardStyle} className="overflow-x-auto p-4">
        <table className="w-full min-w-[1040px] text-sm">
          <thead>
            <tr className="border-b border-black/10 text-left">
              <th className="py-2 pr-2">{tr('dayColDate')}</th>
              <th className="py-2 pr-2">{tr('dayThTime')}</th>
              <th className="py-2 pr-2">{tr('dayThEvent')}</th>
              <th className="py-2 pr-2">{tr('dayThLocation')}</th>
              <th className="py-2 pr-2">{tr('dayThWho')}</th>
              <th className="py-2 pr-2">{tr('dayThNotesPrep')}</th>
              <th className="py-2 pr-2">{tr('dayColDuration')}</th>
              <th className="py-2 w-10" />
            </tr>
          </thead>
          <tbody>
            {state.dayFlow.map((row, idx) => {
              const dur = durationUntilNext(state.dayFlow, idx);
              const zebra = idx % 2 === 1 ? { background: 'rgba(245, 239, 230, 0.65)' } : undefined;
              return (
                <tr key={row.id} className="border-b border-black/5 transition-colors hover:bg-black/[0.02]" style={zebra}>
                  <td className="py-1 pr-2 align-top">
                    <input
                      type="date"
                      className="rounded border px-2 py-1"
                      style={{ borderColor: 'rgba(122,107,92,0.35)' }}
                      value={row.eventDate || ''}
                      onChange={(e) => {
                        const v = e.target.value;
                        setState((s) => {
                          const df = [...s.dayFlow];
                          df[idx] = { ...df[idx], eventDate: v };
                          return { ...s, dayFlow: df };
                        });
                      }}
                    />
                  </td>
                  {['time', 'event', 'location', 'who', 'notes'].map((field) => (
                    <td key={field} className="py-1 pr-2 align-top">
                      <input
                        className="w-full min-w-[5rem] rounded border px-2 py-1"
                        style={{ borderColor: 'rgba(122,107,92,0.35)' }}
                        value={row[field]}
                        onChange={(e) => {
                          const v = e.target.value;
                          setState((s) => {
                            const df = [...s.dayFlow];
                            df[idx] = { ...df[idx], [field]: v };
                            return { ...s, dayFlow: df };
                          });
                        }}
                      />
                    </td>
                  ))}
                  <td className="py-2 pr-2 align-top text-xs" style={{ color: 'var(--taupe-deep)' }}>
                    {formatDurationShort(dur)}
                  </td>
                  <td className="py-1 align-top">
                    <button
                      type="button"
                      className="rounded p-2 text-red-800 hover:bg-red-50"
                      aria-label={tr('remove')}
                      onClick={() =>
                        setState((s) => ({
                          ...s,
                          dayFlow: s.dayFlow.filter((_, i) => i !== idx),
                        }))
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function GiftsPanel({ state, setState, tr, lang, cardStyle, btnPrimary }) {
  const [pendingOnly, setPendingOnly] = useState(false);
  const visible = pendingOnly ? state.gifts.filter((g) => g.thankYou === 'pending') : state.gifts;
  return (
    <section className="space-y-4 transition-opacity duration-150">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-medium leading-tight tracking-tight sm:text-4xl" style={{ color: 'var(--taupe-deep)' }}>
            {tr('giftsTitle')}
          </h1>
          <p className="mt-2 max-w-2xl text-sm italic opacity-80">{tr('giftsIntro')}</p>
        </div>
        <button
          type="button"
          style={btnPrimary}
          className="transition hover:-translate-y-0.5"
          onClick={() =>
            setState((s) => ({
              ...s,
              gifts: [
                ...s.gifts,
                {
                  id: uid('gf'),
                  giver: '',
                  description: '',
                  value: 0,
                  received: '',
                  thankYou: 'pending',
                  notes: '',
                },
              ],
            }))
          }
        >
          <Plus className="mr-1 inline h-4 w-4" /> {tr('btnAddGift')}
        </button>
      </div>
      <label className="flex cursor-pointer items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={pendingOnly}
          onChange={(e) => setPendingOnly(e.target.checked)}
        />
        {tr('giftsFilterPending')}
      </label>
      {!visible.length ? (
        <div style={cardStyle} className="p-10 text-center text-sm opacity-70">
          {tr('empty')}
        </div>
      ) : (
        <div style={cardStyle} className="overflow-x-auto p-4">
          <table className="w-full min-w-[880px] text-sm">
            <thead>
              <tr className="border-b border-black/10 text-left">
                <th className="py-2 pr-2">{tr('giverCol')}</th>
                <th className="py-2 pr-2">{tr('giftCol')}</th>
                <th className="py-2 pr-2">{tr('valueCol')}</th>
                <th className="py-2 pr-2">{tr('giftsColReceived')}</th>
                <th className="py-2 pr-2">{tr('thankyouCol')}</th>
                <th className="py-2 pr-2">{tr('giftsColNotes')}</th>
                <th className="py-2 w-10" />
              </tr>
            </thead>
            <tbody>
              {visible.map((g, idx) => {
                const globalIdx = state.gifts.findIndex((x) => x.id === g.id);
                const zebra = idx % 2 === 1 ? { background: 'rgba(245, 239, 230, 0.65)' } : undefined;
                const accent =
                  g.thankYou === 'pending'
                    ? { borderLeft: '3px solid var(--dusty-rose)' }
                    : { borderLeft: '3px solid var(--sage)' };
                return (
                  <tr
                    key={g.id}
                    className="border-b border-black/5 transition-colors hover:bg-black/[0.02]"
                    style={{ ...zebra, ...accent }}
                  >
                    <td className="py-1 pr-2 align-top">
                      <input
                        className="rounded border px-2 py-1"
                        style={{ borderColor: 'rgba(122,107,92,0.35)' }}
                        value={g.giver}
                        onChange={(e) => {
                          const v = e.target.value;
                          setState((s) => {
                            const gs = [...s.gifts];
                            gs[globalIdx] = { ...gs[globalIdx], giver: v };
                            return { ...s, gifts: gs };
                          });
                        }}
                      />
                    </td>
                    <td className="py-1 pr-2 align-top">
                      <input
                        className="rounded border px-2 py-1"
                        style={{ borderColor: 'rgba(122,107,92,0.35)' }}
                        value={g.description}
                        onChange={(e) => {
                          const v = e.target.value;
                          setState((s) => {
                            const gs = [...s.gifts];
                            gs[globalIdx] = { ...gs[globalIdx], description: v };
                            return { ...s, gifts: gs };
                          });
                        }}
                      />
                    </td>
                    <td className="py-1 pr-2 align-top">
                      <input
                        type="number"
                        className="w-24 rounded border px-2 py-1"
                        style={{ borderColor: 'rgba(122,107,92,0.35)' }}
                        value={g.value || ''}
                        onChange={(e) => {
                          const v = Number(e.target.value) || 0;
                          setState((s) => {
                            const gs = [...s.gifts];
                            gs[globalIdx] = { ...gs[globalIdx], value: v };
                            return { ...s, gifts: gs };
                          });
                        }}
                      />
                    </td>
                    <td className="py-1 pr-2 align-top">
                      <input
                        type="date"
                        className="rounded border px-2 py-1"
                        style={{ borderColor: 'rgba(122,107,92,0.35)' }}
                        value={g.received || ''}
                        onChange={(e) => {
                          const v = e.target.value;
                          setState((s) => {
                            const gs = [...s.gifts];
                            gs[globalIdx] = { ...gs[globalIdx], received: v };
                            return { ...s, gifts: gs };
                          });
                        }}
                      />
                    </td>
                    <td className="py-1 pr-2 align-top">
                      <select
                        className="rounded border px-2 py-1"
                        style={{
                          borderColor: 'rgba(122,107,92,0.35)',
                          background:
                            g.thankYou === 'pending' ? 'rgba(237, 213, 208, 0.35)' : 'rgba(181, 184, 168, 0.25)',
                        }}
                        value={g.thankYou}
                        onChange={(e) => {
                          const v = e.target.value;
                          setState((s) => {
                            const gs = [...s.gifts];
                            gs[globalIdx] = { ...gs[globalIdx], thankYou: v };
                            return { ...s, gifts: gs };
                          });
                        }}
                      >
                        <option value="pending">{tr('pendingOpt')}</option>
                        <option value="sent">{tr('sentOpt')}</option>
                      </select>
                    </td>
                    <td className="py-1 pr-2 align-top">
                      <input
                        className="w-full min-w-[6rem] rounded border px-2 py-1"
                        style={{ borderColor: 'rgba(122,107,92,0.35)' }}
                        value={g.notes}
                        onChange={(e) => {
                          const v = e.target.value;
                          setState((s) => {
                            const gs = [...s.gifts];
                            gs[globalIdx] = { ...gs[globalIdx], notes: v };
                            return { ...s, gifts: gs };
                          });
                        }}
                      />
                    </td>
                    <td className="py-1 align-top">
                      <button
                        type="button"
                        className="rounded p-2 text-red-800 hover:bg-red-50"
                        aria-label={tr('remove')}
                        onClick={() =>
                          setState((s) => ({
                            ...s,
                            gifts: s.gifts.filter((_, i) => i !== globalIdx),
                          }))
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function SongsPanel({ state, setState, tr, lang, cardStyle, btnPrimary }) {
  return (
    <section className="space-y-4 transition-opacity duration-150">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-medium leading-tight tracking-tight sm:text-4xl" style={{ color: 'var(--taupe-deep)' }}>
            {tr('songsTitle')}
          </h1>
          <p className="mt-2 max-w-2xl text-sm italic opacity-80">{tr('songsIntro')}</p>
        </div>
        <button
          type="button"
          style={btnPrimary}
          className="transition hover:-translate-y-0.5"
          onClick={() =>
            setState((s) => ({
              ...s,
              songs: [
                ...s.songs,
                {
                  id: uid('sg'),
                  moment: tr('songsColMoment'),
                  title: '',
                  artist: '',
                  notes: '',
                },
              ],
            }))
          }
        >
          {tr('songsAdd')}
        </button>
      </div>
      <div style={cardStyle} className="overflow-x-auto p-4">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-black/10 text-left">
              <th className="py-2 pr-2">{tr('songsColMoment')}</th>
              <th className="py-2 pr-2">{tr('songTitleCol')}</th>
              <th className="py-2 pr-2">{tr('songArtistCol')}</th>
              <th className="py-2 pr-2">{tr('photoColNotes')}</th>
              <th className="py-2 w-10" />
            </tr>
          </thead>
          <tbody>
            {state.songs.map((song, idx) => (
              <tr key={song.id} className="border-b border-black/5 transition-colors hover:bg-black/[0.02]">
                <td className="py-1 pr-2 align-top">
                  <input
                    className="w-full min-w-[8rem] rounded border px-2 py-1"
                    style={{ borderColor: 'rgba(122,107,92,0.35)' }}
                    value={song.moment}
                    onChange={(e) => {
                      const v = e.target.value;
                      setState((st) => {
                        const sg = [...st.songs];
                        sg[idx] = { ...sg[idx], moment: v };
                        return { ...st, songs: sg };
                      });
                    }}
                  />
                </td>
                <td className="py-1 pr-2 align-top">
                  <input
                    className="rounded border px-2 py-1"
                    style={{ borderColor: 'rgba(122,107,92,0.35)' }}
                    value={song.title}
                    onChange={(e) => {
                      const v = e.target.value;
                      setState((st) => {
                        const sg = [...st.songs];
                        sg[idx] = { ...sg[idx], title: v };
                        return { ...st, songs: sg };
                      });
                    }}
                  />
                </td>
                <td className="py-1 pr-2 align-top">
                  <input
                    className="rounded border px-2 py-1"
                    style={{ borderColor: 'rgba(122,107,92,0.35)' }}
                    value={song.artist}
                    onChange={(e) => {
                      const v = e.target.value;
                      setState((st) => {
                        const sg = [...st.songs];
                        sg[idx] = { ...sg[idx], artist: v };
                        return { ...st, songs: sg };
                      });
                    }}
                  />
                </td>
                <td className="py-1 pr-2 align-top">
                  <input
                    className="w-full rounded border px-2 py-1"
                    style={{ borderColor: 'rgba(122,107,92,0.35)' }}
                    value={song.notes}
                    onChange={(e) => {
                      const v = e.target.value;
                      setState((st) => {
                        const sg = [...st.songs];
                        sg[idx] = { ...sg[idx], notes: v };
                        return { ...st, songs: sg };
                      });
                    }}
                  />
                </td>
                <td className="py-1 align-top">
                  <button
                    type="button"
                    className="rounded p-2 text-red-800 hover:bg-red-50"
                    aria-label={tr('remove')}
                    onClick={() =>
                      setState((st) => ({
                        ...st,
                        songs: st.songs.filter((_, i) => i !== idx),
                      }))
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function PhotoPanel({ state, setState, tr, lang, cardStyle, btnPrimary }) {
  const [collapsed, setCollapsed] = useState({});
  const toggle = (id) => setCollapsed((c) => ({ ...c, [id]: !c[id] }));

  function heading(sec) {
    if (sec.customTitle && sec.customTitle.trim()) return sec.customTitle.trim();
    if (sec.titleKey) return tr(sec.titleKey);
    return tr('photoCustomTitleDefault');
  }

  return (
    <section className="space-y-4 transition-opacity duration-150">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-medium leading-tight tracking-tight sm:text-4xl" style={{ color: 'var(--taupe-deep)' }}>
            {tr('photoTitle')}
          </h1>
          <p className="mt-2 max-w-2xl text-sm italic opacity-80">{tr('photoIntro')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            style={btnPrimary}
            className="transition hover:-translate-y-0.5"
            onClick={() =>
              setState((s) => ({
                ...s,
                photoSections: [
                  ...s.photoSections,
                  {
                    id: uid('phsec'),
                    titleKey: '',
                    customTitle: tr('photoCustomTitleDefault'),
                    items: [
                      {
                        id: uid('phi'),
                        done: false,
                        description: '',
                        priority: 'must',
                        notes: '',
                      },
                    ],
                  },
                ],
              }))
            }
          >
            <Plus className="mr-1 inline h-4 w-4" /> {tr('photoAddSection')}
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {state.photoSections.map((sec, si) => {
          const isCollapsed = collapsed[sec.id];
          return (
            <div key={sec.id} style={cardStyle} className="overflow-hidden">
              <div
                className="flex w-full items-center justify-between gap-3 border-b border-black/5 px-4 py-3"
                style={{ borderColor: 'rgba(122,107,92,0.15)' }}
              >
                <button
                  type="button"
                  className="flex min-w-0 flex-1 items-center gap-2 text-left transition hover:opacity-90"
                  onClick={() => toggle(sec.id)}
                  aria-expanded={!isCollapsed}
                >
                  <span className="flex items-center gap-2 font-display text-lg italic" style={{ color: 'var(--taupe-deep)' }}>
                    {isCollapsed ? (
                      <ChevronRight className="h-5 w-5 shrink-0 opacity-60" aria-hidden />
                    ) : (
                      <ChevronDown className="h-5 w-5 shrink-0 opacity-60" aria-hidden />
                    )}
                    {heading(sec)}
                  </span>
                </button>
                <button
                  type="button"
                  className="shrink-0 rounded-full px-3 py-1 text-xs text-red-800 hover:bg-red-50"
                  onClick={() => {
                    if (confirm(tr('photoConfirmDeleteSection'))) {
                      setState((s) => ({
                        ...s,
                        photoSections: s.photoSections.filter((_, i) => i !== si),
                      }));
                    }
                  }}
                >
                  {tr('remove')}
                </button>
              </div>
              {!isCollapsed && (
                <div className="space-y-3 px-4 py-4">
                  {!sec.titleKey ? (
                    <label className="flex flex-col gap-1 text-sm">
                      <span className="label-cap">{tr('photoSectionLabel')}</span>
                      <input
                        className="max-w-md rounded border px-3 py-2"
                        style={{ borderColor: 'rgba(122,107,92,0.35)' }}
                        value={sec.customTitle || ''}
                        onChange={(e) => {
                          const v = e.target.value;
                          setState((s) => {
                            const sections = [...s.photoSections];
                            sections[si] = { ...sections[si], customTitle: v };
                            return { ...s, photoSections: sections };
                          });
                        }}
                      />
                    </label>
                  ) : null}
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[720px] text-sm">
                      <thead>
                        <tr className="border-b border-black/10 text-left">
                          <th className="w-10 py-2 pr-2">✓</th>
                          <th className="py-2 pr-2">{tr('photoDescCol')}</th>
                          <th className="py-2 pr-2">{tr('photoColPriority')}</th>
                          <th className="py-2 pr-2">{tr('photoColNotes')}</th>
                          <th className="w-10 py-2" />
                        </tr>
                      </thead>
                      <tbody>
                        {sec.items.map((it, ii) => (
                          <tr key={it.id} className="border-b border-black/5">
                            <td className="py-2 pr-2 align-top">
                              <input
                                type="checkbox"
                                checked={it.done}
                                onChange={() =>
                                  setState((s) => {
                                    const sections = [...s.photoSections];
                                    const items = [...sections[si].items];
                                    items[ii] = { ...items[ii], done: !items[ii].done };
                                    sections[si] = { ...sections[si], items };
                                    return { ...s, photoSections: sections };
                                  })
                                }
                              />
                            </td>
                            <td className="py-1 pr-2 align-top">
                              <input
                                className="w-full rounded border px-2 py-1"
                                style={{ borderColor: 'rgba(122,107,92,0.35)' }}
                                value={it.description}
                                onChange={(e) => {
                                  const v = e.target.value;
                                  setState((s) => {
                                    const sections = [...s.photoSections];
                                    const items = [...sections[si].items];
                                    items[ii] = { ...items[ii], description: v };
                                    sections[si] = { ...sections[si], items };
                                    return { ...s, photoSections: sections };
                                  });
                                }}
                              />
                            </td>
                            <td className="py-1 pr-2 align-top">
                              <select
                                className="rounded border px-2 py-1"
                                style={{ borderColor: 'rgba(122,107,92,0.35)' }}
                                value={it.priority}
                                onChange={(e) => {
                                  const v = e.target.value;
                                  setState((s) => {
                                    const sections = [...s.photoSections];
                                    const items = [...sections[si].items];
                                    items[ii] = { ...items[ii], priority: v };
                                    sections[si] = { ...sections[si], items };
                                    return { ...s, photoSections: sections };
                                  });
                                }}
                              >
                                <option value="must">{tr('photoPriorityMust')}</option>
                                <option value="nice">{tr('photoPriorityNice')}</option>
                              </select>
                            </td>
                            <td className="py-1 pr-2 align-top">
                              <input
                                className="w-full rounded border px-2 py-1"
                                style={{ borderColor: 'rgba(122,107,92,0.35)' }}
                                value={it.notes}
                                onChange={(e) => {
                                  const v = e.target.value;
                                  setState((s) => {
                                    const sections = [...s.photoSections];
                                    const items = [...sections[si].items];
                                    items[ii] = { ...items[ii], notes: v };
                                    sections[si] = { ...sections[si], items };
                                    return { ...s, photoSections: sections };
                                  });
                                }}
                              />
                            </td>
                            <td className="py-1 align-top">
                              <button
                                type="button"
                                className="rounded p-2 text-red-800 hover:bg-red-50"
                                aria-label={tr('remove')}
                                onClick={() =>
                                  setState((s) => {
                                    const sections = [...s.photoSections];
                                    const items = sections[si].items.filter((_, j) => j !== ii);
                                    sections[si] = { ...sections[si], items };
                                    return { ...s, photoSections: sections };
                                  })
                                }
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <button
                    type="button"
                    className="rounded-full border px-4 py-2 text-sm font-medium transition hover:-translate-y-0.5"
                    style={{ borderColor: 'var(--taupe-primary)', color: 'var(--taupe-deep)' }}
                    onClick={() =>
                      setState((s) => {
                        const sections = [...s.photoSections];
                        const items = [
                          ...sections[si].items,
                          {
                            id: uid('phi'),
                            done: false,
                            description: '',
                            priority: 'must',
                            notes: '',
                          },
                        ];
                        sections[si] = { ...sections[si], items };
                        return { ...s, photoSections: sections };
                      })
                    }
                  >
                    <Plus className="mr-1 inline h-4 w-4" /> {tr('btnAddShot')}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

const WEEKEND_KEYS = [
  { key: 'rehearsal', labelKey: 'weekendTabRehearsal' },
  { key: 'welcome', labelKey: 'weekendTabWelcome' },
  { key: 'brunch', labelKey: 'weekendTabBrunch' },
  { key: 'activities', labelKey: 'weekendTabActivities' },
];

function WeekendPanel({ state, setState, tr, lang, cardStyle, btnPrimary }) {
  const [wkTab, setWkTab] = useState('rehearsal');
  const pack = state.weekendPack || { rehearsal: [], welcome: [], brunch: [], activities: [] };

  const list = pack[wkTab] || [];

  function patchList(updater) {
    setState((s) => {
      const p = { ...(s.weekendPack || {}) };
      const cur = [...(p[wkTab] || [])];
      p[wkTab] = updater(cur);
      return { ...s, weekendPack: p };
    });
  }

  return (
    <section className="space-y-4 transition-opacity duration-150">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-medium leading-tight tracking-tight sm:text-4xl" style={{ color: 'var(--taupe-deep)' }}>
            {tr('weekendTitle')}
          </h1>
          <p className="mt-2 max-w-2xl text-sm italic opacity-80">{tr('weekendIntro')}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-black/10 pb-3" role="tablist" aria-label="Weekend pack">
        {WEEKEND_KEYS.map(({ key, labelKey }) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={wkTab === key}
            className="rounded-full px-4 py-2 text-sm font-medium transition hover:-translate-y-0.5"
            style={wkTab === key ? btnPrimary : { ...cardStyle, padding: '0.45rem 1rem' }}
            onClick={() => setWkTab(key)}
          >
            {tr(labelKey)}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap justify-end gap-2">
        <button
          type="button"
          style={btnPrimary}
          className="transition hover:-translate-y-0.5"
          onClick={() => patchList((arr) => [...arr, newWeekendEvent()])}
        >
          {tr('weekendAddEvent')}
        </button>
      </div>

      {!list.length ? (
        <div style={cardStyle} className="p-10 text-center text-sm opacity-70">
          {tr('empty')}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {list.map((ev, idx) => (
            <div key={ev.id} style={cardStyle} className="space-y-3 p-4 transition hover:-translate-y-0.5">
              <input
                className="w-full rounded border px-3 py-2 font-display text-lg italic"
                style={{ borderColor: 'rgba(122,107,92,0.35)', color: 'var(--taupe-deep)' }}
                placeholder={tr('eventTitlePh')}
                value={ev.title}
                onChange={(e) => {
                  const v = e.target.value;
                  patchList((arr) => {
                    const next = [...arr];
                    next[idx] = { ...next[idx], title: v };
                    return next;
                  });
                }}
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex flex-col gap-1 text-sm">
                  <span className="label-cap">{tr('weekendColLocation')}</span>
                  <input
                    className="rounded border px-2 py-1"
                    style={{ borderColor: 'rgba(122,107,92,0.35)' }}
                    value={ev.location || ''}
                    onChange={(e) => {
                      const v = e.target.value;
                      patchList((arr) => {
                        const next = [...arr];
                        next[idx] = { ...next[idx], location: v };
                        return next;
                      });
                    }}
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  <span className="label-cap">{tr('weekendColTime')}</span>
                  <input
                    className="rounded border px-2 py-1"
                    style={{ borderColor: 'rgba(122,107,92,0.35)' }}
                    value={ev.time || ''}
                    placeholder="18:30"
                    onChange={(e) => {
                      const v = e.target.value;
                      patchList((arr) => {
                        const next = [...arr];
                        next[idx] = { ...next[idx], time: v };
                        return next;
                      });
                    }}
                  />
                </label>
              </div>
              <label className="flex flex-col gap-1 text-sm">
                <span className="label-cap">{tr('weekendColGuests')}</span>
                <textarea
                  className="min-h-[72px] rounded border px-2 py-1"
                  style={{ borderColor: 'rgba(122,107,92,0.35)' }}
                  value={ev.guestList || ''}
                  onChange={(e) => {
                    const v = e.target.value;
                    patchList((arr) => {
                      const next = [...arr];
                      next[idx] = { ...next[idx], guestList: v };
                      return next;
                    });
                  }}
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="label-cap">{tr('weekendColMenu')}</span>
                <textarea
                  className="min-h-[72px] rounded border px-2 py-1"
                  style={{ borderColor: 'rgba(122,107,92,0.35)' }}
                  value={ev.menu || ''}
                  onChange={(e) => {
                    const v = e.target.value;
                    patchList((arr) => {
                      const next = [...arr];
                      next[idx] = { ...next[idx], menu: v };
                      return next;
                    });
                  }}
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="label-cap">{tr('giftsColNotes')}</span>
                <textarea
                  className="min-h-[64px] rounded border px-2 py-1"
                  style={{ borderColor: 'rgba(122,107,92,0.35)' }}
                  value={ev.notes || ''}
                  onChange={(e) => {
                    const v = e.target.value;
                    patchList((arr) => {
                      const next = [...arr];
                      next[idx] = { ...next[idx], notes: v };
                      return next;
                    });
                  }}
                />
              </label>
              <button
                type="button"
                className="text-sm text-red-800 hover:underline"
                onClick={() =>
                  patchList((arr) => arr.filter((_, i) => i !== idx))
                }
              >
                {tr('remove')}
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function SettingsPanel({ state, setState, tr, lang, cardStyle, btnPrimary, exportJson, importJson, createInitialState, setTab }) {
  return (
    <section className="space-y-6 transition-opacity duration-150 print:block">
      <div>
        <h1 className="font-display text-3xl font-medium leading-tight tracking-tight sm:text-4xl" style={{ color: 'var(--taupe-deep)' }}>
          {tr('settingsTitle')}
        </h1>
        <p className="mt-2 max-w-2xl text-sm italic opacity-80">{tr('settingsIntro')}</p>
        <p className="mt-2 text-xs opacity-60">{tr('settingsBadgeNote')}</p>
      </div>

      <div style={cardStyle} className="grid gap-4 p-6 sm:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="label-cap">{tr('settingsCouple')}</span>
          <input
            className="rounded-xl border px-3 py-2"
            style={{ borderColor: 'rgba(122,107,92,0.35)' }}
            value={state.coupleNames}
            onChange={(e) => setState((s) => ({ ...s, coupleNames: e.target.value }))}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="label-cap">{tr('settingsDate')}</span>
          <input
            type="date"
            className="rounded-xl border px-3 py-2"
            style={{ borderColor: 'rgba(122,107,92,0.35)' }}
            value={state.weddingDate}
            onChange={(e) => setState((s) => ({ ...s, weddingDate: e.target.value }))}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="label-cap">{tr('settingsBudget')}</span>
          <input
            type="number"
            min={0}
            className="rounded-xl border px-3 py-2"
            style={{ borderColor: 'rgba(122,107,92,0.35)' }}
            value={state.totalBudget || ''}
            onChange={(e) => setState((s) => ({ ...s, totalBudget: Number(e.target.value) || 0 }))}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="label-cap">{tr('guestsLabel')}</span>
          <input
            className="rounded-xl border px-3 py-2"
            style={{ borderColor: 'rgba(122,107,92,0.35)' }}
            value={state.guestCount}
            onChange={(e) => setState((s) => ({ ...s, guestCount: e.target.value }))}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="label-cap">{tr('settingsCurrency')}</span>
          <select
            className="rounded-xl border px-3 py-2"
            style={{ borderColor: 'rgba(122,107,92,0.35)' }}
            value={state.currency}
            onChange={(e) => setState((s) => ({ ...s, currency: e.target.value }))}
          >
            <option value="EUR">EUR</option>
            <option value="USD">USD</option>
            <option value="GBP">GBP</option>
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="label-cap">{tr('settingsLang')}</span>
          <select
            className="rounded-xl border px-3 py-2"
            style={{ borderColor: 'rgba(122,107,92,0.35)' }}
            value={state.lang}
            onChange={(e) => setState((s) => ({ ...s, lang: e.target.value }))}
          >
            <option value="nl">Nederlands</option>
            <option value="en">English</option>
            <option value="fr">Français</option>
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="label-cap">{tr('settingsTone')}</span>
          <select
            className="rounded-xl border px-3 py-2"
            style={{ borderColor: 'rgba(122,107,92,0.35)' }}
            value={state.planningTone || 'casual'}
            onChange={(e) => setState((s) => ({ ...s, planningTone: e.target.value }))}
          >
            <option value="formal">{tr('toneFormal')}</option>
            <option value="casual">{tr('toneCasual')}</option>
            <option value="playful">{tr('tonePlayful')}</option>
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="label-cap">{tr('settingsTheme')}</span>
          <select
            className="rounded-xl border px-3 py-2"
            style={{ borderColor: 'rgba(122,107,92,0.35)' }}
            value={state.themeId || 'ivory_silk'}
            onChange={(e) => setState((s) => ({ ...s, themeId: e.target.value }))}
          >
            {THEMES.map((th) => (
              <option key={th.id} value={th.id}>
                {themeLabel(th, lang)}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="label-cap">{tr('settingsDir')}</span>
          <select
            className="rounded-xl border px-3 py-2"
            style={{ borderColor: 'rgba(122,107,92,0.35)' }}
            value={state.textDir === 'rtl' ? 'rtl' : 'ltr'}
            onChange={(e) => setState((s) => ({ ...s, textDir: e.target.value }))}
          >
            <option value="ltr">{tr('dirLtr')}</option>
            <option value="rtl">{tr('dirRtl')}</option>
          </select>
        </label>
      </div>

      <div className="flex flex-wrap gap-3">
        <button type="button" className="flex items-center gap-2 px-4 py-2 font-medium transition hover:-translate-y-0.5" style={btnPrimary} onClick={exportJson}>
          <Download className="h-4 w-4" aria-hidden /> {tr('saveBackup')}
        </button>
        <label className="flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition hover:-translate-y-0.5" style={{ borderColor: 'var(--taupe-primary)' }}>
          <Upload className="h-4 w-4" aria-hidden />
          {tr('loadBackup')}
          <input type="file" accept="application/json" className="hidden" onChange={(e) => e.target.files?.[0] && importJson(e.target.files[0])} />
        </label>
        <button
          type="button"
          className="flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition hover:-translate-y-0.5"
          style={{ borderColor: 'var(--taupe-deep)' }}
          onClick={() => window.print()}
        >
          <Printer className="h-4 w-4" aria-hidden /> {tr('exportPdf')}
        </button>
        <button
          type="button"
          className="flex items-center gap-2 rounded-full border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-800 transition hover:-translate-y-0.5"
          onClick={() => {
            if (confirm(tr('confirmClear'))) {
              setState(createInitialState());
              setTab('welcome');
            }
          }}
        >
          <AlertTriangle className="h-4 w-4" aria-hidden /> {tr('clearAll')}
        </button>
      </div>
    </section>
  );
}

function MilestonesPanel({ state, setState, tr, cardStyle }) {
  return (
    <section className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-medium leading-tight tracking-tight sm:text-4xl" style={{ color: 'var(--taupe-deep)' }}>{tr('milestonesTitle')}</h1>
        <p className="mt-2 text-sm opacity-80">{tr('milestonesIntro')}</p>
      </div>
      {state.milestonePhases.map((phase, pi) => (
        <div key={phase.id} style={cardStyle} className="p-4">
          <h2 className="font-display text-xl italic">{phase.label}</h2>
          <ul className="mt-3 space-y-2">
            {phase.tasks.map((task, ti) => (
              <li key={task.id} className="flex items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={task.done}
                  onChange={() =>
                    setState((s) => {
                      const phases = [...s.milestonePhases];
                      const tasks = [...phases[pi].tasks];
                      tasks[ti] = { ...tasks[ti], done: !tasks[ti].done };
                      phases[pi] = { ...phases[pi], tasks };
                      return { ...s, milestonePhases: phases };
                    })
                  }
                />
                {task.label}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}

const VENUE_Q = [
  'What is included in the rental?',
  'What is the backup plan for weather?',
  'What time can vendors access?',
];

function QuestionsPanel({ tr, lang, cardStyle }) {
  return (
    <section style={cardStyle} className="space-y-4 p-6">
      <h1 className="font-display text-3xl font-medium leading-tight tracking-tight sm:text-4xl" style={{ color: 'var(--taupe-deep)' }}>{tr('questionsTitle')}</h1>
      <p className="text-sm opacity-80">{tr('questionsIntro')}</p>
      <h2 className="font-medium">Venue</h2>
      <ul className="space-y-3">
        {VENUE_Q.map((q, i) => (
          <li key={i} className="text-sm">
            <div className="opacity-90">{q}</div>
            <textarea className="mt-1 w-full rounded border px-2 py-1" rows={2} placeholder={tr('answerPh')} />
          </li>
        ))}
      </ul>
    </section>
  );
}
