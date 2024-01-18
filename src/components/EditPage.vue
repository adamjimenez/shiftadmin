<template>
    <v-card style="overflow: scroll;" :loading="loading">
        <v-card-actions>
            <v-btn title="Back" icon="mdi-arrow-left" to="./"></v-btn>
            <v-btn title="Save" icon="mdi-content-save" @click="save"></v-btn>
        </v-card-actions>
        <v-form>
            <v-list min-width="600">
                <template v-for="(value, key, index) in fields" :key="index">
                    <v-list-item v-if="!['id', 'timestamp', 'deleted'].includes(value.type)">
                        <v-checkbox v-if="value.type === 'checkbox'" :label="key" v-model="data[key]"
                            :error-messages="errors[key]"></v-checkbox>
                        <v-file-input v-else-if="['file', 'files'].includes(value.type)" :label="key" v-model="data[key]"
                            :error-messages="errors[key]" :multiple="value.type === 'files'"></v-file-input>
                        <v-textarea v-else-if="value.type === 'textarea'" :label="key" v-model="data[key]"
                            :error-messages="errors[key]"></v-textarea>
                        <div v-else-if="value.type === 'rating'">
                            <div class="px-3">{{ key }}</div>
                            <v-rating v-model="data[key]" :error-messages="errors[key]" hover :length="5" :size="32">
                            </v-rating>
                        </div>
                        <v-select v-else-if="value.type === 'select'" :label="key" v-model="data[key]"
                            :error-messages="errors[key]" :items="options[key]"></v-select>
                        <v-text-field :label="key" v-model="data[key]" :error-messages="errors[key]"
                            :rules="rules[value.type] ? [rules[value.type]] : []" :type="fieldType(value.type)"
                            :step="fieldStep(value.type)" autocomplete="new-password"
                            v-else-if="key !== 'id'"></v-text-field>
                    </v-list-item>
                </template>
            </v-list>
        </v-form>
    </v-card>
</template>

<script>
import api from "../services/api";
import util from "../services/util";

export default {
    props: {
        vars: null,
    },
    data: function () {
        return {
            data: {},
            fields: [],
            section: '',
            id: 0,
            loading: false,
            errors: {},
            options: {},
            rules: {
                required: value => !!value || 'Required',
                ip: v => (!v || /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(v)) || 'Invalid IP address',
                email: v => (!v || /.+@.+\..+/.test(v)) || 'Invalid email',
            },
        };
    },
    methods: {
        fetchData: async function () {
            var data = {
                cmd: 'get',
                section: this.section,
                id: this.id
            };
            const result = await api.post('?section=' + this.section, data);

            if (!result) {
                return false;
            }

            this.fields = result.data.fields;

            if (result.data.data) {
                let data = result.data.data;

                for (const [name, field] of Object.entries(this.fields)) {
                    if (field.type === 'password') {
                        data[name] = '';
                    }
                    if (field.type === 'checkbox') {
                        data[name] = this.data[name] = this.data[name] > 0 ? true : false;
                    }
                    if (['file', 'files'].includes(field.type)) {
                        data[name] = [];
                    }

                    // get options
                    if (field.type === 'select') {
                        let option = this.vars.options[field.column.replaceAll('_', ' ')];
                        this.options[name] = util.getOptions(option);
                    }
                }

                this.data = data;
            }

            // parent fields
            if (!this.id) {
                const urlParams = new URLSearchParams(window.location.search);
                const parentsection = urlParams.get('parentsection');
                const parentid = urlParams.get('parentid');

                for (const [name] of Object.entries(this.fields)) {
                    for (const [option, values] of Object.entries(this.vars.options)) {
                        if (name === option && values === parentsection) {
                            this.data[name] = parentid;
                        }
                    }
                }
            }
        },
        save: async function () {
            this.loading = true;
            this.errors = {};
            const result = await api.post('?cmd=save&section=' + this.section + '&id=' + this.id, this.data);
            this.loading = false;

            if (!result) {
                return false;
            }

            if (Object.keys(result.data.errors).length) {
                this.errors = result.data.errors;
            } else if (result.data.id) {
                this.$router.push('/section/' + this.section + '/' + result.data.id + '/');
            }

            //this.data = result.data.data;
        },
        fieldType(type) {
            switch (type) {
                case 'dob':
                    return 'date';
                case 'int':
                case 'decimal':
                    return 'number';
                case 'datetime':
                    return 'datetime-local';
            }

            return ['email', 'password', 'date', 'dob', 'time'].includes(type) ? type : 'text'
        },
        fieldStep(type) {
            switch (type) {
                case 'int':
                    return 1;
                case 'decimal':
                    return '0.01';
            }

            return '';
        }
    },

    async mounted() {
        this.section = this.$route.params.section;
        if (this.$route.params.id) {
            this.id = this.$route.params.id;
        }
        this.fetchData();
    }
};
</script>
