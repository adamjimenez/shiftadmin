<template>
    <editor v-bind="$attrs" />
</template>

<script>
import 'tinymce'
import Editor from '@tinymce/tinymce-vue';
/* Required TinyMCE components */
import 'tinymce/icons/default/icons.min.js';
import 'tinymce/themes/silver/theme.min.js';
import 'tinymce/models/dom/model.min.js';

import 'tinymce/skins/content/default/content.js';

/* Import a skin (can be a custom skin instead of the default) */
/*import 'tinymce/skins/content/default/content.css';*/

import 'tinymce/skins/ui/oxide/skin.js';
import 'tinymce/skins/ui/oxide/content.min.css';
import 'tinymce/skins/ui/oxide/content.js';

/*
import 'tinymce/skins/content/dark/content.css';
import 'tinymce/skins/ui/oxide-dark/skin.js';
import 'tinymce/skins/ui/oxide-dark/content.min.css';
import 'tinymce/skins/ui/oxide-dark/content.js';
*/

/* Import plugins */
import 'tinymce/plugins/advlist';
import 'tinymce/plugins/code';
import 'tinymce/plugins/emoticons';
import 'tinymce/plugins/emoticons/js/emojis';
import 'tinymce/plugins/link';
import 'tinymce/plugins/lists';
import 'tinymce/plugins/table';
import 'tinymce/plugins/media';
import 'tinymce/plugins/image';

export default {
    components: {
        'editor': Editor
    },

}
</script>
