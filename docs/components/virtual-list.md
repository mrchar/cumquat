---
title: VirtualList 虚拟列表
---

# VirtualList 虚拟列表

超长列表的虚拟滚动，支持动态行高；绑定 `fetch` 后自动触底分页累积。

| Prop          | 类型                                      | 默认值 | 说明                                                                               |
| ------------- | ----------------------------------------- | ------ | ---------------------------------------------------------------------------------- |
| items         | `T[]`                                     | `[]`   | 列表数据（绑定 fetch 时可省略）                                                    |
| fetch         | `Fetch<T>`                                | -      | 远程列表：自动注入 `pagination`（每页 20），触底加载下一页并累积，内置哨兵态与重试 |
| height        | `number`                                  | `240`  | 容器高度（px）                                                                     |
| itemHeight    | `number`                                  | `40`   | 单项高度（px）                                                                     |
| buffer        | `number`                                  | `2`    | 上下缓冲行数                                                                       |
| dynamicHeight | `(item: string, index: number) => number` | -      | 动态行高（按索引返回高度）                                                         |

```vue
<VirtualList :items="thousandRows" :height="320" :item-height="36" />
<VirtualList :items="rows" :dynamic-height="(row) => (row.length > 40 ? 64 : 36)" />
```

## 交互演示

### 虚拟滚动

<CodeCard v-model:code="virtualListCode" editable title="虚拟滚动">
  <LiveDemo :code="virtualListCode" :scope="demoScope" />
</CodeCard>

### 远程触底分页（fetch）

<CodeCard v-model:code="remoteVirtualListCode" editable title="远程触底分页（fetch）">
  <LiveDemo :code="remoteVirtualListCode" :scope="demoScope" />
</CodeCard>

<script setup lang="ts">

import { ref } from 'vue';

import type { Fetch, FetchQuery } from '@cumquat/components';

const virtualItems = Array.from({ length: 50 }, (_, index) => `虚拟列表条目 ${index + 1}`);

const virtualListCode = ref(`
  <VirtualList :items="virtualItems" class="max-w-sm" />
`);

/* 远程虚拟列表：触底自动请求下一页（每页 20 条）并累积，共 87 条 */
const fetchVirtualItems: Fetch<string> = async (query: FetchQuery) => {
  await new Promise((resolve) => setTimeout(resolve, 400));
  const currentPage = query.pagination?.currentPage ?? 1;
  const pageSize = query.pagination?.pageSize ?? 20;
  const total = 87;
  const list = Array.from(
    { length: Math.min(pageSize, total - (currentPage - 1) * pageSize) },
    (_, index) => `远程条目 ${(currentPage - 1) * pageSize + index + 1}`,
  );
  return { list, total };
};

const remoteVirtualListCode = ref(`
  <VirtualList :fetch="fetchVirtualItems" class="max-w-sm" />
`);

/** LiveDemo 渲染作用域 */
const demoScope = { virtualItems, virtualListCode, fetchVirtualItems, remoteVirtualListCode };
</script>
