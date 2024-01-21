<template>
    <v-card style="overflow: scroll;" :loading="loading">
        <v-alert color="error" v-if="error">{{ error }}</v-alert>

        <v-card-actions>
            <v-btn title="Back" icon="mdi-arrow-left" to="./"></v-btn>
            <v-btn title="Save" icon="mdi-content-save" @click="save"></v-btn>
        </v-card-actions>
        <v-form>
            <v-list min-width="600">
                <template v-for="(value, key, index) in fields" :key="index">
                    <v-list-item v-if="!['id', 'timestamp', 'deleted'].includes(value.type)">
                        <v-checkbox v-if="value.type === 'checkbox'" :label="key" v-model="data[value.column]"
                            :error-messages="errors[key]" />
                        <div v-else-if="['file', 'files'].includes(value.type)">
                            <div v-if="data[value.column] > 0" class="mb-3">
                                <div>{{ key }}</div>
                                <v-chip :text="data[value.column]" closable @click:close="data[value.column] = []"></v-chip>
                            </div>
                            <v-file-input v-else :label="key" v-model="data[value.column]"
                                :error-messages="errors[key]" :multiple="value.type === 'files'" />
                        </div>
                        <div v-else-if="['upload'].includes(value.type)">
                            <div>{{ key }}</div>
                            <div v-if="data[value.column]" class="mb-3">
                                <v-chip :text="data[value.column]" closable @click:close="data[value.column] = ''"></v-chip>
                            </div>
                            <v-btn v-else @click="chooseFileUpload(value.column)">Choose</v-btn>
                        </div>
                        <v-textarea v-else-if="value.type === 'textarea'" :label="key" v-model="data[value.column]"
                            :error-messages="errors[key]" />
                        <editor v-else-if="value.type === 'editor'" v-model="data[key]" :init="{
                            toolbar: 'undo redo | formatselect | bold italic | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent',
                            branding: false,
                            promotion: false
                        }" />
                        <div v-else-if="value.type === 'rating'">
                            <div class="px-3">{{ key }}</div>
                            <v-rating v-model="data[key]" :error-messages="errors[key]" hover :length="5" :size="32" />
                        </div>
                        <v-select v-else-if="['select', 'select_parent'].includes(value.type)" :label="key"
                            v-model="data[value.column]" :error-messages="errors[key]" :items="options[key]" />
                        <v-autocomplete v-else-if="value.type === 'combo'" :label="key" v-model="data[key]"
                            :error-messages="errors[key]" :items="options[key]" @update:search="updateCombo($event, key)" />
                        <v-text-field :label="key" v-model="data[value.column]" :error-messages="errors[key]"
                            :rules="rules[value.type] ? [rules[value.type]] : []" :type="fieldType(value.type)"
                            :step="fieldStep(value.type)" autocomplete="new-password" v-else-if="key !== 'id'" />
                    </v-list-item>
                </template>
            </v-list>
        </v-form>
    </v-card>
</template>

<script>
import api from "../services/api";
import util from "../services/util";

import 'tinymce'
import Editor from '@tinymce/tinymce-vue';
/* Required TinyMCE components */
import 'tinymce/icons/default/icons.min.js';
import 'tinymce/themes/silver/theme.min.js';
import 'tinymce/models/dom/model.min.js';

/* Import a skin (can be a custom skin instead of the default) */
import 'tinymce/skins/ui/oxide/skin.js';
import 'tinymce/skins/ui/oxide/content.min.css';

/* Import plugins */
import 'tinymce/plugins/advlist';
import 'tinymce/plugins/code';
import 'tinymce/plugins/emoticons';
import 'tinymce/plugins/emoticons/js/emojis';
import 'tinymce/plugins/link';
import 'tinymce/plugins/lists';
import 'tinymce/plugins/table';

/* content UI CSS is required */
import 'tinymce/skins/ui/oxide/content.js';

/* The default content CSS can be changed or replaced with appropriate CSS for the editor content. */
import 'tinymce/skins/content/default/content.js';

export default {
    components: {
        'editor': Editor // <- Important part
    },
    props: {
        vars: null,
        fileSelected: null,
    },
    data: function () {
        return {
            data: {},
            fields: [],
            section: '',
            id: 0,
            loading: false,
            error: '',
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

                for (const [, field] of Object.entries(this.fields)) {
                    if (field.type === 'password') {
                        data[field.column] = '';
                    }
                    if (field.type === 'checkbox') {
                        data[field.column] = data[field.column] = data[field.column] > 0 ? true : false;
                    }
                    if (['file', 'files'].includes(field.type) && data[field.column] <= 0) {
                        data[field.column] = [];
                    }

                    // get options
                    if (['select', 'select_parent'].includes(field.type)) {
                        let option = (field.type === 'select_parent') ? this.section : this.vars.options[field.column.replaceAll(' ', '_')];
                        this.options[field.column] = await util.getOptions(option);
                    }

                    if (field.type === 'combo') {
                        this.options[field.column] = [];
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
            const formData = new FormData();
            
            // get file data
            for (const [name, value] of Object.entries(this.data)) {
                if (Array.isArray(this.data[name])) {
                    this.data[name].forEach(function (file) {
                        console.log('File details:', file);
                        formData.append(name, file);
                    })
                } else {                    
                    formData.append(name, value);
                }
            }

            this.loading = true;
            this.errors = {};
            this.error = '';

            const axios = api.getAxios();
            const apiRoot = api.getApiRoot();

            const result = await axios.post(apiRoot + '?cmd=save&section=' + this.section + '&id=' + this.id, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            this.loading = false;

            if (!result) {
                return false;
            }

            if (Object.keys(result.data.errors).length || result.data.error) {
                this.error = result.data?.error;
                this.errors = result.data?.errors;
            } else if (result.data.id) {
                this.$router.push('/section/' + this.section + '/' + result.data.id + '/');
            }
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
        },
        updateCombo: async function (term, column) {
            const result = await api.get('?cmd=autocomplete&field=' + column + '&term=' + term);
            this.options[column] = result.data;
        },
        chooseFileUpload: function (column) {
            this.$emit('chooseFileUpload', column);
        }
    },
    watch: {
        fileSelected: function (data) {
            console.log(data)
            this.data[data.column] = data.value;
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