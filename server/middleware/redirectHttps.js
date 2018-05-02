/**
 * redirectHttps.js
 * Stripe Billing demo. Created by Michael Glukhovsky (@mglukhovsky).
 *
 * This Express middleware redirects any requests from HTTP to HTTPS.
 */
'use strict';

module.exports = (req, res, next) => {
  // If we're in production mode and we received a request via HTTP, redirect them to HTTPS
  if (req.get('X-Forwarded-Proto') === 'http') {
    res.redirect(`https://${req.host}${req.url}`);
    return;
  }
  return next();
};
