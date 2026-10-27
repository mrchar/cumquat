<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { Ref } from 'vue';
import { useActionValue, useFetchResource } from '@cumquat/composables';
import type { ActionLike, Fetch } from '@cumquat/composables';
import CqButton from '../basic/Button.vue';

export interface TransferItem {
  key: string;
  label: string;
  disabled?: boolean;
}

const props = withDefaults(
  defineProps<{
    data?: TransferItem[];
    modelValue?: string[];
    titles?: [string, string];
    /** 两侧搜索过滤 */
    searchable?: boolean;
    /**
     * 统一远程请求：挂载即请求，左侧搜索词自动防抖重取，
     * 返回候选项数组或 { list, total }
     */
    fetch?: Fetch<TransferItem>;
    /** 穿梭动作：新值先乐观应用，动作失败自动回退旧值；执行期间禁用搬移 */
    action?: ActionLike;
  }>(),
  {
    data: () => [],
    modelValue: undefined,
    titles: () => ['源列表', '目标列表'],
    searchable: false,
    fetch: undefined,
    action: undefined,
  },
);

const emit = defineEmits<{
  'update:modelValue': [keys: string[]];
  change: [keys: string[], direction: 'left' | 'right'];
  /** 穿梭动作失败（reject 或返回值导出错误）时触发，值已回退 */
  actionError: [error: unknown];
}>();

/* ---------------- action 穿梭动作：乐观应用，失败回退 ---------------- */
const { pending: actionPending, error: actionError, commit: commitAction } = useActionValue();

/** 右栏（已选）key 列表；受控 prop 不回写时内部保留最近提交值 */
const selectedKeys = ref<string[]>(props.modelValue ?? []);
watch(
  () => props.modelValue,
  (next) => {
    if (next !== undefined) selectedKeys.value = next;
  },
);

/* ---------- 搜索 ---------- */
const leftKeyword = ref('');
const rightKeyword = ref('');

/* ---------- fetch：左侧候选挂载即拉，搜索词防抖重取 ---------- */
const { enabled: fetchEnabled, state: fetchState } = useFetchResource<TransferItem[]>(
  () => props.fetch,
  {
    getQuery: () => ({ keyword: leftKeyword.value }),
    initialData: [] as TransferItem[],
    debounce: 300,
  },
);

/** 远程候选即源数据；已选项仍由 modelValue 在其中筛出 */
const sourceItems = computed<TransferItem[]>(() =>
  fetchEnabled.value ? (fetchState.value?.data ?? []) : props.data,
);
const remoteLoading = computed(() => fetchState.value?.status === 'pending');
const remoteError = computed(() =>
  fetchState.value?.status === 'error' ? fetchState.value.error : undefined,
);

function filterItems(items: TransferItem[], keyword: string) {
  const word = keyword.trim();
  if (!word) return items;
  return items.filter((item) => item.label.includes(word));
}

const leftItems = computed(() =>
  sourceItems.value.filter((item) => !selectedKeys.value.includes(item.key)),
);
const rightItems = computed(() =>
  sourceItems.value.filter((item) => selectedKeys.value.includes(item.key)),
);

// 远程模式下服务端已按关键词过滤，左侧不再本地过滤
const visibleLeft = computed(() =>
  fetchEnabled.value ? leftItems.value : filterItems(leftItems.value, leftKeyword.value),
);
const visibleRight = computed(() => filterItems(rightItems.value, rightKeyword.value));

/* ---------- 勾选汇总 ---------- */
const leftChecked = ref<Set<string>>(new Set());
const rightChecked = ref<Set<string>>(new Set());

function toggleChecked(set: Ref<Set<string>>, item: TransferItem) {
  if (item.disabled) return;
  const next = new Set(set.value);
  if (next.has(item.key)) next.delete(item.key);
  else next.add(item.key);
  set.value = next;
}

function allChecked(items: TransferItem[], set: Set<string>) {
  const enabled = items.filter((item) => !item.disabled);
  return enabled.length > 0 && enabled.every((item) => set.has(item.key));
}

function someChecked(items: TransferItem[], set: Set<string>) {
  return items.some((item) => !item.disabled && set.has(item.key));
}

const leftAllChecked = computed(() => allChecked(visibleLeft.value, leftChecked.value));
const leftIndeterminate = computed(
  () => !leftAllChecked.value && someChecked(visibleLeft.value, leftChecked.value),
);
const rightAllChecked = computed(() => allChecked(visibleRight.value, rightChecked.value));
const rightIndeterminate = computed(
  () => !rightAllChecked.value && someChecked(visibleRight.value, rightChecked.value),
);

function toggleAll(items: TransferItem[], set: Ref<Set<string>>) {
  const next = new Set(set.value);
  if (allChecked(items, next)) {
    items.forEach((item) => next.delete(item.key));
  } else {
    items.forEach((item) => {
      if (!item.disabled) next.add(item.key);
    });
  }
  set.value = next;
}

/* ---------- 搬移 ---------- */
function commit(keys: string[], direction: 'left' | 'right') {
  const previous = selectedKeys.value;
  selectedKeys.value = keys;
  emit('update:modelValue', keys);
  emit('change', keys, direction);
  if (!props.action) return;
  void commitAction({
    execute: () => props.action?.(keys),
    revert: () => {
      selectedKeys.value = previous;
      emit('update:modelValue', previous);
      emit('change', previous, direction);
    },
  }).then((ok) => {
    if (!ok && actionError.value != null) emit('actionError', actionError.value);
  });
}

function toRight(item: TransferItem) {
  if (item.disabled || actionPending.value || selectedKeys.value.includes(item.key)) return;
  commit([...selectedKeys.value, item.key], 'right');
}

function toLeft(item: TransferItem) {
  if (item.disabled || actionPending.value) return;
  commit(
    selectedKeys.value.filter((key) => key !== item.key),
    'left',
  );
}

function moveCheckedRight() {
  if (actionPending.value) return;
  const additions = leftItems.value
    .filter((item) => leftChecked.value.has(item.key))
    .map((item) => item.key);
  if (additions.length === 0) return;
  commit([...selectedKeys.value, ...additions], 'right');
  leftChecked.value = new Set();
}

function moveCheckedLeft() {
  if (actionPending.value || rightChecked.value.size === 0) return;
  commit(
    selectedKeys.value.filter((key) => !rightChecked.value.has(key)),
    'left',
  );
  rightChecked.value = new Set();
}
</script>

<template>
  <div class="cumquat-transfer">
    <div class="cumquat-transfer__panel">
      <header class="cumquat-transfer__header">
        <label class="cumquat-transfer__check-all">
          <input
            type="checkbox"
            :checked="leftAllChecked"
            :indeterminate="leftIndeterminate"
            @change="toggleAll(visibleLeft, leftChecked)"
          />
          <span>{{ titles[0] }}（{{ leftItems.length }}）</span>
        </label>
      </header>
      <input
        v-if="searchable || fetch"
        v-model="leftKeyword"
        type="text"
        class="cumquat-transfer__search"
        placeholder="搜索"
      />
      <ul class="cumquat-transfer__list">
        <li
          v-for="item in visibleLeft"
          :key="item.key"
          class="cumquat-transfer__item cumquat-transfer__item--left"
          :class="item.disabled ? 'cumquat-transfer__item--disabled' : ''"
          @click="toRight(item)"
        >
          <input
            type="checkbox"
            class="cumquat-transfer__checkbox"
            :checked="leftChecked.has(item.key)"
            :disabled="item.disabled"
            @click.stop
            @change="toggleChecked(leftChecked, item)"
          />
          {{ item.label }}
        </li>
        <li
          v-if="remoteLoading && visibleLeft.length === 0"
          class="cumquat-transfer__state cq-state--pending"
        >
          加载中…
        </li>
        <li
          v-else-if="remoteError && visibleLeft.length === 0"
          class="cumquat-transfer__state cq-state--error"
        >
          加载失败
          <CqButton size="sm" type="ghost" class="cumquat-transfer__retry" @click.stop="fetchState?.retry?.()">
            重试
          </CqButton>
        </li>
        <li v-else-if="visibleLeft.length === 0" class="cumquat-transfer__empty">无数据</li>
      </ul>
    </div>

    <div class="cumquat-transfer__actions">
      <button
        type="button"
        class="cumquat-transfer__action"
        :disabled="leftChecked.size === 0 || actionPending"
        aria-label="移到右侧"
        @click="moveCheckedRight"
      >
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
      </button>
      <button
        type="button"
        class="cumquat-transfer__action"
        :disabled="rightChecked.size === 0 || actionPending"
        aria-label="移到左侧"
        @click="moveCheckedLeft"
      >
        <svg
          class="cumquat-transfer__action-icon"
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
    </div>

    <div class="cumquat-transfer__panel">
      <header class="cumquat-transfer__header">
        <label class="cumquat-transfer__check-all">
          <input
            type="checkbox"
            :checked="rightAllChecked"
            :indeterminate="rightIndeterminate"
            @change="toggleAll(visibleRight, rightChecked)"
          />
          <span>{{ titles[1] }}（{{ rightItems.length }}）</span>
        </label>
      </header>
      <input
        v-if="searchable"
        v-model="rightKeyword"
        type="text"
        class="cumquat-transfer__search"
        placeholder="搜索"
      />
      <ul class="cumquat-transfer__list">
        <li
          v-for="item in visibleRight"
          :key="item.key"
          class="cumquat-transfer__item cumquat-transfer__item--right"
          :class="item.disabled ? 'cumquat-transfer__item--disabled' : ''"
          @click="toLeft(item)"
        >
          <input
            type="checkbox"
            class="cumquat-transfer__checkbox"
            :checked="rightChecked.has(item.key)"
            :disabled="item.disabled"
            @click.stop
            @change="toggleChecked(rightChecked, item)"
          />
          {{ item.label }}
        </li>
        <li v-if="visibleRight.length === 0" class="cumquat-transfer__empty">无数据</li>
      </ul>
    </div>
  </div>
</template>
