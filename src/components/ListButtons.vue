<template>
    <span class="d-flex">
        <v-btn variant="text" title="Add" icon="mdi-plus" :to="base + 'section/' + internalSection + '/add' + (parentsection ? '?parentsection=' + parentsection + '&parentid=' + parentid : '')"></v-btn>
        <v-btn variant="text" title="Fields" icon="mdi-view-column" @click="changeFields"></v-btn>
        <v-btn variant="text" title="Delete" icon="mdi-delete" v-if="selected.length" @click="doAction('delete')"></v-btn>
        <v-btn variant="text" title="Import" icon="mdi-import" @click="openImport"></v-btn>
        <v-btn variant="text" title="Export" icon="mdi-export" @click="exportItems"></v-btn>
        <v-btn variant="text" title="Sort" icon="mdi-sort" v-if="sortable" @click="doAction('openSortable')"></v-btn>

        <v-menu v-if="buttons.length">
            <template v-slot:activator="{ props }">
                <v-btn variant="text" v-bind="props" icon="mdi-dots-vertical"></v-btn>
            </template>
            <v-list>
                <v-list-item v-for="(item, index) in buttons" :key="index" :value="index" @click="customButton(item)">
                    <v-list-item-title>{{ item.label }}</v-list-item-title>
                </v-list-item>
            </v-list>
        </v-menu>

        <v-spacer></v-spacer>
        
        <v-text-field v-model="filter" hide-details placeholder="Filter" density="compact"></v-text-field>
    </span>
</template>

<script>
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
            filter: '',
        };
    },
    methods: {
        formatString: function (str) {
            str = str.replace(/_/g, ' ');
            return str.charAt(0).toUpperCase() + str.slice(1)
        },
        doAction: async function (action) {            
            this.$emit('action', action);
        },
        exportItems: function () {
            this.$emit('action', 'export');
        },
        changeFields: function () {
            this.$emit('changeFields')
        },
        customButton: function (button) {
            this.$emit('action', button);
        },
        openImport: function () {
            this.$emit('action', 'import');
        },
    },

    watch: {
        section: function (section) {
            this.internalSection = section;
        },
        filter: function (value) {
            this.$emit('action', 'filter', value);
        }
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
        },
        base() {
            let base = '/';
            if (this.$route.params.base) {
                base += this.$route.params.base + '/';
            }

            return base;
        }
    },

    created() {
        this.internalSection = this.section ? this.section : this.$route.params.section;
    },

};
</script>
