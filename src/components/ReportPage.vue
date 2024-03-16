<template>
    <div class="w-100">
        <v-sheet class="d-flex justify-center flex-wrap text-center mx-auto px-4" width="100%">
            <v-card-text>

                <v-alert type="error" :text="error" v-if="error"></v-alert>

                <v-container class="ma-0" fluid>
                    <v-row>
                        <v-col>
                            <v-container class="ma-0" fluid>
                                <v-row>
                                    <v-col v-for="widget, index in report.source" :key="widget.title"
                                        @mouseover="widget.hover = true" @mouseout="widget.hover = false">
                                        <v-card style="overflow: visible; position: relative;" :loading="loading" :title="formatString(widget.table)">
                                            <v-card-text class="pa-1">
                                                <div class="text-h6">
                                                    <v-menu>
                                                        <template v-slot:activator="{ props }">
                                                            <v-btn color="primary" v-bind="props" icon="mdi-dots-vertical"
                                                                v-show="widget.hover || props['aria-expanded'] === 'true'"
                                                                style="position: absolute; top: 0; right: 0;">
                                                            </v-btn>
                                                        </template>

                                                        <v-list>
                                                            <v-list-item>
                                                                <v-list-item-title
                                                                    @click="editWidget(index, report.source)">Configure</v-list-item-title>
                                                            </v-list-item>
                                                            <v-list-item>
                                                                <v-list-item-title
                                                                    @click="deleteWidget(index, 'source')">Delete</v-list-item-title>
                                                            </v-list-item>
                                                            <v-list-item>
                                                                <v-list-item-title @click="openSortable(report.source)">Sort Order</v-list-item-title>
                                                            </v-list-item>
                                                        </v-list>
                                                    </v-menu>
                                                </div>

                                                <div v-for="filter in widget.filters" :key="filter">
                                                    <SearchField :column="filter" :type="getFieldType(filter, widget.table)"
                                                        :optionConfig="config.vars.options" :label="filter"
                                                        v-model="params[filter]" :func="params?.func?.[filter]"
                                                        @updateFunc="updateFunc"></SearchField>
                                                </div>
                                                
                                                <v-text-field type="number" v-model="itemsPerPage" label="Limit"
                                                    :error-messages="parseInt(itemsPerPage) === data?.length ? 'limit reached' : ''"
                                                    @blur="fetchData"></v-text-field>
                                            </v-card-text>
                                        </v-card>
                                    </v-col>
                                </v-row>
                                <v-btn icon="mdi-plus" @click="newWidget" color="primary" />
                            </v-container>
                        </v-col>

                        <v-col cols="10">

                            <v-container class="ma-0" fluid>
                                <v-row>
                                    <v-col cols="12" sm="6" md="3" v-for="widget, index in report.kpi" :key="widget.title"
                                        @mouseover="widget.hover = true" @mouseout="widget.hover = false">
                                        <v-card style="overflow: visible;">
                                            <v-card-text class="pa-1">
                                                <div class="text-h6" style="position: relative;">
                                                    {{ widget.title }}
                                                    <v-menu>
                                                        <template v-slot:activator="{ props }">
                                                            <v-btn color="primary" v-bind="props" icon="mdi-dots-vertical"
                                                                v-show="widget.hover || props['aria-expanded'] === 'true'"
                                                                style="position: absolute; top: -10px; right: -10px;">
                                                            </v-btn>
                                                        </template>

                                                        <v-list>
                                                            <v-list-item>
                                                                <v-list-item-title
                                                                    @click="editWidget(index, report.kpi)">Configure</v-list-item-title>
                                                            </v-list-item>
                                                            <v-list-item>
                                                                <v-list-item-title
                                                                    @click="deleteWidget(index, 'kpi')">Delete</v-list-item-title>
                                                            </v-list-item>
                                                            <v-list-item>
                                                                <v-list-item-title @click="openSortable(report.kpi)">Sort Order</v-list-item-title>
                                                            </v-list-item>
                                                        </v-list>
                                                    </v-menu>
                                                </div>
                                                <div class="text-body-2">
                                                    {{ applyFunc(widget, data) }}
                                                </div>
                                            </v-card-text>
                                        </v-card>
                                    </v-col>
                                </v-row>
                            </v-container>

                            <v-container class="ma-0" fluid>
                                <v-row>
                                    <v-col cols="12" v-for="widget, index in report.graph" :key="widget.title"
                                        @mouseover="widget.hover = true" @mouseout="widget.hover = false">
                                        <v-card style="overflow: visible; position: relative;" :title="widget.title">
                                            <v-card-text class="pa-1">
                                                <div class="text-h6">
                                                    <v-menu>
                                                        <template v-slot:activator="{ props }">
                                                            <v-btn color="primary" v-bind="props" icon="mdi-dots-vertical"
                                                                v-show="widget.hover || props['aria-expanded'] === 'true'"
                                                                style="position: absolute; top: 0; right: 0;">
                                                            </v-btn>
                                                        </template>

                                                        <v-list>
                                                            <v-list-item>
                                                                <v-list-item-title
                                                                    @click="editWidget(index, report.graph)">Configure</v-list-item-title>
                                                            </v-list-item>
                                                            <v-list-item>
                                                                <v-list-item-title
                                                                    @click="deleteWidget(index, 'graph')">Delete</v-list-item-title>
                                                            </v-list-item>
                                                            <v-list-item>
                                                                <v-list-item-title @click="openSortable(report.graph)">Sort Order</v-list-item-title>
                                                            </v-list-item>
                                                        </v-list>
                                                    </v-menu>
                                                </div>
                                                <div class="text-body-2" style="max-height: 400px;">
                                                    <ReportChart :items="getItems(widget)"></ReportChart>
                                                </div>
                                            </v-card-text>
                                        </v-card>
                                    </v-col>
                                </v-row>
                            </v-container>

                            <v-data-table v-for="widget, index in report.dataTable" :key="widget.title"
                                :items="getItems(widget)" @mouseover="widget.hover = true" @mouseout="widget.hover = false"
                                items-per-page-text="">
                                <template v-slot:headers="{ columns, isSorted, getSortIcon, toggleSort }">
                                    <tr>
                                        <template v-for="column, columnIndex in columns" :key="column.key">
                                            <td @mouseover="column.hover = true" @mouseout="column.hover = false" style="position: relative;">
                                                <span class="mr-2 cursor-pointer" @click="() => toggleSort(column)">{{
                                                    column.title }}</span>
                                                <template v-if="isSorted(column)">
                                                    <v-icon :icon="getSortIcon(column)"></v-icon>
                                                </template>
                                                <v-icon v-if="column.removable" icon="$close"
                                                    @click="() => remove(column.key)"></v-icon>

                                                <v-menu v-if="columnIndex > 0">
                                                    <template v-slot:activator="{ props }">
                                                        <v-btn color="primary" v-bind="props" icon="mdi-dots-vertical"
                                                            v-show="column.hover || props['aria-expanded'] === 'true'"
                                                            style="position: absolute; top: 0; right: 10px;">
                                                        </v-btn>
                                                    </template>

                                                    <v-list>
                                                        <v-list-item>
                                                            <v-list-item-title
                                                                @click="editColumn(columnIndex - 1, index)">Configure</v-list-item-title>
                                                        </v-list-item>
                                                        <v-list-item>
                                                            <v-list-item-title
                                                                @click="deleteColumn(columnIndex, index)">Delete</v-list-item-title>
                                                        </v-list-item>
                                                        <v-list-item>
                                                            <v-list-item-title @click="openSortable(report.dataTable)">Sort Order</v-list-item-title>
                                                        </v-list-item>
                                                    </v-list>
                                                </v-menu>
                                            </td>
                                        </template>
                                    </tr>
                                </template>

                                <template v-slot:[`footer.prepend`]>
                                    <v-menu>
                                        <template v-slot:activator="{ props }">
                                            <v-btn color="primary" v-bind="props" icon="mdi-dots-vertical"
                                                v-show="widget.hover || props['aria-expanded'] === 'true'">
                                            </v-btn>
                                        </template>

                                        <v-list>
                                            <v-list-item>
                                                <v-list-item-title @click="addColumn(widget)">Add column</v-list-item-title>
                                            </v-list-item>
                                            <v-list-item>
                                                <v-list-item-title
                                                    @click="editWidget(index, report.dataTable)">Configure</v-list-item-title>
                                            </v-list-item>
                                            <v-list-item>
                                                <v-list-item-title
                                                    @click="deleteWidget(index, 'dataTable')">Delete</v-list-item-title>
                                            </v-list-item>
                                            <v-list-item>
                                                <v-list-item-title @click="openSortable(widget.columns)">Sort Columns</v-list-item-title>
                                            </v-list-item>
                                        </v-list>
                                    </v-menu>
                                </template>
                            </v-data-table>
                        </v-col>
                    </v-row>
                </v-container>
            </v-card-text>
        </v-sheet>

        <v-dialog v-model="widgetDialog" max-width="600">
            <v-card title="Widget">
                <v-card-text>
                    <v-select label="Type" :items="['source', 'kpi', 'dataTable', 'graph', /*'filter', 'keyValue'*/]"
                        v-model="widget.type"></v-select>
                    <v-select label="Table" v-if="['source'].includes(widget.type)" v-model="widget.table"
                        :items="Object.keys(config.tables)" />
                    <v-text-field label="Title" v-if="['kpi', 'graph'].includes(widget.type)" v-model="widget.title"></v-text-field>
                    <v-select label="Source" v-if="['kpi', 'dataTable', 'graph', 'filter'].includes(widget.type)"
                        :items="report.source" v-model="widget.source" item-title="table" item-value="table"></v-select>
                    <v-select label="Columns" v-if="['source'].includes(widget.type)" :items="config.tables[widget.table]"
                        v-model="widget.columns" item-title="name" item-value="name" :disabled="!widget.table" multiple
                        chips clearable></v-select>
                    <v-select label="Filters" v-if="['source'].includes(widget.type)" :items="config.tables[widget.table]"
                        v-model="widget.filters" item-title="name" item-value="name" :disabled="!widget.table" multiple
                        chips></v-select>
                    <v-select label="Key" v-if="['kpi', 'graph', 'filter'].includes(widget.type)"
                        :items="report.source[0].columns.concat(['custom'])" v-model="widget.key" item-title="name" item-value="name"
                        :disabled="!widget.source"></v-select>
                    <v-text-field label="Row formula" v-if="['kpi', 'graph'].includes(widget.type) && widget.key === 'custom'" v-model="widget.row_formula" :disabled="widget.key !== 'custom'"></v-text-field>
                    <v-select label="Table Formula" v-if="['kpi', 'graph'].includes(widget.type)" :items="funcs"
                        v-model="widget.table_func"></v-select>
                    <v-text-field label="Custom table formula" v-if="['kpi'].includes(widget.type) && widget.table_func === 'custom'" v-model="widget.table_formula"
                        :disabled="widget.table_func !== 'custom'"></v-text-field>
                    <v-select label="Group By" v-if="['dataTable', 'graph',].includes(widget.type)"
                        :items="report.source[0].columns" v-model="widget.groupBy" item-title="name"
                        item-value="name"></v-select>
                    <v-select label="Format" v-if="['kpi'].includes(widget.type)" :items="['currency']"
                        v-model="widget.format"></v-select>
                </v-card-text>
                <v-card-actions>
                    <v-btn variant="flat" color="primary" :disabled="!widgetValid" @click="saveWidget" text="Save"></v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <v-dialog v-model="columnDialog" max-width="600">
            <v-card title="Column">
                <v-card-text>
                    <v-text-field label="Title" v-model="column.title"></v-text-field>
                    <v-select label="Key" :items="config.tables[widget.source]" v-model="column.key" item-title="name"
                        item-value="name"></v-select>
                    <v-text-field label="Expression" v-model="column.expression"
                        placeholder="JS expression to apply to each row"></v-text-field>
                    <v-select label="Table formula" :items="funcs" v-model="column.table_func"></v-select>
                    <v-text-field v-if="column.table_func === 'custom'" label="Custom" v-model="column.custom"
                        :disabled="column.func !== 'custom'"></v-text-field>
                    <v-select label="Format" :items="['currency']" v-model="column.format"></v-select>
                </v-card-text>
                <v-card-actions>
                    <v-btn variant="flat" color="primary" :disabled="!columnValid" @click="saveColumn" text="Save"></v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <v-dialog v-model="sortDialog" max-width="600" scrollable>
            <v-card title="Sort Order">
                <v-card-text>
                    <draggable :list="sortOrder" group="items" item-key>
                        <template #item="{ element }">
                            <v-sheet color="primary" class="ma-5 pa-5">{{ element.title }}</v-sheet>
                        </template>
                    </draggable>
                </v-card-text>
            </v-card>
        </v-dialog>
    </div>
</template>

<script>
import api from "../services/api";
import util from "../services/util";
import qs from "qs";
import SearchField from "./SearchField";
import ReportChart from "./ReportChart";
import draggable from 'vuedraggable'

export default {
    components: {
        SearchField,
        ReportChart,
        draggable,
    },
    data: function () {
        return {
            config: {
                tables: {},
            },
            data: [],
            report: {
                name: '',
                source: [],
                kpi: [],
                dataTable: [], // group by + heading: title, key, func, conditions
                filter: [], // keys
                graph: [], // heading, type, value, group by
            },
            source: {},
            widget: {},
            widgetDialog: false,
            column: {},
            columnDialog: false,
            funcs: ['count', 'sum', 'avg', 'custom'],
            editing: {}, // ref to the widget being edited
            params: {
                func: {},
            },
            itemsPerPage: 500,
            loading: false,
            error: '',
            sortDialog: false,
            sortOrder: [],
        }
    },
    methods: {
        fetchConfig: async function () {
            const result = await api.get('config.php');
            let data = result.data;

            this.config = data;

            await this.$nextTick();

            let title = data.vars?.branding?.title ? data.vars.branding.title : 'ADMIN';
            document.title = title + ' | Reports';
        },
        fetchData: async function () {
            let data = {
                cmd: 'get',
                section: this.report.source[0].table,
                fields: this.params,
                itemsPerPage: this.itemsPerPage,
                columns: this.report.source[0].columns,
            };

            const params = qs.stringify(data);

            this.loading = true;
            this.error = '';

            let result = {};
            try {
                result = await api.get('?' + params.toString(), data);
                this.data = result.data?.data;
            } catch (error) {
                console.log(error)
                this.error = error.message;
            }

            this.loading = false;

            await this.$nextTick();
        },
        newWidget: function () {
            this.editing = {};
            this.widget = {};
            this.widgetDialog = true;
        },
        editWidget: function (index, arr) {
            this.widget = { ...arr[index] };
            this.editing = {
                index: index,
                arr: arr
            }
            this.widgetDialog = true;
        },
        deleteWidget: function (index, key) {
            this.report[key] = this.report[key].splice(index, 1);
            this.saveReport();
        },
        saveWidget: function () {
            let widget = { ...this.widget };

            if (typeof this.editing.index !== 'undefined') {
                this.editing.arr[this.editing.index] = { ...this.editing.arr[this.editing.index], ...widget };
            } else {
                this.report[widget.type].push(widget);
            }
            this.widgetDialog = false;

            this.saveReport();
            this.fetchData();
        },
        addColumn: function (widget) {
            this.editing = {};
            this.column = {};
            this.widget = widget;
            this.columnDialog = true
        },
        editColumn: function (columnIndex, index) {
            this.widget = this.report.dataTable[index];
            let column = this.report.dataTable[index].columns[columnIndex];

            this.column = { ...column };
            this.editing = {
                index: columnIndex,
                arr: this.report.dataTable[index].columns
            }
            this.columnDialog = true;
        },
        saveColumn: function () {
            if (!this.widget.columns) {
                this.widget.columns = [];
            }

            let column = { ...this.column };

            if (typeof this.editing.index !== 'undefined') {
                this.editing.arr[this.editing.index] = { ...this.editing.arr[this.editing.index], ...column };
            } else {
                this.widget.columns.push(this.column);
            }

            this.saveReport();
            this.columnDialog = false;
        },
        deleteColumn: function (columnIndex, index) {
            this.report.dataTable[index].columns = this.report.dataTable[index].columns.splice(columnIndex, 1);
            this.saveReport();
        },
        sumRows(widget, data) {
            let total = 0;
            let value = 0;
            data.forEach(item => {
                if (widget.key === 'custom') {
                    for (const key in item) {
                        let type = this.config.tables[widget.source].find(column => column.name === key).type;

                        if (['id', 'int', 'decimal'].includes(type)) {
                            window[key] = parseFloat(item[key]);
                        } else {
                            window[key] = item[key];
                        }
                    }

                    value = eval(widget.row_formula);
                } else {
                    value = parseFloat(item[widget.key]);
                }

                total += value;
            });

            return total;
        },
        applyFunc: function (widget, data) {
            if (!data) {
                return false;
            }

            let total = 0;

            if (widget.table_func === 'count') {
                return data.length;
            }

            total = this.sumRows(widget, data);

            switch (widget.table_func) {
                case 'avg':
                    total /= data.length;
                    break;
                case 'custom':
                    total = eval(total + widget.table_formula)
                    break;
            }

            let formatOptions = {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            };

            if (widget.format === 'currency') {
                formatOptions.style = 'currency';
                formatOptions.currency = 'GBP';
            }

            return total.toLocaleString(undefined, formatOptions);
        },
        getItems: function (widget) {
            let groups = {};
            this.data?.forEach(item => {
                let value = item[widget.groupBy + '_label'] ? item[widget.groupBy + '_label'] : item[widget.groupBy]

                if (!groups[value]) {
                    groups[value] = [];
                }

                groups[value].push(item);
            });

            let items = [];
            for (const [index, group] of Object.entries(groups)) {
                let item = {};

                if (widget.type === 'graph') {
                    item.label = index;
                    item.total = this.applyFunc(widget, group);
                } else {
                    item[widget.groupBy] = index;
                    widget.columns?.forEach(column => {
                        item[column.title] = this.applyFunc(column, group);
                    })
                }

                items.push(item);
            }

            return items;
        },
        saveReport: function () {
            localStorage.report = JSON.stringify(this.report);
        },
        loadReport: function () {
            if (!localStorage.report) {
                return;
            }

            this.report = JSON.parse(localStorage.report);
            this.fetchData();
        },
        updateFunc: function (column, func) {
            this.params.func[column] = func;
        },
        getFieldType: function (column, table) {
            return this.config.tables[table]?.find(item => item.name === column).type;
        },        
		formatString: function (string) {
			return util.formatString(string);
		},
        
        openSortable: function (obj) {
            this.sortOrder = obj;
            this.sortDialog = true;
        },
    },
    computed: {
        widgetValid: function () {
            switch (this.widget.type) {
                case 'kpi':
                    return this.widget.title && this.widget.key && this.widget.table_func
            }

            return true;
        },
        columnValid: function () {
            return this.column.title && this.column.key && this.column.table_func;
        },
    },
    watch: {
        params: {
            handler: function () {
                this.fetchData();
            },
            deep: true
        }
    },
    async mounted() {
        if (!['Business'].includes(util.getEdition())) {
            this.$router.push(util.base() + 'upgrade');
            return;
        }

        await this.fetchConfig();
        this.loadReport();
    }

}
</script>