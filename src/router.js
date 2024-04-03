import { createRouter, createWebHistory } from 'vue-router'
import qs from 'qs';

const routes = [
    {
        path: '/:base(admin[^/]*)?',
        component: () => import('./Main.vue'),
        children: [{
            path: '/:base(admin[^/]*)?/section/:section(.*)/:id([0-9]+)/edit',
            component: () => import('./components/EditPage.vue')
        }, {
            path: '/:base(admin[^/]*)?/section/:section(.*)/add',
            component: () => import('./components/EditPage.vue'),
        }, {
            path: '/:base(admin[^/]*)?/section/:section(.*)/:id([0-9]+)',
            component: () => import('./components/ViewPage.vue')
        }, {
            path: '/:base(admin[^/]*)?/section/:section([a-z0-9% ]+)/',
            component: () => import('./components/ListPage.vue')
        }, {
            path: '/:base(admin[^/]*)?/configure',
            component: () => import('./components/ConfigurePage.vue')
        }, {
            path: '/:base(admin[^/]*)?/upgrade',
            component: () => import('./components/UpgradePage.vue')
        }, {
            path: '/:base(admin[^/]*)?/reports/:id([0-9]+)',
            component: () => import('./components/ReportPage.vue')
        }, {
            path: '/:base(admin[^/]*)?/',
            component: () => import('./components/HomePage.vue')
        }, {
            path: '/:base(admin[^/]*)?/:catchAll(.*).vue',
            component: () => import('./components/CustomComponent.vue')
        }, {
            path: '/:base(admin[^/]*)?/:catchAll(.*)',
            component: () => import('./components/IframePage.vue')
        }]
    }, {
        path: '/:base(admin[^/]*)?/login',
        component: () => import('./components/LoginPage.vue')
    }
];
    
const router = createRouter({
    mode: 'history',
    base: process.env.BASE_URL,
    history: createWebHistory(),
    routes: routes,
    // set custom query resolver
    parseQuery: qs.parse,
    stringifyQuery: qs.stringify,
})

export default {
    router
}