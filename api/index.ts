import * as serverModule from '../dist/server.cjs';

function resolveApp(mod: any) {
  if (typeof mod === 'function') return mod;
  if (typeof mod?.app === 'function') return mod.app;
  if (typeof mod?.default === 'function') return mod.default;
  if (typeof mod?.default?.app === 'function') return mod.default.app;
  if (typeof mod?.default?.default === 'function') return mod.default.default;
  return mod;
}

const app = resolveApp(serverModule);

export default function handler(req: any, res: any) {
  try {
    if (typeof app === 'function') {
      return app(req, res);
    }
    return res.status(500).json({ error: 'Express uygulaması başlatılamadı.' });
  } catch (err: any) {
    console.error('[Vercel Serverless Invocation Error]:', err);
    return res.status(500).json({
      error: 'Vercel API çağrısı sırasında hata oluştu.',
      details: err?.message || String(err)
    });
  }
}
