<template>
    <div class="w-100">
        <v-sheet class="d-flex justify-center flex-wrap text-center mx-auto" width="100%">
            <v-card-text>
                <v-fab icon="mdi-plus" @click="newWidget" color="primary" location="end" absolute app appear></v-fab>

                <v-alert type="error" :text="error" v-if="error"></v-alert>

                <v-card-title>
                    <v-text-field v-model="reportTitle" variant="outlined" @update:focused="updateTitle"></v-text-field>
                </v-card-title>

                <v-container class="ma-0" fluid>
                    <v-row>
                        <v-col>
                            <div v-for="widget, index in report.source" :key="widget.title"
                                @mouseover="hover = 'source' + index" @mouseout="hover = ''">
                                <v-card style="overflow: visible; position: relative;" :loading="loading"
                                    :title="formatString(widget.table)">
                                    <v-card-text class="pa-1">
                                        <div class="text-h6">
                                            <v-menu>
                                                <template v-slot:activator="{ props }">
                                                    <v-btn color="primary" v-bind="props" icon="mdi-dots-vertical"
                                                        v-show="hover === 'source' + index || props['aria-expanded'] === 'true'"
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
                                                        <v-list-item-title @click="openSortable(report.source)">Sort
                                                            Order</v-list-item-title>
                                                    </v-list-item>
                                                </v-list>
                                            </v-menu>
                                        </div>

                                        <div v-for="filter in widget.filters" :key="filter">
                                            <SearchField :column="filter" :type="getFieldType(filter, widget.table)"
                                                :optionConfig="config.vars.options" :label="formatString(filter)"
                                                v-model="report.params[filter]" :func="report.params?.func?.[filter]"
                                                @updateFunc="updateFunc"></SearchField>

                                            <SearchField
                                                v-if="['date', 'datetime', 'timestamp'].includes(getFieldType(filter, widget.table))"
                                                :column="filter" :type="getFieldType(filter, widget.table)"
                                                :optionConfig="config.vars.options"
                                                :label="formatString('Compare ' + filter)"
                                                v-model="report.compare[filter]"></SearchField>
                                        </div>

                                        <v-text-field type="number" v-model="itemsPerPage" label="Limit"
                                            :error-messages="parseInt(itemsPerPage) === data?.length ? 'limit reached' : ''"
                                            @blur="fetchData"></v-text-field>

                                        <v-btn @click="report.params = {}">Reset</v-btn>
                                    </v-card-text>
                                </v-card>
                            </div>
                        </v-col>

                        <v-col cols="10">

                            <v-container class="ma-0" fluid>
                                <v-row>
                                    <v-col cols="12" sm="6" md="3" v-for="widget, index in report.kpi"
                                        :key="widget.title" @mouseover="hover = 'kpi' + index" @mouseout="hover = ''">
                                        <v-card style="overflow: visible;" :title="widget.title">
                                            <v-card-text class="pa-1">
                                                <div class="text-h6" style="position: relative;">
                                                    <v-menu>
                                                        <template v-slot:activator="{ props }">
                                                            <v-btn color="primary" v-bind="props"
                                                                icon="mdi-dots-vertical"
                                                                v-show="hover === 'kpi' + index || props['aria-expanded'] === 'true'"
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
                                                                <v-list-item-title
                                                                    @click="openSortable(report.kpi)">Sort
                                                                    Order</v-list-item-title>
                                                            </v-list-item>
                                                        </v-list>
                                                    </v-menu>
                                                </div>
                                                <div class="text-body-2">
                                                    <router-link :to="getLink(widget)">
                                                        <CompareValue :newVal="applyFunc(widget, data, true)" :oldVal="applyFunc(widget, compareData, true)" :format="widget.format"></CompareValue>
                                                    </router-link>
                                                </div>
                                            </v-card-text>
                                        </v-card>
                                    </v-col>
                                </v-row>
                            </v-container>

                            <v-container class="ma-0" fluid>
                                <v-row>
                                    <v-col cols="12" v-for="widget, index in report.graph" :key="widget.title"
                                        @mouseover="hover = 'graph' + index" @mouseout="hover = ''">
                                        <v-card style="overflow: visible; position: relative;" :title="widget.title">
                                            <v-card-text class="pa-1">
                                                <div class="text-h6">
                                                    <v-menu>
                                                        <template v-slot:activator="{ props }">
                                                            <v-btn color="primary" v-bind="props"
                                                                icon="mdi-dots-vertical"
                                                                v-show="hover === 'graph' + index || props['aria-expanded'] === 'true'"
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
                                                                <v-list-item-title
                                                                    @click="openSortable(report.graph)">Sort
                                                                    Order</v-list-item-title>
                                                            </v-list-item>
                                                        </v-list>
                                                    </v-menu>
                                                </div>
                                                <div class="text-body-2" style="max-height: 400px;">
                                                    {{ widget.format }}
                                                    <ReportChart :type="widget.graph_type" :items="getItems(widget)" :label="formatString(widget.key)" :format="widget.format"></ReportChart>
                                                </div>
                                            </v-card-text>
                                        </v-card>
                                    </v-col>
                                </v-row>
                            </v-container>

                            <v-table v-for="widget, index in report.keyValue" :key="widget.title"
                                @mouseover="hover = 'keyValue' + index" @mouseout="hover = ''">
                                <template v-slot:[`top`]>
                                    <h2 style="overflow: visible; position: relative;">
                                        {{widget.title}}
                                        
                                        <v-menu>
                                            <template v-slot:activator="{ props }">
                                                <v-btn color="primary" v-bind="props" icon="mdi-dots-vertical"
                                                    v-show="hover === 'keyValue' + index || props['aria-expanded'] === 'true'"
                                                    style="position: absolute; top: -10px; right: 0;">
                                                </v-btn>
                                            </template>

                                            <v-list>
                                                <v-list-item>
                                                    <v-list-item-title @click="addColumn(widget)">Add
                                                        row</v-list-item-title>
                                                </v-list-item>
                                                <v-list-item>
                                                    <v-list-item-title
                                                        @click="editWidget(index, report.keyValue)">Configure</v-list-item-title>
                                                </v-list-item>
                                                <v-list-item>
                                                    <v-list-item-title
                                                        @click="deleteWidget(index, 'keyValue')">Delete</v-list-item-title>
                                                </v-list-item>
                                                <v-list-item>
                                                    <v-list-item-title @click="openSortable(widget.columns)">Sort
                                                        Rows</v-list-item-title>
                                                </v-list-item>
                                            </v-list>
                                        </v-menu>
                                    </h2>
                                </template>

                                <tbody>
                                    <tr v-for="column, columnIndex in widget.columns" :key="column.key" @mouseover.stop="hover = 'keyValueColumn' + index + '_' + columnIndex"
                                            @mouseout="hover = ''" style="overflow: visible; position: relative;">
                                        <td>{{ column.title }}</td>
                                        <td>
                                            {{ applyFunc(column,data) }}
                                        </td>
                                        <td>
                                            <v-menu>
                                                <template v-slot:activator="{ props }">
                                                    <v-btn color="primary" v-bind="props" icon="mdi-dots-vertical"
                                                        v-show="hover === 'keyValueColumn' + index + '_' + columnIndex || props['aria-expanded'] === 'true'"
                                                        style="position: absolute; top: 0; right: 10px;">
                                                    </v-btn>
                                                </template>

                                                <v-list>
                                                    <v-list-item>
                                                        <v-list-item-title
                                                            @click="editColumn(columnIndex, widget)">Configure</v-list-item-title>
                                                    </v-list-item>
                                                    <v-list-item>
                                                        <v-list-item-title
                                                            @click="deleteColumn(columnIndex, index)">Delete</v-list-item-title>
                                                    </v-list-item>
                                                </v-list>
                                            </v-menu>
                                        </td>
                                    </tr>
                                </tbody>
                            </v-table>

                            <v-data-table v-for="widget, index in report.dataTable" :key="widget.title"
                                :items="getItems(widget)" @mouseover="hover = 'dataTable' + index"
                                @mouseout="hover = ''" items-per-page-text="">
                                <template v-slot:headers="{ columns, isSorted, getSortIcon, toggleSort }">
                                    <tr>
                                        <template v-for="column, columnIndex in columns" :key="column.key">
                                            <td @mouseover.stop="hover = 'dataTableColumn' + index + '_' + columnIndex"
                                                @mouseout="hover = ''" style="position: relative;">
                                                <span class="mr-2 cursor-pointer" @click="() => toggleSort(column)">{{ column.title }}</span>
                                                <template v-if="isSorted(column)">
                                                    <v-icon :icon="getSortIcon(column)"></v-icon>
                                                </template>
                                                <v-icon v-if="column.removable" icon="$close"
                                                    @click="() => remove(column.key)"></v-icon>

                                                <v-menu v-if="columnIndex > 0">
                                                    <template v-slot:activator="{ props }">
                                                        <v-btn color="primary" v-bind="props" icon="mdi-dots-vertical"
                                                            v-show="hover === 'dataTableColumn' + index + '_' + columnIndex || props['aria-expanded'] === 'true'"
                                                            style="position: absolute; top: 0; right: 10px;">
                                                        </v-btn>
                                                    </template>

                                                    <v-list>
                                                        <v-list-item>
                                                            <v-list-item-title
                                                                @click="editColumn(columnIndex - 1, widget)">Configure</v-list-item-title>
                                                        </v-list-item>
                                                        <v-list-item>
                                                            <v-list-item-title
                                                                @click="deleteColumn(columnIndex, index)">Delete</v-list-item-title>
                                                        </v-list-item>
                                                        <v-list-item>
                                                            <v-list-item-title
                                                                @click="openSortable(report.dataTable)">Sort
                                                                Order</v-list-item-title>
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
                                                v-show="hover === 'dataTable' + index || props['aria-expanded'] === 'true'">
                                            </v-btn>
                                        </template>

                                        <v-list>
                                            <v-list-item>
                                                <v-list-item-title @click="addColumn(widget)">Add
                                                    column</v-list-item-title>
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
                                                <v-list-item-title @click="openSortable(widget.columns)">Sort
                                                    Columns</v-list-item-title>
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
                    <v-select label="Type" :items="['source', 'kpi', 'dataTable', 'graph', 'keyValue']"
                        v-model="widget.type"></v-select>
                    <v-select label="Table" v-if="['source'].includes(widget.type)" v-model="widget.table"
                        :items="Object.keys(filteredTables)" />
                    <v-text-field label="Title" v-if="['kpi', 'graph', 'keyValue'].includes(widget.type)"
                        v-model="widget.title"></v-text-field>
                    <v-select label="Graph type" v-if="['graph'].includes(widget.type)" v-model="widget.graph_type"
                        :items="['bar', 'line']" />
                    <v-select label="Source"
                        v-if="['kpi', 'dataTable', 'graph', 'filter', 'keyValue'].includes(widget.type)"
                        :items="report.source" v-model="widget.source" item-title="table" item-value="table"></v-select>
                    <v-autocomplete label="Columns" v-if="['source'].includes(widget.type)"
                        :items="config.tables[widget.table]" v-model="widget.columns" item-title="name"
                        item-value="name" :disabled="!widget.table" multiple chips clearable
                        auto-select-first="exact"></v-autocomplete>
                    <v-autocomplete label="Filters" v-if="['source'].includes(widget.type)"
                        :items="config.tables[widget.table]" v-model="widget.filters" item-title="name"
                        item-value="name" :disabled="!widget.table" multiple chips clearable
                        auto-select-first="exact"></v-autocomplete>
                    <v-text-field label="Filter" v-if="['kpi'].includes(widget.type)"
                        v-model="widget.filter"></v-text-field>
                    <v-select label="Key" v-if="['kpi', 'graph', 'filter'].includes(widget.type)"
                        :items="report.source[0].columns.concat(['custom'])" v-model="widget.key" item-title="name"
                        item-value="name" :disabled="!widget.source"></v-select>
                    <v-text-field label="Row formula"
                        v-if="['kpi', 'graph'].includes(widget.type) && widget.key === 'custom'"
                        v-model="widget.row_formula" :disabled="widget.key !== 'custom'"></v-text-field>
                    <v-select label="Table Formula" v-if="['kpi', 'graph'].includes(widget.type)" :items="funcs"
                        v-model="widget.table_func"></v-select>
                    <v-text-field label="Custom table formula"
                        v-if="['kpi'].includes(widget.type) && widget.table_func === 'custom'"
                        v-model="widget.table_formula" :disabled="widget.table_func !== 'custom'"></v-text-field>
                    <v-select label="Group By" v-if="['dataTable', 'graph',].includes(widget.type)"
                        :items="report.source[0].columns" v-model="widget.groupBy" item-title="name"
                        item-value="name"></v-select>
                    <v-select label="Group by formula" v-if="['dataTable', 'graph',].includes(widget.type)" :items="groupby_funcs"
                        v-model="widget.groupby_func"></v-select>
                    <v-text-field label="Custom group by formula" v-if="widget.groupby_func === 'custom'"
                        v-model="widget.groupby_formula"
                        :messages="'e.g. new Date(' + widget.key + ').toLocaleString(\'default\', { month: \'long\', year: \'numeric\' })'"></v-text-field>
                    <v-select label="Format" v-if="['kpi', 'graph'].includes(widget.type)" :items="['currency']"
                        v-model="widget.format" clearable></v-select>
                </v-card-text>
                <v-card-actions>
                    <v-btn variant="flat" color="primary" :disabled="!widgetValid" @click="saveWidget"
                        text="Save"></v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <v-dialog v-model="columnDialog" max-width="600">
            <v-card :title="widget.type === 'keyValue' ? 'Row' : 'Column'">
                <v-card-text>
                    <v-text-field label="Title" v-model="column.title"></v-text-field>
                    <v-select label="Key" :items="report.source[0].columns" v-model="column.key" item-title="name"
                        item-value="name"></v-select>
                    <v-text-field label="Expression" v-model="column.expression"
                        placeholder="JS expression to apply to each row"></v-text-field>
                    <v-select label="Table formula" :items="funcs" v-model="column.table_func"></v-select>
                    <v-text-field v-if="column.table_func === 'custom'" label="Custom" v-model="column.custom"
                        :disabled="column.table_func !== 'custom'"></v-text-field>
                    <v-select label="Format" :items="['currency']" v-model="column.format" clearable></v-select>
                </v-card-text>
                <v-card-actions>
                    <v-btn variant="flat" color="primary" :disabled="!columnValid" @click="saveColumn"
                        text="Save"></v-btn>
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
import CompareValue from "./CompareValue";

export default {
    components: {
        SearchField,
        ReportChart,
        draggable,
        CompareValue,
    },
    data: function () {
        return {
            config: {
                tables: {},
            },
            data: [],
            compareData: [],
            report: {
                title: '',
                source: [],
                kpi: [],
                dataTable: [], // group by + heading: title, key, func, conditions
                filter: [], // keys
                graph: [], // heading, type, value, group by
                params: {},
                keyValue: {},
                compare: {},
            },
            defaultReport: {
                title: 'Untitled',
                source: [],
                kpi: [],
                dataTable: [], // group by + heading: title, key, func, conditions
                filter: [], // keys
                graph: [], // heading, type, value, group by
                params: {},
                keyValue: {},
                compare: {},
            },
            hover: '',
            source: {},
            widget: {},
            widgetDialog: false,
            column: {},
            columnDialog: false,
            funcs: ['count', 'sum', 'avg', 'custom'],
            groupby_funcs: ['month', 'custom'],
            editing: {}, // ref to the widget being edited
            itemsPerPage: 100000,
            loading: false,
            error: '',
            sortDialog: false,
            sortOrder: [],
            reportTitle: '',
            reloadConfig: false,
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
                section: this.report.source?.[0]?.table,
                fields: this.report.params,
                compare: this.report.compare,
                itemsPerPage: this.itemsPerPage,
                columns: this.report.source?.[0]?.columns,
            };

            const params = qs.stringify(data);

            this.loading = true;
            this.error = '';

            let result = {};
            try {
                result = await api.get('?' + params.toString(), data);
                this.data = result.data?.data;
                this.compareData = result.data?.compare_data;
            } catch (error) {
                console.log(error)
                this.error = error.message;
            }

            this.loading = false;
            
            let title = data.vars?.branding?.title ? data.vars.branding.title : 'ADMIN';
            
            title = title + ' | Reports';

            if (this.report.title) {
                title += ' | ' + this.report.title;            
            }

            await this.$nextTick();
            document.title = title;
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
            this.report[key].splice(index, 1);
        },
        saveWidget: function () {
            let widget = { ...this.widget };

            if (typeof this.editing.index !== 'undefined') {
                this.editing.arr[this.editing.index] = { ...this.editing.arr[this.editing.index], ...widget };
            } else {
                if (!Array.isArray(this.report[widget.type])) {
                    this.report[widget.type] = [];
                }

                this.report[widget.type].push(widget);
            }
            this.widgetDialog = false;

            this.fetchData();
        },
        addColumn: function (widget) {
            this.editing = {};
            this.column = {};
            this.widget = widget;
            this.columnDialog = true
        },
        editColumn: function (columnIndex, widget) {
            this.widget = widget;
            let column = widget.columns[columnIndex];

            this.column = { ...column };
            this.editing = {
                index: columnIndex,
                arr: widget.columns
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

            this.columnDialog = false;
        },
        deleteColumn: function (columnIndex, index) {
            this.report.dataTable[index].columns.splice(columnIndex, 1);
        },
        sumRows(widget, data) {
            let total = 0;
            let value = 0;
            data.forEach(item => {
                if (widget.key === 'custom') {
                    value = this.applyFormula(widget.row_formula, item);
                } else {
                    value = parseFloat(item[widget.key]);
                }

                total += value;
            });

            return total;
        },
        applyFunc: function (widget, data, raw) {
            if (!data) {
                return false;
            }

            let filtered = [];

            if (widget.filter) {
                // convert filter query string into an array
                let params = qs.parse(widget.filter);

                // filter rows
                data.forEach(item => {
                    for (const key in params) {
                        console.log(params[key])
                        if (params[key].substr(0, 1) === '>') {
                            if (item[key] <= params[key].substr(1)) {
                                return;
                            }
                        } else if (params[key].substr(0, 1) === '<') {
                            if (item[key] >= params[key].substr(1)) {
                                return;
                            }
                        } else if (item[key] != params[key]) {
                            return;
                        }
                    }

                    filtered.push(item);
                });
            } else {
                filtered = data;
            }

            if (widget.table_func === 'count') {
                return filtered.length;
            }

            let total = 0;
            total = this.sumRows(widget, filtered);

            switch (widget.table_func) {
                case 'avg':
                    total /= filtered.length;
                    break;
                case 'custom':
                    try {
                        total = eval(total + widget.table_formula)
                    } catch (error) {
                        console.log(error);
                    }
                    break;
            }

            if (raw) {
                return total;
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
        applyFormula: function (formula, item) {
            for (const key in item) {
                if (!isNaN(item[key])) {
                    window[key] = parseFloat(item[key]);
                } else {
                    window[key] = item[key];
                }
            }

            let result;
            try {
                result = eval(formula);
            } catch (error) {
                console.log(error);
            }

            return result;
        },
        getItems: function (widget) {
            let groups = {};

            // put values into each group
            this.data?.forEach(item => {
                let value = item[widget.groupBy + '_label'] ? item[widget.groupBy + '_label'] : item[widget.groupBy]

                if (widget.groupby_func) {
                    let groupby_formula = '';

                    switch (widget.groupby_func) {
                        case 'custom':
                            groupby_formula = widget.groupby_formula;
                        break;
                        case 'month':
                            groupby_formula =  "new Date(" + widget.key + ").toLocaleString('default', { month: 'long', year: 'numeric' })";
                        break;
                    }

                    value = this.applyFormula(groupby_formula, item);
                }

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
                    item.total = this.applyFunc(widget, group, true);
                } else {
                    if (widget.groupBy) {
                        item[widget.groupBy] = index;
                    }

                    widget.columns?.forEach(column => {
                        item[column.title] = this.applyFunc(column, group);
                    })
                }

                items.push(item);
            }

            return items;
        },
        saveReport: async function () {
            let reportData = JSON.stringify(this.report);
            if (reportData === JSON.stringify(this.defaultReport)) {
                return false;
            }

            localStorage.report = reportData;

            this.loading = true;
            this.error = '';

            const result = await api.post('?cmd=reports', {
                save: 1,
                title: this.report.title,
                report: reportData,
                id: this.$route.params.id,
            });
            let data = result.data;

            if (data.error) {
                this.error = data.error;
            }

            this.loading = false;

            if (data.id !== this.$route.params.section) {
                this.$router.push(this.base + 'reports/' + data.id);
                this.$emit('configUpdated');
                this.reloadConfig = false;
            }
        },
        loadReport: async function () {
            if (!parseInt(this.$route.params.id)) {
                this.report = { ...this.defaultReport };
                this.reportTitle = this.report.title;
                this.data = {};
                return;
            }

            this.loading = true;
            this.error = '';

            const result = await api.get('?cmd=reports&id=' + this.$route.params.id);
            let data = result.data;

            if (data.error) {
                this.error = data.error;
            }

            this.loading = false;

            let report = JSON.parse(data.report.report);
            if (typeof report.compare !== 'object') {
                report.compare = {};
            }

            this.report = report;
            if (!this.report.title) {
                this.report.title = 'untitled';
            }
            this.reportTitle = this.report.title;

            this.fetchData();
        },
        updateFunc: function (column, func) {
            if (!this.report.params.func) {
                this.report.params.func = {};
            }

            if (this.report.params.func[column] !== func) {
                this.report.params.func[column] = func;
            }
        },
        getFieldType: function (column, table) {
            return this.config.tables[table]?.find(item => item.name === column)?.type;
        },
        formatString: function (string) {
            return util.formatString(string);
        },
        openSortable: function (obj) {
            this.sortOrder = obj;
            this.sortDialog = true;
        },
        updateTitle: function (focussed) {
            if (focussed === false && this.report.title !== this.reportTitle) {
                this.report.title = this.reportTitle;
                this.reloadConfig = true;
            }
        },
        compare: function (newVal, oldVal) {
            let perc = (newVal - oldVal) / oldVal;
            return newVal + ' ' + perc.toFixed(1) + '%';
        },
        getLink: function (widget) {
            let paramString = this.report.params ? qs.stringify(this.report.params) : '';

            return '/section/' + widget.source + '?' + paramString + '&' + widget.filter;
        }
    },
    computed: {
        base() {
            return util.base();
        },
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
        filteredTables: function () {
            let tables = {};

            if (!this.config.tables) {
                return tables;
            }

            let configTables = [
                'cms_activation',
                'cms_filters',
                'cms_login_attempts',
                'cms_logs',
                'cms_privileges',
                'cms_reports',
                'cms_trusted_devices',
                'email_templates',
                'files'
            ];

            for (let [index, table] of Object.entries(this.config.tables)) {
                if (configTables.includes(index)) {
                    continue;
                }

                tables[index] = table;
            }

            return tables;
        },
    },
    watch: {
        report: {
            handler: function () {
                this.saveReport();
            },
            deep: true
        },
        'report.params': {
            handler: function () {
                this.fetchData();
            },
            deep: true
        },
        'report.compare': {
            handler: function () {
                this.fetchData();
            },
            deep: true
        },
        $route() {
            this.loadReport();
        },
    },
    async mounted() {
        /*
        if (!['Business', 'Trial'].includes(util.getEdition())) {
            this.$router.push(util.base() + 'upgrade');
            return;
        }
        */

        await this.fetchConfig();
        this.loadReport();
    }

}
</script>