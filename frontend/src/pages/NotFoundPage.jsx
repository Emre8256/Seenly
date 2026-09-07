import React from 'react';

export default function NotFoundPage() {
  return (
    <main className="min-h-screen bg-[#FDFBF4] flex items-center justify-center p-6 text-center">
      <div>
        <p className="text-sm font-semibold text-[#8C6D37]">404</p>
        <h1 className="font-serif text-3xl text-[#1A3E72] mt-2">Sayfa bulunamadı</h1>
        <p className="text-[#64748B] mt-3">Bağlantıyı kontrol edin veya ana sayfaya dönün.</p>
        <a className="inline-flex mt-6 rounded-full bg-[#16222F] px-5 py-3 text-white" href="#/">Ana sayfaya dön</a>
      </div>
    </main>
  );
}
