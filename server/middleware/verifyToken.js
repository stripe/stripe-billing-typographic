/**
 * verifyToken.js
 * Stripe Billing demo. Created by Michael Glukhovsky (@mglukhovsky).
 *
 * This Express middleware checks if the incoming request includes a valid
 * JSON web token (JWT) for an authenticated user before allowing the request
 * on the matching route.
 */
'use strict';

const jwt = require('jsonwebtoken')
const config = require('../../config')

module.exports = (req, res, next) => {
  // Check if an `Authorization` header was included
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer')) {
    // Failed: no token provided
    const err = new Error('No `Authorization` header provided.')
    err.authFailed = true
    return next(err)
  }

  const token = header.replace(/^Bearer /, '')
  let account = null
  try {
    account = jwt.verify(token, config.jwtSecret)
  } catch (e) {
    // Failed: wrong token
    const err = new Error('JWT token verification failed.')
    err.authFailed = true
    return next(err)
  }

  // Failed: no account found in decoded data
  if (!account.data.accountId) {
    const err = new Error('JWT is missing account data.')
    err.authFailed = true
    return next(err)
  }

  // Success: include decoded data in the request
  res.locals.accountId = account.data.accountId
  res.locals.customerId = account.data.customerId
  return next()
}
