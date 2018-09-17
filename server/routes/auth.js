/**
 * auth.js
 * Stripe Billing demo. Created by Michael Glukhovsky (@mglukhovsky).
 *
 * This set of Express routes handle all user authentication actions.
 */
'use strict';

const config = require('../../config');
const router = require('express').Router();
const Account = require('../models/Account');
const Customer = require('../models/Customer');
const db = require('../database');
const crypto = require('crypto');
const getRequestToken = require('../middleware/session').getRequestToken;

// Sign up a new user
router.post('/signup', async (req, res, next) => {
  // This route expects the body parameters:
  //  - email: username's email
  //  - password: username's password
  const {email, password} = req.body;

  try {
    // Make sure there isn't an existing account in our database
    const existingAccount = await Account.getByEmail(email);
    if (existingAccount) {
      // Conflict: the resource already exists (HTTP 409)
      const err = new Error(`Username ${email} is already taken.`);
      err.status = 409;
      err.clientMessage = 'That username is already taken.';
      return next(err);
    }
    const account = await Account.create(email, password);

    // Success: generate a session record with a random token and respond with the token
    return res.json({token: await createSession(account.id, account.customer.id) })
  } catch (e) {
    return next(new Error(e));
  }
});

// Log in an existing user
router.post('/login', async (req, res, next) => {
  // This route expects the body parameters:
  //  - email: username's email
  //  - password: username's password
  const {email, password} = req.body;

  try {
    // Get the account for this email address
    const account = await Account.getByEmail(email);
    if (account) {
      // Get the customer matching this account
      const customer = await Customer.getByAccount(account.id);

      const verifiedPassword = await account.comparePassword(password);
      if (verifiedPassword) {
        // Success: generate a session record with a random token and respond with the token
        return res.json({token: await createSession(account.id, customer.id) })
      }
    }
  } catch (e) {
    console.log(e)
    return next(new Error(e));
  }
  // Unauthorized (HTTP 401)
  const err = new Error(`Username or password for ${email} doesn't match.`);
  err.status = 401;
  err.clientMessage = `Username and password don't match.`;
  return next(err);
});

// Log a user out by removing their session record
router.post('/logout', async (req, res, next) => {
  await removeSessions({ token: getRequestToken(req) });
});

// Create a database record mapping a random session token
// to an account and customer.
async function createSession(accountId, customerId) {
  // Remove any existing sessions for this account.  This is partially just to
  // avoid filling the database with stale entries, but preventing a user from
  // having more than one simultaneous session also provides a potential
  // security benefit in that stolen sessions can't persist past a new
  // legitimate login.
  await removeSessions({accountId});

  // Create the new session
  const token = crypto.randomBytes(16).toString('base64');
  const timestamp = Date.now() / 1000;
  await db('sessions').insert({ token, accountId, customerId, timestamp });
  return token
}

// Remove all session records associated with a particular token, accountId, etc.
async function removeSessions(criteria) {
  return db('sessions').where(criteria).del();
}

module.exports = router;
