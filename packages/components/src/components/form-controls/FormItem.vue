<script setup lang="ts">
withDefaults(
  defineProps<{
    label?: string;
    required?: boolean;
    /** 校验错误信息，非空时显示红字 */
    error?: string;
  }>(),
  { label: '', required: false, error: '' },
);
</script>

<template>
  <div class="cumquat-form-item flex flex-col gap-1.5">
    <label v-if="label" class="cumquat-form-item__label text-sm text-cumquat-text">
      <span v-if="required" class="cumquat-form-item__required mr-0.5 text-cumquat-danger">*</span>
      {{ label }}
    </label>
    <slot />
    <p v-if="error" class="cumquat-form-item__error text-xs text-cumquat-danger">{{ error }}</p>
  </div>
</template>
