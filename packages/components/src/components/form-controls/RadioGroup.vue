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
  <div
    class="cumquat-radio-group"
    :class="
      direction === 'horizontal'
        ? 'flex flex-wrap items-center gap-4'
        : 'flex flex-col items-start gap-2.5'
    "
  >
    <slot />
  </div>
</template>
