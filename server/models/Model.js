/**
 * Model.js
 * Stripe Billing demo. Created by Michael Glukhovsky (@mglukhovsky).
 *
 * This is the parent class for all models, e.g. Plan, Account, Customer, and
 * Subscription.
 */
'use strict';

const dbType = require('../../config').database.client
const db = require('../database')

class Model {
  constructor(opts) {
    if (!opts) {
      throw new Error('The model requires an options object.')
    }
  }

  static async insert(object) {
    // Knex with sqlite returns an array of inserted ids and prints warnings if
    // returning() is used.  With Postgres, returning() is necessary to get the
    // inserted ids instead of a Result object.
    if (dbType == 'sqlite3') {
      return db(this.table).insert(object);
    } else {
      return db(this.table).returning('id').insert(object);
    }
  }

  async query(query) {
    return this.knex(query);
  }

  getJSON() {
    return this.toJSON();
  }
}

module.exports = Model;
