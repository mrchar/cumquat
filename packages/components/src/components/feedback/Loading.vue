<script setup lang="ts">
import { computed } from 'vue';
import type { MountTarget } from '@cumquat/composables';
import { useLoadingService, useOverlayContainer } from '@cumquat/composables';

import { useCumquatConfig } from '../../config';

const props = withDefaults(
  defineProps<{
    size?: 'sm' | 'md' | 'lg';
    text?: string;
    /** 局部加载是否激活（非全屏形态使用） */
    active?: boolean;
    /** 全屏遮罩形态：可见性与全局 loading 服务计数联动 */
    fullscreen?: boolean;
    /** 全屏形态的 Teleport 目标；未传时继承配置，默认 body */
    appendTo?: MountTarget;
  }>(),
  { size: 'md', text: '', active: true, fullscreen: false, appendTo: undefined },
);

const service = useLoadingService();

const visible = computed(() => (props.fullscreen ? service.loading.value : props.active));
const config = useCumquatConfig();
const { container } = useOverlayContainer({
  to: () => props.appendTo ?? config.value.overlay?.appendTo,
});
const teleportTarget = computed<MountTarget>(() => container.value ?? 'body');

defineExpose({ service });
</script>

<template>
  <Teleport v-if="fullscreen" :to="teleportTarget">
    <div
      v-if="visible"
      class="cumquat-loading cumquat-loading--fullscreen"
      role="status"
      aria-label="加载中"
    >
      <span class="cumquat-loading__spinner" :class="`cumquat-loading__spinner--${size}`" />
      <span v-if="text" class="cumquat-loading__text">{{ text }}</span>
    </div>
  </Teleport>
  <div v-else-if="visible" class="cumquat-loading" role="status" aria-label="加载中">
    <span class="cumquat-loading__spinner" :class="`cumquat-loading__spinner--${size}`" />
    <span v-if="text" class="cumquat-loading__text">{{ text }}</span>
  </div>
</template>