<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useScroll } from '@cumquat/composables';

const props = withDefaults(
  defineProps<{
    /** 距视口顶部吸附距离（px） */
    top?: number;
    /** 距视口左侧吸附距离（px） */
    left?: number;
    /** 滚动超过该偏移量后切换为 fixed；默认 top 值即阈值 */
    offsetTop?: number;
    /** z-index */
    zIndex?: number;
  }>(),
  { top: 0, left: 0, offsetTop: undefined, zIndex: 100 },
);

const emit = defineEmits<{
  change: [fixed: boolean];
}>();

const rootRef = ref<HTMLElement | null>(null);

/** 元素相对文档的初始位置，作为 fixed 切换阈值 */
const threshold = ref(0);
const size = ref({ width: 0, height: 0 });

const { y: scrollY } = useScroll();

function measure() {
  const el = rootRef.value;
  if (!el) return;
  const rect = el.getBoundingClientRect();
  threshold.value = rect.top + scrollY.value;
  size.value = { width: rect.width, height: rect.height };
}

onMounted(measure);

const fixed = computed(
  // scrollY>0 同时要求越过阈值：未滚动或 jsdom 下测量为 0 时保持 sticky
  () => scrollY.value > 0 && scrollY.value >= threshold.value - (props.offsetTop ?? props.top),
);

watch(fixed, (next) => emit('change', next));

const rootStyle = computed(() =>
  fixed.value
    ? {
        position: 'fixed',
        top: `${props.top}px`,
        left: props.left ? `${props.left}px` : undefined,
        width: `${size.value.width}px`,
        height: `${size.value.height}px`,
        'z-index': props.zIndex,
      }
    : {
        position: 'sticky',
        top: `${props.top}px`,
        left: props.left ? `${props.left}px` : undefined,
      },
);
</script>

<template>
  <div
    ref="rootRef"
    class="cumquat-affix"
    :class="fixed ? 'cumquat-affix--fixed' : ''"
    :style="rootStyle"
  >
    <slot />
  </div>
</template>
