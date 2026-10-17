<script setup lang="ts">
import { useControllableModel } from '@cumquat/composables';

const props = withDefaults(
  defineProps<{
    type?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
    closable?: boolean;
    modelValue?: boolean;
  }>(),
  { type: 'default', closable: false, modelValue: undefined },
);

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  close: [];
}>();

const { value: visible } = useControllableModel<boolean>({
  modelValue: props.modelValue !== undefined ? () => props.modelValue : undefined,
  defaultValue: true,
  fallback: true,
  onChange: (next) => emit('update:modelValue', next),
});

function close() {
  visible.value = false;
  emit('close');
}
</script>

<template>
  <Transition name="cumquat-fade">
    <span v-if="visible" class="cumquat-tag" :class="`cumquat-tag--${type}`">
      <slot />
      <button
        v-if="closable"
        type="button"
        aria-label="关闭"
        class="cumquat-tag__close"
        @click="close"
      >
        <svg
          class="cumquat-tag__close-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
        >
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>
    </span>
  </Transition>
</template>
