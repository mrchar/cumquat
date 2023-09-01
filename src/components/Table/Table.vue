<template>
  <table>
    <thead>
      <tr>
        <th v-for="item in props.columns" :key="item.prop">{{ item.label }}</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="item in props.data" class="border-t">
        <td v-for="{ prop } in props.columns">
          {{ item[prop] }}
        </td>
      </tr>
    </tbody>
  </table>
</template>

<script lang="ts" setup>
interface TableProps {
  columns?: ColumnDefination;
  data?: TableData;
}
interface ColumnDefination {
  label: string;
  prop: string;
}

interface TableData {
  [string]: unknown;
}

const props = defineProps<TableProps>();
</script>
