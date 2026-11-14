
<script setup lang="ts">
import { computed } from 'vue';
import type { MountTarget } from '@cumquat/composables';

import { provideCumquatConfig, useCumquatConfig } from '../../config';
import type { CumquatConfig } from '../../config';

const props = withDefaults(
  defineProps<{
    /** 后代浮层的默认挂载目标；未传时继承父级配置 */
    appendTo?: MountTarget;
  }>(),
  { appendTo: undefined },
);

const parent = useCumquatConfig();
const config = computed<CumquatConfig>(() => ({
  ...parent.value,
  overlay: {
    ...parent.value.overlay,
    ...(props.appendTo !== undefined ? { appendTo: props.appendTo } : {}),
  },
}));

provideCumquatConfig(config);
</script>

<template>
  <slot />
</template>