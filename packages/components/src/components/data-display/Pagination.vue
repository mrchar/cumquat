<script setup lang="ts">
import { ref, watch } from 'vue';
import { usePagination } from '@cumquat/composables';
import type { PaginationPageItem } from '@cumquat/composables';

const props = withDefaults(
  defineProps<{
    total: number;
    pageSize?: number;
    modelValue?: number;
    pageSizes?: number[];
    /** 显示每页条数选择器 */
    showSizeChanger?: boolean;
    /** 显示跳页输入框 */
    showJumper?: boolean;
    boundaryCount?: number;
    siblingCount?: number;
  }>(),
  {
    pageSize: 10,
    modelValue: undefined,
    pageSizes: () => [10, 20, 50, 100],
    showSizeChanger: false,
    showJumper: false,
    boundaryCount: 1,
    siblingCount: 1,
  },
);

const emit = defineEmits<{
  'update:modelValue': [page: number];
  'update:pageSize': [size: number];
  /** 页码或页大小统一变化事件 */
  change: [payload: { currentPage: number; pageSize: number }];
}>();

const {
  total,
  currentPage,
  pageSize,
  totalPages,
  pages,
  canPrev,
  canNext,
  rangeStart,
  rangeEnd,
  go,
  prev,
  next,
  setPageSize,
} = usePagination({
  total: props.total,
  currentPage: props.modelValue,
  pageSize: props.pageSize,
  pageSizes: props.pageSizes,
  boundaryCount: props.boundaryCount,
  siblingCount: props.siblingCount,
  onChange: (payload) => emit('change', payload),
  onPageChange: (page) => emit('update:modelValue', page),
  onPageSizeChange: (size) => emit('update:pageSize', size),
});

// 外部 total / pageSize prop 变化时同步到模型
watch(
  () => props.total,
  (value) => {
    total.value = value;
  },
);
watch(
  () => props.pageSize,
  (value) => {
    if (value !== undefined && value !== pageSize.value) pageSize.value = value;
  },
);

const jumpValue = ref('');

function isEllipsis(item: PaginationPageItem): boolean {
  return item === 'start-ellipsis' || item === 'end-ellipsis';
}

function onSizeChange(event: Event) {
  setPageSize(Number((event.target as HTMLSelectElement).value));
}

function onJump(event: KeyboardEvent) {
  if (event.key !== 'Enter') return;
  const target = Number.parseInt(jumpValue.value, 10);
  if (!Number.isNaN(target)) go(target);
  jumpValue.value = '';
}
</script>

<template>
  <nav class="cumquat-pagination" aria-label="分页">
    <span class="cumquat-pagination__total">
      共 {{ total }} 条，第 {{ rangeStart }}-{{ rangeEnd }} 条
    </span>

    <button
      type="button"
      class="cumquat-pagination__prev"
      :disabled="!canPrev"
      aria-label="上一页"
      @click="prev"
    >
      <svg
        class="cumquat-pagination__icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="m15 18-6-6 6-6" />
      </svg>
    </button>

    <template v-for="(item, index) in pages" :key="`${item}-${index}`">
      <span v-if="isEllipsis(item)" class="cumquat-pagination__ellipsis">…</span>
      <button
        v-else
        type="button"
        class="cumquat-pagination__page"
        :class="item === currentPage ? 'cumquat-pagination__page--active' : ''"
        :aria-current="item === currentPage ? 'page' : undefined"
        @click="go(item)"
      >
        {{ item }}
      </button>
    </template>

    <button
      type="button"
      class="cumquat-pagination__next"
      :disabled="!canNext"
      aria-label="下一页"
      @click="next"
    >
      <svg
        class="cumquat-pagination__icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="m9 18 6-6-6-6" />
      </svg>
    </button>

    <label v-if="showSizeChanger" class="cumquat-pagination__sizes">
      <select :value="pageSize" class="cumquat-pagination__select" @change="onSizeChange">
        <option v-for="size in pageSizes" :key="size" :value="size">{{ size }} 条/页</option>
      </select>
    </label>

    <label v-if="showJumper" class="cumquat-pagination__jumper">
      跳至
      <input
        v-model="jumpValue"
        type="number"
        min="1"
        :max="totalPages"
        class="cumquat-pagination__input"
        @keydown="onJump"
      />
      页
    </label>
  </nav>
</template>
