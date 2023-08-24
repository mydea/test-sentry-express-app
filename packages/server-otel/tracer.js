const Sentry = require("@sentry/node-experimental");
const { ProfilingIntegration } = require("@sentry/profiling-node");

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  debug: true,
  tracesSampleRate: 1,
  profilesSampleRate: 1,
  integrations: [
    new ProfilingIntegration(),
  ]
});