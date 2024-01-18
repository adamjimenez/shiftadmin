import { createApp } from 'vue'
import App from './App.vue'
import vuetify from './plugins/vuetify'
import { createRouter, createWebHistory } from 'vue-router'

// Vuetify
import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'
import '@fortawesome/fontawesome-free/css/all.css' 

const routes = [{
  path: '/section/:section(.*)/:id([0-9]+)/edit',
  component: () => import('./components/EditPage.vue')
}, {
  path: '/section/:section(.*)/add',
  component: () => import('./components/EditPage.vue')
}, {
  path: '/section/:section(.*)/:id([0-9]+)',
  component: () => import('./components/ViewPage.vue')
}, {
  path: '/section/:section(.*)',
  component: () => import('./components/ListPage.vue')
}, {
  path: '/configure',
  component: () => import('./components/ConfigurePage.vue')
}, {
  path: '/',
  component: () => import('./components/HomePage.vue')
}/*, {
  path: '/:catchAll(.*)',
  component: () => import('./components/IframePage.vue')
}*/];

const router = createRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  history: createWebHistory(),
  routes: routes
})

createApp(App)
  .use(vuetify)
  .use(router)
  .mount('#app')
