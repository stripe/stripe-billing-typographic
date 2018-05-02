<template>
  <section class="font-picker">
    <header>
      <h1 class="title">
        <span v-if="numSelected === 0">Choose a font to get started</span>
        <span v-else>You’ve selected {{numSelected}} {{numSelected > 1 ? 'fonts' : 'font'}}.</span>
      </h1>
      <div class="choose-fonts" v-if="numSelected > 0">
        <button v-if="store.subscription" @click="$router.push('/account')">Review account</button>
        <button v-else @click="addFonts">Continue to pricing</button>
      </div>
    </header>
    <section class="controls">
      <div class="input-sample">
        <input name="sample-text" @input="changeSample($event)" 
          :placeholder="store.defaultFontSample" autofocus>
        <label for="sample-text">Preview text</label>
      </div>
      <div class="font-size">
        <input name="font-size" type="range" min="8" v-model="store.fontSize" max="80">
        <label for="font-size">Font size</label>
      </div>
    </section>
    <section class="font-samples">
      <FontSample v-for="font in store.fonts" :font="font" :key="font.name"></FontSample>
    </section>
  </section>
</template>

<script>
/**
 * FontPicker.vue
 * Stripe Billing demo. Created by Michael Glukhovsky (@mglukhovsky).
 *
 * Shows a grid of FontSamples the user can choose.
 */

import store from '../store';
import WebFont from 'webfontloader';
import FontSample from './FontSample.vue';

WebFont.load({
  google: {
    families: store.fonts.map(font => font.name),
  },
});

export default {
  name: 'FontPicker',
  data() {
    return {store};
  },
  components: {FontSample},
  computed: {
    numSelected: function() {
      return store.selectedFonts.length;
    },
  },
  mounted() {
    // Pick a random font sample when the component mounts
    store.defaultFontSample = store.randomQuote();
    store.fontSample = store.defaultFontSample;
  },
  methods: {
    changeSample: function(event) {
      const val = event.currentTarget.value;
      if (val.length > 0) {
        store.fontSample = val;
      } else {
        store.fontSample = store.defaultFontSample;
      }
    },
    addFonts: function() {
      if (!store.subscription) {
        this.$router.push('pricing');
      } else {
        this.$router.push('account');
      }
    },
  },
};
</script>

<style scoped>
header {
  display: flex;
  flex-direction: row;
  margin-bottom: 50px;
  align-items: center;
  min-height: 41px;
}

h1.title {
  flex-grow: 1;
  font-size: 32px;
  font-weight: 400;
  margin: 0;
  padding: 0;
  margin-right: 55px;
}

header .choose-fonts button {
  margin: 0 auto;
  height: 41px;
  background: url('/assets/icons/arrow.svg') center right 17px no-repeat,
    #d782d9;
  color: white;
  padding-right: 50px;
}

.font-samples {
  display: grid;
  grid-template-columns: 460px 460px;
  grid-auto-flow: row;
  grid-column-gap: 40px;
  grid-row-gap: 20px;
}

.controls {
  grid-area: header;
  display: flex;
  flex-direction: row;
  padding: 10px 0;
  margin-bottom: 50px;
  align-items: flex-end;
}

.controls label {
  display: block;
  margin-right: 10px;
  height: 20px;
  text-transform: uppercase;
  font-size: 12px;
  color: #cfd7df;
  font-weight: 400;
  margin-top: 25px;
}

.controls div.input-sample {
  flex-grow: 1;
  padding-right: 40px;
}

.controls div.font-size {
  flex-basis: 200px;
}

.controls input[name='sample-text'] {
  background: none;
  font-size: 20px;
  border-radius: 0;
  border: 0;
  border-bottom: 3px solid white;
  padding: 0 0 7px;
  width: 100%;
  outline: unset;
  color: white;
}

.controls input[name='sample-text']::placeholder {
  color: #b4b9c7;
}

.controls input[name='font-size'] {
  margin-top: 33px;
}

.controls input[type='range'] {
  -webkit-appearance: none;
  background: white;
  height: 3px;
  width: 100%;
  border-radius: 0;
  padding: 0;
  border: 0;
}

.controls input[type='range']:focus {
  outline: none;
}

.controls input[type='range']::-webkit-slider-thumb {
  -webkit-appearance: none;
  height: 24px;
  width: 24px;
  background: #fff;
  border-radius: 50%;
  margin-top: -2px;
  cursor: pointer;
  border: 3px solid #53607e;
}

.controls input[type='range']::-moz-range-thumb {
  height: 20px;
  width: 20px;
  background: #fff;
  border-radius: 50%;
  margin-top: -2px;
  cursor: pointer;
  border: 3px solid #53607e;
}

.controls input[type='range']::-ms-track {
  width: 100%;
  cursor: pointer;
  background: white;
  border-color: transparent;
  color: transparent;
}

.controls input[type='range']::-ms-fill-lower,
.controls input[type='range']::-moz-range-progress,
.controls input[type='range']::-webkit-progress-value {
  background-color: #d782d9;
}

.controls input[type='range']::-moz-range-track {
  background-color: white;
}

.font-sample {
  flex-basis: 450px;
}
</style>
