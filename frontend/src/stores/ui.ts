import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { NavKey } from '@/types'

/**
 * 界面导航状态（纯展示）
 * ---------------------------------------------------------------
 * 顶部导航的四个入口共用一份状态，三个设计版本都读这里，避免各自维护 activeNav。
 * 这里不存任何推演数据，也不参与计算。
 */
export const useUiStore = defineStore('ui', () => {
  const nav = ref<NavKey>('plan')

  function setNav(next: NavKey): void {
    nav.value = next
  }

  function close(): void {
    nav.value = 'plan'
  }

  return { nav, setNav, close }
})
