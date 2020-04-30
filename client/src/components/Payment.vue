<template>
  <div class="payment-view">
    <h1 class="title">Choose how you’d like to pay</h1>
    <section class="payment">
      <section class="payment-item">
        <h2>Plan</h2>
        <div class="details">
          <template v-if="plan">
          <p>{{plan.name}}, ${{plan.rate}} per month</p>
            <ul>
              <li v-for="(feature, index) in plan.features" v-text="feature" :key="index" class="feature"></li>
            </ul>
          </template>
          <p v-else>No plan selected.</p>
        </div>
        <a class="update" @click.prevent="changePlan()">Change</a>
      </section>
      <section class="payment-item">
        <h2>Billing method</h2>
        <div class="details">
          <div class="payment-method">
            <input type="radio" value="card" v-model="paymentMethod" id="card">
            <label for="card">Add a credit or debit card</label>
          </div>
          <div class="payment-method">
            <input type="radio" value="sepa" v-model="paymentMethod" id="sepa" />
            <label for="sepa">Add a Sepa Direct Debit</label>
          </div>
          <div class="payment-method">
            <input type="radio" value="invoice" v-model="paymentMethod" id="invoice">
            <label for="invoice">Receive invoices to pay by card or bank transfer</label>
          </div>
        </div>
      </section>
      <section class="payment-item billing-details" v-show="paymentMethod === 'card'">
        <h2>Card details</h2>
        <div class="details">
          <template v-if="store.stripe">
            <div id="card-element"></div>
            <p v-show="cardElementsError" id="card-errors" v-text="this.cardElementsError"></p>
          </template>
        </div>
      </section><section class="payment-item billing-details" v-show="paymentMethod === 'sepa'">
        <h2>Sepa Direct Debit details</h2>
        <div class="details">
          <template v-if="store.stripe">
            <input
              type="text"
              class="customer-name"
              v-model="customerName"
              name="customerName"
              ref="customerName"
              placeholder="Jane Bold"
            />
            <div id="iban-element"></div>
            <p v-show="sepaElementsError" id="sepa-errors" v-text="this.sepaElementsError"></p>
          </template>
        </div>
      </section>
      <section class="payment-item billing-details" v-show="paymentMethod === 'invoice'">
        <h2>Billing details</h2>
        <div class="details">
          <p class="email">Invoices will be sent to {{store.email}}</p>
        </div>
      </section>
    </section>
    <button v-if="submittingPaymentMethod" class="submit loading">Saving payment method...</button>
    <button v-else-if="paymentMethod !== 'invoice'" class="submit" @click="updatePaymentMethod()">
      <span v-text="hasPaymentMethod ? 'Update' : 'Add'"></span> payment method
    </button>
    <button v-else-if="paymentMethod === 'invoice'" class="submit" @click="subscribeInvoices()">
      <span v-text="hasPaymentMethod ? 'Update' : 'Add'"></span> payment method
    </button>
  </div>
</template>

<script>
/**
 * Payment.vue
 * Stripe Billing demo. Created by Michael Glukhovsky (@mglukhovsky).
 *
 * Top-level component for choosing a payment method (with Stripe).
 */

import axios from 'axios';
import store from '../store';

export default {
  name: 'Payment',
  data() {
    return {
      store,
      paymentMethod: 'card',
      customerName: null,
      iban: null,
      card: null,
      cardElementsError: null,
      sepaElementsError: null,
      submittingPaymentMethod: false,
    };
  },
  async created() {
    if (!store.stripe) {
      await store.getStripeKey();
    }
  },
  mounted() {
    // Reset the button state
    this.submittingPaymentMethod = false;
    // Set a default payment method
    store.banner.paymentMethod = 'card';
    this.paymentMethod = 'card';
    // Create a Stripe Element if Stripe's library has been loaded
    if (store.stripe) {
      this.createElements();
      // Otherwise, set up a watcher so that when the library is loaded
      // we create our Element
    } else {
      this.$watch('store.stripe', this.createElements);
    }
  },
  beforeDestroy() {
    if (this.card) {
      this.card.unmount();
      this.card = null;
    }
  },
  computed: {
    // Whether this user has a payment method (invoices or card)
    hasPaymentMethod: function() {
      return (
        store.paymentMethod ||
        (store.subscription && store.subscription.collectionMethod === 'send_invoice')
      );
    },
    // Get the current plan from the local store
    plan: function() {
      if (store.subscription) {
        return store.getPlan(store.subscription.plan);
      }
      return null;
    },
  },
  watch: {
    // Update the banner based on the payment method
    paymentMethod: function() {
      store.banner.paymentMethod = this.paymentMethod;
    },
  },
  methods: {
    createElements() {
      if (!store.stripe) {
        return;
      }
      const elements = store.stripe.elements({
        // Use Roboto from Google Fonts
        fonts: [
          {
            cssSrc: 'https://fonts.googleapis.com/css?family=Roboto',
          },
        ],
        // Detect the locale automatically
        locale: 'auto',
      });
      // Define CSS styles for Elements
      const style = {
        base: {
          fontSize: '15px',
          fontFamily: 'Roboto',
          fontSmoothing: 'antialiased',
          color: '#525f7f',
          '::placeholder': {
            color: '#AAB7C4',
          },
        },
        // Styles when the Element has invalid input
        invalid: {
          color: '#cc5b7a',
          iconColor: '#cc5b7a'
        }
      };

      // Create the card element, then attach it to the DOM
      this.card = elements.create('card', {style});
      this.iban = elements.create('iban', {style, supportedCountries: ['SEPA']});
      this.card.mount('#card-element');
      this.iban.mount('#iban-element');
      // Add an event listener: check for error messages as we type
      this.card.addEventListener('change', ({error}) => {
        if (error) {
          this.cardElementsError = error.message;
        } else {
          this.cardElementsError = '';
        }
      });
      this.iban.addEventListener('change', ({error}) => {
        if (error) {
          this.sepaElementsError = error.message;
        } else {
          this.sepaElementsError = '';
        }
      });
    },
    // Update the payment method: receive invoices by email
    async subscribeInvoices() {
      // Update the button state
      this.submittingPaymentMethod = true;
      try {
        const response = await axios.post('/api/invoices/subscribe');
        // If we have an active subscription, update the billing method to use invoices
        if (store.subscription) {
          store.subscription.collectionMethod = 'send_invoice';
        }
        this.$router.push('account');
      } catch (e) {
        console.log(`Couldn't request an invoice: ${e}`);
      }
    },
    async updatePaymentMethod() {
      this.submittingPaymentMethod = true;
      try {
        const paymentMethod = this.paymentMethod === 'card' ? await this.updateCardPaymentMethod() : await this.updateSepaPaymentMethod()

        // Set payment method details in Store
        store.paymentMethod = {
          id: paymentMethod.id,
          type: paymentMethod.type,
          brand: paymentMethod.card ? paymentMethod.card.brand : null,
          last4: paymentMethod.card ? paymentMethod.card.last4 : null,
          sepa_debit_last4: paymentMethod.sepa_debit ? paymentMethod.sepa_debit.last4 : null,
        };

        // Update our local store and change to account view.
        if (store.subscription) store.subscription.collectionMethod = 'charge_automatically';

        this.$router.push('account');
      } catch (e) {
        this.submittingPaymentMethod = false;
        console.log(`Couldn't add payment method: ${e.message}`);
      }
    },
    async updateCardPaymentMethod() {
      // Create a new PaymentMethod object
      const { paymentMethod, error } = await store.stripe.createPaymentMethod('card', this.card);

      // If there's an error, print to screen
      if (error) {
        this.cardElementsError = error.message;
        throw error;
      }

      // Attach PaymentMethod to Subscription on back-end
      const { data } = await this.attachPaymentMethod(paymentMethod)

      // SetupIntent needs optimising
      if (data.clientSecret) {
        const result = await store.stripe.confirmCardSetup(data.clientSecret);

        if (result.error) {
          this.cardElementsError = result.error.message;
          throw result.error;
        }
      }
      return paymentMethod
    },
    async updateSepaPaymentMethod() {

      const { paymentMethod, error } = await store.stripe.createPaymentMethod({
        type: 'sepa_debit',
        sepa_debit: this.iban,
        billing_details: {
          name: this.customerName,
          email: store.email,
        }
      });

      // If there's an error, print to screen
      if (error) {
        this.sepaElementsError = error.message;
        throw error;
      }

      // Attach PaymentMethod to Subscription on back-end
      const { data } = await this.attachPaymentMethod(paymentMethod)

      // SetupIntent needs optimising
      if (data.clientSecret) {
        const result = await store.stripe.confirmSepaDebitSetup(data.clientSecret);

        if (result.error) {
          this.sepaElementsError = result.error.message;
          throw result.error;
        }
      }
      return paymentMethod
    },

    attachPaymentMethod(paymentMethod) {
      return axios.post('/api/subscription/payment_method', {
        paymentMethodId: paymentMethod.id,
      });
    },
    changePlan() {
      this.$router.push('pricing');
    },
  },
};
</script>

<style scoped>
h1.title {
  font-size: 32px;
  font-weight: 400;
  margin-top: 0;
  margin-bottom: 40px;
  text-align: center;
}

.payment-view {
  margin: 0 auto;
  width: 670px;
}

p {
  margin: 0;
}

ul {
  color: #8898aa;
  font-size: 15px;
  line-height: 32px;
  margin-top: 12px;
  margin-bottom: 0;
  padding-left: 0;
  list-style-type: none;
}

button.submit {
  color: white;
  background: #d782d9;
  width: 100%;
  font-weight: 600;
}

button.submit:active,
button.submit.loading {
  background: #d167d3;
}

.payment {
  background: white;
  border-radius: 4px;
  color: #525f7f;
  margin-bottom: 20px;
}

.payment-item {
  display: flex;
  flex-direction: row;
  border-top: thin solid #e6ebf1;
  padding: 20px 32px;
}

.payment-item:first-child {
  border-top: 0;
}

.payment-item h2 {
  margin: 0;
  font-size: 15px;
  font-weight: 500;
  flex-basis: 145px;
  padding-right: 10px;
}

.payment-item .details {
  flex-grow: 1;
  transition: height 0.1s linear;
}

.payment-item .update {
  color: #d782d9;
  cursor: pointer;
  font-weight: 500;
}

.payment-method {
  display: flex;
  margin-bottom: 20px;
  align-items: center;
}

.payment-method:last-child {
  margin-bottom: 0;
}


.customer-name {
  font-size: 15px;
  color: #525f7f;
  border: 0px;
  padding: 10px 0;
  margin-bottom: 10px;
}

.customer-name::placeholder {
  color: #AAB7C4;
}

#iban-element {
  margin-bottom: 20px;
}

.payment-method input {
  -webkit-appearance: none;
  -moz-appearance: none;

  border-radius: 50%;
  width: 16px;
  height: 16px;

  border: 7px solid white;
  transition: 0.2s all linear;
  outline: none;
  margin-right: 12px;
  box-shadow: 0 1px 0 0 #e6ebf1, 0 1px 6px 0 rgba(50, 50, 93, 0.3);

  position: relative;
}

.payment-method input:checked {
  border: 7px solid #d782d9;
  box-shadow: 0 2px 6px 0 rgba(50, 50, 93, 0.15);
}

#card-errors {
  margin-top: 20px;
  color: #cc5b7a;
}
</style>
