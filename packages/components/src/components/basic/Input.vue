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
</script>

<template>
  <div
    class="cumquat-input"
    :class="[
      `cumquat-input--${size}`,
      invalid ? 'cumquat-input--invalid' : '',
      $slots.prefix ? 'cumquat-input--prefix' : '',
      $slots.suffix ? 'cumquat-input--suffix' : '',
    ]"
  >
    <span v-if="$slots.prefix" class="cumquat-input__prefix">
      <slot name="prefix" />
    </span>
    <input
      v-model="model"
      :type="type"
      :placeholder="placeholder"
      :disabled="disabled"
      :readonly="readonly"
      class="cumquat-input__inner"
    />
    <span v-if="$slots.suffix" class="cumquat-input__suffix">
      <slot name="suffix" />
    </span>
  </div>
</template>
