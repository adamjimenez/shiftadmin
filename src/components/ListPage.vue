<template>
    <v-layout>
        <v-data-table-server v-model="selected" :headers="activeHeaders" :items="data.data" item-value="id" show-select
            @click:row="rowClick" :loading="loading" @update:options="loadItems" :items-length="totalItems"
            v-model:items-per-page="itemsPerPage" :search="search" fixed-header fixed-footer class="data-table-server" :page="page">

            <template v-slot:top>
                <v-sheet color="secondary" class="w-100">
                    <ListButtons v-if="!hidebuttons" :selected="selected" :section="internalSection" @changeFields="dialog = true"
                        @action="actionHandler" :vars="vars" :sortable="isSortable" :data="buttonData">
                    </ListButtons>
                </v-sheet>
            </template>

            <template v-slot:bottom></template>
        </v-data-table-server>

        <v-dialog v-model="importDialog" max-width="600" scrollable>
            <v-card title="Import">
                <v-card-text>
                    <v-alert v-if="error" :text="error" type="error" />

                    <v-file-input v-model="file" label="CSV file" @update:modelValue="readFile"></v-file-input>

                    <div v-if="importHeaders.length">
                        <h4>Match up the fields</h4>
                        <div v-for="(header, index) in headers" :key="index">
                            <v-select :items="importHeaders" :label="header.title" v-model="importCols[header.key]" />
                        </div>
                    </div>
                </v-card-text>
                <v-card-actions>
                    <v-btn @click="doImport" variant="flat" color="primary" :disabled="!importHeaders.length">Import</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

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
</style>

<script>
import api from "../services/api";
import util from "../services/util";
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
            data: {},
            internalSection: '',
            loading: false,
            importDialog: false,
            importHeaders: [],
            importCols: {},
            sortableDialog: false,
            totalItems: 0,
            itemsPerPage: 20,
            page: 1,
            search: '',
            headers: [],
            drag: false,
            sortOrder: [],
            sortOrderLoading: false,
            file: [],
            error: '',
            filter: '',
            buttonData: {},
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

            var data = {
                cmd: 'get',
                section: this.internalSection,
                fields: searchParams,
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
        doAction: async function (action) {
            let data = {
                cmd: action,
                section: this.section,
                ids: this.selected,
            };

            this.loading = true;
            await api.post('?cmd=' + action + '&section=' + this.internalSection, data);
            this.selected = [];
            this.reload();
        },
        actionHandler: async function (button) {
            let data = {};

            if (button === 'export') {
                this.exportItems();
                return
            } else if (button === 'import') {
                this.openImport();
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

                this.loading = true;
                await api.post('?cmd=' + button + '&section=' + this.internalSection, data);
                this.reload();
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
        exportItems: function () {
            let data = {
                cmd: 'export',
                section: this.internalSection,
                fields: this.searchparams,
                columns: this.activeHeaders.map(item => item.key),
            };

            if (this.parentsection) {
                data.parentsection = this.parentsection;
            }

            if (this.parentid) {
                data.parentid = this.parentid;
            }

            const params = qs.stringify(data);

            window.open(api.getApiRoot() + '?' + params);
        },
        openImport: function () {
            this.importDialog = true;
        },
        doImport: async function () {
            const formData = new FormData();

            // form data
            for (const [name, value] of Object.entries(this.importCols)) {
                formData.append('fields[' + name + ']', value);
            }
            
            // get file data
            formData.append('file', this.file[0]);

            this.error = '';
            this.loading = true;

            const result = await api.post('?cmd=import&section=' + this.internalSection, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            this.loading = false;

            if (result.data.error) {
                this.error = result.data?.error;
                return;
            }

            this.importDialog = false;
            this.reload();
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
        readFile: function () {
            const fileReader = new FileReader();
            fileReader.onload = (e) => {
                const csvData = e.target.result;
                const rows = csvData.split('\n');

                let headers = [];
                let rowData = rows[0].split(',');
                for (let i = 0; i < rowData.length; i++) {
                    const field = rowData[i].trim();
                    if (field.startsWith('"') && field.endsWith('"')) {
                        headers.push(field.slice(1, -1)); // Extract content excluding quotes
                    } else {
                        headers.push(field);
                    }
                }

                let preview = [];
                rowData = rows[1].split(',');
                for (let i = 0; i < rowData.length; i++) {
                    const field = rowData[i].trim();
                    if (field.startsWith('"') && field.endsWith('"')) {
                        preview.push(field.slice(1, -1)); // Extract content excluding quotes
                    } else {
                        preview.push(field);
                    }
                }

                this.importHeaders = [];
                headers.forEach((item, index) => {
                    this.importHeaders.push({
                        value: index,
                        raw: item,
                        title: item + ' - ' + preview[index],
                    });
                });

                // auto-match columns
                this.importCols = {};
                this.headers.forEach((header) => {
                    let option = this.importHeaders.find(item => item.raw === header.key);
                    this.importCols[header.key] = option ? option.value : '';
                });
            };
            fileReader.readAsText(this.file[0]);
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
            localStorage['fields_' + this.internalSection] = JSON.stringify(Object.values(newVal));
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

            if (JSON.stringify(selectedHeaders) !== JSON.stringify(this.selectedHeaders)) {
                this.selectedHeaders = selectedHeaders;
            }

            // get active fields
            let fields = [];
            this.selectedHeaders.forEach(item => {
                for (const [, field] of Object.entries(this.data.fields)) {
                    if (item === field.column) {
                        fields.push(field);
                    }
                }
            });

            this.$emit('changeFields', fields);
        },
    },

    computed: {
        activeHeaders: function () {
            let activeHeaders = [];
            
            this.selectedHeaders.forEach(item => {
                activeHeaders.push({
                    title: this.formatString(item),
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

    mounted() {}

};
</script>