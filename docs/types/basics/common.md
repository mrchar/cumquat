---
title: 类型参考 · 公共组合类型
---

# 公共组合类型

[核心类型](/types/basics/core)在 headless 组合函数层的落地形态：受控入参约定、异步快照，以及命令式的消息 / 通知服务。它们由 `@cumquat/composables` 提供，依赖 Vue 的响应式原语，但不输出任何 DOM 结构。

## 受控模型

### ControlledProps {#controlledprops}

Vue `v-model` 约定的标准入参形态（`modelValue` + `onUpdate:modelValue`，并补充非受控初值 `defaultValue`）。它不参与状态自持协议，只作为开合类组合函数的统一复用契约：`useOpen` / `useModal` / `usePopoverModel` 的 options 均 `extends ControlledProps<boolean>`；`createControllableModel` 直接以它为入参。

```ts
export interface ControlledProps<T> {
  modelValue?: T;
  defaultValue?: T;
  'onUpdate:modelValue'?: (value: T) => void;
}
```

## 异步快照

### Snapshot {#snapshot}

组合函数输出的异步快照。判别联合：`status` 为 `success` 时 `data` 收窄为 `T`，其余状态数据可为空。`useAsyncState` 以及组件内部的 `useFetchResource` / `useSubscribeResource` 输出的 `state` 都是这个形状；数据型组件在自己的 props 中声明等价形状，二者结构兼容但互不归属。旧数据是否保留由 `status` 与 `data` 派生——`status !== 'success' && data !== undefined` 即“有旧数据、尚未被本次结果确认”，属于视图判断。

```ts
export type Snapshot<T, E = unknown> = (
  | { status: 'idle'; data?: T }
  | { status: 'pending'; data?: T }
  | { status: 'success'; data: T }
  | { status: 'error'; data?: T; error: E }
) & {
  /** 失败重试入口 */
  retry?: () => void;
};
```

## 数据组合函数

数据类组合函数不产生独立的返回类型：fetch 由宿主直接手写为 [`FetchHandler`](/types/basics/core#fetchhandler) 资源工厂——工厂闭包内组织四个状态字段（`MaybeRefOrGetter`）与私有的竞态 / 取消逻辑，产出带 `execute / abort` 的 [`FetchResult`](/types/basics/core#fetchresult) 对象（见[数据请求](/composables/fetch)）；subscribe 同样由宿主手写为 [`SubscribeHandler`](/types/basics/core#subscribehandler)，直接返回 `{ status, data }` 结果对象，`data` 支持 ref / getter / 响应式对象。二者产出的处理器都可直接绑定组件属性，库不提供 fetch / subscribe 的标准实现。组件内部的 `useFetchResource` / `useSubscribeResource` 负责把处理结果投影为本页的 `Snapshot` 状态，属于组件作者的内部接口，不向宿主侧导出响应式返回类型。

## 反馈服务

### MessageApi {#messageapi}

`createMessage()` / 全局 `message` 单例的返回形态；`Message` 组件直接消费 `items`。

```ts
export interface MessageApi {
  items: Ref<Array<ToastItem>>;
  push: (content: string, options?: MessageOptions) => number;
  success: (content: string, duration?: number) => number;
  warning: (content: string, duration?: number) => number;
  info: (content: string, duration?: number) => number;
  error: (content: string, duration?: number) => number;
  loading: (content: string, duration?: number) => number;
  remove: (id: number) => void;
  clear: () => void;
  pause: (id: number) => void;
  resume: (id: number) => void;
}
```

### NotificationApi {#notificationapi}

`createNotification()` / 全局 `notification` 单例的返回形态。

```ts
export interface NotificationApi {
  items: Ref<Array<NotificationEntry>>;
  open: (type: ToastType, title: string, description?: string, duration?: number) => number;
  success: (title: string, description?: string) => number;
  warning: (title: string, description?: string) => number;
  info: (title: string, description?: string) => number;
  error: (title: string, description?: string) => number;
  remove: (id: number) => void;
  clear: () => void;
}
```
