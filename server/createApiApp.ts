import express from 'express';
import { mountApiRoutes } from './apiRoutes';

export function createApiApp() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));
  mountApiRoutes(app);
  return app;
}
