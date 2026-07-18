import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';

dotenv.config();

const dbUrl = process.env.DATABASE_URL || '';
const schemaMatch = dbUrl.match(/[?&]schema=([^&]+)/);
const schema = schemaMatch ? schemaMatch[1] : 'public';

const pool = new Pool({
  connectionString: dbUrl,
  max: 20,
  min: 2,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

const adapter = new PrismaPg(pool, { schema });

const SLOW_QUERY_THRESHOLD_MS = 500;

const prisma = new PrismaClient({
  adapter,
  log: [
    { level: 'query', emit: 'event' },
    { level: 'error', emit: 'event' },
    { level: 'warn', emit: 'event' },
  ],
});

prisma.$on('query', (e) => {
  const ms = Math.round(e.duration);
  if (ms >= SLOW_QUERY_THRESHOLD_MS) {
    console.warn(
      `[SLOW QUERY] ${ms}ms — ${e.query.substring(0, 200)}`,
      e.params.length > 0 ? `| params: ${e.params}` : '',
    );
  }
});

prisma.$on('error', (e) => {
  console.error('[PRISMA ERROR]', e.message);
});

const connectDB = async () => {
  try {
    await prisma.$connect();
    console.log('Connected to the database successfully.');
  } catch (error) {
    console.error('Error connecting to the database:', error);
    process.exit(1);
  }
};

const disconnectDB = async () => {
  await prisma.$disconnect();
};

export { prisma, connectDB, disconnectDB };