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
  <div class="cumquat-transfer flex items-center gap-3">
    <div
      class="cumquat-transfer__panel flex w-56 flex-col rounded-cumquat border border-cumquat-border bg-cumquat-surface"
    >
      <header
        class="cumquat-transfer__header border-b border-cumquat-border px-3 py-2.5 text-sm font-medium text-cumquat-text"
      >
        {{ titles[0] }}
      </header>
      <ul class="cumquat-transfer__list max-h-56 overflow-y-auto p-1.5">
        <li
          v-for="item in leftItems"
          :key="item.key"
          class="cumquat-transfer__item cursor-pointer rounded px-2.5 py-1.5 text-sm text-cumquat-text transition-colors hover:bg-cumquat-accent-soft"
          @click="toRight(item)"
        >
          {{ item.label }}
        </li>
        <li
          v-if="leftItems.length === 0"
          class="px-2.5 py-6 text-center text-xs text-cumquat-text-muted"
        >
          无数据
        </li>
      </ul>
    </div>

    <div class="cumquat-transfer__actions flex flex-col gap-2">
      <span
        class="flex size-8 items-center justify-center rounded-full bg-cumquat-surface-3 text-cumquat-text-muted"
      >
        <svg
          class="size-4"
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
      <span
        class="flex size-8 items-center justify-center rounded-full bg-cumquat-surface-3 text-cumquat-text-muted"
      >
        <svg
          class="size-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="m15 18-6-6 6-6" />
        </svg>
      </span>
    </div>

    <div
      class="cumquat-transfer__panel flex w-56 flex-col rounded-cumquat border border-cumquat-border bg-cumquat-surface"
    >
      <header
        class="cumquat-transfer__header border-b border-cumquat-border px-3 py-2.5 text-sm font-medium text-cumquat-text"
      >
        {{ titles[1] }}
      </header>
      <ul class="cumquat-transfer__list max-h-56 overflow-y-auto p-1.5">
        <li
          v-for="item in rightItems"
          :key="item.key"
          class="cumquat-transfer__item cursor-pointer rounded px-2.5 py-1.5 text-sm text-cumquat-accent transition-colors hover:bg-cumquat-danger-soft hover:text-cumquat-danger"
          @click="toLeft(item)"
        >
          {{ item.label }}
        </li>
        <li
          v-if="rightItems.length === 0"
          class="px-2.5 py-6 text-center text-xs text-cumquat-text-muted"
        >
          无数据
        </li>
      </ul>
    </div>
  </div>
</template>
