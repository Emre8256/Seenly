import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';
import http from 'node:http';

function waitForServer(url, timeout = 15000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const check = () => {
      http.get(url, (res) => {
        resolve();
      }).on('error', () => {
        if (Date.now() - start > timeout) {
          reject(new Error(`Timeout waiting for ${url}`));
        } else {
          setTimeout(check, 200);
        }
      });
    };
    check();
  });
}

function percentile(arr, p) {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const index = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;
  if (lower === upper) return sorted[lower];
  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}

async function profilePage(browser, label, hash) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1'
  });

  // Instrument IntersectionObserver count before navigation
  await context.addInitScript(() => {
    window.__observerCount = 0;
    const OriginalObserver = window.IntersectionObserver;
    window.IntersectionObserver = function (...args) {
      window.__observerCount = (window.__observerCount || 0) + 1;
      return new OriginalObserver(...args);
    };
    window.IntersectionObserver.prototype = OriginalObserver.prototype;
  });

  const page = await context.newPage();
  const cdp = await page.context().newCDPSession(page);

  // Set 4x CPU slowdown for mobile testing
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });

  await page.goto(`http://127.0.0.1:4173/${hash}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Instrument rAF and LongTasks
  await page.evaluate(() => {
    window.__perfData = {
      frames: [],
      longTasks: []
    };

    const longTaskObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        window.__perfData.longTasks.push({
          duration: entry.duration
        });
      }
    });
    try {
      longTaskObserver.observe({ entryTypes: ['longtask'] });
    } catch (e) {}

    let lastTime = performance.now();
    function loop(t) {
      if (!window.__tracking) return;
      const delta = t - lastTime;
      lastTime = t;
      window.__perfData.frames.push(delta);
      requestAnimationFrame(loop);
    }
    window.__startTracking = () => {
      window.__tracking = true;
      requestAnimationFrame((t) => {
        lastTime = t;
        requestAnimationFrame(loop);
      });
    };
    window.__stopTracking = () => {
      window.__tracking = false;
      longTaskObserver.disconnect();
    };
  });

  // Start CDP trace
  const traceEvents = [];
  cdp.on('Tracing.dataCollected', (p) => traceEvents.push(...p.value));
  await cdp.send('Tracing.start', {
    traceConfig: {
      includedCategories: [
        'devtools.timeline',
        'v8.execute',
        'disabled-by-default-devtools.timeline',
        'disabled-by-default-devtools.timeline.frame'
      ]
    }
  });

  await page.evaluate(() => window.__startTracking());

  // Execute fast fling: 6 vigorous flicks down the page
  const maxScroll = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);
  const flingStep = Math.max(maxScroll, 4000) / 6;
  for (let i = 0; i < 6; i++) {
    await page.evaluate((step) => window.scrollBy({ top: step, behavior: 'auto' }), flingStep);
    await page.waitForTimeout(120);
  }
  await page.waitForTimeout(400);

  const clientMetrics = await page.evaluate(() => {
    window.__stopTracking();
    const frames = window.__perfData.frames.slice(1);
    const longTasks = window.__perfData.longTasks;
    const domNodeCount = document.querySelectorAll('*').length;
    const observerCount = window.__observerCount || 0;
    return { frames, longTasks, domNodeCount, observerCount };
  });

  const traceCompleted = new Promise((resolve) => cdp.once('Tracing.tracingComplete', resolve));
  await cdp.send('Tracing.end');
  await traceCompleted;

  // Process CDP trace events
  const traceTotals = {
    Layout: 0,
    UpdateLayoutTree: 0,
    Paint: 0,
    RasterTask: 0,
    FunctionCall: 0
  };
  for (const e of traceEvents) {
    if (e.dur && traceTotals[e.name] !== undefined) {
      traceTotals[e.name] += e.dur / 1000;
    }
  }

  const cleanFrames = clientMetrics.frames;
  const totalDuration = cleanFrames.reduce((a, b) => a + b, 0);
  const avgFps = totalDuration > 0 ? (cleanFrames.length / (totalDuration / 1000)) : 0;
  const p50 = percentile(cleanFrames, 50);
  const p95 = percentile(cleanFrames, 95);
  const p99 = percentile(cleanFrames, 99);
  const max = cleanFrames.length ? Math.max(...cleanFrames) : 0;
  const longTasksGte100 = clientMetrics.longTasks.filter((t) => t.duration >= 100).length;

  await context.close();

  return {
    label,
    FPS: Math.round(avgFps * 10) / 10,
    p50_frame_ms: Math.round(p50 * 10) / 10,
    p95_frame_ms: Math.round(p95 * 10) / 10,
    p99_frame_ms: Math.round(p99 * 10) / 10,
    max_frame_ms: Math.round(max * 10) / 10,
    LongTasks_gte_100ms: longTasksGte100,
    Layout_ms: Math.round(traceTotals.Layout * 10) / 10,
    RecalculateStyle_ms: Math.round(traceTotals.UpdateLayoutTree * 10) / 10,
    Paint_ms: Math.round(traceTotals.Paint * 10) / 10,
    Raster_ms: Math.round(traceTotals.RasterTask * 10) / 10,
    Scripting_ms: Math.round(traceTotals.FunctionCall * 10) / 10,
    DOM_nodes: clientMetrics.domNodeCount,
    IntersectionObservers: clientMetrics.observerCount
  };
}

export async function profileMobileScroll() {
  console.log(`\n======================================================`);
  console.log(`Starting Profile Run: Comparing Landing vs Identities`);
  console.log(`======================================================`);

  // Build first to ensure production artifacts match current code
  console.log('Building production bundle...');
  const build = spawn('npm.cmd', ['run', 'build'], {
    cwd: 'c:\\Users\\42oyu\\OneDrive\\Desktop\\Seenly\\frontend',
    stdio: 'inherit',
    shell: true
  });
  await new Promise((resolve, reject) => {
    build.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`Build failed with code ${code}`))));
  });

  const server = spawn('npm.cmd', ['run', 'preview', '--', '--port', '4173', '--host', '127.0.0.1'], {
    cwd: 'c:\\Users\\42oyu\\OneDrive\\Desktop\\Seenly\\frontend',
    stdio: 'ignore',
    shell: true
  });

  try {
    await waitForServer('http://127.0.0.1:4173');

    const browser = await chromium.launch({
      headless: true,
      args: ['--enable-gpu-benchmarking', '--disable-background-timer-throttling']
    });

    console.log('\n--- Profiling Social Identities Page (#/identities) ---');
    const identitiesMetrics = await profilePage(browser, 'Social Identities (Reference)', '#/identities');

    console.log('\n--- Profiling Landing Page (#/) ---');
    const landingMetrics = await profilePage(browser, 'Landing Page (Stable DOM)', '#/');

    console.log('\n================ Measured Fling Results ================');
    console.table([identitiesMetrics, landingMetrics]);

    await browser.close();
    return { identitiesMetrics, landingMetrics };
  } finally {
    server.kill();
  }
}

if (process.argv[1]?.endsWith('profile-mobile-scroll.mjs')) {
  profileMobileScroll().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
