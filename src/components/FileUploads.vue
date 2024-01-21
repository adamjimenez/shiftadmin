<template>
    <v-btn icon="mdi-file-upload" title="File uploads" @click="open"></v-btn>

    <v-dialog v-model="dialog" scrollable>
        <v-card>
            <v-card-actions>
                <v-btn title="Up level" :disabled="path === ''" icon="mdi-arrow-up" @click="upLevel"></v-btn>
                <v-btn title="Create folder" icon="mdi-folder-outline"></v-btn>
                <v-btn title="Upload" icon="mdi-upload"></v-btn>
                <v-btn title="Delete" icon="mdi-delete"></v-btn>
            </v-card-actions>

            <v-data-table :items="items" :headers="headers" show-select v-model="selected" @click:row="rowClick">
                <template v-slot:[`item.thumb`]="{ item }">
                    <img v-if="item.thumb" :src="apiRoot + '../..' + item.thumb">
                </template>
            </v-data-table>
        </v-card>
    </v-dialog>
</template>

<script>
import api from "../services/api";

export default {
	data: function () {
		return {
            dialog: false,
            items: [],
            path: '/',
            headers: [{
                title: 'Name',
                value: 'name'
            }, {
                title: 'Thumb',
                value: 'thumb'
            }],
            apiRoot: '',
            selected: [],
        }
    },
    methods: {
        fetchData: async function () {
            const result = await api.get('?cmd=uploads&path=' + this.path);
            this.items = result.data.items;
        },
        open: function () {
            this.dialog = true;
            this.fetchData();
        },
        rowClick: function (e, item) {
            this.path = item.item.id + '/';
            this.fetchData();
        },
        upLevel: function () {
            let index = this.path.substr(0, this.path.length - 1).lastIndexOf("/");
            if (index !== -1) {
                this.path = this.path.substr(0, index + 1);
            }

            this.fetchData();
        }
    },
    
    async mounted() {
        this.apiRoot = api.getApiRoot()
    }
}

</script>