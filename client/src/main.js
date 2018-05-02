/**
 * main.js
 * Stripe Billing demo. Created by Michael Glukhovsky (@mglukhovsky).
 *
 * Initializes our Vue application on the frontend.
 */

import Vue from 'vue';
import Typographic from './components/Typographic.vue';
import router from './router';
import store from './store';

// Include our app's router in our store
store.router = router;

// Create our Vue app
const app = new Vue({
  router,
  name: 'App',
  created() {
    // Fetch user details from the server for our store
    store.fetchUser();
  },
  el: '#app',
  render: h => h(Typographic),
});
