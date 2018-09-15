/**
 * auth.js
 * Stripe Billing demo. Created by Michael Glukhovsky (@mglukhovsky).
 *
 * This set of Express routes handle all user authentication actions.
 */
'use strict';

const config = require('../../config');
const router = require('express').Router();
const jwt = require('jsonwebtoken');
const Account = require('../models/Account');
const Customer = require('../models/Customer');
const db = require('../database');

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

    // Success: generate a JSON web token and respond with the JWT
    return res.json({token: generateToken(account.id, account.customer.id)});
  } catch (e) {
    console.log(e)
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
        // Success: generate and respond with the JWT
        return res.json({token: generateToken(account.id, customer.id)});
      }
    }
  } catch (e) {
    return next(new Error(e));
  }
  // Unauthorized (HTTP 401)
  const err = new Error(`Username or password for ${email} doesn't match.`);
  err.status = 401;
  err.clientMessage = `Username and password don't match.`;
  return next(err);
});

// Generates a signed JWT that encodes a account ID
// This function requires:
//  - accountId: account to include in the token
//  - customerID: customer to include in the token
function generateToken(accountId, customerId) {
  // Include some data and an expiration timestamp in the JWT
  return jwt.sign(
    {
      exp: Math.floor(Date.now() / 1000) + 60 * 60, // This key expires in 1 hour
      data: {accountId, customerId},
    },
    config.jwtSecret
  );
}

module.exports = router;
