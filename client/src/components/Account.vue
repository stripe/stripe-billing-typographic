<template>
    <div class="account-view">
        <h1 class="title">Account information</h1>
        <section class="subscription">
            <section class="account-item">
                <h2>Email</h2>
                <div class="details">{{store.email}}</div>
            </section>
            <section class="account-item">
                <h2>Plan</h2>
                <div class="details">
                    <p v-if="!store.subscription"> You haven’t <a class="change-plan" @click.prevent="changePlan()">signed up</a> for a plan yet. </p>
                    <template v-else>
                        <p>{{currentPlan.name}} plan, ${{currentPlan.rate}} per month</p>
                        <ul>
                            <li v-for="(feature, index) in currentPlan.features" v-text="feature" :key="index" class="feature"></li>
                        </ul>
                    </template>
                </div>
                <button class="update" @click.prevent="changePlan()">Change</button>
            </section>
            <section class="account-item">
                <h2>Payment</h2>
                <div class="details payment-details">
                    <template v-if="store.source">
                        <div :class="['card-brand', store.source.brand.toLowerCase()]"></div>
                        <p class="last4">&bull;&bull;&bull;&bull;{{store.source.last4}}</p>
                    </template>
                    <p v-else-if="store.subscription && store.subscription.billing === 'send_invoice'"> Invoices will be emailed at the end of the billing cycle. </p>
                    <p v-else>No payment source.</p>
                </div>
                <button class="update" @click.prevent="changePayment()">Change</button>
            </section>
            <section class="account-item">
                <h2>Billing cycle</h2>
                <div class="details">
                    <p v-if="store.subscription"> You’ll be billed <span :class="{'full': extraRequests > 0}" v-text="nextBillingEstimate"></span> on {{nextBillingCycle}}. </p>
                    <p v-else>You don’t have an active subscription.</p>
                </div>
                <button v-if="store.subscription" class="update" @click.prevent="cancelSubscription()">Cancel</button>
            </section>
            <template v-if="store.subscription">
                <section class="account-item">
                    <h2>Fonts</h2>
                    <div class="details">
                        <p v-if="store.selectedFonts.length === 0"> You haven’t chosen your <strong>{{currentPlan.maxFonts ? currentPlan.maxFonts : 'unlimited'}}
              included</strong> {{currentPlan.maxFonts === 1 ? 'font' : 'fonts' }}. </p>
                        <p v-else> You’ve chosen <strong>{{store.selectedFonts.length}} of your
              {{currentPlan.maxFonts ? currentPlan.maxFonts : 'unlimited'}} 
              included</strong> {{currentPlan.maxFonts === 1 ? 'font' : 'fonts' }}. </p>
                    </div>
                    <button class="update" @click.prevent="changeFonts()">Change fonts</button>
                </section>
                <section class="account-item requests">
                    <h2>Requests</h2>
                    <div class="details">
                        <p v-if="extraRequests <= 0"> You’ve used <strong>{{requests}} of your included {{numRequests}}</strong> requests this month.</p>
                        <template v-else>
                            <p>You’ve made <span class="full">{{requests}}</span> requests this month.</p>
                            <p> That’s <span class="full">{{extraRequests.toLocaleString(undefined)}}</span> more than your included <strong>{{numRequests}}</strong> requests. </p>
                        </template>
                        <div class="meter">
                            <div class="progress" :class="{full: extraRequests > 0}" :style="{width: requestPercentage+'%'}"></div>
                        </div>
                        <div class="upgrade-plan" v-if="extraRequests > 0">
                            <p>Want to increase your included requests?</p>
                            <button class="upgrade" @click="$router.push('/pricing')">Upgrade your plan</button>
                        </div>
                    </div>
                </section>
            </template>
        </section>
    </div>
</template>
