<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    /** 角标数值，0 时不显示 */
    count?: number;
    /** 超过 max 显示 max+ */
    max?: number;
    /** 仅显示小红点 */
    dot?: boolean;
  }>(),
  { count: 0, max: 99, dot: false },
);

const text = computed(() => {
  if (props.dot) return '';
  if (props.count > props.max) return `${props.max}+`;
  return String(props.count);
});
</script>

<template>
  <span class="cumquat-badge">
    <slot />
    <Transition name="cumquat-fade">
      <span
        v-if="dot || count > 0"
        class="cumquat-badge__sup"
        :class="dot ? 'cumquat-badge__sup--dot' : ''"
      >
        {{ text }}
      </span>
    </Transition>
  </span>
</template>
