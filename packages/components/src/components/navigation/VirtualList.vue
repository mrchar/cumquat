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
  <div class="cumquat-virtual-list" :style="{ height: `${height}px` }">
    <ul class="cumquat-virtual-list__inner">
      <li
        v-for="(item, index) in items"
        :key="index"
        class="cumquat-virtual-list__item"
        :style="{ height: `${itemHeight}px` }"
      >
        <span class="cumquat-virtual-list__index">#{{ index + 1 }}</span>
        {{ item }}
      </li>
    </ul>
  </div>
</template>
