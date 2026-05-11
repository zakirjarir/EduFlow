import { createApp } from 'vue'
import App from './App.vue'
import './index.css'
import router from './router'
import { registerSW } from 'virtual:pwa-register'

registerSW({ immediate: true })

createApp(App).use(router).mount('#root')
