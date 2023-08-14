const Sentry = require("@sentry/node-experimental");
  
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  debug: true,
  tracesSampleRate: 1,
});
