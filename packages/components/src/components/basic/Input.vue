<script setup lang="ts">
withDefaults(
  defineProps<{
    type?: string;
    size?: 'sm' | 'md' | 'lg';
    placeholder?: string;
    disabled?: boolean;
    readonly?: boolean;
    /** 校验失败态（红框） */
    invalid?: boolean;
  }>(),
  { type: 'text', size: 'md', placeholder: '', disabled: false, readonly: false, invalid: false },
);

const model = defineModel<string>({ default: '' });

const sizeClass: Record<string, string> = {
  sm: 'h-8 text-xs',
  md: 'h-10 text-sm',
  lg: 'h-11 text-base',
};
</script>

<template>
  <div class="cumquat-input relative inline-flex w-full items-center">
    <span
      v-if="$slots.prefix"
      class="cumquat-input__prefix pointer-events-none absolute left-3 flex items-center text-cumquat-text-muted"
    >
      <slot name="prefix" />
    </span>
    <input
      v-model="model"
      :type="type"
      :placeholder="placeholder"
      :disabled="disabled"
      :readonly="readonly"
      class="cumquat-input__inner w-full rounded-cumquat border bg-cumquat-surface px-3 text-cumquat-text transition-colors placeholder:text-cumquat-text-muted focus:outline-none focus:ring-2 focus:ring-cumquat-accent/20 disabled:cursor-not-allowed disabled:bg-cumquat-surface-3 disabled:opacity-60"
      :class="[
        sizeClass[size],
        invalid
          ? 'border-cumquat-danger focus:border-cumquat-danger focus:ring-cumquat-danger/20'
          : 'border-cumquat-border focus:border-cumquat-accent',
        $slots.prefix ? 'pl-9' : '',
        $slots.suffix ? 'pr-9' : '',
      ]"
    />
    <span
      v-if="$slots.suffix"
      class="cumquat-input__suffix pointer-events-none absolute right-3 flex items-center text-cumquat-text-muted"
    >
      <slot name="suffix" />
    </span>
  </div>
</template>
