import React, { memo, useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import html2canvas from 'html2canvas';
import { useLocale } from '../../context/LocaleContext';
import ShareStoryCard from './ShareStoryCard';
import brandLogoPng from '../../images/Icons/10Signal.png';
import {
  SHARE_CARD_TYPES,
  getShareUrl,
  getShareMessage,
  getWhatsAppShareUrl,
  getXShareUrl,
  getShareFileName,
  loadImageAsDataURL,
  renderCardToCanvas2D,
  canNativeShareFiles,
  canNativeShareText,
  copyToClipboard
} from '../../services/shareService';

export { SHARE_CARD_TYPES };

const ShareModal = memo(function ShareModal({
  isOpen,
  onClose,
  cardData,
  triggerRef
}) {
  const { t, locale } = useLocale();

  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [statusNotice, setStatusNotice] = useState(null); // { type: 'success' | 'info' | 'error', text: '' }
  const [cachedDataUrlImage, setCachedDataUrlImage] = useState(null);
  const [cachedLogoDataUrl, setCachedLogoDataUrl] = useState(null);
  const [renderedPreviewUrl, setRenderedPreviewUrl] = useState(null);
  const [preparedShareResult, setPreparedShareResult] = useState(null);

  const modalRef = useRef(null);
  const closeBtnRef = useRef(null);
  const exportNodeRef = useRef(null);
  const isGeneratingRef = useRef(false);

  // Preload and convert card image to dataURL to avoid CORS / canvas tainting
  useEffect(() => {
    let active = true;
    if (isOpen && cardData?.imageSrc) {
      loadImageAsDataURL(cardData.imageSrc).then((dataUrl) => {
        if (active && dataUrl) {
          setCachedDataUrlImage(dataUrl);
        }
      });
    } else {
      setCachedDataUrlImage(null);
    }
    return () => {
      active = false;
    };
  }, [isOpen, cardData?.imageSrc]);

  // Preload official 10Signal brand logo as DataURL
  useEffect(() => {
    let active = true;
    loadImageAsDataURL(brandLogoPng).then((dataUrl) => {
      if (active && dataUrl) {
        setCachedLogoDataUrl(dataUrl);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  // Revoke object URL on modal close or unmount to avoid memory leaks
  useEffect(() => {
    if (!isOpen) {
      if (renderedPreviewUrl) {
        try {
          URL.revokeObjectURL(renderedPreviewUrl);
        } catch {
          // ignore
        }
      }
      setRenderedPreviewUrl(null);
      setPreparedShareResult(null);
    }
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (renderedPreviewUrl) {
        try {
          URL.revokeObjectURL(renderedPreviewUrl);
        } catch {
          // ignore
        }
      }
    };
  }, [renderedPreviewUrl]);

  // Manage body scroll & Escape key handling & focus trapping
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Focus close button on mount
    const timer = setTimeout(() => {
      closeBtnRef.current?.focus();
    }, 60);

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(timer);
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);

      // Return focus to trigger button
      if (triggerRef?.current && typeof triggerRef.current.focus === 'function') {
        triggerRef.current.focus();
      }
    };
  }, [isOpen, onClose, triggerRef]);

  // Clear status notices after 3.5 seconds
  const showNotice = useCallback((text, type = 'info', duration = 3500) => {
    setStatusNotice({ text, type });
    if (duration > 0) {
      setTimeout(() => {
        setStatusNotice((curr) => (curr?.text === text ? null : curr));
      }, duration);
    }
  }, []);

  // ─────────────────────────────────────────────────────────────
  // High-Resolution Image Generation Pipeline (1080 x 810 — 4:3)
  // ─────────────────────────────────────────────────────────────
  const generateStoryFile = useCallback(async () => {
    if (!cardData) return null;

    let imageSrc = cachedDataUrlImage;
    if (!imageSrc && cardData?.imageSrc) {
      imageSrc = await loadImageAsDataURL(cardData.imageSrc);
      setCachedDataUrlImage(imageSrc);
    }

    if (imageSrc && exportNodeRef.current) {
      const img = exportNodeRef.current.querySelector('img');
      if (img && img.src !== imageSrc) {
        img.src = imageSrc;
      }
    }

    if (document.fonts && document.fonts.ready) {
      try {
        await document.fonts.ready;
      } catch {
        // Continue even if fonts.ready rejects
      }
    }

    // 1. Try HTML2Canvas first
    try {
      if (exportNodeRef.current) {
        await new Promise((r) => setTimeout(r, 60));

        const canvas = await html2canvas(exportNodeRef.current, {
          width: 1080,
          height: 810,
          windowWidth: 1080,
          windowHeight: 810,
          x: 0,
          y: 0,
          scrollX: 0,
          scrollY: 0,
          scale: 1,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#FDFBF7',
          logging: false,
          imageTimeout: 10000,
          onclone: (_clonedDoc, clonedElement) => {
            clonedElement.style.position = 'fixed';
            clonedElement.style.left = '0px';
            clonedElement.style.top = '0px';
            clonedElement.style.margin = '0px';
            clonedElement.style.transform = 'none';
            clonedElement.style.opacity = '1';
            clonedElement.style.visibility = 'visible';
            clonedElement.style.zIndex = '99999';
          }
        });

        const blob = await new Promise((resolve) => {
          canvas.toBlob(resolve, 'image/png');
        });

        if (blob && blob.size > 0) {
          const fileName = getShareFileName(cardData);
          const file = new File([blob], fileName, { type: 'image/png' });
          const blobUrl = URL.createObjectURL(blob);
          return { file, blob, blobUrl, fileName, width: 1080, height: 810 };
        }
      }
    } catch (h2cError) {
      console.warn('html2canvas render failed, falling back to Canvas 2D engine:', h2cError);
    }

    // 2. Direct Canvas 2D engine fallback: 100% reliable, zero DOM dependencies
    return await renderCardToCanvas2D(cardData, imageSrc, t, cachedLogoDataUrl || brandLogoPng);
  }, [cachedDataUrlImage, cachedLogoDataUrl, cardData, t]);

  // Pre-render 1080 x 810 PNG so modal preview displays the EXACT image that is downloaded
  useEffect(() => {
    let active = true;
    if (!isOpen || !cardData) return;

    const prepare = async () => {
      try {
        const result = await generateStoryFile();
        if (active && result?.blobUrl) {
          setPreparedShareResult(result);
          setRenderedPreviewUrl(result.blobUrl);
        }
      } catch {
        // Fallback preview remains active
      }
    };

    const timer = setTimeout(prepare, 60);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [isOpen, cardData?.title, cardData?.type, cardData?.imageSrc, generateStoryFile]);

  // ─────────────────────────────────────────────────────────────
  // Action Handlers
  // ─────────────────────────────────────────────────────────────

  // 1. Download High-Res Image
  const handleDownloadImage = useCallback(async () => {
    if (isGeneratingRef.current) return;
    isGeneratingRef.current = true;
    setIsGenerating(true);
    showNotice(t('common.socialShare.preparingImage'), 'info', 0);

    try {
      const result = preparedShareResult || (await generateStoryFile());
      if (!result) throw new Error('Failed to generate image');

      const link = document.createElement('a');
      link.href = result.blobUrl;
      link.download = result.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showNotice(t('common.socialShare.imageReady'), 'success');
    } catch {
      showNotice(t('common.socialShare.shareFailed'), 'error');
    } finally {
      isGeneratingRef.current = false;
      setIsGenerating(false);
    }
  }, [generateStoryFile, preparedShareResult, showNotice, t]);

  // 2. Instagram Story Sharing
  const handleInstagramStory = useCallback(async () => {
    if (isGeneratingRef.current) return;
    isGeneratingRef.current = true;
    setIsGenerating(true);
    showNotice(t('common.socialShare.preparingImage'), 'info', 0);

    try {
      const result = preparedShareResult || (await generateStoryFile());
      if (!result) throw new Error('Image generation failed');

      // Check if browser supports sharing files natively (e.g. mobile Safari / Chrome)
      if (canNativeShareFiles(result.file)) {
        try {
          await navigator.share({
            files: [result.file],
            title: cardData.title,
            text: getShareMessage(cardData, t, locale)
          });
          showNotice(t('common.socialShare.imageReady'), 'success');
        } catch (shareErr) {
          // If user aborted / cancelled, do not treat as an error
          if (shareErr.name === 'AbortError' || shareErr.name === 'NotAllowedError') {
            showNotice(t('common.socialShare.shareCancelled'), 'info');
          } else {
            // Fallback to direct file download
            triggerDownload(result.blobUrl, result.fileName);
            showNotice(t('common.socialShare.igReadyMobile'), 'info', 5000);
          }
        }
      } else {
        // Desktop or non-file-sharing browser: download file directly & guide user
        triggerDownload(result.blobUrl, result.fileName);
        showNotice(t('common.socialShare.igReadyMobile'), 'info', 5000);
      }
    } catch {
      showNotice(t('common.socialShare.shareFailed'), 'error');
    } finally {
      isGeneratingRef.current = false;
      setIsGenerating(false);
    }
  }, [cardData, generateStoryFile, locale, preparedShareResult, showNotice, t]);

  // 3. WhatsApp Direct Share
  const handleWhatsApp = useCallback(() => {
    const waUrl = getWhatsAppShareUrl(cardData, t, locale);
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  }, [cardData, locale, t]);

  // 4. X (Twitter) Direct Share
  const handleX = useCallback(() => {
    const xUrl = getXShareUrl(cardData, t, locale);
    window.open(xUrl, '_blank', 'noopener,noreferrer');
  }, [cardData, locale, t]);

  // 5. Other Apps (Native Share / Universal Fallback)
  const handleOtherApps = useCallback(async () => {
    if (isGeneratingRef.current) return;
    isGeneratingRef.current = true;
    setIsGenerating(true);
    showNotice(t('common.socialShare.preparingImage'), 'info', 0);

    try {
      const result = preparedShareResult || (await generateStoryFile());
      const message = getShareMessage(cardData, t, locale);
      const url = getShareUrl(cardData);

      if (result && canNativeShareFiles(result.file)) {
        try {
          await navigator.share({
            files: [result.file],
            title: cardData.title,
            text: message,
            url
          });
          showNotice(t('common.socialShare.imageReady'), 'success');
        } catch (err) {
          if (err.name === 'AbortError' || err.name === 'NotAllowedError') {
            showNotice(t('common.socialShare.shareCancelled'), 'info');
          } else {
            fallbackShare(message, url, result);
          }
        }
      } else if (canNativeShareText()) {
        try {
          await navigator.share({
            title: cardData.title,
            text: message,
            url
          });
        } catch (err) {
          if (err.name === 'AbortError' || err.name === 'NotAllowedError') {
            showNotice(t('common.socialShare.shareCancelled'), 'info');
          }
        }
      } else {
        // Universal fallback: copy link and download image
        fallbackShare(message, url, result);
      }
    } catch {
      showNotice(t('common.socialShare.shareFailed'), 'error');
    } finally {
      isGeneratingRef.current = false;
      setIsGenerating(false);
    }
  }, [cardData, generateStoryFile, locale, showNotice, t]);

  const fallbackShare = (message, url, result) => {
    copyToClipboard(`${message}\n${url}`);
    if (result) {
      triggerDownload(result.blobUrl, result.fileName);
    }
    showNotice(t('common.socialShare.copiedLink'), 'success');
  };

  const triggerDownload = (blobUrl, fileName) => {
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 6. Copy Link Handler (Only relevant for Personality Card)
  const handleCopyLink = useCallback(async () => {
    const url = getShareUrl(cardData);
    const success = await copyToClipboard(url);
    if (success) {
      setCopiedLink(true);
      showNotice(t('common.socialShare.copiedLink'), 'success', 2500);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  }, [cardData, showNotice, t]);

  if (!isOpen || !cardData) return null;

  const isPersonality = cardData.type === SHARE_CARD_TYPES.PERSONALITY;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="tensignal-share-modal-title"
      className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-5 md:p-6 overflow-y-auto box-border"
      style={{
        backgroundColor: 'rgba(11, 27, 44, 0.68)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        animation: 'tensignalModalFadeIn 0.22s ease-out'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isGenerating) {
          onClose?.();
        }
      }}
    >
      {/* Modal Dialog Card */}
      <div
        ref={modalRef}
        className="relative w-full max-w-[920px] max-h-[92vh] overflow-y-auto bg-[#FDFBF7] rounded-[24px] sm:rounded-[30px] border border-[rgba(197,160,89,0.32)] shadow-[0_24px_70px_rgba(11,27,44,0.35)] flex flex-col md:flex-row items-stretch box-border my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          ref={closeBtnRef}
          type="button"
          onClick={onClose}
          disabled={isGenerating}
          aria-label={t('common.socialShare.close')}
          className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 z-30 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-black/5 hover:bg-black/10 active:scale-95 text-[#0B1B2C] flex items-center justify-center transition-all duration-150 cursor-pointer border-none"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* ── LEFT COLUMN: Interactive 4:3 Card Visual Preview ── */}
        <div
          className="w-full md:w-[450px] lg:w-[480px] p-4 sm:p-5 md:p-6 bg-[#F7F3EC] flex flex-col items-center justify-center flex-shrink-0 border-b md:border-b-0 md:border-r border-[rgba(197,160,89,0.22)] box-border"
        >
          <div className="w-full max-w-[360px] sm:max-w-[400px] md:max-w-[430px] mx-auto">
            {renderedPreviewUrl ? (
              <div
                className="relative w-full rounded-[18px] sm:rounded-[22px] overflow-hidden shadow-[0_10px_30px_rgba(11,27,44,0.12)] border border-[rgba(197,160,89,0.3)] bg-[#FDFBF7]"
                style={{ aspectRatio: '4 / 3' }}
              >
                <img
                  src={renderedPreviewUrl}
                  alt={cardData?.title || '10Signal Card Preview'}
                  className="w-full h-full object-contain block select-none pointer-events-none"
                />
              </div>
            ) : (
              <ShareStoryCard
                cardData={cardData}
                isExport={false}
                imageSrcOverride={cachedDataUrlImage}
                logoSrcOverride={cachedLogoDataUrl || brandLogoPng}
                t={t}
              />
            )}
          </div>
          <span className="font-sans text-[10.5px] text-[#0B1B2C]/45 mt-2.5 tracking-wide text-center block">
            {t('common.socialShare.preview')}
          </span>
        </div>

        {/* ── RIGHT COLUMN: Share Options & Actions ── */}
        <div className="flex-1 p-5 sm:p-6 md:p-7 flex flex-col justify-between box-border">
          {/* Header */}
          <div className="mb-5 sm:mb-6 pr-6">
            <span className="font-sans text-[11px] font-bold tracking-[0.14em] uppercase text-[#C5A059] block mb-1">
              10SIGNAL
            </span>
            <h2
              id="tensignal-share-modal-title"
              className="font-serif text-xl sm:text-2xl font-bold text-[#0B1B2C] m-0 mb-1 leading-snug"
            >
              {t('common.socialShare.title')}
            </h2>
            <p className="font-serif italic text-xs sm:text-[13px] text-[#0B1B2C]/65 m-0 leading-relaxed">
              {t('common.socialShare.subtitle')}
            </p>
          </div>

          {/* Social Share Channels Grid */}
          <div className="flex flex-col gap-2.5 sm:gap-3 mb-6">
            {/* 1. Instagram */}
            <button
              type="button"
              disabled={isGenerating}
              onClick={handleInstagramStory}
              className="w-full h-[52px] sm:h-[56px] px-3.5 sm:px-4 rounded-[16px] flex items-center justify-between text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm active:scale-[0.99] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed box-border"
              style={{
                background: 'linear-gradient(135deg, rgba(240, 148, 51, 0.08) 0%, rgba(220, 39, 67, 0.08) 50%, rgba(188, 24, 136, 0.08) 100%)',
                border: '1px solid rgba(220, 39, 67, 0.28)'
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-[11px] flex items-center justify-center text-white flex-shrink-0 shadow-xs"
                  style={{
                    background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)'
                  }}
                >
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                  </svg>
                </div>
                <div>
                  <strong className="block text-[13px] sm:text-[14px] font-sans font-semibold text-[#0B1B2C]">
                    {t('common.socialShare.instagramStory')}
                  </strong>
                  <span className="block text-[11px] font-sans text-[#0B1B2C]/60 leading-none mt-0.5">
                    {t('common.socialShare.instagramDesc')}
                  </span>
                </div>
              </div>
              <span className="text-base text-[#0B1B2C]/40 ml-2">➔</span>
            </button>

            {/* 2. WhatsApp */}
            <button
              type="button"
              disabled={isGenerating}
              onClick={handleWhatsApp}
              className="w-full h-[52px] sm:h-[56px] px-3.5 sm:px-4 rounded-[16px] flex items-center justify-between text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm active:scale-[0.99] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed box-border"
              style={{
                background: 'rgba(37, 211, 102, 0.08)',
                border: '1px solid rgba(37, 211, 102, 0.3)'
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-[11px] bg-[#25D366] flex items-center justify-center text-white flex-shrink-0 shadow-xs"
                >
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                  </svg>
                </div>
                <div>
                  <strong className="block text-[13px] sm:text-[14px] font-sans font-semibold text-[#0B1B2C]">
                    {t('common.socialShare.whatsapp')}
                  </strong>
                  <span className="block text-[11px] font-sans text-[#0B1B2C]/60 leading-none mt-0.5">
                    {t('common.socialShare.whatsappDesc')}
                  </span>
                </div>
              </div>
              <span className="text-base text-[#0B1B2C]/40 ml-2">➔</span>
            </button>

            {/* 3. X (Twitter) */}
            <button
              type="button"
              disabled={isGenerating}
              onClick={handleX}
              className="w-full h-[52px] sm:h-[56px] px-3.5 sm:px-4 rounded-[16px] flex items-center justify-between text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm active:scale-[0.99] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed box-border"
              style={{
                background: 'rgba(15, 20, 25, 0.05)',
                border: '1px solid rgba(15, 20, 25, 0.18)'
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-[11px] bg-[#0F1419] flex items-center justify-center text-white flex-shrink-0 shadow-xs"
                >
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </div>
                <div>
                  <strong className="block text-[13px] sm:text-[14px] font-sans font-semibold text-[#0B1B2C]">
                    {t('common.socialShare.x')}
                  </strong>
                  <span className="block text-[11px] font-sans text-[#0B1B2C]/60 leading-none mt-0.5">
                    {t('common.socialShare.xDesc')}
                  </span>
                </div>
              </div>
              <span className="text-base text-[#0B1B2C]/40 ml-2">➔</span>
            </button>

            {/* 4. Other Apps */}
            <button
              type="button"
              disabled={isGenerating}
              onClick={handleOtherApps}
              className="w-full h-[52px] sm:h-[56px] px-3.5 sm:px-4 rounded-[16px] flex items-center justify-between text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm active:scale-[0.99] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed box-border"
              style={{
                background: 'rgba(26, 62, 114, 0.05)',
                border: '1px solid rgba(26, 62, 114, 0.2)'
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-[11px] bg-[#1A3E72] flex items-center justify-center text-white flex-shrink-0 shadow-xs"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="18" cy="5" r="3" />
                    <circle cx="6" cy="12" r="3" />
                    <circle cx="18" cy="19" r="3" />
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                  </svg>
                </div>
                <div>
                  <strong className="block text-[13px] sm:text-[14px] font-sans font-semibold text-[#0B1B2C]">
                    {t('common.socialShare.otherApps')}
                  </strong>
                  <span className="block text-[11px] font-sans text-[#0B1B2C]/60 leading-none mt-0.5">
                    {t('common.socialShare.otherAppsDesc')}
                  </span>
                </div>
              </div>
              <span className="text-base text-[#0B1B2C]/40 ml-2">➔</span>
            </button>
          </div>

          {/* ── Status Toast / Notice Banner ── */}
          {statusNotice && (
            <div
              className="mb-4 py-2 px-3.5 rounded-[12px] flex items-center gap-2 text-xs font-sans transition-all duration-200"
              style={{
                backgroundColor:
                  statusNotice.type === 'success'
                    ? 'rgba(42, 90, 58, 0.12)'
                    : statusNotice.type === 'error'
                      ? 'rgba(220, 39, 67, 0.12)'
                      : 'rgba(197, 160, 89, 0.18)',
                color:
                  statusNotice.type === 'success'
                    ? '#1E4620'
                    : statusNotice.type === 'error'
                      ? '#991B1B'
                      : '#785412',
                border:
                  statusNotice.type === 'success'
                    ? '1px solid rgba(42, 90, 58, 0.3)'
                    : statusNotice.type === 'error'
                      ? '1px solid rgba(220, 39, 67, 0.3)'
                      : '1px solid rgba(197, 160, 89, 0.35)'
              }}
            >
              {isGenerating ? (
                <span className="inline-block w-3.5 h-3.5 border-2 border-[#C5A059] border-t-transparent rounded-full animate-spin flex-shrink-0" />
              ) : (
                <span>✦</span>
              )}
              <span className="flex-1 font-medium">{statusNotice.text}</span>
            </div>
          )}

          {/* ── Secondary Action Row: Download Image (+ Copy Link for Personality Only) ── */}
          <div className="flex items-center gap-3 pt-3 border-t border-[rgba(197,160,89,0.25)]">
            {/* Download Button */}
            <button
              type="button"
              disabled={isGenerating}
              onClick={handleDownloadImage}
              className={`h-[42px] px-3.5 rounded-[14px] bg-white border border-[rgba(26,62,114,0.18)] hover:border-[rgba(26,62,114,0.35)] hover:bg-[#F9FAFC] active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-2 text-[#1A3E72] font-sans text-xs font-semibold cursor-pointer disabled:opacity-50 ${
                isPersonality ? 'flex-1' : 'w-full'
              }`}
            >
              {isGenerating ? (
                <span className="w-3.5 h-3.5 border-2 border-[#1A3E72] border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
              )}
              <span>
                {isGenerating
                  ? t('common.socialShare.preparingImage')
                  : t('common.socialShare.downloadImage')}
              </span>
            </button>

            {/* Copy Link Button: Strictly Personality card only. Removed on Observer card */}
            {isPersonality && (
              <button
                type="button"
                onClick={handleCopyLink}
                className="flex-1 h-[42px] px-3.5 rounded-[14px] bg-white border border-[rgba(26,62,114,0.18)] hover:border-[rgba(26,62,114,0.35)] hover:bg-[#F9FAFC] active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-2 text-[#1A3E72] font-sans text-xs font-semibold cursor-pointer"
              >
                {copiedLink ? (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2a5a3a" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                )}
                <span className={copiedLink ? 'text-[#2a5a3a] font-bold' : ''}>
                  {copiedLink ? t('common.socialShare.copiedLink') : t('common.socialShare.copyLink')}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── OFFSCREEN HIGH-RES EXPORT NODE (1080 x 810) ── */}
      <div
        style={{
          position: 'fixed',
          left: '-9999px',
          top: '-9999px',
          width: '1080px',
          height: '810px',
          zIndex: -1000,
          pointerEvents: 'none',
          visibility: 'visible',
          overflow: 'hidden'
        }}
      >
        <div ref={exportNodeRef}>
          <ShareStoryCard
            cardData={cardData}
            isExport={true}
            imageSrcOverride={cachedDataUrlImage}
            logoSrcOverride={cachedLogoDataUrl || brandLogoPng}
            t={t}
          />
        </div>
      </div>
    </div>,
    document.body
  );
});

export default ShareModal;
