<template>
    <div>
        <v-tabs>
            <v-tab value="tables">Tables</v-tab>
            <v-tab value="sections">Sections</v-tab>
            <v-tab value="dropdowns">Dropdowns</v-tab>
            <v-tab value="general">General</v-tab>
            <v-tab value="template">Template</v-tab>
            <v-tab value="login">Login</v-tab>
        </v-tabs>

        <v-card v-if="tab === 'summary'" min-width="600">

        </v-card>
    </div>
</template>

<script>
export default {
    data: function () {
        return {
            tab: 'tables'
        }
    }
}
</script>
