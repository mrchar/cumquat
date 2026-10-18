---
title: 机制总览
---

# 机制总览

本文档梳理 Cumquat 组件库已实现的全部核心机制，作为理解与使用组件库的总入口。
各机制的详细用法与可编辑示例见对应专题文档。

## 1. 整体架构

三层单向依赖，逻辑与渲染彻底解耦：

```
逻辑层（composables）  →  无渲染层（AsyncState 组件）  →  结构层（StateView 组件）
状态机 / 行为 / 派生数据      仅消费 AsyncStateLike 契约          默认渲染 + 插槽覆盖
```

- **`@cumquat/composables`**：Headless 组合函数库，只负责状态机、行为与派生数据，
  不输出任何 DOM 结构，仅依赖 Vue 运行时。
- **`@cumquat/vue/headless`**：无渲染组件层，唯一依赖的纯类型为
  `AsyncStateLike<T>`（`status / data / error / isStale? / retry?`）。
- **`@cumquat/vue/components`**：默认渲染组件层，提供开箱即用的 Tailwind 默认渲染，
  支持逐层覆盖；默认渲染代码仅存在于此入口，使用 composable 或 headless 层时不会被打包。

包入口拆分为三个子路径，按需引入：

```ts
import { useFetch } from '@cumquat/vue';              // composables
import { AsyncState } from '@cumquat/vue/headless';    // 无渲染层
import { Button, Table } from '@cumquat/vue/components'; // 默认渲染层
```

## 2. 核心契约

组件与组合函数之间通过最小类型集合通信，避免跨层耦合。

### 2.1 异步数据状态 `AsyncStateLike<T>`

数据型组件与组合函数唯一依赖的数据契约：

```ts
interface AsyncStateLike<T> {
  status: 'pending' | 'success' | 'error';
  data: T;
  error?: unknown;
  isStale?: boolean;
  retry?: () => void;
}
```

数据型组件（Table、Select 等）接收 `:state="AsyncStateLike"` 后内置
**四态渲染**：骨架（pending）/ 错误重试（error）/ 空态 / stale 提示，组件自身不发请求。

### 2.2 动作结果 `ActionResult`

交互组件的 `action` 返回值协议，导出状态与错误以控制组件状态：

```ts
interface ActionResult {
  status?: 'success' | 'error';  // 缺省视为 success
  error?: unknown;                // 失败信息
  message?: string;               // 提示文案，覆盖默认错误文案
}
type ActionLike = (...args: any[]) => Promise<ActionResult | void> | ActionResult | void;
```

### 2.3 订阅结果 `SubscribeResult<T>`

数据展示组件的 `subscribe` 处理方法返回值协议：

```ts
interface SubscribeResult<T> {
  status?: 'loading' | 'success' | 'error';
  data?: T;
  error?: unknown;
  message?: string;
}
type SubscribeHandler<T> = () => Promise<SubscribeResult<T>> | SubscribeResult<T>;
```

### 2.4 受控值 `ControlledProps<T>`

所有带值的组件统一支持受控 / 非受控：

```ts
interface ControlledProps<T> {
  modelValue?: T;
  defaultValue?: T;
  'onUpdate:modelValue'?: (value: T) => void;
}
```

## 3. 远程数据 Fetch

资源型组件绑定统一的 `Fetch<T>` 方法即可完成远程数据接入。组件内部自动注入
分页、关键词、排序、筛选等查询参数，处理防抖、竞态、状态管理、错误重试与四态渲染。

```ts
import type { Fetch } from '@cumquat/vue/components';

// 返回数组 → 普通列表；返回 { list, total } → 分页；返回其他 → 单值
const fetchUsers: Fetch<UserRow> = async (query) => {
  const res = await fetch(`/api/users?page=${query.pagination?.currentPage ?? 1}`, {
    signal: query.signal,
  });
  return res.json();
};
```

**优先级与共存**：`subscribe > fetch > 本地 props`，三者可同时传入。

**关键能力**：
- 挂载即请求，查询参数变化自动重取（深比较）
- 请求序号保证后到为准，旧请求经 `AbortController` 取消
- 重取期间保留旧数据并标 `isStale`，失败渲染错误态且 `retry` 重放最近查询
- 支持 `merge` 累积模式（翻页拼接、树懒加载挂载子级）
- 支持 `debounce`（关键词类组件 300ms）

**组件外消费**：`useFetch(fetcher)` 导出 `state / data / total / status / loading / error / isStale / refresh`，其 `fetch` 方法可直接绑给组件。

详细用法见 [远程数据 Fetch](./fetch) 与 [数据请求机制](./data-fetching)。

## 4. 交互动作 Action

所有有交互操作的组件统一支持 `action` 属性，绑定返回 Promise 的函数。
执行期间自动派生 loading / disabled，返回值导出状态与错误以控制组件状态与错误提示。

**两类动作语义**：

| 语义       | 组件                                                                                                                  | 失败行为                                  |
| ---------- | --------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| **确认型** | Button、Form、Popconfirm、Upload、Dialog、Drawer、Tour、TimePicker                                                    | 容器内展示错误条（`cq-state--error`），保持打开 |
| **切换型** | Select、DatePicker、ColorPicker、Transfer、Rate、Segmented、Tabs、Checkbox、Radio、RadioGroup、Slider、Cascader、Tree | **乐观回退**：值恢复旧值，emit `action-error` |

**失败判定**：action `reject`，或 resolve 出 `status: 'error'` / 携带 `error` 字段，均视为失败。

**错误文案归一**：按 `message` → `error` 字符串 → `Error.message` → 回退文案（`errorText` prop）取值。

详细用法见 [交互动作 Action](./action)。

## 5. 数据订阅 Subscribe

所有有数据展示功能的组件统一支持 `subscribe` 属性，绑定返回 Promise 的处理方法。
方法在组件挂载时调用，resolve 出的数据用于渲染，失败保留旧数据并支持重试。

**与 fetch 的边界**：

| 机制        | 语义     | 数据流                                | 适用场景                                  |
| ----------- | -------- | ------------------------------------- | ----------------------------------------- |
| `fetch`     | 主动请求 | 组件构造 query → 拉取 → 渲染          | 分页 / 搜索 / 排序的查询型数据            |
| `subscribe` | 被动订阅 | 外部事件 / 推送 → resolve 数据 → 渲染 | 实时数据、WebSocket、响应式 store 等      |

数据优先级：**subscribe > fetch > 本地 props**。

详细用法见 [数据订阅 Subscribe](./subscribe)。

## 6. 受控 / 非受控统一

- **v-model 永远纯同步**：所有 `modelValue` / `open` / `visible` 等绑定值只做同步回写，
  异步副作用一律由外层驱动（通过 `action` / `fetch` / `subscribe`）。
- **异步 props 全部可选**：不传 `fetch` / `action` / `subscribe` 时，组件退化为普通非受控组件。
- **`useControllableModel`**：统一封装受控 / 非受控逻辑，支持 `modelValue` + `defaultValue`，
  内部自持初始值并通过 `update:modelValue` 同步回写。

## 7. 命令式服务

部分反馈能力以命令式 API 提供，宿主可脱离组件直接调用：

| API                  | 职责                                                              | 底层组合函数       |
| -------------------- | ----------------------------------------------------------------- | ------------------ |
| `message.success(...)` | 全局轻提示（success / error / warning / info / loading）         | `useToastQueue`    |
| `notification.open(...)` | 角落通知，支持标题 / 描述 / 动作按钮，四个方向堆叠            | `useToastQueue`    |
| `loading.show(...)`  | 局部 / 全屏加载遮罩，多请求合并计数                               | `useLoadingService`|

```ts
import { message, notification } from '@cumquat/vue/components';

message.success('保存成功');
notification.open({ title: '新消息', description: '你有一条未读消息' });
```

## 8. 主题机制

### 8.1 语义 Token

组件仅保留语义选择器（如 `cumquat-button`、`cumquat-button--primary`），不包含任何
内联工具类或自定义样式。颜色通过带 `cq-` 前缀的语义 token 表达
（如 `text-cq-accent`、`bg-cq-surface`），由主题包定义。

### 8.2 主题包

通过 Tailwind v4 的 `@theme` 定义语义变量，宿主可重写同名变量实现换肤。
深色模式使用 `dark:` 变体。

| 主题包         | 职责                                                         |
| -------------- | ------------------------------------------------------------ |
| `basic`        | 基础样式：所有组件的边距、圆角、阴影、字体、排版等完整样式   |
| `light`        | 浅色主题语义变量                                             |
| `dark`         | 深色主题语义变量                                             |
| `high-contrast`| 高对比度主题                                                 |
| `glass`        | 液态玻璃：强折射模糊、双层阴影、顶部微光渐变，高通透表面     |

**约束**：所有主题包必须使用 Tailwind v4 机制实现，通过 `@layer theme` 覆盖语义变量；
其他主题包仅覆盖与 `basic` 有差异的部分，不重复定义完整样式。

### 8.3 样式接入

```css
/* 宿主已有 Tailwind v4：扫描组件类名 + 引入主题 */
@import 'tailwindcss';
@source '../node_modules/@cumquat/components/dist';
@import '@cumquat/themes/basic.css';
@import '@cumquat/themes/light.css';

/* 无 Tailwind：直接引入预编译样式 */
```

```ts
import '@cumquat/components/dist/style.css';
```

组件 JS 入口不隐式 import CSS，样式引入由宿主显式决定。

## 9. 视图策略

默认渲染功能完备且视觉中立，提供三种使用方式：

1. **零配置**：直接使用组件，开箱即用默认渲染。
2. **逐插槽覆盖**：通过具名插槽替换局部结构（如 Table 的列插槽、Dialog 的 footer）。
3. **完全自定义**：使用 `@cumquat/vue/headless` 的无渲染组件，自行实现全部 DOM 结构。

默认渲染提供稳定的 `cumquat-xxx` 语义 class 与 `--cq-*` CSS 变量用于主题化与测试锚点。

## 10. 通用约定

- **组件自己不发请求**：翻页 / 排序 / 搜索只 emit 事件，由外层响应式参数驱动 fetch 连动。
- **文案可配置**：通过 `CumquatClient.messages` 配置，不内置 i18n 框架。
- **a11y 内建**：键盘焦点行为、aria 属性、roving tabindex 等可访问性能力内建于组合函数。
- **SSR 安全**：所有 `window / document` 访问惰性化并置于生命周期钩子内。
- **交互曲线统一**：所有交互组件使用 `0.2s` 弹性过渡
  `cubic-bezier(0.34, 1.56, 0.64, 1)`，hover 上浮、投影、指向反馈保持一致。

## 机制速查表

| 机制         | 核心 API / Prop       | 适用组件分类               | 详细文档                     |
| ------------ | --------------------- | -------------------------- | ---------------------------- |
| 远程数据     | `fetch` / `useFetch`  | 资源型组件（17 个）        | [Fetch](./fetch)             |
| 交互动作     | `action`              | 交互型组件（21 个）        | [Action](./action)           |
| 数据订阅     | `subscribe`           | 数据展示组件（26 个）      | [Subscribe](./subscribe)     |
| 异步状态     | `:state`              | 数据型组件                 | —                            |
| 命令式服务   | `message` / `notification` / `loading` | 反馈类         | —                            |
| 受控值       | `v-model`             | 全部带值组件               | —                            |
| 主题         | 语义 token + 主题包   | 全部组件                   | —                            |
