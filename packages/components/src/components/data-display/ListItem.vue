<script setup lang="ts">
/**
 * List.Item：列表项容器。
 * 纯布局组件：内容区 + 操作区（#actions 插槽）+ 右侧附加区（#extra 插槽）。
 * 数据驱动模式下由 List 内部渲染，插槽模式下由宿主直接编排。
 */
</script>

<template>
  <li class="cumquat-list-item">
    <div class="cumquat-list-item__main">
      <slot />
    </div>
    <ul v-if="$slots.actions" class="cumquat-list-item__actions">
      <slot name="actions" />
    </ul>
    <div v-if="$slots.extra" class="cumquat-list-item__extra">
      <slot name="extra" />
    </div>
  </li>
</template>
