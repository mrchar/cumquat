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

## 与 fetch 的边界

| 机制        | 语义     | 数据流                                | 适用场景                                                        |
| ----------- | -------- | ------------------------------------- | --------------------------------------------------------------- |
| `fetch`     | 主动请求 | 组件构造 query → 拉取 → 渲染          | 分页 / 搜索 / 排序的查询型数据                                  |
| `subscribe` | 被动订阅 | 外部事件 / 推送 → resolve 数据 → 渲染 | 实时数据、订阅型数据源（WebSocket、EventEmitter、响应式 store） |

两者可同时传入，数据优先级为 **subscribe > fetch > 本地 props**。subscribe 适合持续推送或外部驱动的数据流，fetch 适合组件主动发起的请求。

## 使用示例

### 订阅型数据源：Statistic

`subscribe` 处理方法内部完成订阅（此处用 setTimeout 模拟外部推送），resolve 后渲染数值，失败展示错误条。

<CodeCard v-model:code="statisticCode" editable title="Statistic 订阅实时数据">
  <LiveDemo :code="statisticCode" :scope="statisticScope" />
</CodeCard>

### 进度订阅：Progress

进度数据由外部驱动，失败时展示错误提示。

<CodeCard v-model:code="progressCode" editable title="Progress 订阅进度">
  <LiveDemo :code="progressCode" :scope="progressScope" />
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
import { ref } from 'vue';

const statisticCode = ref(`
  <Statistic title="实时在线人数" :subscribe="loadOnline" suffix="人" />
`);

const progressCode = ref(`
  <Progress :subscribe="loadProgress" :show-text="true" />
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

const progressScope = {
  loadProgress: async () => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    if (Math.random() < 0.3) {
      return { status: 'error', message: '进度获取失败，请重试' };
    }
    return { status: 'success', data: 73 };
  },
};
</script>
