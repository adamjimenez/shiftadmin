<template>
    <span class="d-flex w-100 align-center">
        <v-btn variant="text" title="Add" icon="mdi-plus" :to="base + 'section/' + internalSection + '/add' + (parentsection ? '?parentsection=' + parentsection + '&parentid=' + parentid : '')"></v-btn>
        <v-btn variant="text" title="Fields" icon="mdi-view-column" v-if="!selected.length" @click="changeFields"></v-btn>
        <v-btn variant="text" title="Bulk Edit" icon="mdi-pencil" v-if="selected.length" @click="doAction('openBulkEdit')"></v-btn>
        <v-btn variant="text" title="Delete" icon="mdi-delete" v-if="selected.length" @click="doAction('delete')"></v-btn>
        <v-btn variant="text" title="Import" icon="mdi-import" v-if="!selected.length" @click="openImport"></v-btn>
        <v-btn variant="text" title="Export" icon="mdi-export" v-if="!selected.length" @click="exportItems"></v-btn>
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
        
        <v-col v-if="!mobile" class="text-grey-lighten-1 text-right">
            {{ parseInt((data.page - 1) * data.itemsPerPage + 1)?.toLocaleString() }}-{{ Math.min(data.page * data.itemsPerPage, data.totalItems)?.toLocaleString() }} of {{ data.totalItems?.toLocaleString() }}
        </v-col>

        <v-btn variant="text" icon="mdi-chevron-left" :disabled="data.page === 1" @click="prevPage"></v-btn>
        <v-btn variant="text" icon="mdi-chevron-right" :disabled="data.page * data.itemsPerPage >= data.totalItems" @click="nextPage"></v-btn>
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
        mobile: null,
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
        prevPage: function () {
            this.$emit('action', 'prevPage');
        },
        nextPage: function () {
            this.$emit('action', 'nextPage');
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
            let buttons = [];

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
        },
    },
    created() {
        this.internalSection = this.section ? this.section : this.$route.params.section;
    },
}
</script>