import React from 'react';
import { useLocale } from '../context/LocaleContext';

export default function NotFoundPage() {
  const { t } = useLocale();

  return (
    <main className="min-h-screen bg-[#FDFBF4] flex items-center justify-center p-6 text-center">
      <div>
        <p className="text-sm font-semibold text-[#8C6D37]">404</p>
        <h1 className="font-serif text-3xl text-[#1A3E72] mt-2">{t('errors.notFoundTitle')}</h1>
        <p className="text-[#64748B] mt-3">{t('errors.notFoundDesc')}</p>
        <a className="inline-flex mt-6 rounded-full bg-[#16222F] px-5 py-3 text-white cursor-pointer" href="#/">
          {t('errors.notFoundBackHome')}
        </a>
      </div>
    </main>
  );
}
