<template>
  <div>
    <div id="app">
      <AppNav></AppNav>
      <router-view></router-view>
    </div>
    <footer>
      <Banner></Banner>
    </footer>
  </div>
</template>

<script>
/**
 * Typographic.vue
 * Stripe Billing demo. Created by Michael Glukhovsky (@mglukhovsky).
 *
 * Main component for our Vue app. We include the router's view here.
 */

import AppNav from './AppNav.vue';
import Banner from './Banner.vue';
import WebFont from 'webfontloader';

WebFont.load({
  google: {
    families: ['Roboto:200,300,400,500,600,700'],
  },
});

export default {
  name: 'Typographic',
  components: {AppNav, Banner},
};
</script>

<style>
/* Global styles for the rest of the app */
body {
  margin: 0;
  background: #53607e;
  color: #fff;
  font-family: 'Roboto', sans-serif;
  font-size: 15px;
  -moz-osx-font-smoothing: grayscale;
  -webkit-font-smoothing: antialiased;
}

#app {
  margin: 0 auto;
  max-width: 960px;
  margin-bottom: 100px;
}

footer {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 20px;
}

a {
  text-decoration: none;
  color: #f6a4eb;
  cursor: pointer;
}

button,
input {
  margin: 0;
  padding: 0;
  border: none;
  font: inherit;
  line-height: normal;
  outline: unset;
}

input {
  border: thin solid #ccc;
  padding: 4px;
  border-radius: 3px;
}

input:-webkit-autofill:hover, 
input:-webkit-autofill:focus
input:-webkit-autofill {
  background:transparent;
}

button {
  position: relative;
  border-radius: 4px;
  color: black;
  font-size: 15px;
  font-weight: 500;
  padding: 0 20px;
  height: 48px;
  cursor: pointer;
}

button.loading {
  padding-left: 35px;
  position: relative;
}

button.loading:before, button.loading:after {
  position: absolute;
  display: block;
  content: '';
  width: 17px;
  height: 17px;
  border-radius: 50%;
  background-color: #efefef;
  opacity: 0.6;
  position: absolute;
  top: 50%;
  margin-top: -9px;
  left: 16px;
  
  -webkit-animation: bounce 2.2s infinite ease-in-out;
  animation: bounce 2.2s infinite ease-in-out;
}

button.loading:after {
  -webkit-animation-delay: -1.0s;
  animation-delay: -1.0s;
}

@-webkit-keyframes bounce {
  0%, 100% { -webkit-transform: scale(0.0) }
  50% { -webkit-transform: scale(1.0) }
}

@keyframes bounce {
  0%, 100% { 
    transform: scale(0.0);
    -webkit-transform: scale(0.0);
  } 50% { 
    transform: scale(1.0);
    -webkit-transform: scale(1.0);
  }
}

</style>
