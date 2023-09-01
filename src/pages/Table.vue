<template>
  <Table :columns="columns" :data="data"></Table>
</template>

<script lang="ts" setup>
import Table from "../components/Table/Table.vue";

const columns = [
  { label: "标题1", prop: "prop1" },
  { label: "标题2", prop: "prop2" },
];

const data = [
  { prop1: "value1", prop2: "value2" },
  { prop1: "value1", prop2: "value2" },
];
</script>
