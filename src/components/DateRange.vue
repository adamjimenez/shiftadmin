<template>
    <v-menu ref="menu" v-model="menu" :close-on-content-click="false" transition="scale-transition" offset-y>
        <template v-slot:activator="{ props }">
            <v-text-field v-model="dateRangeText" :label="label" readonly v-bind="props" hide-details></v-text-field>
        </template>
        <v-card v-bind="$attrs">
            <v-container>
                <v-row>
                    <v-col>
                        <v-list v-model:selected="special">
                            <v-list-item value="custom">
                                Custom
                            </v-list-item>
                            <v-list-item value="last7d">
                                Last 7 days
                            </v-list-item>
                            <v-list-item value="last28d">
                                Last 28 days
                            </v-list-item>
                            <v-list-item value="today">
                                Today
                            </v-list-item>
                            <v-list-item value="yesterday">
                                Yesterday
                            </v-list-item>
                            <v-list-item value="thismonth">
                                This month
                            </v-list-item>
                            <v-list-item value="lastmonth">
                                Last month
                            </v-list-item>
                            <v-list-item value="thisyear">
                                This year
                            </v-list-item>
                            <v-list-item value="lastyear">
                                Last year
                            </v-list-item>
                        </v-list>
                    </v-col>
                    <v-date-picker v-model="value" no-title multiple="range" :first-day-of-week="1"></v-date-picker>
                </v-row>
            </v-container>
        </v-card>
    </v-menu>
</template>

<script>
export default {
    name: "DateRange",
    props: {
        modelValue: {
            type: [String, Array],
        },
        label: String,
    },
    emits: ["update:modelValue"],
    data: () => ({
        special: ['custom'],
        menu: false,
        value: [],
        specialPressed: false,
        ready: false,
    }),
    methods: {
        parseDate: function (dateString) {
            const date = new Date(dateString);

            if (!date) {
                return;
            }

            const year = date.getFullYear();
            const month = date.getMonth() + 1;
            const day = date.getDate();
            const formattedMonth = month.toString().padStart(2, '0');
            const formattedDay = day.toString().padStart(2, '0');
            return `${year}-${formattedMonth}-${formattedDay}`;
        },
        createDateRange: async function () {
            let modelValue = this.modelValue;
            let value;

            const today = new Date();
            const year = today.getFullYear();
            const month = today.getMonth();

            if (typeof modelValue === 'string') {
                switch (modelValue) {
                    case 'today':
                        value = [today];
                    break;
                    case 'yesterday':
                        value = [new Date(Date.now() - 1 * 86400000)];
                    break;
                    case 'thismonth':
                        value = [new Date(year, month, 1), new Date(year, month + 1, 0)];
                    break;
                    case 'lastmonth':
                        value = [new Date(year, month - 1, 1), new Date(year, month, 0)];
                    break;
                    case 'thisyear':
                        value = [new Date(year, 0, 1), new Date(year, 11, 31)];
                    break;
                    case 'lastyear':
                        value = [new Date(year-1, 0, 1), new Date(year-1, 11, 31)];
                    break;
                }

                if (!value) {
                    const match = modelValue.match(/^last([0-9]+)d$/);

                    if (match) {
                        const daysAgo = parseInt(match[1]) - 1;
                        value = [new Date(Date.now() - daysAgo * 86400000), today];
                    } else {
                        value = [modelValue];
                    }
                } else {
                    this.special = [modelValue];
                }
            } else {
                value = modelValue;
            }

            if (!value?.[0]) {
                return false;
            }

            // default search field values
            let currentDate = new Date(value[0]);
            let endDate = new Date(value[value.length-1]);

            // account for daylight saving
            endDate.setHours(currentDate.getHours());

            let days = [];
            while (currentDate <= endDate) {
                days.push(new Date(currentDate));
                currentDate.setDate(currentDate.getDate() + 1);
            }

            this.specialPressed = true;

            if (this.special[0] !== 'custom' || !this.ready) {
                this.value = days;
                this.ready = true;
            }
            
            await this.$nextTick();
            this.specialPressed = false;
        },
        formatDate: function(dateString) {            
            const date = new Date(dateString);

            return date.toLocaleDateString('en-GB', {
                weekday: 'short', // "Tue"
                month: 'short',   // "Apr"
                day: 'numeric',   // "2"
                year: 'numeric'   // "2024"
            }).replace(',', '');
        }
    },
    watch: {
        special: function (newVal) {
            if (newVal[0] === 'custom') {
                if (!Array.isArray(this.modelValue)) {
                    this.$emit('update:modelValue', [this.value[0], this.value[this.value.length - 1]]);
                }

                return;
            }
            
            this.$emit('update:modelValue', newVal[0]);
        },
        value: function (newVal) {
            let modelValue;

            if (!this.specialPressed) {
                this.special = ['custom'];
            }

            if (this.special[0] !== 'custom') {
                modelValue = this.special[0];
            } else if (newVal[0]) {
                modelValue = [this.parseDate(newVal[0]), this.parseDate(newVal[newVal.length - 1])];
            } else {
                modelValue = null;
            }

            if (JSON.stringify(modelValue) != JSON.stringify(this.modelValue)) {
                this.$emit('update:modelValue', modelValue);
            }
        },
        modelValue: function () {
            // convert to full date array
            this.ready = false;
            this.createDateRange();
        }
    },
    computed: {
        dateRangeText() {
            let label = '';
            
            if (!this.modelValue?.[0]) {
                return '-';
            }

            if (this.special[0] !== 'custom') {
                return this.special[0];
            }
            
            label += this.formatDate(this.modelValue[0]);
            
            if (this.modelValue[0] !== this.modelValue[this.modelValue.length-1]) {
                label += ' - ' + this.formatDate(this.modelValue[this.modelValue.length-1]);
            }
            
            return label;
        },
    },
    mounted: function () {
        this.createDateRange();
    }
}
</script>