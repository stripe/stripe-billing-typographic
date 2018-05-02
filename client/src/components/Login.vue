<template>
  <section class="login">
    <h1 v-if="createAccount" class="title">Create an account</h1>
    <h1 v-else class="title">Sign into your account</h1>
    <p v-if="$route.query.redirect" class="login-required">You need to sign in first.</p>
    <p v-if="error" class="error" v-text="error"></p>
    <form @submit.prevent="login(createAccount)">
      <div class="fields">
        <div class="field">
          <label for="email">Email</label>
          <input type="text" v-model="email" name="email" ref="email" placeholder="jane@typographic.io">
        </div>
        <div class="field">
          <label for="pw">Password</label>
          <input type="password" v-model="password" name="password">
        </div>
      </div>
      <p v-if="createAccount">
        <button v-if="loggingIn" class="submit loading">Creating account...</button>
        <button v-else type="submit" class="submit">Create account</button>
      </p>
      <p v-else>
        <button v-if="loggingIn" class="submit loading">Signing in...</button>
        <button v-else type="submit" class="submit">Sign in</button>
      </p>
      <p class="caption" v-if="createAccount">
        Already have an account? <a href="#" @click="createNewAccount(false)">Sign in now.</a>
      </p>
      <p class="caption" v-else>
        Don't have an account? <a href="#" @click="createNewAccount(true)">Create one now.</a>
      </p>
    </form>
   </section>
</template>

<script>
/**
 * Login.vue
 * Stripe Billing demo. Created by Michael Glukhovsky (@mglukhovsky).
 *
 * Top-level component that allows the user to create a new account or log in
 * to an existing one.
 */

import axios from 'axios';
import store from '../store';
import auth from '../auth';

export default {
  name: 'Login',
  data() {
    return {
      store,
      createAccount: false,
      desiredPlan: null,
      email: '',
      password: '',
      error: false,
      loggingIn: false
    };
  },
  mounted: function() {
    // Resetting button state
    this.loggingIn = false
    // Take keyboard focus
    this.focus();
    // Check the route params: we optionally create a new account
    if (this.$route.params.newAccount) {
      this.createAccount = true;
      this.desiredPlan = this.$route.params.desiredPlan;
    }
  },
  methods: {
    // Login (or signup) for an existing account
    async login(creatingNewAccount = false) {
      const email = this.email;
      const password = this.password;

      if (!email || !password) {
        this.error = 'Username and password are required.';
        return;
      }
      // Are we logging in or creating an account? Pick the right API route
      let apiRoute = '/auth/login';
      if (creatingNewAccount) {
        apiRoute = '/auth/signup';
      }

      // Update the button state
      this.loggingIn = true
      try {
        // Server: create a new account / log in with the provided credentials
        //   - returns a JWT token for the user.
        const authResponse = await axios.post(apiRoute, {email, password});
        // Authentication success
        store.authenticated = true;
        // Store the JWT from the server
        auth.setToken(authResponse.data.token);
        // Local store: update the user from the API
        const updatedUser = await store.fetchUser();
        // Update the fonts being used on the server
        const updatedFonts = store.saveFonts();

        // If the customer is creating a new account with a selected plan,
        // create the subscription (i.e. they were brought to the login view
        // from the pricing page)
        if (this.desiredPlan) {
          await store.createSubscription(this.desiredPlan)
          // Show the payment view
          this.$router.push({name: 'payment'});
        }
      } catch (e) {
        // Reset the button state
        this.loggingIn = false
        // Default error message
        console.log(e);
        this.error = 'A server error occurred.';
        // Share the error message from the server if we have it
        if (e.response && e.response.data && e.response.data.message) {
          this.error = e.response.data.message;
        }
      }

      if (creatingNewAccount) {
        // If the login page is redirected from the Pricing component, subscribe the user to
        // the desired plan
        if (this.desiredPlan) {
          await store.updateSubscription(this.desiredPlan)
        }
        // New accounts should proceed to the pricing view
        this.$router.push('pricing');
      } else {
        // Redirect the route, or go to the user's account page)
        this.$router.replace(this.$route.query.redirect || 'account');
      }
    },
    // Focus on the email input field
    focus() {
      this.$refs.email.focus();
    },
    // Shows either the `Login` or `Create new account` tabs
    createNewAccount(createAccount) {
      this.error = false;
      this.createAccount = createAccount;
      this.focus();
    },
  },
};
</script>

<style scoped>
.login {
  text-align: center;
}

h1.title {
  font-size: 32px;
  font-weight: 400;
  margin-top: 0;
  margin-bottom: 20px;
}

form {
  max-width: 420px;
  margin: 30px auto 0;
}

form .fields {
  background: white;
  border-radius: 4px;
  color: #525f7f;
}

form .field {
  display: flex;
  align-items: center;
  padding: 16px 32px;
  margin: 0;
  border-bottom: thin solid #e6ebf1;
}

form .field:last-child {
  border-bottom: 0;
}

button.submit {
  background: #d782d9;
  color: white;
  margin: 0 auto;
  width: 100%;
  height: 50px;
  text-align: center;
}

button.submit:active,
button.submit.loading {
  background: #d167d3;
}

label {
  min-width: 100px;
  display: block;
  font-weight: 500;
  text-align: left;
}

input {
  border: 0;
  flex-grow: 1;
}

input[type="text"]::placeholder {
  color: #8898AA;
}

p.caption {
  text-align: center;
  margin-top: 20px;
}

.error {
  color: #f6a4eb;
}
</style>
