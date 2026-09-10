/**
 * Ortak Sistem Konfigürasyonu Arayüzü & Yükleyicisi
 */

export interface PayTRConfig {
  merchantId: string;
  merchantKey: string;
  merchantSalt: string;
  testMode: string;
  callbackUrl: string;
  successUrl: string;
  failUrl: string;
  prices: {
    monthly: { amount: string; label: string; currency: string };
    yearly: { amount: string; label: string; currency: string };
  };
}

export interface SMTPConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  fromName: string;
  fromEmail: string;
}

export interface OSGBRecord {
  id: string;
  name: string;
  idNo: string;
  contact: string;
  email: string;
  hasMultipleOsgbLicense?: boolean;
  staff: Array<{
    id: number;
    name: string;
    role: string;
    certificateNo: string;
  }>;
}

export interface SystemConfig {
  paytrConfig: PayTRConfig;
  smtpConfig: SMTPConfig;
  licensePolicies: {
    trialDays: number;
    monthlyDays: number;
    yearlyDays: number;
    demoMinutes: number;
    enforceSingleTrialPerEmail: boolean;
  };
  osgbList: OSGBRecord[];
  updatedAt: string;
}

export const defaultSystemConfig: SystemConfig = {
  "paytrConfig": {
    "merchantId": "647209",
    "merchantKey": "E1vY8eD5qB7sZ9xL",
    "merchantSalt": "S3kR4tP9wQ2vM8nB",
    "testMode": "1",
    "callbackUrl": "https://isgpro.com.tr/api/paytr/callback",
    "successUrl": "https://isgpro.com.tr/api/paytr/success",
    "failUrl": "https://isgpro.com.tr/api/paytr/fail",
    "prices": {
      "monthly": {
        "amount": "299.00",
        "label": "Aylık Pro Plan",
        "currency": "TRY"
      },
      "yearly": {
        "amount": "2990.00",
        "label": "Yıllık Pro Plan",
        "currency": "TRY"
      }
    }
  },
  "smtpConfig": {
    "host": "smtp.gmail.com",
    "port": 465,
    "secure": true,
    "user": "infoisgpro@gmail.com",
    "pass": "wkmv ykld tfzq rrrz",
    "fromName": "İSG Pro Lisans & Bildirim Sistemi",
    "fromEmail": "infoisgpro@gmail.com"
  },
  "licensePolicies": {
    "trialDays": 7,
    "monthlyDays": 30,
    "yearlyDays": 365,
    "demoMinutes": 10,
    "enforceSingleTrialPerEmail": true
  },
  "osgbList": [
    {
      "id": "osgb-1",
      "name": "Merkez Akademi OSGB",
      "idNo": "TR-OSGB-3401",
      "contact": "0212 555 0101",
      "email": "info@merkezosgb.com",
      "hasMultipleOsgbLicense": true,
      "staff": [
        {
          "id": 1,
          "name": "İbrahim Coşkun",
          "role": "uzman",
          "certificateNo": "ISG-A-98765"
        },
        {
          "id": 2,
          "name": "Dr. Selim Yılmaz",
          "role": "hekim",
          "certificateNo": "HEK-54321"
        }
      ]
    }
  ],
  "updatedAt": "2026-09-09T13:40:21.112Z"
};
