<template>
  <div class="account-view">
    <h1 class="title">Account information</h1>
    <section class="subscription">
      <section class="account-item">
        <h2>Email</h2>
        <div class="details">{{store.email}}</div>
      </section>
      <section class="account-item">
        <h2>Plan</h2>
        <div class="details">
          <p v-if="!store.subscription">
            You haven’t <a class="change-plan" @click.prevent="changePlan()">signed up</a> for a plan yet.
          </p>
          <template v-else>
            <p>{{currentPlan.name}} plan, ${{currentPlan.rate}} per month</p>
            <ul>
              <li v-for="(feature, index) in currentPlan.features" 
                  v-text="feature" :key="index" class="feature"></li>
            </ul>
          </template>
        </div>
        <button class="update" @click.prevent="changePlan()">Change</button>
      </section>
      <section class="account-item">
        <h2>Payment</h2>
        <div class="details payment-details">
          <template v-if="store.source">
            <div :class="['card-brand', store.source.brand.toLowerCase()]"></div>
            <p class="last4">&bull;&bull;&bull;&bull;{{store.source.last4}}</p>
          </template>
          <p v-else-if="store.subscription && store.subscription.billing === 'send_invoice'">
            Invoices will be emailed at the end of the billing cycle.
          </p>
          <p v-else>No payment source.</p>
        </div>
        <button class="update" @click.prevent="changePayment()">Change</button>
      </section>
      <section class="account-item">
        <h2>Billing cycle</h2>
        <div class="details">
          <p v-if="store.subscription">
            You’ll be billed <span :class="{'full': extraRequests > 0}" 
              v-text="nextBillingEstimate"></span> on {{nextBillingCycle}}.
          </p>
          <p v-else>You don’t have an active subscription.</p>
        </div>
        <button v-if="store.subscription" class="update" @click.prevent="cancelSubscription()">Cancel</button>
      </section>
      <template v-if="store.subscription">
        <section class="account-item">
          <h2>Fonts</h2>
          <div class="details">
            <p v-if="store.selectedFonts.length === 0">
              You haven’t chosen your <strong>{{currentPlan.maxFonts ? currentPlan.maxFonts : 'unlimited'}}
              included</strong> {{currentPlan.maxFonts === 1 ? 'font' : 'fonts' }}.
            </p>
            <p v-else>
              You’ve chosen <strong>{{store.selectedFonts.length}} of your
              {{currentPlan.maxFonts ? currentPlan.maxFonts : 'unlimited'}} 
              included</strong> {{currentPlan.maxFonts === 1 ? 'font' : 'fonts' }}.
            </p>
          </div>
          <button class="update" @click.prevent="changeFonts()">Change fonts</button>
        </section>
        <section class="account-item requests">
          <h2>Requests</h2>
          <div class="details">
            <p v-if="extraRequests <= 0">
              You’ve used <strong>{{requests}} of your included {{numRequests}}</strong>
              requests this month.</p>
            <template v-else>
              <p>You’ve made <span class="full">{{requests}}</span> requests this month.</p>
              <p>
                That’s <span class="full">{{extraRequests.toLocaleString(undefined)}}</span> more than your
                included <strong>{{numRequests}}</strong> requests.
              </p>
            </template>
            <div class="meter">
              <div class="progress" :class="{full: extraRequests > 0}" 
                   :style="{width: requestPercentage+'%'}"></div>
              </div>
            <div class="upgrade-plan" v-if="extraRequests > 0">
              <p>Want to increase your included requests?</p>
              <button class="upgrade" @click="$router.push('/pricing')">Upgrade your plan</button>
            </div>
          </div>
        </section>
      </template>
    </section>
  </div>
</template>

<script>
/**
 * Account.vue
 * Stripe Billing demo. Created by Michael Glukhovsky (@mglukhovsky).
 *
 * Top-level component that show an account summary for the user.
 */

import axios from 'axios';
import store from '../store';

export default {
  name: 'Account',
  data() {
    return {store};
  },
  computed: {
    // Calculate the percentage of allowed requests made in this billing cycle
    requestPercentage: function() {
      if (store.subscription.meteredUsage && this.currentPlan.numRequests) {
        let percentage =
          store.subscription.meteredUsage / this.currentPlan.numRequests * 100;
        // If the percentage is over 100%, round off to 100%
        if (percentage > 100) {
          percentage = 100;
        }
        return percentage;
      }
    },
    // Number of metered requests used this billing cycle (formatted)
    requests: function() {
      if (store.subscription.meteredUsage) {
        return store.subscription.meteredUsage.toLocaleString(undefined);
      }
      return 0;
    },
    // Number of metered requests allowed in this plan
    numRequests: function() {
      return this.currentPlan.numRequests.toLocaleString(undefined);
    },
    extraRequests: function() {
      if (this.currentPlan.numRequests) {
        return store.subscription.meteredUsage - this.currentPlan.numRequests;
      }
      return 0;
    },
    // Estimate for next month's bill
    nextBillingEstimate: function() {
      // Only provide an estimate if we have an active subscription
      if (!store.subscription) {
        return null;
      }
      // Format the number as currency
      const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      });
      const estimate = store.nextBillingEstimate;
      if (estimate) {
        return formatter.format(estimate);
      }
      return null;
    },
    // The current subscription's monthly plan
    currentPlan: function() {
      if (store.subscription) {
        return store.getPlan(store.subscription.plan);
      }
      return {
        maxFonts: 0,
        numRequests: 0,
      };
    },
    // Date of the next billing cycle
    nextBillingCycle: function() {
      const monthNames = [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
      ];
      if (store.subscription) {
        const date = new Date(store.subscription.currentPeriodEnd * 1000);
        const day = date.getDate();
        const month = monthNames[date.getMonth()];
        const year = date.getFullYear();
        return `${month} ${day}, ${year}`;
      }
      return null;
    },
    // Whether the monthly requests gauge is full
    full: function() {
      let full = this.requests > this.numRequests;
      return full;
    },
  },
  async mounted() {
    // Fetch an estimate for the bill when the account view is mounted
    const estimate = await store.getNextBillingEstimate();
  },
  methods: {
    // Cancel the current subscription
    async cancelSubscription(subscription) {
      try {
        const response = await axios.delete(`/api/subscription`);
        if (response.status == 200) {
          store.subscription = null;
        }
      } catch (e) {
        console.log(`Could not cancel subscription: ${e}`);
      }
    },
    changePlan() {
      this.$router.push('pricing');
    },
    changePayment() {
      this.$router.push('payment');
    },
    changeFonts() {
      this.$router.push('/');
    },
  },
};
</script>

<style scoped>
h1.title {
  font-size: 32px;
  font-weight: 400;
  margin-top: 0;
  margin-bottom: 50px;
  padding: 0;
  text-align: center;
}

p {
  margin: 0;
}

ul {
  color: #8898aa;
  font-size: 15px;
  line-height: 32px;
  margin: 0;
  padding-top: 12px;
  padding-left: 0;
  list-style-type: none;
}

form {
  margin: 0;
}

button {
  background: none;
  color: #d782d9;
  font-weight: 500;
  padding: 0;
  height: auto;
  text-align: right;
  margin-left: 15px;
}

button.upgrade {
  padding-right: 25px;
  background: url('/assets/icons/arrow-pink.svg') right 5px no-repeat;
  background-size: 11%;
}

.account-view {
  margin: 0 auto;
  width: 670px;
}

.account-view > section {
  background: white;
  border-radius: 4px;
  color: #525f7f;
  margin-bottom: 40px;
}

.account-item {
  display: flex;
  flex-direction: row;
  border-top: thin solid #e6ebf1;
  padding: 20px 32px;
}

.account-item:first-child {
  border-top: 0;
}
.account-item h2 {
  margin: 0;
  font-weight: 500;
  font-size: 15px;
  flex-basis: 140px;
  padding-right: 0;
}

.account-item .details {
  flex-grow: 1;
}

.account-item .details strong {
  font-weight: 500;
}

.account-item .update {
  align-self: flex-start;
}

input[type='text'] {
  border: 0;
  padding: 0;
}

.payment-details {
  display: flex;
  flex-direction: row;
  align-items: center;
}

.card-brand {
  display: inline-block;
  width: 24px;
  height: 15px;
  margin-right: 10px;
  background: url('/assets/icons/card/unknown.svg') no-repeat left center;
}

.card-brand.amex {
  background-image: url('/assets/icons/card/amex.svg');
}

.card-brand.diners {
  background-image: url('/assets/icons/card/diners.svg');
}

.card-brand.discover {
  background-image: url('/assets/icons/card/discover.svg');
}

.card-brand.jcb {
  background-image: url('/assets/icons/card/jcb.svg');
}

.card-brand.mastercard {
  background-image: url('/assets/icons/card/mastercard.svg');
}

.card-brand.visa {
  background-image: url('/assets/icons/card/visa.svg');
}

.requests p {
  margin-top: 10px;
}

.requests p:first-child {
  margin-top: 0;
}

.requests .upgrade-plan {
  margin-top: 20px;
}

.meter {
  position: relative;
  width: 100%;
  height: 3px;
  background: #e6ebf1;
  margin-top: 20px;
  margin-bottom: 5px;
}

.meter .progress {
  position: absolute;
  transition: width 0.2s ease-out;
  height: 3px;
  background: #3ecf8e;
}

.meter .progress.full {
  background: #fcd669;
}

span.full {
  color: #e19e50;
  font-weight: 500;
}

.upgrade-plan {
  display: flex;
  flex-direction: row;
}

.upgrade-plan p {
  flex-grow: 1;
}

.billing-history .no-history {
  text-align: center;
  flex-grow: 1;
}
</style>
