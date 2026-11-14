---
title: 数据订阅
---

# 数据订阅

subscribe 协议的宿主侧组合函数。协议语义与组件接入见[状态自持](/state)。

## 手写订阅方法

`SubscribeHandler<T>` 就是一个返回 `SubscribeResult<T>` 的函数，直接手写即可：

```ts
import type { SubscribeHandler } from '@mrchar/cumquat';

const subscribeOnline: SubscribeHandler<number> = () => ({
  status: 'success',
  data: store.onlineCount,
});
```

- 无可用数据时返回 `{ status: 'pending' }`，组件据此保持加载态
- 失败可 `reject`，或返回 `{ status: 'error', error, message }`；组件保留旧数据并展示错误
- `data` 支持 ref / getter / 响应式对象：返回响应式对象时，后续修改会持续更新视图——这是订阅与请求的本质差异

```ts
import { reactive } from 'vue';

const subscribeOrders: SubscribeHandler<Row[]> = () => {
  const list = reactive<Row[]>([]);
  const ws = new WebSocket('wss://example.com/orders');
  ws.onmessage = (e) => list.push(JSON.parse(e.data)); // 推送即更新
  return { status: 'success', data: list };
};
```

```vue
<Statistic :subscribe="subscribeOnline" />
```

## useSubscribeResource

组件内部的订阅机制：挂载时调用一次处理方法，resolve 出数据后渲染，失败时记录错误并保留旧数据（与 fetch 失败策略一致），支持重试。供组件作者使用，宿主侧无需接触。

```ts
const { state, data, loading, error, isStale, refresh } = useSubscribeResource<Row[]>(
  () => props.subscribe, // getter 形式，每次执行读取最新处理方法
);
```

- 处理方法 `reject`，或 resolve 出 `status: 'error'` / 携带 `error`，视为失败：保留旧数据并展示错误
- 初始调用经 `queueMicrotask` 延迟（与 fetch 一致），可在 effectScope 中正常工作
- 返回的 `data` 为响应式对象时，后续修改持续更新视图——这是订阅与请求的本质差异

## useAsyncState

更通用的底层原语：把任意异步方法包装为 [`Snapshot`](/types/basics/common#snapshot)，提供执行与重试。不绑定组件、但需要在页面里维护异步状态时使用它。

```ts
const { state, run, retry, loading, error } = useAsyncState(
  () => fetchDetail(id),
  { initialData: undefined },
);

run(); // 手动触发；state.status 随 Promise 流转，retry 以最近参数重试
```

需要自定义触发时机（点击按钮才加载、依赖多个参数）时直接使用它；资源钩子与它共享同一套四态词汇。
