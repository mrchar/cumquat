---
title: Pagination 分页
---

# Pagination 分页

页码导航，与表格 / 列表联动。

| Prop            | 类型       | 默认值              | 说明                 |
| --------------- | ---------- | ------------------- | -------------------- |
| total           | `number`   | -                   | 总条数（必填）       |
| pageSize        | `number`   | `10`                | 每页条数             |
| modelValue      | `number`   | -                   | 当前页（v-model）    |
| pageSizes       | `number[]` | `[10, 20, 50, 100]` | 每页条数选项         |
| showSizeChanger | `boolean`  | `false`             | 显示每页条数选择器   |
| showJumper      | `boolean`  | `false`             | 显示跳页输入框       |
| boundaryCount   | `number`   | `1`                 | 首尾边界页码数       |
| siblingCount    | `number`   | `1`                 | 当前页两侧兄弟页码数 |

| 事件              | 参数                                        | 说明                 |
| ----------------- | ------------------------------------------- | -------------------- |
| update:modelValue | `page: number`                              | 页码更新             |
| update:pageSize   | `size: number`                              | 页大小更新           |
| change            | `{ currentPage: number, pageSize: number }` | 页码或页大小统一变化 |

```vue
<Pagination v-model="page" :total="128" show-size-changer show-jumper @change="load" />
```

## 交互演示

### 基础分页

<CodeCard v-model:code="paginationCode" editable title="基础分页">
  <LiveDemo :code="paginationCode" :scope="demoScope" />
</CodeCard>

<script setup lang="ts">

import { ref } from 'vue';

const page = ref(1);

const paginationCode = ref(`
  <div class="flex flex-wrap items-center gap-3">
    <Pagination v-model="page" :total="50" :page-size="10" />
    <span class="text-sm text-cumquat-text-muted">当前第 {{ page }} 页</span>
  </div>
`);

/** LiveDemo 渲染作用域 */
const demoScope = { page, paginationCode };
</script>

