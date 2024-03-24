<template>
    <v-menu ref="menu" v-model="menu" :close-on-content-click="false" transition="scale-transition" offset-y>
        <template v-slot:activator="{ props }">
            <v-text-field v-model="dateRangeText" :label="label" readonly v-bind="props"></v-text-field>
        </template>
        <v-date-picker v-model="value" no-title bg-color="black" multiple="range" v-bind="$attrs">
			<template #actions>
                <div>
                    <v-btn
                        variant="text"
                        @click="menu = false"
                        text="OK"
                    />
                </div>
			</template>
        </v-date-picker>
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
        menu: false,
        value: [],
    }),
    methods: {
        parseDate: function (dateString) {
            const date = new Date(dateString);
            
            if(!date) {
                return;
            }

            const year = date.getFullYear();
            const month = date.getMonth() + 1;
            const day = date.getDate();
            const formattedMonth = month.toString().padStart(2, '0');
            const formattedDay = day.toString().padStart(2, '0');
            return `${year}-${formattedMonth}-${formattedDay}`;
        },
        createDateRange: function () {
            let value = this.modelValue;

            if (typeof value === 'string') {
                value = [value];
            }

            if (!value?.[0]) {
                return false;
            }

			// default search field values
            let currentDate = new Date(value[0]);
            let endDate = new Date(value[1]);
            let dates = [];

            while (currentDate <= endDate) {
                dates.push(new Date(currentDate));
                currentDate.setDate(currentDate.getDate() + 1);
            }

            this.value = dates;
        }
    },
    watch: {
        value: function (newVal) {
            let value;

            if (!newVal[0]) {
                value = null;
            } else {
                value = [this.parseDate(newVal[0]), this.parseDate(newVal[newVal.length - 1])];
            }

            if (JSON.stringify(value) != JSON.stringify(this.modelValue)) {
                this.$emit('update:modelValue', value);
            }
        },
        modelValue: function () {
            // convert to full date array
            this.createDateRange();
        }
    },
    computed: {
        dateRangeText() {
            return this.modelValue?.[0] ? this.parseDate(this.modelValue[0]) + ' - ' + this.parseDate(this.modelValue[this.modelValue.length-1]) : '-';
        },
    },
    mounted: function () {
        this.createDateRange();
    }
}
</script>
