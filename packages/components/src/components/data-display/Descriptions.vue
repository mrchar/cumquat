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
  <div class="cumquat-descriptions">
    <h3
      v-if="title"
      class="cumquat-descriptions__title mb-3 text-base font-semibold text-cumquat-text"
    >
      {{ title }}
    </h3>
    <dl
      class="cumquat-descriptions__list grid overflow-hidden rounded-cumquat text-sm"
      :class="[
        bordered
          ? 'border border-cumquat-border divide-y divide-cumquat-border'
          : 'gap-x-8 gap-y-3',
      ]"
      :style="
        bordered
          ? { gridTemplateColumns: `repeat(${column}, 1fr)` }
          : { gridTemplateColumns: `repeat(${column}, minmax(0, 1fr))` }
      "
    >
      <div
        v-for="(item, index) in items"
        :key="index"
        class="cumquat-descriptions__item flex"
        :class="bordered ? 'flex-col' : 'gap-2'"
      >
        <dt
          class="cumquat-descriptions__label shrink-0"
          :class="
            bordered
              ? 'bg-cumquat-surface-2 px-4 py-2.5 font-medium text-cumquat-text-muted'
              : 'text-cumquat-text-muted'
          "
        >
          {{ item.label }}
        </dt>
        <dd
          class="cumquat-descriptions__value"
          :class="bordered ? 'px-4 py-2.5 text-cumquat-text' : 'text-cumquat-text'"
        >
          {{ item.value }}
        </dd>
      </div>
    </dl>
  </div>
</template>
