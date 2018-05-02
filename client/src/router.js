/**
 * router.js
 * Stripe Billing demo. Created by Michael Glukhovsky (@mglukhovsky).
 *
 * Vue router: using the `vue-router` library, we mount a matching component
 * based on the current route.
 */

import Vue from 'vue';
import Router from 'vue-router';
import FontPicker from './components/FontPicker.vue';
import Pricing from './components/Pricing.vue';
import Payment from './components/Payment.vue';
import Account from './components/Account.vue';
import Login from './components/Login.vue';
import auth from './auth';

Vue.use(Router);

const router = new Router({
  routes: [
    {
      name: 'fonts',
      path: '/',
      component: FontPicker,
    },
    {
      name: 'pricing',
      path: '/pricing',
      component: Pricing,
    },
    {
      name: 'payment',
      path: '/payment',
      component: Payment,
      beforeEnter: requireAuth,
    },
    {
      name: 'account',
      path: '/account',
      component: Account,
      beforeEnter: requireAuth,
    },
    {
      name: 'login',
      path: '/login',
      component: Login,
    },
  ],
});

// Defines behavior for any route that requires authentication
function requireAuth(to, from, next) {
  // If the user isn't logged in, redirect them to the login view
  if (!auth.loggedIn()) {
    next({
      path: '/login',
      query: {redirect: to.fullPath},
    });
  } else {
    next();
  }
}

export default router;
