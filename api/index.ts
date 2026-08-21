import { app } from '../server.ts';

export default function handler(req: any, res: any) {
  const handlerFn = (app as any)?.default || app;
  return handlerFn(req, res);
}
