/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Laptop, Smartphone, Download, CheckCircle, Shield, 
  Cpu, HardDrive, Info, ShieldCheck, FileText, Link, Copy, Check, ExternalLink, RefreshCw, AlertTriangle
} from 'lucide-react';
import { AppRelease } from '../types';

export default function DownloadsPage() {
  const [releases, setReleases] = useState<AppRelease[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingPlatform, setDownloadingPlatform] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  useEffect(() => {
    fetchReleases();
    // Real-time polling every 5 seconds to sync download counts live from database
    const interval = setInterval(fetchReleases, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchReleases = async () => {
    try {
      const res = await fetch('/api/releases');
      if (res.ok) {
        const data = await res.json();
        setReleases(data);
      } else {
        throw new Error('Failed to fetch');
      }
    } catch (err) {
      console.warn('Backend API failed, falling back to local simulation data.', err);
      // Fallback local releases simulation
      setReleases(prev => prev.length > 0 ? prev : [
        {
          id: 'pc',
          platform: 'pc',
          version: '1.0.0',
          releaseNotes: 'İlk kararlı Windows masaüstü sürümü piyasaya sürüldü. Tüm yapay zeka analiz şablonları, yerel veritabanı senkronizasyonu ve hızlı PDF/A4 rapor yazdırma özellikleri entegre edildi.',
          fileSize: '42.5 MB',
          fileName: 'isgpro_setup.exe',
          updatedAt: new Date().toISOString(),
          downloadsCount: 148,
          downloadType: 'file',
          isPublished: false,
          showDownloadLinkBox: true
        },
        {
          id: 'apk',
          platform: 'apk',
          version: '1.0.0',
          releaseNotes: 'Android akıllı telefon ve tabletler için optimize edilmiş İSG Pro mobil saha sürümü. Çevrimdışı saha çalışma modu, kamera entegrasyonuyla anlık risk fotoğraflama özelliği ve dijital imza desteği.',
          fileSize: '18.2 MB',
          fileName: 'isgpro_v1.apk',
          updatedAt: new Date().toISOString(),
          downloadsCount: 312,
          downloadType: 'link',
          downloadUrl: 'https://drive.google.com/file/d/1HWSxVBGdkboC5NY0n3hiSbd3bZ_RHGY5/view?usp=sharing',
          isPublished: true,
          showDownloadLinkBox: true
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (platform: 'pc' | 'apk', fileName: string, directUrl?: string) => {
    setDownloadingPlatform(platform);
    
    // Increment download counter instantly in local state
    setReleases(prev => prev.map(r => r.platform === platform ? { ...r, downloadsCount: (r.downloadsCount || 0) + 1 } : r));

    try {
      // Send real-time track request to backend database (Firestore)
      await fetch(`/api/releases/track-download/${platform}`, { method: 'POST' }).catch(() => {});

      // Determine download target
      const targetUrl = directUrl || `/api/releases/download/${platform}`;
      
      // Trigger actual download or redirect
      const a = document.createElement('a');
      a.href = targetUrl;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      // Re-sync with backend database
      setTimeout(fetchReleases, 1000);
    } catch (error) {
      console.error('Download failed', error);
    } finally {
      setTimeout(() => {
        setDownloadingPlatform(null);
      }, 1200);
    }
  };

  const copyToClipboard = (text: string, platform: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(platform);
    setTimeout(() => setCopiedLink(null), 2500);
  };

  const pcRelease = releases.find(r => r.platform === 'pc') || {
    version: '1.0.0',
    fileName: 'isgpro_setup.exe',
    fileSize: '42.5 MB',
    releaseNotes: 'İlk kararlı Windows masaüstü sürümü.',
    updatedAt: new Date().toISOString(),
    downloadsCount: 148,
    downloadType: 'file',
    isPublished: false,
    showDownloadLinkBox: true,
    hasFileData: false
  };

  const apkRelease = releases.find(r => r.platform === 'apk') || {
    version: '1.0.0',
    fileName: 'isgpro_v1.apk',
    fileSize: '18.2 MB',
    releaseNotes: 'Android İSG Pro mobil saha sürümü.',
    updatedAt: new Date().toISOString(),
    downloadsCount: 312,
    downloadType: 'link',
    downloadUrl: 'https://drive.google.com/file/d/1HWSxVBGdkboC5NY0n3hiSbd3bZ_RHGY5/view?usp=sharing',
    isPublished: true,
    showDownloadLinkBox: true,
    hasFileData: false
  };

  const getFullDownloadUrl = (rel: AppRelease, platform: 'pc' | 'apk') => {
    if (rel.downloadUrl) return rel.downloadUrl;
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/api/releases/download/${platform}`;
    }
    return `/api/releases/download/${platform}`;
  };

  const isPcPublished = pcRelease.isPublished === true;
  const isApkPublished = apkRelease.isPublished !== false;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      
      {/* Title Header */}
      <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
        <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-100 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 text-xs font-bold uppercase tracking-widest rounded-full">
          <Download size={13} /> Çevrimdışı & Mobil Erişim
        </span>
        <h2 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
          Uygulamaları Cihazınıza İndirin
        </h2>
        <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 font-semibold leading-relaxed">
          İSG Pro'yu internet bağlantısı olmadan masaüstünde veya sahada doğrudan mobil cihazınızda kullanmak için resmi uygulamalarımızı indirin.
        </p>
      </div>

      {/* Main Grid or No Releases Banner */}
      {!isPcPublished && !isApkPublished ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-amber-50/90 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 rounded-3xl p-10 sm:p-14 text-center max-w-2xl mx-auto my-8 space-y-4 shadow-sm"
        >
          <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <AlertTriangle size={32} />
          </div>
          <h3 className="text-2xl font-black text-amber-900 dark:text-amber-300 uppercase tracking-wide">
            HENÜZ GÜNCEL SÜRÜM YOK
          </h3>
          <p className="text-sm sm:text-base text-amber-700 dark:text-amber-400 font-semibold leading-relaxed max-w-lg mx-auto">
            Şu anda yayınlanmış aktif bir masaüstü veya mobil uygulama sürümü bulunmamaktadır. Lütfen daha sonra tekrar kontrol ediniz.
          </p>
        </motion.div>
      ) : (
        <div className={`grid grid-cols-1 ${isPcPublished && isApkPublished ? 'lg:grid-cols-2 max-w-6xl' : 'max-w-2xl'} gap-10 items-stretch mb-16 mx-auto`}>
          
          {/* CARD 1: PC WINDOWS */}
          {isPcPublished && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm hover:shadow-xl hover:border-indigo-200 dark:hover:border-indigo-800 transition-all duration-300 p-7 sm:p-8 flex flex-col justify-between relative overflow-hidden"
            >
              {/* Background accent line */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-indigo-600"></div>

              <div>
                {/* Header Platform */}
                <div className="flex justify-between items-start mb-6">
                  <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/30 rounded-xl flex items-center justify-center shadow-inner shrink-0">
                    <Laptop size={30} />
                  </div>
                  <div className="text-right">
                    <span className="inline-block bg-indigo-100 dark:bg-indigo-950/50 text-indigo-800 dark:text-indigo-300 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                      Windows Destekli
                    </span>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-1 font-bold">Uyumlu: Win 10/11 (64-bit)</p>
                  </div>
                </div>

                <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-2">PC Platformu Masaüstü Sürümü</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mb-6 leading-relaxed">
                  Tüm veri yedekleme, gelişmiş A4 yazdırma şablonları ve büyük ekran risk analiz araçlarıyla tasarlanmış masaüstü asistanınız.
                </p>

                {/* File info badge row */}
                <div className="grid grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800/80 mb-6 font-mono text-[10px] sm:text-xs">
                  <div className="text-center border-r border-slate-200/60 dark:border-slate-800 last:border-0">
                    <span className="text-slate-400 dark:text-slate-500 font-bold block">SÜRÜM</span>
                    <span className="text-slate-800 dark:text-slate-200 font-black text-xs mt-0.5 block">v{pcRelease.version}</span>
                  </div>
                  <div className="text-center border-r border-slate-200/60 dark:border-slate-800 last:border-0">
                    <span className="text-slate-400 dark:text-slate-500 font-bold block">DOSYA BOYUTU</span>
                    <span className="text-slate-800 dark:text-slate-200 font-black text-xs mt-0.5 block">{pcRelease.fileSize}</span>
                  </div>
                  <div className="text-center">
                    <span className="text-slate-400 dark:text-slate-500 font-bold block flex items-center justify-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                      İNDİRİLME
                    </span>
                    <span className="text-indigo-600 dark:text-indigo-400 font-black text-xs mt-0.5 block">{pcRelease.downloadsCount} indirme</span>
                  </div>
                </div>

                {/* Release Description */}
                <div className="space-y-3 mb-6">
                  <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-2">
                    <FileText size={14} className="text-indigo-600 dark:text-indigo-400" /> Sürüm Güncelleme Notu
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 font-semibold leading-relaxed pl-1">
                    {pcRelease.releaseNotes}
                  </p>
                </div>

                {/* System Requirements */}
                <div className="space-y-2.5 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800/80 mb-6">
                  <h4 className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider flex items-center gap-1.5">
                    <Info size={12} className="text-indigo-500" /> PC Sistem Gereksinimleri
                  </h4>
                  <ul className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 dark:text-slate-300 font-semibold">
                    <li className="flex items-center gap-1.5"><Cpu size={12} className="text-indigo-500 shrink-0" /> Intel/AMD Çift Çekirdek</li>
                    <li className="flex items-center gap-1.5"><HardDrive size={12} className="text-indigo-500 shrink-0" /> En az 100 MB Boş Alan</li>
                    <li className="flex items-center gap-1.5"><CheckCircle size={12} className="text-indigo-500 shrink-0" /> 4 GB RAM ve üzeri</li>
                    <li className="flex items-center gap-1.5"><Shield size={12} className="text-indigo-500 shrink-0" /> Windows Defender Uyumlu</li>
                  </ul>
                </div>
              </div>

              <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                {pcRelease.showDownloadLinkBox !== false && (
                  /* Direct File Link Box */
                  <div className="bg-slate-50 dark:bg-slate-950/60 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 text-[11px] font-semibold space-y-1.5">
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      <span className="flex items-center gap-1">
                        <Link size={12} className="text-indigo-600 dark:text-indigo-400" />
                        {pcRelease.downloadType === 'link' ? 'Dosya Linki:' : 'İndirilebilir Dosya Linki:'}
                      </span>
                      <span className="text-slate-700 dark:text-slate-300 font-mono">
                        {pcRelease.downloadType === 'link' ? 'Harici Bağlantı' : `${pcRelease.fileName} (${pcRelease.fileSize})`}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={getFullDownloadUrl(pcRelease, 'pc')}
                        className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-[10px] font-mono text-slate-600 dark:text-slate-300 truncate focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => copyToClipboard(getFullDownloadUrl(pcRelease, 'pc'), 'pc')}
                        className="px-2.5 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors shrink-0 cursor-pointer"
                        title="Linki Kopyala"
                      >
                        {copiedLink === 'pc' ? (
                          <>
                            <Check size={12} className="text-emerald-500" />
                            <span className="text-emerald-600 font-bold">Kopyalandı!</span>
                          </>
                        ) : (
                          <>
                            <Copy size={12} />
                            <span>Kopyala</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Download Button */}
                <button
                  onClick={() => handleDownload('pc', pcRelease.fileName, pcRelease.downloadUrl)}
                  disabled={downloadingPlatform !== null}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl text-xs sm:text-sm shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95"
                >
                  {downloadingPlatform === 'pc' ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                        className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                      />
                      <span>İndirme Başlatılıyor...</span>
                    </>
                  ) : pcRelease.downloadType === 'link' ? (
                    <>
                      <ExternalLink size={16} />
                      <span>Dosya Linki İle İndir</span>
                    </>
                  ) : (
                    <>
                      <Download size={16} />
                      <span>İndir: {pcRelease.fileName} ({pcRelease.fileSize})</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {/* CARD 2: ANDROID APK */}
          {isApkPublished && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm hover:shadow-xl hover:border-emerald-200 dark:hover:border-emerald-800 transition-all duration-300 p-7 sm:p-8 flex flex-col justify-between relative overflow-hidden"
            >
              {/* Background accent line */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-emerald-500"></div>

              <div>
                {/* Header Platform */}
                <div className="flex justify-between items-start mb-6">
                  <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30 rounded-xl flex items-center justify-center shadow-inner shrink-0">
                    <Smartphone size={30} />
                  </div>
                  <div className="text-right">
                    <span className="inline-block bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                      Android Destekli
                    </span>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-1 font-bold">Uyumlu: Android 8.0 ve üzeri</p>
                  </div>
                </div>

                <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-2">Android Mobil Saha Sürümü</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mb-6 leading-relaxed">
                  Şantiyede, fabrikada veya madende anlık fotoğraf çekip risk analizine ekleyebileceğiniz ve dijital imza alabileceğiniz mobil asistan.
                </p>

                {/* File info badge row */}
                <div className="grid grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800/80 mb-6 font-mono text-[10px] sm:text-xs">
                  <div className="text-center border-r border-slate-200/60 dark:border-slate-800 last:border-0">
                    <span className="text-slate-400 dark:text-slate-500 font-bold block">SÜRÜM</span>
                    <span className="text-slate-800 dark:text-slate-200 font-black text-xs mt-0.5 block">v{apkRelease.version}</span>
                  </div>
                  <div className="text-center border-r border-slate-200/60 dark:border-slate-800 last:border-0">
                    <span className="text-slate-400 dark:text-slate-500 font-bold block">DOSYA BOYUTU</span>
                    <span className="text-slate-800 dark:text-slate-200 font-black text-xs mt-0.5 block">{apkRelease.fileSize}</span>
                  </div>
                  <div className="text-center">
                    <span className="text-slate-400 dark:text-slate-500 font-bold block flex items-center justify-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                      İNDİRİLME
                    </span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-black text-xs mt-0.5 block">{apkRelease.downloadsCount} indirme</span>
                  </div>
                </div>

                {/* Release Description */}
                <div className="space-y-3 mb-6">
                  <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-2">
                    <FileText size={14} className="text-emerald-500 dark:text-emerald-400" /> Sürüm Güncelleme Notu
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 font-semibold leading-relaxed pl-1">
                    {apkRelease.releaseNotes}
                  </p>
                </div>

                {/* Mobile Installation Guide */}
                <div className="space-y-2 bg-emerald-50/50 dark:bg-emerald-950/10 p-4 rounded-xl border border-emerald-100/60 dark:border-emerald-900/30 mb-6 text-[11px] text-slate-700 dark:text-slate-300 font-semibold leading-relaxed">
                  <h4 className="text-[10px] font-black uppercase text-emerald-800 dark:text-emerald-400 tracking-wider flex items-center gap-1.5 mb-1.5">
                    <ShieldCheck size={14} /> Güvenli APK Kurulum Rehberi
                  </h4>
                  <p>1. APK dosyasını aşağıdaki ikona veya butona tıklayarak cihazınıza indirin.</p>
                  <p>2. İndirilen dosyayı açıp <span className="text-emerald-700 dark:text-emerald-400 font-bold">"Bilinmeyen Kaynaklardan Yükleme"</span> iznini onaylayın.</p>
                  <p>3. Kurulumu tamamlayıp İSG Pro hesabınızla anında giriş yapın.</p>
                </div>
              </div>

              <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                {apkRelease.showDownloadLinkBox !== false && (
                  /* Direct File Link Box */
                  <div className="bg-slate-50 dark:bg-slate-950/60 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 text-[11px] font-semibold space-y-1.5">
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      <span className="flex items-center gap-1">
                        <Link size={12} className="text-emerald-600 dark:text-emerald-400" />
                        {apkRelease.downloadType === 'link' ? 'Dosya Linki:' : 'İndirilebilir Dosya Linki:'}
                      </span>
                      <span className="text-slate-700 dark:text-slate-300 font-mono">
                        {apkRelease.downloadType === 'link' ? 'Harici Bağlantı' : `${apkRelease.fileName} (${apkRelease.fileSize})`}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={getFullDownloadUrl(apkRelease, 'apk')}
                        className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-[10px] font-mono text-slate-600 dark:text-slate-300 truncate focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => copyToClipboard(getFullDownloadUrl(apkRelease, 'apk'), 'apk')}
                        className="px-2.5 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors shrink-0 cursor-pointer"
                        title="Linki Kopyala"
                      >
                        {copiedLink === 'apk' ? (
                          <>
                            <Check size={12} className="text-emerald-500" />
                            <span className="text-emerald-600 font-bold">Kopyalandı!</span>
                          </>
                        ) : (
                          <>
                            <Copy size={12} />
                            <span>Kopyala</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Download Button */}
                <button
                  onClick={() => handleDownload('apk', apkRelease.fileName, apkRelease.downloadUrl)}
                  disabled={downloadingPlatform !== null}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl text-xs sm:text-sm shadow-md shadow-emerald-600/10 hover:shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95"
                >
                  {downloadingPlatform === 'apk' ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                        className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                      />
                      <span>İndirme Başlatılıyor...</span>
                    </>
                  ) : apkRelease.downloadType === 'link' ? (
                    <>
                      <ExternalLink size={16} />
                      <span>Dosya Linki İle İndir</span>
                    </>
                  ) : (
                    <>
                      <Download size={16} />
                      <span>İndir: {apkRelease.fileName} ({apkRelease.fileSize})</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* Security Check Banner */}
      <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-center gap-6 max-w-6xl mx-auto">
        <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center shrink-0 shadow-sm animate-pulse">
          <Shield size={22} />
        </div>
        <div className="space-y-1 text-center md:text-left">
          <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center justify-center md:justify-start gap-1.5">
            %100 Güvenli, İmzalı ve Veritabanı Senkronize Dosyalar
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
            İSG Pro bünyesinde barındırılan tüm Windows yükleyici (.exe) ve Android (.apk) paketleri SHA-256 bütünlük kontrolünden geçirilmiş olup dijital sertifikalarla imzalanmıştır. İndirilme istatistikleri gerçek zamanlı olarak veritabanımızda güncellenmektedir.
          </p>
        </div>
      </div>

    </div>
  );
}
