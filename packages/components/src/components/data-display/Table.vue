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
</script>

<template>
  <div class="cumquat-table">
    <table class="cumquat-table__table">
      <thead>
        <tr class="cumquat-table__head-row">
          <th
            v-for="col in columns"
            :key="col.key"
            class="cumquat-table__th"
            :class="`cumquat-table__th--${col.align ?? 'left'}`"
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
          class="cumquat-table__row"
          :class="striped && index % 2 === 1 ? 'cumquat-table__row--striped' : ''"
        >
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
        </tr>
        <tr v-if="rows.length === 0">
          <td :colspan="columns.length" class="cumquat-table__empty">
            <template v-if="loading">
              <span class="cumquat-table__loading" />
            </template>
            <template v-else>{{ emptyText }}</template>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
