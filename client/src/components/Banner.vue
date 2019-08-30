<template>
  <section :class="{banner: true, logo: [''].contains}">
    <template v-if="currentRoute === 'fonts'">
      <div class="logo"></div>
      <p class="message">
        Typographic is a demo for <a href="https://stripe.com/billing">Stripe Billing</a>
        using monthly and metered plans.
      </p>
      <p class="link">
        <a href="https://github.com/stripe/stripe-billing-typographic" target="_blank">View on GitHub</a>
      </p>
    </template>
    <template v-else-if="currentRoute === 'pricing'">
      <div class="logo"></div>
      <p class="message">
        Each subscription plan includes a different <strong>number of fonts</strong>
        and <strong>monthly requests.</strong>
      </p>
    </template>
    <template v-else-if="currentRoute === 'login'">
      <div class="info"></div>
      <p class="message">
        Create an account with your email address. In Stripe's <strong>test mode</strong>,
        you won't actually receive an email.
      </p>
    </template>
    <template v-else-if="currentRoute === 'payment'">
      <div class="info"></div>
      <p v-if="store.banner.paymentMethod === 'card'" class="message">
        You can use the Stripe test credit card number:
        <span ref="testCardNumber" v-text="testCardNumber"></span>
      </p>
      <p v-else-if="store.banner.paymentMethod === 'invoice'" class="message">
        Since we're in <strong>test mode</strong>, you won't actually receive an email.
      </p>
      <button class="copy" @click="copyCardNumber()">Copy number</button>
    </template>
  <template v-else-if="currentRoute === 'account'">
      <div class="info"></div>
      <p class="message">
        Requests are billed based on metered usage. Click <strong>Increase</strong> to simulate usage.
      </p>
      <button class="add" @click="simulateRequests()">Increase</button>
      <button class="reset" v-if="false">Reset</button>
    </template>
  </section>
</template>
<script>
/**
 * Banner.vue
 * Stripe Billing demo. Created by Michael Glukhovsky (@mglukhovsky).
 *
 * Information banner at the bottom of the app.
 */

import axios from 'axios';
import store from '../store';

export default {
  name: 'Banner',
  data() {
    return {
      store,
      currentRoute: null,
      clipboard: null,
      testCardNumber: '4000 0025 0000 3155',
    };
  },
  // Get the current route and show the right banner when the component mounts
  mounted() {
    this.currentRoute = this.$router.currentRoute.name;
  },
  // Watch the router and update the banner on navigation
  watch: {
    $route(to, from) {
      this.currentRoute = to.name;
    },
  },
  methods: {
    async simulateRequests() {
      try {
        // Choose a random number of requests to report
        const numRequests = Math.floor(Math.random() * 10000);
        const response = await axios.post('/api/usage', {numRequests});
        if (response.status == 200) {
          store.subscription.meteredUsage = response.data.numRequests;
          const updatedEstimate = await store.getNextBillingEstimate();
        }
      } catch (e) {
        console.log(`Could not simulate requests: ${e}`);
      }
    },
    copyCardNumber() {
      // Select the DOM node containing the card number
      const range = document.createRange();
      range.selectNode(this.$refs.testCardNumber);
      window.getSelection().addRange(range);
      // Copy the selection to the clipboard
      try {
        document.execCommand('copy');
      } catch (e) {
        console.log('Unable to copy test card number to clipboard.');
      }
      // Remove our selection
      window.getSelection().removeAllRanges();
    },
  },
};
</script>

<style scoped>
.banner {
  max-width: 825px;
  margin: 0 auto;
  padding: 0 22px;
  font-size: 18px;
  font-weight: bold;
  background: white;
  color: #6a7c94;
  border-radius: 22px;
  box-shadow: 0px 2px 2px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  box-sizing: border-box;
}

.logo {
  flex-basis: 60px;
  position: relative;
  background: url('/assets/images/logo.svg') center center no-repeat;
  height: 24px;
  background-size: 90%;
  margin-right: 15px;
  margin-top: -1px;
}

.info {
  background: url('/assets/icons/info.svg') left center no-repeat;
  width: 30px;
  height: 19px;
}

p {
  margin: 0 10px 0 0;
  font-size: 15px;
  font-weight: 400;
  padding: 12px 0;
}

a {
  color: #6772e5;
}

button {
  color: #6772e5;
  height: 19px;
  font-size: 15px;
  padding-left: 20px;
  margin-left: 20px;
}

button:active {
  color: #3b4ade;
}

p.message {
  flex-grow: 1;
}

p.test-card-number {
  font-weight: 600;
}

button.copy {
  background: url('/assets/icons/copy.svg') left top 3px no-repeat, white;
  padding-left: 20px;
}

button.reset {
  background: url('/assets/icons/reset.svg') left center no-repeat, white;
}

button.add {
  background: url('/assets/icons/add-blue.svg') left center no-repeat, white;
}
</style>