<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useFetchResource, usePagination, useSubscribe } from '@cumquat/composables';
import type { AsyncStateLike, Fetch, SubscribeHandler } from '@cumquat/composables';
import Pagination from './Pagination.vue';

export interface TableColumn {
  key: string;
  title: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
  /** 该列可排序 */
  sortable?: boolean;
  /** 本地排序比较器；远程排序时仅回发状态 */
  sorter?: (a: Record<string, unknown>, b: Record<string, unknown>) => number;
  /** 筛选项（表头展示勾选面板） */
  filters?: Array<{ label: string; value: string | number }>;
  /** 自定义本地筛选谓词 */
  filterMethod?: (value: string | number, row: Record<string, unknown>) => boolean;
}

type Row = Record<string, unknown>;

const props = withDefaults(
  defineProps<{
    columns: TableColumn[];
    rows?: Row[];
    striped?: boolean;
    loading?: boolean;
    emptyText?: string;
    /** 远程数据状态：传入后 rows/loading 由其派生，组件自身不发请求 */
    data?: AsyncStateLike<Row[]>;
    /**
     * 统一远程请求方法：只绑定方法，组件挂载即请求；
     * 翻页、排序、筛选变化自动以最新参数重取，返回数组或 { list, total }
     */
    fetch?: Fetch<Row>;
    /**
     * 订阅数据：挂载时调用，resolve 出的行数据用于渲染。
     * 优先级：subscribe > fetch > data > rows
     */
    subscribe?: SubscribeHandler<Row[]>;
    /** 远程数据总条数（本地数据默认取 rows 长度） */
    total?: number;
    rowKey?: (row: Row, index: number) => string | number;
    selectable?: boolean;
    expandable?: boolean;
    /** 是否内置分页条 */
    pagination?: boolean;
    pageSize?: number;
    pageSizes?: number[];
    /** 初始排序字段 */
    defaultSort?: { key: string; order: 'asc' | 'desc' };
  }>(),
  {
    rows: () => [],
    striped: false,
    loading: false,
    emptyText: '暂无数据',
    data: undefined,
    fetch: undefined,
    subscribe: undefined,
    total: undefined,
    rowKey: (_row: Row, index: number) => index,
    selectable: false,
    expandable: false,
    pagination: false,
    pageSize: 10,
    pageSizes: () => [10, 20, 50],
    defaultSort: undefined,
  },
);

const emit = defineEmits<{
  'update:selectedKeys': [keys: Array<string | number>];
  /** 五类状态的统一变化事件（外层据此发请求） */
  change: [
    payload: {
      pagination: { currentPage: number; pageSize: number };
      sorter: { key: string; order: 'asc' | 'desc' | null };
      filters: Record<string, Array<string | number>>;
    },
  ];
  rowExpand: [payload: { row: Row; expanded: boolean; key: string | number }];
}>();

/* 远程四态与 fetch 资源钩子在分页初始化后统一建立（fetch 优先于 data） */

/* ---------------- 排序 ---------------- */
const sorterState = ref<{ key: string; order: 'asc' | 'desc' | null }>({
  key: props.defaultSort?.key ?? '',
  order: props.defaultSort?.order ?? null,
});

function toggleSort(column: TableColumn) {
  if (!column.sortable) return;
  const order =
    sorterState.value.key !== column.key
      ? 'asc'
      : sorterState.value.order === 'asc'
        ? 'desc'
        : null;
  sorterState.value = { key: order ? column.key : '', order };
  emitChange();
}

/* ---------------- 筛选（表头小面板） ---------------- */
const filterValues = ref<Record<string, Array<string | number>>>({});
const openFilterKey = ref<string | null>(null);

function toggleFilter(column: TableColumn, value: string | number) {
  const current = filterValues.value[column.key] ?? [];
  const next = current.includes(value)
    ? current.filter((item) => item !== value)
    : [...current, value];
  filterValues.value = { ...filterValues.value, [column.key]: next };
  emitChange();
}

/* ---------------- 本地过滤 + 排序 ---------------- */
const processedRows = computed<Row[]>(() => {
  let list = sourceRows.value;

  if (!isRemote.value) {
    for (const column of props.columns) {
      const picked = filterValues.value[column.key];
      if (picked && picked.length > 0) {
        list = list.filter((row) =>
          picked.some((value) =>
            column.filterMethod
              ? column.filterMethod(value, row)
              : String(row[column.key]) === String(value),
          ),
        );
      }
    }
  }

  if (!isRemote.value && sorterState.value.key && sorterState.value.order) {
    const column = props.columns.find((item) => item.key === sorterState.value.key);
    const sorted = [...list];
    sorted.sort((a, b) => {
      if (column?.sorter) {
        const result = column.sorter(a, b);
        return sorterState.value.order === 'asc' ? result : -result;
      }
      const av = a[sorterState.value.key];
      const bv = b[sorterState.value.key];
      const result = av === bv ? 0 : (av as never) > (bv as never) ? 1 : -1;
      return sorterState.value.order === 'asc' ? result : -result;
    });
    list = sorted;
  }

  return list;
});

/* ---------------- 分页 ---------------- */
const {
  currentPage,
  pageSize,
  go,
  setPageSize,
  total: pTotal,
} = usePagination({
  total: props.total ?? props.data?.data?.length ?? props.rows.length,
  // 初始每页条数走非受控槽位；受控槽位会把快照锁死导致切换失效
  defaultPageSize: props.pageSize,
  pageSizes: props.pageSizes,
});

/* ---------------- fetch 统一请求机制 ---------------- */
const {
  enabled: fetchEnabled,
  state: fetchState,
  total: fetchTotal,
} = useFetchResource<Row[]>(() => props.fetch, {
  getQuery: () => ({
    pagination: { currentPage: currentPage.value, pageSize: pageSize.value },
    sorter:
      sorterState.value.key && sorterState.value.order
        ? { key: sorterState.value.key, order: sorterState.value.order }
        : undefined,
    filters: { ...filterValues.value },
  }),
  initialData: [] as Row[],
});

/* ---------------- 远程四态归一（subscribe 优先，其次 fetch，兼容 data） ---------------- */
const { state: subState } = useSubscribe<Row[]>(() => props.subscribe);

const remoteState = computed<AsyncStateLike<Row[]> | undefined>(() => {
  if (props.subscribe) return subState.value as AsyncStateLike<Row[]>;
  return fetchEnabled.value ? fetchState.value : props.data;
});
const remoteLoading = computed(() => props.loading || remoteState.value?.status === 'pending');
const remoteError = computed(() =>
  remoteState.value?.status === 'error' ? remoteState.value.error : undefined,
);
const remoteStale = computed(() => !!remoteState.value?.isStale);
const sourceRows = computed<Row[]>(() =>
  remoteState.value ? (remoteState.value.data ?? []) : props.rows,
);
const isRemote = computed(() => !!remoteState.value);
const remoteTotal = computed(() =>
  fetchEnabled.value ? fetchTotal.value : (props.total ?? sourceRows.value.length),
);

watch(remoteTotal, (value) => {
  pTotal.value = value;
});

const pageRows = computed<Row[]>(() => {
  if (!props.pagination) return processedRows.value;
  // 远程数据按约定已分页，直接展示
  if (isRemote.value) return processedRows.value;
  const start = (currentPage.value - 1) * pageSize.value;
  return processedRows.value.slice(start, start + pageSize.value);
});

watch(currentPage, () => emitChange());
watch(pageSize, () => emitChange());

function emitChange() {
  emit('change', {
    pagination: { currentPage: currentPage.value, pageSize: pageSize.value },
    sorter: { ...sorterState.value },
    filters: { ...filterValues.value },
  });
}

/* ---------------- 选择（跨页汇总） ---------------- */
const selectedKeys = ref<Array<string | number>>([]);
watch(selectedKeys, (keys) => emit('update:selectedKeys', keys), { deep: true });

const pageKeys = computed(() => pageRows.value.map((row, index) => props.rowKey(row, index)));
const pageAllChecked = computed(
  () =>
    pageKeys.value.length > 0 && pageKeys.value.every((key) => selectedKeys.value.includes(key)),
);
const pageIndeterminate = computed(
  () => !pageAllChecked.value && pageKeys.value.some((key) => selectedKeys.value.includes(key)),
);

function togglePageAll() {
  const set = new Set(selectedKeys.value);
  if (pageAllChecked.value) pageKeys.value.forEach((key) => set.delete(key));
  else pageKeys.value.forEach((key) => set.add(key));
  selectedKeys.value = Array.from(set);
}

function isRowChecked(row: Row, index: number) {
  return selectedKeys.value.includes(props.rowKey(row, index));
}

function toggleRow(row: Row, index: number) {
  const key = props.rowKey(row, index);
  const set = new Set(selectedKeys.value);
  if (set.has(key)) set.delete(key);
  else set.add(key);
  selectedKeys.value = Array.from(set);
}

/* ---------------- 展开行 ---------------- */
const expandedKeys = ref<Array<string | number>>([]);

function isRowExpanded(row: Row, index: number) {
  return expandedKeys.value.includes(props.rowKey(row, index));
}

function toggleExpand(row: Row, index: number) {
  const key = props.rowKey(row, index);
  const expanded = !expandedKeys.value.includes(key);
  expandedKeys.value = expanded
    ? [...expandedKeys.value, key]
    : expandedKeys.value.filter((item) => item !== key);
  emit('rowExpand', { row, expanded, key });
}

function stopFilterPanel(event: MouseEvent) {
  event.stopPropagation();
}

function bodyClick() {
  openFilterKey.value = null;
}
</script>

<template>
  <div class="cumquat-table" :class="remoteStale ? 'cumquat-table--stale' : ''" @click="bodyClick">
    <table class="cumquat-table__table">
      <thead>
        <tr class="cumquat-table__head-row">
          <th
            v-if="selectable"
            class="cumquat-table__th cumquat-table__th--center cumquat-table__selection"
          >
            <input
              type="checkbox"
              class="cumquat-table__checkbox"
              :checked="pageAllChecked"
              :indeterminate="pageIndeterminate"
              @change="togglePageAll"
              @click.stop
            />
          </th>
          <th
            v-for="col in columns"
            :key="col.key"
            class="cumquat-table__th"
            :class="`cumquat-table__th--${col.align ?? 'left'}`"
            :style="col.width ? { width: col.width } : undefined"
          >
            <span class="cumquat-table__th-title">
              {{ col.title }}
              <button
                v-if="col.sortable"
                type="button"
                aria-label="排序"
                class="cumquat-table__sorter"
                :class="[
                  sorterState.key === col.key ? `cumquat-table__sorter--${sorterState.order}` : '',
                ]"
                @click.stop="toggleSort(col)"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="m8 9 4-4 4 4M8 15l4 4 4-4" />
                </svg>
              </button>
              <span v-if="col.filters" class="cumquat-table__filter">
                <button
                  type="button"
                  aria-label="筛选"
                  class="cumquat-table__filter-trigger"
                  :class="
                    (filterValues[col.key]?.length ?? 0) > 0
                      ? 'cumquat-table__filter-trigger--active'
                      : ''
                  "
                  @click.stop="openFilterKey = openFilterKey === col.key ? null : col.key"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M4 5h16l-6 7v6l-4 2v-8L4 5z" />
                  </svg>
                </button>
                <ul
                  v-if="openFilterKey === col.key"
                  class="cumquat-table__filter-panel"
                  @click="stopFilterPanel"
                >
                  <li v-for="option in col.filters" :key="option.value">
                    <label>
                      <input
                        type="checkbox"
                        :checked="(filterValues[col.key] ?? []).includes(option.value)"
                        @change="toggleFilter(col, option.value)"
                      />
                      {{ option.label }}
                    </label>
                  </li>
                </ul>
              </span>
            </span>
          </th>
        </tr>
      </thead>
      <tbody>
        <template v-for="(row, index) in pageRows" :key="props.rowKey(row, index)">
          <tr
            class="cumquat-table__row"
            :class="[
              striped && index % 2 === 1 ? 'cumquat-table__row--striped' : '',
              isRowChecked(row, index) ? 'cumquat-table__row--selected' : '',
            ]"
          >
            <td v-if="selectable" class="cumquat-table__td cumquat-table__td--center">
              <input
                type="checkbox"
                class="cumquat-table__checkbox"
                :checked="isRowChecked(row, index)"
                @change="toggleRow(row, index)"
              />
            </td>
            <td
              v-for="col in columns"
              :key="col.key"
              class="cumquat-table__td"
              :class="`cumquat-table__td--${col.align ?? 'left'}`"
            >
              <slot :name="`cell-${col.key}`" :row="row" :value="row[col.key]">
                {{ row[col.key] }}
              </slot>
            </td>
            <td v-if="expandable" class="cumquat-table__td cumquat-table__expand-cell">
              <button
                type="button"
                aria-label="展开行"
                class="cumquat-table__expander"
                :class="isRowExpanded(row, index) ? 'cumquat-table__expander--open' : ''"
                @click="toggleExpand(row, index)"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </button>
            </td>
          </tr>
          <tr v-if="expandable && isRowExpanded(row, index)" class="cumquat-table__expanded-row">
            <td :colspan="columns.length + 2">
              <slot name="expanded" :row="row" :index="index" />
            </td>
          </tr>
        </template>

        <tr v-if="pageRows.length === 0">
          <td
            :colspan="columns.length + (selectable ? 1 : 0) + (expandable ? 1 : 0)"
            class="cumquat-table__empty"
          >
            <span v-if="remoteLoading" class="cumquat-table__loading cq-state--pending" />
            <button
              v-else-if="remoteError"
              type="button"
              class="cq-state--error cumquat-table__retry"
              @click.stop="remoteState?.retry?.()"
            >
              加载失败，点击重试
            </button>
            <template v-else>{{ emptyText }}</template>
          </td>
        </tr>
      </tbody>
    </table>

    <div v-if="remoteError && pageRows.length > 0" class="cumquat-table__errorbar cq-state--error">
      加载失败
      <button type="button" class="cumquat-table__retry" @click.stop="remoteState?.retry?.()">
        点击重试
      </button>
    </div>

    <div v-if="pagination" class="cumquat-table__footer">
      <Pagination
        :model-value="currentPage"
        :page-size="pageSize"
        :total="pTotal"
        :page-sizes="pageSizes"
        show-size-changer
        @update:model-value="go"
        @update:page-size="setPageSize"
      />
    </div>
  </div>
</template>
