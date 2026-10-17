<script setup lang="ts">
import { useControllableModel } from '@cumquat/composables';

const props = withDefaults(
  defineProps<{
    title?: string;
    type?: 'info' | 'success' | 'warning' | 'danger';
    closable?: boolean;
    /** v-model:visible 控制显隐 */
    visible?: boolean;
  }>(),
  { title: '', type: 'info', closable: true, visible: undefined },
);

const emit = defineEmits<{
  'update:visible': [value: boolean];
  close: [];
}>();

const { value: visibleState } = useControllableModel<boolean>({
  modelValue: props.visible !== undefined ? () => props.visible : undefined,
  defaultValue: true,
  fallback: true,
  onChange: (next) => emit('update:visible', next),
});

function close() {
  visibleState.value = false;
  emit('close');
}
</script>

<template>
  <Transition name="cumquat-fade">
    <div v-if="visibleState" role="status" class="cumquat-notification">
      <div class="cumquat-notification__inner">
        <span class="cumquat-notification__dot" :class="`cumquat-notification__dot--${type}`" />
        <div class="cumquat-notification__body">
          <p v-if="title" class="cumquat-notification__title">
            {{ title }}
          </p>
          <div class="cumquat-notification__content">
            <slot />
          </div>
          <slot name="action" />
        </div>
        <button
          v-if="closable"
          type="button"
          aria-label="关闭"
          class="cumquat-notification__close"
          @click="close"
        >
          <svg
            class="cumquat-notification__close-icon"
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
    </div>
  </Transition>
</template>
