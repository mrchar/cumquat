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
  <label class="cumquat-checkbox" :class="disabled ? 'cumquat-checkbox--disabled' : ''">
    <input v-model="checked" type="checkbox" class="cumquat-checkbox__input" :disabled="disabled" />
    <span
      class="cumquat-checkbox__box"
      :class="checked || indeterminate ? 'cumquat-checkbox__box--active' : ''"
    >
      <svg
        v-if="indeterminate && !checked"
        class="cumquat-checkbox__icon"
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
        class="cumquat-checkbox__icon"
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
