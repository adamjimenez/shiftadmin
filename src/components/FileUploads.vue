<template>
    <span>
        <v-btn icon="mdi-file-upload" title="File uploads" @click="open"></v-btn>

        <v-dialog v-model="dialog" scrollable>
            <v-card>
                <v-card-actions>
                    <v-btn title="Up level" :disabled="path === ''" icon="mdi-arrow-up" @click="upLevel"></v-btn>
                    <v-btn title="Create folder" icon="mdi-folder-outline" @click="createFolder"></v-btn>
                    <v-btn title="Delete" icon="mdi-delete" :disabled="selected.length === 0" @click="deleteItems"></v-btn>
                    <v-btn title="Upload" icon="mdi-upload"></v-btn>
                    <v-file-input v-model="file" @update:modelValue="uploadFile"></v-file-input>
                </v-card-actions>

                <v-data-table :items="items" :headers="headers" show-select v-model="selected" @click:row="rowClick" :loading="loading">
                    <template v-slot:[`item.thumb`]="{ item }">
                        <img v-if="item.thumb" :src="apiRoot + '../..' + item.thumb">
                    </template>
                </v-data-table>
            </v-card>
        </v-dialog>
    </span>
</template>

<script>
import api from "../services/api";

export default {
    data: function () {
        return {
            column: '',
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
            loading: false,
            file: [],
        }
    },
    methods: {
        fetchData: async function () {
            this.loading = true;
            const result = await api.get('?cmd=uploads&path=' + this.path);
            this.loading = false;
            this.items = result.data.items;
        },
        open: function (column) {
            this.column = column;
            this.dialog = true;
            this.fetchData();
        },
        rowClick: function (e, item) {
            if (item.item.leaf) {
                let filepath = item.item.id;
                filepath = api.getBaseUrl() + 'uploads' + filepath

                if (typeof this.column === 'function') {
                    this.column(filepath, { title: filepath });
                } else {
                    this.$emit('fileSelected', { value: filepath, column: this.column });
                }

                this.dialog = false;
            } else {
                this.path = item.item.id + '/';
                this.fetchData();
            }
        },
        upLevel: function () {
            let index = this.path.substr(0, this.path.length - 1).lastIndexOf("/");
            if (index !== -1) {
                this.path = this.path.substr(0, index + 1);
            }

            this.fetchData();
        },
        createFolder: async function () {
            let folder = prompt('Folder name');

            if (!folder) {
                return;
            }

            this.loading = true;
            const result = await api.post('?cmd=uploads&path=' + this.path, {
                createFolder: folder
            });
            this.loading = false;

            if (result.data.error) {
                alert(result.data.error);
            }

            this.fetchData();
        },
        deleteItems: async function () {
            if (!confirm('Are you sure?')) {
                return;
            }

            this.loading = true;
            const result = await api.post('?cmd=uploads&path=' + this.path, {
                delete: this.selected
            });
            this.loading = false;

            if (result.data.error) {
                alert(result.data.error);
            }

            this.fetchData();
        },
        uploadFile: async function () {
            console.log(this.file)

            const formData = new FormData();

            this.file.forEach(function (file) {
                console.log('File details:', file);
                formData.append('file', file);
            })

            this.loading = true;
            const result = await api.post('?cmd=uploads&path=' + this.path, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            this.loading = false;

            if (result.data?.error) {
                alert(result.data?.error);
            }

            this.fetchData();
        }
    },

    async mounted() {
        this.apiRoot = api.getApiRoot()
    }
}

</script>