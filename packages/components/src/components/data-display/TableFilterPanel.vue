<script setup lang="ts">
import type { FetchHandler, Option } from '@cumquat/core';
import { useFetchResource } from '@cumquat/composables';
import { computed } from 'vue';

import CqButton from '../general/Button.vue';

type FilterValue = string | number | boolean | null;

const props = defineProps<{
  /** 候选值：静态数组直接使用；FetchHandler 在展开面板时请求 */
  options: Option[] | FetchHandler<Option>;
  /** 当前已选值 */
  selected: FilterValue[];
}>();

const emit = defineEmits<{
  toggle: [value: FilterValue];
  clear: [];
}>();

const remoteSource = () => (typeof props.options === 'function' ? props.options : undefined);

const { enabled, state, loading, error, refresh } = useFetchResource<Option[]>(remoteSource, {
  getQuery: () => ({}),
  initialData: [],
});

/** 远程候选值优先，静态数组直接使用 */
const candidates = computed<Option[]>(() => {
  if (enabled.value) return state.value?.data ?? [];
  return Array.isArray(props.options) ? props.options : [];
});
</script>

<template>
  <ul class="cumquat-table__filter-panel" @click.stop>
    <li v-if="loading && candidates.length === 0" class="cumquat-table__filter-state">加载中…</li>
    <li v-else-if="error" class="cumquat-table__filter-state">
      <CqButton size="sm" type="ghost" @click="refresh()">加载失败，重试</CqButton>
    </li>
    <template v-else>
      <li v-for="option in candidates" :key="String(option.value)">
        <label>
          <input
            type="checkbox"
            :checked="selected.includes(option.value)"
            @change="emit('toggle', option.value)"
          />
          {{ option.label }}
        </label>
      </li>
      <li v-if="selected.length > 0">
        <button type="button" class="cumquat-table__filter-clear" @click.stop="emit('clear')">
          清空
        </button>
      </li>
    </template>
  </ul>
</template>
