/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, FileText, ClipboardList, Library, Building2, Download, CheckSquare, Hammer, FileSpreadsheet, Lock } from 'lucide-react';

export default function Features() {
  const features = [
    {
      icon: Sparkles,
      iconBg: 'bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400',
      title: 'AI Risk Analiz Asistanı',
      description: 'Yapılacak işi yazın veya sahada çektiğiniz tehlike fotoğrafını yükleyin, yapay zeka mevzuata uygun Tehlike kaynağı, Risk ve Alınacak Teknik Önlemleri saniyeler içinde otomatik çıkarsın.'
    },
    {
      icon: ClipboardList,
      iconBg: 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400',
      title: 'Çoklu Risk Analiz Metodolojisi',
      description: 'L Tipi 5x5 Karar Matrisi, Fine-Kinney veya FMEA (Hata Türleri ve Etkileri Analizi) metodolojilerini kullanarak risklerinizi esnekçe puanlayın, formüller ve risk düzeyleri otomatik hesaplansın.'
    },
    {
      icon: FileText,
      iconBg: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400',
      title: 'Acil Durum Eylem Planı',
      description: 'İşyerlerinde Acil Durumlar Hakkında Yönetmelik ile uyumlu, söndürme, arama-kurtarma, koruma-tahliye ve ilkyardım ekiplerini atayabileceğiniz, AI destekli detaylı tahliye ve eylem planı oluşturucu.'
    },
    {
      icon: Library,
      iconBg: 'bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400',
      title: 'Bulut & Yerel Risk Kütüphanesi',
      description: 'Sık kullanılan İSG risklerinizi klasörler halinde düzenleyin. Online Kütüphane entegrasyonu sayesinde binlerce hazır İSG taslağını tek tıkla kendi analizlerinize aktarın.'
    },
    {
      icon: Building2,
      iconBg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400',
      title: 'OSGB & Çoklu Personel Yönetimi',
      description: 'OSGB yöneticisi olarak sisteme yeni uzmanlar ve işyeri hekimleri ekleyin. Her uzmanı kendi yetkili olduğu işyerleriyle eşleştirerek tam kontrollü ve izole bir izin yapısı kurun.'
    },
    {
      icon: Download,
      iconBg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400',
      title: 'Mevzuata Uygun Resmi Çıktılar',
      description: 'Tek bir tuşla A4 yatay detaylı tablolar, resmi risk değerlendirme kapak sayfaları, onaycı imzaları, İSG talimatları ve saha takip ziyaret raporu PDF çıktılarını resmi formata uygun olarak indirin.'
    }
  ];

  return (
    <section id="features" className="py-16 md:py-24 bg-slate-50 dark:bg-slate-900 border-y border-slate-200 dark:border-slate-800 relative transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <span className="inline-block px-3 py-1 bg-indigo-100 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 text-xs font-bold uppercase tracking-widest rounded-full">
            Enterprise Ready
          </span>
          <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-none">
            İSG Pro ile Süreçleri Kolaylaştırın
          </h3>
          <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed font-semibold">
            Klasik kağıt-kalem veya karmaşık Excel dosyaları yerine tüm süreçlerinizi entegre, hızlı ve mevzuata tam uyumlu dijital ortama taşıyın.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {features.map((feat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ delay: index * 0.05 }}
              className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-5 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md transition-all group flex flex-col h-full"
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 mb-4 ${feat.iconBg}`}>
                <feat.icon size={20} />
              </div>
              <h4 className="font-bold text-slate-800 dark:text-white text-base mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                {feat.title}
              </h4>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed flex-1 font-semibold">
                {feat.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Quality Seal Banner */}
        <div className="mt-16 p-6 md:p-8 bg-gradient-to-r from-slate-900 to-indigo-950 rounded-3xl shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6 text-white text-center sm:text-left select-none relative overflow-hidden">
          <div className="absolute top-0 right-0 w-44 h-44 bg-white/5 rounded-full blur-xl"></div>
          <div>
            <span className="text-[10px] font-bold text-indigo-300 uppercase block mb-1">Mevzuat Uyumluluğu</span>
            <h4 className="text-lg font-bold">6331 Sayılı İSG Kanunu ve İlgili Yönetmeliklerle %100 Uyumlu</h4>
            <p className="text-xs text-slate-400 mt-1">İşyerlerinde acil durum planlaması ve risk analizi asgari içerik gereksinimlerini tam olarak karşılar.</p>
          </div>
          <div className="px-5 py-2.5 bg-white/10 rounded-2xl border border-white/20 text-xs font-bold text-indigo-200 flex items-center gap-2 shrink-0">
            <CheckSquare size={14} className="text-emerald-400" />
            <span>Müfettiş Denetimine Hazır</span>
          </div>
        </div>

      </div>
    </section>
  );
}
