<template>
    <v-card :loading="loading">
        <v-alert color="error" v-if="error">{{ error }}</v-alert>

        <v-sheet color="secondary" style="z-index: 100;" class="w-100 position-fixed">
            <v-btn title="Back" icon="mdi-arrow-left" @click="goBack" variant="text"></v-btn>
            <v-btn title="Save" icon="mdi-content-save" @click="save" variant="text" :disabled="!dirty"></v-btn>
        </v-sheet>

        <v-card-text class="mt-10">

            <v-form ref="form">
                <v-list>
                    <template v-for="(value, key, index) in fields" :key="index">
                        <v-list-item v-if="!['id', 'timestamp', 'deleted'].includes(value.type)">
                            <v-checkbox v-if="value.type === 'checkbox'" :label="formatString(key)"
                                v-model="data[value.column]" :readonly="value.readonly" :error-messages="errors[key]" :true-value="'1'" :false-value="'0'"  />
                            <div v-else-if="['file', 'files'].includes(value.type)">
                                <div v-if="data[value.column]?.length > 0" class="mb-3">
                                    <div class="mb-3">{{ formatString(key) }}</div>
                                    <v-chip v-for="(file, k, fileIndex) in data[value.column]" :key="file" :text="file" pill
                                        :closable="!value.readonly" @click:close="delete data[value.column].splice(fileIndex, 1)">
                                        <v-avatar start>
                                            <v-img :src="apiRoot + '?cmd=file&f=' + file + '&w=320&h=240'"></v-img>
                                        </v-avatar>
                                        {{ file }}
                                    </v-chip>
                                </div>
                                <v-file-input v-if="value.type === 'files' || data[value.column]?.length === 0"
                                    :label="formatString(key)" v-model="files[value.column]" :readonly="value.readonly" :error-messages="errors[key]"
                                    :multiple="value.type === 'files'" />
                            </div>
                            <div v-else-if="['upload', 'uploads'].includes(value.type)">
                                <div>{{ formatString(key) }}</div>
                                <div v-if="data[value.column]?.length > 0" class="mb-3">
                                    <v-chip v-for="(file, k, fileIndex) in data[value.column]" :key="file" :text="file"
                                        :closable="!value.readonly" @click:close="data[value.column].splice(fileIndex, 1)">
                                        <v-avatar start>
                                            <v-img :src="apiRoot + '?cmd=file&f=' + file + '&w=320&h=240'"></v-img>
                                        </v-avatar>
                                        {{ file }}
                                    </v-chip>
                                </div>

                                <v-btn v-if="value.type === 'uploads' || data[value.column].length === 0"
                                    @click="chooseFileUpload(value.column)">Choose</v-btn>

                                <div v-if="errors[key]" class="text-red-lighten-1">{{ errors[key] }}</div>
                            </div>
                            <v-textarea v-else-if="['json', 'textarea'].includes(value.type)" :label="formatString(key)"
                                v-model="data[value.column]" :readonly="value.readonly" :error-messages="errors[key]" />
                            <div v-else-if="value.type === 'editor'">
                                <div class="ma-3">{{ formatString(key) }}</div>
                                <editor-field v-model="data[value.column]" :readonly="value.readonly" :init="{
                                    plugins: 'code link lists media image',
                                    toolbar: 'insertfile undo redo | styleselect | formatselect  | bold italic | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | hr link image forecolor backcolor | components',
                                    branding: false,
                                    promotion: false,
                                    relative_urls: false,
                                    remove_script_host: false,
                                    document_base_url: WebUrl,
                                    file_picker_callback: filePickerCallback
                                }" />
                            </div>
                            <div v-else-if="value.type === 'rating'">
                                <div class="px-3">{{ formatString(key) }}</div>
                                <v-rating v-model="data[value.column]" :readonly="value.readonly" :error-messages="errors[key]" hover :length="5"
                                    :size="32" />
                            </div>
                            <v-select v-else-if="['select', 'select_parent'].includes(value.type)"
                                :label="formatString(key)" v-model="data[value.column]" :readonly="value.readonly" :error-messages="errors[key]"
                                :items="options[key.replaceAll(' ', '_')]" :multiple="value.type === 'select_multiple'"
                                :chips="value.type === 'select_multiple'" :clearable="!value.readonly" />
                            <v-autocomplete v-else-if="['combo', 'select_multiple'].includes(value.type)" :label="formatString(key)"
                                v-model="data[value.column]" :readonly="value.readonly" :error-messages="errors[key]" :items="options[key.replaceAll(' ', '_')]" :multiple="value.type === 'select_multiple'"
                                @update:search="updateCombo($event, key.replaceAll(' ', '_'), value.options)">                            
                                <template v-slot:append-item>
                                    <div @click="loadMore(key.replaceAll(' ', '_'), value.options)">Load more</div>
                                </template>
                            </v-autocomplete>
                            <!--<v-number-input v-else-if="['int', 'position', 'decimal'].includes(value.type)" :label="formatString(key)" v-model="data[value.column]"  :step="fieldStep(value.type)"></v-number-input>-->
                            <polygon-field v-else-if="['polygon'].includes(value.type)" :label="formatString(key)" v-model="data[value.column]"></polygon-field>
                            <v-text-field :label="formatString(key)" v-model="data[value.column]" :readonly="value.readonly"
                                :error-messages="errors[key]" :rules="rules[value.type] ? [rules[value.type]] : []"
                                :type="fieldType(value.type)" autocomplete="new-password"
                                v-else-if="key !== 'id'" />
                        </v-list-item>
                    </template>
                </v-list>
            </v-form>
        </v-card-text>
    </v-card>
</template>

<script>
import api from "../services/api";
import util from "../services/util";
import PolygonField from "./PolygonField";
import EditorField from "./EditorField";

export default {
    components: {
        PolygonField,
        EditorField
    },
    beforeRouteLeave(to, from, next) {
        if (!this.dirty || confirm('You have unsaved changes. Do you want to continue?')) {
            return next()
        }
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
            terms: {},
            files: {},
            rules: {
                required: value => !!value || 'Required',
                ip: v => (!v || /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(v)) || 'Invalid IP address',
                email: v => (!v || /.+@.+\..+/.test(v)) || 'Invalid email',
                postcode: v => (!v || /^([Gg][Ii][Rr] 0[Aa]{2})|((([A-Za-z][0-9]{1,2})|(([A-Za-z][A-Ha-hJ-Yj-y][0-9]{1,2})|(([A-Za-z][0-9][A-Za-z])|([A-Za-z][A-Ha-hJ-Yj-y][0-9][A-Za-z]?))))\s?[0-9][A-Za-z]{2})$/.test(v)) || 'Invalid postcode',
            },
            dirty: false,
            apiRoot: '',
            back: './',
            hideAppBar: true
        };
    },
    methods: {
        fetchData: async function () {
            let data = {
                cmd: 'get',
                section: this.section,
                id: this.id
            };
            const result = await api.post('?section=' + this.section, data);

            if (!result) {
                return false;
            }

            let fields = result.data.fields;
            this.$emit('changeHeaders', Object.values(fields));
            this.$emit('changeFields', Object.values(fields));

            data = result.data.data && !Array.isArray(result.data.data) ? result.data.data : {};

            this.options = await util.getAllOptions(fields, this.vars.options, data);

            for (const [, field] of Object.entries(fields)) {
                if (field.type === 'password') {
                    data[field.column] = '';
                } else if (field.type === 'select_multiple' && !Array.isArray(data[field.column])) {
                    // default to array
                    data[field.column] = [];
                } else if (['file', 'files', 'upload', 'uploads'].includes(field.type)) {
                    // default to array
                    try {
                        data[field.column] = JSON.parse(data[field.column]);
                    } catch (error) {
                        if (typeof data[field.column] === 'string' && data[field.column] !== '0'  && data[field.column] !== '') {
                            data[field.column] = [data[field.column]];
                        }
                    }

                    if (!Array.isArray(data[field.column])) {
                        if (data[field.column]) {
                            data[field.column] = [String(data[field.column])]
                        } else {
                            data[field.column] = [];
                        }
                    }
                }
            }

            this.data = !Array.isArray(data) ? data : {};
            await this.$nextTick();

            this.fields = fields;

            let title = this.vars?.branding?.title ? this.vars.branding.title : 'ADMIN';
            document.title = title + ' | ' + this.formatString(this.section) + ' | ' + this.id;

            // parent fields
            const urlParams = new URLSearchParams(window.location.search);
            const parentsection = urlParams.get('parentsection');
            const parentid = urlParams.get('parentid');

            if (!this.id) {
                for (const [name] of Object.entries(this.fields)) {
                    for (const [option, values] of Object.entries(this.vars.options)) {
                        if (name === option && values === parentsection) {
                            this.data[name] = parentid;
                        }
                    }
                }
                await this.$nextTick();
            }

            if (parentsection) {
                if (this.id) {                    
                    this.back = './' + location.search;
                } else {
                    const parentid = urlParams.get('parentid');
                    this.back = '../' + parentsection + '/' + parentid + '/';
                }
            } else {
                this.back = './' + location.search;
            }

            this.dirty = false;
        },
        save: async function () {
            const formData = new FormData();

            // form data
            for (const [name, value] of Object.entries(this.data)) {
                let val = value;

                if (Array.isArray(value)) {
                    if (value.length === 0) {
                        continue;
                    }

                    value.forEach(function (file) {
                        formData.append(name + '[]', file);
                    })
                } else {
                    formData.append(name, val);
                }
            }

            // get file data
            for (let [name, value] of Object.entries(this.files)) {
                if (!Array.isArray(value)) {
                    value = [value];
                }

                value.forEach((file) => {
                    formData.append(name + '[]', file);
                });
            }

            this.errors = {};
            this.error = '';
            this.loading = true;

            const result = await api.post('?cmd=save&section=' + this.section + '&id=' + this.id, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            this.loading = false;

            if (!result) {
                return false;
            }

            if (result.data.error) {
                this.error = result.data?.error;
            } else if (typeof result.data.errors === 'object' && Object.keys(result.data.errors).length) {
                this.errors = result.data?.errors;
                await this.$nextTick();

                const invalidField = this.$refs['form'].items.find((e) => e.isValid === false);

                if (invalidField) {
                    document.getElementById(invalidField.id).scrollIntoView({
                        behavior: 'smooth',
                        block: 'center',
                    })
                }
            } else if (result.data.id) {
                this.dirty = false;
                this.$router.push(util.base() + 'section/' + this.section + '/' + result.data.id + '/' + location.search);
            }
        },
        fieldType(type) {
            switch (type) {
                case 'dob':
                    return 'date';
                case 'int':
                case 'position':
                case 'decimal':
                    return 'number';
                case 'datetime':
                    return 'datetime-local';
                case 'color':
                    return 'color';
            }

            return ['email', 'password', 'date', 'dob', 'time'].includes(type) ? type : 'text'
        },
        fieldStep(type) {
            switch (type) {
                case 'int':
                case 'position':
                    return 1;
                case 'decimal':
                    return 0.01;
            }

            return '';
        },
        updateCombo: async function (term, column, table) {
            if (!table) {
                table = column;
            }

            this.terms[column] = term;
            const result = await api.get('?cmd=autocomplete&field=' + table + '&term=' + term);
            this.options[column] = result.data.options;
        },
        loadMore: async function (column, table) {
            if (!table) {
                table = column;
            }

            const result = await api.get('?cmd=autocomplete&field=' + table + '&term=' + (this.terms[column] ? this.terms[column] : '') + '&offset=' + this.options[column].length);

            result.data.options?.forEach(item => {
                this.options[column].push(item);
            })
        },
        chooseFileUpload: function (column) {
            this.$emit('chooseFileUpload', column);
        },
        filePickerCallback: function (cb) {
            this.$emit('chooseFileUpload', cb);
        },
        formatString: function (string) {
            return util.formatString(string);
        },
        goBack: function () {
            this.$router.push(this.back);
        },
    },
    watch: {
        fileSelected: function (data) {
            this.data[data.column].push(data.value);
        },
        vars: function () {
            this.fetchData();
        },
        data: {
            handler() {
                this.dirty = true;
            },
            deep: true
        },
        files: {
            handler() {
                this.dirty = true;
            },
            deep: true
        },
    },
    computed: {
        WebUrl: function () {
            return api.getWebUrl();
        }
    },
    async mounted() {
        this.section = this.$route.params.section;
        if (this.$route.params.id) {
            this.id = this.$route.params.id;
        }

        if (this.vars.sections) {
            this.fetchData();
        }

        window.onbeforeunload = function () {
            if (this.dirty)
                return true;
        };

        this.apiRoot = api.getApiRoot()
    }
}
</script>