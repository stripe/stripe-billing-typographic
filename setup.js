/**
 * setup.js
 * Stripe Billing demo. Created by Michael Glukhovsky (@mglukhovsky).
 *
 * This setup script creates the Plans and Products required for Typographic.
 */
'use strict';

const path = require('path');
const fs = require('fs');

// Make sure Node.js packages are installed
let exists;
try {
  exists = fs.accessSync(path.join(process.cwd(), 'node_modules'));
} catch (e) {
  console.log(
    '⚠️  Missing Node.js packages. Run `npm install` before running setup.'
  );
  process.exit(0);
}

// Make sure .env file exists
try {
  const exists = fs.accessSync(path.join(process.cwd(), '.env'));
} catch (e) {
  console.log(
    '⚠️  Missing `.env` file. Copy `.env.example` and include your Stripe credentials.'
  );
  process.exit(0);
}

const config = require('./config');
const stripe = require('stripe')(config.stripe.secretKey);
const Plan = require('./server/models/Plan');
const knex = require('./server/database');
const {exec} = require('child_process');

module.exports = {
  running: false,
  async checkTables() {
    for (let table of ['accounts', 'customers', 'subscriptions', 'plans']) {
      const hasTable = await knex.schema.hasTable(table);
      if (!hasTable) {
        return false;
      }
    }
    return true;
  },
  async run() {
    if (this.running) {
      console.log('⚠️  Setup already in progress.');
      return;
    }

    this.running = true;
    try {
      // Build our Vue frontend with Rollup
      await rollup();
      // Recreate our database tables
      await dropTables();
      await createTables();
      // Create the required plans on our Stripe account (and our database)
      await Plan.setupPlans();
      console.log('Typographic is ready: run `npm start` to start the server.');
    } catch (e) {
      console.log(e);
    }
    this.running = false;
    process.exit(0);
  },
};

// Runs when this file is called directly from the command line (i.e.
// it's the main module)
if (require.main === module) {
  module.exports.run();
}

// Use Rollup to bundle our frontend Vue components into a single JS file
async function rollup() {
  console.log('🌍  Building Vue frontend');
  await exec('./node_modules/rollup/bin/rollup -c');
}

// Drop all Typographic tables from the database
async function dropTables() {
  console.log('🔻  Dropping existing database tables');
  await Promise.all([
    knex.schema.dropTableIfExists('accounts'),
    knex.schema.dropTableIfExists('customers'),
    knex.schema.dropTableIfExists('subscriptions'),
    knex.schema.dropTableIfExists('plans'),
  ]);
}

// Create tables on our database
async function createTables() {
  console.log('✨  Creating database tables for Typographic');
  await Promise.all([
    knex.schema.createTable('accounts', t => {
      t.increments();
      t
        .string('email')
        .unique()
        .notNullable();
      t.integer('createdAt');
      t.string('password').notNullable();
    }),
    knex.schema.createTable('customers', t => {
      t.increments();
      t.string('stripeId');
      t.string('accountId');
      t.string('email');
      t.integer('createdAt');
      t.string('fonts');
      t.string('paymentMethodId');
      t.string('paymentMethodLast4');
      t.string('paymentMethodBrand');
    }),
    knex.schema.createTable('subscriptions', t => {
      t.increments();
      t.string('stripeId');
      t.string('customerId');
      t.integer('createdAt');
      t.string('status');
      t.string('plan');
      t.string('collectionMethod');
      t.integer('currentPeriodEnd');
      t.integer('currentPeriodStart');
      t.float('meteredUsage').unsigned();
      t.string('stripeMonthlySubId');
      t.string('stripeMeteredSubId');
    }),
    knex.schema.createTable('plans', t => {
      t.increments();
      t.string('stripeId');
      t.string('name');
      t.string('nickname');
      t.string('type');
      t.integer('amount');
      t.float('included');
    }),
  ]);
  console.log('✅  Database is ready');
}
