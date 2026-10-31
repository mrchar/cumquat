<script setup lang="ts">
import Avatar from '../basic/Avatar.vue';

/**
 * List.Item.Meta：列表项的三段式头部（头像 + 标题 + 描述）。
 * props 提供静态内容，同名插槽覆盖对应区域。
 */
defineProps<{
  /** 头像图片地址；#avatar 插槽优先 */
  avatar?: string;
  /** 标题文本；#title 插槽优先 */
  title?: string;
  /** 描述文本；#description 插槽优先 */
  description?: string;
}>();
</script>

<template>
  <div class="cumquat-list-item-meta">
    <div v-if="$slots.avatar || avatar" class="cumquat-list-item-meta__avatar">
      <slot name="avatar">
        <Avatar :src="avatar" size="md" />
      </slot>
    </div>
    <div class="cumquat-list-item-meta__content">
      <div v-if="title !== undefined || $slots.title" class="cumquat-list-item-meta__title">
        <slot name="title">{{ title }}</slot>
      </div>
      <div
        v-if="description !== undefined || $slots.description"
        class="cumquat-list-item-meta__description"
      >
        <slot name="description">{{ description }}</slot>
      </div>
    </div>
  </div>
</template>
