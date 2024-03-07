<template>
    <v-form ref="form" v-model="valid">
        <v-card title="ShiftAdmin" subtitle="Sign in" :loading="loading">
            <v-alert v-if="error" type="error" :text="error" />

            <v-form>
                <v-card-text>
                    <v-text-field v-model="email" :rules="usernameRules" label="Email" required></v-text-field>
                    <v-text-field type="password" v-model="password" :rules="passwordRules" label="Password"
                        required></v-text-field>
                </v-card-text>

                <v-card-actions>
                    <v-btn color="success" @click="login" variant="flat" text="Login" type="submit" />
                </v-card-actions>
            </v-form>
        </v-card>
    </v-form>
</template>
  
<script>
import api from "../services/api";
import util from "../services/util";

export default {
    data: () => ({
        valid: true,
        email: "",
        password: "",
        usernameRules: [(v) => !!v || "Username is required"],
        passwordRules: [(v) => !!v || "Password is required"],
        loading: false,
        error: "",
    }),

    methods: {
        fetchData: async function () {
            const result = await api.post('?cmd=login');

            if (result.data.code === 1) {
                this.$router.push(util.base());
            }
        },
        login: async function() {
            this.error = '';

            var data = {
                cmd: 'login',
                email: this.email,
                password: this.password,
            };

            this.loading = true;
            const result = await api.post('?cmd=login', data);
            this.loading = false;

            if (result.data.error) {
                this.error = result.data.error;
            } else {
                this.$router.push(util.base());
            }            
        },
    },

    mounted: function () {
        this.fetchData();
    }
};
</script>