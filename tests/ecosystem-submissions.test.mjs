import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {BlobError, BlobPreconditionFailedError} from '@vercel/blob';
import {createEcosystemHandler, readApprovedEcosystemRecords, validateEcosystemReview} from '../api/ecosystem.js';
import {applyEcosystemUpdates, ecosystemTaxonomy} from '../assets/ecosystem-updates-model.js';
import {statsSeries, startEvent} from '../assets/ecosystem-stats-model.js';
import {memberFor} from '../assets/ecosystem-model.js';

const category = {section: 'Tokenization', name: 'Tokenization Platforms'};
const institution = {section: 'Institutions', name: 'Banks and financial institutions'};
const history = {section: 'Historical', name: 'Closed initiatives'};
const source = {title: 'Official launch', url: 'https://alpha.example/launch'};
const base = {
  snapshotDate: '2026-10-08', upstreamSnapshotDate: '2026-09-01',
  profiles: [
    {id: 'alpha', name: 'Alpha', website: 'https://alpha.example', aliases: ['Alpha Tokenization'], directoryStatus: 'current', categories: [category], description: 'Original description', officialUpdates: [], sources: [], logo: {src: '/alpha.svg'}, newsRules: [], relatedEntities: []},
    {id: 'bank', name: 'Old Bank', website: 'https://bank.example', aliases: [], directoryStatus: 'current', categories: [institution], description: 'A bank', officialUpdates: [], sources: [], relatedEntities: []},
    {id: 'closed', name: 'Closed Co', website: '', aliases: [], directoryStatus: 'historical', categories: [history], description: 'Closed', failedInitiative: true, exitEvents: [{id: 'exit-closed', status: 'completed', type: 'acquisition', target: 'Closed Co', counterparty: 'Buyer', completedDate: '2024-01-01', sources: [source]}], officialUpdates: [], sources: [], relatedEntities: []},
    {id: 'legacy', name: 'Legacy', website: 'https://legacy.example', aliases: [], directoryStatus: 'current', categories: [{section: 'RWAF directory', name: 'TradFi'}], description: 'Legacy institution'}
  ],
  sections: [
    {name: 'Tokenization', categories: [{name: category.name, ids: ['alpha']}]},
    {name: 'Institutions', categories: [{name: institution.name, ids: ['bank']}]},
    {name: 'RWAF directory', categories: [{name: 'TradFi', ids: ['legacy']}]},
    {name: 'Historical', categories: [{name: history.name, ids: ['closed']}]}
  ],
  statsEvents: [
    {id: 'alpha-start', profileId: 'alpha', type: 'founding', date: '2012-01', sources: [source]},
    {id: 'bank-start', profileId: 'bank', type: 'founding', date: '1900', sources: [source]},
    {id: 'closed-start', profileId: 'closed', type: 'launch', date: '2022-06', sources: [source]},
    {id: 'closed-failure', profileId: 'closed', type: 'failure', date: '2025-05', sources: [source]}
  ]
};
const submit = {name: 'New Project', description: 'A new tokenization service.', type: 'Issuer (tokenizes real-world assets)', region: 'United States', website: 'https://new-project.example', email: 'private@new-project.example', websiteConfirm: ''};
const review = {profileId: null, name: submit.name, description: submit.description, website: submit.website, region: submit.region, categories: [category], directoryStatus: 'current', start: {date: '2025-Q2', type: 'launch', sourceUrl: 'https://new-project.example/launch', sourceTitle: 'Project launch announcement'}};
const env = {BLOB_READ_WRITE_TOKEN: 'test-token', JOBS_ADMIN_PW: 'secret', NODE_ENV: 'production', VERCEL: '1'};
const now = () => new Date('2026-10-09T12:00:00Z');
const clone = value => JSON.parse(JSON.stringify(value));

function setup(options = {}) {
  let data = options.data ? clone(options.data) : null, revision = data ? 1 : 0, writes = 0;
  const storage = {
    async get(path, settings) {
      assert.equal(path, 'ecosystem-submissions.json');
      assert.equal(settings.access, 'private');
      assert.equal(settings.useCache, false);
      assert.equal(settings.headers['Accept-Encoding'], 'identity');
      return data ? {stream: new Response(JSON.stringify(data)).body, blob: {etag: `v${revision}`}} : null;
    },
    async put(path, text, settings) {
      assert.equal(path, 'ecosystem-submissions.json');
      assert.equal(settings.access, 'private');
      assert.equal(settings.addRandomSuffix, false);
      if (data && !settings.allowOverwrite) throw new BlobError('already exists');
      if (settings.ifMatch && settings.ifMatch !== `v${revision}`) throw new BlobPreconditionFailedError();
      data = JSON.parse(text); writes++;
      return {etag: `v${++revision}`};
    }
  };
  const handler = createEcosystemHandler(options.storage || storage, {env: options.env || env, now: options.now || now, baseData: options.baseData || base});
  return {handler, storage, data: () => data, writes: () => writes};
}
async function call(handler, body, method = 'POST', headers = {}, socket = {remoteAddress: '203.0.113.2'}) {
  const response = {headers: {}};
  await handler({method, body, socket, headers: {host: 'www.rwaf.xyz', origin: 'https://www.rwaf.xyz', 'content-type': 'application/json', 'x-vercel-forwarded-for': '203.0.113.1', ...headers}}, {
    setHeader(name, value) { response.headers[name] = value; },
    status(value) { response.status = value; return this; },
    json(value) { response.body = value; }
  });
  return response;
}
const admin = (handler, body = {}) => call(handler, {action: 'list_all', pw: 'secret', ...body});
async function submitted(handler, fields = {}) {
  assert.equal((await call(handler, {action: 'submit', submission: {...submit, ...fields}})).status, 200);
  return (await admin(handler)).body;
}

test('directory submissions persist privately, await moderation, and publish only approved review fields', async () => {
  const {handler} = setup();
  const queue = await submitted(handler, {status: 'approved', member: true, id: 'chosen'});
  const row = queue.submissions[0];
  assert.equal(row.status, 'pending');
  assert.notEqual(row.id, 'chosen');
  assert.equal(row.submission.member, undefined);
  assert.equal(row.review, null);
  assert.equal(row.notifications.received.status, 'pending');
  assert.deepEqual((await call(handler, null, 'GET')).body, {records: [], updatedAt: null});
  assert.equal((await admin(handler, {pw: 'wrong'})).status, 401);
  const approved = await admin(handler, {action: 'save_review', id: row.id, status: 'approved', revision: queue.revision, review: {...review, email: 'leak@example.com', member: true}});
  assert.equal(approved.status, 200);
  assert.equal((await admin(handler)).body.submissions[0].notifications.published.status, 'pending');
  const publicResult = await call(handler, null, 'GET');
  assert.equal(publicResult.body.records.length, 1);
  assert.equal(publicResult.body.updatedAt, now().toISOString());
  assert.deepEqual(Object.keys(publicResult.body.records[0]).sort(), ['id', 'review', 'updatedAt']);
  assert.equal(JSON.stringify(publicResult.body).includes('private@'), false);
  assert.equal(JSON.stringify(publicResult.body).includes('leak@'), false);
  assert.equal(publicResult.body.records[0].review.member, undefined);
  assert.equal(publicResult.headers['Vercel-CDN-Cache-Control'], 'no-store');
  assert.equal((await admin(handler)).body.submissions[0].submission.email, submit.email);
});

test('safe pending drafts can be saved, incomplete approval fails, and rejection is always possible', async () => {
  const {handler} = setup();
  let queue = await submitted(handler);
  const id = queue.submissions[0].id;
  const draft = {...review, categories: [], start: {...review.start, sourceUrl: '', sourceTitle: ''}};
  assert.equal((await admin(handler, {action: 'save_review', id, status: 'pending', revision: queue.revision, review: draft})).status, 200);
  queue = (await admin(handler)).body;
  assert.deepEqual(queue.submissions[0].review.categories, []);
  assert.equal((await admin(handler, {action: 'save_review', id, status: 'approved', revision: queue.revision, review: draft})).status, 400);
  assert.equal((await admin(handler, {action: 'save_review', id, status: 'rejected', revision: queue.revision, review: {website: 'javascript:alert(1)'}})).status, 200);
  assert.deepEqual((await call(handler, null, 'GET')).body.records, []);
  assert.equal((await admin(handler)).body.submissions[0].status, 'rejected');
});

test('JSON, origin, size, honeypot and validation checks prevent invalid submissions without storing them', async () => {
  const {handler, writes} = setup();
  assert.equal((await call(handler, {action: 'submit', submission: {...submit, websiteConfirm: 'bot'}})).status, 200);
  assert.equal((await call(handler, {action: 'submit', submission: submit}, 'POST', {origin: 'https://elsewhere.example'})).status, 403);
  assert.equal((await call(handler, {action: 'submit', submission: submit}, 'POST', {origin: ''})).status, 403);
  assert.equal((await call(handler, {action: 'submit', submission: submit}, 'POST', {'content-type': 'text/plain'})).status, 415);
  assert.equal((await call(handler, {action: 'submit', submission: {...submit, description: 'x'.repeat(31000)}})).status, 413);
  for (const changes of [{name: {}}, {name: 'a'.repeat(121)}, {description: ''}, {type: 'Bad type'}, {email: ''}, {email: 'invalid'}, {website: 'javascript:alert(1)'}, {website: 'https://u:p@example.com'}, {name: 'bad\u0000name'}]) {
    assert.equal((await call(handler, {action: 'submit', submission: {...submit, ...changes}})).status, 400, JSON.stringify(changes));
  }
  assert.equal((await call(handler, null, 'DELETE')).status, 405);
  assert.equal(writes(), 0);
});

test('server rate limit persists hashes only and cannot be evaded with user-controlled forwarded-for', async () => {
  const {handler, data} = setup();
  for (let i = 0; i < 5; i++) assert.equal((await call(handler, {action: 'submit', submission: {...submit, name: `Company ${i}`}}, 'POST', {'x-forwarded-for': `198.51.100.${i}`})).status, 200);
  const limited = await call(handler, {action: 'submit', submission: {...submit, name: 'Sixth'}});
  assert.equal(limited.status, 429);
  assert.equal(limited.headers['Retry-After'], '3600');
  assert.equal(Object.keys(data().rateLimits).length, 1);
  assert.match(Object.keys(data().rateLimits)[0], /^[0-9a-f]{64}$/);
  assert.equal(JSON.stringify(data()).includes('203.0.113'), false);
  const restarted = setup({data: data()});
  assert.equal((await call(restarted.handler, {action: 'submit', submission: {...submit, name: 'After restart'}})).status, 429);
  assert.equal((await call(handler, {action: 'submit', submission: {...submit, name: 'Different visitor'}}, 'POST', {'x-vercel-forwarded-for': '203.0.113.5'})).status, 200);
});

test('repeated submissions deduplicate and concurrent writes preserve both distinct submissions', async () => {
  const {handler} = setup();
  const requests = await Promise.all(['One', 'Two'].map(name => call(handler, {action: 'submit', submission: {...submit, name}})));
  assert.ok(requests.every(result => result.status === 200));
  assert.equal((await admin(handler)).body.submissions.length, 2);
  await call(handler, {action: 'submit', submission: {...submit, name: 'One'}});
  assert.equal((await admin(handler)).body.submissions.length, 2);
});

test('stale administrators cannot overwrite newer changes or silently replace another correction', async () => {
  const {handler} = setup();
  const first = await submitted(handler);
  await submitted(handler, {name: 'Second'});
  assert.equal((await admin(handler, {action: 'save_review', id: first.submissions[0].id, status: 'approved', revision: first.revision, review})).status, 409);
  let queue = (await admin(handler)).body;
  const correction = {...review, profileId: 'alpha', name: 'Alpha', website: 'https://alpha.example'};
  assert.equal((await admin(handler, {action: 'save_profile', profileId: 'alpha', review: correction, revision: queue.revision})).status, 200);
  queue = (await admin(handler)).body;
  assert.equal((await admin(handler, {action: 'save_review', id: first.submissions[0].id, status: 'approved', review: correction, revision: queue.revision})).status, 409);
  assert.equal((await admin(handler, {action: 'save_profile', profileId: 'alpha', review: {...correction, description: 'Updated again'}, revision: queue.revision})).status, 200);
  assert.equal((await call(handler, null, 'GET')).body.records.length, 1);
});

test('approvals reject duplicate names, aliases and websites unless linked to their canonical company', async () => {
  const {handler} = setup();
  let queue = await submitted(handler);
  const id = queue.submissions[0].id;
  for (const changes of [{name: 'Alpha'}, {name: 'Alpha Tokenization'}, {website: 'https://www.alpha.example/about'}]) {
    assert.equal((await admin(handler, {action: 'save_review', id, status: 'approved', revision: queue.revision, review: {...review, ...changes}})).status, 409);
  }
  assert.equal((await admin(handler, {action: 'save_review', id, status: 'approved', revision: queue.revision, review})).status, 200);
  queue = await submitted(handler, {name: 'New duplicate', website: 'https://new-duplicate.example'});
  assert.equal((await admin(handler, {action: 'save_review', id: queue.submissions[1].id, status: 'approved', revision: queue.revision, review})).status, 409);
  assert.equal((await admin(handler, {action: 'save_review', id: queue.submissions[1].id, status: 'approved', revision: queue.revision, review: {...review, profileId: 'alpha', name: 'Alpha', website: 'https://alpha.example'}})).status, 200);
});

test('review validation requires real sourced dates, valid taxonomy and explicit unknown dates', () => {
  for (const changes of [
    {start: undefined}, {start: {...review.start, date: '2025-02-30'}}, {start: {...review.start, date: '2027'}},
    {start: {...review.start, date: '2026-10-10'}}, {start: {...review.start, sourceUrl: 'data:text/plain,invalid'}},
    {start: {...review.start, sourceTitle: ''}}, {categories: [{section: 'RWAF Directory', name: 'RWAF Members'}]},
    {categories: [history]}, {categories: [category, category]}, {profileId: 'missing'}
  ]) assert.ok(validateEcosystemReview({...review, ...changes}, base, '2026-10-09').error, JSON.stringify(changes));
  for (const date of ['2025', '2025-03', '2025-03-14', '2025-Q4']) assert.equal(validateEcosystemReview({...review, start: {...review.start, date}}, base, '2026-10-09').review.start.date, date);
  assert.equal(validateEcosystemReview({...review, start: null}, base, '2026-10-09').review.start, null);
  assert.ok(validateEcosystemReview({...review, profileId: 'bank', categories: [category]}, base, '2026-10-09').error);
  assert.ok(validateEcosystemReview({...review, start: {...review.start, date: '2000'}}, base, '2026-10-09').error);
  assert.ok(validateEcosystemReview({...review, start: {...review.start, date: '2010-12-31', type: 'industry_entry'}}, base, '2026-10-09').error);
  assert.ok(validateEcosystemReview({...review, start: {...review.start, date: '2011-01-01', type: 'industry_entry'}}, base, '2026-10-09').review);
  assert.equal(validateEcosystemReview({...review, profileId: 'bank', categories: [category], start: {...review.start, type: 'industry_entry'}}, base, '2026-10-09').review.start.type, 'industry_entry');
  assert.ok(validateEcosystemReview({...review, profileId: 'closed', categories: [history]}, base, '2026-10-09').review);
  assert.ok(ecosystemTaxonomy(base).some(section => section.name === 'Additional ecosystem'));
  assert.ok(!ecosystemTaxonomy(base).some(section => ['Historical', 'RWAF directory', 'RWAF Directory'].includes(section.name)));
});

test('approved corrections immediately replace start events in charts and preserve unrelated historical evidence', () => {
  const original = clone(base);
  const corrected = applyEcosystemUpdates(base, {records: [{id: 'fix', updatedAt: now().toISOString(), review: {...review, profileId: 'alpha', name: 'Alpha', website: 'https://alpha.example', categories: [institution], start: {...review.start, date: '2024-12-01', type: 'industry_entry'}}}]});
  assert.deepEqual(base, original);
  assert.equal(corrected.profiles.length, base.profiles.length);
  assert.equal(corrected.snapshotDate, '2026-10-09');
  assert.equal(corrected.statsEvents.filter(event => event.profileId === 'alpha').length, 1);
  assert.equal(startEvent(corrected.profiles[0], corrected.statsEvents).date, '2024-12-01');
  const series = statsSeries(corrected, {metric: 'new', from: '2024-Q1', to: '2025-Q4'});
  assert.equal(series.points.find(point => point.label === 'Q4 2024').events.some(event => event.profileId === 'alpha'), true);
  assert.equal(corrected.sections.find(section => section.name === 'Tokenization').categories[0].ids.includes('alpha'), false);
  assert.equal(corrected.sections.find(section => section.name === 'Institutions').categories[0].ids.includes('alpha'), true);
  assert.deepEqual(corrected.profiles.find(profile => profile.id === 'closed').exitEvents, base.profiles[2].exitEvents);
  assert.deepEqual(corrected.statsEvents.find(event => event.type === 'failure'), base.statsEvents[3]);
  assert.equal(corrected.profiles[0].logo.src, '/alpha.svg');
});

test('an unknown date clears starts without removing failure events, exits or industry-entry restrictions', () => {
  const records = [
    {id: 'clear', updatedAt: now().toISOString(), review: {...review, profileId: 'closed', name: 'Closed Co', categories: [history], start: null}},
    {id: 'bank-fix', updatedAt: now().toISOString(), review: {...review, profileId: 'bank', name: 'Old Bank', categories: [category], start: null}}
  ];
  const data = applyEcosystemUpdates(base, {records});
  assert.equal(startEvent(data.profiles[2], data.statsEvents), null);
  assert.equal(data.statsEvents.some(event => event.id === 'closed-failure'), true);
  assert.equal(data.profiles[2].exitEvents.length, 1);
  assert.equal(data.profiles[1].industryStartRequired, true);
  assert.deepEqual(data.profiles[1].categories, [category]);
});

test('new approved companies have stable IDs and map placements without granting membership or inventing dates', () => {
  const data = applyEcosystemUpdates(base, {records: [{id: 'new-id', updatedAt: now().toISOString(), review: {...review, start: {...review.start, date: '2025'}}}]});
  const profile = data.profiles.at(-1);
  assert.equal(profile.id, 'submitted-new-id');
  assert.deepEqual(profile.newsRules, []);
  assert.equal(memberFor(profile, [{name: 'Another member'}]), undefined);
  assert.equal(data.sections[0].categories[0].ids.includes(profile.id), true);
  assert.equal(data.sections.some(section => section.name === 'RWAF Directory'), false);
  assert.equal(startEvent(profile, data.statsEvents).date, '2025');
  const quarterly = statsSeries(data, {metric: 'new'}), yearly = statsSeries(data, {metric: 'new', unit: 'year'});
  assert.equal(quarterly.unknown.some(event => event.profileId === profile.id), true);
  assert.equal(yearly.shownEvents.some(event => event.profileId === profile.id), true);
});

test('storage errors and bounded conflicts never claim success, and SHA256 admin authentication works', async () => {
  const broken = setup({storage: {async get() { throw Error('Unavailable'); }}});
  assert.equal((await call(broken.handler, {action: 'submit', submission: submit})).status, 502);
  assert.equal((await call(broken.handler, null, 'GET')).status, 502);
  const disabled = setup({env: {...env, BLOB_READ_WRITE_TOKEN: ''}});
  assert.equal((await call(disabled.handler, {action: 'submit', submission: submit})).status, 503);
  const hashed = setup({env: {...env, JOBS_ADMIN_PW: '', JOBS_ADMIN_PW_SHA256: createHash('sha256').update('secret').digest('hex')}});
  assert.equal((await admin(hashed.handler)).status, 200);
  let conflicts = 0;
  const racing = setup({storage: {async get() { return null; }, async put() { conflicts++; throw new BlobError('already exists'); }}});
  assert.equal((await call(racing.handler, {action: 'submit', submission: submit})).status, 409);
  assert.equal(conflicts, 3);
});

test('server-side public record loader uses the same private store without exposing contact or rate data', async () => {
  const {handler, storage} = setup();
  const queue = await submitted(handler);
  await admin(handler, {action: 'save_review', id: queue.submissions[0].id, status: 'approved', review, revision: queue.revision});
  const result = await readApprovedEcosystemRecords(env, storage);
  assert.deepEqual(result, (await call(handler, null, 'GET')).body);
  assert.equal(JSON.stringify(result).includes(submit.email), false);
  await assert.rejects(readApprovedEcosystemRecords({}, storage));
});

test('the first-RWA-date rule persists when a newly approved institution is later recategorized', async () => {
  const {handler} = setup();
  let queue = await submitted(handler);
  const id = queue.submissions[0].id;
  const bankReview = {...review, categories: [institution], start: {...review.start, type: 'industry_entry'}};
  assert.equal((await admin(handler, {action: 'save_review', id, status: 'approved', revision: queue.revision, review: bankReview})).status, 200);
  queue = (await admin(handler)).body;
  assert.equal(queue.submissions[0].review.industryStartRequired, true);
  const recategorized = {...review, start: null};
  assert.equal((await admin(handler, {action: 'save_review', id, status: 'approved', revision: queue.revision, review: recategorized})).status, 200);
  queue = (await admin(handler)).body;
  assert.equal((await admin(handler, {action: 'save_review', id, status: 'approved', revision: queue.revision, review})).status, 400);
  const data = applyEcosystemUpdates(base, (await call(handler, null, 'GET')).body);
  assert.equal(data.profiles.at(-1).industryStartRequired, true);
  assert.equal(startEvent(data.profiles.at(-1), data.statsEvents), null);
});

test('weak ETags and concurrent admin writes fail safely instead of overwriting the store', async () => {
  let writes = 0;
  const empty = {version: 1, submissions: [], rateLimits: {}};
  const weak = setup({storage: {
    async get() { return {stream: new Response(JSON.stringify(empty)).body, blob: {etag: 'W/"old"'}}; },
    async put() { writes++; }
  }});
  assert.equal((await admin(weak.handler)).status, 502);
  assert.equal(writes, 0);
  const racing = setup({storage: {
    async get() { return {stream: new Response(JSON.stringify(empty)).body, blob: {etag: 'v1'}}; },
    async put() { writes++; throw new BlobPreconditionFailedError(); }
  }});
  assert.equal((await admin(racing.handler, {action: 'save_profile', profileId: 'alpha', review: {...review, name: 'Alpha', website: 'https://alpha.example'}, revision: 'v1'})).status, 409);
  assert.equal(writes, 1);
});
