<template>
    <div>
        <v-tabs v-model="tab">
            <v-tab value="tables">Tables</v-tab>
            <v-tab value="sections">Sections</v-tab>
            <v-tab value="dropdowns">Dropdowns</v-tab>
            <v-tab value="general">General</v-tab>
        </v-tabs>

        <v-card v-if="tab === 'tables'" min-width="600">
            <v-expansion-panels v-model="panel" multiple>
                <v-expansion-panel>
                    <v-expansion-panel-title>Panel 1</v-expansion-panel-title>
                    <v-expansion-panel-text>
                        Some content
                    </v-expansion-panel-text>
                </v-expansion-panel>

                <v-expansion-panel>
                    <v-expansion-panel-title>Panel 2</v-expansion-panel-title>
                    <v-expansion-panel-text>
                        Some content
                    </v-expansion-panel-text>
                </v-expansion-panel>

                <v-expansion-panel>
                    <v-expansion-panel-title>Panel 3</v-expansion-panel-title>
                    <v-expansion-panel-text>
                        Some content
                    </v-expansion-panel-text>
                </v-expansion-panel>
            </v-expansion-panels>
        </v-card>
        <v-card v-if="tab === 'sections'" min-width="600">
            <v-expansion-panels v-model="panel" multiple>
                <v-expansion-panel v-for="(section, key, index) in vars.sections" :key="index">
                    <v-expansion-panel-title>{{ section }}</v-expansion-panel-title>
                    <v-expansion-panel-text>
                        <div v-for="(subsection, key2, index2) in vars.subsections[section]" :key="index2">
                            {{ subsection }}
                        </div>
                    </v-expansion-panel-text>
                </v-expansion-panel>
            </v-expansion-panels>
        </v-card>
        <v-card v-if="tab === 'dropdowns'" min-width="600"></v-card>
        <v-card v-if="tab === 'general'" min-width="600">
            <v-text-field label="From email"></v-text-field>
        </v-card>
    </div>
</template>

<script>
export default {
    props: {
        vars: null,
    },
    data: function () {
        return {
            tab: 'tables',
            panel: [],
        }
    },
    async mounted() {
        await this.$nextTick();
        console.log(this.vars)
    }
}
</script>
