<script setup lang="ts">
withDefaults(
  defineProps<{
    /** 按钮语义类型 */
    type?: 'primary' | 'secondary' | 'danger' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    disabled?: boolean;
    loading?: boolean;
    /** 是否撑满一行 */
    block?: boolean;
  }>(),
  { type: 'secondary', size: 'md', disabled: false, loading: false, block: false },
);
</script>

<template>
  <button
    class="cumquat-button"
    :class="[
      `cumquat-button--${type}`,
      `cumquat-button--${size}`,
      block ? 'cumquat-button--block' : '',
    ]"
    :disabled="disabled || loading"
  >
    <svg
      v-if="loading"
      class="cumquat-button__spinner"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="3"
    >
      <circle cx="12" cy="12" r="9" class="cumquat-button__spinner-track" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke-linecap="round" />
    </svg>
    <slot />
  </button>
</template>
