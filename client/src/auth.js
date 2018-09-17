/**
 * auth.js
 * Stripe Billing demo. Created by Michael Glukhovsky (@mglukhovsky).
 *
 * Frontend authentication: this manages our user authentication and session
 * token storage in the browser.
 */

import axios from 'axios';
import Vue from 'vue';

export default {
  // Try to retrieve our session token
  token: sessionStorage.getItem('token'),
  // Store the session token
  setToken(token) {
    // Add the token to our session
    this.token = token;
    sessionStorage.setItem('token', token);
    // Include a header with outgoing requests
    this.setHeader();
  },
  // Remove the session token locally
  clearToken() {
    // Remove the HTTP header that include the session token
    delete axios.defaults.headers.common['Authorization'];
    // Delete the token from our session
    sessionStorage.removeItem('token');
    this.token = null;
  },
  // Log out the user
  async logout() {
    try {
      await axios.post('/auth/logout');
    } catch (e) {
      console.warn(e);
    }
    this.clearToken();
  },
  // Check if the user is logged in
  loggedIn() {
    return !!this.token;
  },
  // Instruct Vue to include a header with the session token in every request
  setHeader() {
    if (this.loggedIn()) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;
    }
  },
};
