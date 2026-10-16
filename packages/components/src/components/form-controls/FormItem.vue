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
  <div class="cumquat-form-item">
    <label v-if="label" class="cumquat-form-item__label">
      <span v-if="required" class="cumquat-form-item__required">*</span>
      {{ label }}
    </label>
    <slot />
    <p v-if="error" class="cumquat-form-item__error">{{ error }}</p>
  </div>
</template>
