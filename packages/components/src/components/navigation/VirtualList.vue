<script setup lang="ts">
withDefaults(
  defineProps<{
    items: string[];
    /** 容器高度（px） */
    height?: number;
    /** 单项高度（px） */
    itemHeight?: number;
  }>(),
  { items: () => [], height: 240, itemHeight: 40 },
);
</script>

<template>
  <!-- 演示态：静态渲染传入项，结构对齐虚拟滚动容器 -->
  <div
    class="cumquat-virtual-list overflow-y-auto rounded-cumquat border border-cumquat-border bg-cumquat-surface"
    :style="{ height: `${height}px` }"
  >
    <ul class="cumquat-virtual-list__inner">
      <li
        v-for="(item, index) in items"
        :key="index"
        class="cumquat-virtual-list__item flex items-center gap-3 border-b border-cumquat-border px-4 text-sm text-cumquat-text last:border-b-0"
        :style="{ height: `${itemHeight}px` }"
      >
        <span class="cumquat-virtual-list__index w-8 text-xs text-cumquat-text-muted tabular-nums"
          >#{{ index + 1 }}</span
        >
        {{ item }}
      </li>
    </ul>
  </div>
</template>
