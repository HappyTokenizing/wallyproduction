// Refresh the committed fallback before deploying; live ATS feeds also refresh on request.
import { writeFileSync, readFileSync } from 'node:fs';
import { collectJobs } from '../lib/job-feed.js';
let snapshot={jobs:[]};
try { snapshot=JSON.parse(readFileSync(new URL('../data/jobs-snapshot.json',import.meta.url))); } catch {}
const data=await collectJobs({snapshot});
writeFileSync(new URL('../data/jobs-snapshot.json',import.meta.url),JSON.stringify(data,null,2)+'\n');
console.log(data.coverage.map(s=>`${s.company}: ${s.count} (${s.status})`).join('\n'));
