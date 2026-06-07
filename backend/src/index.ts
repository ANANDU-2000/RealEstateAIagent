import http from 'http';
import dotenv from 'dotenv';

dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { pool, testDbConnection } from './db';
import { initSocketIO } from './realtime';

const app = express();
const httpServer = http.createServer(app);
const io = initSocketIO(httpServer);

app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
    credentials: true,
  })
);
app.use(express.json());

app.get('/health', async (_req, res) => {
  const dbOk = await testDbConnection();
  res.status(dbOk ? 200 : 503).json({
    ok: dbOk,
    service: 'propagent-api',
    time: new Date().toISOString(),
    db: dbOk ? 'connected' : 'disconnected',
  });
});

app.get('/', (_req, res) => {
  res.json({
    name: 'PropAgent API',
    version: '3.0.0',
    health: '/health',
  });
});

const PORT = Number(process.env.PORT ?? 3001);

async function start(): Promise<void> {
  if (process.env.RUN_MIGRATIONS === 'true') {
    const { runMigrations } = await import('./db/migrate');
    await runMigrations();
  }

  httpServer.listen(PORT, () => {
    console.log(`PropAgent API running on port ${PORT}`);
    void testDbConnection().then((ok) => {
      console.log(ok ? 'Database connected' : 'Database connection pending');
    });
  });
}

void start();

export { app, httpServer, io, pool };
