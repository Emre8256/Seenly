import { performance } from 'node:perf_hooks';

const [scenario, baseUrl, slug, ownerToken, concurrencyArg = '1', requestsArg = '20'] = process.argv.slice(2);
const concurrency = Number(concurrencyArg);
const requestCount = Number(requestsArg);
const slugs = slug.split(',');

if (!scenario || !baseUrl || !slug || !Number.isInteger(concurrency) || !Number.isInteger(requestCount)) {
  console.error('usage: node node-load.mjs <public|eligibility|submission|owner|rate-limit|auth-verify-invalid|payment-products> <baseUrl> <slug> <ownerToken> <concurrency> <requests>');
  process.exit(2);
}

const lenses = ['samimiyet', 'cekicilik', 'zeka', 'vizyon', 'enerji', 'guvenilirlik', 'ego', 'basari', 'comertlik', 'olgunluk'];
let next = 0;
const latencies = [];
const statuses = new Map();
const started = performance.now();

function clientIp(index) {
  const second = 10 + Math.floor(index / 60000) % 200;
  const third = Math.floor(index / 250) % 250;
  const fourth = 1 + (index % 249);
  return `10.${second}.${third}.${fourth}`;
}

function requestFor(index) {
  const targetSlug = slugs[index % slugs.length];
  const headers = { 'X-Forwarded-For': clientIp(index), 'Content-Type': 'application/json' };
  if (scenario === 'public' || scenario === 'rate-limit') {
    const source = scenario === 'rate-limit' ? '10.99.0.1' : clientIp(index);
    return [`${baseUrl}/api/v1/seenly/public/${targetSlug}`, { headers: { 'X-Forwarded-For': source } }];
  }
  if (scenario === 'eligibility') {
    return [`${baseUrl}/api/v1/seenly/friend/${targetSlug}/check-eligibility`, {
      method: 'POST', headers, body: JSON.stringify({ fingerprintHash: `eligibility-${index}` })
    }];
  }
  if (scenario === 'submission') {
    return [`${baseUrl}/api/v1/seenly/friend/${targetSlug}/respond`, {
      method: 'POST', headers, body: JSON.stringify({
        nickname: 'load-test', fingerprintHash: `submission-${Date.now()}-${index}`,
        friendResponses: lenses.map((lens, offset) => ({ questionId: `classic_friend_${lens}_01`, answerValue: 1 + ((index + offset) % 5) })),
        friendTimeAnalytics: Object.fromEntries(lenses.map((lens) => [lens, 1000]))
      })
    }];
  }
  if (scenario === 'owner') {
    return [`${baseUrl}/api/v1/seenly/owner`, { headers: { 'X-Owner-Token': ownerToken, 'X-Forwarded-For': clientIp(index) } }];
  }
  if (scenario === 'auth-verify-invalid') {
    return [`${baseUrl}/api/v1/seenly/auth/verify-code`, {
      method: 'POST', headers, body: JSON.stringify({
        email: `missing-${index}@load.seenly.test`, code: '000000', purpose: 'LOGIN'
      })
    }];
  }
  if (scenario === 'payment-products') {
    return [`${baseUrl}/api/billing/products`, { headers: { 'X-Forwarded-For': clientIp(index) } }];
  }
  throw new Error(`unknown scenario: ${scenario}`);
}

async function worker() {
  while (true) {
    const index = next++;
    if (index >= requestCount) return;
    const [url, options] = requestFor(index);
    const before = performance.now();
    try {
      const response = await fetch(url, options);
      await response.arrayBuffer();
      statuses.set(response.status, (statuses.get(response.status) ?? 0) + 1);
    } catch {
      statuses.set(0, (statuses.get(0) ?? 0) + 1);
    }
    latencies.push(performance.now() - before);
  }
}

await Promise.all(Array.from({ length: concurrency }, worker));
latencies.sort((a, b) => a - b);
const elapsedSeconds = (performance.now() - started) / 1000;
const percentile = (p) => latencies[Math.min(latencies.length - 1, Math.ceil(latencies.length * p) - 1)] ?? 0;
const unexpected = [...statuses.entries()].filter(([status]) => status === 0 || status >= 500).reduce((sum, [, count]) => sum + count, 0);
const expectedRejections = [...statuses.entries()].filter(([status]) => status === 409 || status === 429).reduce((sum, [, count]) => sum + count, 0);

console.log(JSON.stringify({
  scenario, concurrency, requests: requestCount,
  throughputRps: Number((requestCount / elapsedSeconds).toFixed(2)),
  p50Ms: Number(percentile(0.50).toFixed(2)), p95Ms: Number(percentile(0.95).toFixed(2)), p99Ms: Number(percentile(0.99).toFixed(2)),
  unexpectedErrorPercent: Number((unexpected * 100 / requestCount).toFixed(2)),
  expectedRejections, statuses: Object.fromEntries([...statuses.entries()].sort((a, b) => a[0] - b[0]))
}));
