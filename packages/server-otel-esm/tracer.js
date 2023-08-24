import Sentry from '@sentry/node-experimental';
import { ProfilingIntegration } from "@sentry/profiling-node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  debug: true,
  tracesSampleRate: 1,
  profilesSampleRate: 1,
  integrations: [
    new ProfilingIntegration(),
  ]
});