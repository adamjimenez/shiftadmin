<template>
    <div class="w-100">
        <v-tabs v-model="tab">
            <v-tab value="tables">Tables</v-tab>
            <v-tab value="sections">Sections</v-tab>
            <v-tab value="options">Options</v-tab>
            <v-tab value="general">General</v-tab>
        </v-tabs>

        <v-card :loading="loading">
            <v-alert v-if="error" type="error" :text="error"></v-alert>

            <v-card-actions>                
                <v-btn v-if="tab !== 'tables'" color="primary" variant="flat" @click="save" :disabled="!dirty">Save</v-btn>
                
                <v-btn v-if="tab === 'tables'" icon="mdi-plus" @click="table = {}; tableDialog = true;"></v-btn>

                <span v-if="tab === 'sections'">
                    <v-btn icon="mdi-plus" @click="section = {}; sectionDialog = true;"></v-btn>
                    <v-btn icon="mdi-sort" title="Sort" @click="openSectionSortable(data.vars.sections)"></v-btn>
                </span>
                <span v-if="tab === 'options'">
                    <v-btn icon="mdi-plus" @click="option = { name: '' }; optionDialog = true;"></v-btn>
                </span>
            </v-card-actions>

            <div v-if="tab === 'tables'" min-width="600">
                <v-expansion-panels>
                    <v-expansion-panel v-model="panel" multiple v-for="(fields, index) in data.tables" :key="index">
                        <v-expansion-panel-title>
                            {{ index }}<v-spacer></v-spacer>

                            <v-btn icon="mdi-sort" title="Sort" @click="openSortable(index, fields)"></v-btn>
                            <v-btn icon="mdi-pencil"
                                @click.stop="table = { id: index, name: index }; tableDialog = true;"></v-btn>
                            <v-btn icon="mdi-delete" @click.stop="deleteTable(index)"></v-btn>
                        </v-expansion-panel-title>
                        <v-expansion-panel-text>
                            <v-card>
                                <v-card-actions>
                                    <v-btn icon="mdi-plus" @click="field = { name: '', type: 'text', table: index }; fieldDialog = true;"></v-btn>
                                </v-card-actions>
                                <v-list>
                                    <v-list-item v-for="(col, key) in fields" :key="key">
                                        <v-list-item-title>{{ col.name }}</v-list-item-title>
                                        <v-list-item-subtitle>{{ col.type }}</v-list-item-subtitle>
                                        <template #append>
                                            <v-btn icon="mdi-pencil" @click.stop="field = { ...col }; field.id = col.name; field.table = index; field.required = col.required > 0 ? true : false; fieldDialog = true;"></v-btn>
                                            <v-btn icon="mdi-delete" @click.stop="deleteField(index, col.name)"></v-btn>
                                        </template>
                                    </v-list-item>
                                </v-list>
                            </v-card>
                        </v-expansion-panel-text>
                    </v-expansion-panel>
                </v-expansion-panels>
            </div>
            <div v-if="tab === 'sections'">
                <v-expansion-panels v-model="panel" multiple>
                    <v-expansion-panel v-for="(sectionName, key) in data.vars.sections" :key="key">
                        <v-expansion-panel-title>
                            {{ sectionName }}
                            <v-spacer></v-spacer>
                            
                            <v-btn icon="mdi-plus" @click.stop="subsection = { section: sectionName}; subsectionDialog = true;"></v-btn>
                            <v-btn icon="mdi-sort" title="Sort" @click.stop="openSectionSortable(data.vars.subsections[sectionName])" :disabled="!data.vars.subsections[sectionName] || !data.vars.subsections[sectionName].length"></v-btn>
                            <v-btn icon="mdi-pencil" @click.stop="section = { section: sectionName, index: key}; sectionDialog = true;"></v-btn>
                            <v-btn icon="mdi-delete" @click.stop="deleteSection(key)"></v-btn>
                        </v-expansion-panel-title>
                        <v-expansion-panel-text>
                            <v-list>
                                <template v-if="data.vars.subsections">
                                    <v-list-item v-for="(subsectionName, key2) in data.vars.subsections[sectionName]" :key="key2" :title="subsectionName">
                                        <template #append>
                                            <v-btn icon="mdi-pencil" @click.stop="subsection = { section: sectionName, subsection: subsectionName, index: key2}; subsectionDialog = true;"></v-btn>

                                            <v-btn icon="mdi-delete" @click.stop="deleteSubsection(sectionName, key2)"></v-btn>
                                        </template>                        
                                    </v-list-item>
                                </template>
                            </v-list>
                        </v-expansion-panel-text>
                    </v-expansion-panel>
                </v-expansion-panels>
            </div>
            <div v-if="tab === 'options'">
                <v-list>
                    <v-list-item v-for="(options, key, index) in data.vars.options" :key="index" :title="key">
                        <template #append>
                            <v-btn icon="mdi-pencil" @click.stop="editOption(key)"></v-btn>
                            <v-btn icon="mdi-delete" @click.stop="deleteOption(key)"></v-btn>
                        </template>
                    </v-list-item>
                </v-list>
            </div>
            <div v-if="tab === 'general'">
                <v-text-field label="From email" v-model="data.from_email"></v-text-field>
                <v-text-field label="Title" v-model="data.vars.branding.title"></v-text-field>
                <v-text-field label="Primary" v-model="data.vars.branding.colors.primary" type="color"></v-text-field>
                <v-text-field label="Secondary" v-model="data.vars.branding.colors.secondary" type="color"></v-text-field>
            </div>
        </v-card>

        <v-dialog v-model="tableDialog" max-width="600">
            <v-card title="Table">
                <v-card-text>
                    <v-alert v-if="error" type="error" :text="error"></v-alert>
                    <v-text-field label="Name" v-model="table.name"></v-text-field>
                </v-card-text>
                <v-card-actions>
                    <v-btn variant="flat" color="primary" :disabled="table.name === ''" @click="saveTable">Save</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <v-dialog v-model="fieldDialog" max-width="600">
            <v-card title="Field">
                <v-card-text>
                    <v-alert v-if="error" type="error" :text="error"></v-alert>
                    <v-text-field label="Name" v-model="field.name"></v-text-field>
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
                            <v-sheet color="primary" class="ma-5 pa-5">{{ element }}</v-sheet>
                        </template>
                    </draggable>
                </v-card-text>
            </v-card>
        </v-dialog>

        <v-dialog v-model="sectionDialog" max-width="600">
            <v-card title="Section">
                <v-card-text>
                    <v-alert v-if="error" type="error" :text="error"></v-alert>
                    <v-combobox label="Section" v-model="section.section" :items="Object.keys(data.tables)"></v-combobox>
                </v-card-text>
                <v-card-actions>
                    <v-btn variant="flat" color="primary" :disabled="section.section === ''" @click="saveSection">Save</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <v-dialog v-model="subsectionDialog" max-width="600">
            <v-card title="Subsection">
                <v-card-text>
                    <v-alert v-if="error" type="error" :text="error"></v-alert>
                    <v-combobox label="Subsection" v-model="subsection.subsection" :items="data.vars.sections"></v-combobox>
                </v-card-text>
                <v-card-actions>
                    <v-btn variant="flat" color="primary" :disabled="subsection.section === ''" @click="saveSubsection">Save</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <v-dialog v-model="optionDialog" max-width="600">
            <v-card title="Option">
                <v-card-text>
                    <v-alert v-if="error" type="error" :text="error"></v-alert>
                    <v-text-field label="Name" v-model="option.name"></v-text-field>
                    <v-radio-group v-model="option.type">
                        <v-radio label="Section" value="section"></v-radio>
                        <v-radio label="Options" value="options"></v-radio>
                    </v-radio-group>
                    <v-select v-if="option.type === 'section'" label="section" v-model="option.options" :items="data.vars.sections"></v-select>
                    <v-textarea v-else-if="option.type === 'options'" label="options" v-model="option.options"></v-textarea>
                </v-card-text>
                <v-card-actions>
                    <v-btn variant="flat" color="primary" :disabled="option.name === ''" @click="saveOption">Save</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </div>
</template>

<script>
import api from "../services/api";
import draggable from 'vuedraggable'

export default {
    components: {
        draggable,
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
                'avg_rating',
                'checkbox',
                'checkboxes',
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
                'mobile',
                'month',
                'page_name',
                'password',
                'polygon',
                'position',
                'postcode',
                'radio',
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
            sectionDialog: false,
            section: {},
            subsectionDialog: false,
            subsection: {},
            optionDialog: false,
            option: {},
            sortSectionsDialog : false,
            dirty: false,
        }
    },
    methods: {
        fetchData: async function () {
            const result = await api.get('config.php');
            let data = result.data;

            if (!data.vars.subsections) {
                data.vars.subsections = {};
            }

            if (!data.vars.branding) {
                data.vars.branding = {};
            }

            if (!data.vars.branding.colors) {
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
                this.fetchData();
            }
        },
        saveTable: async function () {
            this.error = '';

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
        saveSection: function () {
            let value = this.section.section.replaceAll('_', ' ');

            if (Object.hasOwn(this.section, 'index')) {
                this.data.vars.sections[this.section.index] = value;
            } else {
                this.data.vars.sections.push(value);
            }
            this.sectionDialog = false;
            this.dirty = true;
        },
        deleteSection: function (index) {
            if (!confirm('Delete section')) {
                return;
            }

            this.data.vars.sections.splice(index, 1);
            this.dirty = true;
        },
        saveSubsection: function () {
            let value = this.subsection.subsection.replaceAll('_', ' ');

            if (Object.hasOwn(this.subsection, 'index')) {
                this.data.vars.subsections[this.subsection.section][this.subsection.index] = value;
            } else {
                if (!Array.isArray(this.data.vars.subsections[this.subsection.section])) {
                    this.data.vars.subsections[this.subsection.section] = [];
                }

                this.data.vars.subsections[this.subsection.section].push(value);
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
            const newObj = keys.reduce((acc, val)=>{
                if(val === oldKey){
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
				options.forEach(function(item) {
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
                type : 'options',
            };

            if (typeof options === 'string') {
                this.option.type = 'section';
            }

            this.option.options = this.optionsToString(this.data.vars.options[key]);
            this.optionDialog = true;
            this.dirty = true;
        },
        saveOption: function () {
            let value;

            if (this.option.type === 'section') {
                value = this.option.options;
            } else {
                let lines = this.option.options.split("\n");

                value = lines[0].includes('=') ? {} :  [];

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
    },
    watch: {
        vars: function () {
            this.fetchData();
        },
        data: {
            handler : function () {
                this.dirty = true;
            },
            deep: true,
        }
    },
    async mounted() {
        if (this.vars.sections) {
            this.fetchData();
        }
    }
}
</script>
