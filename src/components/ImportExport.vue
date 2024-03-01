<template>
    <v-dialog v-model="importDialog" max-width="600" scrollable>
        <v-card title="Import">
            <v-card-text>
                <v-alert v-if="error" :text="error" type="error" />
                <v-file-input v-model="file" label="CSV file" @update:modelValue="readFile"></v-file-input>

                <div v-if="importHeaders.length">
                    <h4>Match up the fields</h4>
                    <div v-for="(header, index) in headers" :key="index">
                        <v-select :items="importHeaders" :label="header.title" v-model="importCols[header.key]" />
                    </div>
                </div>
            </v-card-text>
            <v-card-actions>
                <v-btn @click="doImport" variant="flat" color="primary" :disabled="!importHeaders.length">Import</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script>
import api from "../services/api";
import qs from "qs";

export default {
    props: {
        headers: null,
        section: null,
        fields: null,
        columns: null,
    },
    data: function () {
        return {
            error: '',
            importDialog: false,
            importHeaders: [],
            importCols: {},
        };
    },
    methods: {
        openImport: function () {
            this.importDialog = true;
        },
        doImport: async function () {
            const formData = new FormData();

            // form data
            for (const [name, value] of Object.entries(this.importCols)) {
                formData.append('fields[' + name + ']', value);
            }
            
            // get file data
            formData.append('file', this.file[0]);

            this.error = '';
            this.loading = true;

            const result = await api.post('?cmd=import&section=' + this.internalSection, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                }
            });
            this.loading = false;

            if (result.data.error) {
                this.error = result.data?.error;
                return;
            }

            this.importDialog = false;
            this.$emit('reload');
        },
        readFile: function () {
            const fileReader = new FileReader();
            fileReader.onload = (e) => {
                const csvData = e.target.result;
                const rows = csvData.split('\n');

                let headers = [];
                let rowData = rows[0].split(',');
                for (let i = 0; i < rowData.length; i++) {
                    const field = rowData[i].trim();
                    if (field.startsWith('"') && field.endsWith('"')) {
                        headers.push(field.slice(1, -1)); // Extract content excluding quotes
                    } else {
                        headers.push(field);
                    }
                }

                let preview = [];
                rowData = rows[1].split(',');
                for (let i = 0; i < rowData.length; i++) {
                    const field = rowData[i].trim();
                    if (field.startsWith('"') && field.endsWith('"')) {
                        preview.push(field.slice(1, -1)); // Extract content excluding quotes
                    } else {
                        preview.push(field);
                    }
                }

                this.importHeaders = [];
                headers.forEach((item, index) => {
                    this.importHeaders.push({
                        value: index,
                        raw: item,
                        title: item + ' - ' + preview[index],
                    });
                });

                // auto-match columns
                this.importCols = {};
                this.headers.forEach((header) => {
                    let option = this.importHeaders.find(item => item.raw === header.key);
                    this.importCols[header.key] = option ? option.value : '';
                });
            };
            fileReader.readAsText(this.file[0]);
        },
        exportItems: function () {
            let data = {
                cmd: 'export',
                section: this.section,
                fields: this.fields,
                columns: this.columns,
            };

            const params = qs.stringify(data);

            window.open(api.getApiRoot() + '?' + params);
        },
    }
}
</script>