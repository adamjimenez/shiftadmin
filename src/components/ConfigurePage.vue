<template>
    <div class="w-100">
        <v-tabs v-model="tab">
            <v-tab value="tables">Tables</v-tab>
            <v-tab value="menu">Menu</v-tab>
            <v-tab value="options">Options</v-tab>
            <v-tab value="general">General</v-tab>
        </v-tabs>

        <v-card :loading="loading">
            <v-alert v-if="error" type="error" :text="error"></v-alert>

            <v-card-actions>
                <v-btn v-if="tab !== 'tables'" color="primary" variant="flat" @click="save"
                    :disabled="!dirty">Save</v-btn>

                <v-btn v-if="tab === 'tables'" icon="mdi-plus" @click="table = {}; tableDialog = true;"></v-btn>

                <span v-if="tab === 'menu'">
                    <v-btn icon="mdi-plus" @click="menuItem = { type: 'Table' }; menuDialog = true;"></v-btn>
                    <v-btn icon="mdi-sort" title="Sort" @click="openSectionSortable(data.vars.menu)"></v-btn>
                </span>
                <span v-if="tab === 'options'">
                    <v-btn icon="mdi-plus" @click="option = { name: '' }; optionDialog = true;"></v-btn>
                </span>
            </v-card-actions>

            <div v-if="tab === 'tables'">
                <v-card-text>
                    These are the database tables which can be used to create administratable sections in the CMS.<br>
                    Any changes will instantly affect the database so make sure that you have a back-up.
                </v-card-text>
                <v-expansion-panels style="max-width: 600px;">
                    <v-expansion-panel v-model="panel" multiple v-for="(fields, index) in filteredTables" :key="index">
                        <v-expansion-panel-title>
                            {{ index }}<v-spacer></v-spacer>

                            <v-btn icon="mdi-plus"
                                @click.stop="field = { name: '', type: 'text', table: index }; fieldDialog = true;"></v-btn>
                            <v-btn icon="mdi-sort" title="Sort" @click.stop="openSortable(index, fields)"></v-btn>
                            <v-btn icon="mdi-pencil"
                                @click.stop="table = { id: index, name: index }; tableDialog = true;"></v-btn>

                            <v-btn icon="mdi-xml" title="Code snippets" @click.stop="table = { id: index, name: index }; snippetsDialog = true;"></v-btn>

                            <v-btn icon="mdi-delete" @click.stop="deleteTable(index)"
                                :disabled="['users'].includes(index)"></v-btn>
                        </v-expansion-panel-title>
                        <v-expansion-panel-text>
                            <v-card>
                                <v-list>
                                    <v-list-item v-for="(col, key) in fields" :key="key" :value="key">
                                        <v-list-item-title>
                                            {{ col.name }}<strong v-if="col.required > 0">*</strong>
                                        </v-list-item-title>
                                        <v-list-item-subtitle>
                                            {{ col.type }}
                                        </v-list-item-subtitle>
                                        <template #append>
                                            <v-btn icon="mdi-pencil"
                                                @click.stop="field = { ...col }; field.id = col.name; field.table = index; field.required = col.required > 0 ? true : false; fieldDialog = true;"></v-btn>
                                            <v-btn icon="mdi-delete" @click.stop="deleteField(index, col.name)"></v-btn>
                                        </template>
                                    </v-list-item>
                                </v-list>
                            </v-card>
                        </v-expansion-panel-text>
                    </v-expansion-panel>
                </v-expansion-panels>
            </div>
            <div v-if="tab === 'menu'">
                <v-card-text>
                    Manage the admin menu and define subsections.
                </v-card-text>
                <v-expansion-panels v-model="panel" multiple style="max-width: 600px;">
                    <v-expansion-panel v-for="(item, key) in data.vars.menu" :key="key" :value="key">
                        <v-expansion-panel-title>
                            <v-icon :icon="item.icon ? item.icon : 'mdi-minus'" class="mr-3" />

                            {{ item.title }}
                            <v-spacer></v-spacer>

                            <v-btn icon="mdi-plus" v-if="getMenuItemType(item) === 'Table'"
                                @click.stop="subsection = { section: item.title.toLowerCase() }; subsectionDialog = true;"></v-btn>
                            <v-btn icon="mdi-sort" v-if="getMenuItemType(item) === 'Table'" title="Sort"
                                @click.stop="openSectionSortable(data.vars.subsections[item.title.toLowerCase()])"
                                :disabled="!data.vars.subsections[item.title.toLowerCase()]?.length"></v-btn>

                            <v-btn icon="mdi-plus" v-if="getMenuItemType(item) === 'Folder'"
                                @click.stop="menuItem = { parent: item.title, newParent: item.title, type: 'Table' }; menuDialog = true;"></v-btn>
                            <v-btn icon="mdi-sort" v-if="getMenuItemType(item) === 'Folder'" title="Sort"
                                @click.stop="openSectionSortable(item.children)"
                                :disabled="!item.children?.length"></v-btn>

                            <v-btn icon="mdi-pencil"
                                @click.stop="menuItem = { ...item }; menuItem.index = key; menuItem.type = getMenuItemType(item); menuDialog = true; menuItem.newParent = menuItem.parent;"></v-btn>
                            <v-btn icon="mdi-delete" @click.stop="deleteMenuItem(key, data.vars.menu)"></v-btn>
                        </v-expansion-panel-title>
                        <v-expansion-panel-text>
                            <v-list max-width="600">
                                <template v-if="getMenuItemType(item) === 'Table' && data.vars.subsections">
                                    <v-list-item
                                        v-for="(child, key2) in data.vars.subsections[item.title.toLowerCase()]"
                                        :key="key2" :title="child.title"
                                        :prepend-icon="child.icon ? child.icon : 'mdi-minus'">
                                        <template #append>
                                            <v-btn icon="mdi-pencil"
                                                @click.stop="subsection = { ...child }; subsection.section = item.title.toLowerCase(); subsection.index = key2; subsectionDialog = true;"></v-btn>

                                            <v-btn icon="mdi-delete"
                                                @click.stop="deleteSubsection(item.title.toLowerCase(), key2)"></v-btn>
                                        </template>
                                    </v-list-item>
                                </template>

                                <template v-if="getMenuItemType(item) === 'Folder'">
                                    <v-list-item v-for="(child, key2) in item.children" :key="key2" :title="child.title"
                                        :prepend-icon="child.icon ? child.icon : 'mdi-minus'">
                                        <template #append>
                                            <v-btn icon="mdi-pencil"
                                                @click.stop="menuItem = { ...child }; menuItem.index = key2; menuItem.type = getMenuItemType(child); menuItem.parent = item.title; menuItem.newParent = item.title; menuDialog = true;"></v-btn>

                                            <v-btn icon="mdi-delete"
                                                @click.stop="deleteMenuItem(key2, item.children)"></v-btn>
                                        </template>
                                    </v-list-item>
                                </template>
                            </v-list>
                        </v-expansion-panel-text>
                    </v-expansion-panel>
                </v-expansion-panels>
            </div>
            <div v-if="tab === 'options'">
                <v-card-text>
                    Options are used by "select" and "select multiple" fields. They can either be a list of values or
                    rows from a
                    table.
                </v-card-text>
                <v-list max-width="600">
                    <v-list-item v-for="(options, key, index) in data.vars.options" :key="index" :value="key"
                        :title="key">
                        <template #append>
                            <v-btn icon="mdi-pencil" @click.stop="editOption(key)"></v-btn>
                            <v-btn icon="mdi-delete" @click.stop="deleteOption(key)"></v-btn>
                        </template>
                    </v-list-item>
                </v-list>
            </div>
            <div v-if="tab === 'general'">
                <v-card-text>
                    Customise the look of the CMS and where automatic emails are sent from.
                </v-card-text>
                <v-text-field label="From email" v-model="data.from_email"></v-text-field>
                <v-text-field label="Title" v-model="data.vars.branding.title"></v-text-field>
                <v-text-field label="Primary" v-model="data.vars.branding.colors.primary" type="color"></v-text-field>
                <v-text-field label="Secondary" v-model="data.vars.branding.colors.secondary"
                    type="color"></v-text-field>
            </div>
        </v-card>

        <v-dialog v-model="tableDialog" max-width="600">
            <v-card title="Table">
                <v-card-text>
                    <v-alert v-if="error" type="error" :text="error"></v-alert>
                    <v-text-field label="Name" v-model="table.name" autofocus></v-text-field>
                </v-card-text>
                <v-card-actions>
                    <v-btn variant="flat" color="primary" :disabled="table.name === ''" @click="saveTable">Save</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <v-dialog v-model="snippetsDialog" max-width="600">
            <v-card title="Snippets">
                <v-card-text>
                    <v-tabs v-model="snippetView">
                        <v-tab value="view">View</v-tab>
                        <v-tab value="list" :disabled="listCode === false">List</v-tab>
                        <v-tab value="form">Form</v-tab>
                    </v-tabs>

                    <div v-if="snippetView === 'form'">
                        <VCodeBlock
                            :code="formCode"
                            highlightjs
                            lang="php"
                        />
                    </div>
                    <div v-else-if="snippetView === 'list'">
                        <VCodeBlock
                            :code="listCode"
                            highlightjs
                            lang="php"
                        />
                    </div>
                    <div v-else>
                        <VCodeBlock
                            :code="viewCode"
                            highlightjs
                            lang="php"
                        />
                    </div>
                </v-card-text>
            </v-card>
        </v-dialog>

        <v-dialog v-model="fieldDialog" max-width="600">
            <v-card title="Field">
                <v-card-text>
                    <v-alert v-if="error" type="error" :text="error"></v-alert>
                    <v-text-field label="Name" v-model="field.name" autofocus></v-text-field>
                    <v-select label="Field" v-model="field.type" :items="fieldTypes"></v-select>
                    <v-text-field label="Label" v-model="field.label"></v-text-field>
                    <v-checkbox label="Required" v-model="field.required"></v-checkbox>
                </v-card-text>
                <v-card-actions>
                    <v-btn variant="flat" color="primary" :disabled="field.name === ''" @click="saveField">Save</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <v-dialog v-model="sortFieldsDialog" max-width="600" scrollable>
            <v-card title="Sort Field Order">
                <v-card-text>
                    <draggable v-model="sortOrder" group="items" @start="drag = true" @end="moveField" item-key="name">
                        <template #item="{ element }">
                            <v-sheet color="primary" class="ma-5 pa-5">{{ element.name }}</v-sheet>
                        </template>
                    </draggable>
                </v-card-text>
            </v-card>
        </v-dialog>

        <v-dialog v-model="sortSectionsDialog" max-width="600" scrollable>
            <v-card title="Sort Section Order">
                <v-card-text>
                    <draggable :list="sortOrder" group="items" item-key @end="dirty = true">
                        <template #item="{ element }">
                            <v-sheet color="primary" class="ma-5 pa-5">{{ element.title ? element.title : element
                                }}</v-sheet>
                        </template>
                    </draggable>
                </v-card-text>
            </v-card>
        </v-dialog>

        <v-dialog v-model="menuDialog" max-width="600">
            <v-card title="Menu item">
                <v-card-text>
                    <v-alert v-if="error" type="error" :text="error"></v-alert>

                    <v-tabs v-model="menuItem.type">
                        <v-tab value="Table" :disabled="!isNaN(menuItem.index)">Table</v-tab>
                        <v-tab value="Custom" :disabled="!isNaN(menuItem.index)">Custom</v-tab>
                        <v-tab value="Folder" v-if="!menuItem.parent" :disabled="!isNaN(menuItem.index)">Folder</v-tab>
                    </v-tabs>

                    <v-select label="Parent" v-if="menuItem.type !== 'Folder'" v-model="menuItem.newParent" :items="folders" clearable></v-select>

                    <v-combobox label="Table" v-model="menuItem.section" :items="getSections()"
                        v-if="menuItem.type === 'Table'"
                        @update:model-value="menuItem.title = formatString(menuItem.section);" autofocus></v-combobox>
                    <v-text-field label="Link" v-model="menuItem.to" v-else-if="menuItem.type === 'Custom'"
                        autofocus></v-text-field>
                    <v-checkbox label="Open in new window" v-model="menuItem.target_blank"
                        v-if="menuItem.type === 'Custom'"></v-checkbox>
                    <v-text-field label="Title" v-model="menuItem.title"
                        :autofocus="menuItem.type === 'Folder'"></v-text-field>
                    <v-text-field label="Icon" v-model="menuItem.icon" placeholder="mdi-"></v-text-field>
                </v-card-text>
                <v-card-actions>
                    <v-btn variant="flat" color="primary" :disabled="!isMenuValid" @click="saveMenuItem">OK</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <v-dialog v-model="subsectionDialog" max-width="600" persistent>
            <v-card>
                <v-card-title class="d-flex justify-space-between align-center">
                    <div class="text-h5 text-medium-emphasis ps-2">
                        Subsection
                    </div>

                    <v-btn icon="mdi-close" @click="subsectionDialog = false;"></v-btn>
                </v-card-title>
                <v-card-text>
                    <v-alert v-if="error" type="error" :text="error"></v-alert>
                    <v-select label="Subsection" v-model="subsection.subsection" :items="Object.keys(filteredTables)"
                        @update:model-value="subsection.title = formatString(subsection.subsection);"
                        autofocus></v-select>
                    <v-text-field label="Title" v-model="subsection.title"></v-text-field>
                    <v-text-field label="Icon" v-model="subsection.icon" placeholder="mdi-"></v-text-field>
                </v-card-text>
                <v-card-actions>
                    <v-btn variant="flat" color="primary" :disabled="subsection.section === ''"
                        @click="saveSubsection">OK</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <v-dialog v-model="optionDialog" max-width="600">
            <v-card title="Option">
                <v-card-text>
                    <v-alert v-if="error" type="error" :text="error"></v-alert>
                    <v-combobox label="Name" v-model="option.name" autofocus :items="optionKeys"></v-combobox>
                    <v-radio-group v-model="option.type">
                        <v-radio label="Table" value="table"></v-radio>
                        <v-radio label="Options" value="options"></v-radio>
                    </v-radio-group>
                    <v-select v-if="option.type === 'table'" label="table" v-model="option.options"
                        :items="Object.keys(filteredTables)"></v-select>
                    <v-textarea v-else-if="option.type === 'options'" label="Options"
                        v-model="option.options"></v-textarea>
                </v-card-text>
                <v-card-actions>
                    <v-btn variant="flat" color="primary" :disabled="option.name === ''" @click="saveOption">OK</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </div>
</template>

<script>
import VCodeBlock from '@wdns/vue-code-block';
import api from "../services/api";
import draggable from 'vuedraggable';
import util from "../services/util";

export default {
    components: {
        draggable,
        VCodeBlock,
    },
    beforeRouteLeave(to, from, next) {
        if (!this.dirty || confirm('You have unsaved changes. Do you want to continue?')) {
            return next()
        }
    },
    props: {
        vars: null,
    },
    data: function () {
        return {
            tab: 'tables',
            panel: [],
            table: {},
            tableDialog: false,
            field: {},
            fieldDialog: false,
            data: {},
            error: '',
            loading: false,
            fieldTypes: [
                'checkbox',
                'color',
                'combo',
                'coords',
                'date',
                'datetime',
                'decimal',
                'deleted',
                'dob',
                'editor',
                'email',
                'file',
                'files',
                'hidden',
                'id',
                'integer',
                'ip',
                'json',
                'mobile',
                'page_name',
                'password',
                'polygon',
                'position',
                'postcode',
                'rating',
                'read',
                'select',
                'select_multiple',
                'select_parent',
                'tel',
                'text',
                'textarea',
                'time',
                'timestamp',
                'upload',
                'uploads',
                'url',
            ],
            drag: false,
            sortFieldsDialog: false,
            sortTable: '',
            sortOrder: [],
            menuDialog: false,
            menuItem: {},
            subsectionDialog: false,
            subsection: {},
            optionDialog: false,
            option: {},
            sortSectionsDialog: false,
            dirty: false,
            hideConfigTables: true,
            configTables: ['cms_activation', 'cms_multiple_select', 'cms_filters', 'cms_login_attempts', 'cms_logs', 'cms_privileges', 'cms_reports', 'cms_trusted_devices', 'email_templates', 'files'],
            snippetsDialog: false,
            snippetView: 'view',
        }
    },
    methods: {
        fetchData: async function () {
            const result = await api.get('config.php');

            if (result.data.error) {
                this.error = result.data.error;
            }

            let data = result.data;

            if (!data.vars) {
                data.vars = {};
            }

            if (!data.vars.subsections) {
                data.vars.subsections = {};
            }

            // backcompat subsections
            for (let [section, subsections] of Object.entries(data.vars.subsections)) {
                subsections.forEach((subsection, index) => {
                    if (typeof subsection === 'string') {
                        data.vars.subsections[section][index] = {
                            title: this.formatString(subsection),
                            subsection: subsection,
                        };
                    }
                });
            }

            if (!data.vars.branding) {
                data.vars.branding = {};
            }

            if (!data.vars.branding.colors || Array.isArray(data.vars.branding.colors)) {
                data.vars.branding.colors = {};
            }

            this.data = data;

            await this.$nextTick();

            let title = data.vars?.branding?.title ? data.vars.branding.title : 'ADMIN';
            document.title = title + ' | Configure';

            this.dirty = false;
        },
        save: async function () {
            this.error = '';

            this.loading = true;
            const result = await api.post('config.php?cmd=save', this.data);
            this.loading = false;

            if (result.data.error) {
                this.error = result.data.error;
            } else {
                await this.fetchData();
                this.$emit('configUpdated');
            }
        },
        saveTable: async function () {
            this.error = '';

            this.table.name = this.table.name.toLowerCase();

            this.loading = true;
            const result = await api.post('config.php?cmd=save_table', this.table);
            this.loading = false;

            if (result.data.error) {
                this.error = result.data.error;
            } else {
                this.tableDialog = false;
                this.fetchData();
            }
        },
        deleteTable: async function (table) {
            if (!confirm('Drop table ' + table)) {
                return;
            }

            this.error = '';
            this.loading = true;
            const result = await api.post('config.php?cmd=delete_table', { table: table });
            this.loading = false;

            if (result.data.error) {
                this.error = result.data.error;
            } else {
                this.fetchData();
            }
        },
        saveField: async function () {
            this.error = '';

            this.field.name = this.field.name.toLowerCase();

            this.loading = true;
            const result = await api.post('config.php?cmd=save_field', this.field);
            this.loading = false;

            if (result.data.error) {
                this.error = result.data.error;
            } else {
                this.fieldDialog = false;
                this.fetchData();
            }
        },
        deleteField: async function (table, field) {
            if (!confirm('Drop field ' + field + ' from ' + table)) {
                return;
            }

            this.error = '';
            this.loading = true;
            const result = await api.post('config.php?cmd=delete_field', { table: table, field: field });
            this.loading = false;

            if (result.data.error) {
                this.error = result.data.error;
            } else {
                this.fetchData();
            }
        },
        openSortable: function (table, fields) {
            this.sortOrder = [...fields];
            this.sortTable = table;
            this.sortFieldsDialog = true;
        },
        openSectionSortable: function (obj) {
            this.sortOrder = obj;
            this.sortSectionsDialog = true;
        },
        moveField: async function (event) {
            let field = this.sortOrder[event.newIndex].name;
            let after = event.newIndex ? this.sortOrder[event.newIndex - 1].name : '';

            this.error = '';
            this.loading = true;
            const result = await api.post('config.php?cmd=move_field', { table: this.sortTable, field: field, after: after });
            this.loading = false;

            if (result.data.error) {
                this.error = result.data.error;
            } else {
                this.fetchData();
            }
        },
        saveMenuItem: function () {
            let item = {
                title: this.menuItem.title,
                icon: this.menuItem.icon,
            };

            if (this.menuItem.type === 'Folder') {
                item.children = this.menuItem.children ? this.menuItem.children : [];
            } else if (this.menuItem.type === 'Table') {
                item.section = this.menuItem.section;
            } else if (this.menuItem.type === 'Custom') {
                item.to = this.menuItem.to;
                item.target_blank = this.menuItem.target_blank;
            }

            // default to root
            let menu = this.data.vars.menu;

            // if subitem, lookup parent
            if (this.menuItem.parent) {
                menu = this.data.vars.menu.find(item => item.title === this.menuItem.parent).children;
            }

            // remove from old parent
            if (!isNaN(this.menuItem.index) && this.menuItem.parent !== this.menuItem.newParent) {
                menu.splice(this.menuItem.index, 1);

                // lookup new parent
                if (this.menuItem.newParent) {
                    menu = this.data.vars.menu.find(item => item.title === this.menuItem.newParent).children;
                } else {
                    menu = this.data.vars.menu;
                }

                this.menuItem.index = menu.length;
            }

            if (Object.hasOwn(this.menuItem, 'index')) {
                menu[this.menuItem.index] = item;
            } else {
                menu.push(item);
            }

            this.menuDialog = false;
            this.dirty = true;
        },
        deleteMenuItem: function (index, menu) {
            if (!confirm('Delete menu item')) {
                return;
            }

            menu.splice(index, 1);
            this.dirty = true;
        },
        saveSubsection: function () {
            this.subsection.subsection = this.subsection.subsection.replaceAll('_', ' ');

            let subsection = { ...this.subsection };
            delete subsection.index;
            delete subsection.section;

            if (Object.hasOwn(this.subsection, 'index')) {
                this.data.vars.subsections[this.subsection.section][this.subsection.index] = subsection;
            } else {
                if (!Array.isArray(this.data.vars.subsections[this.subsection.section])) {
                    this.data.vars.subsections[this.subsection.section] = [];
                }

                this.data.vars.subsections[this.subsection.section].push(subsection);
            }
            this.subsectionDialog = false;
            this.dirty = true;
        },
        deleteSubsection: function (section, key) {
            if (!confirm('Delete subsection')) {
                return;
            }

            this.data.vars.subsections[section].splice(key, 1);
            this.dirty = true;
        },
        renameObjKey: function (oldObj, oldKey, newKey) {
            const keys = Object.keys(oldObj);
            const newObj = keys.reduce((acc, val) => {
                if (val === oldKey) {
                    acc[newKey] = oldObj[oldKey];
                }
                else {
                    acc[val] = oldObj[val];
                }
                return acc;
            }, {});

            return newObj;
        },
        optionsToString: function (options) {
            let value = '';
            if (Array.isArray(options)) {
                options.forEach(function (item) {
                    value += item + "\n";
                })
            } else if (typeof options === 'object') {
                for (let [k, v] of Object.entries(options)) {
                    value += k.replace('#', '') + '=' + v + "\n";
                }
            } else {
                value = options;
            }

            return value;
        },
        editOption: function (key) {
            this.option = {
                name: key,
                index: key,
                type: 'options',
            };

            if (typeof this.data.vars.options[key] === 'string') {
                this.option.type = 'table';
            }

            this.option.options = this.optionsToString(this.data.vars.options[key]);
            this.optionDialog = true;
            this.dirty = true;
        },
        saveOption: function () {
            let value;

            if (this.option.type === 'table') {
                value = this.option.options;
            } else {
                let lines = this.option.options.split("\n");

                value = lines[0].includes('=') ? {} : [];

                lines.forEach((line) => {
                    if (Array.isArray(value)) {
                        value.push(line);
                    } else {
                        let arr = line.split('=');
                        value[arr[0]] = arr[1];
                    }
                })
            }

            if (Object.hasOwn(this.option, 'index')) {
                this.data.vars.options = this.renameObjKey(this.data.vars.options, this.option.index, this.option.name);
            }
            this.data.vars.options[this.option.name] = value;

            this.optionDialog = false;
            this.dirty = true;
        },
        deleteOption: function (key) {
            if (!confirm('Delete option')) {
                return;
            }

            delete this.data.vars.options[key];
            this.dirty = true;
        },
        getMenuItemType: function (menuItem) {
            if (Array.isArray(menuItem.children)) {
                return 'Folder';
            } else if (menuItem.section) {
                return 'Table';
            } else {
                return 'Custom';
            }
        },
        getSections: function () {
            return Object.keys(this.filteredTables).map(item => item.replaceAll("_", " "));
        },
        formatString: function (string) {
            return util.formatString(string);
        },
    },
    computed: {
        isMenuValid: function () {
            if (!this.menuItem.title || !this.menuItem.type) {
                return false;
            }

            if (this.menuItem.type === 'Table' && !this.menuItem.section) {
                return false;
            }

            if (this.menuItem.type === 'Custom' && !this.menuItem.to) {
                return false;
            }

            return true;
        },
        menuTypes: function () {
            let types = ['Table', 'Custom'];

            if (!this.menuItem.parent) {
                types.push('Folder');
            }

            return types;
        },
        filteredTables: function () {
            let tables = {};

            if (!this.data.tables) {
                return tables;
            }

            for (let [index, table] of Object.entries(this.data.tables)) {
                if (this.hideConfigTables && this.configTables.includes(index)) {
                    continue;
                }

                tables[index] = table;
            }

            return tables;
        },
        optionKeys: function () {
            let keys = [];

            if (!this.data.tables) {
                return keys;
            }

            for (let [, table] of Object.entries(this.data.tables)) {
                table.forEach(col => {
                    if (['select', 'multiple_select'].includes(col.type) && !this.data.vars.options[col.name]) {
                        keys.push(col.name);
                    }
                });
            }

            return keys;
        },
        folders: function () {
            return this.data.vars.menu.filter(item => Array.isArray(item.children));
        },
        formCode: function () {
            let code = `<?php
// set cms section for fields and validation
$cms->set_section('${this.table.name}');

if (count($_POST)) {
    // ajax form validation
    $cms->submit_handler();
}

// load shiftlib js library
load_js(['shiftlib']);
?>

<form method="post" sl-validate sl-hide sl-target="#success">`;

    this.data.tables[this.table.name].forEach(field => {
        if (!['id'].includes(field.name) && !['timestamp', 'position'].includes(field.type)) {
            code += `
    <p><?=$cms->get_field('${field.name}');?></p>`;
        }
    })

    code += `
    <button type="submit">Submit</button>
</form>

<div id="success" style="display: none;">
    <p>
        The form has been submitted!
    </p>
</div>
`;

            return code;
        },
        viewCode: function () {
            let pageName = this.data.tables[this.table.name].find(item => item.type === 'page_name');

            let condition = pageName ? '$request' : 1;

            let code = `<?php
$condition = ${condition}; // replace with $_GET var or whatever
$content = $cms->get('${this.table.name}', $condition);
?>

`;

            this.data.tables[this.table.name].forEach(field => {
                let label = this.formatString(field.name);

                if (['file', 'files', 'upload', 'uploads'].includes(field.type)) {
                    code += `<p>${label}: <?=image($content['${field.name}']);?></p>\n`;
                } else if (['date', 'datetime', 'timestamp'].includes(field.type)) {
                    code += `<p>${label}: <?=dateformat('d-m-Y H:i:s', $content['${field.name}']);?></p>\n`;
                } else {
                    code += `<p>${label}: <?=$content['${field.name}'];?></p>\n`;
                }
            })

            return code;
        },
        listCode: function () {
            let id = this.data.tables[this.table.name].find(item => item.name === 'id');

            if (!id) {
                return false;
            }

            let code = `<?php
$items = $cms->get('${this.table.name}');

foreach ($items as $item):
?>

`;

            this.data.tables[this.table.name].forEach(field => {
                code += `<p>${this.formatString(field.name)}: <?=$content['${field.name}'];?></p>\n`;
            })

            code += `<hr>

<?php
endforeach;
?>
`;

            return code;
        }
    },
    watch: {
        vars: function () {
            this.fetchData();
        },
        data: {
            handler: function () {
                this.dirty = true;
            },
            deep: true,
        }
    },
    async mounted() {
        this.fetchData();
    }
}
</script>
