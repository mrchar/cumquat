<script setup lang="ts">
import { useControllableModel } from '@cumquat/composables';

const props = withDefaults(
  defineProps<{
    type?: 'info' | 'success' | 'warning' | 'danger' | 'error' | 'loading';
    closable?: boolean;
    /** 声明式使用时的可见性（v-model） */
    visible?: boolean;
  }>(),
  { type: 'info', closable: false, visible: undefined },
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

function closeMessage() {
  visibleState.value = false;
  emit('close');
}
</script>

<template>
  <Transition name="cumquat-fade">
    <div
      v-if="visibleState"
      role="status"
      class="cumquat-message"
      :class="`cumquat-message--${type === 'danger' ? 'error' : type}`"
    >
      <span
        class="cumquat-message__dot"
        :class="`cumquat-message__dot--${type === 'danger' ? 'error' : type}`"
      />
      <span class="cumquat-message__body">
        <slot />
      </span>
      <button
        v-if="closable"
        type="button"
        aria-label="关闭"
        class="cumquat-message__close"
        @click="closeMessage"
      >
        <svg
          class="cumquat-message__close-icon"
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
