import React, { memo, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import QRCode from 'qrcode';

const DashboardQrModal = memo(function DashboardQrModal({
  qrModalOpen,
  setQrModalOpen,
  snapshot,
  displayName,
  langCode
}) {
  const [qrDataUrl, setQrDataUrl] = useState('');
  const dialogRef = useRef(null);
  const closeRef = useRef(null);
  const openerRef = useRef(null);
  const inviteUrl = snapshot?.publicSlug ? `${window.location.origin}/#/friend/${snapshot.publicSlug}` : '';

  useEffect(() => {
    if (!qrModalOpen) return undefined;
    openerRef.current = document.activeElement;
    QRCode.toDataURL(inviteUrl, { width: 500, margin: 2 }).then(setQrDataUrl);
    closeRef.current?.focus();
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setQrModalOpen(false);
      if (event.key !== 'Tab' || !dialogRef.current) return;
      const controls = [...dialogRef.current.querySelectorAll('button, [href], [tabindex]:not([tabindex="-1"])')];
      if (!controls.length) return;
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => { document.removeEventListener('keydown', onKeyDown); openerRef.current?.focus?.(); };
  }, [inviteUrl, qrModalOpen, setQrModalOpen]);

  if (!qrModalOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-[#0A1118]/65 transition-all duration-300"
      onClick={() => setQrModalOpen(false)}
      role="presentation"
    >
      <div
        className="w-full max-w-[340px] rounded-[26px] sm:rounded-[32px] bg-[#FDFBF4] border border-[rgba(197,160,89,0.35)] p-6 sm:p-8 relative flex flex-col items-center text-center box-border"
        onClick={(e) => e.stopPropagation()}
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dashboard-qr-title"
      >
        <button
          type="button"
          onClick={() => setQrModalOpen(false)}
          className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-black/[0.04] hover:bg-black/[0.08] flex items-center justify-center text-[#786C5E] hover:text-[#1A3E72] transition-colors border border-[rgba(197,160,89,0.18)]"
          aria-label={langCode === 'tr' ? 'Kapat' : 'Close'}
          ref={closeRef}
        >
          <X size={15} strokeWidth={2.4} />
        </button>

        <h3 id="dashboard-qr-title" className="font-serif text-[1.3rem] sm:text-[1.5rem] font-bold text-[#1A3E72] m-0 mb-1.5 leading-tight">
          {langCode === 'tr' ? 'Profil Karekodu' : 'Profile QR Code'}
        </h3>

        <p className="font-sans text-[0.8rem] sm:text-[0.85rem] text-[#64748B] m-0 mb-4 sm:mb-5 leading-relaxed max-w-[260px]">
          {langCode === 'tr' ? 'Arkadaşlarının seni okuması için bu karekodu okutmasını sağla.' : 'Let your friends scan this QR code to read your signals.'}
        </p>

        <div className="p-3 sm:p-4 rounded-2xl bg-white border border-[rgba(197,160,89,0.25)] shadow-[0_4px_16px_rgba(80,60,40,0.06)] mb-4 sm:mb-5">
          <img
            src={qrDataUrl}
            alt="Profile QR Code"
            className="w-[160px] h-[160px] sm:w-[190px] sm:h-[190px] object-contain block rounded-lg"
          />
        </div>

        <button
          type="button"
          onClick={() => {
            if (qrDataUrl) {
                const link = document.createElement('a');
                link.href = qrDataUrl;
                link.download = `Seenly_QR_${displayName}.png`;
                link.click();
            }
          }}
          className="w-full py-2.5 sm:py-3 px-5 rounded-full bg-[#16222F] hover:bg-[#0E1721] text-[#F3DE9A] hover:text-white font-sans text-[12px] sm:text-[12.5px] font-bold uppercase tracking-wider shadow-[0_4px_16px_rgba(22,34,47,0.2)] active:scale-[0.98] transition-all flex items-center justify-center gap-2 border border-[#F3DE9A]/30 cursor-pointer"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
          <span>{langCode === 'tr' ? 'KAREKODU İNDİR' : 'DOWNLOAD QR'}</span>
        </button>
      </div>
    </div>,
    document.body
  );
});

export default DashboardQrModal;
