import { readFileSync, readdirSync, statSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const dist = new URL('../dist/', import.meta.url);
const html = readFileSync(new URL('index.html', dist), 'utf8');
const entryMatch = html.match(/<script[^>]+src="([^"]+\.js)"/);
if (!entryMatch) throw new Error('Unable to identify the initial JavaScript entry.');

const entryPath = new URL(entryMatch[1].replace(/^\//, ''), dist);
const entry = readFileSync(entryPath);
const entryGzip = gzipSync(entry).length;
const assetsDir = new URL('assets/', dist);
const javascript = readdirSync(assetsDir).filter((name) => name.endsWith('.js'));
const largest = javascript.map((name) => ({ name, bytes: statSync(join(fileURLToPath(assetsDir), name)).size }))
  .sort((a, b) => b.bytes - a.bytes)[0];

const budgets = {
  initialJavaScriptGzipBytes: 85 * 1024,
  largestJavaScriptChunkBytes: 350 * 1024,
};

console.log(JSON.stringify({ entry: entryMatch[1], entryGzipBytes: entryGzip, chunks: javascript.length, largest, budgets }));
if (entryGzip > budgets.initialJavaScriptGzipBytes) {
  throw new Error(`Initial JS gzip budget exceeded: ${entryGzip} > ${budgets.initialJavaScriptGzipBytes}`);
}
if (largest.bytes > budgets.largestJavaScriptChunkBytes) {
  throw new Error(`Largest JS chunk budget exceeded: ${largest.bytes} > ${budgets.largestJavaScriptChunkBytes}`);
}
