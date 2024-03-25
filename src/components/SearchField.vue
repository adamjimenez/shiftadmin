<template>
    <span>
        <v-checkbox v-if="['checkbox', 'deleted'].includes(type)" :label="label" v-model="value" :true-value="'1'" :false-value="'0'" />
        <v-select v-else-if="['select'].includes(type)" :label="label" :items="options" v-model="value" />
        <v-select v-else-if="['select_multiple'].includes(type)" :label="label" :items="options" v-model="value" multiple
            chips>
            <template v-slot:prepend>
                <v-select v-model="localFunc" :items="['in', 'not in']" hide-details />
            </template>
        </v-select>
        <v-autocomplete v-else-if="type === 'combo'" :label="label" v-model="value" :items="options"
            @update:search="updateCombo($event, column)" />
        <DateRange v-else-if="['date', 'datetime', 'timestamp'].includes(type)" :label="label" v-model="value" />
        <v-text-field v-else :label="label" v-model="value" :type="fieldType(type)" :step="fieldStep(type)">
            <template v-slot:prepend v-if="['id', 'decimal', 'int', 'rating'].includes(type)">
                <v-select v-model="localFunc" :items="['=', '>', '<']" hide-details />
            </template>
        </v-text-field>
    </span>
</template>

<script>
import api from "../services/api";
import util from "../services/util";
import DateRange from "./DateRange";

export default {
    name: "SearchField",
    components: {
        DateRange
    },
    props: {
        modelValue: {
            required: true,
        },
        label: String,
        column: null,
        type: null,
        optionConfig: null,
        func: null,
    },
    emits: ["update:modelValue", "updateFunc"],
    data: () => ({
        localFunc: null,
        value: null,
        options: [],
        ranges: [],
    }),
    methods: {
        fieldType(type) {
            switch (type) {
                case 'dob':
                case 'date':
                case 'timestamp':
                    return 'date';
                case 'int':
                case 'decimal':
                    return 'number';
                case 'datetime':
                    return 'datetime-local';
            }

            return ['email', 'password', 'dob', 'time'].includes(type) ? type : 'text'
        },
        fieldStep(type) {
            switch (type) {
                case 'int':
                    return 1;
                case 'decimal':
                    return '0.01';
            }
            return '';
        },
        updateCombo: async function (term, column) {
            const result = await api.get('?cmd=autocomplete&field=' + column + '&term=' + term);
            this.options = result.data.options;
        },
        getOptions: async function () {
            this.options = await util.getOptions(this.column, this.type, this.optionConfig, {});
        }
    },
    watch: {
        value: function (newVal) {
            this.$emit('update:modelValue', newVal);
        },
        localFunc: function (newVal) {
            this.$emit('updateFunc', this.column, newVal);
        },
        field: function () {
            this.getOptions();
        },
    },
    mounted: function () {
        this.getOptions();
        
        this.value = this.modelValue;
        this.localFunc = this.func;

        if (!this.localFunc) {
            if (['decimal', 'int', 'id', 'rating'].includes(this.type)) {
                this.localFunc = '=';
            }
        }
    }
}
</script>