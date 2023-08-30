
import './tracer.js';

import Sentry from '@sentry/node-experimental';
import {runApp} from '@test-express-app/core';

runApp(Sentry, (app) => {
  app.use(Sentry.Handlers.errorHandler());
});
