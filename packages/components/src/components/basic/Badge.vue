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
  <span class="cumquat-badge relative inline-flex">
    <slot />
    <Transition name="cumquat-fade">
      <span
        v-if="dot || count > 0"
        class="cumquat-badge__sup absolute -top-1.5 -right-1.5 flex items-center justify-center rounded-full bg-cumquat-danger font-medium text-cumquat-text-inverse"
        :class="
          dot
            ? 'size-2.5 border-2 border-cumquat-surface'
            : 'h-4.5 min-w-4.5 border-2 border-cumquat-surface px-1 text-[0.65rem]'
        "
      >
        {{ text }}
      </span>
    </Transition>
  </span>
</template>
