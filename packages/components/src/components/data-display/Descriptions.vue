<script setup lang="ts">
export interface DescriptionItem {
  label: string;
  value: string;
}

withDefaults(
  defineProps<{
    title?: string;
    items: DescriptionItem[];
    /** 单元格是否带边框 */
    bordered?: boolean;
    /** 每行列数 */
    column?: number;
  }>(),
  { title: '', bordered: false, column: 2 },
);
</script>

<template>
  <div class="cumquat-descriptions" :class="bordered ? 'cumquat-descriptions--bordered' : ''">
    <h3 v-if="title" class="cumquat-descriptions__title">
      {{ title }}
    </h3>
    <dl
      class="cumquat-descriptions__list"
      :style="
        bordered
          ? { gridTemplateColumns: `repeat(${column}, 1fr)` }
          : { gridTemplateColumns: `repeat(${column}, minmax(0, 1fr))` }
      "
    >
      <div v-for="(item, index) in items" :key="index" class="cumquat-descriptions__item">
        <dt class="cumquat-descriptions__label">
          {{ item.label }}
        </dt>
        <dd class="cumquat-descriptions__value">
          {{ item.value }}
        </dd>
      </div>
    </dl>
  </div>
</template>
