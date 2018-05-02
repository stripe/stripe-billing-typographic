/**
 * Customer.js
 * Stripe Billing demo. Created by Michael Glukhovsky (@mglukhovsky).
 *
 * This model creates and manages a Stripe Subscription. Each Customer belongs
 * to an Account. Each Customer has a Subscription.
 *
 * Fields:
 *  - id: (automatically generated)
 *  - email: the email associated with the account
 *  - fonts: a comma-separated string of fonts used for this account
 *  - stripeId: the id of the Stripe Customer object
 *  - sourceId: the id of the customer's payment source,
 *    based on a Stripe Source object
 *  - sourceLast4: the last four digits of a payment source
 *  - sourceBrand: the brand of the payment source, e.g. 'visa',
 *    'mastercard', or 'amex'
 *
 * The Customer model has a few relations to other models:
 *  - The Customer belongs to exactly one Account (Customer.accountId)
 *  - The Customer has exactly one Subscription (Subscription.customerId)
 */
'use strict';

const config = require('../../config');
const Model = require('./Model');
const Subscription = require('./Subscription');
const stripe = require('stripe')(config.stripe.secretKey);
const db = require('../database');

class Customer extends Model {
  static get table() {
    return 'customers';
  }

  constructor(opts) {
    super(opts);
    this.id = opts.id;
    this.stripeId = opts.stripeId;
    this.accountId = opts.accountId;
    this.email = opts.email;
    this.fonts = opts.fonts;
    this.sourceId = opts.sourceId;
    this.sourceLast4 = opts.sourceLast4;
    this.sourceBrand = opts.sourceBrand;
  }

  // Get a Customer by id from the database
  static async getById(id) {
    try {
      const [customer] = await db(this.table).where('id', id);
      // Customer not found: return null
      if (!customer) {
        return null;
      }
      return new Customer(customer);
    } catch (e) {
      throw new Error(e);
    }
  }

  // Get a Customer belonging to an Account from the database
  static async getByAccount(accountId) {
    try {
      const [customer] = await db(this.table).where('id', accountId);
      // Customer not found: return null
      if (!customer) {
        return null;
      }
      return new Customer(customer);
    } catch (e) {
      throw new Error(e);
    }
  }

  async getSubscription() {
    try {
      const [subscription] = await db(Subscription.table).where(
        'customerId',
        this.id
      );
      // Subscription not found: return null
      if (!subscription) {
        return null;
      }
      return new Subscription(subscription);
    } catch (e) {
      throw new Error(e);
    }
  }

  // Renders the Customer as JSON. By default, this returns a shallow version.
  // This method accepts an options object:
  //  - `{expand: true}` recursively calls `toJSON` on child models (like
  //    Subscription) from the database and includes it in the JSON output.
  async toJSON({expand = false} = {}) {
    const json = {
      id: this.id,
      stripeId: this.stripeId,
      accountId: this.accountId,
      email: this.email,
      fonts: this.fonts,
    };
    // If this Customer has a Source, include its properties in the JSON output
    if (this.sourceId) {
      json.source = {
        id: this.sourceId,
        last4: this.sourceLast4,
        brand: this.sourceBrand,
      };
    }

    // The Customer object is related to a Subscription: with `expand` we'll
    // fetch that object as well
    if (expand) {
      try {
        // Include embedded JSON if we have a related Subscription
        const subscription = await Subscription.getByCustomer(this.id);
        if (subscription) {
          json.subscription = await subscription.toJSON();
        }
      } catch (e) {
        throw new Error(e);
      }
    }
    return json;
  }

  // Create a new Customer object in our database
  // This method requires:
  //  - email: email of the customer
  //  - accountId: the Account this Customer belongs to
  static async create(accountId, email) {
    try {
      if (!accountId || !email) {
        throw new Error('Missing a required parameter: accountId, email');
      }
      // Stripe API: create a customer based on an email address
      const stripeCustomer = await stripe.customers.create({email});

      // DB call: create a new customer into our database
      const customer = {
        stripeId: stripeCustomer.id,
        accountId,
        email,
      };
      const [customerId] = await db(this.table).insert(customer);
      customer.id = customerId;

      return new Customer(customer);
    } catch (e) {
      throw new Error(`Could not create Stripe customer: ${e}`);
    }
  }

  // Update the fonts used by this customer
  async updateFonts(fonts) {
    try {
      const updated = await db(this.constructor.table)
        .where('id', this.id)
        .update({fonts});
      this.fonts = fonts;
      return this;
    } catch (e) {
      throw new Error(e);
    }
  }

  // Update the payment source for the customer (and make it the default)
  async updateSource(source) {
    try {
      // Stripe API: Attach the new source, update the default source
      const createdSource = await stripe.customers.createSource(this.stripeId, {
        source: source.id,
      });
      const updatedCustomer = await stripe.customers.update(this.stripeId, {
        default_source: createdSource.id,
      });

      // DB: Update the payment source ID
      const updated = await db(this.constructor.table)
        .where('id', this.id)
        .update({
          sourceId: createdSource.id,
          sourceLast4: createdSource.last4,
          sourceBrand: createdSource.brand,
        });

      // Update our subscription to charge automatically: we've got a source
      const subscription = await this.getSubscription();
      const paymentMethod = 'charge_automatically';
      // Update the payment method if it changed
      if (subscription && subscription.billing != paymentMethod) {
        // Update the payment method if it changed
        const updatedSubscription = await stripe.subscriptions.update(
          subscription.stripeId,
          {billing: paymentMethod}
        );
        const updatedBilling = await db(Subscription.table)
          .where('id', subscription.id)
          .update({billing: paymentMethod});
      }

      // Return the payment source we updated
      return {
        id: createdSource.id,
        last4: createdSource.last4,
        brand: createdSource.brand,
      };
    } catch (e) {
      throw new Error(e);
    }
  }

  // Remove a payment source for the customer
  async removeSource() {
    try {
      // Stripe API: Remove the default source
      const updatedCustomer = await stripe.customers.deleteSource(
        this.stripeId,
        this.sourceId
      );
      // DB: Remove the payment source
      const removed = await db(this.constructor.table)
        .where('id', this.id)
        .update({
          sourceId: '',
          sourceLast4: '',
          sourceBrand: '',
        });
    } catch (e) {
      throw new Error(e);
    }
  }

  // Request invoices by email for the customer
  async subscribeInvoices() {
    try {
      // Update our subscription to send invoices
      const subscription = await this.getSubscription();
      const paymentMethod = 'send_invoice';
      // Update the payment method if it changed
      if (subscription && subscription.billing != paymentMethod) {
        const updatedSubscription = await stripe.subscriptions.update(
          subscription.stripeId,
          {
            billing: paymentMethod,
            days_until_due: 30,
          }
        );
        const updatedBilling = await db(Subscription.table)
          .where('id', subscription.id)
          .update({billing: paymentMethod});
        return {};
      }
    } catch (e) {
      console.log(e);
    }
  }
}

module.exports = Customer;
