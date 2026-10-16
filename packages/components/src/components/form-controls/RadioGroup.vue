<script setup lang="ts">
withDefaults(
  defineProps<{
    direction?: 'horizontal' | 'vertical';
  }>(),
  { direction: 'horizontal' },
);

const model = defineModel<string | number | null>({ default: null });

defineExpose({ model });
</script>

<template>
  <div class="cumquat-radio-group" :class="`cumquat-radio-group--${direction}`">
    <slot />
  </div>
</template>
