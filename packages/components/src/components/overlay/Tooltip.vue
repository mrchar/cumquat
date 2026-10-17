<script setup lang="ts">
import { watch } from 'vue';
import { useFloating, useHoverIntent, useOpen } from '@cumquat/composables';
import type { Placement } from '@cumquat/composables';

const props = withDefaults(
  defineProps<{
    content?: string;
    /** 气泡出现位置 */
    placement?: Placement;
    /** 打开延迟（毫秒） */
    openDelay?: number;
    /** 关闭延迟（毫秒） */
    closeDelay?: number;
    disabled?: boolean;
  }>(),
  {
    content: '',
    placement: 'top',
    openDelay: 0,
    closeDelay: 0,
    disabled: false,
  },
);

const hover = useHoverIntent({
  showDelay: props.openDelay,
  hideDelay: props.closeDelay,
  disabled: props.disabled,
});

const { isOpen, toggle } = useOpen();

// 悬停意图同步驱动开合（同步 watch，保证无延迟时即时响应）
watch(hover.isHovered, (hovered) => toggle(hovered), { flush: 'sync' });

const { referenceRef, floatingRef, floatingStyles } = useFloating({
  placement: () => props.placement,
  gap: 10,
  open: isOpen,
});
</script>

<template>
  <span
    ref="referenceRef"
    class="cumquat-tooltip"
    @mouseenter="hover.onMouseEnter"
    @mouseleave="hover.onMouseLeave"
  >
    <slot />
    <Transition name="cumquat-fade">
      <span
        v-if="isOpen"
        ref="floatingRef"
        role="tooltip"
        class="cumquat-tooltip__content"
        :class="`cumquat-tooltip__content--${placement.split('-')[0]}`"
        :style="floatingStyles"
      >
        <slot name="content">{{ content }}</slot>
      </span>
    </Transition>
  </span>
</template>
