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
</script>

<template>
  <div
    class="cumquat-space"
    :class="[
      direction === 'vertical'
        ? 'cumquat-space--vertical'
        : wrap
          ? 'cumquat-space--wrap'
          : 'cumquat-space--horizontal',
      `cumquat-space--size-${props.size}`,
    ]"
  >
    <template v-for="(child, index) in children" :key="index">
      <component :is="child" />
    </template>
  </div>
</template>
