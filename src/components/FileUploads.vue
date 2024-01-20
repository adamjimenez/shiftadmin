<template>
    <v-btn icon="mdi-file-upload" title="File uploads" @click="open"></v-btn>

    <v-dialog v-model="dialog" scrollable>
        <v-card>

            <v-data-table :items="items" :headers="headers" show-select v-model="selected">
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
            path: '',
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
            console.log(result)
        },
        open: function () {
            this.dialog = true;
            this.fetchData();
        }
    },
    
    async mounted() {
        this.apiRoot = api.getApiRoot()
    }
}

</script>