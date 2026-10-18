/**
 * shareService.js
 * Centralized, secure social sharing business logic for 10Signal.
 * Supports both Personality Result and Observer Result cards in 4:3 (1080x810) format.
 */

import brandLogoPng from '../images/Icons/10Signal.png';

export const SHARE_CARD_TYPES = {
  PERSONALITY: 'PERSONALITY_RESULT',
  OBSERVER: 'OBSERVER_RESULT'
};

export { brandLogoPng };

const CANONICAL_ORIGIN = 'https://10signal.me';

/**
 * Returns the public origin for sharing, ensuring no localhost or dev URLs are exposed.
 */
export function getProductionOrigin() {
  if (typeof window !== 'undefined' && window.location?.origin) {
    const origin = window.location.origin;
    if (
      origin.startsWith('http') &&
      !origin.includes('localhost') &&
      !origin.includes('127.0.0.1') &&
      !origin.includes('0.0.0.0')
    ) {
      return origin;
    }
  }
  return CANONICAL_ORIGIN;
}

/**
 * Returns the privacy-safe destination URL for the shared card.
 * - Personality Card: Uses user's evaluation invitation link (/#/friend/:slug)
 * - Observer Card: Strictly uses canonical platform URL (https://10signal.me). Never leaks evaluated friend data.
 */
export function getShareUrl(cardData = {}) {
  if (cardData?.type === SHARE_CARD_TYPES.PERSONALITY) {
    const slug =
      cardData?.publicSlug ||
      (typeof window !== 'undefined'
        ? localStorage.getItem('tensignal_owner_slug') || localStorage.getItem('seenly_owner_slug')
        : null);
    if (slug) {
      const origin = getProductionOrigin();
      return `${origin}/#/friend/${slug}`;
    }
  }
  return CANONICAL_ORIGIN;
}

/**
 * Formats a localized sharing message tailored to the card type.
 */
export function getShareMessage(cardData, t, locale = 'tr') {
  if (!cardData) return '';

  const isTr = locale === 'tr';
  const title = cardData.title || '';

  if (cardData.type === SHARE_CARD_TYPES.OBSERVER) {
    if (typeof t === 'function') {
      const translated = t('common.socialShare.observerMessage', { observerName: title });
      if (translated && !translated.includes('common.socialShare')) {
        return translated;
      }
    }
    return isTr
      ? `10Signal'da gözlemci karakterim ${title} çıktı. Sen insanları nasıl değerlendiriyorsun? ✨`
      : `My observer type on 10Signal is ${title}. How do you see others? ✨`;
  }

  // Default: PERSONALITY_RESULT
  if (typeof t === 'function') {
    const translated = t('common.socialShare.personalityMessage', { archetypeName: title });
    if (translated && !translated.includes('common.socialShare')) {
      return translated;
    }
  }
  return isTr
    ? `10Signal'da kişilik sonucum ${title} çıktı. Seninki ne? ✨`
    : `My personality result on 10Signal is ${title}. What's yours? ✨`;
}

/**
 * Builds a direct WhatsApp share intent URL with localized copy and link.
 */
export function getWhatsAppShareUrl(cardData, t, locale = 'tr') {
  const message = getShareMessage(cardData, t, locale);
  const url = getShareUrl(cardData);
  const fullText = `${message}\n${url}`;
  return `https://api.whatsapp.com/send?text=${encodeURIComponent(fullText)}`;
}

/**
 * Builds an X (Twitter) intent URL with localized copy and link.
 */
export function getXShareUrl(cardData, t, locale = 'tr') {
  const message = getShareMessage(cardData, t, locale);
  const url = getShareUrl(cardData);
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}&url=${encodeURIComponent(url)}`;
}

/**
 * Slugifies a title into a safe filename string across Windows, macOS, and Linux.
 */
export function slugifyTitle(title = '') {
  if (!title) return 'result';

  const charMap = {
    ç: 'c', Ç: 'c',
    ğ: 'g', Ğ: 'g',
    ı: 'i', I: 'i', İ: 'i',
    ö: 'o', Ö: 'o',
    ş: 's', Ş: 's',
    ü: 'u', Ü: 'u'
  };

  let slug = title.trim();
  for (const [key, replacement] of Object.entries(charMap)) {
    slug = slug.replaceAll(key, replacement);
  }

  slug = slug
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return slug || 'result';
}

/**
 * Generates an operating system-safe filename for the exported 4:3 card.
 * Examples: '10signal-playmaker.png', '10signal-dengeli-gozlemci.png'
 */
export function getShareFileName(cardData) {
  const slug = slugifyTitle(cardData?.title);
  return `10signal-${slug}.png`;
}

// Backwards compatibility alias
export const getStoryFileName = getShareFileName;

/**
 * Pre-renders an image onto an offscreen canvas to convert it into a PNG Data URL.
 * Prevents CORS issues, tainted canvas errors, and delays in html2canvas.
 */
export async function loadImageAsDataURL(src) {
  if (!src) return '';
  if (typeof src === 'string' && src.startsWith('data:')) {
    return src;
  }

  // 1. Try to fetch as blob (works without CORS for same-origin assets)
  try {
    const res = await fetch(src, { mode: 'cors' }).catch(() => fetch(src));
    if (res && res.ok) {
      const blob = await res.blob();
      const rawDataUrl = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = () => resolve('');
        reader.readAsDataURL(blob);
      });
      if (rawDataUrl && typeof rawDataUrl === 'string' && rawDataUrl.startsWith('data:')) {
        const pngDataUrl = await convertDataUrlToPng(rawDataUrl);
        return pngDataUrl || rawDataUrl;
      }
    }
  } catch {
    // Continue to Image fallback
  }

  // 2. Fallback: Image element with canvas conversion
  return new Promise((resolve) => {
    let resolved = false;
    const finish = (val) => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timer);
        resolve(val);
      }
    };

    const timer = setTimeout(() => {
      finish(src);
    }, 3000);

    const img = new Image();
    img.crossOrigin = 'anonymous';

    const renderToDataUrl = (loadedImg) => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = loadedImg.naturalWidth || loadedImg.width || 400;
        canvas.height = loadedImg.naturalHeight || loadedImg.height || 400;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(loadedImg, 0, 0);
          const out = canvas.toDataURL('image/png');
          if (out && out.startsWith('data:image/png')) {
            finish(out);
            return true;
          }
        }
      } catch {
        // Tainted or canvas error
      }
      return false;
    };

    img.onload = () => {
      if (!renderToDataUrl(img)) {
        finish(src);
      }
    };

    img.onerror = () => {
      const retryImg = new Image();
      retryImg.onload = () => {
        if (!renderToDataUrl(retryImg)) {
          finish(src);
        }
      };
      retryImg.onerror = () => finish(src);
      retryImg.src = src;
    };

    img.src = src;
  });
}

function convertDataUrlToPng(dataUrl) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width || 400;
        canvas.height = img.naturalHeight || img.height || 400;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/png'));
          return;
        }
      } catch {
        // Ignore
      }
      resolve(dataUrl);
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

/**
 * Determines whether the current environment supports native file sharing (Web Share API Level 2).
 */
export function canNativeShareFiles(file) {
  if (typeof navigator === 'undefined' || !navigator.share || !navigator.canShare) {
    return false;
  }
  try {
    return navigator.canShare({ files: [file] });
  } catch {
    return false;
  }
}

/**
 * Determines whether basic native text/URL sharing is supported.
 */
export function canNativeShareText() {
  return typeof navigator !== 'undefined' && typeof navigator.share === 'function';
}

/**
 * Universal clipboard copy helper with fallback for non-secure / restricted contexts.
 */
export async function copyToClipboard(text) {
  if (navigator?.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall through to legacy textarea fallback
    }
  }

  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    textArea.style.top = '-9999px';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch {
    return false;
  }
}

/* ─────────────────────────────────────────────────────────────
 * Canvas 2D Direct High-Res Card Renderer (1080 x 810 — 4:3)
 * Provides 100% reliable, instant PNG rendering without DOM dependencies.
 * ───────────────────────────────────────────────────────────── */

function drawRoundedRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y, x + radius, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function drawAspectCover(ctx, img, x, y, w, h) {
  const imgW = img.naturalWidth || img.width;
  const imgH = img.naturalHeight || img.height;
  if (!imgW || !imgH) return;
  const imgAspect = imgW / imgH;
  const boxAspect = w / h;

  let sx, sy, sWidth, sHeight;
  if (imgAspect > boxAspect) {
    sHeight = imgH;
    sWidth = imgH * boxAspect;
    sx = (imgW - sWidth) / 2;
    sy = 0;
  } else {
    sWidth = imgW;
    sHeight = imgW / boxAspect;
    sx = 0;
    sy = (imgH - sHeight) / 2;
  }

  ctx.drawImage(img, sx, sy, sWidth, sHeight, x, y, w, h);
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight, maxLines = 4) {
  const words = text.split(' ');
  let line = '';
  let lineCount = 0;

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;
    if (testWidth > maxWidth && n > 0) {
      ctx.fillText(line.trim(), x, y);
      line = words[n] + ' ';
      y += lineHeight;
      lineCount++;
      if (lineCount >= maxLines - 1 && n < words.length - 1) {
        let remaining = words.slice(n).join(' ');
        while (ctx.measureText(remaining + '...').width > maxWidth && remaining.length > 0) {
          remaining = remaining.substring(0, remaining.length - 1);
        }
        ctx.fillText(remaining + '...', x, y);
        return;
      }
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line.trim(), x, y);
}

function loadHtmlImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => {
      const retry = new Image();
      retry.onload = () => resolve(retry);
      retry.onerror = (e) => reject(e);
      retry.src = src;
    };
    img.src = src;
  });
}

/**
 * Direct Canvas 2D engine that renders 1080 x 810 (4:3) cards with 100% precision.
 */
export async function renderCardToCanvas2D(cardData, imageSrc, t, logoSrc = null) {
  const width = 1080;
  const height = 810;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context not available');

  // 1. Warm ivory base
  ctx.fillStyle = '#FDFBF7';
  ctx.fillRect(0, 0, width, height);

  // 2. Luxury watercolor radial accents
  const grad1 = ctx.createRadialGradient(140, 150, 0, 140, 150, 500);
  grad1.addColorStop(0, 'rgba(197, 160, 89, 0.14)');
  grad1.addColorStop(1, 'rgba(197, 160, 89, 0)');
  ctx.fillStyle = grad1;
  ctx.fillRect(0, 0, width, height);

  const grad2 = ctx.createRadialGradient(940, 680, 0, 940, 680, 480);
  grad2.addColorStop(0, 'rgba(214, 185, 200, 0.12)');
  grad2.addColorStop(1, 'rgba(214, 185, 200, 0)');
  ctx.fillStyle = grad2;
  ctx.fillRect(0, 0, width, height);

  const grad3 = ctx.createRadialGradient(540, 405, 0, 540, 405, 450);
  grad3.addColorStop(0, 'rgba(247, 235, 224, 0.18)');
  grad3.addColorStop(1, 'rgba(247, 235, 224, 0)');
  ctx.fillStyle = grad3;
  ctx.fillRect(0, 0, width, height);

  // 3. Delicate outer framing inset
  ctx.save();
  ctx.strokeStyle = 'rgba(197, 160, 89, 0.28)';
  ctx.lineWidth = 1;
  drawRoundedRect(ctx, 20, 20, width - 40, height - 40, 26);
  ctx.stroke();
  ctx.restore();

  // 4. Left Column: Artwork Frame (approx 42% width)
  const imgBoxX = 40;
  const imgBoxY = 40;
  const imgBoxW = 420;
  const imgBoxH = 730;

  // Soft ambient shadow
  ctx.save();
  ctx.shadowColor = 'rgba(11, 27, 44, 0.08)';
  ctx.shadowBlur = 32;
  ctx.shadowOffsetY = 12;
  ctx.fillStyle = '#FFFFFF';
  drawRoundedRect(ctx, imgBoxX, imgBoxY, imgBoxW, imgBoxH, 22);
  ctx.fill();
  ctx.restore();

  // Delicate border on artwork frame
  ctx.save();
  ctx.strokeStyle = 'rgba(197, 160, 89, 0.35)';
  ctx.lineWidth = 1.5;
  drawRoundedRect(ctx, imgBoxX, imgBoxY, imgBoxW, imgBoxH, 22);
  ctx.stroke();
  ctx.restore();

  // Draw illustration inside artwork frame
  if (imageSrc) {
    try {
      const img = await loadHtmlImage(imageSrc);
      ctx.save();
      drawRoundedRect(ctx, imgBoxX, imgBoxY, imgBoxW, imgBoxH, 22);
      ctx.clip();
      drawAspectCover(ctx, img, imgBoxX, imgBoxY, imgBoxW, imgBoxH);
      ctx.restore();
    } catch {
      // Graceful fallback if image unavailable
    }
  }

  // Rarity Pill Badge (Personality only)
  const isPersonality = cardData?.type === SHARE_CARD_TYPES.PERSONALITY;
  if (isPersonality && cardData?.rarity) {
    const rarity = cardData.rarity;
    const badgeText = rarity.badgeLabel || 'NADİR';
    ctx.save();
    ctx.font = 'bold 13px "Inter", -apple-system, sans-serif';
    const textWidth = ctx.measureText(badgeText).width;
    const badgeW = Math.max(76, textWidth + 30);
    const badgeH = 30;
    const badgeX = imgBoxX + imgBoxW - badgeW - 14;
    const badgeY = imgBoxY + 14;

    ctx.fillStyle = rarity.badgeBg || '#FEF3C7';
    ctx.strokeStyle = rarity.badgeBorder || '#F59E0B';
    ctx.lineWidth = 1.5;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.06)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetY = 2;

    drawRoundedRect(ctx, badgeX, badgeY, badgeW, badgeH, 15);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = rarity.badgeText || '#92400E';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(badgeText, badgeX + badgeW / 2, badgeY + badgeH / 2 + 1);
    ctx.restore();
  }

  // 5. Right Column: Typography & Branding (approx 53% width)
  const colX = 508;
  const colW = width - colX - 44; // 528px
  const brandName = t ? t('common.socialShare.brandName') : '10SIGNAL';
  const watermarkText = t ? t('common.socialShare.brandWatermark') : '10signal.me';
  const title = cardData?.title || '';
  const description = cardData?.description || '';

  // Top Section: Real 10Signal Logo & Divider
  const logoSource = logoSrc || (typeof brandLogoPng !== 'undefined' ? brandLogoPng : null);
  let logoDrawn = false;

  if (logoSource) {
    try {
      const logoImg = await loadHtmlImage(logoSource);
      const naturalW = logoImg.naturalWidth || logoImg.width || 628;
      const naturalH = logoImg.naturalHeight || logoImg.height || 174;
      const aspect = naturalW / naturalH;
      const targetH = 34;
      const targetW = targetH * aspect; // ~123px

      ctx.save();
      ctx.drawImage(logoImg, colX, 54, targetW, targetH);
      ctx.restore();
      logoDrawn = true;
    } catch {
      logoDrawn = false;
    }
  }

  if (!logoDrawn) {
    ctx.save();
    ctx.fillStyle = '#0B1B2C';
    ctx.font = 'bold 20px Georgia, "Newsreader", serif';
    ctx.textAlign = 'left';
    ctx.fillText(brandName.toUpperCase(), colX, 80);
    ctx.restore();
  }

  // Gold Star Divider Line
  ctx.save();
  ctx.strokeStyle = 'rgba(197, 160, 89, 0.35)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(colX, 102);
  ctx.lineTo(colX + 66, 102);
  ctx.stroke();

  ctx.fillStyle = '#C5A059';
  ctx.font = '11px serif';
  ctx.textAlign = 'center';
  ctx.fillText('✦', colX + 76, 106);

  ctx.beginPath();
  ctx.moveTo(colX + 86, 102);
  ctx.lineTo(colX + 152, 102);
  ctx.stroke();
  ctx.restore();

  // Middle Section: Unified Content Group (Title + Ornament + Quote)
  // Perfectly centered vertically between divider (y=104) and watermark (y=746)
  const isLong = title.length > 18;
  const titleFontSize = isLong ? 38 : 46;
  const titleLineHeight = isLong ? 46 : 54;
  const groupStartY = 265;

  ctx.save();
  ctx.fillStyle = '#0B1B2C';
  ctx.font = `bold ${titleFontSize}px Georgia, "Playfair Display", "Newsreader", serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';

  // Measure title wrapping
  const words = title.split(' ');
  let titleLines = [];
  let curLine = '';
  for (let w = 0; w < words.length; w++) {
    const testLine = curLine ? `${curLine} ${words[w]}` : words[w];
    if (ctx.measureText(testLine).width > colW && w > 0) {
      titleLines.push(curLine);
      curLine = words[w];
    } else {
      curLine = testLine;
    }
  }
  if (curLine) titleLines.push(curLine);

  let curY = groupStartY;
  for (let l = 0; l < titleLines.length; l++) {
    ctx.fillText(titleLines[l], colX, curY);
    curY += titleLineHeight;
  }

  // Small gold diamond accent
  curY += 8;
  ctx.fillStyle = '#C5A059';
  ctx.font = '14px serif';
  ctx.textAlign = 'left';
  ctx.fillText('✦', colX, curY);
  curY += 22;

  // Description Quote
  if (description) {
    ctx.fillStyle = '#554234';
    ctx.font = 'italic 21px Georgia, "Newsreader", serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    wrapText(ctx, `"${description}"`, colX, curY, colW - 12, 33, 4);
  }
  ctx.restore();

  // Bottom Section: Platform Signature (y = 746)
  ctx.save();
  ctx.strokeStyle = 'rgba(11, 27, 44, 0.2)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(colX, 746);
  ctx.lineTo(colX + 32, 746);
  ctx.stroke();

  ctx.fillStyle = 'rgba(11, 27, 44, 0.48)';
  ctx.font = '600 12px "Inter", -apple-system, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  const wmString = watermarkText.toUpperCase();
  ctx.fillText(wmString, colX + 42, 746);

  const wmWidth = ctx.measureText(wmString).width;
  ctx.beginPath();
  ctx.moveTo(colX + 42 + wmWidth + 10, 746);
  ctx.lineTo(colX + 42 + wmWidth + 42, 746);
  ctx.stroke();
  ctx.restore();

  const blob = await new Promise((res) => canvas.toBlob(res, 'image/png'));
  if (!blob) throw new Error('Canvas to Blob conversion failed');

  const fileName = getShareFileName(cardData);
  const file = new File([blob], fileName, { type: 'image/png' });
  const blobUrl = URL.createObjectURL(blob);

  return { canvas, blob, file, blobUrl, fileName, width, height };
}
