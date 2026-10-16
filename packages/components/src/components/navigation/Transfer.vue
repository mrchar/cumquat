<script setup lang="ts">
import { computed } from 'vue';

export interface TransferItem {
  key: string;
  label: string;
}

const props = withDefaults(
  defineProps<{
    data: TransferItem[];
    titles?: [string, string];
  }>(),
  {
    data: () => [],
    titles: () => ['源列表', '目标列表'],
  },
);

/** 右栏（已选）的 key 列表 */
const model = defineModel<string[]>({ default: () => [] });

const leftItems = computed(() => props.data.filter((item) => !model.value.includes(item.key)));
const rightItems = computed(() => props.data.filter((item) => model.value.includes(item.key)));

function toRight(item: TransferItem) {
  model.value = [...model.value, item.key];
}

function toLeft(item: TransferItem) {
  model.value = model.value.filter((k) => k !== item.key);
}
</script>

<template>
  <div class="cumquat-transfer">
    <div class="cumquat-transfer__panel">
      <header class="cumquat-transfer__header">{{ titles[0] }}</header>
      <ul class="cumquat-transfer__list">
        <li
          v-for="item in leftItems"
          :key="item.key"
          class="cumquat-transfer__item cumquat-transfer__item--left"
          @click="toRight(item)"
        >
          {{ item.label }}
        </li>
        <li v-if="leftItems.length === 0" class="cumquat-transfer__empty">无数据</li>
      </ul>
    </div>

    <div class="cumquat-transfer__actions">
      <span class="cumquat-transfer__action">
        <svg
          class="cumquat-transfer__action-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="m9 18 6-6-6-6" />
        </svg>
      </span>
      <span class="cumquat-transfer__action">
        <svg
          class="cumquat-transfer__action-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="m15 18-6-6-6-6" />
        </svg>
      </span>
    </div>

    <div class="cumquat-transfer__panel">
      <header class="cumquat-transfer__header">{{ titles[1] }}</header>
      <ul class="cumquat-transfer__list">
        <li
          v-for="item in rightItems"
          :key="item.key"
          class="cumquat-transfer__item cumquat-transfer__item--right"
          @click="toLeft(item)"
        >
          {{ item.label }}
        </li>
        <li v-if="rightItems.length === 0" class="cumquat-transfer__empty">无数据</li>
      </ul>
    </div>
  </div>
</template>
