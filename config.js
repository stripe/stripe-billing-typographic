/**
 * config.js
 * Stripe Billing demo. Created by Michael Glukhovsky (@mglukhovsky).
 *
 * Typographic's configuration: secrets and other data are read from
 * environment variables, stored in a .env file.
 * 
 * By default, we use SQLite as the backend database for our application.
 * Any database supported by Knex can be used.
 */
'use strict';

// Load environment variables from Typographic's `.env` file:
// this file includes the Stripe API key and other secrets
// A sample configuration file is included: .env.example
const envFound = require('dotenv').config();
if (!envFound) {
  console.log(
    '⚠️  No .env file for Typographic found: this file contains' +
      'your Stripe API key and other secrets.\nTry copying .env.example to .env' +
      '(and make sure to include your own keys!)'
  );
  process.exit(0);
}

module.exports = {
  // Server port
  port: process.env.PORT || 3000,
  // Configuration for Stripe
  // API Keys: https://dashboard.stripe.com/account/apikeys
  // Storing these keys and secrets as environment variables is good practice.
  // You can duplicate the example `.env` file and fill in the details.
  stripe: {
    // Use your test API keys for development, and live keys for real charges
    // in production mode
    publicKey: process.env.STRIPE_PUBLISHABLE_KEY,
    secretKey: process.env.STRIPE_SECRET_KEY,
  },
  // Configuration for Knex using a sqlite3 database
  database: {
    client: 'sqlite3',
    connection: {
      filename: './typographic.sqlite',
    },
    // Use `null` for any default values in SQLite
    useNullAsDefault: true,
  },
};
