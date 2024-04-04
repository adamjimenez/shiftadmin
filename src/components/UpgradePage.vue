<template>
    <v-container>
        <v-card class="d-flex flex-column">
            <v-card-text>

                <div class="text-h2 mb-5">
                    Effortless admin
                </div>

                <p>
                    Current license:
                    {{ data.edition }}
                </p>
                <p v-if="data.subscription_end != '0000-00-00'">
                    License end:
                    {{ formatDate(data.subscription_end) }}
                </p>
            </v-card-text>
        </v-card>

        <v-container class="pa-10">
            <v-row align-content="center" justify="center">
                <v-switch v-model="monthly" label="Pay Monthly" color="red" style="flex: 0 0 auto;">
                    <template v-slot:prepend>
                        <v-label>
                            Pay Annually
                        </v-label>
                    </template>
                </v-switch>
            </v-row>

            <v-row>
                <v-col v-for="edition in editions" :key="edition">
                    <v-card style="min-height: 340px;">
                        <v-card-title>
                            <div class="text-h4 mb-5">
                                {{ edition.name }}
                            </div>
                        </v-card-title>
                        <v-card-text>
                            <ul style="min-height: 100px;" class="mx-3">
                                <li v-for="feature, index in edition.features" :key="index">{{ feature }}</li>
                            </ul>

                            <div class="my-3">
                                <span class="text-h3"
                                    :style="edition.hosted ? 'text-decoration-line: line-through;' : ''">£{{
                                        monthly ? edition.monthlyPricing : edition.annualPricing }}</span> /mo
                            </div>

                            <div>
                                Save {{ Math.round(100 * ((edition.monthlyPricing - edition.annualPricing) /
                                    edition.monthlyPricing))
                                }}% annually
                            </div>
                        </v-card-text>

                        <v-card-actions>
                            <div v-if="edition.name === data.edition">
                                Your current version

                                <p v-if="edition.hosted" style="font-size: small; font-weight: bold;" class="mt-1">
                                    Hosting discount applied
                                </p>
                            </div>
                            <v-btn v-else color="primary" variant="flat" target="_blank"
                                :href="'https://www.paypal.com/cgi-bin/webscr?cmd=_xclick-subscriptions&business=adam%40shiftcreate%2ecom&item_name=GenieAdmin%20' + edition.name + (monthly ? '' : '%20(year)') + ' &item_number=' + data.id + '&no_shipping=1&no_note=1&currency_code=GBP&lc=GB&bn=PP%2dSubscriptionsBF&ap1=1&a3=' + (monthly ? edition.monthlyPricing : edition.annualPricing * 12) + '&p3=1&t3=Y&src=1&sra=1&notify_url=https:%2F%2Fgenieadmin.com%2Fpaypal'">Choose</v-btn>
                        </v-card-actions>

                    </v-card>
                </v-col>
            </v-row>

            <v-row class="justify-center mt-10">
                Checkout via <img src="https://shiftedit.s3.amazonaws.com/images/logos/paypal.svg">
            </v-row>
        </v-container>
    </v-container>
</template>

<script>
import util from "../services/util";

export default {
    data: () => ({
        data: {},
        error: "",
        monthly: false,
        editions: [
            {
                name: 'Starter',
                monthlyPricing: 8,
                annualPricing: 5,
                features: [
                    'CMS',
                    'Configuration area',
                    'File uploads',
                    'Search/ Advanced search',
                    'Event logs',
                ],
            },
            {
                name: 'Basic',
                monthlyPricing: 28,
                annualPricing: 20,
                features: [
                    'Everything in starter',
                    'Import/ export',
                    'Custom CMS buttons',
                    'Custom pages',
                ],
            },
            {
                name: 'Business',
                monthlyPricing: 100,
                annualPricing: 80,
                features: [
                    'Everything in basic',
                    'User privileges',
                    'Bulk editing',
                    'Reporting tool beta',
                ],
            },
        ]
    }),

    methods: {
        fetchData: async function () {
            const response = await fetch('https://genieadmin.com/api/?host=' + location.host);
            const data = await response.json();

            this.data = data;
        },
        formatDate: function (value) {
            return util.formatDate(value);
        }
    },

    mounted: async function () {
        await this.fetchData();
        this.editions.find(edition => edition.name === this.data.edition).hosted = this.data.hosted;
    }
};
</script>