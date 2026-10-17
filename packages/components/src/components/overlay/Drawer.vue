<script setup lang="ts">
import { computed } from 'vue';
import { useModal, useOverlayContainer } from '@cumquat/composables';

const props = withDefaults(
  defineProps<{
    /** v-model:open 控制开合 */
    open?: boolean;
    title?: string;
    /** 滑出方向 */
    direction?: 'left' | 'right' | 'top' | 'bottom';
    /** 面板尺寸（左右为宽度，上下为高度） */
    size?: string;
    closable?: boolean;
    maskClosable?: boolean;
    escClosable?: boolean;
    lockScroll?: boolean;
    appendTo?: string | HTMLElement;
  }>(),
  {
    open: false,
    title: '',
    direction: 'right',
    size: '24rem',
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

const panelStyle = computed(() => {
  if (props.direction === 'left' || props.direction === 'right') return { width: props.size };
  return { height: props.size };
});

defineExpose({ open: setOpen, close });
</script>

<template>
  <Teleport :to="teleportTarget">
    <Transition name="cumquat-fade" @after-leave="onAfterLeave">
      <div
        v-if="rendered"
        v-show="isOpen"
        class="cumquat-drawer"
        :class="`cumquat-drawer--${direction}`"
        :style="{ zIndex }"
      >
        <div class="cumquat-drawer__mask" @click="onMaskClick" />
        <aside
          ref="contentRef"
          role="dialog"
          aria-modal="true"
          class="cumquat-drawer__panel"
          :style="panelStyle"
        >
          <header v-if="title || closable" class="cumquat-drawer__header">
            <h3 class="cumquat-drawer__title">{{ title }}</h3>
            <button
              v-if="closable"
              type="button"
              aria-label="关闭"
              class="cumquat-drawer__close"
              @click="close"
            >
              <svg
                class="cumquat-drawer__close-icon"
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
          <div class="cumquat-drawer__body">
            <slot />
          </div>
          <footer v-if="$slots.footer" class="cumquat-drawer__footer">
            <slot name="footer" />
          </footer>
        </aside>
      </div>
    </Transition>
  </Teleport>
</template>
