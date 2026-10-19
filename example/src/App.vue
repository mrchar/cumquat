<script setup lang="ts">
// 三个子路径入口逐一验证
import { composables } from '@mrchar/cumquat';
import { Button } from '@mrchar/cumquat/components';
import { message } from '@mrchar/cumquat/composables';

const columns = [
  { key: 'name', title: '姓名' },
  { key: 'email', title: '邮箱', format: 'email' },
  { key: 'createdAt', title: '创建时间', type: 'date' },
];

const rows = [
  { name: '林一', email: 'linyi@example.com', createdAt: '2026-10-01' },
  { name: '陈默', email: 'chenmo@example.com', createdAt: '2026-10-12' },
  { name: '苏晚', email: 'suwan@example.com', createdAt: '2026-10-19' },
];

const viaNamespace = () => composables.message.success('经命名空间入口触发 Message');
const viaSubpath = () => message.info('经 composables 子路径触发 Message');
</script>

<template>
  <main style="max-width: 720px; margin: 40px auto; padding: 0 16px">
    <h1>@mrchar/cumquat 消费验证</h1>

    <section style="display: flex; gap: 12px; margin: 24px 0">
      <!-- C 前缀标签：验证 Cumquat 安装器 -->
      <c-button type="primary" @click="viaNamespace">C 前缀注册组件</c-button>
      <!-- 直接导入：验证 ./components 子路径 -->
      <Button type="secondary" @click="viaSubpath">子路径直接导入</Button>
    </section>

    <!-- 静态数据表格：验证渲染与邮箱/日期单元格竞选 -->
    <c-table :columns="columns" :rows="rows" />

    <!-- 命令式消息的渲染容器：根部挂载一次 -->
    <c-message-container />
  </main>
</template>
