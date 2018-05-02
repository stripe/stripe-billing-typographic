<template>
  <section class="font-sample" :class="{'active': usingFont}">
    <header>
      <p class="font-name">{{font.name}}</p>
      <button :class="{'add': !usingFont, 'remove': usingFont}" @click="addOrRemoveFont()"></button>
    </header>
    <p class="sample" :style="fontStyle">{{store.fontSample}}</p>
  </section>
</template>

<script>
/**
 * FontSample.vue
 * Stripe Billing demo. Created by Michael Glukhovsky (@mglukhovsky).
 *
 * One individual font sample the user can choose.
 */

import store from '../store';

export default {
  name: 'FontSample',
  props: ['font'],
  data() {
    return {store};
  },
  computed: {
    fontStyle: function() {
      return `font-family: ${this.font.name}; font-size: ${store.fontSize};`;
    },
    usingFont: function() {
      return store.selectedFonts.includes(this.font.id);
    },
  },
  methods: {
    // Adds or removes the font, based on whether we're using it
    addOrRemoveFont: async function() {
      // Not using it yet, so add the font
      if (!this.usingFont) {
        store.selectedFonts.push(this.font.id);
      } else {
        // Already using it, so remove the font
        store.selectedFonts = store.selectedFonts.filter(
          font => font != this.font.id
        );
      }

      // If we're authenticated and have some fonts selected, update the server
      if (store.authenticated) {
        const updated = await store.saveFonts();
      }
    },
  },
};
</script>

<style scoped>
.font-sample {
  border-top: thin solid #8898aa;
  padding: 35px 0;
  overflow: hidden;
  transition: border-color 0.1s ease-in;
}

.font-sample.active {
  border-top: 1px solid #f5a6ea;
}

header {
  display: flex;
}

.font-name {
  flex-grow: 1;
  text-transform: uppercase;
  font-size: 12px;
  color: #cfd7df;
  font-weight: 500;
  margin-top: 0;
  letter-spacing: 0.5;
}

p.sample {
  margin: 0;
  overflow-wrap: break-word;
  text-overflow: ellipsis;
}

button {
  position: relative;
  width: 30px;
  height: 30px;
  transition: transform 0.2s ease-out, background-image 0s;
}

button.add {
  background: url('/assets/icons/add.svg') center center no-repeat, transparent;
}

button.remove {
  background: url('/assets/icons/remove.svg') center center no-repeat,
    transparent;
  transform: rotate(90deg);
}
</style>