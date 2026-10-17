<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    /** 角标数值，0 时默认不显示（showZero 可强制显示） */
    count?: number;
    /** 超过 max 显示 max+ */
    max?: number;
    /** 仅显示小红点 */
    dot?: boolean;
    /** 角标语义色 */
    type?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
    /** count 为 0 时也展示 */
    showZero?: boolean;
    /** 自定义角标文本（优先级高于 count） */
    text?: string | number;
    /** 有角标时是否在内容上描出白底（点状样式） */
    hidden?: boolean;
  }>(),
  {
    count: 0,
    max: 99,
    dot: false,
    type: 'danger',
    showZero: false,
    text: undefined,
    hidden: false,
  },
);

function formatCount(count: number, max: number): string {
  if (count > max) return `${max}+`;
  return String(count);
}

const content = computed(() => {
  if (props.text !== undefined) return String(props.text);
  return formatCount(props.count, props.max);
});

const visible = computed(() => {
  if (props.hidden) return false;
  if (props.dot) return true;
  if (props.count === 0) return props.showZero;
  return true;
});
</script>

<template>
  <span class="cumquat-badge">
    <slot />
    <Transition name="cumquat-fade">
      <span
        v-if="visible"
        class="cumquat-badge__sup"
        :class="[dot ? 'cumquat-badge__sup--dot' : '', `cumquat-badge__sup--${type}`]"
      >
        <slot name="count">{{ dot ? '' : content }}</slot>
      </span>
    </Transition>
  </span>
</template>
