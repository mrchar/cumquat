<script setup lang="ts">
export interface TimelineItem {
  key: string;
  title: string;
  content?: string;
  time?: string;
  /** 节点颜色 */
  type?: 'primary' | 'success' | 'warning' | 'danger';
}

withDefaults(
  defineProps<{
    items: TimelineItem[];
  }>(),
  { items: () => [] },
);
</script>

<template>
  <ol class="cumquat-timeline">
    <li v-for="(item, index) in items" :key="item.key" class="cumquat-timeline__item">
      <!-- 纵向连线 -->
      <span v-if="index < items.length - 1" class="cumquat-timeline__line" />
      <span
        class="cumquat-timeline__dot"
        :class="`cumquat-timeline__dot--${item.type ?? 'primary'}`"
      />
      <div class="cumquat-timeline__body">
        <div class="cumquat-timeline__heading">
          <h4 class="cumquat-timeline__title">{{ item.title }}</h4>
          <span v-if="item.time" class="cumquat-timeline__time">{{ item.time }}</span>
        </div>
        <p v-if="item.content" class="cumquat-timeline__content">{{ item.content }}</p>
        <div v-if="$slots.default" class="cumquat-timeline__extra">
          <slot :item="item" :index="index" />
        </div>
      </div>
    </li>
  </ol>
</template>
