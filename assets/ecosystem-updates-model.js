import {dateBounds} from './ecosystem-stats-model.js';

const START_TYPES = new Set(['founding', 'launch', 'industry_entry']);
const sectionName = name => name === 'RWAF directory' ? 'Additional ecosystem' : name;
const clone = value => JSON.parse(JSON.stringify(value));

// Membership is supplied by the logo roster, never by a directory submission.
export function ecosystemTaxonomy(base) {
  return (base.sections || [])
    .filter(section => !['Historical', 'RWAF Directory'].includes(section.name))
    .map(section => ({
      name: sectionName(section.name),
      categories: section.categories.map(category => ({name: category.name}))
    }));
}

export function requiresIndustryStart(profile, events = []) {
  return !!profile?.industryStartRequired ||
    (profile?.categories || []).some(category => category.section === 'Institutions' || category.name === 'TradFi') ||
    events.some(event => event.profileId === profile?.id && START_TYPES.has(event.type) && event.type !== 'industry_entry' && Number(String(event.date).slice(0, 4)) < 2011);
}

export function ecosystemRecordProfileId(record) {
  return record.review?.profileId || `submitted-${record.id}`;
}

// All public views (cards, map, search and statistics) consume this same overlay.
// A saved start replaces previous start evidence so an earlier old date cannot win.
export function applyEcosystemUpdates(base, payload = {}) {
  const data = clone(base);
  data.statsEvents ||= [];
  const byId = new Map(data.profiles.map(profile => [profile.id, profile]));
  const records = Array.isArray(payload.records) ? [...payload.records] : [];
  records.sort((a, b) => String(a.updatedAt || '').localeCompare(String(b.updatedAt || '')));
  for (const record of records) {
    const review = record?.review;
    if (!record?.id || !review || !Array.isArray(review.categories) || !review.categories.length) continue;
    if (!Object.hasOwn(review, 'start')) continue;
    const id = ecosystemRecordProfileId(record);
    const original = byId.get(id);
    // A correction cannot silently create an unrelated missing base profile.
    if (review.profileId && !original) continue;
    const required = review.industryStartRequired === true || requiresIndustryStart(original, data.statsEvents) ||
      review.categories.some(category => category.section === 'Institutions' || category.name === 'TradFi') ||
      !!(review.start && Number(String(review.start.date).slice(0, 4)) < 2011);
    const profile = original || {
      id, kind: 'Company', aliases: [], legacyIds: [], assets: [], relatedEntities: [],
      newsRules: [], newsTags: [], officialUpdates: [], sources: [],
      provenance: 'RWA Foundation · reviewed directory submission', logo: null
    };
    Object.assign(profile, {
      name: review.name, description: review.description, website: review.website,
      region: review.region, directoryStatus: review.directoryStatus,
      categories: review.categories.map(category => ({section: sectionName(category.section), name: category.name})),
      checkedOn: String(record.updatedAt || data.snapshotDate).slice(0, 10)
    });
    try { profile.domain = new URL(review.website).hostname.replace(/^www\./, ''); }
    catch { profile.domain = ''; }
    if (required) profile.industryStartRequired = true;
    if (!original) {
      profile.aliases = [review.name];
      data.profiles.push(profile);
      byId.set(id, profile);
    }
    data.statsEvents = data.statsEvents.filter(event => event.profileId !== id || !START_TYPES.has(event.type));
    if (review.start && START_TYPES.has(review.start.type) && dateBounds(review.start.date) && Number(review.start.date.slice(0, 4)) >= 2011 && (!required || review.start.type === 'industry_entry')) {
      data.statsEvents.push({
        id: `admin-start-${id}`, profileId: id, type: review.start.type,
        date: review.start.date, note: review.start.sourceTitle,
        checkedOn: profile.checkedOn,
        sources: [{title: review.start.sourceTitle, url: review.start.sourceUrl}]
      });
    }
    // Year-only evidence remains year-only; snapshot dates are full calendar days.
    const updated = String(record.updatedAt || '').slice(0, 10);
    if (dateBounds(updated)?.precision === 'day' && updated > data.snapshotDate) data.snapshotDate = updated;
  }

  for (const profile of data.profiles) profile.categories = profile.categories.map(category => ({...category, section: sectionName(category.section)}));
  // Retain the source ordering, remove old placements and append newly approved ones.
  const placements = new Map();
  for (const profile of data.profiles) for (const category of profile.categories) {
    const key = `${category.section}\u0000${category.name}`;
    if (!placements.has(key)) placements.set(key, new Set());
    placements.get(key).add(profile.id);
  }
  const sections = [];
  for (const section of data.sections) {
    const name = sectionName(section.name);
    const categories = section.categories.map(category => {
      const key = `${name}\u0000${category.name}`, ids = placements.get(key) || new Set();
      const existing = category.ids.filter(id => ids.has(id));
      placements.delete(key);
      return {...category, ids: [...new Set([...existing, ...ids])]};
    });
    sections.push({...section, name, categories});
  }
  for (const [key, ids] of placements) {
    const [name, category] = key.split('\u0000');
    let section = sections.find(item => item.name === name);
    if (!section) { section = {name, categories: []}; sections.push(section); }
    section.categories.push({name: category, ids: [...ids]});
  }
  data.sections = sections;
  return data;
}
