import { chromium } from '@playwright/test';

async function measure() {
  const browser = await chromium.launch();

  // Desktop 1440px
  const desktopPage = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await desktopPage.goto('http://127.0.0.1:4173/#/', { waitUntil: 'networkidle' });
  await desktopPage.evaluate(async () => {
    window.scrollTo(0, document.body.scrollHeight);
    await new Promise(r => setTimeout(r, 1000));
  });

  const desktopSizes = await desktopPage.evaluate(() => {
    return Array.from(document.querySelectorAll('main img')).map(img => ({
      alt: img.alt || img.getAttribute('aria-label') || 'decorative',
      src: img.currentSrc.split('/').pop(),
      clientWidth: img.clientWidth,
      clientHeight: img.clientHeight,
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight
    }));
  });

  // Desktop 1920px
  const largeDesktopPage = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await largeDesktopPage.goto('http://127.0.0.1:4173/#/', { waitUntil: 'networkidle' });
  await largeDesktopPage.evaluate(async () => {
    window.scrollTo(0, document.body.scrollHeight);
    await new Promise(r => setTimeout(r, 1000));
  });

  const largeDesktopSizes = await largeDesktopPage.evaluate(() => {
    return Array.from(document.querySelectorAll('main img')).map(img => ({
      alt: img.alt || img.getAttribute('aria-label') || 'decorative',
      src: img.currentSrc.split('/').pop(),
      clientWidth: img.clientWidth,
      clientHeight: img.clientHeight,
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight
    }));
  });

  // Mobile 390px
  const mobilePage = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true });
  await mobilePage.goto('http://127.0.0.1:4173/#/', { waitUntil: 'networkidle' });
  await mobilePage.evaluate(async () => {
    window.scrollTo(0, document.body.scrollHeight);
    await new Promise(r => setTimeout(r, 1000));
  });

  const mobileSizes = await mobilePage.evaluate(() => {
    return Array.from(document.querySelectorAll('main img')).map(img => ({
      alt: img.alt || img.getAttribute('aria-label') || 'decorative',
      src: img.currentSrc.split('/').pop(),
      clientWidth: img.clientWidth,
      clientHeight: img.clientHeight,
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight
    }));
  });

  console.log('--- Desktop 1440px Sizes ---');
  console.table(desktopSizes);

  console.log('\n--- Desktop 1920px Sizes ---');
  console.table(largeDesktopSizes);

  console.log('\n--- Mobile 390px Sizes ---');
  console.table(mobileSizes);

  await browser.close();
}

measure().catch(console.error);
