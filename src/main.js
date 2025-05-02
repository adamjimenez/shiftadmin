import { createApp } from 'vue'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as labsComponents from 'vuetify/labs/components'
import App from './App.vue'

// get dark mode setting from device
let dark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
let vuetify = createVuetify({
  components: {
    ...components,
    ...labsComponents,
  },
  theme: {
    defaultTheme: dark ? 'dark' : 'light',
  },
})

// Vuetify
import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'
import '@fortawesome/fontawesome-free/css/all.css'
import router from './router';

// get api url
import api from './services/api';
import util from './services/util';
const response = await fetch('https://genieadmin.com/api/?host=' + location.host);
const data = await response.json();

// Global error handler for chunk load failures
window.addEventListener('error', (event) => {
  if (/Loading chunk * failed/i.test(event.message)) {
    const lastReload = localStorage.getItem('lastChunkReload');
    const now = Date.now();
    if (!lastReload || now - parseInt(lastReload) > 1000) {
      localStorage.setItem('lastChunkReload', now.toString());
      window.location.reload(); // Modern browsers handle cache bypass with proper headers
    }
  }
});

if (data.api_root) {
  console.log('got api root');
  api.setWebUrl(data.api_root);
  util.setEdition(data.edition);

  createApp(App)
    .use(vuetify)
    .use(router.router)
    .mount('#app')

} else {
  alert('API connection failed');
}