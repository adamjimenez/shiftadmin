<template>
    <div style="position: relative; width: 100%;" class="d-flex">
        <iframe v-if="webUrl" :src="frameUrl" style="border:0; width: 100%;"
            class="grow"></iframe>
    </div>
</template>

<script>
import api from "../services/api";

export default {
	data: function () {
		return {
            webUrl: '',
		};
	},
	async mounted() {
        this.webUrl = api.getWebUrl();
	},
    computed: {
        frameUrl: function () {
            return this.webUrl + 'admin?option=' + this.$route.params.catchAll;
        }
    }
};
</script>
