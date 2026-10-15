<script setup lang="ts">
import { computed, useSlots } from 'vue';

const props = withDefaults(
  defineProps<{
    direction?: 'horizontal' | 'vertical';
    size?: 'sm' | 'md' | 'lg';
    /** 子项换行对齐 */
    wrap?: boolean;
  }>(),
  { direction: 'horizontal', size: 'md', wrap: false },
);

const slots = useSlots();

const children = computed(() => slots.default?.() ?? []);

const gapClass = computed(
  () =>
    ({
      sm: 'gap-1.5',
      md: 'gap-3',
      lg: 'gap-6',
    })[props.size],
);
</script>

<template>
  <div
    class="cumquat-space"
    :class="[
      direction === 'vertical'
        ? 'flex flex-col'
        : wrap
          ? 'flex flex-wrap items-center'
          : 'flex items-center',
      gapClass,
    ]"
  >
    <template v-for="(child, index) in children" :key="index">
      <component :is="child" />
    </template>
  </div>
</template>
