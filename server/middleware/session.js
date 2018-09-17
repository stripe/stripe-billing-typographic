/**
 * session.js
 * Stripe Billing demo. Created by Michael Glukhovsky (@mglukhovsky).
 *
 * This Express middleware (exported as `middleware`) checks if the incoming
 * request includes a valid session token in the `Authorization` header.  If
 * so, the associated account and customer IDs are set in `locals`.  If not,
 * the request is sent to the error handler.
 *
 * a `getRequestToken` utility function is also exported for use in the
 * `/logout` route.
 */
'use strict';

const db = require('../database');

function oneHourAgo() {
  return (Date.now() / 1000) - (60 * 60);
}

function getRequestToken(req) {
  // Check if an `Authorization` header was included
  const header = req.headers.authorization

  if (!header || !header.startsWith('Bearer')) {
    // Failed: no token provided
    throw new Error('No `Authorization` header provided.')
  }
  return header.replace(/^Bearer /, '')
}

async function middleware(req, res, next) {
  try {
    // Get session token and look up associated data
    const token = getRequestToken(req)
    const [session] = await db('sessions')
        .where('token', token)
        .andWhere('timestamp', '>', oneHourAgo());

    if (!session) {
      throw new Error(`Session not found for token: ${token}`)
    }

    // Update session timestamp
    try {
      await db('sessions').where('token', token).update('timestamp', Date.now()/1000)
    } catch(e) {
      // unexpected, but not fatal, so continue
    }

    // Success: include session data in the request
    res.locals.accountId = session.accountId
    res.locals.customerId = session.customerId
    return next()

  } catch (err) {
    err.authFailed = true
    return next(err)
  }
}
module.exports = {middleware, getRequestToken}
