import React from 'react';
import { CheckCircle2, Clock, AlertTriangle, RefreshCw, X } from 'lucide-react';
import ButtonSpinner from './ButtonSpinner';

export default function PaymentStatusBanner({
  status,
  message,
  onRetry,
  onDismiss,
  t
}) {
  if (!status || status === 'idle' || !message) {
    return null;
  }

  const isSuccess = status === 'success';
  const isPending = status === 'checking' || status === 'processing';
  const isFailed = status === 'failed';

  const styles = isSuccess
    ? {
        bg: '#F0FDF4',
        border: '1px solid #BBF7D0',
        text: '#166534',
        iconColor: '#16A34A',
        badgeBg: '#DCFCE7'
      }
    : isFailed
    ? {
        bg: '#FEF2F2',
        border: '1px solid #FECACA',
        text: '#991B1B',
        iconColor: '#DC2626',
        badgeBg: '#FEE2E2'
      }
    : {
        bg: '#FFFBEB',
        border: '1px solid #FDE68A',
        text: '#92400E',
        iconColor: '#D97706',
        badgeBg: '#FEF3C7'
      };

  return (
    <div
      role="status"
      aria-live="polite"
      className="w-full max-w-[1200px] mx-auto my-3 sm:my-4 px-4 py-3 sm:py-3.5 rounded-xl shadow-xs transition-all duration-300"
      style={{
        backgroundColor: styles.bg,
        border: styles.border,
        color: styles.text
      }}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-3">
          <div
            className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
            style={{ backgroundColor: styles.badgeBg }}
          >
            {isSuccess && <CheckCircle2 size={18} style={{ color: styles.iconColor }} strokeWidth={2.4} />}
            {isPending && (status === 'checking' ? <ButtonSpinner size={16} /> : <Clock size={18} style={{ color: styles.iconColor }} strokeWidth={2.2} />)}
            {isFailed && <AlertTriangle size={18} style={{ color: styles.iconColor }} strokeWidth={2.2} />}
          </div>
          <p className="m-0 text-sm sm:text-[14.5px] font-medium leading-snug">
            {message}
          </p>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto flex-shrink-0">
          {status === 'processing' && onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
              style={{
                backgroundColor: '#FEF3C7',
                color: '#92400E',
                border: '1px solid #FCD34D'
              }}
            >
              <RefreshCw size={13} className="animate-spin-slow" />
              <span>{t ? t('billing.refreshStatus') : 'Refresh'}</span>
            </button>
          )}

          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              aria-label={t ? t('billing.dismiss') : 'Dismiss'}
              className="p-1.5 rounded-lg opacity-70 hover:opacity-100 transition-opacity cursor-pointer"
              style={{ color: styles.text }}
            >
              <X size={16} strokeWidth={2.2} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
