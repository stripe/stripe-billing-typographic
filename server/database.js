/**
 * database.js
 * Stripe Billing demo. Created by Michael Glukhovsky (@mglukhovsky).
 *
 * Exports a database connection using Knex and a matching configuration.
 */
'use strict';

const config = require('../config');

// Default knex parameters for a local development database defined in our config
let db = config.database;
// If we have a Google Cloud SQL instance defined, set up a database connection to it
if (process.env.INSTANCE_CONNECTION_NAME) {
  db = {
    client: 'mysql',
    connection: {
      user: process.env.SQL_USER,
      password: process.env.SQL_PASSWORD,
      database: process.env.SQL_DATABASE,
    },
  };
  // In production mode, deploy to Google Cloud SQL
  if (process.env.NODE_ENV === 'production') {
    db.connection.socketPath = `/cloudsql/${
      process.env.INSTANCE_CONNECTION_NAME
    }`;
  }
}

module.exports = require('knex')(db);
