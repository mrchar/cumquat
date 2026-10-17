<script setup lang="ts">
import { computed } from 'vue';
import { useModal, useOverlayContainer } from '@cumquat/composables';

const props = withDefaults(
  defineProps<{
    /** v-model:open 控制开合 */
    open?: boolean;
    title?: string;
    width?: string;
    closable?: boolean;
    /** 点击遮罩是否关闭 */
    maskClosable?: boolean;
    /** ESC 是否关闭 */
    escClosable?: boolean;
    /** 是否锁定背景滚动 */
    lockScroll?: boolean;
    /** Teleport 目标，默认 body */
    appendTo?: string | HTMLElement;
  }>(),
  {
    open: false,
    title: '',
    width: '32rem',
    closable: true,
    maskClosable: true,
    escClosable: true,
    lockScroll: true,
    appendTo: undefined,
  },
);

const emit = defineEmits<{
  'update:open': [value: boolean];
  open: [];
  close: [];
}>();

const {
  isOpen,
  open: setOpen,
  close,
  contentRef,
  rendered,
  onAfterLeave,
  zIndex,
  onMaskClick,
} = useModal({
  modelValue: props.open !== undefined ? () => props.open : undefined,
  maskClosable: props.maskClosable,
  escClosable: props.escClosable,
  lockScroll: props.lockScroll,
  onChange: (next) => emit('update:open', next),
  onOpen: () => emit('open'),
  onClose: () => emit('close'),
});

const { container } = useOverlayContainer({ to: props.appendTo });
const teleportTarget = computed<string | HTMLElement>(() => container.value ?? 'body');

defineExpose({ open: setOpen, close });
</script>

<template>
  <Teleport :to="teleportTarget">
    <Transition name="cumquat-fade" @after-leave="onAfterLeave">
      <div v-if="rendered" v-show="isOpen" class="cumquat-dialog" :style="{ zIndex }">
        <div class="cumquat-dialog__mask" @click="onMaskClick" />
        <div
          ref="contentRef"
          role="dialog"
          aria-modal="true"
          class="cumquat-dialog__panel"
          :style="{ maxWidth: width }"
        >
          <header v-if="title || closable || $slots.title" class="cumquat-dialog__header">
            <slot name="title">
              <h3 class="cumquat-dialog__title">{{ title }}</h3>
            </slot>
            <button
              v-if="closable"
              type="button"
              aria-label="关闭"
              class="cumquat-dialog__close"
              @click="close"
            >
              <svg
                class="cumquat-dialog__close-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
              >
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </header>

          <div class="cumquat-dialog__body">
            <slot />
          </div>

          <footer v-if="$slots.footer" class="cumquat-dialog__footer">
            <slot name="footer" />
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
