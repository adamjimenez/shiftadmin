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
            <v-list-item>
                {{ user.name }}
            </v-list-item>
            <v-list-item @click="logout" title="Logout" prepend-icon="mdi-logout"></v-list-item>
        </v-list>
    </v-menu>
</template>

<script>
import api from "../services/api";
import util from "../services/util";

export default {
    props: {
        user: null,
    },
    data: function () {
		return {
            opened: false,
        }
    },
    methods: {
        logout: async function () {
            await api.post('?cmd=logout');
            this.$router.push(util.base() + 'login');
        }
    }
}
</script>