<script setup lang="ts">
import type { SceneId } from '@/types'
import { SCENARIO_MAP } from '@/config/sites'

/** 场景缩略图：一律引用 public/assets/scenes 下的本地 SVG，禁止外链与破图 */
withDefaults(defineProps<{ sceneId: SceneId; variant?: 'thumb' | 'banner' }>(), { variant: 'thumb' })

const assetOf = (id: SceneId) => SCENARIO_MAP[id].asset
</script>

<template>
  <img
    class="thumb"
    :class="`thumb--${variant}`"
    :src="assetOf(sceneId)"
    :alt="`${SCENARIO_MAP[sceneId].name}场景缩略图`"
    loading="eager"
    decoding="async"
    draggable="false"
  />
</template>

<style scoped>
.thumb {
  display: block;
  object-fit: cover;
  background: var(--surface-1);
}

.thumb--thumb {
  width: 46px;
  height: 46px;
  border-radius: var(--r-sm);
  border: 1px solid var(--border-soft);
  object-position: 50% 58%;
}

.thumb--banner {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
