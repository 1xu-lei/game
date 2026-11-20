import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ReviewShell from './ReviewShell.vue'
import './styles/base.css'

/** 单一入口：ReviewShell 内含 A/B/C 三个设计版本 + 规划/推演/结算主流程 + 历史/榜单/设置侧栏 */
createApp(ReviewShell).use(createPinia()).mount('#app')
