import { readFile, writeFile } from 'node:fs/promises';
import { fetchDownloadTotal, validSnapshot } from '../download-counter.js';

const snapshot = await fetchDownloadTotal({ timeoutMs: 30000, headers: {
  'User-Agent': 'Podium-Air-Website',
  ...(process.env.GITHUB_TOKEN && { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` })
} });
let history;
try { history = JSON.parse(await readFile('download-history.json', 'utf8')); }
catch { history = []; }
const daily = new Map();
for (const point of [...history.filter(validSnapshot), snapshot].sort((a,b) => Date.parse(a.verifiedAt) - Date.parse(b.verifiedAt))) {
  daily.set(point.verifiedAt.slice(0, 10), point);
}
await writeFile('download-count.json', JSON.stringify(snapshot) + '\n');
await writeFile('download-history.json', JSON.stringify([...daily.values()].slice(-366), null, 2) + '\n');
console.log(`Verified ${snapshot.total} APK downloads at ${snapshot.verifiedAt}`);
