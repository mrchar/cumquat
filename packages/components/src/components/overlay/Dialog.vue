<script setup lang="ts">
import { computed } from 'vue';
import CqButton from '../basic/Button.vue';
import {
  actionErrorText,
  useActionState,
  useModal,
  useOverlayContainer,
} from '@cumquat/composables';
import type { ActionLike } from '@cumquat/composables';

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
    /** 确认动作：未提供 footer 插槽时渲染默认底部按钮，动作失败保持打开并展示错误提示 */
    action?: ActionLike;
    /** 默认底部确认按钮文案 */
    confirmText?: string;
    /** 默认底部取消按钮文案 */
    cancelText?: string;
    /** 动作失败时的回退文案 */
    errorText?: string;
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
    action: undefined,
    confirmText: '确认',
    cancelText: '取消',
    errorText: undefined,
  },
);

const emit = defineEmits<{
  'update:open': [value: boolean];
  open: [];
  close: [];
  /** 确认动作成功后触发（无 action 时点击确认即触发） */
  confirm: [];
  /** 默认底部取消按钮点击后触发 */
  cancel: [];
  /** 确认动作失败（reject 或返回值导出错误）时触发 */
  actionError: [error: unknown];
}>();

const {
  pending,
  error: actionError,
  run,
} = useActionState(() => props.action?.(), {
  onError: (err) => emit('actionError', err),
});

/** 确认：有 action 时执行并等待，成功才关闭；失败保持打开并展示错误条 */
async function handleConfirm() {
  if (pending.value) return;
  if (props.action) {
    await run();
    if (actionError.value != null) return;
  }
  emit('confirm');
  close();
}

function handleCancel() {
  if (pending.value) return;
  emit('cancel');
  close();
}

const errorText = computed(() =>
  actionError.value != null ? actionErrorText(actionError.value, props.errorText) : null,
);

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
            <p v-if="errorText" class="cumquat-dialog__error cq-state--error" role="alert">
              {{ errorText }}
            </p>
          </div>

          <footer v-if="$slots.footer" class="cumquat-dialog__footer">
            <slot name="footer" />
          </footer>
          <footer v-else-if="action" class="cumquat-dialog__footer">
            <CqButton :disabled="pending" @click="handleCancel">{{ cancelText }}</CqButton>
            <CqButton type="primary" :loading="pending" @click="handleConfirm">
              {{ confirmText }}
            </CqButton>
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
