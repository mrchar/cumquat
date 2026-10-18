---
title: 数据订阅 useSubscribe
---

# 数据订阅

subscribe 协议的宿主侧组合函数。协议语义与组件接入见[数据订阅](/subscribe)。

## useSubscribe

包装订阅处理方法，挂载时自动调用一次，导出四态与重试。

```ts
function useSubscribe<T>(handler: SubscribeHandler<T>): UseSubscribeReturn<T>;
```

```ts
import { reactive } from 'vue';
import { useSubscribe } from '@cumquat/composables';

const { data, loading, error, refresh } = useSubscribe(async () => {
  const list = reactive<Row[]>([]);
  const ws = new WebSocket('wss://example.com/orders');
  ws.onmessage = (e) => list.push(JSON.parse(e.data)); // 推送即更新
  return { data: list };
});
```

| 返回成员 | 说明 |
| --- | --- |
| `state` | `Ref<AsyncStateLike<T>>` |
| `data` / `loading` / `error` / `isStale` | 状态便捷访问 |
| `refresh` | 重新执行订阅处理方法 |

- 处理方法 `reject`，或 resolve 出 `status: 'error'` / 携带 `error`，视为失败：保留旧数据并展示错误
- 初始调用经 `queueMicrotask` 延迟（与 fetch 一致），可在 effectScope 中正常工作
- 返回的 `data` 为响应式对象时，后续修改持续更新视图——这是订阅与请求的本质差异

## useAsyncState

更通用的底层原语：把任意异步方法包装为 `AsyncStateLike`，提供执行与重试。

```ts
const { state, data, status, error, execute, reload } = useAsyncState(
  () => fetchDetail(id),
  undefined, // initialData
);

execute(); // 手动触发；state.status 随 Promise 流转
```

`useFetch` / `useSubscribe` 内部均基于它编排状态；需要自定义触发时机（点击按钮才加载、依赖多个参数）时直接使用它。
