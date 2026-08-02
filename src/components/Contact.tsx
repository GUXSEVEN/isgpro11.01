/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Phone, MapPin, Send, Loader2, CheckCircle, ShieldCheck, HeartHandshake } from 'lucide-react';
import { SiteConfig } from '../types';

interface ContactProps {
  currentUserEmail?: string;
  onMailSent?: () => void;
  siteConfig: SiteConfig;
}

export default function Contact({ currentUserEmail, onMailSent, siteConfig }: ContactProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState(currentUserEmail || '');
  const [subject, setSubject] = useState('Lisans ve Satış İşlemleri');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) return;

    setLoading(true);
    setSuccess(false);

    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, subject, message }),
      });

      const data = await response.json();
      if (response.ok) {
        setSuccess(true);
        setName('');
        setMessage('');
        if (onMailSent) onMailSent();
      } else {
        alert(data.error || 'Mesaj gönderilemedi.');
      }
    } catch (err) {
      console.error(err);
      alert('Sunucuyla bağlantı kurulamadı.');
    } finally {
      setLoading(false);
    }
  };

  const supportReasons = [
    'Lisans ve Satış İşlemleri',
    'Yapay Zeka / API Entegrasyonu',
    'Teknik Hata / Hata Bildirimi',
    'OSGB Çoklu Lisans Talebi',
    'Öneri / İş Birliği'
  ];

  return (
    <section id="contact" className="py-16 md:py-24 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 relative transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <span className="inline-block px-3 py-1 bg-indigo-100 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 text-xs font-bold uppercase tracking-widest rounded-full">
            İletişim ve Destek
          </span>
          <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-none">
            Bizimle İletişime Geçin
          </h3>
          <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed font-semibold">
            Satış temsilcilerimizle konuşmak veya teknik destek ekibimizden yardım almak için mesajınızı bırakın. En geç 2 saat içinde dönüş yapıyoruz.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-stretch">
          
          {/* Left Column: Direct Info Cards (5 Columns) */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
            {/* Quick Cards */}
            <div className="space-y-4">
              <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-2xl p-5 shadow-sm flex gap-4 items-center">
                <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-lg flex items-center justify-center shrink-0">
                  <Mail size={18} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-950 dark:text-white text-xs sm:text-sm">E-Posta Adresimiz</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 font-semibold mt-0.5">{siteConfig.contactEmail}</p>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-2xl p-5 shadow-sm flex gap-4 items-center">
                <div className="w-10 h-10 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-lg flex items-center justify-center shrink-0">
                  <Phone size={18} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-950 dark:text-white text-xs sm:text-sm">Telefon & Çağrı Merkezi</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 font-semibold mt-0.5">{siteConfig.contactPhone}</p>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-2xl p-5 shadow-sm flex gap-4 items-center">
                <div className="w-10 h-10 bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 rounded-lg flex items-center justify-center shrink-0">
                  <MapPin size={18} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-950 dark:text-white text-xs sm:text-sm">Merkez Ofisimiz</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 font-semibold mt-0.5">{siteConfig.contactAddress}</p>
                </div>
              </div>
            </div>

            {/* Satisfaction Banner */}
            <div className="bg-indigo-50/50 dark:bg-indigo-950/10 border border-indigo-100 dark:border-indigo-900/30 rounded-2xl p-6 space-y-3">
              <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400 font-extrabold text-sm">
                <HeartHandshake size={18} />
                <span>%100 Memnuniyet Garantisi</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 font-semibold leading-relaxed">
                İSG Pro platformunu kullanırken her türlü ihtiyacınızda uzman ekibimizle hızlı ve kesintisiz teknik destek sunuyoruz. Süreçlerinizi basitleştirmek için buradayız.
              </p>
              <div className="flex items-center gap-1 text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                <ShieldCheck size={12} />
                <span>Müfettiş denetimleri onay garantilidir.</span>
              </div>
            </div>

          </div>

          {/* Right Column: Mail Form (7 Columns) */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-2xl p-6 sm:p-8 shadow-sm">
            
            <AnimatePresence mode="wait">
              {success ? (
                <motion.div
                  key="success-prompt"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="py-16 text-center space-y-4 flex flex-col justify-center items-center h-full"
                >
                  <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-950/35 text-emerald-500 border border-emerald-100 dark:border-emerald-900/30 rounded-full flex items-center justify-center mb-2">
                    <CheckCircle size={32} />
                  </div>
                  <div className="space-y-2 max-w-sm">
                    <h4 className="font-extrabold text-slate-800 dark:text-white text-base">E-Postanız Başarıyla Gönderildi!</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
                      E-posta ve destek talebiniz sunucumuza kaydedildi. İSG danışmanlarımız talebiniz doğrultusunda en kısa sürede dönüş sağlayacaktır. Teşekkür ederiz!
                    </p>
                  </div>
                  <button
                    onClick={() => setSuccess(false)}
                    className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer"
                  >
                    Yeni Mesaj Gönder
                  </button>
                </motion.div>
              ) : (
                <motion.form
                  key="contact-form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onSubmit={handleSubmit}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">Adınız Soyadınız *</label>
                      <input
                        type="text" required
                        value={name} onChange={e => setName(e.target.value)}
                        placeholder="Ahmet Yılmaz"
                        className="mt-1 w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-950 dark:text-white text-xs sm:text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-semibold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">E-Posta Adresiniz *</label>
                      <input
                        type="email" required
                        value={email} onChange={e => setEmail(e.target.value)}
                        placeholder="ahmet@isg.com"
                        className="mt-1 w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-semibold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">İletişim Nedeni</label>
                    <select
                      value={subject} onChange={e => setSubject(e.target.value)}
                      className="mt-1 w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-950 dark:text-white text-xs sm:text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-bold"
                    >
                      {supportReasons.map(r => (
                        <option key={r} value={r} className="text-slate-950 bg-white dark:bg-slate-900 dark:text-white">{r}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">Mesajınız *</label>
                    <textarea
                      required rows={5}
                      value={message} onChange={e => setMessage(e.target.value)}
                      placeholder="Lisans, teklif veya teknik konulardaki sorularınızı detaylıca yazın..."
                      className="mt-1 w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-950 dark:text-white text-xs sm:text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-semibold resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !name.trim() || !email.trim() || !message.trim()}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl text-xs sm:text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>Mesajınız İletiliyor...</span>
                      </>
                    ) : (
                      <>
                        <Send size={14} />
                        <span>E-Postayı Gönder</span>
                      </>
                    )}
                  </button>
                </motion.form>
              )}
            </AnimatePresence>

          </div>

        </div>

      </div>
    </section>
  );
}
