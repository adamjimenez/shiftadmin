<template>
    <div style="position: relative; width: 100%;" class="d-flex">
        <iframe :src="$route.params.catchAll ? $route.params.catchAll : 'admin'" style="border:0; width: 100%;"
            class="grow"></iframe>
    </div>
</template>

<script>
export default {
};
</script>
