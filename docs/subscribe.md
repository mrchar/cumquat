---
title: 数据订阅 Subscribe
---

# 数据订阅 Subscribe

统一订阅协议：为所有有数据展示功能的组件提供 `subscribe` 属性，绑定一个返回 Promise 的处理方法。方法在组件挂载时调用，返回值导出状态、数据与错误，组件据此控制加载态、数据渲染与错误提示。

## 协议

```ts
/** 订阅结果：返回值可导出状态、数据与错误 */
export interface SubscribeResult<T> {
  status?: 'loading' | 'success' | 'error'; // 缺省视为 success
  data?: T; // 订阅到的数据
  error?: unknown; // 失败信息
  message?: string; // 提示文案，覆盖默认错误文案
}

export type SubscribeHandler<T> = () => Promise<SubscribeResult<T>> | SubscribeResult<T>;
```

**失败判定**：处理方法 `reject`，或 resolve 出 `status: 'error'` / 携带 `error` 字段，均视为失败；`status: 'loading'` 保持加载态；其余视为成功并渲染 `data`。

**失败策略**：订阅失败时组件保留旧数据（若有），展示错误提示条，支持 `refresh` 重试，与 fetch 失败策略一致。

## 响应式数据：持续更新

处理方法只在挂载时调用一次，但返回的 `data` 若为响应式对象（`reactive` 数组 / 对象），组件渲染时会对它建立依赖——之后订阅源（WebSocket、EventEmitter、定时器）对它的任何修改都会自动更新视图，无需再次调用：

```ts
import { reactive } from 'vue';

const subscribeOrders: SubscribeHandler<Row[]> = async () => {
  const list = reactive<Row[]>([]);
  const ws = new WebSocket('wss://example.com/orders');
  ws.onmessage = (e) => list.push(JSON.parse(e.data)); // 收到推送即更新表格
  return { data: list };
};
```

这是 subscribe 与 fetch 的本质差异：fetch 每次交互产生一次新请求新数据，subscribe 的数据可以在 resolve 之后持续生长。注意在连接生命周期结束时自行关闭订阅源（如配合 `onUnmounted`）。

## 与 fetch 的边界

| 机制        | 语义     | 数据流                                                  | 适用场景                                                        |
| ----------- | -------- | ------------------------------------------------------- | --------------------------------------------------------------- |
| `fetch`     | 主动请求 | 组件构造 query → 拉取 → 渲染                            | 分页 / 搜索 / 排序的查询型数据                                  |
| `subscribe` | 被动订阅 | resolve 数据 → 渲染；数据为响应式对象时推送持续更新视图 | 实时数据、订阅型数据源（WebSocket、EventEmitter、响应式 store） |

两者可同时传入，数据优先级为 **subscribe > fetch > 本地 props**。subscribe 适合持续推送或外部驱动的数据流，fetch 适合组件主动发起的请求。

## 使用示例

### 订阅型数据源：Statistic

`subscribe` 处理方法内部完成订阅（此处用 setTimeout 模拟外部推送），resolve 后渲染数值，失败展示错误条。

<CodeCard v-model:code="statisticCode" editable title="Statistic 订阅实时数据">
  <LiveDemo :code="statisticCode" :scope="statisticScope" />
</CodeCard>

### 订阅推送：Table 实时订单

返回响应式数组后，订阅源的每次推送都会自动更新表格（此处用定时器模拟服务端推送）。

<CodeCard v-model:code="tableCode" editable title="Table 订阅推送">
  <LiveDemo :code="tableCode" :scope="tableScope" />
</CodeCard>

## 数据展示组件清单

| 组件                            | 订阅数据类型     | 加载态   | 失败行为      |
| ------------------------------- | ---------------- | -------- | ------------- |
| Table                           | 行数据数组       | 骨架行   | 错误条 + 重试 |
| VirtualList                     | 列表项数组       | 骨架项   | 错误条 + 重试 |
| Select / AutoComplete / Mention | 选项数组         | 加载中   | 错误提示      |
| Tree / TreeSelect / Cascader    | 节点数据         | 加载中   | 错误提示      |
| Tabs / Collapse / Steps         | 子项数据         | 加载中   | 错误提示      |
| Timeline / Carousel / Menu      | 子项数据         | 加载中   | 错误提示      |
| Calendar                        | 日程标记数据     | 加载中   | 错误提示      |
| Statistic / Descriptions        | 单值 / 项数据    | 骨架     | 错误条 + 重试 |
| Progress                        | 进度数值         | 原渲染   | 错误条        |
| Image                           | 图片地址         | 加载占位 | 错误态        |
| Avatar                          | src / text       | 原渲染   | 错误态        |
| Badge                           | 数值 / 文本      | 原渲染   | 错误提示      |
| QRCode                          | 编码文本         | 原渲染   | 错误提示      |
| Watermark                       | 水印内容         | 原渲染   | —             |
| Tag                             | 标签文本         | 原渲染   | 错误提示      |
| Empty                           | 描述文案         | 原渲染   | 错误提示      |
| Card                            | title / content  | 原渲染   | 错误提示      |
| Alert                           | 消息文本         | 原渲染   | 错误提示      |
| Result                          | title / subTitle | 原渲染   | 错误提示      |

> 说明：subscribe 数据优先级高于 fetch 与本地 props；列表类组件的 subscribe 返回值应为数组。

## 组合函数

- `useSubscribe(handler)`：订阅型数据消费，挂载时调用处理方法，维护 `state / data / loading / error / isStale / refresh`，失败保留旧数据
- `extractSubscribeFailure(result)`：归一 subscribe 返回值，导出错误时返回失败信息
- `subscribeErrorText(error, fallback?)`：把订阅错误归一为可展示文案

<script setup>
import { reactive, ref } from 'vue';

const statisticCode = ref(`
  <Statistic title="实时在线人数" :subscribe="loadOnline" suffix="人" />
`);

const tableCode = ref(`
  <Table :columns="orderColumns" :subscribe="subscribeOrders" />
`);

const statisticScope = {
  loadOnline: async () => {
    await new Promise((resolve) => setTimeout(resolve, 600));
    if (Math.random() < 0.3) {
      return { status: 'error', error: '数据源连接失败' };
    }
    return { status: 'success', data: 1280 };
  },
};

const orderColumns = [
  { key: 'id', title: '订单号' },
  { key: 'amount', title: '金额', align: 'right' },
];

let orderSeq = 2;

const tableScope = {
  orderColumns,
  subscribeOrders: async () => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const list = reactive([
      { id: 'A-001', amount: 128 },
      { id: 'A-002', amount: 256 },
    ]);
    // 模拟服务端推送：每秒新增一笔订单，演示推 6 条后停止
    const timer = setInterval(() => {
      orderSeq += 1;
      list.push({ id: `A-00${orderSeq}`, amount: Math.floor(Math.random() * 900 + 100) });
      if (orderSeq >= 8) clearInterval(timer);
    }, 1000);
    return { data: list };
  },
};
</script>
