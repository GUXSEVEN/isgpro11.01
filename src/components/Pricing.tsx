/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { Check, ShieldCheck, HelpCircle, Star, Sparkles } from 'lucide-react';
import { Plan } from '../types';

interface PricingProps {
  onSelectPlan: (planId: 'monthly' | 'yearly') => void;
  onOpenTrialModal?: () => void;
}

export default function Pricing({ onSelectPlan, onOpenTrialModal }: PricingProps) {
  const plans: Plan[] = [
    {
      id: 'monthly',
      name: 'Aylık Plan',
      price: 299,
      period: 'Ay',
      description: 'Küçük ekipler veya bireysel İSG Uzmanları için esnek abonelik planı.',
      features: [
        'Sınırsız Yapay Zeka Risk Analizi',
        'Çoklu Metot Desteği (5x5, Kinney, FMEA)',
        'Saha Ziyareti & Takip Raporlama',
        'PDF / Word / Excel Rapor Çıktıları',
        '1 Adet Aktif OSGB Tanımı',
        'Öncelikli E-Posta Destek'
      ]
    },
    {
      id: 'yearly',
      name: 'Yıllık Plan',
      price: 2990,
      period: 'Yıl',
      description: 'Kurumsal İSG süreçlerini kesintisiz yönetmek isteyenler için en iyi teklif.',
      badge: 'En Popüler / 2 Ay Bedava',
      features: [
        'Sınırsız Yapay Zeka Risk Analizi',
        'Çoklu Metot Desteği (5x5, Kinney, FMEA)',
        'Saha Ziyareti & Takip Raporlama',
        'PDF / Word / Excel Rapor Çıktıları',
        'Sınırsız Hazır Kütüphane & Bulut Yedekleme',
        '1 Adet Aktif OSGB Tanımı',
        '7/24 Telefon & Ticket Desteği'
      ]
    }
  ];

  return (
    <section id="pricing" className="py-16 md:py-24 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-3">
          <span className="inline-block px-3 py-1 bg-indigo-100 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 text-xs font-bold uppercase tracking-widest rounded-full">
            Esnek Lisans Seçenekleri
          </span>
          <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-none">
            Kullanımınıza En Uygun Planı Seçin
          </h3>
          <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed font-semibold">
            Bireysel uzmanlardan çok şubeli ortak sağlık güvenlik birimlerine kadar her ihtiyaca uygun lisans seçenekleri.
          </p>
        </div>

        {/* 7-Day Free Trial Callout Banner */}
        {onOpenTrialModal && (
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto mb-10 p-6 sm:p-8 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 rounded-3xl text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden"
          >
            <div className="space-y-2 text-center md:text-left z-10">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 rounded-full text-[10px] font-black uppercase tracking-widest text-white backdrop-blur-md">
                <Sparkles size={12} />
                <span>Risk Almadan Deneyin</span>
              </div>
              <h4 className="text-2xl font-black tracking-tight">
                7 Günlük Ücretsiz Deneme Sürümü
              </h4>
              <p className="text-xs sm:text-sm text-amber-100 font-semibold max-w-xl">
                Tüm yapay zeka destekli risk analizi, Kinney, FMEA ve raporlama araçlarını 7 gün boyunca hiçbir ücret ödemeden ve kredi kartı tanımlamadan test edin.
              </p>
            </div>

            <button
              onClick={onOpenTrialModal}
              className="shrink-0 px-6 py-3.5 bg-white text-orange-600 hover:bg-slate-50 font-black text-xs sm:text-sm rounded-xl shadow-lg transition-all active:scale-95 cursor-pointer z-10 flex items-center gap-2"
            >
              <Sparkles size={16} className="text-amber-500 fill-amber-500" />
              <span>Şimdi Ücretsiz Dene</span>
            </button>
          </motion.div>
        )}

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch max-w-4xl mx-auto">
          {plans.map((plan, index) => {
            const isYearly = plan.id === 'yearly';

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={`relative bg-white dark:bg-slate-900 border p-6 sm:p-8 flex flex-col justify-between h-full transition-all rounded-2xl ${
                  isYearly
                    ? 'border-indigo-500 dark:border-indigo-500 ring-4 ring-indigo-50 dark:ring-indigo-950/50 shadow-md scale-[1.02] md:scale-[1.03] z-10'
                    : 'border-slate-200 dark:border-slate-850 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm hover:shadow-md'
                }`}
              >
                {/* Popular Badge */}
                {plan.badge && (
                  <div className="absolute top-0 right-0 bg-indigo-600 text-white font-extrabold text-[9px] px-3.5 py-1.5 rounded-bl-xl rounded-tr-2xl uppercase tracking-wider flex items-center gap-1 shadow-sm">
                    <Star size={10} className="fill-white" />
                    {plan.badge}
                  </div>
                )}

                <div className="space-y-6">
                  <div>
                    <h4 className="text-lg font-bold text-slate-900 dark:text-white">{plan.name}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-1 min-h-[32px] leading-relaxed">{plan.description}</p>
                  </div>

                  {/* Pricing Box */}
                  <div className="flex items-baseline gap-1 text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-5">
                    <span className="text-3xl sm:text-4xl font-black">
                      {plan.price.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 0 })}
                    </span>
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">/ {plan.period}</span>
                  </div>

                  {/* Features List */}
                  <div className="space-y-3">
                    <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wide block">Neler Dahil?</span>
                    <ul className="space-y-3">
                      {plan.features.map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm">
                          <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${isYearly ? 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'}`}>
                            <Check size={12} strokeWidth={3} />
                          </div>
                          <span className="font-semibold text-slate-600 dark:text-slate-300 leading-snug">{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="pt-8 mt-auto">
                  <button
                    onClick={() => onSelectPlan(plan.id)}
                    className={`w-full py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all active:scale-95 cursor-pointer text-center block ${
                      isYearly
                        ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/10'
                        : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-700 dark:text-slate-200 shadow-sm'
                    }`}
                  >
                    Satın Al & Başla
                  </button>
                </div>

              </motion.div>
            );
          })}
        </div>

        {/* Trust seal & Help text */}
        <div className="mt-16 text-center text-xs text-slate-400 dark:text-slate-500 flex items-center justify-center gap-1.5 flex-wrap font-semibold">
          <ShieldCheck size={14} className="text-indigo-500" />
          <span>Ödemeleriniz SSL şifreleme ve 3D Secure ile güvence altındadır.</span>
          <span className="hidden sm:inline">|</span>
          <HelpCircle size={14} className="text-indigo-500" />
          <span>Sorularınız mı var? Destek ekibimize yazın: <strong>infoisgpro@gmail.com</strong></span>
        </div>

      </div>
    </section>
  );
}
