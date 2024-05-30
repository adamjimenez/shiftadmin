<template>
    <div style="position: relative; width: 100%;" class="d-flex flex-column">
        <v-progress-linear indeterminate v-if="isLoading"></v-progress-linear>

        <iframe v-if="webUrl" :src="frameUrl" style="border:0; width: 100%; height: 100%;"
            class="grow" @message="message"></iframe>
    </div>
</template>

<script>
import api from "../services/api";
import util from "../services/util";
import qs from 'qs';

export default {
	data: function () {
		return {
            webUrl: '',
            isLoading: false,
		};
	},
    beforeRouteUpdate () {
        this.loading = true;
    },
    computed: {
        frameUrl: function () {
            let params = this.$route.query;
            params.frame = 1;

            let paramString = qs.stringify(this.$route.query);

            return this.webUrl + 'admin/' + this.$route.params.catchAll + '?' + paramString;
        }
    },
    methods: {
        receiveMessage: function (message) { 
            console.log(message.data);

            if (message.data.to) {
                this.$router.push(message.data.to);
            }
            
            if (message.data.url) {
                let to = util.base() + message.data.url.substr((this.webUrl + 'admin/') . length)
                this.$router.push(to);
            }
            
            if (typeof message.data.fullScreen === 'boolean') {
                this.$emit('message', message.data);
            }
            
            if (typeof message.data.loading === 'boolean') {
                this.isLoading = message.data.loading;
            }
        },
    },
    watch: {
        frameUrl: function () {
            this.isLoading = true;
        }
    },
	async mounted() {
        if (!['Pro', 'Business', 'Trial'].includes(util.getEdition())) {
            this.$router.push(util.base() + 'upgrade');
            return;
        }

        this.webUrl = api.getWebUrl();
        window.addEventListener('message', this.receiveMessage);

        this.$emit('changeFields', []);
    },
    beforeUnmount() {
        window.removeEventListener('message', this.receiveMessage);
    }, 
};
</script>