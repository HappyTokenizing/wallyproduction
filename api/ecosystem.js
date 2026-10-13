// Private, project-specific storage. Contact details never enter the public overlay.
import {createHash, createHmac, timingSafeEqual, randomUUID} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {isIP} from 'node:net';
import {get, put, BlobError, BlobPreconditionFailedError} from '@vercel/blob';
import {dateBounds} from '../assets/ecosystem-stats-model.js';
import {ecosystemTaxonomy, requiresIndustryStart, ecosystemRecordProfileId} from '../assets/ecosystem-updates-model.js';

import {assignSubmissionReferences,queueSubmissionEmail,queueTeamSubmissionEmails} from '../lib/submission-emails.js';
const PATH = 'ecosystem-submissions.json';
const DAY = 86400000;
const MAX_ROWS = 5000;
const TYPES = new Set([
  'Issuer (tokenizes real-world assets)', 'Marketplace / exchange', 'DeFi application',
  'Protocol / blockchain / infrastructure', 'Service provider (custody, compliance, oracles, audit, etc.)',
  'TradFi institution', 'Community hub / DAO', 'Other'
]);
const START_TYPES = new Set(['founding', 'launch', 'industry_entry']);
const object = value => !!value && typeof value === 'object' && !Array.isArray(value);
const clean = (value, max, min = 0) => typeof value === 'string' && value.length <= max && value.trim().length >= min && !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value) ? value.trim() : null;
const nameKey = value => String(value || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
const domain = value => { try { return new URL(value).hostname.toLowerCase().replace(/^www\./, ''); } catch { return ''; } };
const validId = value => typeof value === 'string' && /^[a-zA-Z0-9._-]{1,180}$/.test(value);
function webURL(value, required = false) {
  const text = clean(value, 2000, required ? 1 : 0);
  if (text === null || !text) return text;
  try {
    const url = new URL(text);
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password || !url.hostname.includes('.') || /[\s\\]/.test(text)) return null;
    return url.href;
  } catch { return null; }
}
const conflict = error => error instanceof BlobPreconditionFailedError || (error instanceof BlobError && /already exists/i.test(error.message));
let basePromise;
const loadBase = () => basePromise ||= readFile(new URL('../data/ecosystem-directory.json', import.meta.url), 'utf8').then(JSON.parse);

export function validateEcosystemSubmission(value) {
  if (!object(value)) return null;
  const submission = {
    name: clean(value.name, 120, 1), description: clean(value.description, 1000, 1),
    type: TYPES.has(value.type) ? value.type : null, region: clean(value.region, 100, 1),
    website: webURL(value.website, true), email: clean(value.email ?? '', 254, 1)
  };
  if (Object.values(submission).some(item => item === null)) return null;
  if (submission.email && !/^[^\s@:/<>]+@[^\s@:/<>]+\.[^\s@:/<>]+$/.test(submission.email)) return null;
  return submission;
}

export function validateEcosystemReview(value, base, today, {draft = false, priorReview = null} = {}) {
  if (!object(value)) return {error: 'A reviewed company profile is required.'};
  const profileId = value.profileId === null ? null : validId(value.profileId) ? value.profileId : undefined;
  const original = profileId ? base.profiles.find(profile => profile.id === profileId) : null;
  if (profileId === undefined || (profileId && !original)) return {error: 'Select an existing company or create a new profile.'};
  const review = {
    profileId, name: clean(value.name, 120, draft ? 0 : 1), description: clean(value.description, 3000, draft ? 0 : 1),
    website: webURL(value.website ?? ''), region: clean(value.region ?? '', 100),
    directoryStatus: ['current', 'review', 'historical'].includes(value.directoryStatus) ? value.directoryStatus : null
  };
  if (['name', 'description', 'website', 'region', 'directoryStatus'].some(field => review[field] === null)) return {error: 'Check the company name, description, website, region and status.'};
  const allowed = new Set(ecosystemTaxonomy(base).flatMap(section => section.categories.map(category => `${section.name}\u0000${category.name}`)));
  // A date-only correction must not strip a company's existing historical placement.
  for (const category of original?.categories || []) {
    const section = category.section === 'RWAF directory' ? 'Additional ecosystem' : category.section;
    if (section !== 'RWAF Directory') allowed.add(`${section}\u0000${category.name}`);
  }
  if (!Array.isArray(value.categories) || (!draft && !value.categories.length) || value.categories.length > 12) return {error: 'Choose between one and twelve directory categories.'};
  const categories = value.categories.map(category => object(category) ? {section: category.section, name: category.name} : {});
  if (categories.some(category => !allowed.has(`${category.section}\u0000${category.name}`)) || new Set(categories.map(category => `${category.section}\u0000${category.name}`)).size !== categories.length) return {error: 'Choose valid, distinct directory categories. Membership comes from the member roster.'};
  review.categories = categories;
  const priorRequired = requiresIndustryStart(original, base.statsEvents) || priorReview?.industryStartRequired === true;
  const categoryRequired = categories.some(category => category.section === 'Institutions' || category.name === 'TradFi');
  if (priorRequired || (!draft && categoryRequired)) review.industryStartRequired = true;
  if ((!Object.hasOwn(value, 'start') || value.start === undefined) && !draft) return {error: 'Choose a sourced start date or explicitly mark it unknown.'};
  review.start = null;
  if (value.start !== null && value.start !== undefined) {
    if (!object(value.start)) return {error: 'Check the start date and its source.'};
    const date = clean(value.start.date, 10, draft ? 0 : 4), bounds = dateBounds(date);
    const sourceUrl = webURL(value.start.sourceUrl, !draft), sourceTitle = clean(value.start.sourceTitle, 300, draft ? 0 : 1);
    if (date === null || (date && !bounds) || (!draft && !bounds) || (bounds && bounds.start > today) || !START_TYPES.has(value.start.type) || sourceUrl === null || sourceTitle === null || (!draft && (!sourceUrl || !sourceTitle))) return {error: 'Use a real, non-future year, month, day or quarter with its source URL and title.'};
    if (!draft && Number(date.slice(0, 4)) < 2011) return {error: 'Use a verified tokenization / RWA start date from 2011 onward. Older corporate founding dates are excluded from these charts.'};
    const required = priorRequired || categoryRequired || (!!date && Number(date.slice(0, 4)) < 2011);
    if (!draft && required && value.start.type !== 'industry_entry') return {error: 'Use the first tokenization / RWA project date for institutions and companies founded before 2011.'};
    if (!draft && required) review.industryStartRequired = true;
    review.start = {date, type: value.start.type, sourceUrl, sourceTitle};
  }
  return {review};
}

function passwordState(value, env) {
  const hash = env.JOBS_ADMIN_PW ? createHash('sha256').update(env.JOBS_ADMIN_PW).digest('hex') : env.JOBS_ADMIN_PW_SHA256;
  if (!hash || !/^[a-f0-9]{64}$/i.test(hash)) return 'unconfigured';
  if (typeof value !== 'string' || value.length > 1000) return 'invalid';
  return timingSafeEqual(createHash('sha256').update(value).digest(), Buffer.from(hash, 'hex')) ? 'valid' : 'invalid';
}
function clientHash(req, env, token) {
  // Vercel supplies this trusted header. User-controlled forwarded-for is ignored.
  const forwarded = env.VERCEL === '1' ? req.headers?.['x-vercel-forwarded-for'] : '';
  const address = (typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : '') || req.socket?.remoteAddress;
  return isIP(address || '') ? createHmac('sha256', token).update(address).digest('hex') : null;
}
function sameIdentity(review, other, target) {
  const name = nameKey(review.name), host = domain(review.website);
  const originalName = target && [target.name, ...(target.aliases || [])].some(value => nameKey(value) === name);
  const originalHost = target && host && domain(target.website) === host;
  const duplicateName = [other.name, ...(other.aliases || [])].some(value => nameKey(value) === name);
  const duplicateHost = host && domain(other.website) === host;
  // Existing distinct projects can legitimately share a parent company's domain.
  return (duplicateName && !originalName) || (duplicateHost && !originalHost);
}
function duplicateError(review, rows, base, rowId) {
  const target = review.profileId ? base.profiles.find(profile => profile.id === review.profileId) : null;
  for (const profile of base.profiles) {
    if (profile.id !== review.profileId && sameIdentity(review, profile, target)) return `This name or website already belongs to ${profile.name}. Link the submission to that existing profile.`;
  }
  for (const row of rows) {
    if (row.id === rowId || row.status !== 'approved' || !row.review) continue;
    if (review.profileId && row.review.profileId === review.profileId) return 'This company already has an approved correction. Edit that profile in the directory manager.';
    if (ecosystemRecordProfileId(row) !== review.profileId && sameIdentity(review, row.review, target)) return `This name or website already belongs to the approved profile ${row.review.name}.`;
  }
  return null;
}
function publicRecords(rows) {
  return rows.filter(row => row.status === 'approved' && row.review).map(({id, review, updatedAt}) => ({id, review, updatedAt}));
}
function publicPayload(rows) {
  const records = publicRecords(rows);
  return {records, updatedAt: records.reduce((latest, row) => !latest || row.updatedAt > latest ? row.updatedAt : latest, null)};
}

// Server-side consumers such as company-news can resolve the same approved IDs.
export async function readApprovedEcosystemRecords(env = process.env, storage = {get}) {
  if (!env.BLOB_READ_WRITE_TOKEN) throw Error('Directory storage unavailable');
  const result = await storage.get(PATH, {access: 'private', token: env.BLOB_READ_WRITE_TOKEN, useCache: false, headers: {'Accept-Encoding': 'identity'}});
  const store = result ? await new Response(result.stream).json() : {version: 1, submissions: []};
  if (store.version !== 1 || !Array.isArray(store.submissions)) throw Error('Invalid directory storage');
  return publicPayload(store.submissions);
}

export function createEcosystemHandler(storage = {get, put}, {env = process.env, now = () => new Date(), baseData} = {}) {
  return async function handler(req, res) {
    for (const header of ['Cache-Control', 'CDN-Cache-Control', 'Vercel-CDN-Cache-Control']) res.setHeader(header, 'no-store');
    if (!['GET', 'POST'].includes(req.method)) {
      res.setHeader('Allow', 'GET, POST');
      return res.status(405).json({error: 'GET or POST only.'});
    }
    const body = req.body || {};
    if (req.method === 'POST') {
      if (!/^application\/json(?:;|$)/i.test(req.headers?.['content-type'] || '')) return res.status(415).json({error: 'JSON required.'});
      const origin = req.headers?.origin, host = req.headers?.host;
      if (!host || !origin || (origin !== `https://${host}` && !(env.NODE_ENV !== 'production' && origin === `http://${host}`))) return res.status(403).json({error: 'Submit from this website.'});
      if (!object(body)) return res.status(400).json({error: 'Invalid request.'});
      if (Buffer.byteLength(JSON.stringify(body)) > 30000) return res.status(413).json({error: 'Submission too large.'});
      if (body.action !== 'submit') {
        const authenticated = passwordState(body.pw, env);
        if (authenticated !== 'valid') return res.status(authenticated === 'unconfigured' ? 503 : 401).json({error: authenticated === 'unconfigured' ? 'Admin saving is not configured.' : 'Session expired. Sign in again.'});
      }
      if (body.action === 'submit' && body.submission?.websiteConfirm) return res.status(200).json({ok: true});
    }
    const submitting = req.method === 'POST' && body.action === 'submit';
    const input = submitting ? validateEcosystemSubmission(body.submission) : null;
    if (submitting && !input) return res.status(400).json({error: 'Check all fields, including the full website URL and contact email.'});
    const token = env.BLOB_READ_WRITE_TOKEN;
    if (!token) return res.status(503).json({error: 'Directory submissions are temporarily unavailable. Please try again later.'});
    const timestamp = new Date(now()).toISOString(), time = Date.parse(timestamp), today = timestamp.slice(0, 10);
    const rateKey = submitting ? clientHash(req, env, token) : null;
    if (submitting && !rateKey && env.NODE_ENV === 'production') return res.status(503).json({error: 'Could not validate this request. Please try again later.'});
    try {
      const base = baseData || await loadBase();
      for (let attempt = 0; attempt < 3; attempt++) {
        const result = await storage.get(PATH, {access: 'private', token, useCache: false, headers: {'Accept-Encoding': 'identity'}});
        const store = result ? await new Response(result.stream).json() : {version: 1, submissions: [], rateLimits: {}};
        if (!object(store) || store.version !== 1 || !Array.isArray(store.submissions) || !object(store.rateLimits)) throw Error('Invalid directory storage');
        const revision = result?.blob?.etag || null, rows = store.submissions;
        assignSubmissionReferences(rows,'ecosystem');let reference;
        // Never attempt a conditional update with a missing or weak ETag.
        if (result && (!revision || /^W\//i.test(revision))) throw Error('Missing strong storage revision');
        if (req.method === 'GET') {
          return res.status(200).json(publicPayload(rows));
        }
        if (body.action === 'list_all') return res.status(200).json({submissions: rows, revision});
        if (submitting) {
          const prior = rows.find(row => row.submission && time - Date.parse(row.submittedAt) < DAY && JSON.stringify(row.submission) === JSON.stringify(input));
          if (prior) { reference=prior.reference;if (!queueSubmissionEmail(prior, 'ecosystem', 'received', input.email, timestamp)) return res.status(200).json({ok: true,reference}); }
          else {
          if (rows.length >= MAX_ROWS) return res.status(503).json({error: 'The review queue is full. Please contact happy@rwaf.xyz.'});
          store.rateLimits = Object.fromEntries(Object.entries(store.rateLimits).filter(([, times]) => Array.isArray(times)).map(([key, times]) => [key, times.filter(stamp => typeof stamp === 'number' && time - stamp < DAY && stamp <= time)]).filter(([, times]) => times.length));
          const attempts = rateKey ? store.rateLimits[rateKey] || [] : [];
          if (attempts.length >= 10 || attempts.filter(stamp => time - stamp < 3600000).length >= 5) {
            res.setHeader('Retry-After', '3600');
            return res.status(429).json({error: 'Too many submissions. Please try again later.'});
          }
          if (rateKey) store.rateLimits[rateKey] = [...attempts, time];
          const row = {id: randomUUID(), status: 'pending', submittedAt: timestamp, updatedAt: timestamp, submission: input, review: null};
          rows.push(row);assignSubmissionReferences(rows,'ecosystem');reference=row.reference;
          queueSubmissionEmail(row, 'ecosystem', 'received', input.email, timestamp);
          queueTeamSubmissionEmails(row,'ecosystem',timestamp,env);
          }
        } else if (['save_review', 'save_profile'].includes(body.action)) {
          if (body.revision !== revision) return res.status(409).json({error: 'The directory changed. Refresh the manager before saving again.'});
          let row, status = body.status, rawReview = body.review;
          if (body.action === 'save_profile') {
            if (!validId(body.profileId) || !base.profiles.some(profile => profile.id === body.profileId)) return res.status(400).json({error: 'Choose an existing directory company.'});
            row = rows.find(item => item.review?.profileId === body.profileId && item.status === 'approved');
            status = 'approved';
            rawReview = {...(object(rawReview) ? rawReview : {}), profileId: body.profileId};
          } else {
            row = rows.find(item => item.id === body.id);
            if (!row || !['pending', 'approved', 'rejected'].includes(status)) return res.status(400).json({error: 'Invalid submission or review status.'});
          }
          let review = status === 'rejected' ? row.review : null;
          if (status !== 'rejected' && rawReview !== null && rawReview !== undefined) {
            const validated = validateEcosystemReview(rawReview, base, today, {draft: status === 'pending', priorReview: row?.review});
            if (validated.error) return res.status(400).json({error: validated.error});
            review = validated.review;
          }
          if (status === 'approved' && !review) return res.status(400).json({error: 'Complete the reviewed profile before approving.'});
          if (review && status === 'approved') {
            const duplicate = duplicateError(review, rows, base, row?.id);
            if (duplicate) return res.status(409).json({error: duplicate});
          }
          if (!row) {
            if (rows.length >= MAX_ROWS) return res.status(503).json({error: 'Directory storage is full. No changes were saved.'});
            row = {id: randomUUID(), submittedAt: timestamp, submission: null};
            rows.push(row);
          }
          if (status === 'approved' && row.status !== 'approved' && row.submission?.email) queueSubmissionEmail(row, 'ecosystem', 'published', row.submission.email, timestamp);
          Object.assign(row, {status, review, updatedAt: timestamp});
        } else return res.status(400).json({error: 'Unknown action.'});
        try {
          const saved = await storage.put(PATH, JSON.stringify(store), {
            access: 'private', token, contentType: 'application/json', addRandomSuffix: false,
            allowOverwrite: revision !== null, ...(revision !== null ? {ifMatch: revision} : {})
          });
          return res.status(200).json({ok: true, revision: saved.etag,...(reference?{reference}:{})});
        } catch (error) {
          if (conflict(error)) {
            if (submitting) continue;
            return res.status(409).json({error: 'The directory changed. Refresh the manager before saving again.'});
          }
          throw error;
        }
      }
      return res.status(409).json({error: 'Another submission arrived at the same time. Please retry.'});
    } catch (error) {
      console.error('Directory storage request failed:', error.name);
      return res.status(502).json({error: 'Directory storage is unavailable. Keep this page open and retry.'});
    }
  };
}

export default createEcosystemHandler();
