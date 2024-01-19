<template>
    <v-card style="overflow: scroll;">
        <v-card-actions>
            <span v-if="tab === 'summary'">
                <v-btn title="Edit" icon="mdi-pencil" to="edit"></v-btn>
                <v-btn v-if="data['deleted'] > 0" title="Restore" icon="mdi-delete-restore" @click="restoreItem"
                    color="success" variant="flat"></v-btn>
                <v-btn v-else title="Delete" icon="mdi-delete" @click="deleteItem" color="error" variant="flat"></v-btn>
                <v-btn title="Logs" icon="mdi-text" @click="openLogs"></v-btn>
                <v-btn v-if="data.admin > 1" title="Privileges" icon="mdi-account-key" @click="openPrivileges"></v-btn>

                <v-menu v-if="buttons.length">
                    <template v-slot:activator="{ props }">
                        <v-btn v-bind="props" icon="mdi-dots-vertical"></v-btn>
                    </template>
                    <v-list>
                        <v-list-item v-for="(item, index) in buttons" :key="index" :value="index">
                            <v-list-item-title>{{ item.label }}</v-list-item-title>
                        </v-list-item>
                    </v-list>
                </v-menu>
            </span>
            <ListButtons v-else :selected="selected" :section="tab" @changeFields="changeFields" :parentsection="section"
                :parentid="id"></ListButtons>
        </v-card-actions>

        <v-tabs v-model="tab" bg-color="primary">
            <v-tab value="summary">Summary</v-tab>
            <v-tab v-for="subsection in vars.subsections[section]" :key="subsection" :value="subsection">{{ subsection
            }}</v-tab>
        </v-tabs>

        <v-card v-if="tab === 'summary'" min-width="600">
            <template v-for="(value, key, index) in fields" :key="index">
                <div v-if="data[key] && !['password'].includes(value.type)">
                    <v-card-title>
                        {{ key }}
                    </v-card-title>
                    <v-card-text :title="key">
                        <a v-if="value.type === 'email'" :href="'mailto:' + data[key]">{{ data[key] }}</a>
                        <a v-else-if="value.type === 'tel'" :href="'tel:' + data[key]">{{ data[key] }}</a>
                        <a v-else-if="value.type === 'url'" :href="data[key]" target="_blank">{{ data[key] }}</a>
                        <a v-else-if="value.type === 'coords'" :href="'https://www.google.com/maps/search/?api=1&query=' + data[key]" target="_blank">{{ data[key] }}</a>
                        <v-btn v-else-if="['selected', 'combo'].includes(value.type)" :to="getSelectLink(key)" variant="text">{{ data[key + '_label'] }}</v-btn>
                        <span v-else-if="value.type === 'rating'">
                            <v-rating v-model="data[key]" :length="5" :size="32" readonly></v-rating>
                        </span>
                        <img v-else-if="value.type === 'file'" :src="apiRoot + '?cmd=file&f=' + data[key] + '&w=320&h=240'" />
                        <img v-else-if="value.type === 'upload'" :src="apiRoot + '?cmd=upload&f=' + data[key] + '&w=320&h=240'" />
                        <div v-else-if="value.type === 'editor'" v-html="data[key]" class="mx-5"></div>
                        <span v-else>
                            <span v-if="['checkbox', 'deleted'].includes(value.type)">{{ data[key] > 0 ? 'Yes' : 'No'
                            }}</span>
                            <span v-else>{{ data[key] }}</span>
                            <span v-if="value.type === 'dob'">({{ age(data[key]) }})</span>
                        </span>
                    </v-card-text>
                </div>
            </template>
        </v-card>
        <list-page v-else :section="tab" :parentsection="section" :parentid="id" hidebuttons ref="listPage"></list-page>

        <v-dialog v-model="logsDialog" max-width="600" scrollable>
            <v-card title="Logs" :loading="loadingLogs">
                <v-list>
                    <v-card-item v-for="item in logs" :key="item.id">
                        <v-card-title>
                            {{ item.task }} on {{ item.date }} by <v-btn variant="text"
                                :to="'/section/users/' + item.user">{{ item.name }}</v-btn>
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
                            <v-select :label="section" v-model="privileges[section]['access']" :items="accessOptions"></v-select>
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
            data: [],
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
            accessOptions: [{value: 0, title: 'None'}, {value: 1, title: 'Read'}, {value: 2, title: 'Write'}, {value: 3, title: 'Full'}],
            apiRoot: '',
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

            this.data = result.data.data;
            this.fields = result.data.fields;

            document.title = 'ADMIN | ' + this.section + ' | ' + this.id;
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
            await api.post('?cmd=privileges&user_id=' + this.id, {privileges: this.privileges});
            this.privilegesDialog = false;
        },
        restoreItem: async function () {
            if (!confirm('Are you sure?')) {
                return;
            }

            var data = {
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

            var data = {
                section: this.section,
                ids: [this.id]
            };
            await api.post('?cmd=delete&section=' + this.section, data);
            this.$router.push('/section/' + this.section);
        },
        changeFields: function () {
            this.$refs['listPage'].dialog = true;
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
        getSelectLink: function (field) {
            var option = this.vars.options[field.replaceAll(' ', '_')];

            if (typeof option === 'string') {
                return '/section/' + option + '/' + this.data[field];
            }
        }
    },

    computed: {
        buttons: function () {
            var buttons = [];
            var self = this;

            this.vars?.buttons?.forEach(function (item) {
                if (item.page === 'view' && item.section === self.section) {
                    buttons.push(item);
                }
            })

            return buttons;
        }
    },

    watch: {
        $route() {
            this.section = this.$route.params.section;
            this.id = this.$route.params.id;
            this.fetchData();
        },
    },

    async mounted() {
        this.section = this.$route.params.section;
        this.id = this.$route.params.id;
        this.fetchData();

        this.apiRoot = api.getApiRoot()
    }
};
</script>
