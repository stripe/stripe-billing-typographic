# Typographic: Stripe Billing Demo

Typographic is a sample web application for a hosted webfont service built with [Stripe Billing](https://stripe.com/billing) and [Elements](https://stripe.com/elements). This is a complete Stripe integration that subscribes users to [multiple plans][] (with monthly and [metered billing][]),  uses [tiered pricing][] , tracks [metered usage], and provides [invoices][].

[multiple plans]: https://stripe.com/docs/billing/subscriptions/multiplan
[metered billing]: https://stripe.com/docs/billing/subscriptions/metered-billing
[tiered pricing]: https://stripe.com/docs/billing/subscriptions/tiers
[metered usage]: https://stripe.com/docs/billing/subscriptions/metered-billing#reporting-usage
[invoices]: https://stripe.com/docs/billing/invoices

**You can try the app live at [typographic.io](https://typographic.io).**

## Overview

<img src="https://github.com/stripe/stripe-billing-typographic/blob/master/screenshots/typographic-screenshot.png?raw=true"/>

Typographic is a complete, full-stack example of a Stripe Billing integration:
<!-- prettier-ignore -->
|     |Features
:---: | :---
🗂|**Multiple plans.** Each level of service (Starter, Growth, and Enterprise) include monthly and metered plans.
💸|**Tiered pricing.** Metered plans use [tiered pricing](https://stripe.com/docs/billing/subscriptions/tiers) to build a sophisticated pay-as-you-go billing model with [graduated pricing](https://stripe.com/docs/billing/subscriptions/tiers#graduated).
📈|**Usage records.** Metered usage is tracked with the [Usage Record](https://stripe.com/docs/api#usage_records) API.
💌|**Hosted invoices.** Users can pay via credit card or receive a [hosted invoice]() by email.
📬|**Upcoming invoices.** Estimated costs for the next billing cycle are calculated using the [Invoices](https://stripe.com/docs/billing/invoices) API (based on [monthly](https://stripe.com/docs/billing/subscriptions/examples#simple-monthly-billing) and [metered usage](https://stripe.com/docs/billing/subscriptions/metered-billing)).
⚡️|**Products and Plans.** Typographic uses the Stripe [Products and Plans](https://stripe.com/docs/billing/subscriptions/products-and-plans) APIs.
💳|**Card payments with Elements.** This demo uses pre-built Stripe components customized to fit the app design, including the [Card Element](https://stripe.com/docs/elements) which provides real-time validation, formatting, and autofill.
🌏|**Vue.js frontend.** Single-page [Vue](https://vuejs.org) app demonstrating how to use Elements in a component-based web framework.
☕️|**Node.js backend.** An [Express](https://expressjs.com/) server manages billing and user data between the database and Stripe's API.
📦|**Database support.** Uses [Knex.js](http://knexjs.org/) and [SQLite](https://www.sqlite.org/index.html) (by default) to demonstrate a data modeling pattern for the [Billing](https://stripe.com/docs/billing/quickstart) API. 
🔑|**User authentication.** JSON web tokens ([JWT](https://jwt.io/)) and an Express authentication scheme are included for user login and registration.

## Stripe Billing Integration

This repository includes two components:
  - [Express server in Node.js][server] to create and manage subscriptions via an API.
  - [Vue.js application][client] with a front-end interface for the web service.

Here are a few key files where we interact with Stripe's platform:
  - [`server/models`][]: Defines our database models and includes all the server-side interaction with [Billing](https://stripe.com/billing) and [Sources](https://stripe.com/docs/sources).
  - [`server/models/Plan.js`][]: The [`setupPlans`][] method creates and manages the [Products and Plans](https://stripe.com/docs/billing/subscriptions/products-and-plans) for our Stripe account.
  - [`server/routes/stripeRoutes.js`][]: Express API routes for all payments and billing actions for our front-end app.
  - [`client/src/components/Payment.vue`][]: Vue front-end component for payment options, which includes an [Element](https://stripe.com/elements) to collect credit-card details.

[server]: https://github.com/stripe/stripe-billing-typographic
[client]: https://github.com/stripe/stripe-billing-typographic
[`server/models`]: https://github.com/stripe/stripe-billing-typographic/tree/master/server/models
[`server/models/Plan.js`]: https://github.com/stripe/stripe-billing-typographic/tree/master/server/models/Plan.js
[`setupPlans`]: https://github.com/stripe/stripe-billing-typographic/tree/master/server/models/Plan.js#L64
[`server/routes/stripeRoutes.js`]: https://github.com/stripe/stripe-billing-typographic/tree/master/server/routes/stripeRoutes.js
[`client/src/components/Payment.vue`]: https://github.com/stripe/stripe-billing-typographic/tree/master/client/src/components/Payment.vue

## Requirements

You'll need a Stripe account to manage customer subscriptions and payments. [Sign up for free][sign-up] before running the application.

Typographic also requires Node.js >=8.x to run this app.

[sign-up]: https://dashboard.stripe.com/register

## Getting Started

Install dependinces using npm (or yarn):

```
npm install
```

Copy the example .env file. You'll need to fill out two details:
- A random 20-character string that will be used to keep user authentication secure (with [JSON Web Tokens](https://jwt.io))
- Your own [Stripe API keys](https://dashboard.stripe.com/account/apikeys):

```
cp .env.example .env
```

If this is your first time running the app, you'll need to set up the app:
```
npm run setup
```

Run the app:
```
npm start
```

Go to [https://localhost:3000]() in your browser to start using Typographic.

## Resetting Data
If you'd like to wipe the slate clean and start with a fresh environment, you can [wipe all test data](https://dashboard.stripe.com/account/data) from your Stripe account, then rebuild your local database:

```
npm run setup
```

This recreates the tables Typographic uses in its local database.
## Credits
* Typographic code: [Michael Glukhovsky](http://twitter.com/mglukhovsky)
* Design: [Maddie Simens](http://maddie.io/)
* Fonts provided by [Google Fonts](https://fonts.google.com)
