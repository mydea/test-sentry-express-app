

require("./tracer");

const Sentry = require('@sentry/node');
const {runApp } = require('@test-express-app/core');

runApp(Sentry, (app) => {
  app.use(Sentry.Handlers.requestHandler());
  app.use(Sentry.Handlers.errorHandler());
  app.use(Sentry.Handlers.tracingHandler());
});
