<template>
    <component :is="currentComponent"></component>
</template>
  
<script>
import * as Vue from 'vue';

export default {
    computed: {
        currentComponent() {
            const componentName = this.$route.params.catchAll;

            const options = {
                moduleCache: {
                    vue: Vue,
                },
                async getFile(url) {
                    const res = await fetch(url);
                    if (!res.ok)
                        throw Object.assign(new Error(res.statusText + ' ' + url), { res });
                    return {
                        getContentData: asBinary => asBinary ? res.arrayBuffer() : res.text(),
                    }
                },
                addStyle(textContent) {
                    const style = Object.assign(document.createElement('style'), { textContent });
                    const ref = document.head.getElementsByTagName('style')[0] || null;
                    document.head.insertBefore(style, ref);
                },
            }

            const { loadModule } = window["vue3-sfc-loader"];
            let customComponent = Vue.defineAsyncComponent(() => loadModule('https://adam.gogetters.co.uk/admin/' + componentName + '.vue', options))

            return customComponent;
        },
    },
}
</script>