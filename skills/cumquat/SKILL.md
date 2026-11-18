---
name: cumquat
description: 使用 Cumquat Vue 3 组件库与 Headless 组合函数构建界面与业务逻辑。涵盖包结构、三大异步协议（fetch/action/subscribe）、受控模式、表单与浮层模型、资源池、竞选机制、主题与命令式服务，提供决策树与可复用代码片段。当用户需要用 Cumquat 实现页面、组件、表单、数据展示、交互反馈，或在组件外消费异步状态、自建无渲染逻辑时激活。
---

# Cumquat 使用指南

Cumquat 是一个 Vue 3 组件库，核心理念是**逻辑与渲染解耦**：Headless 组合函数负责状态机与行为逻辑，`.vue` 组件只做默认渲染壳。所有异步能力通过统一协议接入，组件自身不发请求。

## 1. 包结构与引入

### 1.1 统一入口（命名空间导出）

根包 `cumquat` 按子包路径名聚合导出，各子包命名空间独立，避免平铺合并的命名冲突：

```ts
import { composables, components } from '@mrchar/cumquat';

// composables 空间：组合函数与协议类型
const { usePagination, useActionState } = composables;

// components 空间：默认渲染组件、Cumquat 安装器与命令式服务
const { Button, Table, Cumquat } = components;
```

### 1.2 子包入口（按需引入）

默认渲染代码仅存在于 components 入口；composables 入口不打包渲染代码与样式：

```ts
// 组合函数（无渲染）
import { useForm, usePagination, useAsyncState } from '@mrchar/cumquat/composables';

// 默认渲染组件（开箱即用）
import { Button, Table, Select, Dialog } from '@mrchar/cumquat/components';
```

全量注册（模板中以 `Cq` 前缀标签使用，如 `<cq-button>`）：

```ts
import { Cumquat } from '@mrchar/cumquat/components';
app.use(Cumquat);
```

组件名统一使用 `Cq` 前缀：`CqButton`、`CqTable`、`CqSelect` 等。

### 1.3 分层

**L2 领域模型 → L1 行为原语 → L0 工具原语**，上层可依赖下层，下层禁止反向依赖。组件层与组合函数层通过 `Status` 状态词汇与最小形状（status / data / error / retry）通信。

## 2. 决策树

```
要解决的问题是什么？
├─ 页面 / 组件交互与展示 → 选协议
│  ├─ 有交互操作 → action（第 3.3 节）
│  └─ 数据展示 → 数据从哪来？
│     ├─ 组件主动查询（分页 / 搜索 / 排序 / 筛选）→ fetch（第 3.1 节）
│     └─ 外部推送 / 实时数据 → subscribe（第 3.4 节）
├─ 组件外异步状态 → useAsyncState（第 3.5 节）
├─ 表单 / 日期 / 选项联动 → L2 表单模型（第 5 节）
├─ 浮层 / 消息反馈 / 全局 loading → L2 浮层与反馈（第 6 节）
├─ 资源 CRUD + 字段元数据 → useResources（第 8 节）
├─ 聊天消息流（历史 + 推送 + 发送）→ useChat（第 3.6 节）
├─ 开 / 关、弹出、焦点圈、键盘导航 → L1 行为原语（第 10 节）
└─ 受控值、事件监听、定时、滚动、剪贴板 → L0 工具原语（第 10 节）
```

- 三者可同时传入，数据优先级：**subscribe > fetch > 本地 props**。
- 不想手写每一列、每一项？走元数据直通路线：`useResources` 导出资源方法与字段元数据，展示与录入由竞选机制自动推断（第 8、9 节）。
- 聊天场景三个协议同屏：`Chat` 组件用 `fetch` 载历史、`subscribe` 收推送、`action` 发消息。
- 自建 headless 组件时自底向上组合：L0 搭基础能力，L1 组行为，L2 只在领域恰合时引入。

## 3. 三大异步协议的组合函数层

组件消费协议，组合函数**生产**协议状态。绑定同一处理方法即可在组件内 / 外共享行为。

### 3.1 fetch：资源工厂即处理方法

用于组件**主动发起**的查询型请求（分页、搜索、排序、筛选）。`fetch` 是资源工厂：组件在查询变化时调 `execute(query)`、卸载时调 `abort()`，并处理防抖与四态渲染；**竞态与取消的实现完全交给开发者**。

调用工厂返回一个长命资源对象 `FetchResult`：四个状态字段（`status / data / error / message`，类型为 `MaybeRefOrGetter`）加两个方法（`execute / abort`）。库不创建 `AbortController`，`FetchQuery` 中也没有 `signal`。

```ts
import { ref } from 'vue';
import { asyncErrorText } from '@mrchar/cumquat';
import type {
  FetchData,
  FetchHandler,
  FetchResult,
  ResolvedFetchQuery,
  Status,
} from '@mrchar/cumquat';

interface UserRow {
  id: number;
  name: string;
}

const fetchUsers: FetchHandler<UserRow> = (): FetchResult<UserRow> => {
  const status = ref<Status>('idle');
  const data = ref<FetchData<UserRow>>();
  const error = ref<unknown>();
  const message = ref<string>();

  // 竞态与取消是资源内部的私有实现，组件库无感知
  let controller: AbortController | undefined;
  let runId = 0;

  return {
    status,
    data,
    error,
    message,
    async execute(query: ResolvedFetchQuery) {
      const current = ++runId;
      controller?.abort();
      controller = new AbortController();
      status.value = 'pending';
      try {
        const raw = await fetchUsersApi(
          { page: query.page ?? 1, kw: query.keyword },
          controller.signal,
        );
        if (raw.code !== 0) throw new Error(raw.message);
        if (current !== runId) return; // 过期响应不落地
        // data 写数组 → 普通列表；写 { list, page, size, total } → 分页；写其他 → 单值
        data.value = { list: raw.records, page: raw.page, size: raw.size, total: raw.total };
        status.value = 'success';
      } catch (err) {
        if (current !== runId) return;
        error.value = err;
        message.value = asyncErrorText(err);
        status.value = 'error'; // 失败写状态，execute 不得 reject
      }
    },
    abort() {
      runId += 1;
      controller?.abort();
    },
  };
};
```

```vue
<Table :columns="columns" :fetch="fetchUsers" pagination :size="20" />
<Select v-model="userId" :fetch="searchUsers" filterable placeholder="搜索用户" />
```

- 四态渲染、防抖、调用时机由组件内部 `useFetchResource` 编排，资源对象自身持有状态。
- 库不提供标准资源实现：`useResources` 的 `list` 工厂也是同一协议的一份私有实现。
- 辅助判定：`isPagedResult` / `normalizeFetchResult`（由主包统一导出）。
- `PagedResult<T>` 统一分页响应的 `page / size / total` 形状。

#### 各组件注入的查询片段

| 组件                                                                    | query 片段                          | 返回形态                            |
| ----------------------------------------------------------------------- | ----------------------------------- | ----------------------------------- |
| Table                                                                   | `pagination` / `sorter` / `filters` | 数组或 `{ list, page, size, total }` |
| Select / AutoComplete / Mention                                         | `keyword`（300ms 防抖）             | 数组                                |
| Tree / TreeSelect / Cascader                                            | `filters.parentKey`（懒加载）       | 数组                                |
| VirtualList                                                             | `pagination`（触底累积）            | 数组或 `{ list, page, size, total }` |
| Calendar                                                                | `filters.range: [首日, 末日]`       | 数组                                |
| Statistic / Descriptions / Timeline / Tabs / Collapse / Carousel / Menu | `filters`                           | 单值或数组                          |

### 3.2 action：交互动作

用于**有交互操作**的组件。绑定返回 Promise 的函数，执行期间自动 loading / disabled，返回值控制状态与错误提示。

| 语义       | 组件                                                                                                                  | 失败行为                          |
| ---------- | --------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| **确认型** | Button、Form、Popconfirm、Upload、Dialog、Drawer、Tour、TimePicker                                                    | 容器内错误条，保持打开            |
| **切换型** | Select、DatePicker、ColorPicker、Transfer、Rate、Segmented、Tabs、Checkbox、Radio、RadioGroup、Slider、Cascader、Tree | 乐观回退旧值，emit `action-error` |

```ts
// 与 subscribe 共用的处理器结果协议；字段接受裸值、Ref 或 getter
interface AsyncResult<T = unknown> {
  status?: MaybeRefOrGetter<'idle' | 'pending' | 'success' | 'error'>; // 缺省 success
  data?: MaybeRefOrGetter<T>;
  error?: MaybeRefOrGetter<unknown>;
  message?: MaybeRefOrGetter<string>; // 覆盖默认错误文案
}

// action 只表达成功/失败，不承载数据
type ActionResult = AsyncResult<never, 'success' | 'error'>;
```

失败判定：`reject`，或 resolve 出 `status: 'error'` / 携带 `error` 字段。

```ts
// 确认型（提交、保存）：执行中 loading 并禁用，失败拿到可展示错误
const { execute, loading, error } = useActionState(submitForm, { onSuccess: close });

// 切换型（收藏、开关）：乐观更新，失败自动回退旧值
const { value, pending } = useActionValue(initial, toggleStar);
```

错误归一 helpers：`extractAsyncFailure` / `asyncErrorText`（message → error 字符串 → Error.message → errorText 回退）。旧名 `extractActionFailure` / `actionErrorText` 仍由主包别名导出。组件层同名行为即由这两个函数驱动。

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

### 3.3 subscribe：数据订阅

用于**外部推送**的被动数据源（WebSocket、EventEmitter、响应式 store）。处理方法在挂载时调用，resolve 出数据后渲染。没有专用组合函数，直接手写：

```ts
import type { SubscribeHandler } from '@mrchar/cumquat';

// 可直接绑给组件 <Statistic :subscribe="subscribeOnline" />
const subscribeOnline: SubscribeHandler<number> = () => ({
  status: 'success',
  data: store.onlineCount,
});
```

- 无可用数据时返回 `{ status: 'pending' }`，组件据此保持加载态；失败可 `reject`，或返回 `{ status: 'error', error, message }`。
- `data` 为 ref / getter / 响应式对象时持续更新视图——这是订阅与请求的本质差异。
- 失败保留旧数据并展示错误条，支持 `refresh` 重试；四态与重试由组件内部 `useSubscribeResource` 驱动。

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
<Statistic title="实时在线人数" :subscribe="loadOnline" suffix="人" />
<Progress :subscribe="loadProgress" />
```

支持 subscribe 的组件：Table、VirtualList、Select、AutoComplete、Mention、Tree、TreeSelect、Cascader、Tabs、Collapse、Timeline、Carousel、Menu、Calendar、Statistic、Descriptions、Progress、Image、Avatar、Badge、QRCode、Watermark、Tag、Empty、Card、Alert、Result。

### 3.4 useAsyncState：通用异步状态机

```ts
const { state, retry } = useAsyncState(() => loadDetail(id)); // 产出 Snapshot
// state.value.status / data / error / retry —— composables 自有的输出形状
// 旧数据标记：status !== 'success' && data !== undefined
```

不属于查询 / 动作 / 订阅三形态的异步逻辑，用它兜底；任何视图只要接受等价形状即可渲染四态。

### 3.5 useChat：聊天消息模型

三协议聚合体：`fetch` 管历史（page 递增向上翻页，结果前插去重）、`subscribe` 管推送（追加去重，自己消息回显自动收敛为服务端 id）、`send` 管发送（乐观上屏，失败保留气泡可重试）。

```ts
const { messages, send, loadOlder, hasMore, sending } = useChat({
  fetch: loadHistory, // ChatMessage[] 或 { list, page, size, total }，判定是否还有更早消息
  subscribe: onPush, // 推送单条或数组；响应式源持续推送
  send: submitMessage, // 抛错或返回 error 结果即失败
});
```

## 4. 组件层约定

### 4.1 受控 / 非受控

- **v-model 永远纯同步**：异步副作用走 `action` / `fetch` / `subscribe`，不走 v-model。
- **异步 props 全部可选**：不传即为普通非受控组件。
- 所有带值组件支持 `modelValue` + `defaultValue`。

```vue
<!-- 受控 -->
<Input v-model="text" />
<!-- 非受控 -->
<Input default-value="hello" />
```

### 4.2 异步状态 :state

数据型组件的 `data` / `state` 属性接受组件自有形状（与组合函数输出的 `Snapshot` 结构兼容，不依赖 core 中的统一类型）：

```ts
type State<T, E = unknown> = {
  status: 'idle' | 'pending' | 'success' | 'error';
  data?: T;
  error?: E;
  retry?: () => void;
};
```

```vue
<Table :columns="columns" :state="myState" />
```

### 4.3 命令式服务

```ts
import { message, notification, useLoadingService } from '@mrchar/cumquat/composables';

message.success('保存成功');
message.error('操作失败');

notification.open({ title: '新消息', description: '你有一条未读' });

const loading = useLoadingService();
const end = loading.start(); // 或 loading.wrap(promise) 包裹异步任务
// 完成后 end()；需要隔离实例时用 createLoadingService()
```

命令式服务建议在应用入口创建一次并注入，不要在每个组件里重复创建。

### 4.4 主题与样式

组件只含语义 class（`cumquat-button` 等），颜色用语义 token（`text-cq-accent`、`bg-cq-surface`）。

```css
/* 宿主有 Tailwind v4 */
@import 'tailwindcss';
@source '../node_modules/@mrchar/cumquat/dist';
@import '@mrchar/cumquat/themes/basic.css';
@import '@mrchar/cumquat/themes/light.css'; /* 或 dark / high-contrast / glass */

/* 无 Tailwind：直接引入预编译样式 */
@import '@mrchar/cumquat/style.css';
```

组件 JS 入口不隐式引入 CSS，需宿主显式引入；在 `<html>` 上切换 `cq-theme-dark` / `cq-theme-glass` 等 class 换主题。

## 5. 表单模型域

| 组合函数                                  | 职责                                                            |
| ----------------------------------------- | --------------------------------------------------------------- |
| useForm                                   | 整表状态机：values / errors / valid / dirty / validate / submit |
| useFormField                              | 单控件接入表单：取值、错误、校验触发（组件层 FormItem 即此）    |
| useCheckableGroup                         | 复选组值模型                                                    |
| useSelectModel                            | 选择器值模型（含已选快照、多选）                                |
| useTreeModel                              | 树选择值模型                                                    |
| useAsyncSuggest                           | 异步联想（防抖 + 竞态）                                         |
| useDateGrid / useDateModel / useTimeModel | 日历网格与日期 / 时刻值模型                                     |

```ts
const form = useForm({
  modelValue: () => initial, // 受控或初始值
  rules: () => props.rules, // FormRule / FormRule[]，支持异步校验
  onSubmit: (values) => api.save(values),
  onInvalid: (errors) => message.error(Object.values(errors)[0]!),
});
// form.registerField(name, controller)：自建控件接入整表校验
```

规则类型 `FormRule` / `FormRules` / `FieldRuleConfig` 从包入口导出。

## 6. 浮层与反馈域

| 组合函数               | 职责                                     |
| ---------------------- | ---------------------------------------- |
| useModal               | 模态状态机（开 / 关 / 遮罩 / 焦点圈）    |
| usePopoverModel        | 弹层定位与触发（hover / click / focus）  |
| message / notification | 命令式服务：`createMessage()` 后全局调用 |
| useLoadingService      | 全局 loading 汇聚（并发请求计数）        |
| useNotificationCenter  | 消息盒子：异步推送、未读计数、已读/删除   |
| useToastQueue          | 队列化提示                               |

## 7. 数据展示与分页

```ts
import { usePagination } from '@mrchar/cumquat/composables';

const pagination = usePagination({ size: 20, onChange: () => refresh() });
// pagination.page / size / total / pages / go / setSize …
```

组件层 Table 的分页器即消费该模型；组件外需要响应式远程列表时，用 `useAsyncState` 驱动请求、`usePagination` 管理分页；绑给组件则手写 FetchHandler 资源工厂（见 3.1）。

## 8. 资源池 useResources

协议无关的资源池：传入服务器地址与文档地址，导出资源操作方法与字段元数据，与组件零胶水对接。

```ts
import { composables } from '@mrchar/cumquat';

// 模块级创建一次，全站复用
const userApi = composables
  .useResources({
    server: 'https://api.example.com', // 服务器基地址
    doc: '/v3/api-docs', // OpenAPI 3 / Swagger 2.0 文档地址
  })
  .client('users');
```

- 返回：`list / detail / create / update / remove` 方法 + `fields / columns / filters / properties` 元数据 + `schema`
- `columns` 直接绑 Table 的 `:columns`（按 `view.scope.list` 投影，字段的 `type` / `format` / `enum` 已展开到列上，enum 列自动以 `enum` 作为筛选项）
- `properties` 直接绑 Form 的 `:properties`（按 `view.scope.create` / `view.scope.update` 投影，形状为 `View`）；`filters` 供筛选面板
- `schema` 可直接绑 Form 的 `:schema`，或传给 `createValidator` 自动校验
- 分页信封自动识别（list / total 点分路径）；字段 `format` 原样透传文档声明
- 自定义协议只需替换注入边界：`parse`（元数据解析器）、`request`（请求适配器）、`registry`（直接提供资源表）、`view`（schema → 视图转换器）

完整契约见 [docs/composables/resources.md](../../docs/composables/resources.md)。

## 9. 竞选机制：元数据自动推断

同一套机制的两个应用：**单元格竞选**管展示（Table），**字段竞选**管录入（Form）。

- 优先级链路：插槽（`#cell-{key}` / `#field-{name}`）> 显式指定（列上 `cell` / 字段上 `component`）> 竞选推断 > 兜底（默认文本 / 默认输入框）
- 评分：渲染器对**完整列 / 字段视图**自我评价返回适配度分数（0 弃权），代理按列 / 字段裁决取最高分，同分先注册者优先
- 外部调整三层：列 / 字段上 `bias` 加减分、显式指定、`registerCell` / `registerField` 同名覆盖；Table 的 `cells` / Form 的 `controls` 可传局部渲染器
- 内建 Cell：text / number / boolean / enum / date / datetime / email / link / tag；内建 Field：input / number / switch / select / date（input 按 `props.format` 衍生 textarea / email / uri / password 形态）
- Form 绑定 properties 后，`validation.required` 为 true 的字段自动派生必填校验，宿主 rules 按字段名叠加其后
- 列定义本身是传统形态：`key / title / help / options / formatter / cell / bias…`，类型与格式元数据由资源池从 schema 投影到列上

```ts
import { components } from '@mrchar/cumquat';

// 注册自定义单元格渲染器：对 format: color 给出高分，其余弃权
components.registerCell({
  name: 'color',
  fitness: (column) => (column.format === 'color' ? 95 : 0),
  render: (value) => h('span', { style: { color: String(value) } }, '●'),
});
```

机制设计详见 [docs/campaign.md](../../docs/campaign.md)（展示与录入）。

## 10. 行为原语速查（L1 / L0）

自建 headless 组件时按需取用：

| 原语                                                                       | 用途                                     |
| -------------------------------------------------------------------------- | ---------------------------------------- |
| useOpen / useDismiss                                                       | 开关状态机 / 外点 + Esc 关闭（返回原因） |
| useFloating                                                                | 弹层定位锚定                             |
| useFocusTrap / useFocusReturn                                              | 焦点圈 / 关闭后焦点归还                  |
| useClickOutside                                                            | 外点检测                                 |
| useRovingFocus / useTypeahead                                              | 列表键盘漫游 / 首字跳转                  |
| useHoverIntent / useListboxNavigation                                      | 意图悬停 / 列表导航                      |
| useScrollLock / useScrollIntoView / useScroll                              | 滚动锁定 / 滚动定位 / 滚动监听           |
| useControllableModel                                                       | 受控 / 非受控统一值模型                  |
| useEventListener / useResizeObserver / useIntersectionObserver             | 事件与观察器（SSR 安全）                 |
| useTimeoutFn / useIntervalFn / useDebounceFn / useOnceFn / useMediaQuery   | 定时 / 防抖 / 一次性执行 / 媒体查询      |
| useToggle / useClipboard / useDraggable / useZIndex / useTransitionVisible | 开关 / 剪贴板 / 拖拽 / 层级 / 过渡       |

## 11. 常见模式速查

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
<Table :columns="columns" :fetch="fetchList" pagination :size="20" />
```

### 元数据直通（资源池 + 竞选）

```vue
<Table :columns="userApi.columns" :fetch="userApi.list" :size="20" />
<Form :properties="userApi.properties" :action="userApi.create">
  <Button type="primary" native-type="submit">保存</Button>
</Form>
```

### 聊天窗（三协议同屏）

```vue
<Chat :fetch="loadHistory" :subscribe="subscribeLive" :action="sendMessage" height="22rem" />
```

```ts
// fetch：资源工厂，page 递增表示更早一页，data 写 { list, page, size, total } 自动判定是否还有更早消息
// subscribe：推送单条或数组，自己消息（self: true）回显自动收敛为服务端 id
// action：抛错或返回 error 结果即发送失败，气泡保留可点击重试
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

```ts
const { value, pending } = useActionValue(props.liked, async (next) => {
  await api.like(next);
  return next; // 抛错则自动回退
});
```

### 组件外消费异步状态

```ts
// FetchHandler 是绑给组件的资源工厂；组件外要响应式状态用 useAsyncState
const { state, retry } = useAsyncState(loadStats);
// state 交给任意展示组件，也可喂给 :state 做四态渲染
```

### 自建 headless 弹层

```ts
const { open, toggle } = useOpen();
const { dismiss } = useDismiss({ onDismiss: () => (open.value = false) });
const { floating, reference } = useFloating({ open });
useFocusTrap(floating, { active: open });
// 模板自绘结构，行为全部来自组合函数
```

## 12. 注意事项

- **组件不发请求**：翻页 / 排序 / 搜索只会带着新 query 调资源对象的 `execute`，HTTP 调用与取消都在开发者写的工厂闭包里。
- **错误文案归一**：`message` → `error` 字符串 → `Error.message` → `errorText` prop；展示前过 `asyncErrorText` / `extractAsyncFailure`。
- **切换型失败回退**：值自动恢复，数据一致性由组件保证，错误经 `@action-error` 外部呈现。
- **subscribe 失败保留旧数据**：与 fetch 策略一致，避免内容消失。
- **组合函数不发请求**：请求时机由调用方决定（挂载、参数变化、命令式 refresh）。
- **effectScope 安全**：useFetchResource / useSubscribeResource 的首次执行经 queueMicrotask 延迟，可在 effectScope 中测试；FetchHandler / SubscribeHandler 由宿主手写。
- **类型单点导出**：协议类型（Fetch / Status / ActionResult / SubscribeResult）与 `Snapshot` 由主包 `@mrchar/cumquat` 统一导出，勿从深层路径引。
- **组件优先**：若组件层已提供同等能力（如 Table 内置分页），优先绑协议属性而非自己拼组合函数。
