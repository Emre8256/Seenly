import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

async function capture() {
  const outDir = 'C:\\Users\\42oyu\\.gemini\\antigravity-ide\\brain\\2918dd06-c7c2-40d9-aed5-550738f8ed83\\scratch\\screenshots';
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://127.0.0.1:4173/#/', { waitUntil: 'networkidle' });

  await page.evaluate(async () => {
    window.scrollTo(0, document.body.scrollHeight);
    await new Promise(r => setTimeout(r, 1000));
    window.scrollTo(0, 0);
    await new Promise(r => setTimeout(r, 500));
  });

  await page.locator('section[aria-labelledby="hero-title"]').screenshot({
    path: path.join(outDir, 'desktop_1440_hero.png')
  });

  await page.locator('#nasil-calisir').screenshot({
    path: path.join(outDir, 'desktop_1440_hiw.png')
  });

  await page.locator('#baglamlar').screenshot({
    path: path.join(outDir, 'desktop_1440_usecases.png')
  });

  await page.locator('#ornek').screenshot({
    path: path.join(outDir, 'desktop_1440_example.png')
  });

  await page.locator('#baslat').screenshot({
    path: path.join(outDir, 'desktop_1440_finalcta.png')
  });

  console.log('Screenshots captured to', outDir);
  await browser.close();
}

capture().catch(console.error);
