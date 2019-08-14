/**
 * stripe.js
 * Stripe Billing demo. Created by Michael Glukhovsky (@mglukhovsky).
 *
 * This set of Express routes handle all Stripe Billing actions.
 *
 * A Stripe Billing integration typically includes the follow:
 *   - Local user accounts for each Customer
 *   - Routes for managing a user's Subscription, using a Plan
 *   - Routes for managing a user's Payment Method
 *   - A route to view past Invoices
 *   - A route to provide the next upcoming Invoice
 *   - If you're using metered billing, a route to record new metered usage
 *     with Usage Records.
 */
'use strict';

const config = require('../../config');
const router = require('express').Router();
const verifyToken = require('../middleware/verifyToken');
const stripe = require('stripe')(config.stripe.secretKey);
const Account = require('../models/Account');
const Customer = require('../models/Customer');
const Subscription = require('../models/Subscription');
const Plan = require('../models/Plan');

router.get('/environment', async (req, res, next) => {
  return res.send({stripePublicKey: config.stripe.publicKey});
});

// Get the account for this user
router.get('/account', verifyToken, async (req, res, next) => {
  const {accountId} = res.locals;
  try {
    // Get this account as JSON
    const account = await Account.getById(accountId);
    if (account) {
      const json = await account.toJSON({expand: true});
      return res.send(json);
    }
    const err = new Error(`Account ${accountId} not found.`);
    err.notFound = true;
    return next(err);
  } catch (e) {
    return next(new Error(e));
  }
});

// Get the subscription for the current user
router.get('/subscription', verifyToken, async (req, res, next) => {
  const {customerId} = res.locals;
  try {
    // Get the subscription for this customer as JSON
    const subscription = await Subscription.getByCustomer(customerId);
    const json = await subscription.toJSON({expand: true});
    return res.send(json);
  } catch (e) {
    return next(new Error(e));
  }
});

// Create a subscription.
router.post('/subscription', verifyToken, async (req, res, next) => {
  const {customerId} = res.locals;
  // This route expects the body parameters:
  //   - plan: the primary plan for the subscription
  const {plan} = req.body;

  if (!plan) {
    return next(
      new Error('No subscription plan specified. Use the `plan` parameter.')
    );
  }
  try {
    // Get this customer
    const customer = await Customer.getById(customerId);
    // Create a new subscription for this customer using this plan
    const subscription = await Subscription.create(customer, plan);
    return res.send({subscription});
  } catch (e) {
    return next(new Error(e));
  }
});

// Update a subscription.
router.patch('/subscription', verifyToken, async (req, res, next) => {
  const {customerId} = res.locals;
  // This route expects the body parameters:
  //   - plan: the primary plan for the subscription
  const {plan} = req.body;

  if (!plan) {
    return next(new Error('Missing required parameter: `plan`.'));
  }

  try {
    // Get the subscription for this customer
    const subscription = await Subscription.getByCustomer(customerId);
    // Update the subscription with the given plan
    const updated = await subscription.update(plan);
    return res.send({subscription: updated});
  } catch (e) {
    return next(new Error(e));
  }
});

// Cancel the user's subscription
router.delete('/subscription', verifyToken, async (req, res, next) => {
  const {customerId} = res.locals;
  try {
    // Get the subscription for this customer
    const subscription = await Subscription.getByCustomer(customerId);
    // Cancel this subscription
    const canceled = await subscription.cancel();
    return res.sendStatus(200);
  } catch (e) {
    return next(new Error(e));
  }
});

// Request invoices via email for the user
router.post('/invoices/subscribe', verifyToken, async (req, res, next) => {
  const {customerId} = res.locals;
  try {
    // Get the customer's subscription
    const customer = await Customer.getById(customerId);
    customer.subscribeInvoices();
    return res.sendStatus(200);
  } catch (e) {
    return next(new Error(e));
  }
});

// Get the upcoming invoice for the user
router.get('/invoices/upcoming', verifyToken, async (req, res, next) => {
  const {customerId} = res.locals;

  try {
    // Get the customer's subscription
    const customer = await Customer.getById(customerId);
    const subscription = await customer.getSubscription();
    // If we don't have a subscription, the estimate will be zero
    if (!subscription) {
      return res.send({estimate: 0});
    }
    // Get the invoice for this subscription
    const invoice = await stripe.invoices.retrieveUpcoming({
      customer: customer.stripeId,
      subscription: subscription.stripeId,
    });
    return res.send({estimate: invoice.total});
  } catch (e) {
    return next(new Error(e));
  }
});

// Update the fonts used by this account
//  - fonts: a comma-separated string of font ids
router.post('/fonts', verifyToken, async (req, res, next) => {
  const {customerId} = res.locals;
  const {fonts} = req.body;
  try {
    // Get the subscription for this customer
    const customer = await Customer.getById(customerId);
    // Update the fonts used for this subscription
    const updated = await customer.updateFonts(fonts);
    return res.send({fonts});
  } catch (e) {
    return next(new Error(e));
  }
});

// Record usage for a metered subscription
//  - numRequests: the number of requests to record
router.post('/usage', verifyToken, async (req, res, next) => {
  const {customerId} = res.locals;
  // This route expects the body parameters:
  //   - numRequests: the number of requests for this usage period
  const {numRequests} = req.body;

  if (!numRequests) {
    return next(new Error('Missing required parameter: `numRequests`.'));
  }

  try {
    // Get the subscription for this customer
    const customer = await Customer.getById(customerId);
    const subscription = await customer.getSubscription();
    // Record usage for this subscription
    const totalUsage = await subscription.recordUsage(numRequests);
    return res.send({numRequests: totalUsage});
  } catch (e) {
    return next(new Error(e));
  }
});

router.post('/setup_intent', verifyToken, async (req, res, next) => {
  const {customerId} = res.locals;

  try {
    // Get the Customer
    const customer = await Customer.getById(customerId);

    // Create a new SetupIntent, for the customer, configured for cards
    const setupIntent = await stripe.setupIntents.create({
      payment_method_types: ['card'],
      customer: customer.stripeId
    });

    return res.send({clientSecret: setupIntent.client_secret});
  } catch (e) {
    return next(new Error(e));
  }
});

router.post('/payment_methods/attach', verifyToken, async (req, res, next) => {
  const {customerId} = res.locals;

  try {
    const customer = await Customer.getById(customerId);
    const { paymentMethodId } = req.body;

    return res.send(
      await customer.updatePaymentMethod(paymentMethodId)
    );
  } catch (e) {
    return next(new Error(e));
  }
});

module.exports = router;
