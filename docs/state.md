---
title: 状态自持
---

# 状态自持

Cumquat 组件库最核心的设计理念是**组件自持状态**。传统写法里，加载中的转圈、失败后的错误提示、空数据时的占位、翻页时重新请求，这些状态通常要由页面开发者手动维护——写 watch 监听参数变化、管理一个 `loading` 布尔值、拼装分页和筛选参数、处理请求竞态。Cumquat 把这些共性逻辑收敛进了组件内部：开发者只需要绑定一个处理器（`fetch` 资源工厂 / `action` / `subscribe` 函数），组件会自动接管请求时机、加载态、错误态、空态与重试；其中 fetch 的竞态与取消由开发者在资源对象内部实现，组件只负责调用，页面侧不再需要写胶水代码。

这三个属性分别对应三种不同的数据语义：

| 属性        | 语义     | 触发时机               | 数据流                                                          | 典型场景                          |
| ----------- | -------- | ---------------------- | --------------------------------------------------------------- | --------------------------------- |
| `fetch`     | 主动拉取 | 挂载建资源 + 交互调 `execute`（翻页等）  | 组件构造 query → 资源对象执行 → 渲染                                    | 分页表格、远程搜索、懒加载树      |
| `action`    | 交互动作 | 用户操作（点击、选择） | 执行 → loading → 成功 / 失败回退                                | 表单提交、按钮动作、选择器乐观更新 |
| `subscribe` | 被动订阅 | 挂载一次               | resolve 响应式数据 → 渲染；数据变化自动更新视图                 | WebSocket 推送、实时数据、外部 store |

虽然三者面向的场景不同，但底层共享同一套机制——统一的四态渲染、以后到为准的竞态处理、错误文案归一、失败重试入口。下面分别介绍每个属性的使用方法与工作原理。

---

## fetch：远程数据

资源型组件传入 `fetch` 工厂后，会在挂载时以当前查询创建一个资源对象并执行第一次 `execute`；之后用户的翻页、排序、搜索、展开等交互只会再次调用对象上的 `execute` 并注入新的查询参数，卸载或 fetch 源切换时调用 `abort`。开发者需要关心两件事：「拿到 query 后如何请求、如何解包响应」与「资源内部如何防竞态、如何取消」；请求时机和参数组装仍由组件负责。

### 协议

```ts
import { ref } from 'vue';
import type { FetchHandler, FetchResult, ResolvedFetchQuery, Status } from '@mrchar/cumquat';

// 工厂：一次绑定创建一个资源对象
const fetchUsers: FetchHandler<UserRow> = () => {
  const status = ref<Status>('idle');
  const data = ref<{ list: UserRow[]; page: number; size: number; total: number }>();
  const error = ref<unknown>();
  const message = ref<string>();
  let controller: AbortController | undefined;
  let runId = 0;

  const resource: FetchResult<UserRow> = {
    status,
    data,
    error,
    message,
    async execute(query: ResolvedFetchQuery) {
      const current = ++runId;
      controller?.abort(); // 新请求作废上一次
      controller = new AbortController();
      status.value = 'pending';
      try {
        const res = await fetch(
          `/api/users?page=${query.page ?? 1}&q=${query.keyword ?? ''}`,
          { signal: controller.signal },
        );
        if (!res.ok) throw new Error('请求失败');
        const body = await res.json();
        if (current !== runId) return; // 过期响应不落地
        data.value = { list: body.records, page: body.page, size: body.size, total: body.total };
        status.value = 'success';
      } catch (err) {
        if (current !== runId) return;
        error.value = err;
        message.value = err instanceof Error ? err.message : String(err);
        status.value = 'error'; // 失败写状态，不向上抛
      }
    },
    abort() {
      runId += 1;
      controller?.abort();
    },
  };
  return resource;
};
```

**失败判定**：`execute` 不得 reject——捕获异常后写入 `status = 'error'` 与 `error / message`，组件据此渲染错误态与重试按钮。`data` 写数组 → 普通列表；写 `{ list, page, size, total }` → 分页；写其他值 → 单值。

### 组件自动注入的查询片段

| 组件                                                        | `query` 片段                                                  | 返回形态                 |
| ----------------------------------------------------------- | ------------------------------------------------------------- | ------------------------ |
| Table                                                       | `pagination` / `sorter` / `filters`                           | 数组或 `{ list, page, size, total }` |
| Select                                                      | `keyword`（300ms 防抖）+ `pagination`（触底加载下一页并累积） | 数组或 `{ list, page, size, total }` |
| AutoComplete / Mention                                      | `keyword`（300ms 防抖）                                       | 数组                     |
| Transfer                                                    | `keyword`（300ms 防抖）                                       | 数组                     |
| Tree / TreeSelect / Cascader                                | `filters.parentKey`（懒加载子级）                             | 数组                     |
| VirtualList                                                 | `pagination`（触底加载下一页并累积）                          | 数组或 `{ list, page, size, total }` |
| Calendar                                                    | `filters.range: [首日, 末日]`（切月重取）                     | 数组                     |
| Statistic                                                   | `filters`                                                     | 单值                     |
| Descriptions / Timeline / Tabs / Collapse / Carousel / Menu | `filters`                                                     | 数组                     |

### 使用示例

分页表格——翻页、排序、筛选自动重取：

<CodeCard v-model:code="tableFetchCode" :default-expand="true" editable title="分页表格">
  <LiveDemo :code="tableFetchCode" />
</CodeCard>

远程搜索下拉——输入关键词自动重取（300ms 防抖）：

<CodeCard v-model:code="selectFetchCode" :default-expand="true" editable title="远程搜索下拉">
  <LiveDemo :code="selectFetchCode" />
</CodeCard>

懒加载树——展开节点时以 `query.filters.parentKey` 请求子级：

<CodeCard v-model:code="treeFetchCode" :default-expand="true" editable title="懒加载树">
  <LiveDemo :code="treeFetchCode" />
</CodeCard>

### 工作原理

```text
开发者绑定 fetch 资源工厂
        │
        ▼
组件内部统一资源机制（所有 fetch 型组件共用同一组合函数）
  · 挂载调工厂建资源对象并执行首次 execute；交互变化只调 execute
  · 自动注入统一查询参数（分页、筛选、关键词、排序）
  · 关键词防抖、旧数据保留（stale）；卸载 / 源切换调 abort
        │
        ▼
资源对象内部（实现归开发者）
  · 状态机：status / data / error / message 四个 MaybeRefOrGetter 字段
  · 竞态以后到为准、AbortController 取消，全部在闭包内完成
        │
        ▼
四态自动渲染：加载骨架 · 错误 + 重试 · 空态 · 正常数据
```

理解了这个流程之后，有几个设计要点值得留意。

首先，开发者只需要绑定工厂本身。不需要写 `watch` 去监听分页变化，不需要手动维护一个 `loading` 变量，也不需要自己拼接分页参数——`<Table :fetch="fetchUsers" />` 这样一行就已经是一个完整可用的分页表格；需要自己实现的只有资源对象内部的请求与取消。

其次，组件不内置任何 HTTP 客户端，也不提供资源基类或标准助手。URL 的拼接、鉴权 token 的注入、响应包的解包、`AbortController` 的组织都在宿主侧完成，库本身不对后端协议做任何假设，因此可以接入任意后端；资源池 `useResources` 内部的 `list` 工厂也是同一协议的一份私有实现，没有任何特殊地位。

第三，`data` 的形态决定了组件的行为。写入数组时，组件把它当作普通列表渲染；写入 `{ list, page, size, total }` 时，组件会自动识别为分页数据，提取列表与总数，并按响应中的 `page / size` 校正分页条的显示。

第四，取消能力的边界很清晰：库不向 query 注入 `signal`，`abort()` 是零参方法，组件只会在源切换与卸载时调用它；取消到底意味着 abort 一个 fetch、关闭一个 WebSocket 还是忽略后续分片，完全由资源对象的实现决定。

最后，本地数据和远程数据的用法是等价的。不传 `fetch`、直接传入本地数据时，组件就是一个普通的静态组件；传入 `fetch` 后，组件会自动获得骨架屏、错误重试、空态等渲染能力，从本地用法迁移到远程用法几乎没有成本。

### 类型定义

```ts
/** 组件自动注入的分页参数，页码从 1 开始；字段接受裸值、Ref 或 getter */
export interface FetchQueryPagination {
  page: MaybeRefOrGetter<number>;
  size: MaybeRefOrGetter<number>;
}

/** 统一查询参数：直接继承分页参数，字段接受裸值、Ref 或 getter；不含 signal */
export interface FetchQuery<TFilters = Record<string, unknown>> extends Partial<FetchQueryPagination> {
  keyword?: MaybeRefOrGetter<string | undefined>;
  sorter?: MaybeRefOrGetter<{ key: string; order: 'asc' | 'desc' | null } | undefined>;
  filters?: MaybeRefOrGetter<TFilters | undefined>;
}

/** execute 消费的纯值快照：由 resolveFetchQuery 解包得到 */
export interface ResolvedFetchQuery<TFilters = Record<string, unknown>>
  extends Partial<ResolvedFetchQueryPagination> {
  keyword?: string;
  sorter?: { key: string; order: 'asc' | 'desc' | null };
  filters?: TFilters;
}

/** 分页展示信息：响应归一后的页码 / 页大小 / 总数 */
export interface FetchResponsePagination {
  page: number;
  size: number;
  total: number;
}

/** 分页结果：继承 FetchResponsePagination，data 写入此形态时组件启用分页 */
export interface PagedResult<T> extends FetchResponsePagination {
  list: T[];
}

/** data 字段允许的三种载荷 */
export type FetchData<T> = T[] | PagedResult<T> | T;

/** 资源对象：自带响应式信封与执行 / 取消方法；字段接受裸值、Ref 或 getter */
export interface FetchResult<T> {
  status: MaybeRefOrGetter<Status>;
  data: MaybeRefOrGetter<FetchData<T> | undefined>;
  error: MaybeRefOrGetter<unknown>;
  message: MaybeRefOrGetter<string | undefined>;
  execute: (query?: ResolvedFetchQuery) => void | Promise<void>;
  abort: () => void;
}

/**
 * 所有 fetch 属性的统一工厂类型。
 * T 为数据项类型：列表组件的 data 取 T[] 或 PagedResult<T>，单值组件取 T。
 */
export type FetchHandler<T, TFilters = Record<string, unknown>> = (
  query: FetchQuery<TFilters>,
) => FetchResult<T> | Promise<FetchResult<T>>;
```

---

## action：交互动作

`action` 属性面向所有需要用户交互才能触发的操作。它的用法很直接：给组件绑定一个返回 Promise 的函数，组件会在动作执行期间自动进入 loading 和禁用状态，执行结束后根据结果决定是成功收尾还是回退并提示错误。这样一来，按钮点击后的转圈、表单提交时的防重复提交、选择器变更失败后的回退，都不需要开发者手动处理。

### 协议

```ts
/** 动作结果：AsyncResult 的窄化形态，只表达成功/失败 */
export type ActionResult = AsyncResult<never, 'success' | 'error'>;

export type ActionHandler = (...args: any[]) => Promise<ActionResult | void> | ActionResult | void;
```

**失败判定**：action `reject`，或 resolve 出 `status: 'error'` / 携带 `error` 字段的对象，均视为失败；其余视为成功。

**错误文案归一**：按 `message` → `error` 字符串 → `Error.message` → 回退文案（各组件 `errorText` prop）取值。

### 两类动作语义

| 语义       | 组件                                                                                                                  | 执行中                   | 失败                                           | 成功                                                                                          |
| ---------- | --------------------------------------------------------------------------------------------------------------------- | ------------------------ | ---------------------------------------------- | --------------------------------------------------------------------------------------------- |
| **确认型** | Button、Form、Popconfirm、Upload、Dialog、Drawer、Tour、TimePicker                                                    | 按钮/入口 loading 并禁用 | 容器内展示错误提示条，保持打开/停留当前步骤    | emit `confirm` / `success`，Dialog 与 Drawer 自动关闭、Tour 进入下一步、TimePicker 提交并关闭 |
| **切换型** | Select、DatePicker、ColorPicker、Transfer、Rate、Segmented、Tabs、Checkbox、Radio、RadioGroup、Slider、Cascader、Tree | 禁用新的值变更           | **乐观回退**：值恢复为旧值，emit `actionError` | 新值生效                                                                                      |

确认型组件的容器内部预留了错误提示条的位置，失败时会直接在容器内展示。切换型组件（比如 Rate、Slider 这类即时变更的控件）本身没有合适的位置内嵌错误条，因此错误会通过 `@action-error` 事件抛给外部处理，同时组件内部已经自动把值回退到了操作前的状态，数据一致性由组件保证。

### 使用示例

#### 确认型：Dialog 异步确认

动作失败时对话框保持打开并展示错误条；成功后自动关闭。

<CodeCard v-model:code="dialogCode" :default-expand="true" editable title="Dialog 异步确认">
  <LiveDemo :code="dialogCode" />
</CodeCard>

#### 确认型：Popconfirm 与 Button

Popconfirm 确认按钮自动 loading，失败后气泡保持打开；Button 动作期间自动 loading 并禁用。

<CodeCard v-model:code="buttonCode" :default-expand="true" editable title="Button 与 Popconfirm">
  <LiveDemo :code="buttonCode" />
</CodeCard>

#### 切换型：Select 乐观更新

选择后立即显示新值，动作失败自动回退旧值并触发 `action-error`。

<CodeCard v-model:code="selectCode" :default-expand="true" editable title="Select 乐观更新">
  <LiveDemo :code="selectCode" />
</CodeCard>

### 工作原理

```text
用户触发交互
    │
    ▼
组件进入 loading / 禁用态
    │
    ├─ 确认型：等待结果，失败展示错误条
    └─ 切换型：先乐观更新 UI，失败自动回退旧值
    │
    ▼
成功 → emit 事件 / 关闭容器 / 新值生效
失败 → 错误提示 + 重试入口（确认型）或 action-error 事件（切换型）
```

### 交互组件清单

| 组件        | 动作时机                 | 执行中                     | 失败行为                        | 成功行为                  |
| ----------- | ------------------------ | -------------------------- | ------------------------------- | ------------------------- |
| Button      | 点击                     | loading + disabled         | emit `action-error`             | emit `click` 正常派发     |
| Form        | 提交                     | 提交按钮 loading           | 表单保持当前值，emit 错误       | emit `submit-success`     |
| Popconfirm  | 点击确认                 | 确认按钮 loading，气泡保持 | emit `action-error`             | 关闭气泡并 emit `confirm` |
| Upload      | 上传                     | 条目 loading               | 条目标记 error 状态             | 条目标记 success          |
| Dialog      | 点击确认（默认底部按钮） | 确认按钮 loading           | 错误提示条，保持打开            | emit `confirm` 并关闭     |
| Drawer      | 点击确认（默认底部按钮） | 确认按钮 loading           | 错误提示条，保持打开            | emit `confirm` 并关闭     |
| Tour        | 下一步 / 完成            | 推进按钮 loading           | 错误提示条，停留当前步骤        | 进入下一步或完成          |
| TimePicker  | 点击确定                 | 确定按钮 loading           | 错误提示条，面板保持            | 提交时间并关闭            |
| Select      | 选中选项                 | 禁用选择                   | 值回退，emit `action-error`     | 新值生效                  |
| DatePicker  | 选择日期                 | 禁用选择                   | 值回退，emit `action-error`     | 新值生效                  |
| ColorPicker | 确认颜色                 | 禁用选择                   | 值回退，emit `action-error`     | 新值生效                  |
| Transfer    | 穿梭                     | 禁用穿梭                   | 值回退，emit `action-error`     | 新值生效                  |
| Rate        | 评分                     | 禁用评分                   | 值回退，emit `action-error`     | 新值生效                  |
| Segmented   | 切换分段                 | 禁用切换                   | 值回退，emit `action-error`     | 新值生效                  |
| Tabs        | 切换面板                 | 禁用切换                   | 停留原面板，emit `action-error` | 切换到目标面板            |
| Checkbox    | 勾选                     | 禁用勾选                   | 值回退，emit `action-error`     | 新值生效                  |
| RadioGroup  | 组内选择                 | 禁用选择                   | 值回退，emit `action-error`     | 新值生效                  |
| Slider      | 拖动结束                 | 禁用拖动                   | 值回退，emit `action-error`     | 新值生效                  |
| Cascader    | 选择节点                 | 禁用选择                   | 值回退，emit `action-error`     | 新值生效                  |
| Tree        | 勾选节点                 | 禁用勾选                   | 勾选回退，emit `action-error`   | 新勾选生效                |

> 说明：Tabs 属于确认型切换（先确认再切换）；Cascader 的失败回退只回退选中值，面板展开状态不受影响；ColorPicker 的拖拽调色为连续预览不触发 action，确认点（选预设色、输入 Hex、关闭面板）才提交动作。

---

## subscribe：数据订阅

`subscribe` 属性面向数据展示组件，用来消费那些「一次性订阅、持续接收」的数据流。给组件绑定一个返回 Promise 的处理方法后，这个方法只会在组件挂载时被调用一次；如果方法返回的 `data` 是一个响应式对象，那么之后数据源对这个对象的任何修改，都会自动反映到视图上——非常适合 WebSocket 推送、实时数据这类场景。

### 协议

```ts
/** 订阅结果：AsyncResult 承载数据后的形态 */
export type SubscribeResult<T> = AsyncResult<T>;

export type SubscribeHandler<T> = () => Promise<SubscribeResult<T>> | SubscribeResult<T>;
```

**失败判定**：处理方法 `reject`，或 resolve 出 `status: 'error'` / 携带 `error` 字段，均视为失败；`status: 'pending'` 保持加载态；其余视为成功并渲染 `data`。

**失败策略**：订阅失败时组件保留旧数据（若有），展示错误提示条，支持 `refresh` 重试，与 fetch 失败策略一致。

### 响应式数据：持续更新

处理方法只会在挂载时被调用一次，但如果它返回的 `data` 是一个响应式对象（比如用 `reactive` 包裹的数组或对象），组件在渲染时会自动对它建立响应式依赖。这样一来，之后订阅源（WebSocket、EventEmitter、定时器等）对这个对象的任何修改，都会直接触发视图更新，不需要再次调用处理方法。下面用定时器模拟服务端推送，展示响应式数据如何驱动视图持续更新：

<CodeCard v-model:code="reactiveSubscribeCode" :default-expand="true" editable title="响应式数据持续更新">
  <LiveDemo :code="reactiveSubscribeCode" />
</CodeCard>

这也是 subscribe 和 fetch 最本质的区别。fetch 的模型是「一次交互对应一次请求、一次新数据」，每次翻页或搜索都会重新拉取并替换数据；而 subscribe 的数据在 resolve 之后还可以持续生长，订阅源每推一条新数据，视图就更新一次。需要注意的是，订阅源（WebSocket 连接、定时器等）的生命周期要由开发者自己管理，记得在组件卸载时通过 `onUnmounted` 关闭连接，避免内存泄漏。

### 与 fetch 的边界

| 机制        | 语义     | 数据流                                                  | 适用场景                                                        |
| ----------- | -------- | ------------------------------------------------------- | --------------------------------------------------------------- |
| `fetch`     | 主动请求 | 组件构造 query → 拉取 → 渲染                            | 分页 / 搜索 / 排序的查询型数据                                  |
| `subscribe` | 被动订阅 | resolve 数据 → 渲染；数据为响应式对象时推送持续更新视图 | 实时数据、订阅型数据源（WebSocket、EventEmitter、响应式 store） |

### 使用示例

#### 订阅型数据源：Statistic

`subscribe` 处理方法内部完成订阅，resolve 后渲染数值，失败展示错误条。

<CodeCard v-model:code="statisticCode" :default-expand="true" editable title="Statistic 订阅实时数据">
  <LiveDemo :code="statisticCode" />
</CodeCard>

#### 订阅推送：Table 实时订单

返回响应式数组后，订阅源的每次推送都会自动更新表格。

<CodeCard v-model:code="tableCode" :default-expand="true" editable title="Table 订阅推送">
  <LiveDemo :code="tableCode" />
</CodeCard>

### 数据展示组件清单

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

---

## 统一工作原理

三个属性虽然面向不同的场景，但底层其实是同一套机制在运转，这也是「状态自持」能够成立的基础。下表列出了这套机制在各个环节上的统一行为：

| 环节       | 统一行为                                                                 |
| ---------- | ------------------------------------------------------------------------ |
| **四态渲染** | 所有组件统一渲染 `pending`（骨架/加载）、`success`（数据）、`error`（错误+重试）、`empty`（空态） |
| **请求时机** | fetch 挂载即请求 + 交互重取；action 用户触发；subscribe 挂载一次        |
| **竞态处理** | 快速连续操作时以后到为准，过期响应不覆盖数据；fetch 的竞态保护与 `abort()` 取消由资源对象内部实现 |
| **刷新策略** | 已有数据时保留旧数据，视图按 `status` + `data` 判断是否闪骨架；失败后重试以最近查询再调一次 `execute`   |
| **错误归一** | 错误对象统一提取 `message`，文案走既有 messages 配置，资源层不内置 i18n  |
| **结果识别** | fetch：数组 → 列表，`{ list, page, size, total }` → 分页；subscribe：响应式数据持续更新；action：`status` 判定成败 |

### 状态优先级

同一个组件允许同时绑定多个属性，此时数据的优先级为 **subscribe > fetch > 本地 props**。也就是说，如果同时传了 subscribe 和 fetch，组件会优先使用 subscribe 返回的数据；如果两者都没传，才会回退到本地传入的 props。这样设计的原因是：subscribe 适合持续推送或外部驱动的数据流，fetch 适合组件主动发起的请求，而本地 props 只是最基础的兜底——不传 fetch 和 subscribe 时，组件就是一个普通的本地组件。

### 组合函数

三个协议的处理方法本身就是完整的状态载体：返回值统一携带 `status` / `data` / `error` / `message`，组件拿到结果后自行决定渲染行为，不依赖任何外部注入的响应式状态。宿主侧的处理方法与库内实现行为完全一致：

- fetch 协议无需库内助手，直接手写一个 `FetchHandler` 资源工厂即可：工厂闭包内持有四个 `MaybeRefOrGetter` 状态字段与私有竞态 / 取消逻辑，返回带 `execute / abort` 的资源对象，可直接绑给组件的 `fetch` 属性；库只定义接口，不提供标准实现。
- subscribe 协议同样无需库内助手，直接手写一个 `SubscribeHandler` 即可：返回 `{ status, data }` 结果对象，`data` 支持 ref / getter / 响应式对象，失败可 `reject` 或返回 error 结果；库只定义接口。
- `useActionState(action, options)` 用于确认型动作，维护 `pending / disabled / error`，并支持 `onSuccess / onError / onFinally` 回调。
- `useActionValue()` 用于切换型的乐观更新，通过 `commit({ execute, revert })` 提交动作，失败时自动回退。

如果需要在组件之外把任意异步方法维护成响应式状态（页头统计、面包屑等），使用通用原语 `useAsyncState`：它把异步结果投影为 `Snapshot` 四态并提供重试。组件内部的资源机制（`useFetchResource` / `useSubscribeResource`）与它共享同一套状态词汇，但属于组件作者的内部接口，宿主侧无需接触。

## 边界

最后说明一下这套机制有意不做的事情，方便判断它的适用范围。

组件库不提供 HTTP 客户端，也不规定响应包的格式——请求怎么发、响应怎么解包，都交给宿主侧处理。同样，缓存池、轮询这类策略也不在组件的职责范围内，需要的话可以在组合函数之上自行叠加。

查询参数是组件向宿主的单向注入：组件根据交互产生 `pagination`、`keyword` 等参数传给 fetch 方法，但不会反向修改宿主的状态。至于组件自身的 `v-model`（比如选中值、展开节点），仍然保持纯同步的行为，不会触发请求语义之外的副作用。

错误对象的类型是 `unknown`，建议宿主侧统一提取出 `message` 字段供错误态展示。

另外，如果服务端已经有 Swagger / OpenAPI 文档，其实不必逐个手写 fetch 方法——资源池 [useResources](/composables/resources) 可以从文档一次性生成全部请求方法以及 `columns` / `filters` / `properties` 等字段元数据，生成的方法签名和上面介绍的协议完全一致，直接绑定即可。

<script setup lang="ts">
import { ref } from 'vue';

// ============ fetch demos ============

const tableFetchCode = ref(`
<script setup lang="ts">
import { ref } from 'vue';

const columns = [
  { key: 'name', title: '姓名' },
  { key: 'email', title: '邮箱' },
  { key: 'role', title: '角色' },
];

const allUsers = Array.from({ length: 47 }, (_, i) => ({
  id: i + 1,
  name: \`示例\${String(i + 1).padStart(2, '0')}\`,
  email: \`demo-\${i + 1}@mock.test\`,
  role: (['前端', '后端', '设计', '产品'])[i % 4],
}));

// 资源工厂：挂载时创建一次，翻页由组件调用 execute 驱动
const fetchUsers = () => {
  const status = ref('idle');
  const data = ref();
  const error = ref();
  const message = ref();
  return {
    status,
    data,
    error,
    message,
    async execute(query) {
      status.value = 'pending';
      await new Promise((resolve) => setTimeout(resolve, 500));
      const page = query.page ?? 1;
      const size = query.size ?? 10;
      data.value = {
        list: allUsers.slice((page - 1) * size, page * size),
        page,
        size,
        total: allUsers.length,
      };
      status.value = 'success';
    },
    abort() {},
  };
};
<\/script>

<template>
  <Table :columns="columns" :fetch="fetchUsers" pagination :size="10" />
</template>
`);

const selectFetchCode = ref(`
<script setup lang="ts">
import { ref } from 'vue';

const userId = ref('');

const options = Array.from({ length: 20 }, (_, i) => ({
  value: \`user-\${i + 1}\`,
  label: \`示例\${String(i + 1).padStart(2, '0')}\`,
}));

// 关键词变化时组件调用 execute，资源对象始终是同一个
const searchUsers = () => {
  const status = ref('idle');
  const data = ref([]);
  const error = ref();
  const message = ref();
  return {
    status,
    data,
    error,
    message,
    async execute(query) {
      status.value = 'pending';
      await new Promise((resolve) => setTimeout(resolve, 300));
      const keyword = query.keyword ?? '';
      data.value = keyword ? options.filter((o) => o.label.includes(keyword)) : options;
      status.value = 'success';
    },
    abort() {},
  };
};
<\/script>

<template>
  <div class="flex items-center gap-3">
    <Select v-model="userId" :fetch="searchUsers" filterable placeholder="搜索用户" class="w-64" />
    <span class="text-sm text-cumquat-text-muted">已选：{{ userId ?? '无' }}</span>
  </div>
</template>
`);

const treeFetchCode = ref(`
<script setup lang="ts">
import { ref } from 'vue';

const nodes = {
  root: [
    { key: 'fe', label: '前端' },
    { key: 'be', label: '后端' },
    { key: 'ds', label: '设计' },
  ],
  fe: [
    { key: 'fe-1', label: '示例甲', leaf: true },
    { key: 'fe-2', label: '示例乙', leaf: true },
    { key: 'fe-3', label: '示例丙', leaf: true },
  ],
  be: [
    { key: 'be-1', label: '示例丁', leaf: true },
    { key: 'be-2', label: '示例戊', leaf: true },
  ],
  ds: [
    { key: 'ds-1', label: '示例己', leaf: true },
  ],
};

// 懒加载：展开节点时组件以 filters.parentKey 再调一次 execute
const fetchOrg = () => {
  const status = ref('idle');
  const data = ref([]);
  const error = ref();
  const message = ref();
  return {
    status,
    data,
    error,
    message,
    async execute(query) {
      status.value = 'pending';
      await new Promise((resolve) => setTimeout(resolve, 400));
      const parentKey = query.filters?.parentKey ?? 'root';
      data.value = nodes[parentKey] ?? [];
      status.value = 'success';
    },
    abort() {},
  };
};
<\/script>

<template>
  <Tree :fetch="fetchOrg" />
</template>
`);

// ============ action demos ============

const dialogCode = ref(`
<script setup lang="ts">
import { ref } from 'vue';

const open = ref(false);
const lastError = ref('');

const confirmAction = async () => {
  await new Promise((resolve) => setTimeout(resolve, 600));
  if (Math.random() < 0.5) {
    return { status: 'error', error: '服务器繁忙，请稍后重试' };
  }
};

const onError = (err) => {
  lastError.value = typeof err === 'string' ? err : err?.message ?? '操作失败';
};
<\/script>

<template>
  <div class="flex flex-col gap-3">
    <Button type="primary" @click="open = true">打开对话框</Button>
    <Dialog v-model:open="open" title="异步确认" :action="confirmAction" @action-error="onError">
      <p class="text-sm text-cumquat-text-muted">确认动作将调用一个会随机失败的函数，观察失败时的错误条与按钮状态。</p>
    </Dialog>
    <p v-if="lastError" class="text-xs text-cumquat-danger">最近一次错误：{{ lastError }}</p>
  </div>
</template>
`);

const buttonCode = ref(`
<script setup lang="ts">
const save = async () => {
  await new Promise((resolve) => setTimeout(resolve, 800));
};

const remove = async () => {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return { status: 'error', error: '存在关联数据，无法删除' };
};
<\/script>

<template>
  <div class="flex flex-wrap items-center gap-3">
    <Button type="primary" :action="save">保存配置</Button>
    <Popconfirm text="确认删除这条记录吗？" :action="remove">
      <Button type="danger">删除</Button>
    </Popconfirm>
  </div>
</template>
`);

const selectCode = ref(`
<script setup lang="ts">
import { ref } from 'vue';

const value = ref('apple');
const error = ref('');

const options = [
  { value: 'apple', label: '苹果' },
  { value: 'banana', label: '香蕉' },
  { value: 'cherry', label: '樱桃' },
];

const persist = async (val) => {
  await new Promise((resolve) => setTimeout(resolve, 600));
  if (val === 'cherry') {
    return { status: 'error', error: '樱桃库存不足' };
  }
};

const onError = (err) => {
  error.value = typeof err === 'string' ? err : err?.message ?? '操作失败';
};
<\/script>

<template>
  <div class="flex flex-col gap-2">
    <div class="flex items-center gap-3">
      <Select v-model="value" :options="options" :action="persist" class="w-56" @action-error="onError" />
      <span class="text-sm text-cumquat-text-muted">已选：{{ value ?? '无' }}</span>
    </div>
    <p v-if="error" class="text-xs text-cumquat-danger">{{ error }}</p>
  </div>
</template>
`);

// ============ subscribe demos ============

const statisticCode = ref(`
<script setup lang="ts">
const loadOnline = async () => {
  await new Promise((resolve) => setTimeout(resolve, 600));
  if (Math.random() < 0.3) {
    return { status: 'error', error: '数据源连接失败' };
  }
  return { status: 'success', data: 1280 };
};
<\/script>

<template>
  <Statistic title="实时在线人数" :subscribe="loadOnline" suffix="人" />
</template>
`);

const tableCode = ref(`
<script setup lang="ts">
import { reactive } from 'vue';

const orderColumns = [
  { key: 'id', title: '订单号' },
  { key: 'amount', title: '金额', align: 'right' },
];

let orderSeq = 2;

const subscribeOrders = async () => {
  await new Promise((resolve) => setTimeout(resolve, 500));
  const list = reactive([
    { id: 'A-001', amount: 128 },
    { id: 'A-002', amount: 256 },
  ]);
  const timer = setInterval(() => {
    orderSeq += 1;
    list.push({ id: \`A-00\${orderSeq}\`, amount: Math.floor(Math.random() * 900 + 100) });
    if (orderSeq >= 8) clearInterval(timer);
  }, 1000);
  return { data: list };
};
<\/script>

<template>
  <Table :columns="orderColumns" :subscribe="subscribeOrders" />
</template>
`);

const reactiveSubscribeCode = ref(`
<script setup lang="ts">
import { ref } from 'vue';

let counterSeq = 0;

const subscribeCounter = async () => {
  const data = ref(1000);
  const timer = setInterval(() => {
    counterSeq += 1;
    data.value += Math.floor(Math.random() * 50) + 10;
    if (counterSeq >= 10) clearInterval(timer);
  }, 1000);
  return { data };
};
<\/script>

<template>
  <div class="flex flex-col gap-3">
    <p class="text-sm text-cumquat-text-muted">数值每秒递增，模拟服务端持续推送，无需重新调用 subscribe 方法</p>
    <Statistic title="累计访问量" :subscribe="subscribeCounter" />
  </div>
</template>
`);
</script>
