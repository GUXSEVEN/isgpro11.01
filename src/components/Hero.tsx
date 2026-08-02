/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, Play, ArrowRight, Sparkles, Building2, Download, CheckCircle, FileSpreadsheet, X, HelpCircle, Youtube, ExternalLink } from 'lucide-react';
import { SiteConfig } from '../types';

interface HeroProps {
  onExploreClick: () => void;
  onPlaygroundClick: () => void;
  onTrialClick?: () => void;
  siteConfig: SiteConfig;
}

const getYouTubeEmbedUrl = (url: string): string => {
  if (!url) return '';
  let videoId = '';
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/)([^#\&\?]*).*/;
  const match = url.match(regExp);
  if (match && match[2].length === 11) {
    videoId = match[2];
  } else {
    if (url.includes('youtube.com/embed/')) {
      return url.replace('youtube.com/embed/', 'youtube-nocookie.com/embed/');
    }
    return url;
  }
  return `https://www.youtube-nocookie.com/embed/${videoId}`;
};

const getYouTubeLinkUrl = (url: string): string => {
  if (!url) return 'https://youtube.com';
  if (url.includes('youtu.be/')) return url;
  if (url.includes('youtube.com/embed/')) {
    const parts = url.split('embed/');
    if (parts.length > 1) {
      const id = parts[1].split('?')[0];
      return `https://www.youtube.com/watch?v=${id}`;
    }
  }
  return url;
};

export default function Hero({ onExploreClick, onPlaygroundClick, onTrialClick, siteConfig }: HeroProps) {
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [kurulumModalOpen, setKurulumModalOpen] = useState(false);

  return (
    <section className="relative py-12 md:py-20 overflow-hidden bg-transparent">
      {/* Decorative Blur Spheres */}
      <div className="absolute top-1/4 left-1/10 w-72 h-72 bg-blue-400/20 dark:bg-blue-600/10 rounded-full blur-3xl -z-10 animate-pulse duration-[6s]"></div>
      <div className="absolute top-1/2 right-1/10 w-96 h-96 bg-purple-400/20 dark:bg-purple-600/10 rounded-full blur-3xl -z-10 animate-pulse duration-[8s]"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Text & CTA */}
          <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-block px-3 py-1 bg-indigo-100 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 text-xs font-bold uppercase tracking-widest rounded-full shadow-sm"
            >
              <span>Yapay Zeka Destekli Yeni Nesil İSG Dönemi</span>
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-[1.1]"
            >
              {siteConfig.heroTitle}
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl mx-auto lg:mx-0 font-semibold"
            >
              {siteConfig.heroSubtitle}
            </motion.p>

            {/* CTAs */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row flex-wrap gap-3 justify-center lg:justify-start items-center"
            >
              {onTrialClick && (
                <button
                  onClick={onTrialClick}
                  className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-xl text-sm font-extrabold shadow-lg shadow-amber-500/25 transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer animate-pulse"
                >
                  <Sparkles size={16} />
                  <span>⚡ 7 Gün Ücretsiz Dene</span>
                </button>
              )}
              <button
                onClick={onExploreClick}
                className="px-6 py-3 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
              >
                <span>Hemen Lisans Al</span>
                <ArrowRight size={16} />
              </button>
              <button
                onClick={onPlaygroundClick}
                className="bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 px-6 py-3 rounded-xl text-sm font-semibold shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
              >
                <Play size={14} className="fill-slate-700 dark:fill-slate-200 text-slate-700 dark:text-slate-200" />
                <span>Canlı Demoyu Dene</span>
              </button>
              <button
                onClick={() => setVideoModalOpen(true)}
                className="bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-700 dark:text-red-300 border border-red-200/50 dark:border-red-900/40 px-6 py-3 rounded-xl text-sm font-semibold shadow-sm transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
              >
                <Play size={14} className="fill-red-700 dark:fill-red-300 text-red-700 dark:text-red-300" />
                <span>Tanıtım Videosu</span>
              </button>
              <button
                onClick={() => setKurulumModalOpen(true)}
                className="bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-900/40 px-6 py-3 rounded-xl text-sm font-semibold shadow-sm transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
              >
                <Youtube size={15} className="text-emerald-700 dark:text-emerald-400" />
                <span>Kurulum Videosu & Kılavuz</span>
              </button>
            </motion.div>

            {/* Key Value Highlights */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="pt-6 border-t border-slate-200 dark:border-slate-800 grid grid-cols-3 gap-4 max-w-md mx-auto lg:mx-0 text-left"
            >
              <div>
                <p className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">%85</p>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Zaman Tasarrufu</p>
              </div>
              <div>
                <p className="text-2xl font-extrabold text-purple-600 dark:text-purple-400">A4</p>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Yönetmeliğe Uygun</p>
              </div>
              <div>
                <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">5x5 / FK</p>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Çoklu Metot</p>
              </div>
            </motion.div>
          </div>

          {/* Right Column: Visual Mockup Showcase */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 100 }}
            className="lg:col-span-6 relative"
          >
            {/* Mockup Frame */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-2xl p-4 md:p-6 overflow-hidden max-w-lg mx-auto relative">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 font-mono ml-2">isg_pro_saha_takip_raporu.pdf</span>
                </div>
                <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 px-2 py-0.5 rounded text-[9px] font-extrabold text-indigo-600 dark:text-indigo-400 uppercase">
                  <CheckCircle size={10} /> ÇIKTIYA HAZIR
                </div>
              </div>

              {/* Demo Application Graphic */}
              <div className="space-y-4">
                {/* Simulated Doc Header */}
                <div className="border border-slate-950 dark:border-slate-700 px-3 py-1.5 rounded-lg flex items-center justify-between text-[9px] font-extrabold bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                  <div className="flex items-center gap-2">
                    <Building2 size={14} className="text-indigo-600 dark:text-indigo-400" />
                    <span>Örnek Yapı ve İnşaat A.Ş.</span>
                  </div>
                  <span className="text-[8px] bg-red-100 dark:bg-red-950/65 text-red-700 dark:text-red-300 px-2 py-0.5 rounded">Çok Tehlikeli</span>
                </div>

                {/* Simulated Table Rows */}
                <div className="space-y-2.5">
                  <div className="bg-red-50/60 dark:bg-red-950/20 p-3 rounded-2xl border border-red-100/80 dark:border-red-900/30 flex justify-between gap-3 text-xs">
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="bg-red-600 text-white font-mono font-bold text-[8px] px-1 rounded">25</span>
                        <h4 className="font-extrabold text-slate-800 dark:text-slate-200 text-[11px]">Yüksekte Çalışma İskele Uygunsuzluğu</h4>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1">Korkuluksuz iskelede emniyet kemersiz çalışma.</p>
                      <p className="text-[10px] text-green-700 dark:text-green-400 font-bold mt-1">Önlem: TS EN 12811 uygun iskele ve yaşam hattı.</p>
                    </div>
                    <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-lg shrink-0 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-[9px] font-bold text-slate-400 dark:text-slate-500">FOTO</div>
                  </div>

                  <div className="bg-yellow-50/60 dark:bg-yellow-950/20 p-3 rounded-2xl border border-yellow-100/80 dark:border-yellow-900/30 flex justify-between gap-3 text-xs">
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="bg-yellow-500 text-white font-mono font-bold text-[8px] px-1 rounded">12</span>
                        <h4 className="font-extrabold text-slate-800 dark:text-slate-200 text-[11px]">Elektrik Panosu Açık İletkenler</h4>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1">Kilitleri kırılmış olan ana dağıtım panosu.</p>
                      <p className="text-[10px] text-green-700 dark:text-green-400 font-bold mt-1">Önlem: Pano kapak kilitlenmesi ve yalıtkan paspas.</p>
                    </div>
                    <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-lg shrink-0 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-[9px] font-bold text-slate-400 dark:text-slate-500">FOTO</div>
                  </div>
                </div>

                {/* Team Signatures Section */}
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-3 bg-slate-50/30 dark:bg-slate-800/30 flex justify-between gap-2 text-[8px] font-bold text-slate-500 dark:text-slate-400">
                  <div className="text-center flex-1">
                    <div className="bg-slate-100 dark:bg-slate-700 p-0.5 rounded text-[7px] uppercase mb-0.5">İSG Uzmanı</div>
                    <p className="text-slate-700 dark:text-slate-300">Ali Yılmaz</p>
                  </div>
                  <div className="text-center flex-1">
                    <div className="bg-slate-100 dark:bg-slate-700 p-0.5 rounded text-[7px] uppercase mb-0.5">İşyeri Hekimi</div>
                    <p className="text-slate-700 dark:text-slate-300">Zeynep Kaya</p>
                  </div>
                  <div className="text-center flex-1">
                    <div className="bg-slate-100 dark:bg-slate-700 p-0.5 rounded text-[7px] uppercase mb-0.5">İşveren Vekili</div>
                    <p className="text-slate-700 dark:text-slate-300">Ahmet Şahin</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Overlapping Badges */}
            <div className="absolute -bottom-5 -right-2 bg-indigo-600 text-white p-3 rounded-2xl shadow-xl flex items-center gap-2.5 animate-bounce duration-[4s] select-none max-w-[160px]">
              <div className="p-1 bg-white/20 rounded-lg shrink-0"><Download size={14} /></div>
              <div>
                <span className="block text-[10px] font-bold text-indigo-200 uppercase">RAPORLAMA</span>
                <span className="block text-xs font-extrabold">Tek Tıkla Hazır</span>
              </div>
            </div>

            <div className="absolute -top-5 -left-4 bg-emerald-500 text-white p-3 rounded-2xl shadow-xl flex items-center gap-2.5 select-none max-w-[150px]">
              <div className="p-1 bg-white/20 rounded-lg shrink-0"><FileSpreadsheet size={14} /></div>
              <div>
                <span className="block text-[10px] font-bold text-emerald-200 uppercase">Excel Aktarım</span>
                <span className="block text-xs font-extrabold">Şablon Uyumlu</span>
              </div>
            </div>
          </motion.div>

        </div>
      </div>

      <AnimatePresence>
        {videoModalOpen && (
          <div className="fixed inset-0 bg-slate-900/80 dark:bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-950 w-full max-w-4xl rounded-2xl overflow-hidden border border-slate-800 shadow-2xl relative p-1"
            >
              {/* Header Bar */}
              <div className="flex justify-between items-center px-4 py-3 bg-slate-900 text-white rounded-t-xl">
                <span className="text-xs font-black tracking-wider flex items-center gap-2"><Play size={14} className="text-red-500 fill-red-500" /> İSG PRO TANITIM VİDEOSU</span>
                <div className="flex items-center gap-2">
                  <a
                    href={getYouTubeLinkUrl(siteConfig.videoUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 active:scale-95 text-white text-[10px] font-bold rounded-lg transition-all"
                  >
                    <Youtube size={14} />
                    <span>YouTube'da İzle</span>
                    <ExternalLink size={10} />
                  </a>
                  <button
                    onClick={() => setVideoModalOpen(false)}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-all cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
              <div className="aspect-video w-full bg-black">
                <iframe
                  src={getYouTubeEmbedUrl(siteConfig.videoUrl)}
                  title="İSG Pro Tanıtım Videosu"
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                ></iframe>
              </div>
            </motion.div>
          </div>
        )}

        {kurulumModalOpen && (
          <div className="fixed inset-0 bg-slate-900/80 dark:bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-slate-900 w-full max-w-5xl rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-2xl relative flex flex-col md:flex-row"
            >
              {/* Left Side: Video & Direct YouTube link button */}
              <div className="md:w-1/2 bg-slate-950 p-6 flex flex-col justify-between gap-4 border-b md:border-b-0 md:border-r border-slate-800">
                <div>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-950/50 border border-red-800/40 text-red-400 text-[9px] font-bold uppercase tracking-wider rounded-full mb-3">
                    <Youtube size={12} className="fill-red-500 text-red-500" /> MOBİL KURULUM VİDEOSU
                  </span>
                  <h3 className="text-lg font-black text-white tracking-tight leading-tight mb-1">
                    Android Mobil Kurulum Videosu
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Telefonunuza APK kurulumunu görsel olarak adım adım takip edin.
                  </p>
                </div>

                <div className="aspect-video w-full rounded-2xl overflow-hidden border border-slate-800 shadow-xl bg-black">
                  <iframe
                    src={getYouTubeEmbedUrl(siteConfig.kurulumVideoUrl || siteConfig.videoUrl)}
                    title="İSG Pro Kurulum Kılavuzu"
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  ></iframe>
                </div>

                {/* DIRECT YOUTUBE LINK BUTTON */}
                <div className="flex flex-col gap-2">
                  <a
                    href={getYouTubeLinkUrl(siteConfig.kurulumVideoUrl || siteConfig.videoUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-[0.98] cursor-pointer"
                  >
                    <Youtube size={16} />
                    <span>YOUTUBE'DA İZLE & ABONE OL</span>
                    <ExternalLink size={12} />
                  </a>
                  <span className="text-[10px] text-slate-500 text-center font-mono font-bold">
                    Tarayıcı veya YouTube uygulamasında açmak için tıklayın
                  </span>
                </div>
              </div>

              {/* Right Side: Step-by-Step DNS Guide */}
              <div className="md:w-1/2 p-6 md:p-8 bg-white dark:bg-slate-900 flex flex-col justify-between max-h-[85vh] overflow-y-auto">
                <div>
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 font-sans">ANDROID MOBİL UYGULAMA</span>
                      <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5">İSG PRO NASIL KURULUM REHBERİ</h3>
                    </div>
                    <button
                      onClick={() => setKurulumModalOpen(false)}
                      className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <div className="space-y-5">
                    {/* Step 1 */}
                    <div className="flex gap-3 items-start">
                      <div className="w-6 h-6 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40 rounded-lg flex items-center justify-center text-xs font-extrabold text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5 font-sans">1</div>
                      <div className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300">
                        <h4 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">Uygulamayı İndirin</h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mt-0.5 font-semibold">
                          Size verilen uygulamayı indir linkinden yönlendirilen Drive dosyasına gidin.
                        </p>
                      </div>
                    </div>

                    {/* Step 2 */}
                    <div className="flex gap-3 items-start">
                      <div className="w-6 h-6 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40 rounded-lg flex items-center justify-center text-xs font-extrabold text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5 font-sans">2</div>
                      <div className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300">
                        <h4 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">Bilinmeyen Kaynak İznini Verin</h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mt-0.5 font-semibold">
                          Çıkan uyarıyı ayarlar kısmından değiştirin. Bu kaynaktan izin ver seçeneğini etkinleştireceğiz.
                        </p>
                      </div>
                    </div>

                    {/* Step 3 */}
                    <div className="flex gap-3 items-start">
                      <div className="w-6 h-6 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40 rounded-lg flex items-center justify-center text-xs font-extrabold text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5 font-sans">3</div>
                      <div className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300">
                        <h4 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">Güvenlik Uyarısını Onaylayın</h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mt-0.5 font-semibold">
                          Ardından kabul edip çıkan uyarıya tamam diyeceğiz.
                        </p>
                      </div>
                    </div>

                    {/* Step 4 */}
                    <div className="flex gap-3 items-start">
                      <div className="w-6 h-6 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40 rounded-lg flex items-center justify-center text-xs font-extrabold text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5 font-sans">4</div>
                      <div className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300">
                        <h4 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">Yüklemeyi Tamamlayın</h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mt-0.5 font-semibold">
                          Daha sonra yükle diyerek telefona kurulum sağlayabilirsiniz.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => setKurulumModalOpen(false)}
                    className="w-full bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold py-3 rounded-xl text-xs transition-all cursor-pointer active:scale-95"
                  >
                    Kılavuzu Kapat
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </section>
  );
}
