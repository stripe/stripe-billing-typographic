<template>
  <header>
    <h1><router-link to="/"><span class="mark"></span>Typographic</router-link></h1>
    <h2 class="subtitle">Hand-picked webfonts for your next project</h2>
    <nav>
      <ul>
        <li><router-link to="/">Fonts</router-link></li>
        <li><router-link to="/pricing">Pricing</router-link></li>
        <template v-if="store.authenticated">
          <li class="account">
            <router-link to="/account">Account</router-link>
          </li>
          <li><a @click.prevent="logout()">Sign out</a></li>
        </template>
        <li v-else><router-link to="/login">Sign in</router-link></li>
      </ul>
    </nav>
  </header>
</template>

<script>
/**
 * AppNav.vue
 * Stripe Billing demo. Created by Michael Glukhovsky (@mglukhovsky).
 *
 * Navigation banner for our app.
 */

import store from '../store';

export default {
  name: 'AppNav',
  mounted() {
    document.addEventListener('click', this.hideMenu);
  },
  methods: {
    hideMenu: function() {
      this.showingDropdown = false;
    },
    toggleDropdown: function(e) {
      this.showingDropdown = !this.showingDropdown;
      e.stopPropagation();
    },
    logout: function() {
      store.logout();
    },
  },
  data() {
    return {
      store,
      showingDropdown: false,
    };
  },
};
</script>

<style scoped>
header {
  display: flex;
  align-items: baseline;
  padding: 40px 0;
  margin-bottom: 20px;
}

.mark {
  display: inline-block;
  width: 20px;
  height: 20px;
  background: url('/assets/icons/typographic.svg') no-repeat left bottom;
  margin-right: 5px;
}

h1 {
  font-size: 20px;
  font-weight: 600;
}

h1,
h2 {
  margin: 0;
  margin-right: 14px;
}

h1 a.router-link-exact-active {
  color: white;
}

h2 {
  font-weight: normal;
  font-size: 15px;
  color: white;
}

a {
  color: white;
  text-decoration: none;
  font-weight: 400;
}

a.router-link-exact-active {
  color: #f5a6ea;
  font-weight: 500;
}

nav ul {
  margin: 0;
  padding-left: 0;
}

nav li {
  list-style-type: none;
  display: inline-block;
  margin-right: 25px;
  font-size: 17px;
  font-weight: 300;
}

nav {
  flex-grow: 1;
  text-align: right;
}

nav .account {
  position: relative;
}

nav .account-menu {
  display: none;
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 10px;
  border: thin solid #efefef;
  border-radius: 3px;
  background: #fff;
  min-width: 120px;
  text-align: left;
}

nav .account-menu li {
  padding: 10px 12px;
  width: 100%;
  box-sizing: border-box;
  cursor: pointer;
}

nav .account-menu li a {
  display: block;
  width: 100%;
  color: #525f7f;
}

nav .account-menu li:hover {
  background: #efefef;
}

nav .account-menu.showing {
  display: block;
}

@media (max-width: 775px) {
  h2.subtitle {
    display: none;
  }
}
</style>
