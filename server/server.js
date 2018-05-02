/**
 * server.js
 * Stripe Billing demo. Created by Michael Glukhovsky (@mglukhovsky).
 *
 * This creates and starts an Express server (and is the main entry point for
 * Typographic).
 */
'use strict';

const config = require('../config.js');
const setup = require('../setup');
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const historyApiFallback = require('connect-history-api-fallback');
const errors = require('./middleware/errors');
const redirectHttps = require('./middleware/redirectHttps');
const authRoutes = require('./routes/auth');
const stripeRoutes = require('./routes/stripe');

// Use Express as our web server
const app = express();

// In production, we'll redirect requests from HTTP to HTTPS
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', true);
  app.use(redirectHttps);
}

app
  // Parse JSON
  .use(bodyParser.json())
  // Enable routes
  .use('/auth', authRoutes)
  .use('/api', stripeRoutes)
  // Serve static files
  .use(express.static(path.join(__dirname, '../client')))
  // Enable history API
  .use(historyApiFallback())
  // Error middleware
  .use(errors);

// Starts the Typographic server
async function startServer() {
  // Check if our database is setup with the right tables
  try {
    const ready = await setup.checkTables();
    if (!ready) {
      console.log(
        '⚠️  No database tables found. Run `npm run setup` before starting ' +
          'the server.\n'
      );
      process.exit(0);
    }
  } catch (e) {
    console.log(e);
  }

  // Start the Express server
  app.listen(config.port, err => {
    if (err) {
      console.log(err);
      return;
    }
    console.log(
      `⚡️  Typographic server started: http://localhost:${config.port}`
    );
  });
}

// Run the async function to start our server
startServer();
