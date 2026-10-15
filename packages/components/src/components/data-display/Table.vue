<script setup lang="ts">
export interface TableColumn {
  key: string;
  title: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

withDefaults(
  defineProps<{
    columns: TableColumn[];
    rows: Record<string, unknown>[];
    striped?: boolean;
    loading?: boolean;
    emptyText?: string;
  }>(),
  { striped: false, loading: false, emptyText: '暂无数据' },
);

const alignClass: Record<string, string> = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
};
</script>

<template>
  <div class="cumquat-table w-full overflow-x-auto rounded-cumquat border border-cumquat-border">
    <table class="w-full border-collapse bg-cumquat-surface text-sm">
      <thead>
        <tr class="cumquat-table__head-row bg-cumquat-surface-2">
          <th
            v-for="col in columns"
            :key="col.key"
            class="cumquat-table__th border-b border-cumquat-border px-4 py-3 font-medium text-cumquat-text-muted"
            :class="alignClass[col.align ?? 'left']"
            :style="col.width ? { width: col.width } : undefined"
          >
            {{ col.title }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(row, index) in rows"
          :key="index"
          class="cumquat-table__row transition-colors hover:bg-cumquat-surface-2"
          :class="striped && index % 2 === 1 ? 'bg-cumquat-surface-2/60' : ''"
        >
          <td
            v-for="col in columns"
            :key="col.key"
            class="cumquat-table__td border-b border-cumquat-border px-4 py-3 text-cumquat-text"
            :class="alignClass[col.align ?? 'left']"
          >
            <slot :name="`cell-${col.key}`" :row="row" :value="row[col.key]">
              {{ row[col.key] }}
            </slot>
          </td>
        </tr>
        <tr v-if="rows.length === 0">
          <td
            :colspan="columns.length"
            class="cumquat-table__empty px-4 py-10 text-center text-cumquat-text-muted"
          >
            <template v-if="loading">
              <span
                class="inline-block size-5 animate-spin rounded-full border-2 border-cumquat-border border-t-cumquat-accent"
              />
            </template>
            <template v-else>{{ emptyText }}</template>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
