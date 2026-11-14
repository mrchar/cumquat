---
title: VirtualList 虚拟列表
---

# VirtualList 虚拟列表

超长列表的虚拟滚动，支持动态行高；绑定 `fetch` 后自动触底分页累积。

| Prop          | 类型                                      | 默认值 | 说明                                                                               |
| ------------- | ----------------------------------------- | ------ | ---------------------------------------------------------------------------------- |
| items         | `T[]`                                     | `[]`   | 列表数据（绑定 fetch 时可省略）                                                    |
| fetch         | [`FetchHandler`](/types/basics/core#fetchhandler)`<T>`                                | -      | 远程列表：自动注入 `pagination`（每页 20），触底加载下一页并累积，内置哨兵态与重试 |
| height        | `number`                                  | `240`  | 容器高度（px）                                                                     |
| itemHeight    | `number`                                  | `40`   | 单项高度（px）                                                                     |
| buffer        | `number`                                  | `2`    | 上下缓冲行数                                                                       |
| dynamicHeight | `(item: string, index: number) => number` | -      | 动态行高（按索引返回高度）                                                         |

```vue
<VirtualList :items="thousandRows" :height="320" :item-height="36" />
<VirtualList :items="rows" :dynamic-height="(row) => (row.length > 40 ? 64 : 36)" />
```

## 补充：订阅数据与 Expose

| Prop | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| subscribe | [`SubscribeHandler`](/types/basics/core#subscribehandler)`<string[]>` | `undefined` | 订阅列表数据；优先于 `fetch` / `items` |

| Expose | 类型 | 说明 |
| --- | --- | --- |
| scrollToIndex | `(index: number) => void` | 滚动到指定索引；索引会按当前数据长度钳制 |

优先级：`subscribe > fetch > items`。通过模板 ref 调用：`listRef.value?.scrollToIndex(120)`。

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

import type { FetchHandler, ResolvedFetchQuery, Status } from '@mrchar/cumquat';

/** 演示用：把 execute 函数体包装为符合协议的 FetchHandler 资源工厂 */
function makeFetch<T>(run: (query: ResolvedFetchQuery) => T | Promise<T>): FetchHandler<T> {
  return () => {
    const status = ref<Status>('idle');
    const data = ref<T>();
    const error = ref<unknown>();
    const message = ref<string>();
    return {
      status,
      data,
      error,
      message,
      async execute(query: ResolvedFetchQuery) {
        status.value = 'pending';
        try {
          data.value = await run(query);
          status.value = 'success';
        } catch (err) {
          error.value = err;
          message.value = err instanceof Error ? err.message : String(err);
          status.value = 'error';
        }
      },
      abort() {},
    };
  };
}

const virtualItems = Array.from({ length: 50 }, (_, index) => `虚拟列表条目 ${index + 1}`);

const virtualListCode = ref(`
  <VirtualList :items="virtualItems" class="max-w-sm" />
`);

/* 远程虚拟列表：触底自动请求下一页（每页 20 条）并累积，共 87 条 */
const fetchVirtualItems = makeFetch<string>(async (query) => {
  await new Promise((resolve) => setTimeout(resolve, 400));
  const page = query.page ?? 1;
  const size = query.size ?? 20;
  const total = 87;
  const list = Array.from(
    { length: Math.min(size, total - (page - 1) * size) },
    (_, index) => `远程条目 ${(page - 1) * size + index + 1}`,
  );
  return { list, page, size, total };
});

const remoteVirtualListCode = ref(`
  <VirtualList :fetch="fetchVirtualItems" class="max-w-sm" />
`);

/** LiveDemo 渲染作用域 */
const demoScope = { virtualItems, virtualListCode, fetchVirtualItems, remoteVirtualListCode };
</script>
