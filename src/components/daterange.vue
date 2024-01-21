<template>
    <v-menu ref="menu" v-model="menu" :close-on-content-click="false" transition="scale-transition" offset-y>
        <template v-slot:activator="{ props }">
            <v-text-field v-model="dateRangeText" label="Dates" readonly v-bind="props"></v-text-field>
        </template>
        <v-date-picker v-model="dates" no-title bg-color="black" multiple="range">
			<template #actions>
			<div>
				<v-btn
                    variant="text"
                    @click="menu=false"
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
            type: [Array],
            required: true,
        },
    },
    emits: ["update:modelValue"],
    data: () => ({
        menu: false,
        dates: [],
    }),
    methods: {
        parseDate: function (dateString) {
            const date = new Date(dateString);
            console.log(date)
            if(!date) {
                return;
            }

            const year = date.getFullYear();
            const month = date.getMonth() + 1;
            const day = date.getDate();
            const formattedMonth = month.toString().padStart(2, '0');
            const formattedDay = day.toString().padStart(2, '0');
            return `${year}-${formattedMonth}-${formattedDay}`;
        }
    },
    watch: {
        dates: function (newVal) {            
            if (!newVal[1] && newVal[0]) {
                newVal[1] = newVal[0];
            }

            this.$emit('update:modelValue', newVal);
        }
    },
    computed: {
        dateRangeText() {
            return this.modelValue[0] ? this.parseDate(this.modelValue[0]) + ' - ' + this.parseDate(this.modelValue[this.modelValue.length-1]) : '-';
        },
    },
}
</script>