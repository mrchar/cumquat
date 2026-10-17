<script setup lang="ts">
import { computed } from 'vue';
import { useLoadingService } from '@cumquat/composables';

const props = withDefaults(
  defineProps<{
    size?: 'sm' | 'md' | 'lg';
    text?: string;
    /** 局部加载是否激活（非全屏形态使用） */
    active?: boolean;
    /** 全屏遮罩形态：可见性与全局 loading 服务计数联动 */
    fullscreen?: boolean;
  }>(),
  { size: 'md', text: '', active: true, fullscreen: false },
);

const service = useLoadingService();

const visible = computed(() => (props.fullscreen ? service.loading.value : props.active));

defineExpose({ service });
</script>

<template>
  <Teleport v-if="fullscreen" to="body">
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
