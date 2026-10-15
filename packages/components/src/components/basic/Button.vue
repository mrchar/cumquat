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

const typeClass: Record<string, string> = {
  primary:
    'bg-cumquat-accent text-cumquat-text-inverse hover:bg-cumquat-accent-hover active:bg-cumquat-accent-active',
  secondary:
    'bg-cumquat-surface border border-cumquat-border text-cumquat-text hover:bg-cumquat-surface-2 hover:border-cumquat-border-strong',
  danger: 'bg-cumquat-danger text-cumquat-text-inverse hover:opacity-90',
  ghost: 'text-cumquat-text hover:bg-cumquat-surface-3',
};

const sizeClass: Record<string, string> = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-4 text-sm',
  lg: 'h-11 px-6 text-base',
};
</script>

<template>
  <button
    class="cumquat-button inline-flex cursor-pointer items-center justify-center gap-2 rounded-cumquat font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cumquat-accent disabled:cursor-not-allowed disabled:opacity-50"
    :class="[typeClass[type], sizeClass[size], block ? 'w-full' : '']"
    :disabled="disabled || loading"
  >
    <svg
      v-if="loading"
      class="cumquat-button__spinner size-4 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="3"
    >
      <circle cx="12" cy="12" r="9" class="opacity-25" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke-linecap="round" />
    </svg>
    <slot />
  </button>
</template>
