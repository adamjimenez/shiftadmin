<template>
    <div style="position: relative; width: 100%;" class="d-flex">
        <iframe v-if="webUrl" :src="frameUrl" style="border:0; width: 100%;"
            class="grow" @message="message"></iframe>
    </div>
</template>

<script>
import api from "../services/api";
import util from "../services/util";

export default {
	data: function () {
		return {
            webUrl: '',
		};
	},
    computed: {
        frameUrl: function () {
            return this.webUrl + 'admin/' + this.$route.params.catchAll;
        }
    },
    methods: {
        receiveMessage: function (message) { 
            console.log(message.data);

            if (message.data.to) {
                this.$router.push(message.data.to);
            } else if (typeof message.data.fullScreen === 'boolean') {
                this.$emit('message', message.data);
            }
        }
    },
	async mounted() {
        if (!['Basic', 'Business'].includes(util.getEdition())) {
            this.$router.push(util.base() + 'upgrade');
            return;
        }

        this.webUrl = api.getWebUrl();
        window.addEventListener('message', this.receiveMessage);

        this.$emit('changeFields', []);
    },
    beforeUnmount() {
        window.removeEventListener('message', this.receiveMessage);
    }
};
</script>