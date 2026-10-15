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

const dotClass: Record<string, string> = {
  primary: 'bg-cumquat-accent',
  success: 'bg-cumquat-success',
  warning: 'bg-cumquat-warning',
  danger: 'bg-cumquat-danger',
};
</script>

<template>
  <ol class="cumquat-timeline flex flex-col">
    <li
      v-for="(item, index) in items"
      :key="item.key"
      class="cumquat-timeline__item relative flex gap-4 pb-6 last:pb-0"
    >
      <!-- 纵向连线 -->
      <span
        v-if="index < items.length - 1"
        class="cumquat-timeline__line absolute top-3.5 left-[5.5px] h-full w-px bg-cumquat-border"
      />
      <span
        class="cumquat-timeline__dot relative z-10 mt-1.5 size-3 shrink-0 rounded-full ring-4 ring-cumquat-surface"
        :class="dotClass[item.type ?? 'primary']"
      />
      <div class="cumquat-timeline__body flex-1">
        <div class="cumquat-timeline__heading flex items-baseline gap-3">
          <h4 class="cumquat-timeline__title text-sm font-semibold text-cumquat-text">
            {{ item.title }}
          </h4>
          <span v-if="item.time" class="cumquat-timeline__time text-xs text-cumquat-text-muted">{{
            item.time
          }}</span>
        </div>
        <p
          v-if="item.content"
          class="cumquat-timeline__content mt-1 text-sm text-cumquat-text-muted"
        >
          {{ item.content }}
        </p>
        <div v-if="$slots.default" class="mt-1.5">
          <slot :item="item" :index="index" />
        </div>
      </div>
    </li>
  </ol>
</template>
