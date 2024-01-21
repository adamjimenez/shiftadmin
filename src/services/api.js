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
        //location.href = 'https://adam.gogetters.co.uk/login?u=' + encodeURIComponent(location.href)
        router.router.push('/login')

        return Promise.reject('Forbidden');
    }

    return Promise.reject(error);
})

var apiRoot = 'https://adam.gogetters.co.uk/_lib/api/';

export default {
    getApiRoot() {
        return apiRoot;
    },
    getAxios() {
        return api;
    },
    get(path) {
        var url = (path.substr(0, 4) === 'http') ? path : apiRoot + path
        return api.get(url);
    },
    post(path, payload, headers) {
        var url = (path.substr(0, 4) === 'http') ? path : apiRoot + path
        return api.post(url, payload, headers)
    },
    event(path, callback, errorCallback, completeCallback) {
        var source = new EventSource(apiRoot + path, { withCredentials: true })

        source.addEventListener('message', (event) => {
            var result = JSON.parse(event.data)
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