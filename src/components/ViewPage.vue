<template>
    <v-card class="d-flex flex-column">
        <v-sheet color="secondary" class="w-100 d-flex">
            <v-btn title="Back" icon="mdi-arrow-left" @click="goBack" color="grey-lighten-1" variant="text" v-if="back"></v-btn>
            <span v-if="tab === 'summary'" class="w-100">
                <v-btn title="Edit" icon="mdi-pencil" color="grey-lighten-1" variant="text" @click="edit"></v-btn>
                <v-btn v-if="data['deleted'] > 0" title="Restore" icon="mdi-delete-restore" color="success" @click="restoreItem"
                    variant="text"></v-btn>
                <v-btn v-else title="Delete" icon="mdi-delete" color="grey-lighten-1" @click="deleteItem" variant="text"></v-btn>
                <v-btn title="Logs" icon="mdi-text" color="grey-lighten-1" @click="openLogs" variant="text"></v-btn>
                <v-btn v-if="data.admin > 1" title="Privileges" icon="mdi-account-key" color="grey-lighten-1" @click="openPrivileges" variant="text"></v-btn>

                <v-menu v-if="buttons.length">
                    <template v-slot:activator="{ props }">
                        <v-btn v-bind="props" icon="mdi-dots-vertical" color="grey-lighten-1" variant="text"></v-btn>
                    </template>
                    <v-list>
                        <v-list-item v-for="(item, index) in buttons" :key="index" :value="index"
                            @click="customButton(item)" :disabled="checkDisabled(item)">
                            <v-list-item-title>{{ item.label }}</v-list-item-title>
                        </v-list-item>
                    </v-list>
                </v-menu>
            </span>
            <ListButtons v-else :selected="selected" :section="tab" @changeFields="changeFields" :parentsection="section"
                :parentid="id" :sortable="isSortable" @action="actionHandler" :data="buttonData"></ListButtons>
        </v-sheet>

        <div class="d-flex flex-column" style="height: 1px; overflow: auto; flex-grow: 1;">
            <v-tabs v-model="tab" style="min-height: 50px;">
                <v-tab value="summary">{{ section }}</v-tab>
                <template v-if="vars.subsections && vars.subsections[section]?.length">
                    <v-tab v-for="subsection in vars?.subsections[section]" :key="subsection.subsection" :value="subsection.subsection.replaceAll('_', ' ')">
                        <v-icon v-if="subsection.icon" :icon="subsection.icon" start></v-icon>
                        {{ subsection.title }}
                    </v-tab>
                </template>
            </v-tabs>

            <v-card v-if="tab === 'summary'" min-width="600" class="pa-5" style="overflow: auto;">
                <template v-for="(value, key, index) in fields" :key="index">
                    <div v-if="data[value.column] && !['password'].includes(value.type) && (!['file', 'select', 'select_parent', 'combo'].includes(value.type) || (data[value.column] && data[value.column] != 0))">
                        <v-card-title @mouseenter="fieldHover = key" @mouseleave="fieldHover = ''">
                            <a :id="key.replaceAll(' ', '_')"></a>
                            <a :href="'#' + key.replaceAll(' ', '_')" v-show="fieldHover === key">
                                <v-icon style="position: absolute; left: 0px;" color="primary">mdi-link</v-icon>
                            </a>
                            {{ formatString(key) }}
                        </v-card-title>
                        <v-card-text :title="key">
                            <a v-if="value.type === 'email'" :href="'mailto:' + data[value.column]">{{ data[value.column] }}</a>
                            <a v-else-if="value.type === 'tel'" :href="'tel:' + data[value.column]">{{ data[value.column] }}</a>
                            <a v-else-if="value.type === 'url'" :href="data[value.column]" target="_blank">{{ data[value.column] }}</a>
                            <a v-else-if="value.type === 'coords'"
                                :href="'https://www.google.com/maps/search/?api=1&query=' + data[value.column]" target="_blank">{{
                                    data[value.column] }}</a>
                            <v-btn v-else-if="['select', 'select_parent', 'combo'].includes(value.type)" 
                                :to="getSelectLink(key, data[value.column])" variant="text">{{ data[value.column + '_label'] ? data[value.column + '_label'] : getOption(options[value.column], data[value.column])?.title  }}</v-btn>
                            <div v-else-if="value.type === 'select_multiple'" class="mx-5">
                                <v-btn v-for="(v, k, index) in data[value.column]" :key="index" :to="getSelectLink(key, v)" variant="text">
                                    {{ getOption(options[value.column], v)?.title }}
                                </v-btn>
                            </div>
                            <span v-else-if="value.type === 'rating'">
                                <v-rating v-model="data[value.column]" :length="5" :size="32" readonly></v-rating>
                            </span>
                            <a v-else-if="['file', 'upload'].includes(value.type)" :href="apiRoot + '?cmd=file&f=' + data[value.column]" target="_blank">
                                <img :src="apiRoot + '?cmd=file&f=' + data[value.column] + '&w=320&h=240'" style="max-height: 300px; max-width: 300px;" onerror="this.remove()" />
                                <div>{{ data[value.column] }}</div>
                            </a>
                            <div v-else-if="['files', 'uploads'].includes(value.type)">
                                <v-carousel>
                                    <v-carousel-item
                                        v-for="image in data[value.column]" :key="image"
                                        :src="apiRoot + '?cmd=file&f=' + image"
                                    ></v-carousel-item>
                                </v-carousel>
                            </div>
                            <img v-else-if="value.type === 'upload'"
                                :src="apiRoot + '?cmd=upload&f=' + data[value.column] + '&w=320&h=240'" />
                            <div v-else-if="value.type === 'editor'" v-html="data[value.column]"></div>
                            <div v-else-if="value.type === 'json'">
                                <vue-json-pretty :data="JSON.parse(data[value.column])" :theme="$vuetify.theme.name" :showDoubleQuotes="false" />
                            </div>
                            <span v-else>
                                {{ formatData(data[value.column], value.type) }}

                                <span v-if="value.type === 'color'" :style="'background-color: ' + data[value.column]" class="ml-3 px-2"></span>
                            </span>
                        </v-card-text>
                    </div>
                </template>
            </v-card>
            <list-page v-else :section="tab" :parentsection="section" :parentid="id" hidebuttons ref="listPage" :vars="vars" @loaded="loaded" @changeSelected="changeSelected"></list-page>
        </div>

        <v-dialog v-model="logsDialog" max-width="600" scrollable>
            <v-card title="Logs" :loading="loadingLogs">
                <v-list v-if="logs.length">
                    <v-list-item v-for="item in logs" :key="item.id" class="unclamp mb-3">
                        <v-list-item-title>
                            {{ formatString(item.task) }} on {{ formatDateTime(item.date) }}
                        </v-list-item-title>
                        <v-list-item-subtitle>
                            <div v-html="item.details" style="white-space: pre;"></div>
                        </v-list-item-subtitle>
                        <div v-if="item.user > 0">
                            <v-btn variant="text" :to="this.base + 'section/users/' + item.user" @click="logsDialog = false">{{ item.name ? item.name.trim() : item.user }}</v-btn>
                        </div>
                    </v-list-item>
                </v-list>
                <v-card-text v-else>
                    No logs found.
                </v-card-text>
            </v-card>
        </v-dialog>

        <v-dialog v-model="privilegesDialog" max-width="600" scrollable>
            <v-card title="Privileges" :loading="loadingPrivileges">
                <v-list>
                    <v-card-item>
                        <template v-for="section in sections" :key="section">
                            <v-select :label="section" v-model="privileges[section].access"
                                :items="accessOptions"></v-select>
                        </template>
                    </v-card-item>
                </v-list>
                <v-card-actions>
                    <v-btn @click="savePrivileges" color="primary" variant="flat">Save</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </v-card>
</template>

<style scoped>
.unclamp .v-list-item-title,
.unclamp .v-list-item-subtitle {
    -webkit-line-clamp: unset;
}
</style>

<script>
import api from "../services/api";
import util from "../services/util";
import ListPage from "./ListPage";
import ListButtons from "./ListButtons";
import VueJsonPretty from 'vue-json-pretty';
import 'vue-json-pretty/lib/styles.css';

export default {
    components: {
        ListPage,
        ListButtons,
        VueJsonPretty,
    },
    props: {
        vars: null,
    },
    data: function () {
        return {
            data: {},
            fields: [],
            section: '',
            id: 0,
            tab: 'summary',
            logsDialog: false,
            loadingLogs: false,
            logs: [],
            privilegesDialog: false,
            loadingPrivileges: false,
            privileges: {},
            sections: [],
            selected: [],
            headers: [],
            activeHeaders: [],
            accessOptions: [{ value: 0, title: 'None' }, { value: 1, title: 'Read' }, { value: 2, title: 'Write' }, { value: 3, title: 'Full' }],
            apiRoot: '',
            options: [],
            back: '../',
            buttonData: {},
            fieldHover: '',
            isSortable: false,
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

            if (result.data.data) {
                let data = result.data.data;

                this.options = await util.getAllOptions(fields, this.vars.options, this.section, data);

                for (const [, field] of Object.entries(fields)) {
                    if (field.type === 'password') {
                        data[field.column] = '';
                    } else if (field.type === 'checkbox') {
                        data[field.column] = data[field.column] = data[field.column] > 0 ? true : false;
                    } else if (field.type === 'select_multiple' && !Array.isArray(data[field.column])) {
                        // default to array
                        data[field.column] = [];
                    }
                }

                this.data = data;
            } else {
                this.data = {};
            }

            this.fields = result.data.fields;

            let title = this.vars?.branding?.title ? this.vars.branding.title : 'ADMIN';
            document.title = title + ' | ' + this.formatString(this.section) + ' | ' + this.id;

            // back button to go back to parent section
            const urlParams = new URLSearchParams(window.location.search);
            const parentsection = urlParams.get('parentsection');

            if (parentsection) {
                const parentid = urlParams.get('parentid');
                this.back = '../../' + parentsection + '/' + parentid + '/';
            } else if (!fields.id) {
                this.back = '';
            } else {
                this.back = '../';
            }

            await this.$nextTick();
            const hash = window.location.hash;
            if (hash) {
                const targetElement = document.querySelector(hash);
                if (targetElement) {
                    targetElement.scrollIntoView();
                }
            }
        },
        openLogs: async function () {
            this.logsDialog = true;
            this.loadingLogs = true;
            const result = await api.get('?cmd=logs&section=' + this.section + '&id=' + this.id);
            this.loadingLogs = false;

            if (!result) {
                return false;
            }

            this.logs = result.data.data;
        },
        openPrivileges: async function () {
            if (!['Business'].includes(util.getEdition())) {
                this.$router.push(util.base() + 'upgrade');
                return;
            }

            this.privilegesDialog = true;
            this.loadingPrivileges = true;
            const result = await api.get('?cmd=privileges&user_id=' + this.id);
            this.loadingPrivileges = false;

            if (!result) {
                return false;
            }

            this.privileges = result.data.privileges;
            this.sections = result.data.sections;
        },
        savePrivileges: async function () {
            this.loadingPrivileges = true;
            await api.post('?cmd=privileges&user_id=' + this.id, { privileges: this.privileges });
            this.privilegesDialog = false;
        },
        restoreItem: async function () {
            if (!confirm('Are you sure you want to restore?')) {
                return;
            }

            let data = {
                section: this.section,
                id: this.id
            };
            await api.post('?cmd=restore&section=' + this.section, data);
            this.fetchData();
        },
        deleteItem: async function () {
            if (!confirm('Are you sure to delete?')) {
                return;
            }

            let data = {
                section: this.section,
                ids: [this.id]
            };
            await api.post('?cmd=delete&section=' + this.section, data);
            this.$router.push(this.back);
        },
        changeFields: function () {
            this.$refs['listPage'].dialog = true;
        },
        actionHandler: function () {
            this.$refs['listPage'].actionHandler(...arguments);
        },
        getSelectLink: function (field, value) {
            let option = this.vars.options[field.replaceAll('_', ' ')];

            if (typeof option === 'string') {
                return '../../' + option.replaceAll('_', ' ') + '/' + value + '/';
            }
        },
        customButton: async function (button) {
            if (button.confirm) {
                let result = confirm(button.confirm);

                if (!result) {
                    return false;
                }
            }
            
            let data = {
                cmd: 'button',
                button: button.id,
                section: this.section,
                ids: [this.id],
            };

            this.loading = true;
            const result = await api.post('?cmd=button&section=' + this.section, data);
            this.loading = false;

            if (result.data.error) {
                alert(result.data.error);
            }

            if (result.data.result?.redirect) {
                if (result.data.result?.target) {
                    window.open(result.data.result.redirect);
                } else {
                    location.href = result.data.result.redirect;
                }
            } else {
                await this.fetchData();
            }
        },
        getOption: function (options, value) {
            let option = options.find(item => item.value === value);
            return option ? option : {
                value: value,
                title: 'Not found'
            }
        },
        formatData: function (value, fieldType) {
            return util.formatData(value, fieldType);
        },
        formatDateTime: function (value) {
            return util.formatDateTime(value);
        },
        formatString: function (string) {
            return util.formatString(string);
        },
        loaded: function () {            
            let data = this.$refs['listPage']?.buttonData;
            this.buttonData = data ? data : {};
            this.isSortable = this.$refs['listPage']?.isSortable;
        },
        edit: function () {
            this.$router.push('edit' + location.search);
        },
        checkDisabled: function (button) {
            if (typeof button.enabled === 'object') {
                let enabled = true;
                for (const [key, val] of Object.entries(button.enabled)) {
                    if (this.data[key] != val) {
                        enabled = false;
                    }
                }

                if (enabled === false) {
                    return true;
                }
            }

            return false;
        },
        goBack: function () {
            this.$router.push(this.back);
        },
        changeSelected: function (items) {
            this.selected = items;
        },
    },

    computed: {
        base: function () {
            return util.base();
        },
        buttons: function () {
            let buttons = [];

            this.vars?.buttons?.forEach((item, index) => {
                if (item.page === 'view' && item.section === this.section) {
                    item.id = index;
                    buttons.push(item);
                }
            })

            return buttons;
        },
    },

    watch: {
        $route() {
            this.section = this.$route.params.section;
            this.id = this.$route.params.id;
            this.tab = 'summary';
            this.fetchData();
        },
        vars: function () {
            this.fetchData();
        },
        tab: async function () {
            this.selected = [];
            this.isSortable = false;
        }
    },

    async mounted() {
        this.section = this.$route.params.section;
        this.id = this.$route.params.id;
        this.apiRoot = api.getApiRoot()

        if (this.vars.sections) {
            this.fetchData();
        }
    }
};
</script>