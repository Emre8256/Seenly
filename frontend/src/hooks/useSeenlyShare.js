/**
 * useSeenlyShare.js
 * Centralized share infrastructure for Seenly.
 * Used by: DashboardPage  &  FriendResultPage
 */

import { useState, useCallback } from 'react';

/* ─── WhatsApp ──────────────────────────────────────────────── */

export function buildWhatsAppLink(cardName, publicSlug) {
  if (!publicSlug) return '#';

  const origin = window.location.origin.startsWith('http')
    ? window.location.origin
    : `https://${window.location.host}`;

  const profileUrl = `${origin}/#/friend/${publicSlug}`;

  const shareText =
    `Bilinçaltı Arşivi'nden bir kesit: Çevrimin gözünden algılanan auram '${cardName}' olarak şekillendi. ` +
    `Peki senin dünyanda benim yansımam ne? Aynanın arkasını gör: ${profileUrl}`;

  return `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
}

/* ─── Helpers ───────────────────────────────────────────────── */

function loadImageAsDataURL(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = img.naturalWidth || img.width;
      c.height = img.naturalHeight || img.height;
      c.getContext('2d').drawImage(img, 0, 0);
      try { resolve(c.toDataURL('image/png')); } catch { resolve(src); }
    };
    img.onerror = () => resolve(src);
    img.src = src;
  });
}

/* ─── Instagram Story instruction modal ─────────────────────── */

function showInstagramModal(slug, langCode) {
  const profileUrl = `${window.location.origin.startsWith('http') ? window.location.origin : 'https://' + window.location.host}/#/friend/${slug}`;

  const isEn = langCode !== 'tr';

  const overlay = document.createElement('div');
  Object.assign(overlay.style, {
    position: 'fixed', inset: '0', background: 'rgba(11,27,44,0.72)',
    zIndex: '99999', display: 'flex', alignItems: 'center', justifyContent: 'center',
    backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
    padding: '24px', boxSizing: 'border-box',
  });

  const card = document.createElement('div');
  Object.assign(card.style, {
    background: '#F9F6F0', borderRadius: '24px', padding: '36px 32px 28px',
    maxWidth: '440px', width: '100%', textAlign: 'center',
    boxShadow: '0 24px 64px rgba(11,27,44,0.35)',
    fontFamily: 'Georgia, "Times New Roman", serif',
  });

  const igIcon = document.createElement('div');
  igIcon.innerHTML = `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="url(#igGrad)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
    <defs><linearGradient id="igGrad" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stop-color="#f09433"/><stop offset="50%" stop-color="#dc2743"/><stop offset="100%" stop-color="#bc1888"/></linearGradient></defs>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
  </svg>`;
  Object.assign(igIcon.style, { marginBottom: '16px' });

  const title = document.createElement('h3');
  title.textContent = isEn ? 'Story Ready!' : 'Story Hazır!';
  Object.assign(title.style, {
    fontSize: '22px', fontWeight: '700', color: '#0b1b2c',
    margin: '0 0 12px 0', fontFamily: 'Georgia, serif',
  });

  const desc = document.createElement('p');
  desc.textContent = isEn
    ? 'Your story image has been downloaded. To add a clickable link:'
    : 'Story görselin indirildi. Tıklanabilir link eklemek için:';
  Object.assign(desc.style, {
    fontSize: '14px', color: '#4a3728', margin: '0 0 20px 0',
    lineHeight: '1.5', fontFamily: 'Georgia, serif',
  });

  const steps = [
    isEn ? '1. Open Instagram and create a new Story' : '1. Instagram\'ı aç, yeni Story oluştur',
    isEn ? '2. Add the downloaded image as background' : '2. İndirilen görseli arka plan yap',
    isEn ? '3. Tap the sticker icon → "Link" sticker' : '3. Çıkartma simgesine dokun → "Bağlantı"',
    isEn ? '4. Paste your Seenly link' : '4. Seenly linkini yapıştır',
  ];

  const stepsList = document.createElement('div');
  Object.assign(stepsList.style, {
    background: 'rgba(11,27,44,0.05)', borderRadius: '14px',
    padding: '16px 20px', marginBottom: '20px', textAlign: 'left',
  });
  steps.forEach((s) => {
    const step = document.createElement('p');
    step.textContent = s;
    Object.assign(step.style, {
      fontSize: '13px', color: '#0b1b2c', margin: '0 0 8px 0',
      fontFamily: 'Georgia, serif', lineHeight: '1.4',
    });
    stepsList.appendChild(step);
  });
  const lastStep = stepsList.lastChild;
  if (lastStep) lastStep.style.margin = '0';

  // Link copy area
  const linkBox = document.createElement('div');
  Object.assign(linkBox.style, {
    display: 'flex', alignItems: 'center', gap: '8px',
    background: '#fff', border: '1px solid rgba(11,27,44,0.12)',
    borderRadius: '10px', padding: '10px 14px', marginBottom: '20px',
    cursor: 'pointer',
  });
  const linkText = document.createElement('span');
  linkText.textContent = profileUrl;
  Object.assign(linkText.style, {
    fontSize: '12px', color: 'rgba(11,27,44,0.55)', flex: '1',
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
    fontFamily: 'Georgia, serif',
  });
  const copyBtn = document.createElement('button');
  copyBtn.textContent = isEn ? 'Copy' : 'Kopyala';
  Object.assign(copyBtn.style, {
    background: '#0b1b2c', color: '#F9F6F0', border: 'none',
    borderRadius: '7px', padding: '6px 14px', fontSize: '12px',
    fontWeight: '700', cursor: 'pointer', whiteSpace: 'nowrap',
    fontFamily: 'Georgia, serif', flexShrink: '0',
  });
  copyBtn.onclick = () => {
    navigator.clipboard.writeText(profileUrl).then(() => {
      copyBtn.textContent = isEn ? 'Copied ✓' : 'Kopyalandı ✓';
      copyBtn.style.background = '#25a244';
      setTimeout(() => {
        copyBtn.textContent = isEn ? 'Copy' : 'Kopyala';
        copyBtn.style.background = '#0b1b2c';
      }, 2000);
    });
  };
  linkBox.appendChild(linkText);
  linkBox.appendChild(copyBtn);

  // Close button
  const closeBtn = document.createElement('button');
  closeBtn.textContent = isEn ? 'Got it' : 'Anladım';
  Object.assign(closeBtn.style, {
    background: 'linear-gradient(135deg, #f09433 0%, #dc2743 50%, #bc1888 100%)',
    color: '#fff', border: 'none', borderRadius: '100px',
    padding: '14px 32px', fontSize: '15px', fontWeight: '700',
    cursor: 'pointer', width: '100%', fontFamily: 'Georgia, serif',
  });
  closeBtn.onclick = () => document.body.removeChild(overlay);
  overlay.onclick = (e) => { if (e.target === overlay) document.body.removeChild(overlay); };

  card.appendChild(igIcon);
  card.appendChild(title);
  card.appendChild(desc);
  card.appendChild(stepsList);
  card.appendChild(linkBox);
  card.appendChild(closeBtn);
  overlay.appendChild(card);
  document.body.appendChild(overlay);
}

/* ─── Instagram Story Generator ─────────────────────────────── */

const STORY_W = 1080;
const STORY_H = 1920;

async function generateInstagramStoryInternal(
  cardName,
  illustrationSrc,
  publicSlug,
  langCode,
  setGenerating
) {
  setGenerating(true);

  try {
    const html2canvas = (await import('html2canvas')).default;
    const illustrationDataUrl = await loadImageAsDataURL(illustrationSrc);

    const tagline = langCode === 'tr' ? 'BİLİNÇALTI ARŞİVİ' : 'THE SUBCONSCIOUS ARCHIVE';
    const quote = langCode === 'tr' ? '"Senin dünyanda benim yansımam hangisi?"' : '"How am I reflected in your world?"';
    const origin = window.location.origin.startsWith('http')
      ? window.location.origin
      : `https://${window.location.host}`;
    const profileUrl = `${origin}/#/friend/${publicSlug}`;
    const shortUrl = profileUrl.replace(/^https?:\/\//, '');

    // ── Off-screen wrapper ─────────────────────────────────────
    const wrapper = document.createElement('div');
    Object.assign(wrapper.style, {
      position: 'absolute', top: '-9999px', left: '-9999px',
      width: `${STORY_W}px`, height: `${STORY_H}px`,
      overflow: 'hidden', zIndex: '-1',
    });

    // ── Root ───────────────────────────────────────────────────
    const root = document.createElement('div');
    Object.assign(root.style, {
      width: `${STORY_W}px`, height: `${STORY_H}px`,
      background: '#F5F1EB',
      position: 'relative', overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', boxSizing: 'border-box',
    });

    // ── Subtle background texture blobs ───────────────────────
    const makeBlob = (styles) => {
      const b = document.createElement('div');
      Object.assign(b.style, {
        position: 'absolute', borderRadius: '50%',
        pointerEvents: 'none', ...styles,
      });
      return b;
    };
    root.appendChild(makeBlob({ width: '900px', height: '900px', top: '-300px', left: '-250px', background: 'radial-gradient(ellipse, rgba(197,160,89,0.10) 0%, transparent 70%)', filter: 'blur(60px)' }));
    root.appendChild(makeBlob({ width: '700px', height: '700px', bottom: '-200px', right: '-150px', background: 'radial-gradient(ellipse, rgba(166,63,79,0.08) 0%, transparent 70%)', filter: 'blur(60px)' }));

    // ── Content ────────────────────────────────────────────────
    const content = document.createElement('div');
    Object.assign(content.style, {
      position: 'relative', zIndex: '1',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', width: '100%', height: '100%',
      padding: '80px 64px 72px', boxSizing: 'border-box',
    });

    // ── Top brand ──────────────────────────────────────────────
    const brand = document.createElement('div');
    Object.assign(brand.style, {
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', marginBottom: '48px', width: '100%',
    });

    const brandText = document.createElement('p');
    brandText.textContent = 'S E E N L Y  |  A R C H I V E';
    Object.assign(brandText.style, {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '24px', fontWeight: '600',
      letterSpacing: '0.30em', color: '#0b1b2c',
      textTransform: 'uppercase', margin: '0 0 18px 0',
    });

    const divRow = document.createElement('div');
    Object.assign(divRow.style, { display: 'flex', alignItems: 'center', gap: '14px', width: '100%' });
    const mkLine = () => { const d = document.createElement('div'); Object.assign(d.style, { flex: '1', height: '1px', background: 'rgba(11,27,44,0.14)' }); return d; };
    const star = document.createElement('span');
    star.textContent = '✦';
    Object.assign(star.style, { fontSize: '13px', color: '#c5a059', opacity: '0.8' });
    divRow.appendChild(mkLine()); divRow.appendChild(star); divRow.appendChild(mkLine());

    brand.appendChild(brandText);
    brand.appendChild(divRow);

    // ── Image card (rounded rectangle, LARGE) ─────────────────
    const imgCard = document.createElement('div');
    Object.assign(imgCard.style, {
      width: '952px',          // nearly full width
      height: '1080px',        // ~56% of story height
      borderRadius: '48px',    // rounded rectangle
      overflow: 'hidden',
      position: 'relative',
      boxShadow: '0 2px 0 2px rgba(197,160,89,0.40), 0 0 0 6px rgba(197,160,89,0.12), 0 32px 80px rgba(60,45,30,0.22)',
      border: '2px solid rgba(197,160,89,0.50)',
      flexShrink: '0',
    });

    const illus = document.createElement('img');
    illus.src = illustrationDataUrl;
    Object.assign(illus.style, {
      width: '100%', height: '100%', objectFit: 'cover', display: 'block',
    });
    imgCard.appendChild(illus);

    // ── Bottom text ────────────────────────────────────────────
    const bottom = document.createElement('div');
    Object.assign(bottom.style, {
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', textAlign: 'center',
      marginTop: '52px', gap: '16px', width: '100%',
    });

    const cardNameEl = document.createElement('p');
    cardNameEl.textContent = cardName;
    Object.assign(cardNameEl.style, {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '72px', fontWeight: '700',
      color: '#0b1b2c', margin: '0',
      letterSpacing: '-0.02em', lineHeight: '1.05',
    });

    const quoteEl = document.createElement('p');
    quoteEl.textContent = quote;
    Object.assign(quoteEl.style, {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '30px', fontWeight: '400', fontStyle: 'italic',
      color: '#5a3e2b', margin: '0', lineHeight: '1.35',
    });
    
    // Add clickable-looking URL back as requested
    const urlContainer = document.createElement('div');
    Object.assign(urlContainer.style, {
      display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px'
    });
    const urlLine1 = document.createElement('div');
    Object.assign(urlLine1.style, { width: '40px', height: '1px', background: 'rgba(11,27,44,0.15)' });
    const urlText = document.createElement('p');
    urlText.textContent = shortUrl;
    Object.assign(urlText.style, {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '18px', fontWeight: '400', letterSpacing: '0.04em',
      color: 'rgba(11,27,44,0.4)', margin: '0'
    });
    const urlLine2 = document.createElement('div');
    Object.assign(urlLine2.style, { width: '40px', height: '1px', background: 'rgba(11,27,44,0.15)' });
    urlContainer.appendChild(urlLine1);
    urlContainer.appendChild(urlText);
    urlContainer.appendChild(urlLine2);

    const taglineEl = document.createElement('p');
    taglineEl.textContent = tagline;
    Object.assign(taglineEl.style, {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '15px', fontWeight: '400',
      letterSpacing: '0.26em', textTransform: 'uppercase',
      color: 'rgba(166,63,79,0.65)', margin: '4px 0 0 0',
    });

    bottom.appendChild(cardNameEl);
    bottom.appendChild(quoteEl);
    bottom.appendChild(urlContainer); // Re-added URL container
    bottom.appendChild(taglineEl);

    // ── Assemble ───────────────────────────────────────────────
    content.appendChild(brand);
    content.appendChild(imgCard);
    content.appendChild(bottom);
    root.appendChild(content);
    wrapper.appendChild(root);
    document.body.appendChild(wrapper);

    await new Promise((r) => requestAnimationFrame(r));
    await new Promise((r) => setTimeout(r, 200));

    const canvas = await html2canvas(root, {
      useCORS: true, allowTaint: true, scale: 2,
      width: STORY_W, height: STORY_H,
      backgroundColor: '#F5F1EB', logging: false,
      onclone: (clonedDoc) => {
        clonedDoc.querySelectorAll('style, link[rel="stylesheet"]').forEach((el) => el.remove());
      },
    });

    document.body.removeChild(wrapper);

    canvas.toBlob(async (blob) => {
      if (!blob) { alert('Görsel oluşturulamadı.'); return; }
      const fileName = 'seenly-story.png';
      const file = new File([blob], fileName, { type: 'image/png' });

      const canShare = navigator.canShare && navigator.canShare({ files: [file] });

      if (canShare) {
        try {
          await navigator.share({ files: [file], title: 'Seenly Story', text: cardName });
          // Still show modal after sharing so user knows to add link sticker
          showInstagramModal(publicSlug, langCode);
          return;
        } catch (_) { /* user cancelled — fall through to download */ }
      }

      // Desktop: trigger download, then show modal
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = fileName; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);

      // Show instruction modal after brief delay
      setTimeout(() => showInstagramModal(publicSlug, langCode), 600);

    }, 'image/png');

  } catch (err) {
    console.error('[useSeenlyShare] Story generation failed:', err);
    alert(err?.message
      ? `Story oluşturulurken hata: ${err.message}`
      : 'Story oluşturulamadı. Lütfen tekrar deneyin.');
  } finally {
    setGenerating(false);
  }
}

/* ─── Public hook ───────────────────────────────────────────── */

export function useSeenlyShare() {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleInstagramStory = useCallback(
    (cardName, illustrationSrc, publicSlug, langCode) => {
      generateInstagramStoryInternal(
        cardName, illustrationSrc, publicSlug,
        langCode || 'tr', setIsGenerating
      );
    },
    []
  );

  return { buildWhatsAppLink, handleInstagramStory, isGenerating };
}
