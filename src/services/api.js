import axios from 'axios'
axios.defaults.withCredentials = true

import { setup } from 'axios-cache-adapter'
import router from '../router'

// Create `axios-cache-adapter` instance
const cache = setup({
    maxAge: 15 * 60 * 1000,
    cache: {
        // Invalidate only when a specific option is passed through config
        invalidate: async (config, request) => {
            if (request.clearCacheEntry) {
                await config.store.removeItem(config.uuid)
            }
        }
    }
})

const api = axios.create({
    adapter: cache.adapter
})

api.interceptors.response.use((response) => {
    return response;
}, (error) => {
    const originalRequest = error.config;
    
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
        let base = '/';

        if (router.router.currentRoute.value.params.base) {
            base += router.router.currentRoute.value.params.base + '/';
        }

        router.router.push(base + 'login')

        return Promise.reject('Forbidden');
    }

    return Promise.reject(error);
})

let webUrl = '';
let apiRoot = '';

export default {
    getWebUrl() {
        return webUrl;
    },
    getApiRoot() {
        return apiRoot;
    },
    setWebUrl(url) {
        webUrl = url;
        apiRoot = webUrl + '_lib/api/v2/';
    },
    getAxios() {
        return api;
    },
    get(path) {
        let url = (path.substr(0, 4) === 'http') ? path : apiRoot + path
        return api.get(url);
    },
    post(path, payload, headers) {
        let url = (path.substr(0, 4) === 'http') ? path : apiRoot + path
        return api.post(url, payload, headers)
    },
    event(path, callback, errorCallback, completeCallback) {
        let source = new EventSource(apiRoot + path, { withCredentials: true })

        source.addEventListener('message', (event) => {
            let result = JSON.parse(event.data)
            console.log(result);
            
            if (result.error) {
                errorCallback(result.error);
            } else if (result.msg) {
                callback(result);
            }
        }, false)
    
        source.addEventListener('error', (event) => {
            if (event.eventPhase == 2) {
              if (source) {
                source.close();
                completeCallback();
              }
            }
        }, false);
    }
}