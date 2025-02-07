<template>
    <v-dialog v-model="dialog" max-width="600" scrollable>
        <v-card :title="'Editing ' + count + ' files'">
            <v-card-text>
                <v-alert v-if="error" :text="error" type="error" />

                <template v-for="field in fields" :key="field.type">
                    <v-list-item v-if="!['id'].includes(field.type)">
                        <template v-slot:prepend>
                            <v-checkbox v-model="enabled[field.column]"></v-checkbox>
                        </template>

                        <v-checkbox v-if="['checkbox'].includes(field.type)" :label="formatString(field.column)"
                            v-model="params[field.column]" :disabled="!enabled[field.column]" />
                        <v-select v-else-if="['select'].includes(field.type)" :label="formatString(field.column)"
                            :items="options[field.column]" v-model="params[field.column]"
                            :disabled="!enabled[field.column]" />
                        <v-select v-else-if="['select_multiple'].includes(field.type)"
                            :label="formatString(field.column)" :items="options[field.column]"
                            v-model="params[field.column]" multiple chips :disabled="!enabled[field.column]">
                        </v-select>
                        <v-autocomplete v-else-if="field.type === 'combo'" :label="formatString(field.column)"
                            v-model="params[field.column]" :items="options[field.column]"
                            @update:search="updateCombo($event, field.column)" :disabled="!enabled[field.column]" />
                        <v-text-field v-else :label="formatString(field.column)" v-model="params[field.column]"
                            :disabled="!enabled[field.column]" />
                    </v-list-item>
                </template>
            </v-card-text>
            <v-card-actions>
                <v-btn @click="save" variant="flat" color="primary" :disabled="!hasChanges">Save</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script>
import api from "../services/api";
import util from "../services/util";

export default {
    props: {
        section: null,
        fields: null,
        vars: null,
        count: null,
        defaultData: null,
    },
    data: function () {
        return {
            dialog: false,
            error: '',
            params: {},
            enabled: {},
            options: {},
        };
    },
    methods: {
        open: async function () {
            this.options = await util.getAllOptions(this.fields, this.vars.options, {});
            this.params = this.defaultData;
            this.dialog = true;
        },
        formatString: function (string) {
            return util.formatString(string);
        },
        save: function () {
            this.$emit('action', 'bulkedit', { data: this.params });
            this.dialog = false;
        },
        updateCombo: async function (term, column) {
            const result = await api.get('?cmd=autocomplete&field=' + column + '&term=' + term);
            this.options[column] = result.data;
        },
    },
    computed: {
        hasChanges: function () {
            return Object.values(this.enabled).filter(item => item === true).length > 0;
        }
    }
}
</script>