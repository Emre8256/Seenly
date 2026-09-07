import { launch } from 'chrome-launcher';
import lighthouse from 'lighthouse';
import { spawn } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';

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

async function main() {
  const server = spawn('npm.cmd', ['run', 'preview', '--', '--port', '4173', '--host', '127.0.0.1'], {
    cwd: 'c:\\Users\\42oyu\\OneDrive\\Desktop\\Seenly\\frontend',
    stdio: 'ignore',
    shell: true
  });

  let chrome;
  try {
    await waitForServer('http://127.0.0.1:4173');
    chrome = await launch({ chromeFlags: ['--headless'] });

    const runnerResult = await lighthouse('http://127.0.0.1:4173/#/', {
      logLevel: 'error',
      output: 'json',
      port: chrome.port,
      onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
    });

    const lhr = runnerResult.lhr;
    fs.writeFileSync('lighthouse-report-after.json', JSON.stringify(lhr, null, 2));

    const metrics = {
      performanceScore: Math.round(lhr.categories.performance.score * 100),
      accessibilityScore: Math.round(lhr.categories.accessibility.score * 100),
      bestPracticesScore: Math.round(lhr.categories['best-practices'].score * 100),
      seoScore: Math.round(lhr.categories.seo.score * 100),
      FCP: lhr.audits['first-contentful-paint'].displayValue,
      LCP: lhr.audits['largest-contentful-paint'].displayValue,
      CLS: lhr.audits['cumulative-layout-shift'].displayValue,
      TBT: lhr.audits['total-blocking-time'].displayValue,
      SpeedIndex: lhr.audits['speed-index'].displayValue,
    };
    console.log('\n--- Lighthouse Metrics ---');
    console.table([metrics]);
  } finally {
    if (chrome) await chrome.kill();
    server.kill();
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
