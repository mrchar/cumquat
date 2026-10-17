<script setup lang="ts">
import { useControllableModel } from '@cumquat/composables';

const props = withDefaults(
  defineProps<{
    type?: 'info' | 'success' | 'warning' | 'danger';
    title?: string;
    closable?: boolean;
    /** 是否显示类型图标 */
    showIcon?: boolean;
    modelValue?: boolean;
  }>(),
  { type: 'info', title: '', closable: false, showIcon: true, modelValue: undefined },
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

const iconPath: Record<string, string> = {
  info: 'M12 8h.01M11 12h1v4h1',
  success: 'm5 13 4 4L19 7',
  warning: 'M12 9v4m0 4h.01M12 3 2 20h20L12 3z',
  danger:
    'M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z',
};
</script>

<template>
  <Transition name="cumquat-fade">
    <div v-if="visible" role="alert" class="cumquat-alert" :class="`cumquat-alert--${type}`">
      <svg
        v-if="showIcon"
        class="cumquat-alert__icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path :d="iconPath[type]" />
      </svg>
      <div class="cumquat-alert__body">
        <p v-if="title || $slots.title" class="cumquat-alert__title">
          <slot name="title">{{ title }}</slot>
        </p>
        <div class="cumquat-alert__content">
          <slot />
        </div>
      </div>
      <button
        v-if="closable"
        type="button"
        aria-label="关闭"
        class="cumquat-alert__close"
        @click="close"
      >
        <svg
          class="cumquat-alert__close-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
        >
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  </Transition>
</template>
