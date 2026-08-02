/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface OSGB {
  name: string;
  logo: string | null;
  idNo: string;
  contact: string;
  staff: Array<{
    id: number;
    name: string;
    role: string;
    certificateNo: string;
  }>;
}

export interface User {
  username: string;
  password?: string;
  name: string;
  email: string;
  phone: string;
  role: 'uzman' | 'hekim' | 'other' | 'admin';
  certificateNo?: string;
  osgb?: OSGB;
  isPremium: boolean;
  licenseKey?: string | null;
  licensePurchasedAt?: string | null;
  licenseExpiresAt?: string | null;
  licenseType?: 'monthly' | 'yearly' | 'trial' | 'demo' | null;
  hasMultipleOsgbLicense?: boolean;
  isEmailVerified?: boolean;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

export interface Review {
  id: string;
  name: string;
  role: string;
  rating: number;
  comment: string;
  createdAt: string;
  isApproved?: boolean;
}

export interface RiskPreset {
  id: string;
  label: string;
  text: string;
}

export interface SiteConfig {
  videoUrl: string;
  kurulumVideoUrl?: string;
  heroTitle: string;
  heroSubtitle: string;
  contactEmail: string;
  contactPhone: string;
  contactAddress: string;
  kanunLink?: string;
  yonetmelikLink?: string;
}

export interface AppRelease {
  id: string;
  platform: 'pc' | 'apk';
  version: string;
  releaseNotes: string;
  fileSize: string;
  downloadUrl?: string;
  fileName: string;
  updatedAt: string;
  downloadsCount: number;
  hasFileData?: boolean;
  downloadType?: 'file' | 'link';
  isPublished?: boolean;
  showDownloadLinkBox?: boolean;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  sentAt: string;
  status: 'Okundu' | 'Beklemede' | 'Yanıtlandı';
}

export interface Plan {
  id: 'monthly' | 'yearly';
  name: string;
  price: number;
  period: string;
  description: string;
  features: string[];
  badge?: string;
}
