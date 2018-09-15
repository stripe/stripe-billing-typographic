/**
 * Account.js
 * Stripe Billing demo. Created by Michael Glukhovsky (@mglukhovsky).
 *
 * This model stores the account of a user that can log into Typographic. Each
 * Account has a Customer.
 *
 * Required fields:
 *  - id: (automatically generated)
 *  - email: the email associated with the account
 *  - password: the password used to log into the account
 *
 * This model includes a few special properties for user authentication.
 *  - The password is hashed via bcrypt before being stored in the database.
 *  - The `password` field is never included when rendering this as JSON.
 *
 * The Account model has a few relations to other models:
 * - The Account has exactly one Customer (Customer.accountId)
 */
'use strict';

const bcrypt = require('bcryptjs');
const Model = require('./Model');
const Customer = require('./Customer');
const db = require('../database');

// The number of rounds to use when hashing a password with bcrypt
const NUM_ROUNDS = 12;

class Account extends Model {
  // Database table name for Account
  static get table() {
    return 'accounts';
  }

  // Create a new Account instance
  constructor(opts) {
    super(opts);
    this.id = opts.id;
    this.email = opts.email;
    this.password = opts.password;

    // Related objects
    this.customer = opts.customer;
  }

  // Get an Account by id from the database
  static async getById(id) {
    try {
      const [account] = await db(this.table).where('id', id);
      // Account not found: return null
      if (!account) {
        return null;
      }
      return new Account(account);
    } catch (e) {
      throw new Error(e);
    }
  }

  // Get an Account by id from the database
  static async getByEmail(email) {
    try {
      const [account] = await db(this.table).where('email', email);
      if (!account) {
        return null;
      }
      return new Account(account);
    } catch (e) {
      throw new Error(e);
    }
  }

  // Renders the Account as JSON. By default, this returns a shallow version.
  // This method accepts an options object:
  //  - `{expand: true}` recursively calls `toJSON` on child models (like Customer)
  //    from the database and includes it in the JSON output.
  async toJSON({expand = false} = {}) {
    // Note: we omit the password field from the JSON representation
    const json = {
      id: this.id,
      email: this.email,
    };
    // The Account object is related to a Customer: with `expand` we'll fetch that object as well
    if (expand) {
      try {
        // Include embedded JSON if we have a related Account
        const customer = await Customer.getByAccount(this.id);
        if (customer) {
          json.customer = await customer.toJSON({expand: true});
        }
      } catch (e) {
        throw new Error(e);
      }
    }

    return json;
  }

  // Create a new Account object in our database
  // This method requires:
  //  - email: the email for user to log in
  //  - password: the password for the new user
  static async create(email, password) {
    // Make sure we've included a password field
    if (!email || !password) {
      throw new Error('Missing a required parameter: email, password');
    }
    try {
      // Hash the password using bcrypt before saving it
      const hashed = await bcrypt.hash(password, NUM_ROUNDS);

      // DB: Insert the new Account, and get back the id of the created object
      const account = {
        email,
        password: hashed,
      };
      const [accountId] = await this.insert(account);
      account.id = accountId;

      // Create a Customer that belongs to this Account
      const customer = await Customer.create(accountId, email);
      account.customer = customer;

      // Return a new Account instance
      return new Account(account);
    } catch (e) {
      throw new Error(e);
    }
  }

  // Compare the given password to the stored hash using bcrypt
  async comparePassword(password) {
    const match = await bcrypt.compare(password, this.password);
    return match;
  }
}

module.exports = Account;
