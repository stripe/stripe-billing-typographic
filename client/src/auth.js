/**
 * auth.js
 * Stripe Billing demo. Created by Michael Glukhovsky (@mglukhovsky).
 *
 * Frontend authentication: this manages our user authentication and JSON web
 * token (JWT) storage in the browser.
 */

import axios from 'axios';
import Vue from 'vue';
import jwtDecode from 'jwt-decode';

export default {
  // Try to retrieve our JSON web token (JWT) from the session storage
  token: sessionStorage.getItem('token'),
  // Check our token to make sure it's valid
  hasValidToken() {
    if (this.token) {
      // Decode the token and check its data. The `exp` property is a timestamp
      // when this token will expire.
      const decoded = jwtDecode(this.token);
      if (decoded.exp > Date.now()) {
        // The token expired, so log out the user.
        this.logout();
        return false;
      }
      return true;
    }
    return false;
  },
  // Store the JWT and user credentials
  setToken(token) {
    // Add the token to our session
    this.token = token;
    sessionStorage.setItem('token', token);
    // Include a header with outgoing requests
    this.setHeader();
  },
  // Log out the user
  logout() {
    // Remove the HTTP header that include the JWT token
    delete axios.defaults.headers.common['Authorization'];
    // Delete the token from our session
    sessionStorage.removeItem('token');
    this.token = null;
  },
  // Check if the user is logged in
  loggedIn() {
    return !!this.token;
  },
  // Instruct Vue to include a header with the JWT in every request
  setHeader() {
    if (this.hasValidToken()) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;
    }
  },
};
