import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import {
  serializerCompiler,
  validatorCompiler,
  jsonSchemaTransform,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod';
import { z } from 'zod';

// Create Fastify instance
const fastify = Fastify({
  logger: {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss',
        ignore: 'pid,hostname',
      },
    },
  },
  trustProxy: true,
}).withTypeProvider<ZodTypeProvider>();

// Set validators
fastify.setValidatorCompiler(validatorCompiler);
fastify.setSerializerCompiler(serializerCompiler);

// Register plugins
async function registerPlugins() {
  // Security headers
  await fastify.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        scriptSrc: ["'self'"],
      },
    },
  });

  // CORS
  await fastify.register(cors, {
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
    credentials: true,
  });

  // Rate limiting
  await fastify.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
    cache: 10000,
    allowList: ['127.0.0.1'],
  });

  // API Documentation
  await fastify.register(swagger, {
    openapi: {
      openapi: '3.0.0',
      info: {
        title: 'SOTA Suite API',
        description: 'State-of-the-Art Full-Stack Suite API',
        version: '1.0.0',
      },
      servers: [
        { url: 'http://localhost:4000', description: 'Development' },
        { url: 'https://api.sota-suite.dev', description: 'Production' },
      ],
    },
    transform: jsonSchemaTransform,
  });

  await fastify.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true,
    },
    staticCSP: true,
  });
}

// Health check endpoint
fastify.get('/health', {
  schema: {
    response: {
      200: z.object({
        status: z.literal('ok'),
        timestamp: z.string(),
        version: z.string(),
      }),
    },
  },
}, async () => ({
  status: 'ok' as const,
  timestamp: new Date().toISOString(),
  version: '1.0.0',
}));

// Performance metrics endpoint
fastify.get('/api/performance', {
  schema: {
    response: {
      200: z.object({
        metrics: z.object({
          requests: z.number(),
          avgResponseTime: z.number(),
          errorRate: z.number(),
        }),
        vitals: z.object({
          lcp: z.number().nullable(),
          fid: z.number().nullable(),
          cls: z.number().nullable(),
          fcp: z.number().nullable(),
          ttfb: z.number().nullable(),
        }),
      }),
    },
  },
}, async () => ({
  metrics: {
    requests: 15420,
    avgResponseTime: 45,
    errorRate: 0.002,
  },
  vitals: {
    lcp: 1800,
    fid: 12,
    cls: 0.05,
    fcp: 1400,
    ttfb: 200,
  },
}));

// Analytics endpoint
fastify.post('/api/analytics/performance', {
  schema: {
    body: z.object({
      name: z.string(),
      value: z.number(),
      rating: z.enum(['good', 'needs-improvement', 'poor']),
    }),
    response: {
      200: z.object({
        success: z.boolean(),
        message: z.string(),
      }),
    },
  },
}, async (request) => {
  const { name, value, rating } = request.body;

  // Log the metric (in production, send to analytics service)
  request.log.info({ metric: { name, value, rating } }, 'Performance metric received');

  return {
    success: true,
    message: `Metric ${name} recorded: ${value}ms (${rating})`,
  };
});

// Users endpoints
fastify.get('/api/users/me', {
  schema: {
    response: {
      200: z.object({
        id: z.string(),
        email: z.string().email(),
        name: z.string(),
        plan: z.enum(['free', 'pro', 'enterprise']),
        createdAt: z.string(),
      }),
    },
  },
}, async () => ({
  id: 'user_123',
  email: 'demo@sota-suite.dev',
  name: 'Demo User',
  plan: 'pro' as const,
  createdAt: '2024-01-01T00:00:00Z',
}));

// Projects endpoints
fastify.get('/api/projects', {
  schema: {
    response: {
      200: z.array(z.object({
        id: z.string(),
        name: z.string(),
        status: z.enum(['active', 'paused', 'archived']),
        performance: z.object({
          lcp: z.number(),
          cls: z.number(),
          fid: z.number(),
        }),
        createdAt: z.string(),
      })),
    },
  },
}, async () => [
  {
    id: 'proj_001',
    name: 'Marketing Landing Page',
    status: 'active' as const,
    performance: { lcp: 1800, cls: 0.05, fid: 12 },
    createdAt: '2024-01-15T00:00:00Z',
  },
  {
    id: 'proj_002',
    name: 'E-commerce Store',
    status: 'active' as const,
    performance: { lcp: 2100, cls: 0.08, fid: 18 },
    createdAt: '2024-02-01T00:00:00Z',
  },
]);

// Start server
async function start() {
  try {
    await registerPlugins();

    const port = parseInt(process.env.PORT || '4000', 10);
    const host = process.env.HOST || '0.0.0.0';

    await fastify.listen({ port, host });

    console.log(`
  🚀 SOTA Suite API Gateway running
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  🌐 Server:  http://localhost:${port}
  📚 Docs:    http://localhost:${port}/docs
  💚 Health:  http://localhost:${port}/health
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  await fastify.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  await fastify.close();
  process.exit(0);
});

start();
