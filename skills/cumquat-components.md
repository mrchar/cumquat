---
name: cumquat-components
description: 使用 Cumquat Vue 3 组件库构建界面。涵盖包结构、组件引入、三大异步协议（fetch/action/subscribe）、受控模式、主题与命令式服务，提供决策树与可复用代码片段。当用户需要用 Cumquat 实现页面、组件、表单、数据展示或交互反馈时激活。
---

# Cumquat 组件库使用指南

Cumquat 是一个 Vue 3 组件库，核心理念是**逻辑与渲染解耦**：Headless 组合函数负责状态机与行为，`.vue` 组件只做默认渲染壳。所有异步能力通过统一协议接入，组件自身不发请求。

## 1. 包结构与引入

三个入口按需引入，默认渲染代码仅存在于 components 入口：

```ts
// 组合函数（无渲染）
import { useFetch, useActionState, useSubscribe } from '@cumquat/vue';

// 无渲染组件（仅消费 AsyncStateLike 契约）
import { AsyncState } from '@cumquat/vue/headless';

// 默认渲染组件（开箱即用）
import { Button, Table, Select, Dialog } from '@cumquat/vue/components';
```

全量注册（模板中以 `Cq` 前缀标签使用，如 `<cq-button>`）：

```ts
import { Cumquat } from '@cumquat/vue/components';
app.use(Cumquat);
```

组件名统一使用 `Cq` 前缀：`CqButton`、`CqTable`、`CqSelect` 等。

## 2. 决策树：该用哪个协议？

根据数据/动作的来源选择协议：

```
有交互操作？
├─ 是 → 用 action（见第 4 节）
└─ 否 → 有数据展示？
   ├─ 是 → 数据从哪来？
   │   ├─ 组件主动查询（分页/搜索/排序）→ fetch（见第 3 节）
   │   └─ 外部推送/实时数据 → subscribe（见第 5 节）
   └─ 否 → 纯静态 props
```

三者可同时传入，数据优先级：**subscribe > fetch > 本地 props**。

## 3. 远程数据 Fetch

用于组件**主动发起**的查询型请求（分页、搜索、排序、筛选）。组件自动注入查询参数并处理防抖、竞态、四态渲染。

### 3.1 基本用法

```ts
import type { Fetch } from '@cumquat/vue/components';

interface UserRow { id: number; name: string }

const fetchUsers: Fetch<UserRow> = async (query) => {
  const res = await fetch(
    `/api/users?page=${query.pagination?.currentPage ?? 1}&q=${query.keyword ?? ''}`,
    { signal: query.signal },
  );
  if (!res.ok) throw new Error('请求失败');
  const body = await res.json();
  // 返回数组 → 普通列表；返回 { list, total } → 分页；返回其他 → 单值
  return { list: body.records, total: body.total };
};
```

```vue
<Table :columns="columns" :fetch="fetchUsers" pagination :page-size="20" />
<Select v-model="userId" :fetch="searchUsers" filterable placeholder="搜索用户" />
```

### 3.2 各组件注入的查询片段

| 组件 | query 片段 | 返回形态 |
|------|-----------|---------|
| Table | `pagination` / `sorter` / `filters` | 数组或 `{ list, total }` |
| Select / AutoComplete / Mention | `keyword`（300ms 防抖） | 数组 |
| Tree / TreeSelect / Cascader | `filters.parentKey`（懒加载） | 数组 |
| VirtualList | `pagination`（触底累积） | 数组或 `{ list, total }` |
| Calendar | `filters.range: [首日, 末日]` | 数组 |
| Statistic / Descriptions / Timeline / Tabs / Collapse / Carousel / Menu | `filters` | 单值或数组 |

### 3.3 组件外消费状态

```ts
import { useFetch } from '@cumquat/vue';

const { state, data, total, status, loading, error, refresh, fetch } = useFetch<UserRow>(
  (query) => fetchUsersApi(query),
);
// fetch 可直接绑给组件：<Table :fetch="fetch" />
```

## 4. 交互动作 Action

用于**有交互操作**的组件。绑定返回 Promise 的函数，执行期间自动 loading / disabled，返回值控制状态与错误提示。

### 4.1 两类语义

| 语义 | 组件 | 失败行为 |
|------|------|---------|
| **确认型** | Button、Form、Popconfirm、Upload、Dialog、Drawer、Tour、TimePicker | 容器内错误条，保持打开 |
| **切换型** | Select、DatePicker、ColorPicker、Transfer、Rate、Segmented、Tabs、Checkbox、Radio、RadioGroup、Slider、Cascader、Tree | 乐观回退旧值，emit `action-error` |

### 4.2 协议

```ts
interface ActionResult {
  status?: 'success' | 'error';  // 缺省 success
  error?: unknown;
  message?: string;              // 覆盖默认错误文案
}
```

失败判定：`reject`，或 resolve 出 `status: 'error'` / 携带 `error` 字段。

### 4.3 示例

确认型（Dialog 异步确认，失败保持打开）：

```vue
<Dialog v-model:open="open" title="删除确认" :action="confirmAction" @action-error="onError">
  <p>确定删除这条记录吗？</p>
</Dialog>
```

```ts
const confirmAction = async () => {
  await new Promise(r => setTimeout(r, 600));
  if (Math.random() < 0.5) {
    return { status: 'error', error: '存在关联数据，无法删除' };
  }
};
```

切换型（Select 乐观更新，失败回退）：

```vue
<Select v-model="value" :options="options" :action="persist" @action-error="onError" />
```

```ts
const persist = async (value) => {
  await new Promise(r => setTimeout(r, 600));
  if (value === 'forbidden') return { status: 'error', error: '不可选' };
};
```

## 5. 数据订阅 Subscribe

用于**外部推送**的被动数据源（WebSocket、EventEmitter、响应式 store）。处理方法在挂载时调用，resolve 出数据后渲染。

### 5.1 协议

```ts
interface SubscribeResult<T> {
  status?: 'loading' | 'success' | 'error';
  data?: T;
  error?: unknown;
  message?: string;
}
```

失败时保留旧数据并展示错误条，支持 `refresh` 重试。

### 5.2 示例

```vue
<Statistic title="实时在线人数" :subscribe="loadOnline" suffix="人" />
<Progress :subscribe="loadProgress" />
```

```ts
const loadOnline = async () => {
  await new Promise(r => setTimeout(r, 600));
  if (Math.random() < 0.3) return { status: 'error', error: '连接失败' };
  return { status: 'success', data: 1280 };
};
```

支持 subscribe 的组件：Table、VirtualList、Select、AutoComplete、Mention、Tree、TreeSelect、Cascader、Tabs、Collapse、Timeline、Carousel、Menu、Calendar、Statistic、Descriptions、Progress、Image、Avatar、Badge、QRCode、Watermark、Tag、Empty、Card、Alert、Result。

## 6. 受控 / 非受控

- **v-model 永远纯同步**：异步副作用走 `action` / `fetch` / `subscribe`，不走 v-model。
- **异步 props 全部可选**：不传即为普通非受控组件。
- 所有带值组件支持 `modelValue` + `defaultValue`。

```vue
<!-- 受控 -->
<Input v-model="text" />
<!-- 非受控 -->
<Input default-value="hello" />
```

## 7. 异步状态 :state

数据型组件可直接接收 `AsyncStateLike<T>`，自行管理请求时使用：

```ts
interface AsyncStateLike<T> {
  status: 'pending' | 'success' | 'error';
  data: T;
  error?: unknown;
  isStale?: boolean;
  retry?: () => void;
}
```

```vue
<Table :columns="columns" :state="myState" />
```

## 8. 命令式服务

```ts
import { message, notification, loading } from '@cumquat/vue/components';

message.success('保存成功');
message.error('操作失败');

notification.open({ title: '新消息', description: '你有一条未读' });

const hide = loading.show({ text: '加载中...' });
// 完成后 hide()
```

## 9. 主题与样式

组件只含语义 class（`cumquat-button` 等），颜色用语义 token（`text-cq-accent`、`bg-cq-surface`）。

```css
/* 宿主有 Tailwind v4 */
@import 'tailwindcss';
@source '../node_modules/@cumquat/components/dist';
@import '@cumquat/themes/basic.css';
@import '@cumquat/themes/light.css';   /* 或 dark / high-contrast / glass */

/* 无 Tailwind */
@import '@cumquat/components/dist/style.css';
```

组件 JS 入口不隐式引入 CSS，需宿主显式引入。

## 10. 常见模式速查

### 表单提交

```vue
<Form :model="form" :action="submitForm" @submit-success="onSuccess">
  <FormItem label="用户名" prop="name">
    <Input v-model="form.name" />
  </FormItem>
</Form>
```

```ts
const submitForm = async () => {
  await api.save(form.value);
};
```

### 远程表格 + 分页

```vue
<Table :columns="columns" :fetch="fetchList" :pagination="{ pageSize: 20 }" />
```

### 弹层确认后关闭

```vue
<Dialog v-model:open="open" :action="confirm">
  <!-- 内容 -->
</Dialog>
```

### 乐观更新的选择器

```vue
<Select v-model="val" :options="opts" :action="save" @action-error="(e) => message.error(String(e))" />
```

## 11. 注意事项

- **组件不发请求**：翻页/排序/搜索只 emit 事件，由外层响应式参数驱动。
- **错误文案归一**：`message` → `error` 字符串 → `Error.message` → `errorText` prop。
- **切换型失败回退**：值自动恢复，数据一致性由组件保证，错误经 `@action-error` 外部呈现。
- **subscribe 失败保留旧数据**：与 fetch 策略一致，避免内容消失。
- **切换主题**：在 `<html>` 上切换 `cq-theme-dark` / `cq-theme-glass` 等 class。
