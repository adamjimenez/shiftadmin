<template>
    <v-form ref="form" v-model="valid">
        <v-card title="GenieAdmin" subtitle="Sign in" :loading="loading">
            <v-alert v-if="error" type="error" :text="error" />
            <v-alert v-if="message" type="info" :text="message" />

            <v-card-text v-if="data.code !== 2 && error !== 'invalid'">
                <div v-if="data.trusted === false">
                    <div v-if="!data.otp_sent">
                        <v-radio-group v-model="otpMethod" class="mb-3">                            
                            <v-radio value="email">
                                <template v-slot:label>
                                    <div>
                                        <div class="mb-2">Email me a code</div>
                                        <strong>{{data.email}}</strong>
                                    </div>
                                </template>
                            </v-radio>
                        </v-radio-group>
                    </div>
                    <div v-else>
                        <p>
                            An OTP has been sent to you, please enter the code below.
                        </p>

                        <v-otp-input
                            v-model="otp"
                            :disabled="loading"
                            @finish="fetchData"
                            :length="otpLength"
                            autofocus
                            type="password"
                            ></v-otp-input>
                    </div>
                </div>

                <div v-else-if="data.code !== 1 && data.code !== 2 && error !== 'invalid'">
                    <v-text-field v-if="!query.code" v-model="email" :rules="usernameRules" label="Email"
                        required></v-text-field>
                    <v-text-field v-if="!reset || query.code" type="password" v-model="password" :rules="passwordRules"
                        label="Password" required></v-text-field>
                    <v-btn v-if="!reset && !query.code && !data.no_admin" @click="reset = true" variant="text">Forgot password</v-btn>
                </div>
            </v-card-text>

            <v-card-actions>
                <v-btn v-if="data.code !== 2" color="success" @click="fetchData()" variant="flat"
                    :text="submitText" type="button" :disabled="!isValid" />
                <v-btn v-if="reset && data.code !== 2" @click="reset = false" :to="base + 'login'"
                    variant="text">Cancel</v-btn>
                    <v-spacer></v-spacer>
                <v-btn v-if="data.code === 1" @click="logout">Logout</v-btn>
            </v-card-actions>
        </v-card>
    </v-form>
</template>

<script>
/*
code 1: logged in
code 2: reset email sent
code 3: password reset
*/

import api from "../services/api";
import util from "../services/util";

export default {
    data: () => ({
        valid: true,
        email: "",
        password: "",
        usernameRules: [(v) => !!v || "Email is required"],
        passwordRules: [(v) => !!v || "Password is required"],
        loading: false,
        error: "",
        message: "",
        query: {},
        data: {},
        reset: false,
        otpMethod: "",
        otpSent: false,
        otpLength: 4,
        otp: '',
    }),

    methods: {
        fetchData: async function () {
            this.query = this.$route.query;

            if (this.query.code) {
                this.reset = true;
            }

            let data = {
                cmd: 'login',
                email: this.email,
                password: this.password,
                query: this.query,
                reset: this.reset,
                otp: this.otp,
                otp_method: this.otpMethod,
            };

            this.error = '';
            this.message = '';
            this.loading = true;
            const result = await api.post('?cmd=login', data);
            this.loading = false;
            this.login = false;

            this.data = result.data;

            if (result.data.error) {
                this.error = result.data.error;
            } else {
                if (result.data.message) {
                    this.message = result.data.message;
                }

                if (this.data.code === 1) {
                    if (result.data.admin && result.data.trusted !== false) {
                        this.$router.push(util.base());
                    } else if (this.reset) {
                        this.reset = false;
                        this.$router.push(util.base() + 'login')
                    }
                }
            }
        },
        logout: async function () {
            this.error = '';
            this.message = '';
            this.email = '';
            this.password = '';
            this.loading = true;
            const result = await api.post('?cmd=logout');
            this.loading = false;
            this.data = result.data;

            this.fetchData();
        },
    },

    mounted: function () {
        this.fetchData();
    },

    watch: {
        $route() {
            this.fetchData();
        }
    },

    computed: {
        base() {
            return util.base();
        },
        isValid() {
            return this.valid;
        },
        submitText() {
            if (this.data.code === 3) {
                return 'Set password and login';
            } else if (this.reset) {
                return 'Send password reminder';
            } else if (this.data.trusted === false) {
                return 'Next';
            } else if (this.data.no_admin) {
                return 'Create account';
            }

            return 'Log in';
        },
    }
};
</script>