<template>
    <v-layout>
        <v-data-table-server v-model="selected" :headers="activeHeaders" :items="data.data" item-value="id" show-select
            @click:row="rowClick" :loading="loading" @update:options="loadItems" :items-length="totalItems"
            v-model:items-per-page="itemsPerPage" :search="search">

            <template v-slot:top>

                <v-container color="secondary" fluid v-if="!hidebuttons">
                    <v-row>
                        <v-col class="py-0">
                            <ListButtons :selected="selected" :section="internalSection" @changeFields="dialog = true">
                            </ListButtons>
                        </v-col>
                    </v-row>
                </v-container>

            </template>

        </v-data-table-server>

        <v-dialog v-model="dialog" max-width="600" scrollable>
            <v-card title="Fields">
                <v-data-table v-model="selectedHeaders" :headers="[{ title: 'Field', key: 'key' }]" :items="headers"
                    item-value="key" items-per-page="-1" show-select>
                    <template v-slot:bottom></template>
                </v-data-table>
            </v-card>
        </v-dialog>
    </v-layout>
</template>

<script>
import api from "../services/api";
import qs from "qs";
import ListButtons from "./ListButtons";

export default {
    components: {
        ListButtons
    },
    props: {
        vars: null,
        section: null,
        hidebuttons: Boolean,
        parentsection: null,
        parentid: null,
        searchparams: null,
    },
    data: function () {
        return {
            dialog: false,
            selectedHeaders: [],
            selected: [],
            data: [],
            internalSection: '',
            loading: false,
            importDialog: false,
            totalItems: 0,
            itemsPerPage: 20,
            search: '',
            headers: [],
        };
    },
    methods: {
        formatString: function (str) {
            str = str.replace(/_/g, ' ');
            return str.charAt(0).toUpperCase() + str.slice(1)
        },

        loadItems: async function ({ page, itemsPerPage, sortBy }) {
            var data = {
                cmd: 'get',
                section: this.internalSection,
                fields: this.searchparams,
                page: page,
                itemsPerPage: itemsPerPage,
                sortBy: sortBy
            };

            if (this.parentsection) {
                data.parentsection = this.parentsection;
            }

            if (this.parentid) {
                data.parentid = this.parentid;
            }

            const params = qs.stringify(data);

            this.loading = true;
            const result = await api.get('?' + params.toString(), data);
            this.loading = false;

            if (!result.data.fields) {
                return false;
            }

            this.data = result.data;
            this.totalItems = this.data.total;

            this.headers = [];
            let allHeaders = Object.values(result.data.fields);

            if (this.data.data?.[0]) {
                for (const [, field] of Object.entries(this.data.fields)) {
                    this.headers.push({
                        title: this.formatString(field.column),
                        key: field.column,
                    });
                }
            }

            if (!this.selectedHeaders.length) {
                this.selectedHeaders = allHeaders;
            }

            this.$emit('changeHeaders', allHeaders)

            // get active fields
            var fields = [];
            this.selectedHeaders.forEach(item => {
                for (const [, field] of Object.entries(this.data.fields)) {
                    if (item === field.column) {
                        fields.push(field);
                    }
                }
            });
            console.log(this.selectedHeaders)
            
            this.$emit('changeFields', fields);
        },

        rowClick: function (e, item) {
            this.$router.push('/section/' + this.internalSection + '/' + item.item.id + '/');
        },
        doAction: async function (action) {
            var data = {
                cmd: action,
                section: this.section,
                ids: this.selected,
            };

            this.loading = true;
            await api.post('?cmd=' + action + '&section=' + this.internalSection, data);
            this.selected = [];
            this.search = String(Date.now())
        },
    },

    watch: {
        $route(route) {
            this.internalSection = route.params.section;
            this.search = String(Date.now())
        },
        section: function (section) {
            this.internalSection = section;
            this.search = String(Date.now())
        },
        selectedHeaders: function (newVal) {
            localStorage['fields_' + this.internalSection] = JSON.stringify(newVal);
        },
        searchparams: function () {
            this.search = String(Date.now())
        },
        headers: function (headers) {
            var saved = localStorage['fields_' + this.internalSection];
            var selectedHeaders = saved ? JSON.parse(saved) : headers.map(item => item.column);

            if (JSON.stringify(selectedHeaders) !== JSON.stringify(this.selectedHeaders)) {
                this.selectedHeaders = selectedHeaders;
            }
        },
    },

    computed: {
        buttons: function () {
            var buttons = [];
            var self = this;

            this.vars?.buttons?.forEach(function (item) {
                if (item.page === 'list' && item.section === self.internalSection) {
                    buttons.push(item);
                }
            })

            return buttons;
        },
        activeHeaders: function () {
            var activeHeaders = [];
            this.selectedHeaders.forEach(function (item) {
                activeHeaders.push({
                    title: item,
                    value: item,
                    sortable: true,
                });
            });

            return activeHeaders;
        },
    },

    created() {
        this.internalSection = this.section ? this.section : this.$route.params.section;

        if (localStorage['fields_' + this.internalSection]) {
            this.selectedHeaders = JSON.parse(localStorage['fields_' + this.internalSection]);
        }
    },

    mounted() {
        // check if main page
        if (!this.hidebuttons) {
            document.title = 'ADMIN | ' + this.internalSection;
        }
    }

};
</script>
