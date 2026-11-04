import React, { useState, useEffect } from 'react';
import { Loader2, X, RefreshCw } from 'lucide-react';
import { UserType } from '../types';

interface TenMinuteTestTopBannerProps {
  currentUser: UserType;
  onUpdateUser: (fields: Partial<UserType>) => Promise<any> | void;
}

export const TenMinuteTestTopBanner: React.FC<TenMinuteTestTopBannerProps> = ({ currentUser, onUpdateUser }) => {
  const [timeLeft, setTimeLeft] = useState('');
  const [loading, setLoading] = useState(false);

  // Periyodik olarak her saniye kalan zamanı hesapla ve her 4 saniyede sunucudan durum senkronize et
  useEffect(() => {
    if (!currentUser?.licenseExpiresAt) return;

    const calcTime = () => {
      const diff = new Date(currentUser.licenseExpiresAt).getTime() - Date.now();
      if (diff <= 0) {
        if (currentUser.autoRenew === false) {
          setTimeLeft('00:00 (Süre Doldu)');
        } else {
          setTimeLeft('00:00 (Yenileniyor...)');
        }
      } else {
        const m = Math.floor(diff / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        setTimeLeft(`${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
      }
    };

    calcTime();
    const timerInterval = setInterval(calcTime, 1000);

    // Otomatik Yenileme & Lisans Durum Senkronizasyonu (her 4 saniyede bir)
    const syncStatus = async () => {
      try {
        const res = await fetch(`/api/subscription/status?username=${encodeURIComponent(currentUser.username || '')}&email=${encodeURIComponent(currentUser.email || '')}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data && data.success) {
          const hasExpiryChanged = data.licenseExpiresAt && data.licenseExpiresAt !== currentUser.licenseExpiresAt;
          const hasAutoRenewChanged = typeof data.autoRenew === 'boolean' && data.autoRenew !== (currentUser.autoRenew !== false);
          const hasPremiumChanged = typeof data.isPremium === 'boolean' && data.isPremium !== currentUser.isPremium;
          const hasStatusChanged = data.subscriptionStatus && data.subscriptionStatus !== currentUser.subscriptionStatus;

          if (hasExpiryChanged || hasAutoRenewChanged || hasPremiumChanged || hasStatusChanged) {
            const updated: Partial<UserType> = {
              ...currentUser,
              ...(data.licenseExpiresAt ? { licenseExpiresAt: data.licenseExpiresAt } : {}),
              ...(typeof data.autoRenew === 'boolean' ? { autoRenew: data.autoRenew } : {}),
              ...(typeof data.isPremium === 'boolean' ? { isPremium: data.isPremium } : {}),
              ...(data.subscriptionStatus ? { subscriptionStatus: data.subscriptionStatus } : {}),
              ...(data.autoRenewalTestCycles !== undefined ? { autoRenewalTestCycles: data.autoRenewalTestCycles } : {})
            };
            onUpdateUser(updated);
          }
        }
      } catch (err) {
        // Sessiz hata yakalama
      }
    };

    const syncInterval = setInterval(syncStatus, 4000);

    return () => {
      clearInterval(timerInterval);
      clearInterval(syncInterval);
    };
  }, [currentUser?.licenseExpiresAt, currentUser?.autoRenew, currentUser?.isPremium, currentUser?.subscriptionStatus]);

  const handleTriggerNow = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/subscription/trigger-renewal-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: currentUser.username, email: currentUser.email, action: 'force_renew' })
      });
      const data = await res.json();
      if (data.success) {
        if (data.action === 'blocked_by_cancel') {
          alert('🛑 TEST DOĞRULANDI:\n\nOtomatik yenilemeyi kapattığınız için PayTR kayıtlı kartınızdan HİÇBİR ÜCRET ÇEKİLMEDİ ve süre uzatılmadı!\n\nSistem iptal talimatınıza tam olarak uyuyor.');
          return;
        }
        if (data.chargeSuccess && data.renewed) {
          await onUpdateUser({
            licenseExpiresAt: data.licenseExpiresAt || new Date(Date.now() + 10 * 60 * 1000).toISOString(),
            autoRenewalTestCycles: data.autoRenewalTestCycles || ((currentUser.autoRenewalTestCycles || 0) + 1),
            autoRenew: true,
            subscriptionStatus: 'active',
            isPremium: true
          });
          alert('⚡ PayTR TAHSIİLATI BAŞARILI:\n\n' + data.message);
        } else {
          alert('⚠️ PayTR Tahsilat Bildirimi:\n\n' + (data.message || 'Çekim gerçekleştirilemedi.'));
        }
      }
    } catch (e: any) {
      alert('Tetikleme hatası: ' + (e?.message || e));
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateExpire = async () => {
    if (!confirm('10 dakikanın dolduğunu simüle etmek istiyor musunuz?\n\nOtomatik yenileme kapalıysa karttan çekilmediğini ve aboneliğin durduğunu test edeceksiniz.')) return;
    setLoading(true);
    try {
      const res = await fetch('/api/subscription/trigger-renewal-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: currentUser.username, email: currentUser.email, action: 'expire_now' })
      });
      const data = await res.json();
      if (data.success) {
        await onUpdateUser({
          isPremium: false,
          subscriptionStatus: 'expired',
          licenseExpiresAt: data.licenseExpiresAt || new Date().toISOString()
        });
        alert(data.message || '🛑 TEST BAŞARILI:\n\n10 dakikalık süre tamamlandı. Otomatik yenileme KAPALI olduğu için kartınızdan ücret çekilmedi ve abonelik durduruldu.');
      }
    } catch (e: any) {
      alert('Simülasyon hatası: ' + (e?.message || e));
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAutoRenew = async () => {
    const nextVal = currentUser.autoRenew === false;
    setLoading(true);
    try {
      const res = await fetch('/api/subscription/toggle-autorenew', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: currentUser.username, email: currentUser.email, autoRenew: nextVal })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        await onUpdateUser({
          autoRenew: nextVal,
          subscriptionStatus: nextVal ? 'active' : 'cancelled'
        });
        alert(nextVal ? '✓ Otomatik yenileme AÇILDI. Süre bittiğinde otomatik çekilecek.' : '✕ Otomatik yenileme KAPATILDI. Süre bitince KARTTAN ÇEKİLMEYECEK.');
      }
    } catch (e) {
      console.warn('Yenileme toggle hatası:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleStopTest = async () => {
    if (!confirm('10 Dakikalık test modunu sonlandırmak istiyor musunuz?')) return;
    try {
      await fetch('/api/subscription/stop-test-10m', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: currentUser.username, email: currentUser.email })
      });
      await onUpdateUser({
        isTenMinuteTestMode: false,
        autoRenewalTestCycles: 0,
        testModeType: null as any
      });
    } catch (e) {
      console.warn('Test durdurma hatası:', e);
    }
  };

  const isAutoRenew = currentUser.autoRenew !== false;

  return (
    <div className="bg-gradient-to-r from-amber-500 via-orange-600 to-amber-600 text-white px-3 sm:px-4 py-2 flex flex-wrap items-center justify-between gap-2 shadow-lg z-[80] shrink-0 text-xs font-bold border-b border-amber-400 sticky top-0">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="flex items-center gap-1.5 bg-black/25 px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider backdrop-blur-sm">
          <span className="animate-pulse">🧪</span> 10 Dk Yenileme Test Modu
        </span>
        <div className="flex items-center gap-1.5 bg-white/20 px-2.5 py-1 rounded-lg">
          <span className="text-[10px] text-amber-100 uppercase">Kalan Süre:</span>
          <span className="font-mono text-sm font-black text-white">{timeLeft || '10:00'}</span>
        </div>
        <span className="bg-black/20 px-2 py-1 rounded-md text-[10px] font-semibold">
          Çevrim: <strong>#{currentUser.autoRenewalTestCycles || 0}</strong> kez yenilendi
        </span>
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
          isAutoRenew ? 'bg-emerald-400 text-emerald-950' : 'bg-rose-200 text-rose-950'
        }`}>
          {isAutoRenew ? '✓ Otomatik Yenileme: AÇIK' : '✕ Otomatik Yenileme: KAPALI'}
        </span>
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        <button
          type="button"
          disabled={loading}
          onClick={handleTriggerNow}
          className="px-2.5 py-1 bg-white hover:bg-amber-100 text-amber-950 rounded-lg text-[11px] font-black shadow transition active:scale-95 cursor-pointer flex items-center gap-1"
          title="10 dakika beklemeden hemen çekim/yenileme döngüsünü tetikle"
        >
          {loading ? <Loader2 size={11} className="animate-spin" /> : <span>⚡ Şimdi Çek & Yenile</span>}
        </button>

        <button
          type="button"
          disabled={loading}
          onClick={handleSimulateExpire}
          className="px-2.5 py-1 bg-amber-900/60 hover:bg-amber-900 text-white rounded-lg text-[11px] font-bold shadow transition active:scale-95 cursor-pointer flex items-center gap-1"
          title="10 dakikalık süreyi hemen doldurarak otomatik yenileme kapalıyken karttan çekim yapılmadığını doğrula"
        >
          <span>⏳ 10 Dk Bitir (İptal Testi)</span>
        </button>

        <button
          type="button"
          disabled={loading}
          onClick={handleToggleAutoRenew}
          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
            isAutoRenew ? 'bg-rose-800 hover:bg-rose-900 text-white' : 'bg-emerald-700 hover:bg-emerald-800 text-white'
          }`}
          title={isAutoRenew ? 'Otomatik yenilemeyi kapat (Süre bittiğinde abonelik durur)' : 'Otomatik yenilemeyi aç'}
        >
          {isAutoRenew ? 'İptal Et (Kapat)' : 'Aç'}
        </button>

        <button
          type="button"
          onClick={handleStopTest}
          className="p-1 text-white/80 hover:text-white hover:bg-black/20 rounded-md transition cursor-pointer"
          title="10 Dakikalık test modunu kapat ve temizle"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  );
};
export default TenMinuteTestTopBanner;

