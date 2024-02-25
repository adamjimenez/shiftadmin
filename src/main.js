import { createApp } from 'vue'
import { createVuetify } from 'vuetify'
import App from './App.vue'

let vuetify = createVuetify({
  theme: {
    defaultTheme: 'dark',
  },
})

// Vuetify
import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'
import '@fortawesome/fontawesome-free/css/all.css'
import router from './router';

// get api url
import api from './services/api';
const response = await fetch('https://genieadmin.com/api/?host=' + location.host);
const data = await response.json();

if (data.api_root) {
  console.log('got api root');
  api.setWebUrl(data.api_root);

  createApp(App)
    .use(vuetify)
    .use(router.router)
    .mount('#app')

} else {
  alert('API connection failed');
}