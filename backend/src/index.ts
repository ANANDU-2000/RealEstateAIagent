import http from 'http';
import dotenv from 'dotenv';

dotenv.config();

import express, { type Request, type Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { pool, testDbConnection } from './db';
import { initSocketIO } from './realtime';
import { setIo } from './realtime/io-holder';
import authRouter from './routes/auth';
import settingsRouter from './routes/settings';
import superadminRouter from './routes/superadmin';
import propertiesRouter from './routes/properties';
import conversationsRouter from './routes/conversations';
import meetingsRouter from './routes/meetings';
import callbacksRouter from './routes/callbacks';
import analyticsRouter from './routes/analytics';
import webhookRouter from './routes/webhook';
import { resolveCorsOrigin } from './utils/corsOrigins';

const app = express();
const httpServer = http.createServer(app);
const io = initSocketIO(httpServer);
setIo(io);

app.use(helmet());
app.use(
  cors({
    origin: resolveCorsOrigin,
    credentials: true,
  })
);
app.use(
  '/webhook',
  express.json({
    verify: (req, _res, buf) => {
      (req as express.Request & { rawBody?: Buffer }).rawBody = buf;
    },
  })
);
app.use('/webhook', webhookRouter);

app.use(express.json());

app.use('/auth', authRouter);
app.use('/settings', settingsRouter);
app.use('/superadmin', superadminRouter);
app.use('/properties', propertiesRouter);
app.use('/conversations', conversationsRouter);
app.use('/meetings', meetingsRouter);
app.use('/callbacks', callbacksRouter);
app.use('/analytics', analyticsRouter);

app.get('/health', async (_req: Request, res: Response) => {
  const dbOk = await testDbConnection();
  res.status(dbOk ? 200 : 503).json({
    ok: dbOk,
    service: 'propagent-api',
    time: new Date().toISOString(),
    db: dbOk ? 'connected' : 'disconnected',
  });
});

app.get('/', (_req: Request, res: Response) => {
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
