/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Play, ShieldAlert, ArrowRight, ClipboardList, ShieldCheck, Flame, Zap, Loader2 } from 'lucide-react';

interface PlaygroundProps {
  presets: Array<{ label: string; text: string }>;
}

export default function Playground({ presets }: PlaygroundProps) {
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);

  const handlePresetSelect = (text: string) => {
    setDescription(text);
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/generate-risk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ description }),
      });

      const data = await response.json();
      if (response.ok) {
        setResult(data);
      } else {
        alert(data.error || 'Analiz sırasında bir hata oluştu.');
      }
    } catch (err) {
      console.error(err);
      alert('Sunucuyla bağlantı kurulamadı.');
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (score: number) => {
    if (score >= 15) return { bg: 'bg-red-500', text: 'YÜKSEK', colorClass: 'text-red-600 dark:text-red-400', border: 'border-red-100 dark:border-red-900/50', cardBg: 'bg-red-50/45 dark:bg-red-950/20' };
    if (score >= 8) return { bg: 'bg-yellow-500', text: 'ORTA', colorClass: 'text-yellow-600 dark:text-yellow-400', border: 'border-yellow-100 dark:border-yellow-900/50', cardBg: 'bg-yellow-50/45 dark:bg-yellow-950/20' };
    return { bg: 'bg-green-500', text: 'DÜŞÜK', colorClass: 'text-green-600 dark:text-green-400', border: 'border-green-100 dark:border-green-900/50', cardBg: 'bg-green-50/45 dark:bg-green-950/20' };
  };

  const riskScore = result ? (result.L * result.S) : 0;
  const riskMeta = getRiskColor(riskScore);

  return (
    <section id="playground" className="py-16 md:py-24 bg-slate-50/50 dark:bg-slate-900/20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 font-sans">Canlı Deneme Alanı</h2>
          <h3 className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight">Yapay Zeka Analizini Şimdi Deneyin</h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">Saha şeflerinin ve İSG uzmanlarının işini saniyelere indiren yapay zeka modülümüzü doğrudan bu sayfada test edin. Bir iş tanımı yazın veya hazır taslaklardan birini seçin.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Panel: Form */}
          <div className="lg:col-span-6 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div className="space-y-2">
              <span className="inline-block px-2.5 py-0.5 bg-indigo-100 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold uppercase tracking-widest rounded-full">
                İSG ANALİZ EDİCİ
              </span>
              <h4 className="text-lg font-bold text-slate-900 dark:text-white">Çalışma Senaryosu Girin</h4>
            </div>

            {/* Presets */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide block">Örnek Hazır Şablonlar:</span>
              <div className="flex flex-col gap-2">
                {presets.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handlePresetSelect(preset.text)}
                    className="text-left p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-800 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 text-xs font-medium text-slate-600 dark:text-slate-300 transition-all active:scale-98 cursor-pointer"
                  >
                    💡 {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Input Form */}
            <form onSubmit={handleGenerate} className="space-y-4">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                required
                className="w-full p-4 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-950 dark:text-white text-xs sm:text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none placeholder-slate-400 dark:placeholder-slate-500 font-semibold"
                placeholder="Örn: Fabrika çatısındaki olukların tamiri için iskele kurulacak..."
              />

              <button
                type="submit"
                disabled={loading || !description.trim()}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl text-xs sm:text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Analiz Hazırlanıyor...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    <span>Yapay Zeka Analizini Başlat</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Right Panel: Interactive Result Card */}
          <div className="lg:col-span-6 h-full flex flex-col justify-center">
            <AnimatePresence mode="wait">
              {result ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-slate-900 rounded-2xl border border-slate-850 shadow-2xl p-6 flex flex-col gap-5 relative overflow-hidden"
                >
                  {/* Console Header */}
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                      <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                    </div>
                    <div className="text-xs font-mono text-slate-400">isg_ai_analyzer_v2.0</div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold bg-slate-800 text-indigo-400 border border-slate-700 px-2.5 py-1 rounded-lg uppercase tracking-wide">
                        {result.category || 'Genel'}
                      </span>
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                        riskScore >= 15 ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 
                        riskScore >= 8 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 
                        'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}>
                        RİSK DERECESİ: {riskMeta.text}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Flame size={14} className="text-red-400 shrink-0" />
                        Tehlike Kaynağı
                      </h4>
                      <p className="text-xs sm:text-sm font-semibold text-white leading-snug pl-3 border-l-2 border-red-500 bg-slate-800/30 p-2.5 rounded-r-lg">
                        {result.hazard}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <ShieldAlert size={14} className="text-amber-400 shrink-0" />
                        Olası Risk & Sonuç
                      </h4>
                      <p className="text-xs sm:text-sm font-semibold text-slate-300 leading-snug pl-3 border-l-2 border-amber-400 bg-slate-800/30 p-2.5 rounded-r-lg">
                        {result.risk}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <ShieldCheck size={14} className="text-emerald-400 shrink-0" />
                        Yasal Alınacak Önlemler
                      </h4>
                      <p className="text-xs text-slate-300 leading-relaxed bg-slate-800/50 p-3 rounded-lg border border-slate-700 font-medium">
                        {result.precaution}
                      </p>
                    </div>

                    {/* Scores Footer */}
                    <div className="border-t border-slate-800 pt-3 flex justify-between items-center bg-slate-800/20 p-2 rounded-xl">
                      <div className="flex gap-4 text-[10px] font-bold text-slate-400 font-mono">
                        <span>L: {result.L}</span>
                        <span>S: {result.S}</span>
                      </div>
                      <span className={`text-xs font-extrabold px-3 py-1 rounded-lg ${
                        riskScore >= 15 ? 'text-red-400 bg-red-500/10 border border-red-500/20' : 
                        riskScore >= 8 ? 'text-amber-400 bg-amber-500/10 border border-amber-500/20' : 
                        'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
                      }`}>
                        Risk Skoru: {riskScore}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl p-6 flex flex-col gap-6 h-[480px] justify-between">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                      <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                    </div>
                    <div className="text-xs font-mono text-slate-400">isg_ai_analyzer_v2.0</div>
                  </div>
                  
                  <div className="flex-1 flex flex-col justify-center items-center text-center space-y-4">
                    <div className="w-12 h-12 bg-slate-800 text-indigo-400 rounded-xl flex items-center justify-center border border-slate-700">
                      <Sparkles size={22} className="animate-pulse" />
                    </div>
                    <div className="space-y-1.5 max-w-xs">
                      <h4 className="font-bold text-white text-sm">Yapay Zeka Analizini Başlatın</h4>
                      <p className="text-xs text-slate-400 font-semibold leading-relaxed">
                        Sol taraftan bir iş senaryosu seçin veya kendiniz yazın, yapay zekanın nasıl anında analiz çıkardığını görün.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-500 font-mono font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Yapay Zeka Hizmeti Aktif
                  </div>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>

      </div>
    </section>
  );
}
