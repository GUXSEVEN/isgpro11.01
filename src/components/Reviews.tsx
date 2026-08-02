/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, MessageSquare, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { Review, User } from '../types';

interface ReviewsProps {
  reviews: Review[];
  currentUser: User | null;
  onAddReview: (review: Review) => void;
  onOpenAuthModal: () => void;
}

export default function Reviews({
  reviews,
  currentUser,
  onAddReview,
  onOpenAuthModal
}: ReviewsProps) {
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [success, setSuccess] = useState(false);

  // Filter approved reviews for public display
  const approvedReviews = reviews.filter(r => r.isApproved !== false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!comment.trim()) return;

    const newReview: Review = {
      id: `rev-${Date.now()}`,
      name: currentUser.name,
      role: currentUser.role === 'uzman' ? 'İSG Uzmanı' : currentUser.role === 'hekim' ? 'İşyeri Hekimi' : 'Müşteri',
      rating,
      comment: comment.trim(),
      createdAt: new Date().toISOString(),
      isApproved: currentUser.role === 'admin' ? true : false // Admin reviews are pre-approved, others go to moderation
    };

    onAddReview(newReview);
    setComment('');
    setRating(5);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 5000);
  };

  return (
    <section id="reviews" className="py-16 md:py-24 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <span className="inline-block px-3 py-1 bg-indigo-100 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 text-xs font-bold uppercase tracking-widest rounded-full">
            Kullanıcı Deneyimleri
          </span>
          <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Müşteri Yorumları & Değerlendirmeler
          </h3>
          <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed font-semibold">
            Platformumuzu kullanan İSG uzmanları, işyeri hekimleri og OSGB yöneticilerinin gerçek deneyimleri ve verdikleri puanlar.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Left Column: Reviews Grid (8 Columns) */}
          <div className="lg:col-span-8 space-y-6">
            {approvedReviews.length === 0 ? (
              <div className="py-16 px-6 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-950 font-semibold space-y-3">
                <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center mx-auto mb-2">
                  <MessageSquare size={20} />
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Henüz Değerlendirme Bulunmuyor</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                  Platformumuzda henüz yayınlanmış bir müşteri yorumu bulunmamaktadır. Sağ taraftaki paneli kullanarak ilk değerlendirmeyi siz gönderebilirsiniz!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {approvedReviews.map((rev) => (
                  <motion.div
                    key={rev.id}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-2xl p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-200"
                  >
                    <div className="space-y-3">
                      {/* Rating Stars */}
                      <div className="flex items-center gap-0.5 text-amber-500">
                        {Array.from({ length: 5 }).map((_, idx) => (
                          <Star 
                            key={idx} 
                            size={14} 
                            fill={idx < rev.rating ? 'currentColor' : 'none'} 
                            className={idx < rev.rating ? 'text-amber-500' : 'text-slate-200 dark:text-slate-800'}
                          />
                        ))}
                      </div>

                      {/* Comment */}
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-semibold italic leading-relaxed">
                        "{rev.comment}"
                      </p>
                    </div>

                    {/* Reviewer Details */}
                    <div className="flex items-center gap-3 border-t border-slate-100 dark:border-slate-850 pt-3.5 mt-4">
                      <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/30 flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                        {rev.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">{rev.name}</h4>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">{rev.role}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Feedback Form (4 Columns) */}
          <div className="lg:col-span-4 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-2xl p-6 shadow-sm sticky top-24">
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-850 pb-3 mb-1">
                <div className="w-8 h-8 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-lg flex items-center justify-center">
                  <MessageSquare size={16} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">Feedback Gönderin</h4>
                  <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Görüşleriniz Bizim İçin Değerli</p>
                </div>
              </div>

              {success && (
                <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/30 text-green-700 dark:text-green-300 p-3 rounded-lg text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-green-600 dark:text-green-400 shrink-0" />
                  <span>
                    {currentUser?.role === 'admin' 
                      ? 'Geri bildiriminiz anında yayınlandı!' 
                      : 'Değerlendirmeniz yönetici onayına sunulmuştur.'}
                  </span>
                </div>
              )}

              {currentUser ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Interactive Star Picker */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider block">Puanınız</label>
                    <div className="flex items-center gap-1.5">
                      {Array.from({ length: 5 }).map((_, idx) => {
                        const starVal = idx + 1;
                        const isFilled = hoverRating !== null ? starVal <= hoverRating : starVal <= rating;
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setRating(starVal)}
                            onMouseEnter={() => setHoverRating(starVal)}
                            onMouseLeave={() => setHoverRating(null)}
                            className="text-amber-400 hover:scale-110 active:scale-95 transition-all cursor-pointer"
                          >
                            <Star 
                              size={22} 
                              fill={isFilled ? 'currentColor' : 'none'} 
                              className={isFilled ? 'text-amber-500' : 'text-slate-300 dark:text-slate-700'}
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Comment input */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">Yorumunuz *</label>
                    <textarea
                      required rows={4}
                      value={comment} onChange={e => setComment(e.target.value)}
                      placeholder="Platform hakkındaki olumlu veya olumsuz deneyimlerinizi paylaşın..."
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-950 dark:text-white text-xs sm:text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-semibold resize-none placeholder-slate-400 dark:placeholder-slate-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={!comment.trim()}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95"
                  >
                    <Send size={12} />
                    <span>Değerlendirmeyi Gönder</span>
                  </button>
                </form>
              ) : (
                <div className="py-6 text-center space-y-4">
                  <div className="w-10 h-10 bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 rounded-full flex items-center justify-center mx-auto border border-amber-100 dark:border-amber-900/30">
                    <AlertCircle size={20} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-800 dark:text-white">Yorum Yazmak İçin Giriş Yapın</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold leading-relaxed">
                      Sadece sisteme kayıtlı olan kullanıcılar puanlama yapabilir ve görüş bildirebilir.
                    </p>
                  </div>
                  <button
                    onClick={onOpenAuthModal}
                    className="w-full bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-900/40 font-bold py-2.5 rounded-xl text-xs transition-all cursor-pointer"
                  >
                    Giriş Yap veya Üye Ol
                  </button>
                </div>
              )}
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
