<template>
    <span color="secondary" fluid>
        <v-btn title="Add" icon="mdi-plus" :to="'/section/' + internalSection + '/add' + (parentsection ? '?parentsection=' + parentsection + '&parentid=' + parentid : '')"></v-btn>
        <v-btn title="Fields" icon="mdi-view-column" @click="changeFields"></v-btn>
        <v-btn title="Delete" icon="mdi-delete" v-if="selected.length" @click="doAction('delete')"></v-btn>
        <v-btn title="Import" icon="mdi-import" @click="importDialog = true"></v-btn>
        <v-btn title="Export" icon="mdi-export" @click="exportItems"></v-btn>
        <v-btn title="Sort" icon="mdi-sort" v-if="sortable"></v-btn>

        <v-menu v-if="buttons.length">
            <template v-slot:activator="{ props }">
                <v-btn v-bind="props" icon="mdi-dots-vertical"></v-btn>
            </template>
            <v-list>
                <v-list-item v-for="(item, index) in buttons" :key="index" :value="index" @click="customButton(item)">
                    <v-list-item-title>{{ item.label }}</v-list-item-title>
                </v-list-item>
            </v-list>
        </v-menu>

        <v-dialog v-model="importDialog" max-width="600" scrollable>
            <v-card title="Not yet implemented">
            </v-card>
        </v-dialog>

        <v-dialog v-model="sortDialog" max-width="600" scrollable>
            <v-card title="Not yet implemented">
            </v-card>
        </v-dialog>
    </span>
</template>

<script>
import api from "../services/api";
import qs from "qs";

export default {
    props: {
        vars: null,
        section: null,
        hidebuttons: Boolean,
        parentsection: null,
        parentid: null,
        searchparams: null,
        selected: null,
        data: null,
        headers: null,
        sortable: Boolean,
    },
    data: function () {
        return {
            dialog: false,
            selectedHeaders: [],
            internalSection: '',
            loading: false,
            importDialog: false,
            sortDialog: false,
        };
    },
    methods: {
        formatString: function (str) {
            str = str.replace(/_/g, ' ');
            return str.charAt(0).toUpperCase() + str.slice(1)
        },
        doAction: async function (action) {
            var data = {
                cmd: action,
                section: this.section,
                ids: this.selected,
            };

            this.loading = true;
            await api.post('?cmd=' + action + '&section=' + this.internalSection, data);
            await this.fetchData();
        },
        exportItems: function () {
            var data = {
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
        changeFields: function () {
            this.$emit('changeFields')
        },
        customButton: function (button) {
            this.$emit('custombutton', button);
        }
    },

    watch: {
        section: function (section) {
            this.internalSection = section;
        },
    },

    computed: {
        buttons: function () {
            var buttons = [];

            this.vars?.buttons?.forEach((item, index) => {
                if (item.page === 'list' && item.section === this.internalSection) {
                    item.id = index;
                    buttons.push(item);
                }
            })

            return buttons;
        }
    },

    created() {
        this.internalSection = this.section ? this.section : this.$route.params.section;
    },

};
</script>
