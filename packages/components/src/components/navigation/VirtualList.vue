<script setup lang="ts">
import { computed, ref } from 'vue';
import { useResizeObserver } from '@cumquat/composables';

const props = withDefaults(
  defineProps<{
    items: string[];
    /** 容器高度（px） */
    height?: number;
    /** 单项高度（px）；动态行高时传函数 */
    itemHeight?: number;
    /** 上下缓冲行数 */
    buffer?: number;
    /** 动态行高：按索引返回高度（px） */
    dynamicHeight?: (item: string, index: number) => number;
  }>(),
  { items: () => [], height: 240, itemHeight: 40, buffer: 2, dynamicHeight: undefined },
);

const scrollerRef = ref<HTMLElement | null>(null);
const scrollTop = ref(0);

// 感知容器尺寸变化（视口高度以 props.height 为准，SSR/jsdom 下仍可计算窗口）
useResizeObserver(scrollerRef);

function heightAt(index: number) {
  if (props.dynamicHeight) {
    const item = props.items[index];
    return item === undefined ? props.itemHeight : props.dynamicHeight(item, index);
  }
  return props.itemHeight;
}

/** 各项的顶部偏移（动态行高下逐项累加） */
const offsets = computed(() => {
  const list = [0];
  for (let i = 0; i < props.items.length; i += 1) list.push(list[i] + heightAt(i));
  return list;
});

const totalHeight = computed(() => offsets.value[props.items.length] ?? 0);

/** 二分查找偏移对应的起始索引 */
function findIndex(top: number) {
  let lo = 0;
  let hi = props.items.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if ((offsets.value[mid + 1] ?? 0) <= top) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

const startIndex = computed(() => Math.max(0, findIndex(scrollTop.value) - props.buffer));

const endIndex = computed(() => {
  const end = findIndex(scrollTop.value + props.height) + props.buffer + 1;
  return Math.min(props.items.length, end);
});

const visibleItems = computed(() =>
  props.items.slice(startIndex.value, endIndex.value).map((item, offset) => ({
    item,
    index: startIndex.value + offset,
    top: offsets.value[startIndex.value + offset] ?? 0,
    height: heightAt(startIndex.value + offset),
  })),
);

function onScroll(event: Event) {
  scrollTop.value = (event.target as HTMLElement).scrollTop;
}

function scrollToIndex(index: number) {
  const clamped = Math.min(Math.max(0, index), props.items.length - 1);
  const el = scrollerRef.value;
  if (el) el.scrollTop = offsets.value[clamped] ?? 0;
  scrollTop.value = offsets.value[clamped] ?? 0;
}

defineExpose({ scrollToIndex });
</script>

<template>
  <div
    ref="scrollerRef"
    class="cumquat-virtual-list"
    :style="{ height: `${height}px` }"
    @scroll="onScroll"
  >
    <ul class="cumquat-virtual-list__inner" :style="{ height: `${totalHeight}px` }">
      <li
        v-for="entry in visibleItems"
        :key="entry.index"
        class="cumquat-virtual-list__item"
        :style="{ height: `${entry.height}px`, transform: `translateY(${entry.top}px)` }"
      >
        <span class="cumquat-virtual-list__index">#{{ entry.index + 1 }}</span>
        {{ entry.item }}
      </li>
    </ul>
  </div>
</template>
