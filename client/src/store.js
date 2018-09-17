/**
 * store.js
 * Stripe Billing demo. Created by Michael Glukhovsky (@mglukhovsky).
 *
 * Basic data store for our Vue application that includes utility functions for
 * communication with our backend server.
 */

import axios from 'axios';
import Vue from 'vue';
import auth from './auth.js';

const plans = [
  {
    id: 'starter',
    name: 'Starter',
    features: [
      '1 font',
      '10,000 monthly requests included',
      '1 domain',
      '$0.01 per additional request',
    ],
    maxFonts: 1,
    numRequests: 10000,
    rate: 10,
  },
  {
    id: 'growth',
    name: 'Growth',
    features: [
      'Up to 3 fonts',
      '50,000 monthly requests included',
      '5 domains',
      '$0.01 per additional request',
    ],
    maxFonts: 3,
    numRequests: 50000,
    rate: 20,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    features: [
      'Unlimited fonts',
      '150,000 monthly requests included',
      'Unlimited domains',
      '$0.01 per additional request',
    ],
    maxFonts: null,
    numRequests: 150000,
    rate: 30,
  },
];

const fonts = [
  {
    id: 'proza-libre',
    name: 'Proza Libre',
    url: 'https://fonts.googleapis.com/css?family=Proza+Libre',
  },
  {
    id: 'karla',
    name: 'Karla',
    url: 'https://fonts.googleapis.com/css?family=Karla',
  },
  {
    id: 'cardo',
    name: 'Cardo',
    url: 'https://fonts.googleapis.com/css?family=Cardo',
  },
  {
    id: 'inconsolata',
    name: 'Inconsolata',
    url: 'https://fonts.googleapis.com/css?family=Inconsolata',
  },
  {
    id: 'roboto-condensed',
    name: 'Roboto Condensed',
    url: 'https://fonts.googleapis.com/css?family=Roboto+Condensed',
  },
  {
    id: 'Arvo',
    name: 'Arvo',
    url: 'https://fonts.googleapis.com/css?family=Arvo',
  },
  {
    id: 'lora',
    name: 'Lora',
    url: 'https://fonts.googleapis.com/css?family=Lora',
  },
  {
    id: 'crimson-text',
    name: 'Crimson Text',
    url: 'https://fonts.googleapis.com/css?family=Crimson+Text',
  },
];

const store = {
  router: null,
  stripe: null,
  plans,
  fonts,
  // Options for the banner at the bottom of the app
  banner: {
    // Which payment method the user selected: 'invoice' or 'card'
    paymentMethod: '',
  },
  selectedFonts: [],
  defaultFontSample: '',
  fontSample: '',
  fontSize: '40',
  authenticated: auth.loggedIn(),
  email: '',
  subscription: null,
  source: null,
  nextBillingEstimate: null,
  logout() {
    // Clear the user's authentication credentials
    auth.logout();
    // Clear user information on this store
    store.selectedFonts = [];
    store.authenticated = false;
    store.email = '';
    store.subscription = null;
    store.source = null;
    // Redirect to the fonts view
    this.router.push('/');
  },
  // Get the plan with the matching id
  getPlan(planId) {
    return store.plans.find(plan => plan.id === planId);
  },
  // Returns a random quote (used as examples for font samples)
  randomQuote() {
    const quotes = [
      // Robert Henri
      'A  work of art is the trace of a magnificent struggle.',
      'All real works of art look as though they were done in joy.',
      // Massimo Vignelli
      'Styles come and go. Good design is a language, not a style.',
    ];
    return quotes[Math.floor(Math.random() * quotes.length)];
  },
  // Get the Stripe public key, used for Stripe Elements
  async getStripeKey() {
    try {
      const response = await axios.get('/api/environment');
      store.stripe = Stripe(response.data.stripePublicKey);
    } catch (e) {
      console.log(`Could not get Stripe key`, e);
    }
  },
  // Fetch user and environment information from the server
  async fetchUser() {
    // If we're not authenticated, we can't update from the API with account details
    if (!store.authenticated) {
      return;
    }

    try {
      // Server: fetch the account information
      const {status, data: account} = await axios.get(`/api/account`, {
        validateStatus: status => status < 500,
      });
      // Access forbidden, token must be expired. Log out the user and redirect
      // away from the account page.
      if (status === 401) {
        this.logout();
        return;
      }
      // Update the local store: email, payment source, fonts, and subscription
      store.email = account.email;
      if (account.customer.fonts) {
        Vue.set(store, 'selectedFonts', account.customer.fonts.split(','));
      } else {
        Vue.set(store, 'selectedFonts', []);
      }
      Vue.set(store, 'source', account.customer.source);
      if (account.customer.subscription) {
        Vue.set(store, 'subscription', account.customer.subscription);
      }
      // Fetch the estimated bill for this month
      const estimate = await this.getNextBillingEstimate();
    } catch (e) {
      console.log(e);
    }
  },
  // Update the server with the current fonts beng used
  async saveFonts() {
    const fonts = store.selectedFonts.join();
    const response = await axios.post('/api/fonts', {fonts});
  },
  // Estimate bill on the next invoice (using Stripe's API to retrieve the next
  // upcoming invoice)
  async getNextBillingEstimate() {
    const response = await axios.get('/api/invoices/upcoming');
    if (!response) {
      return null;
    }
    store.nextBillingEstimate = response.data.estimate / 100;
  },
  // Update the user's subscription
  // This function requires:
  //  - planId: which plan to use for the subscription
  async updateSubscription(planId) {
    let response
    // Create a new subscription or patch an existing one
    if (store.subscription) {
      response = await axios.patch('/api/subscription', {
        plan: planId,
      });
    } else {
      response = await axios.post('/api/subscription', {
        plan: planId,
      });
    }
    store.subscription = response.data.subscription;
  },
};

// Use a random quote for the default font sample
store.defaultFontSample = store.randomQuote();
store.fontSample = store.defaultFontSample;
// Get the Stripe key
store.getStripeKey();
// If we have a session token stored, add a header all requests identifying the user
auth.setHeader();

export default store;
