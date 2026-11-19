import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ReviewShell from './ReviewShell.vue'
import './styles/base.css'

createApp(ReviewShell).use(createPinia()).mount('#app')
