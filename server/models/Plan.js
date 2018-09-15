/**
 * Plan.js
 * Stripe Billing demo. Created by Michael Glukhovsky (@mglukhovsky).
 *
 * This model creates and manages a Stripe Plan.
 *
 * Required fields:
 *  - id: (automatically generated)
 *  - stripeId: the id of the Stripe Plan object
 *  - name: the plan's name
 *
 * This model includes an important method:
 *  - `setupPlans` checks Stripe to see if the related account
 *    includes the right plans, otherwise it creates them and
 *    syncs them to the local database
 *
 * The Account model has a few relations to other models:
 *  - The Account has exactly one Customer (customer.accountId)
 */
'use strict';

const Model = require('./Model');
const config = require('../../config');
const stripe = require('stripe')(config.stripe.secretKey);
const db = require('../database');

class Plan extends Model {
  static get table() {
    return 'plans';
  }

  constructor(opts) {
    super(opts);
    this.id = opts.id;
    this.stripeId = opts.stripeId;
    this.name = opts.name;
    this.nickname = opts.nickname;
    this.type = opts.type;
    this.amount = opts.amount;
    this.included = opts.included;
  }

  // Get a Plan by id from the database
  static async getById(id) {
    try {
      const [plan] = await db(this.table).where('id', id);
      return new Plan(plan);
    } catch (e) {
      throw new Error(e);
    }
  }

  // Get a Plan by nickname from the database
  static async getByNickname(nickname) {
    try {
      const [plan] = await db(this.table).where('nickname', nickname);
      return new Plan(plan);
    } catch (e) {
      throw new Error(e);
    }
  }

  // Set up any missing plans on Stripe's API
  static async setupPlans() {
    /**
     * Each of our plans (Starter, Growth, and Enterprise) have both a monthly
     * fixed price (e.g. $10, $20, and $30) and a metered price based on the
     * number of requests. Each plan includes a number of free requests.
     * Additional requests cost $0.01 each.
     *
     * To model this, we're creating two plans for each price point:
     *  - A monthly plan with the base price (e.g. $10)
     *  - A metered plan with two tiers using graduated pricing.
     *    e.g. the Starter plan's first tier is free up to 10,000 requests,
     *    and the second tier costs $0.01 for each request.
     *
     * Each customer will be subscribed to a pair of these plans. In total,
     * we'll have six plans.
     */
    let plans = [
      {
        name: 'Starter',
        nickname: 'starter',
        type: 'monthly',
        stripeId: null,
        amount: 1000,
      },
      {
        name: 'Starter monthly requests',
        nickname: 'starter_requests',
        type: 'metered',
        stripeId: null,
        amount: 1,
        included: 10000,
      },
      {
        name: 'Growth',
        nickname: 'growth',
        type: 'monthly',
        stripeId: null,
        amount: 2000,
      },
      {
        name: 'Growth monthly requests',
        nickname: 'growth_requests',
        type: 'metered',
        stripeId: null,
        amount: 1,
        included: 50000,
      },
      {
        name: 'Enterprise',
        nickname: 'enterprise',
        type: 'monthly',
        stripeId: null,
        amount: 3000,
      },
      {
        name: 'Enterprise monthly requests',
        nickname: 'enterprise_requests',
        type: 'metered',
        stripeId: null,
        amount: 1,
        included: 150000,
      },
    ];

    // Fetch plans from Stripe
    let stripePlans;
    try {
      stripePlans = await stripe.plans.list();
    } catch (e) {
      throw new Error(`⚡️  Error communicating with Stripe: ${e}`);
    }

    // Check if all our plans have been created on this Stripe account
    let missingPlans = [];
    for (let plan of plans) {
      let match = stripePlans.data.find(
        stripePlan => stripePlan.nickname === plan.nickname
      );
      if (match) {
        plan.stripeId = match.id;
      } else {
        missingPlans.push(plan);
      }
    }

    if (missingPlans.length === 0) {
      console.log('⚡️  Plans found on Stripe.');
    } else {
      console.log(
        `${missingPlans.length} plans missing from this Stripe account.`
      );
      console.log('⚡️  Creating missing plans...');
    }

    // Create missing plans on this Stripe account
    try {
      for (let plan of missingPlans) {
        let createdPlan;
        // Create a monthly plan
        if (plan.type === 'monthly') {
          createdPlan = await stripe.plans.create({
            interval: 'month',
            amount: plan.amount,
            currency: 'usd',
            nickname: plan.nickname,
            product: {
              name: plan.name,
            },
          });
        } else if (plan.type === 'metered') {
          // Create a metered plan
          createdPlan = await stripe.plans.create({
            interval: 'month',
            currency: 'usd',
            nickname: plan.nickname,
            product: {
              name: plan.name,
            },
            usage_type: 'metered',
            // Two tiers: each plan features an included number of requests for
            // free, extra requests are $0.01.
            billing_scheme: 'tiered',
            // We're using graduated pricing, which lets us bill a different
            // rate at each tier (and gradually increase the price for each
            // request as volume grows.)
            tiers_mode: 'graduated',
            tiers: [
              {
                up_to: plan.included,
                amount: 0,
              },
              {
                up_to: 'inf',
                amount: plan.amount,
              },
            ],
          });
        }
        plan.stripeId = createdPlan.id;
        console.log(`Created ${plan.name} plan on Stripe.`);
      }
    } catch (e) {
      if (
        e.message === 'Plan already exists.' ||
        e.message === 'Product already exists.'
      ) {
        throw new Error(
          '⚠️  Plans and Products have already been registered.\n' +
            'Delete them from your Dashboard and run this script again.'
        );
      } else {
        throw new Error('⚠️  An error occurred during setup:', e);
      }
    }

    // Create references in our local database to the Stripe plans
    try {
      // Clear the Plans table
      let deleted = await db(this.table).del();
      // Insert references to the table
      for (let plan of plans) {
        let inserted = await this.insert(plan);
      }
      console.log('🔄  Synced to local database.');
    } catch (e) {
      throw new Error(`⚠️  Database error: ${e}`);
    }
  }
}

module.exports = Plan;
