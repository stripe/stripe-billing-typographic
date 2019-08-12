/**
 * Subscription.js
 * Stripe Billing demo. Created by Michael Glukhovsky (@mglukhovsky).
 *
 * This model creates and manages a Stripe Subscription. Each Subscription
 * belongs to a Customer.
 *
 * Fields:
 *  - id: (automatically generated)
 *  - stripeId: the id of the Stripe Subscriptions object
 *  - createdAt: when the Subscription object was created
 *  - status: the current status of the Stripe Subscription
 *  - plan: the nickname of the Plan for this Subscription
 *  - billing: how we'll bill our customers (either `charge_automatically` or
 *    `send_invoice`)
 *  - currentPeriodEnd: when the current billing period ends
 *  - currentPeriodStart: when the current billing period starts
 *  - meteredUsage: the number of requests for our metered plan
 *    used in this billing period
 *  - stripeMeteredSubId: the Stripe id of the metered subscription
 *  - stripeMonthlySubId: the Stripe id of the monthly subscription
 *
 * This model includes a few properties and methods for user authentication.
 *  - The password is hashed via bcrypt before being stored in the database.
 *  - The static method `$secureFields()` ensures that the `password` field is
 *    never included when rendering this as JSON.
 *
 * The Customer model has a few relations to other models:
 *  - The Subscription belongs to exactly one Customer (subscription.customerId)
 */
'use strict';

const config = require('../../config');
const Model = require('./Model');
const stripe = require('stripe')(config.stripe.secretKey);
const Plan = require('./Plan');
const db = require('../database');

class Subscription extends Model {
  static get table() {
    return 'subscriptions';
  }

  constructor(opts) {
    super(opts);
    this.id = opts.id;
    this.stripeId = opts.stripeId;
    this.customerId = opts.customerId;
    this.createdAt = opts.createdAt;
    this.status = opts.status;
    this.plan = opts.plan;
    this.billing = opts.billing;
    this.currentPeriodEnd = opts.currentPeriodEnd;
    this.currentPeriodStart = opts.currentPeriodStart;
    this.meteredUsage = opts.meteredUsage;
    this.stripeMeteredSubId = opts.stripeMeteredSubId;
    this.stripeMonthlySubId = opts.stripeMonthlySubId;
  }

  // Get a Subscription by id from the database
  static async getById(id) {
    try {
      const [subscription] = await db(this.table).where('id', id);
      // Subscription not found: return null
      if (!subscription) {
        return null;
      }
      return new Subscription(subscription);
    } catch (e) {
      throw new Error(e);
    }
  }

  // Get a Subscription belonging to a Customer from the database
  static async getByCustomer(customerId) {
    try {
      const [subscription] = await db(this.table).where('customerId', customerId);
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
  toJSON() {
    return {
      id: this.id,
      stripeId: this.stripeId,
      customerId: this.customerId,
      createdAt: this.createdAt,
      status: this.status,
      plan: this.plan,
      billing: this.billing,
      currentPeriodEnd: this.currentPeriodEnd,
      currentPeriodStart: this.currentPeriodStart,
      meteredUsage: this.meteredUsage,
      stripeMeteredSubId: this.stripeMeteredSubId,
      stripeMonthlySubId: this.stripeMonthlySubId,
    };
  }

  // Create a new subscription
  // This method requires:
  //  - customer: the Customer associated with our user
  //  - plan: nickname of the monthly plan of the subscription
  // We'll create two related plans for the customer: one metered, one monthly.
  static async create(customer, plan) {
    try {
      if (!customer || !plan) {
        throw new Error('Missing a required parameter: customer, plan');
      }
      // Fetch matching plans from our local database
      const [monthlyPlan] = await db(Plan.table).where('nickname', plan);
      const [meteredPlan] = await db(Plan.table).where(
        'nickname',
        plan + '_requests'
      );

      if (!monthlyPlan || !meteredPlan) {
        throw new Error(
          `Monthly or metered plans for ${plan} not found in local database.`
        );
      }

      // Stripe: Define our subscription
      const stripeSub = {
        customer: customer.stripeId,
        items: [
          {
            plan: monthlyPlan.stripeId,
          },
          {
            plan: meteredPlan.stripeId,
          },
        ],
      };
      // If we have a payment method, charge it
      // automatically. Otherwise, we send a hosted invoice via email.
      if (customer.paymentMethodId) {
        stripeSub.collection_method = 'charge_automatically';
      } else {
        stripeSub.collection_method = 'send_invoice';
        stripeSub.days_until_due = 30;
      }
      // Stripe: Create the subscription
      const stripeSubscription = await stripe.subscriptions.create(stripeSub);

      // Find the two Stripe SubscriptionItems we created
      const stripeMonthlySub = stripeSubscription.items.data.find(
        item => item.plan.nickname === monthlyPlan.nickname
      );
      const stripeMeteredSub = stripeSubscription.items.data.find(
        item => item.plan.nickname === meteredPlan.nickname
      );

      // DB: Add the subscription to our local database
      const subscription = {
        stripeId: stripeSubscription.id,
        status: stripeSubscription.status,
        // Nickname of the monthly plan (e.g. 'startup', 'growth', or
        // 'enterprise')
        plan: plan,
        // When the current billing period starts and stops
        currentPeriodEnd: stripeSubscription.current_period_end,
        currentPeriodStart: stripeSubscription.current_period_start,
        // We store a reference to the SubscriptionItems for the metered and
        // monthly plans for this Subscription, so we can update them quickly
        // later (e.g. updating usage or which plan this customer is using.)
        meteredUsage: 0,
        stripeMeteredSubId: stripeMeteredSub.id,
        stripeMonthlySubId: stripeMonthlySub.id,
        // Define a relation to Customer who owns this Subscription
        customerId: customer.id,
      };
      const [subscriptionId] = await this.insert(subscription);
      subscription.id = subscriptionId;

      return new Subscription(subscription);
    } catch (e) {
      throw new Error(`Could not create Stripe subscription: ${e}`);
    }
  }

  // Update an existing subscription
  // This method requires:
  //  - plan: the nickname of the plan for this subscription
  async update(plan) {
    try {
      // Fetch a matching plan
      const monthlyPlan = await Plan.getByNickname(plan);
      const meteredPlan = await Plan.getByNickname(plan + '_requests');
      if (!monthlyPlan || !meteredPlan) {
        throw new Error(
          `Monthly or metered plans for ${plan} not found in local database.`
        );
      }

      // Stripe: update the subscription
      const updatedStripe = await stripe.subscriptions.update(this.stripeId, {
        cancel_at_period_end: false,
        items: [
          {
            id: this.stripeMonthlySubId,
            plan: monthlyPlan.stripeId,
          },
          {
            id: this.stripeMeteredSubId,
            plan: meteredPlan.stripeId,
          },
        ],
      });

      // DB: Update the subscription in our local database
      const updated = await db(this.constructor.table)
        .where('id', this.id)
        .update({plan});
      this.plan = plan;
      return this;
    } catch (e) {
      throw new Error(
        `Could not update Stripe subscription ${this.stripeId}: ${e}`
      );
    }
  }

  // Cancel the subscription
  async cancel() {
    try {
      // Stripe: Cancel the subscription
      const stripeSubscription = await stripe.subscriptions.del(this.stripeId);
      // DB: Delete the subscription from our local database
      const canceled = await db(this.constructor.table)
        .where('id', this.id)
        .del();
    } catch (e) {
      throw new Error(
        `Could not cancel Stripe subscription ${this.stripeId}: ${e}`
      );
    }
  }

  // Record usage for the metered plan attached to this subscription. Returns the
  // total usage for this billing period.
  // This method requires:
  //  - numRequests: the number of requests included in this usage record
  async recordUsage(numRequests) {
    try {
      // JavaScript's timestamps are in milliseconds, but Stripe's API uses seconds
      const timestamp = Math.floor(new Date().getTime() / 1000);
      // Stripe: Update the usage for the metered subscription
      const usageRecord = await stripe.usageRecords.create({
        quantity: numRequests,
        timestamp,
        subscription_item: this.stripeMeteredSubId,
      });

      // DB: Update the database with the new metered usage numbers
      const totalRequests = this.meteredUsage + numRequests;
      const updated = await db(this.constructor.table)
        .where('id', this.id)
        .update({meteredUsage: totalRequests});
      this.meteredUsage = totalRequests;
      return totalRequests;
    } catch (e) {
      throw new Error(
        `Could not record usage for Stripe subscription ${this.stripeId}: ${e}`
      );
    }
  }
}

module.exports = Subscription;
