import { createRequire } from 'module';

const require = createRequire(import.meta.url);
let appInstance: any = null;

function getApp() {
  if (!appInstance) {
    try {
      const mod = require('../dist/server.cjs');
      appInstance = mod.app || mod.default || mod;
    } catch (err) {
      console.error('[Vercel Serverless Loader Error]:', err);
      throw err;
    }
  }
  return appInstance;
}

export default function handler(req: any, res: any) {
  try {
    const app = getApp();
    return app(req, res);
  } catch (error: any) {
    console.error('[Vercel Serverless Execution Error]:', error);
    res.status(500).json({
      error: 'Vercel sunucu fonksiyonu başlatılamadı.',
      details: error?.message || String(error)
    });
  }
}
