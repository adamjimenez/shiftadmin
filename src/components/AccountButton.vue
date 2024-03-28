<template>
    <v-menu v-model="opened">
        <template v-slot:activator="{ props }">
            <v-btn color="primary" v-bind="props" @click.stop @mousedown.stop>
                <v-avatar color="primary">
                    {{ user?.initials ? user.initials : '??' }}
                </v-avatar>
            </v-btn>
        </template>
        <v-list>
            <v-list-item to="/logout" title="Logout" prepend-icon="mdi-logout">
            </v-list-item>
        </v-list>
    </v-menu>
</template>

<script>
export default {
    props: {
        user: null,
    },
    data: function () {
		return {
            opened: false,
        }
    }
}
</script>
