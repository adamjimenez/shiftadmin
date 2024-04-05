<template>
    <div>
        <span>
            {{ formatValue(newVal) }}
        </span>
        <div v-if="oldVal">
            <span :class="perc < 0 ? 'text-red' : 'text-green'">
                <v-icon v-if="perc < 0">mdi-arrow-down</v-icon>
                <v-icon v-else>mdi-arrow-up</v-icon>
                {{ Math.abs(perc) + '%' }}
            </span>
        </div>
    </div>

</template>

<script>
export default {
    props: {
        newVal: null,
        oldVal: null,
        format: null,
    },
    data: function () {
        return {
            perc: '',
        }
    },
    methods: {
        formatValue: function (value) {
            let formatOptions = {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            };

            if (this.format === 'currency') {
                formatOptions.style = 'currency';
                formatOptions.currency = 'GBP';
            }

            return value.toLocaleString(undefined, formatOptions);
        },
        updatePercentage: function () {
            this.perc = (this.newVal - this.oldVal) / this.oldVal;
            this.perc = this.perc.toFixed(1);
        }
    },

    watch: {
        newVal: function () {
            this.updatePercentage();
        },
        oldVal: function () {
            this.updatePercentage();
        },
    }
}
</script>
