<script setup lang="ts">
withDefaults(
  defineProps<{
    /** 标签摆放位置 */
    labelPosition?: 'top' | 'left';
    labelWidth?: string;
  }>(),
  { labelPosition: 'top', labelWidth: '6rem' },
);

function onSubmit(event: Event) {
  event.preventDefault();
}
</script>

<template>
  <form class="cumquat-form" :class="labelPosition === 'left' ? '' : ''" @submit="onSubmit">
    <slot />
  </form>
</template>
