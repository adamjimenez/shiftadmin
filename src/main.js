import { createApp } from 'vue'
import App from './App.vue'
import vuetify from './plugins/vuetify'

// Vuetify
import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'
import '@fortawesome/fontawesome-free/css/all.css' 
import router from './router';

createApp(App)
  .use(vuetify)
  .use(router.router)
  .mount('#app')
