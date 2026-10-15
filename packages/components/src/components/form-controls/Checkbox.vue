<script setup lang="ts">
withDefaults(
  defineProps<{
    label?: string;
    disabled?: boolean;
    /** 半选态（纯视觉） */
    indeterminate?: boolean;
  }>(),
  { label: '', disabled: false, indeterminate: false },
);

const checked = defineModel<boolean>({ default: false });
</script>

<template>
  <label
    class="cumquat-checkbox inline-flex cursor-pointer items-center gap-2 text-sm text-cumquat-text select-none"
    :class="disabled ? 'cursor-not-allowed opacity-50' : ''"
  >
    <input v-model="checked" type="checkbox" class="peer sr-only" :disabled="disabled" />
    <span
      class="cumquat-checkbox__box flex size-4.5 shrink-0 items-center justify-center rounded border transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-cumquat-accent"
      :class="[
        checked || indeterminate
          ? 'border-cumquat-accent bg-cumquat-accent text-cumquat-text-inverse'
          : 'border-cumquat-border-strong bg-cumquat-surface',
      ]"
    >
      <svg
        v-if="indeterminate && !checked"
        class="size-3"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="3"
        stroke-linecap="round"
      >
        <path d="M5 12h14" />
      </svg>
      <svg
        v-else-if="checked"
        class="size-3"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="3"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="m5 13 4 4L19 7" />
      </svg>
    </span>
    <span v-if="label || $slots.default" class="cumquat-checkbox__label">
      <slot>{{ label }}</slot>
    </span>
  </label>
</template>
