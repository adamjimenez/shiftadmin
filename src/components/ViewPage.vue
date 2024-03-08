<template>
    <v-card class="d-flex flex-column">
        <v-sheet color="secondary" class="w-100 d-flex">
            <v-btn title="Back" icon="mdi-arrow-left" :to="back" color="grey-lighten-1" variant="text" v-if="back"></v-btn>
            <span v-if="tab === 'summary'" class="w-100">
                <v-btn title="Edit" icon="mdi-pencil" color="grey-lighten-1" to="edit" variant="text"></v-btn>
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
                            @click="customButton(item)">
                            <v-list-item-title>{{ item.label }}</v-list-item-title>
                        </v-list-item>
                    </v-list>
                </v-menu>
            </span>
            <ListButtons v-else :selected="selected" :section="tab" @changeFields="changeFields" :parentsection="section"
                :parentid="id" :sortable="isSortable" @action="actionHandler" :data="buttonData"></ListButtons>
        </v-sheet>

        <div class="pa-5 d-flex flex-column" style="height: 1px; overflow: auto; flex-grow: 1;">
            <v-tabs v-model="tab" style="min-height: 50px;">
                <v-tab value="summary">Summary</v-tab>
                <template v-if="vars.subsections && vars.subsections[section]?.length">
                    <v-tab v-for="subsection in vars?.subsections[section]" :key="subsection" :value="subsection">
                        {{ subsection }}
                    </v-tab>
                </template>
            </v-tabs>

            <v-card v-if="tab === 'summary'" min-width="600" style="overflow: scroll;">
                <template v-for="(value, key, index) in fields" :key="index">
                    <div v-if="data[value.column] && !['password'].includes(value.type) && (!['file', 'select', 'select_parent', 'combo'].includes(value.type) || data[value.column] > 0)">
                        <v-card-title>
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
                                :to="getSelectLink(key, data[value.column])" variant="text">{{ data[value.column + '_label'] ? data[value.column + '_label'] : data[value.column]  }}</v-btn>
                            <div v-else-if="value.type === 'select_multiple'" class="mx-5">
                                <v-btn v-for="(v, k, index) in data[value.column]" :key="index" :to="getSelectLink(key, v)" variant="text">
                                    {{ getOption(options[value.column], v).title }}
                                </v-btn>
                            </div>
                            <span v-else-if="value.type === 'rating'">
                                <v-rating v-model="data[value.column]" :length="5" :size="32" readonly></v-rating>
                            </span>
                            <a v-else-if="['file', 'upload'].includes(value.type)" :href="apiRoot + '?cmd=file&f=' + data[value.column]" target="_blank">
                                <img :src="apiRoot + '?cmd=file&f=' + data[value.column] + '&w=320&h=240'" />
                                <div>{{ data[value.column] }}</div>
                            </a>
                            <div v-else-if="['files', 'uploads'].includes(value.type)">
                                <img v-for="image in data[value.column]" :key="image"
                                    :src="apiRoot + '?cmd=file&f=' + image + '&w=320&h=240'" class="d-block mb-5" />                            
                            </div>
                            <img v-else-if="value.type === 'upload'"
                                :src="apiRoot + '?cmd=upload&f=' + data[value.column] + '&w=320&h=240'" />
                            <div v-else-if="value.type === 'editor'" v-html="data[value.column]"></div>
                            <span v-else>
                                <span v-if="['checkbox', 'deleted'].includes(value.type)">{{ data[value.column] > 0 ? 'Yes' : 'No'
                                }}</span>
                                <span v-else>{{ formatData(data[value.column], value.type) }}</span>
                                <span v-if="value.type === 'dob'">({{ age(data[value.column]) }})</span>
                            </span>
                        </v-card-text>
                    </div>
                </template>
            </v-card>
            <list-page v-else :section="tab" :parentsection="section" :parentid="id" hidebuttons ref="listPage" @loaded="loaded"></list-page>
        </div>

        <v-dialog v-model="logsDialog" max-width="600" scrollable>
            <v-card title="Logs" :loading="loadingLogs">
                <v-list>
                    <v-card-item v-for="item in logs" :key="item.id">
                        <v-card-title>
                            {{ item.task }} on {{ item.date }} by <v-btn variant="text"
                                :to="'../../users/' + item.user" @click="logsDialog = false">{{ item.name }}</v-btn>
                        </v-card-title>
                        <v-card-subtitle>
                            <div v-html="item.details" style="white-space: pre;"></div>
                        </v-card-subtitle>
                    </v-card-item>
                </v-list>
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

<script>
import api from "../services/api";
import util from "../services/util";
import ListPage from "./ListPage";
import ListButtons from "./ListButtons";

export default {
    components: {
        ListPage,
        ListButtons,
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
            this.$emit('changeFields', Object.values(fields));

            if (result.data.data) {
                let data = result.data.data;

                this.options = await util.getAllOptions(fields, this.vars, this.section, data);

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
            }

            this.fields = result.data.fields;

            let title = this.vars?.branding?.title ? this.vars.branding.title : 'ADMIN';
            document.title = title + ' | ' + this.section + ' | ' + this.id;

            // back button to go back to parent section
            const urlParams = new URLSearchParams(window.location.search);
            const parentsection = urlParams.get('parentsection');

            if (parentsection) {                
                const parentid = urlParams.get('parentid');
                this.back = '../../' + parentsection + '/' + parentid + '/';
            }

            if (!fields.id) {
                this.back = '';
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
            if (!confirm('Are you sure?')) {
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
            if (!confirm('Are you sure?')) {
                return;
            }

            let data = {
                section: this.section,
                ids: [this.id]
            };
            await api.post('?cmd=delete&section=' + this.section, data);
            this.$router.push('../' + this.section);
        },
        changeFields: function () {
            this.$refs['listPage'].dialog = true;
        },
        actionHandler: function () {
            this.$refs['listPage'].actionHandler(...arguments);
        },
        age: function (dateString) {
            const today = new Date();
            const birthDate = new Date(dateString);

            // Check for invalid date format
            if (isNaN(birthDate.getTime())) {
                return "Invalid date format. Please use YYYY-MM-DD.";
            }

            // Get the difference in years, months, and days
            let yearDiff = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();
            const dayDiff = today.getDate() - birthDate.getDate();

            // Adjust for different month lengths and leap years
            if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
                yearDiff--;
            }

            return yearDiff;
        },
        getSelectLink: function (field, value) {
            let option = this.vars.options[field.replaceAll('_', ' ')];

            if (typeof option === 'string') {
                return '../../' + option.replaceAll('_', ' ') + '/' + value + '/';
            }
        },
        customButton: async function (button) {
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
            return options.find(item => item.value === value);
        },
        formatData: function (value, fieldType) {
            return util.formatData(value, fieldType);
        },
        formatString: function (string) {
            return util.formatString(string);
        },
        loaded: function () {            
            let data = this.$refs['listPage']?.buttonData;
            this.buttonData = data ? data : {};
        }
    },

    computed: {
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
        isSortable: function () {
            return this.$refs['listPage']?.isSortable;
        }
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