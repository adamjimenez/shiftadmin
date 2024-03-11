<template>
    <v-layout>
        <v-data-table-server v-model="selected" :headers="activeHeaders" :items="data.data" item-value="id" show-select
            @click:row="rowClick" :loading="loading" @update:options="loadItems" :items-length="totalItems"
            v-model:items-per-page="itemsPerPage" :search="search" fixed-header fixed-footer class="data-table-server" :page="page">

            <template v-slot:top>
                <v-sheet color="secondary" class="w-100">
                    <ListButtons v-if="!hidebuttons" :selected="selected" :section="internalSection" @changeFields="dialog = true"
                        @action="actionHandler" :vars="vars" :sortable="isSortable" :data="buttonData" :mobile="mobile">
                    </ListButtons>
                </v-sheet>
            </template>

            <template v-slot:bottom></template>
        </v-data-table-server>

        <ImportExport ref="importExport" :headers="headers" :section="internalSection" :fields="searchparams" :columns="selectedHeaders" @reload="reload" />
        <BulkEdit ref="bulkEdit" :section="internalSection" :fields="data?.fields" @action="actionHandler" :vars="vars" :count="selected.length" :defaultData="defaultData" />

        <v-dialog v-model="dialog" max-width="600" scrollable>
            <v-card title="Fields">
                <v-data-table v-model="selectedHeaders" :headers="[{ title: 'Field', key: 'title' }]" :items="headers"
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

<style>
.data-table-server .v-table__wrapper {
    overflow: auto;
    height: 100px;
    flex-grow: 1;
}

.data-table-server .v-data-table__td {
    max-width: 300px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
</style>

<script>
import api from "../services/api";
import util from "../services/util";
import qs from "qs";
import ListButtons from "./ListButtons";
import draggable from 'vuedraggable'
import ImportExport from "./ImportExport";
import BulkEdit from "./BulkEdit";

export default {
    components: {
        ListButtons,
        draggable,
        ImportExport,
        BulkEdit,
    },
    props: {
        vars: null,
        section: null,
        hidebuttons: Boolean, // used when included in view page
        parentsection: null,
        parentid: null,
        searchparams: null,
        mobile: null,
    },
    data: function () {
        return {
            dialog: false,
            selectedHeaders: [], // flat array of header column names to display
            headers: [], // array of all headers (title, key)
            selected: [],
            data: {},
            internalSection: '',
            loading: false,
            sortableDialog: false,
            totalItems: 0,
            itemsPerPage: 20,
            page: 1,
            search: '',
            drag: false,
            sortOrder: [],
            sortOrderLoading: false,
            file: [],
            filter: '',
            buttonData: {},
            defaultData: {}, // used for bulk edit
        };
    },
    methods: {
        formatString: function (string) {
            return util.formatString(string);
        },
        loadItems: async function ({ page, itemsPerPage, sortBy }) {
            let searchParams = this.searchparams;

            if (this.filter) {
                searchParams['s'] = this.filter;
            }

            let data = {
                cmd: 'get',
                section: this.internalSection,
                fields: searchParams,
                page: page,
                itemsPerPage: itemsPerPage,
                sortBy: sortBy,
                columns: this.selectedHeaders
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

            if (!result.data.data) {
                result.data.data = [];
                result.data.total = 0;
            }

            // format data
            result.data.data.forEach(item => {
                for (const [, field] of Object.entries(result.data.fields)) {
                    if (item[field.column + '_label']) {
                        item[field.column] = item[field.column + '_label'];
                    } else {
                        item[field.column] = util.formatData(item[field.column], field.type);
                    }
                }
            });

            this.data = result.data;
            this.totalItems = this.data.total;

            this.$emit('updateCount', this.totalItems);

            // pagination
            this.buttonData = {
                page: page,
                itemsPerPage: itemsPerPage,
                totalItems: this.totalItems,
            };

            // headers
            this.headers = [];
            let allHeaders = Object.values(result.data.fields);

            if (allHeaders.length && !allHeaders.find(obj => obj.column === 'id')) {
                // redirect
                let base = util.base();
                this.$router.push(base + 'section/' + this.internalSection + '/1/');
                return false;
            }

            for (const [, field] of Object.entries(this.data.fields)) {
                this.headers.push({
                    title: this.formatString(field.column),
                    key: field.column,
                });
            }

            let allHeaderKeys = allHeaders.map(item => item.column);

            if (!this.selectedHeaders.length) {
                this.selectedHeaders = allHeaderKeys;
            }

            this.$emit('changeHeaders', allHeaders)

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

            let title = this.vars?.branding?.title ? this.vars.branding.title : 'ADMIN';
            document.title = title + ' | ' + this.internalSection;

            this.$emit('loaded')
        },
        rowClick: function (e, item) {
            let base = '/';
            if (this.$route.params.base) {
                base += this.$route.params.base + '/';
            }

            let link = base + 'section/' + this.internalSection + '/' + item.item.id + '/';

            if (this.parentsection) {
                link += '?parentsection=' + this.parentsection + '&parentid=' + this.parentid;
            }

            this.$router.push(link);
        },
        actionHandler: async function (button) {
            let data = {};

            if (button === 'export') {
                if (!['Basic', 'Business'].includes(util.getEdition())) {
                    this.$router.push(util.base() + 'upgrade');
                    return;
                }

                this.$refs['importExport'].exportItems();
                return
            } else if (button === 'import') {
                if (!['Basic', 'Business'].includes(util.getEdition())) {
                    this.$router.push(util.base() + 'upgrade');
                    return;
                }
                
                this.$refs['importExport'].openImport();
                return
            } else if (button === 'openBulkEdit') {
                this.defaultData = {};

                let i = 0;
                this.selected.forEach(id => {
                    let row = this.data.data.find(item => id == item.id);

                    for (const [key, value] of Object.entries(row)) {
                        if (i === 0) {
                            this.defaultData[key] = value;
                        } else if (this.defaultData[key] !== value) {
                            this.defaultData[key] = null;
                        }
                    }

                    i++;
                })

                this.$refs['bulkEdit'].open();
                return
            } else if (button === 'openSortable') {
                this.sortableDialog = true
                return
            } else if (button === 'filter') {
                this.filter = arguments[1];
                this.reload();
                return
            } else if (button === 'prevPage') {
                if (this.page === 1) {
                    return;
                }
                this.page--;
                return
            } else if (button === 'nextPage') {
                if (this.page * this.itemsPerPage >= this.totalItems) {
                    return;
                }

                this.page++;
                return
            } else if (typeof button === 'string') {
                data = {
                    cmd: button,
                    section: this.internalSection,
                    ids: this.selected,
                }; 

                if (typeof arguments[1] === 'object') {
                    data = { ...data, ...arguments[1]};
                }

                this.loading = true;
                await api.post('?cmd=' + button + '&section=' + this.internalSection, data);
                this.reload();
                return;
            }

            // custom button
            if (!['Basic', 'Business'].includes(util.getEdition())) {
                this.$router.push(util.base() + 'upgrade');
                return;
            }

            data = {
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
            let data = {
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
        },
    },
    watch: {
        internalSection: function () {
            if (localStorage['fields_' + this.internalSection]) {
                this.selectedHeaders = JSON.parse(localStorage['fields_' + this.internalSection]);
            }
        },
        $route(route) {
            this.internalSection = route.params.section;
            this.reload();
        },
        section: function (section) {
            this.internalSection = section;
            this.reload();
        },
        selectedHeaders: function (newVal, oldVal) {            
            if (JSON.stringify(newVal) !== JSON.stringify(oldVal)) {
                localStorage['fields_' + this.internalSection] = JSON.stringify(Object.values(newVal));
            }

            // get active fields
            if (this.data.fields) {
                let fields = [];
                
                for (const [, field] of Object.entries(this.data.fields)) {
                    if (newVal.includes(field.column)) {
                        fields.push(field);
                    }
                }

                this.$emit('changeFields', fields);
            }
        },
        searchparams: function () {
            this.reload();
        },
        headers: function (headers) {
            let saved = localStorage['fields_' + this.internalSection];
            let selectedHeaders = saved ? JSON.parse(saved) : headers.map(item => item.key);

            // check the headers exist
            let allHeaderKeys = headers.map(item => item.key);
            selectedHeaders = selectedHeaders.filter((header) => allHeaderKeys.includes(header));

            this.selectedHeaders = selectedHeaders;
        },
    },
    computed: {
        activeHeaders: function () { // turns selectedHeaders array into multidimensional array
            let activeHeaders = [];

            if (this.data.fields) {
                Object.values(this.data.fields).forEach((item) => {
                    if (this.selectedHeaders.includes(item.column)) {
                        activeHeaders.push({
                            title: this.formatString(item.column),
                            value: item.column,
                            sortable: true, // used by v-data-table
                        });
                    }
                });
            }

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
    },
};
</script>