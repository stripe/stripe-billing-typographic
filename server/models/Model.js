/**
 * Model.js
 * Stripe Billing demo. Created by Michael Glukhovsky (@mglukhovsky).
 *
 * This is the parent class for all models, e.g. Plan, Account, Customer, and
 * Subscription.
 */
'use strict';

class Model {
  constructor(opts) {
    if (!opts) {
      throw new Error('The model requires an options object.')
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
