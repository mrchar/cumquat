---
name: cumquat-components
description: 使用 Cumquat Vue 3 组件库构建界面。涵盖包结构、组件引入、三大异步协议（fetch/action/subscribe）、受控模式、主题与命令式服务，提供决策树与可复用代码片段。当用户需要用 Cumquat 实现页面、组件、表单、数据展示或交互反馈时激活。
---

# Cumquat 组件库使用指南

Cumquat 是一个 Vue 3 组件库，核心理念是**逻辑与渲染解耦**：Headless 组合函数负责状态机与行为，`.vue` 组件只做默认渲染壳。所有异步能力通过统一协议接入，组件自身不发请求。

## 1. 包结构与引入

### 1.1 统一入口（命名空间导出）

根包 `cumquat` 按子包路径名聚合导出，各子包命名空间独立，避免平铺合并的命名冲突：

```ts
import { composables, components } from 'cumquat';

// composables 空间：组合函数与协议类型
const { useFetch, useActionState, useSubscribe } = composables;

// components 空间：默认渲染组件、Cumquat 安装器与命令式服务
const { Button, Table, Cumquat } = components;
```

### 1.2 子包入口（按需引入）

两个入口按需引入，默认渲染代码仅存在于 components 入口：

```ts
// 组合函数（无渲染）
import { useFetch, useActionState, useSubscribe } from '@cumquat/composables';

// 默认渲染组件（开箱即用）
import { Button, Table, Select, Dialog } from '@cumquat/components';
```

全量注册（模板中以 `Cq` 前缀标签使用，如 `<cq-button>`）：

```ts
import { Cumquat } from '@cumquat/components';
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

不想手写每一列、每一项？走元数据直通路线：`useResources` 资源池（见第 11 节）导出资源方法与字段元数据，展示与录入由竞选机制自动推断（见第 12 节）。

## 3. 远程数据 Fetch

用于组件**主动发起**的查询型请求（分页、搜索、排序、筛选）。组件自动注入查询参数并处理防抖、竞态、四态渲染。

### 3.1 基本用法

```ts
import type { Fetch } from '@cumquat/components';

interface UserRow {
  id: number;
  name: string;
}

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

| 组件                                                                    | query 片段                          | 返回形态                 |
| ----------------------------------------------------------------------- | ----------------------------------- | ------------------------ |
| Table                                                                   | `pagination` / `sorter` / `filters` | 数组或 `{ list, total }` |
| Select / AutoComplete / Mention                                         | `keyword`（300ms 防抖）             | 数组                     |
| Tree / TreeSelect / Cascader                                            | `filters.parentKey`（懒加载）       | 数组                     |
| VirtualList                                                             | `pagination`（触底累积）            | 数组或 `{ list, total }` |
| Calendar                                                                | `filters.range: [首日, 末日]`       | 数组                     |
| Statistic / Descriptions / Timeline / Tabs / Collapse / Carousel / Menu | `filters`                           | 单值或数组               |

### 3.3 组件外消费状态

```ts
import { useFetch } from '@cumquat/composables';

const { state, data, total, status, loading, error, refresh, fetch } = useFetch<UserRow>((query) =>
  fetchUsersApi(query),
);
// fetch 可直接绑给组件：<Table :fetch="fetch" />
```

## 4. 交互动作 Action

用于**有交互操作**的组件。绑定返回 Promise 的函数，执行期间自动 loading / disabled，返回值控制状态与错误提示。

### 4.1 两类语义

| 语义       | 组件                                                                                                                  | 失败行为                          |
| ---------- | --------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| **确认型** | Button、Form、Popconfirm、Upload、Dialog、Drawer、Tour、TimePicker                                                    | 容器内错误条，保持打开            |
| **切换型** | Select、DatePicker、ColorPicker、Transfer、Rate、Segmented、Tabs、Checkbox、Radio、RadioGroup、Slider、Cascader、Tree | 乐观回退旧值，emit `action-error` |

### 4.2 协议

```ts
interface ActionResult {
  status?: 'success' | 'error'; // 缺省 success
  error?: unknown;
  message?: string; // 覆盖默认错误文案
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
  await new Promise((r) => setTimeout(r, 600));
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
  await new Promise((r) => setTimeout(r, 600));
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
  await new Promise((r) => setTimeout(r, 600));
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
import { message, notification, loading } from '@cumquat/components';

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
@source '../node_modules/cumquat/packages/components/dist';
@import 'cumquat/themes/basic.css';
@import 'cumquat/themes/light.css'; /* 或 dark / high-contrast / glass */

/* 无 Tailwind：直接引入预编译样式 */
@import 'cumquat/style.css';
```

组件 JS 入口不隐式引入 CSS，需宿主显式引入；主题 CSS 经主包 `cumquat/themes/*.css` 子路径导出，无 Tailwind 时用预编译的 `cumquat/style.css`。

## 10. 常见模式速查

### 表单提交

```vue
<Form v-model="form" :action="submitForm" @submit="onSuccess">
  <FormItem label="用户名" name="name" required>
    <Input name="name" />
  </FormItem>
</Form>
```

```ts
const submitForm = async (values: Record<string, unknown>) => {
  await api.save(values);
};
```

### 远程表格 + 分页

```vue
<Table :columns="columns" :fetch="fetchList" :pagination="{ pageSize: 20 }" />
```

### 元数据直通（资源池 + 竞选）

```vue
<!-- 列展示与表单控件均由 type / format 元数据自动推断 -->
<Table :columns="userApi.columns" :fetch="userApi.list" :page-size="20" />
<Form :properties="userApi.properties" :action="userApi.create">
  <Button type="primary" native-type="submit">保存</Button>
</Form>
```

### 弹层确认后关闭

```vue
<Dialog v-model:open="open" :action="confirm">
  <!-- 内容 -->
</Dialog>
```

### 乐观更新的选择器

```vue
<Select
  v-model="val"
  :options="opts"
  :action="save"
  @action-error="(e) => message.error(String(e))"
/>
```

## 11. 资源池 useResources

协议无关的资源池：传入服务器地址与文档地址，导出资源操作方法与字段元数据，与组件零胶水对接。

```ts
import { composables } from 'cumquat';

// 模块级创建一次，全站复用
const userApi = composables.useResources({
  server: 'https://api.example.com', // 服务器基地址
  doc: '/v3/api-docs',               // OpenAPI 3 / Swagger 2.0 文档地址
}).client('users');
```

- 返回：`list / detail / create / update / remove` 方法 + `fields / columns / filters / properties` 元数据
- `columns` 直接绑 Table 的 `:columns`（按 `scope.list` 投影，携带 type / format）；`properties` 直接绑 Form 的 `:properties`（按 `scope.create` / `scope.update` 投影）；`filters` 供筛选面板
- 分页信封自动识别（list / total 点分路径）；字段 `format` 原样透传文档声明
- 自定义协议只需替换两个注入边界：`parse`（元数据解析器）与 `request`（请求适配器）

完整契约见 [docs/composables/resources.md](../../docs/composables/resources.md)。

## 12. 竞选机制：元数据自动推断

同一套机制的两个应用：**单元格竞选**管展示（Table），**字段竞选**管录入（Form）。

- 优先级链路：插槽（`#cell-{key}` / `#field-{name}`）> 显式指定（列上 `cell` / 字段上 `control`）> 竞选推断 > 兜底（默认文本 / 默认输入框）
- 评分：渲染器对**完整列 / 字段定义**自我评价返回适配度分数（0 弃权），代理按列 / 字段裁决取最高分，同分先注册者优先
- 外部调整三层：列 / 字段上 `bias` 加减分、显式指定、`registerCell` / `registerField` 同名覆盖；Table 的 `cells` / Form 的 `controls` 可传局部渲染器
- 内建 Cell：text / number / boolean / enum / date / datetime / email / link / tag；内建 Field：input / number / switch / select / date（input 按 format 衍生 textarea / email / uri / password 形态）
- Form 绑定 properties 后，`required` 字段自动派生必填校验，宿主 rules 按字段名叠加其后

```ts
import { components } from 'cumquat';

// 注册自定义单元格渲染器：对 format: color 给出高分，其余弃权
components.registerCell({
  name: 'color',
  fitness: (column) => (column.format === 'color' ? 95 : 0),
  render: (value) => h('span', { style: { color: String(value) } }, '●'),
});
```

机制设计详见 [docs/cell.md](../../docs/cell.md)（展示）与 [docs/field.md](../../docs/field.md)（录入）。

## 13. 注意事项

- **组件不发请求**：翻页/排序/搜索只 emit 事件，由外层响应式参数驱动。
- **错误文案归一**：`message` → `error` 字符串 → `Error.message` → `errorText` prop。
- **切换型失败回退**：值自动恢复，数据一致性由组件保证，错误经 `@action-error` 外部呈现。
- **subscribe 失败保留旧数据**：与 fetch 策略一致，避免内容消失。
- **切换主题**：在 `<html>` 上切换 `cq-theme-dark` / `cq-theme-glass` 等 class。
