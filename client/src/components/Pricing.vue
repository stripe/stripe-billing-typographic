<template>
  <section class="pricing">
    <div class="pricing-overview">
      <h1 class="title">Choose a plan to get started</h1>
      <div class="plans">
        <div v-for="plan in store.plans" :key="plan.id"
          :class="{plan: true, recommended: !activePlanId && matchingPlan.id === plan.id, active: activePlanId === plan.id}">
          <h3 v-if="activePlanId === plan.id">Current plan</h3>
          <h3 v-else-if="!activePlanId && matchingPlan.id === plan.id">Recommended</h3>
          <h1>{{plan.name}}</h1>
          <h2>${{plan.rate}} per month</h2>
          <ul class="features">
            <li v-for="(feature, index) in plan.features" v-text="feature" :key="index" class="feature"></li>
          </ul>
          <button v-if="activePlanId === plan.id" class="account"
            @click="$router.push('/account')">Review account</button>
          <button v-else-if="choosingPlan === plan.id" class="loading">Subscribing...</button>
          <button v-else @click="choosePlan(plan)">Subscribe to {{plan.name}}</button>
        </div>
      </div>
      <div class="estimated-bill">
        <h1>Estimate your bill</h1>
        <div class="estimate">
          <p>If you subscribe to the</p>
          <div class="select-plan">
            <select v-model="estimatedPlanId">
              <option v-for="plan in store.plans" :key="plan.id" :value="plan.id">{{plan.name}}</option>
            </select>
          </div>
          <p>plan and use <input type="number" v-model.number="estimatedRequests"> requests,
          your bill will be <span v-text="estimatedTotalCost"></span>.
          </p>
        </div>
      </div>
    </div>
  </section>
</template>

<script>
/**
 * Pricing.vue
 * Stripe Billing demo. Created by Michael Glukhovsky (@mglukhovsky).
 *
 * Top-level component that shows Typographic's plans and a bill estimate.
 */

import axios from 'axios';
import store from '../store';

export default {
  name: 'Pricing',
  data() {
    return {
      store,
      estimatedRequests: 0,
      estimatedPlanId: store.plans[0].id,
      choosingPlan: null,
    };
  },
  mounted() {
    // Reset the button state
    this.choosingPlan = null;
    // Calculate our estimate. First see if we have an active plan:
    if (this.activePlanId) {
      this.estimatedPlanId = this.activePlanId;
      if (store.subscription) {
        this.estimatedRequests = store.subscription.meteredUsage;
      }
    } else if (this.matchingPlan) {
      // Otherwise, if we have a matching plan, base our estimates on that plan
      this.estimatedPlanId = this.matchingPlan.id;
      if (this.matchingPlan.numRequests) {
        this.estimatedRequests = this.matchingPlan.numRequests;
      }
    }
  },
  computed: {
    // Return the id of a plan appropriate for the user's needs (based on the number of fonts)
    matchingPlan: function() {
      let numFonts = store.selectedFonts.length;
      // No fonts picked: pick the basic plan
      if (numFonts === 0) {
        return store.plans[0];
      }
      // Find the first plan that supports more fonts than we've picked
      let matchingPlan;
      for (let plan of store.plans) {
        // Try to find the smallest plan with enough fonts for the user
        if (plan.maxFonts >= numFonts) {
          matchingPlan = plan;
        }
      }
      // As a last option, provide the unlimited plan (no maximum defined)
      if (!matchingPlan) {
        matchingPlan = store.plans.find(plan => plan.maxFonts === null);
      }
      // Set the pricing calculator to use this plan's number of allotted requests
      this.estimatedRequests = matchingPlan.numRequests;
      return matchingPlan;
    },
    // Get the id of the active plan
    activePlanId: function() {
      if (!store.subscription) {
        return null;
      }
      return store.subscription.plan;
    },
    // Get the number of selected fonts
    numFonts: function() {
      const num = store.selectedFonts.length;
      return `${num} font${num > 1 ? 's' : ''}`;
    },
    // Get the monthly estimate for the pricing calculator
    estimatedTotalCost: function() {
      // Calculate if we have any extra requests to account for
      let extraRequests =
        this.estimatedRequests - this.matchingPlan.numRequests;
      if (extraRequests < 0) {
        extraRequests = 0;
      }
      // Calculate the estimated total
      const total =
        0.01 * extraRequests + store.getPlan(this.estimatedPlanId).rate;

      // Format the number as currency
      const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      });

      return formatter.format(total);
    },
  },
  watch: {},
  methods: {
    // Change the plan of the existing subscription
    async choosePlan(plan) {
      // Update the button loading state
      this.choosingPlan = plan.id;

      // This is a new user (unauthenticated), so forward them to the login page
      if (!store.authenticated) {
        this.$router.push({
          name: 'login',
          params: {
            newAccount: true,
            desiredPlan: plan.id,
          },
        });
      } else {
        // This is an existing user, so update their subscription
        try {
          await store.updateSubscription(plan.id);
          // Show the account view
          this.$router.push({name: 'account'});
        } catch (e) {
          console.log(`Error choosing plan: ${e}`);
        }
      }
      this.choosingPlan = null;
    },
  },
};
</script>

<style scoped>
.pricing {
  display: flex;
}

.pricing-overview {
  flex-grow: 1;
}

h1.title {
  font-size: 32px;
  font-weight: 400;
  margin: 0;
  text-align: center;
}

.plans {
  display: flex;
  align-items: center;
  margin-top: 45px;
}

.plans h1 {
  font-weight: 500;
  font-size: 20px;
  margin: 0;
  margin-bottom: 8px;
}

.plans h2 {
  margin: 0;
  font-weight: 400;
  font-size: 15px;
}

.plan {
  flex-grow: 1;
  padding: 25px 15px;
  background: #424770;
  text-align: center;
  margin-right: 30px;
  border-top: 3px solid transparent;
  box-shadow: 0 1px 6px 0 rgba(50, 50, 93, 0.15);
  border-radius: 4px;
}

.plan:last-child {
  margin-right: 0;
}
.plan.recommended,
.plan.active {
  flex-grow: 2;
  border-top: 3px solid #d782d9;
  box-shadow: 0 15px 35px 0 rgba(50, 50, 93, 0.1),
    0 5px 15px 0 rgba(0, 0, 0, 0.07);
  padding-top: 20px;
  padding-bottom: 56px;
}

.plan.recommended h3,
.plan.active h3 {
  margin-top: 0;
  margin-bottom: 22px;
  color: #f6a4eb;
  text-transform: uppercase;
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.5;
}

.plan .features {
  margin-top: 20px;
  margin-bottom: 32px;
  padding: 0;
  list-style-type: none;
  color: #cfd7df;
}

.plan .feature {
  line-height: 30px;
}

.plan:last-child {
  border-right: none;
}

.plan button {
  background: #525f7f;
  color: white;
  min-width: 190px;
  margin: 0 auto;
}

.plan button.account {
  font-weight: 500;
  background: url('/assets/icons/arrow.svg') center right 17px no-repeat,
    #d782d9;
  padding-right: 50px;
}

.plan button.account:active {
  background: url('/assets/icons/arrow.svg') center right 17px no-repeat,
    #cf6bd2;
}

.plan.recommended button {
  background: #d782d9;
}

.plan button:active,
.plan button.loading {
  background: #485370;
}

.plan.recommended button:active,
.plan.recommended button.loading {
  background: #cf6bd2;
}

.estimated-bill {
  border: thin solid #6b7c93;
  border-radius: 4px;
  margin-top: 30px;
  padding: 32px 20px;
  text-align: center;
}

.estimated-bill h1 {
  font-weight: 500;
  margin-top: 0;
  margin-bottom: 32px;
  font-size: 20px;
}

.estimate > * {
  display: inline-block;
}

.estimate select,
.estimate input {
  font-size: 15px;
  background: white;
  color: #525f7f;
  border-radius: 4px;
  padding: 10px;
  border: none;
  outline: none;
}

.estimate .select-plan,
.estimate input {
  margin: 0 5px;
}

.estimate input {
  width: 100px;
}

.estimate .select-plan {
  background: no-repeat right 10px center white
    url('/assets/icons/select-arrows.svg');
  border-radius: 4px;
  min-width: 120px;
  text-align: left;
}

.estimate select {
  -webkit-appearance: none;
  -moz-appearance: none;
  background: transparent;
  width: 100%;
}

.estimate select::-ms-expand {
  display: none;
}
</style>
