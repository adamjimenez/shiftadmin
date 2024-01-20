<template>
    <v-layout>
        <v-data-table-server v-model="selected" :headers="activeHeaders" :items="data.data" item-value="id" show-select
            @click:row="rowClick" :loading="loading" @update:options="loadItems" :items-length="totalItems"
            v-model:items-per-page="itemsPerPage" :search="search">

            <template v-slot:top>

                <v-container color="secondary" fluid v-if="!hidebuttons">
                    <v-row>
                        <v-col class="py-0">
                            <ListButtons :selected="selected" :section="internalSection" @changeFields="dialog = true"
                                @custombutton="customButton" :vars="vars" :sortable="isSortable"
                                @openSortable="sortableDialog = true">
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

        <v-dialog v-model="sortableDialog" max-width="600" scrollable>
            <v-card title="Sort Order" :loading="sortOrderLoading">
                <v-card-text>
                    <draggable v-model="sortOrder" group="items" @start="drag = true" @end="drag = false" item-key="id">
                        <template #item="{ element }">
                            <v-sheet color="primary" class="ma-5 pa-5">{{ element.title }}</v-sheet>
                        </template>
                    </draggable>
                </v-card-text>
                <v-card-actions>
                    <v-btn variant="flat" color="primary" @click="saveSortOrder">Save</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </v-layout>
</template>

<script>
import api from "../services/api";
import qs from "qs";
import ListButtons from "./ListButtons";
import draggable from 'vuedraggable'

export default {
    components: {
        ListButtons,
        draggable,
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
            sortableDialog: false,
            totalItems: 0,
            itemsPerPage: 20,
            search: '',
            headers: [],
            drag: false,
            sortOrder: [],
            sortOrderLoading: false,
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

            let result = {};
            try {
                result = await api.get('?' + params.toString(), data);
            } catch (error) {
                console.log(error)
            }

            this.loading = false;

            if (!result.data?.fields) {
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

            this.sortOrder = [];
            if (this.isSortable) {
                this.data.data.forEach((item) => {
                    let key = Object.keys(item)[0];
                    this.sortOrder.push({ title: key + ': ' + item[key], id: item.id, position: item.position });
                });

                this.sortOrder.sort((a, b) => {
                    return a.position - b.position;
                })
            }
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
            this.reload();
        },
        customButton: async function (button) {
            var data = {
                cmd: 'button',
                button: button.id,
                section: this.internalSection,
                ids: this.selected,
            };

            this.loading = true;
            const result = await api.post('?cmd=button&section=' + this.internalSection, data);
            this.loading = false;

            if (result.data.error) {
                alert(result.data.error);
            }

            if (result.data.result?.redirect) {
                if (button.target) {
                    window.open(result.data.result.redirect);
                } else {
                    location.href = result.data.result.redirect;
                }
            } else {
                this.reload();
            }
        },
        saveSortOrder: async function () {            
            var data = {
                cmd: 'reorder',
                section: this.section,
                items: this.sortOrder,
            };

            this.sortOrderLoading = true;
            await api.post('?cmd=reorder&section=' + this.internalSection, data);
            this.sortOrderLoading = false;

            this.sortableDialog = false;
            this.reload();
        },
        reload: function () {
            this.search = String(Date.now())
        }
    },

    watch: {
        $route(route) {
            this.internalSection = route.params.section;
            this.reload();
        },
        section: function (section) {
            this.internalSection = section;
            this.reload();
        },
        selectedHeaders: function (newVal) {
            localStorage['fields_' + this.internalSection] = JSON.stringify(newVal);
        },
        searchparams: function () {
            this.reload();
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
        isSortable: function () {
            let isSortable = false;
            if (this.data.fields) {
                Object.values(this.data.fields).forEach((item) => {
                    if (item.type === 'position') {
                        isSortable = true;
                    }
                });
            }
            return isSortable;
        }
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