const Sentry = require("@sentry/node");
  
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  debug: true,
  tracesSampleRate: 1,
  debug: true,
});